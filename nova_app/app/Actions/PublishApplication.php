<?php

namespace App\Actions;

use App\Enums\UserRole;
use App\Models\Application;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class PublishApplication
{
    /** @param array{name: string, description: string, category_id: int, minimum_age: int, price: numeric-string, icon: UploadedFile, screenshots: array<UploadedFile>} $data */
    public function __invoke(User $user, array $data): Application
    {
        abort_unless($user->role === UserRole::Developer && $user->developerProfile !== null, 403);
        $paths = [];
        try {
            $paths[] = $icon = $data['icon']->store('applications/icons', 'public');
            foreach ($data['screenshots'] as $image) {
                $paths[] = $image->store('applications/screenshots', 'public');
            }
            abort_if(in_array(false, $paths, true), 500, 'No se pudieron guardar las imágenes.');

            return DB::transaction(function () use ($user, $data, $paths, $icon): Application {
                DB::afterRollBack(fn () => Storage::disk('public')->delete($paths));
                Category::query()->whereKey($data['category_id'])->where('is_active', true)->lockForUpdate()->firstOrFail();
                $application = Application::query()->create([
                    'developer_id' => $user->developerProfile->id,
                    'category_id' => $data['category_id'],
                    'name' => $data['name'],
                    'slug' => Str::slug(Str::limit($data['name'], 180, '')).'-'.Str::uuid(),
                    'description' => $data['description'],
                    'minimum_age' => $data['minimum_age'],
                    'price' => $data['price'],
                    'icon_path' => $icon,
                    'status' => 'approved',
                    'published_at' => now(),
                ]);
                foreach (array_slice($paths, 1) as $index => $path) {
                    $application->screenshots()->create(['image_path' => $path, 'position' => $index + 1]);
                }

                return $application;
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete(array_values(array_filter($paths)));
            throw $exception;
        }
    }
}
