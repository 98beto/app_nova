<?php

namespace App\Actions;

use App\Models\Application;
use App\Models\Download;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SaveReview
{
    /** @param array{rating: int, body?: string|null} $data */
    public function __invoke(User $user, Application $application, array $data): Review
    {
        return DB::transaction(function () use ($user, $application, $data): Review {
            Application::query()->visible()->whereKey($application->id)->firstOrFail();
            abort_unless(Download::query()->where('user_id', $user->id)->where('application_id', $application->id)->lockForUpdate()->first() !== null, 403, 'Debes instalar la aplicación antes de reseñarla.');

            return Review::query()->updateOrCreate(
                ['user_id' => $user->id, 'application_id' => $application->id],
                ['rating' => $data['rating'], 'body' => $data['body'] ?? null],
            );
        });
    }
}
