<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $name = config('admin.name');
        $email = config('admin.email');
        $password = config('admin.password');

        $identityValidator = Validator::make(
            ['name' => $name, 'email' => $email],
            ['name' => ['required', 'string', 'max:255'], 'email' => ['required', 'string', 'email', 'max:255']],
        );

        if ($identityValidator->fails()) {
            $this->command->warn('Admin user was not seeded because ADMIN_NAME or ADMIN_EMAIL is missing or invalid.');

            return;
        }

        /** @var array{name: string, email: string} $identity */
        $identity = $identityValidator->validated();
        $admin = User::query()->where('email', $identity['email'])->first();

        if ($admin === null) {
            $passwordValidator = Validator::make(
                ['password' => $password],
                ['password' => ['required', 'string', Password::min(12)->letters()->mixedCase()->numbers()->symbols()]],
            );

            if ($passwordValidator->fails()) {
                $this->command->warn('Admin user was not seeded because ADMIN_PASSWORD must contain at least 12 characters, mixed-case letters, numbers, and symbols.');

                return;
            }

            /** @var array{password: string} $validatedPassword */
            $validatedPassword = $passwordValidator->validated();

            $admin = User::query()->createOrFirst(
                ['email' => $identity['email']],
                [
                    'name' => $identity['name'],
                    'password' => $validatedPassword['password'],
                    'gender' => 'prefer_not_to_say',
                    'birth_date' => now()->subYears(18)->toDateString(),
                    'role' => UserRole::Admin,
                    'status' => UserStatus::Active,
                ],
            );
        }

        if ($admin->role !== UserRole::Admin) {
            $this->command->warn('Admin user was not seeded because ADMIN_EMAIL belongs to a non-admin user.');
        }
    }
}
