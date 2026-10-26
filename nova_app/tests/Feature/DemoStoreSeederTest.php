<?php

use App\Models\Application;
use App\Models\DeveloperProfile;
use App\Models\Download;
use App\Models\Review;
use App\Models\User;
use App\Services\DemoStoreMedia;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoStoreSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Random\Engine\Mt19937;
use Random\Randomizer;

beforeEach(function () {
    Storage::fake('public');
    Http::preventStrayRequests();
    $this->freezeTime();
});

test('default database seeding includes the demo store in testing', function () {
    Http::fake(['*' => Http::response('offline', 503)]);

    $this->seed(DatabaseSeeder::class);

    expect(User::query()->where('email', 'like', '%@appnova.test')->count())->toBe(20);
    expect(DeveloperProfile::query()->count())->toBe(5);
    expect(Application::visible()->count())->toBe(20);
});

test('demo store seeds valid published apps and eligible activity repeatably without changing existing data', function () {
    $upload = UploadedFile::fake()->image('api.png', 256, 256);
    $raster = file_get_contents($upload->getPathname());
    Http::fake(['*' => Http::response($raster, 200, ['Content-Type' => 'image/png'])]);
    $existing = Application::factory()->published()->create();
    $existingState = $existing->getAttributes();
    $existingOwner = $existing->developer->user->getAttributes();

    $this->seed(DemoStoreSeeder::class);
    expect(User::query()->where('email', 'like', '%@appnova.test')->count())->toBe(20);
    expect(User::query()->where('role', 'admin')->count())->toBe(0);
    expect(DeveloperProfile::query()->whereHas('user', fn ($q) => $q->where('email', 'like', 'dev%@appnova.test'))->count())->toBe(5);
    expect(Application::query()->where('slug', 'like', 'demo-%')->count())->toBe(20);
    expect(Application::visible()->count())->toBe(21);
    expect(Application::query()->where('slug', 'like', 'demo-%')->where('price', '>', 0)->count())->toBe(5);
    foreach (DeveloperProfile::query()->whereHas('user', fn ($q) => $q->where('email', 'like', 'dev%@appnova.test'))->get() as $developer) {
        expect($developer->payment_status->value)->toBe('pending');
        expect($developer->activated_at)->toBeNull();
        expect(Application::query()->where('developer_id', $developer->id)->count())->toBe(4);
    }
    foreach (Application::query()->where('slug', 'like', 'demo-%')->get() as $application) {
        expect($application->screenshots->pluck('position')->all())->toBe([1, 2, 3, 4]);
        foreach ([$application->icon_path, ...$application->screenshots->pluck('image_path')] as $path) {
            expect($path)->toStartWith('demo-store/');
            expect(imagecreatefromstring(Storage::disk('public')->get($path)))->not->toBeFalse();
        }
    }
    expect(Download::query()->count())->toBe(108);
    expect(Review::query()->count())->toBe(40);
    expect(DB::table('review_likes')->count())->toBe(80);
    expect(Review::query()->distinct()->orderBy('rating')->pluck('rating')->all())->toBe([1, 2, 3, 4, 5]);
    foreach (Download::with('application')->get() as $download) {
        expect((float) $download->application->price)->toBe(0.0);
        expect(User::query()->findOrFail($download->user_id)->birth_date->age)->toBeGreaterThanOrEqual($download->application->minimum_age);
        expect($download->only(['price_paid', 'store_commission', 'developer_net']))->toBe([
            'price_paid' => '0.00', 'store_commission' => '0.00', 'developer_net' => '0.00',
        ]);
    }
    foreach (Review::with('likes')->get() as $review) {
        expect(Download::query()->where('user_id', $review->user_id)->where('application_id', $review->application_id)->exists())->toBeTrue();
        expect($review->likes->contains('id', $review->user_id))->toBeFalse();
    }
    expect(Download::query()->where('downloaded_at', '>=', now()->subDays(7))->exists())->toBeTrue();
    expect(Download::query()->where('downloaded_at', '<', now()->subDays(7))->exists())->toBeTrue();
    $noReviews = User::query()->where('email', 'dev5@appnova.test')->firstOrFail()->developerProfile;
    expect(Review::query()->whereHas('application', fn ($q) => $q->where('developer_id', $noReviews->id))->count())->toBe(0);
    expect(Application::query()->where('price', 0)->doesntHave('reviews')->count())->toBeGreaterThan(0);
    expect(Hash::check(DemoStoreSeeder::PASSWORD, User::query()->where('email', 'user1@appnova.test')->firstOrFail()->password))->toBeTrue();
    Http::assertSentCount(9);

    $edited = Application::query()->where('slug', 'demo-lista-serena')->firstOrFail();
    $edited->update(['name' => 'Mi versión', 'description' => 'Descripción personalizada.']);
    $review = Review::query()->firstOrFail();
    $review->update(['rating' => 3, 'body' => 'Reseña editada.']);
    $snapshot = [];
    foreach (['users', 'developer_profiles', 'applications', 'application_screenshots', 'downloads', 'reviews', 'review_likes'] as $table) {
        $snapshot[$table] = DB::table($table)->get()->toJson();
    }
    $files = collect(Storage::disk('public')->allFiles('demo-store'))->mapWithKeys(fn ($path) => [$path => hash('sha256', Storage::disk('public')->get($path))])->all();
    expect($files)->toHaveCount(9);
    $this->travel(1)->days();
    $this->seed(DemoStoreSeeder::class);
    foreach ($snapshot as $table => $rows) {
        expect(DB::table($table)->get()->toJson())->toBe($rows);
    }
    foreach ($files as $path => $hash) {
        expect(hash('sha256', Storage::disk('public')->get($path)))->toBe($hash);
    }
    Http::assertSentCount(9);
    expect($existing->fresh()->getAttributes())->toEqual($existingState);
    expect($existing->developer->user->fresh()->getAttributes())->toEqual($existingOwner);
});

test('offline or invalid APIs produce decodable local raster fallbacks with one request only', function (string $failure) {
    Http::fake(['*' => match ($failure) {
        'connection' => Http::failedConnection(),
        'oversized' => Http::response(str_repeat('x', 2 * 1024 * 1024 + 1)),
        'svg' => Http::response('<svg xmlns="http://www.w3.org/2000/svg"/>'),
        default => Http::response('unavailable', 503),
    }]);
    $this->seed(DemoStoreSeeder::class);
    $this->seed(DemoStoreSeeder::class);
    expect(Application::visible()->count())->toBe(20);
    expect(Storage::disk('public')->allFiles('demo-store'))->toHaveCount(9);
    foreach (Storage::disk('public')->allFiles('demo-store') as $path) {
        $body = Storage::disk('public')->get($path);
        expect(getimagesizefromstring($body)[2])->toBe(IMAGETYPE_PNG);
        expect(imagecreatefromstring($body))->not->toBeFalse();
    }
    Http::assertSentCount(1);
})->with(['connection', 'oversized', 'svg', 'http']);

test('reserved identifier collisions and edited demo data are never adopted or overwritten', function () {
    Http::fake(['*' => Http::response('offline', 503)]);
    $collision = User::factory()->create(['email' => 'dev1@appnova.test', 'role' => 'developer']);
    $accountState = $collision->getAttributes();
    $app = Application::factory()->published()->create(['slug' => 'demo-agenda-compartida']);
    $appState = $app->getAttributes();
    $screens = $app->screenshots->toJson();
    $this->seed(DemoStoreSeeder::class);
    $this->seed(DemoStoreSeeder::class);
    expect($collision->fresh()->getAttributes())->toEqual($accountState);
    expect($collision->developerProfile)->toBeNull();
    expect($app->fresh()->getAttributes())->toEqual($appState);
    expect($app->fresh()->screenshots->toJson())->toBe($screens);
    expect($app->downloads()->count())->toBe(0);
});

test('media cache is reused and corrupt cached rasters are repaired without adding files', function () {
    Http::fake(['*' => Http::response('offline', 503)]);
    Storage::disk('public')->put('demo-store/icon-1.png', 'corrupt');
    $media = new DemoStoreMedia;
    $path = $media->image('icon-1', 'https://ui-avatars.com/api/?format=png', true);
    expect(imagecreatefromstring(Storage::disk('public')->get($path)))->not->toBeFalse();
    (new DemoStoreMedia)->image('icon-1', 'https://ui-avatars.com/api/?format=png', true);
    Http::assertSentCount(1);
    expect(Storage::disk('public')->allFiles('demo-store'))->toHaveCount(1);
});

test('compressed images that expand beyond the cache limit are normalized once and reused', function (bool $icon, int $width, int $height) {
    $source = imagecreatetruecolor(1024, 1024);
    $noise = (new Randomizer(new Mt19937(2026)))->getBytes(1024 * 1024 * 3);
    for ($y = 0; $y < 1024; $y++) {
        for ($x = 0; $x < 1024; $x++) {
            $offset = ($y * 1024 + $x) * 3;
            imagesetpixel($source, $x, $y, (ord($noise[$offset]) << 16) | (ord($noise[$offset + 1]) << 8) | ord($noise[$offset + 2]));
        }
    }
    unset($noise);
    ob_start();
    imagejpeg($source, null, 75);
    $jpeg = ob_get_clean();
    unset($source);

    expect(strlen($jpeg))->toBeLessThan(2 * 1024 * 1024);
    $decoded = imagecreatefromstring($jpeg);
    ob_start();
    imagepng($decoded);
    $expanded = ob_get_clean();
    unset($decoded);
    expect(strlen($expanded))->toBeGreaterThan(2 * 1024 * 1024);
    unset($expanded);

    Http::fake(['*' => Http::response($jpeg, 200, ['Content-Type' => 'image/jpeg'])]);
    $media = new DemoStoreMedia;
    $path = $media->image('expanding-raster', 'https://picsum.photos/seed/noise/1024/1024.jpg', $icon);
    $png = Storage::disk('public')->get($path);
    expect(strlen($png))->toBeLessThanOrEqual(2 * 1024 * 1024);
    expect(array_slice(getimagesizefromstring($png), 0, 3))->toBe([$width, $height, IMAGETYPE_PNG]);
    $decoded = imagecreatefromstring($png);
    expect($decoded)->not->toBeFalse();
    unset($decoded);
    expect($media->usedFallback)->toBeFalse();

    $second = new DemoStoreMedia;
    expect($second->image('expanding-raster', 'https://picsum.photos/seed/noise/1024/1024.jpg', $icon))->toBe($path);
    expect(Storage::disk('public')->get($path))->toBe($png);
    expect(Storage::disk('public')->allFiles('demo-store'))->toHaveCount(1);
    Http::assertSentCount(1);
})->with(['icon' => [true, 256, 256], 'screenshot' => [false, 480, 800]]);

test('demo seeder refuses production before making database or network changes', function () {
    Http::fake();
    app()->detectEnvironment(fn () => 'production');
    try {
        $this->artisan('db:seed', ['--class' => DemoStoreSeeder::class, '--force' => true, '--no-interaction' => true])
            ->expectsOutputToContain('DemoStoreSeeder only runs in local/testing environments.')
            ->assertSuccessful();
        expect(User::query()->count())->toBe(0);
        expect(Application::query()->count())->toBe(0);
        Http::assertNothingSent();
    } finally {
        app()->detectEnvironment(fn () => 'testing');
    }
});
