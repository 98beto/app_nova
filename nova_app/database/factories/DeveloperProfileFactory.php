<?php

namespace Database\Factories;

use App\Enums\DeveloperPaymentStatus;
use App\Models\DeveloperProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DeveloperProfile>
 */
class DeveloperProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => 'developer']),
            'company_name' => fake()->company(),
            'payment_status' => DeveloperPaymentStatus::Pending,
            'activated_at' => null,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => DeveloperPaymentStatus::Paid,
            'activated_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => DeveloperPaymentStatus::Failed,
            'activated_at' => null,
        ]);
    }

    public function refunded(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => DeveloperPaymentStatus::Refunded,
            'activated_at' => now(),
        ]);
    }
}
