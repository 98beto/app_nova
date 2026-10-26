<?php

namespace Database\Factories;

use App\Models\Application;
use App\Models\Category;
use App\Models\DeveloperProfile;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Application>
 */
class ApplicationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'developer_id' => DeveloperProfile::factory(),
            'category_id' => Category::factory(),
            'name' => fake()->words(3, true),
            'slug' => (string) Str::uuid(),
            'description' => fake()->paragraph(),
            'icon_path' => 'applications/icons/example.png',
            'minimum_age' => 0,
            'price' => '0.00',
            'status' => 'draft',
            'published_at' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (): array => ['status' => 'approved', 'published_at' => now()])
            ->afterCreating(function (Application $application): void {
                foreach (range(1, 4) as $position) {
                    $application->screenshots()->create(['image_path' => "applications/screenshots/example-{$position}.png", 'position' => $position]);
                }
            });
    }
}
