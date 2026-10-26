<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        foreach (['games' => 'Juegos', 'productivity' => 'Productividad', 'education' => 'Educación', 'entertainment' => 'Entretenimiento', 'utilities' => 'Utilidades'] as $slug => $name) {
            Category::query()->firstOrCreate(['slug' => $slug], ['name' => $name, 'is_active' => true]);
        }
    }
}
