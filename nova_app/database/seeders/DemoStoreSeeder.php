<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Application;
use App\Models\Category;
use App\Models\DeveloperProfile;
use App\Models\Download;
use App\Models\Review;
use App\Models\User;
use App\Services\DemoStoreMedia;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoStoreSeeder extends Seeder
{
    /** Demo credentials used only in local and testing environments. */
    public const string PASSWORD = 'AppNova-demo-2026!';

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command->warn('DemoStoreSeeder only runs in local/testing environments.');

            return;
        }
        $this->call(CategorySeeder::class);
        $media = new DemoStoreMedia;
        $users = [];
        foreach (range(1, 15) as $number) {
            $user = $this->account("user{$number}", "Usuario Demo {$number}", UserRole::User);
            if ($this->eligible($user, UserRole::User)) {
                $users[$number] = $user;
            }
        }
        $companies = ['Brújula Digital', 'Semilla Creativa', 'Nube Clara', 'Faro Interactivo', 'Taller Horizonte'];
        $catalogue = [
            ['Lista Serena', 'productivity', 'Organiza tareas y recordatorios con listas sencillas para recuperar tiempo cada día.'],
            ['Huerto en Casa', 'education', 'Aprende a cultivar verduras en tu balcón con consejos de riego y un calendario de temporada.'],
            ['Rutas del Bosque', 'entertainment', 'Descubre paisajes y prepara tus paseos con una colección de rutas y notas de viaje.'],
            ['Ajedrez de Bolsillo', 'games', 'Practica aperturas y resuelve desafíos de ajedrez a tu ritmo.'],
            ['Agenda Compartida', 'productivity', 'Reúne tus citas y proyectos familiares en una agenda clara y fácil de consultar.'],
            ['Palabras Viajeras', 'education', 'Amplía tu vocabulario con ejercicios breves y expresiones útiles para viajar.'],
            ['Radio Horizonte', 'entertainment', 'Explora programas culturales y guarda tus episodios favoritos para escucharlos después.'],
            ['Conversor Claro', 'utilities', 'Convierte medidas de cocina, distancia y temperatura sin complicaciones.'],
            ['Notas de Aula', 'education', 'Prepara fichas de estudio y repasa conceptos con sesiones cortas de aprendizaje.'],
            ['Puzzle del Mar', 'games', 'Relájate completando rompecabezas inspirados en los colores del océano.'],
            ['Mi Despensa', 'utilities', 'Lleva el control de los alimentos y prepara una lista de compra para evitar desperdicios.'],
            ['Diario Creativo', 'productivity', 'Guarda ideas y pequeñas metas en un diario personal organizado por temas.'],
            ['Cielo Nocturno', 'education', 'Conoce las constelaciones y aprende a reconocer los planetas con guías ilustradas.'],
            ['Ritmo Urbano', 'entertainment', 'Descubre propuestas musicales y crea colecciones para cada momento del día.'],
            ['Sudoku del Día', 'games', 'Entrena la lógica con retos de distintos niveles y pistas para seguir aprendiendo.'],
            ['Tiempo de Enfoque', 'productivity', 'Alterna sesiones de concentración y descanso con un temporizador sin distracciones.'],
            ['Mapa de Recuerdos', 'entertainment', 'Organiza recuerdos de tus viajes y redacta historias sobre tus lugares preferidos.'],
            ['Linterna Amiga', 'utilities', 'Encuentra herramientas sencillas para iluminar y resolver pequeñas tareas cotidianas.'],
            ['Cocina de Barrio', 'education', 'Aprende recetas caseras y planifica menús variados con ingredientes de temporada.'],
            ['Islas de Ingenio', 'games', 'Explora una colección de acertijos y desafíos de estrategia para disfrutar sin prisas.'],
        ];
        foreach ($companies as $index => $company) {
            $number = $index + 1;
            $owner = $this->account("dev{$number}", "Desarrollador Demo {$number}", UserRole::Developer);
            if (! $this->eligible($owner, UserRole::Developer)) {
                continue;
            }
            $developer = DeveloperProfile::query()->firstOrCreate(['user_id' => $owner->id], [
                'company_name' => $company, 'payment_status' => 'pending', 'activated_at' => null,
            ]);
            foreach (array_slice($catalogue, $index * 4, 4, true) as $appIndex => [$name, $categorySlug, $description]) {
                $slug = 'demo-'.Str::slug($name);
                if (Application::query()->where('slug', $slug)->exists()) {
                    continue;
                }
                $category = Category::query()->where('slug', $categorySlug)->where('is_active', true)->first();
                if ($category === null) {
                    continue;
                }
                $icon = $media->image("icon-{$number}", 'https://ui-avatars.com/api/?'.http_build_query([
                    'name' => $company, 'size' => 256, 'format' => 'png', 'background' => '4338ca', 'color' => 'ffffff',
                ]), true);
                $screenshots = [];
                foreach (range(1, 4) as $position) {
                    $screenshots[] = [
                        'position' => $position,
                        'image_path' => $media->image("screen-{$position}", "https://picsum.photos/seed/appnova-demo-{$position}/480/800.jpg"),
                    ];
                }
                DB::transaction(function () use ($slug, $name, $developer, $category, $description, $appIndex, $icon, $screenshots, $users, $index): void {
                    $application = Application::query()->create([
                        'slug' => $slug, 'name' => $name, 'developer_id' => $developer->id,
                        'category_id' => $category->id, 'description' => $description,
                        'minimum_age' => [0, 3, 7, 12, 16, 18][$appIndex % 6],
                        'price' => $appIndex % 4 === 3 ? '2.99' : '0.00', 'status' => 'approved',
                        'published_at' => now()->subDays(60 - $appIndex), 'icon_path' => $icon,
                    ]);
                    $application->screenshots()->createMany($screenshots);
                    if ((float) $application->price === 0.0) {
                        $this->activity($application, $users, $appIndex, $index < 4);
                    }
                });
            }
        }
        if ($media->usedFallback) {
            $this->command->warn('Demo media API unavailable or invalid; cached local PNG fallbacks used (no further requests this run).');
        }
        $this->command->info('Demo accounts: dev1..5@appnova.test / user1..15@appnova.test; password: '.self::PASSWORD);
    }

    private function account(string $identifier, string $name, UserRole $role): User
    {
        return User::query()->firstOrCreate(['email' => "{$identifier}@appnova.test"], [
            'name' => $name, 'password' => self::PASSWORD, 'gender' => 'prefer_not_to_say',
            'birth_date' => '1990-06-15', 'role' => $role, 'status' => UserStatus::Active,
        ]);
    }

    /** Existing collisions and edited credentials are left untouched. */
    private function eligible(User $user, UserRole $role): bool
    {
        return $user->role === $role && $user->status === UserStatus::Active
            && $user->birth_date->age >= 18 && Hash::check(self::PASSWORD, $user->password);
    }

    /** @param array<int, User> $users */
    private function activity(Application $application, array $users, int $index, bool $withReviews): void
    {
        foreach ($users as $number => $user) {
            if ($number > 5 + $index % 6) {
                continue;
            }
            $date = now()->subDays($number % 2 === 0 ? 2 : 20)->subHours($index);
            Download::query()->firstOrCreate(['user_id' => $user->id, 'application_id' => $application->id], [
                'downloaded_at' => $date, 'price_paid' => 0, 'store_commission' => 0, 'developer_net' => 0,
            ]);
            if (! $withReviews || $number > 5 || $index % 4 === 2) {
                continue;
            }
            $review = Review::query()->firstOrCreate(['user_id' => $user->id, 'application_id' => $application->id], [
                'rating' => $number, 'body' => ['Necesita mejorar la navegación.', 'La idea es buena, pero echo en falta más opciones.', 'Cumple su función en el día a día.', 'Muy práctica y fácil de usar.', 'Una experiencia excelente, la recomiendo.'][$number - 1],
                'created_at' => $date->copy()->addHour(), 'updated_at' => $date->copy()->addHour(),
            ]);
            foreach ([14, 15] as $liker) {
                if (isset($users[$liker])) {
                    $review->likes()->syncWithoutDetaching([$users[$liker]->id => ['created_at' => now()->subDay()]]);
                }
            }
        }
    }
}
