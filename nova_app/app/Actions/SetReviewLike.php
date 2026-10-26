<?php

namespace App\Actions;

use App\Models\Application;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SetReviewLike
{
    public function __invoke(User $user, Review $review, bool $liked): void
    {
        DB::transaction(function () use ($user, $review, $liked): void {
            $review = Review::query()->whereKey($review->id)->lockForUpdate()->firstOrFail();
            Application::query()->visible()->whereKey($review->application_id)->firstOrFail();
            abort_if($review->user_id === $user->id, 403, 'No puedes dar me gusta a tu propia reseña.');
            if ($liked) {
                if (! $review->likes()->where('users.id', $user->id)->exists()) {
                    $review->likes()->attach($user->id, ['created_at' => now()]);
                }
            } else {
                $review->likes()->detach($user->id);
            }
        });
    }
}
