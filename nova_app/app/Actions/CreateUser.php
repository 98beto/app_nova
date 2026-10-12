<?php

namespace App\Actions;

use App\Enums\DeveloperPaymentStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class CreateUser
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function __invoke(array $data): User
    {
        $avatarPath = null;

        if (($data['avatar'] ?? null) instanceof UploadedFile) {
            $storedPath = $data['avatar']->store('avatars', 'public');

            if ($storedPath === false) {
                throw new RuntimeException('No se pudo guardar el avatar.');
            }

            $avatarPath = $storedPath;
        }

        try {
            return DB::transaction(function () use ($data, $avatarPath): User {
                $role = UserRole::from((string) $data['role']);

                $user = User::query()->create([
                    ...Arr::only($data, ['name', 'email', 'password', 'gender', 'birth_date']),
                    'avatar_path' => $avatarPath,
                    'role' => $role,
                    'status' => UserStatus::Active,
                ]);

                if ($role === UserRole::Developer) {
                    $user->developerProfile()->create([
                        'company_name' => data_get($data, 'company_name'),
                        'payment_status' => DeveloperPaymentStatus::Pending,
                    ]);
                }

                return $user->load('developerProfile');
            });
        } catch (Throwable $exception) {
            if ($avatarPath !== null) {
                Storage::disk('public')->delete($avatarPath);
            }

            throw $exception;
        }
    }
}
