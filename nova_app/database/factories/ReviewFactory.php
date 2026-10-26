<?php

namespace Database\Factories;

use App\Models\Application;
use App\Models\Download;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'application_id' => Application::factory()->published(),
            'rating' => 4,
            'body' => fake()->sentence(),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Review $review): void {
            Download::query()->firstOrCreate(['user_id' => $review->user_id, 'application_id' => $review->application_id], ['downloaded_at' => now()]);
        });
    }
}
