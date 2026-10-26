<?php

namespace App\Actions;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class UpdateProfile
{
    /** @param array{name?: string, email?: string, gender?: string, birth_date?: string, company_name?: string, avatar?: UploadedFile} $data */
    public function __invoke(User $user, array $data): void
    {
        $newPath = isset($data['avatar']) ? $data['avatar']->store('avatars', 'public') : null;
        abort_if($newPath === false, 500, 'No se pudo guardar el avatar.');
        try {
            $oldPath = DB::transaction(function () use ($user, $data, $newPath): ?string {
                if ($newPath !== null) {
                    DB::afterRollBack(fn () => Storage::disk('public')->delete($newPath));
                }
                $currentUser = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
                $oldPath = $currentUser->avatar_path;
                $currentUser->fill(Arr::only($data, ['name', 'email', 'gender', 'birth_date']));
                if ($currentUser->isDirty('email')) {
                    $currentUser->email_verified_at = null;
                }
                if ($newPath !== null) {
                    $currentUser->avatar_path = $newPath;
                }
                $currentUser->save();
                if (isset($data['company_name'])) {
                    $currentUser->developerProfile()->update(['company_name' => $data['company_name']]);
                }

                return $newPath !== null && $newPath !== $oldPath ? $oldPath : null;
            });
        } catch (Throwable $exception) {
            if ($newPath !== null) {
                Storage::disk('public')->delete($newPath);
            }
            throw $exception;
        }
        if ($oldPath !== null) {
            DB::afterCommit(fn () => Storage::disk('public')->delete($oldPath));
        }
        $user->refresh();
    }
}
