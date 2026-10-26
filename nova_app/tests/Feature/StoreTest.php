<?php

use App\Actions\PublishApplication;
use App\Actions\UpdateProfile;
use App\Enums\UserRole;
use App\Models\Application;
use App\Models\Category;
use App\Models\DeveloperProfile;
use App\Models\Download;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->travelTo(Carbon::parse('2026-10-25 12:00:00'));
});

function publicationPayload(): array
{
    return [
        'name' => 'Nova Notes',
        'description' => 'A simple notebook.',
        'category_id' => Category::factory()->create()->id,
        'minimum_age' => 0,
        'price' => '0.00',
        'icon' => UploadedFile::fake()->image('icon.png'),
        'screenshots' => array_map(fn (int $position) => UploadedFile::fake()->image("screen-{$position}.png"), range(1, 4)),
    ];
}

test('publishes immediately for a pending developer with five persisted images', function () {
    Storage::fake('public');
    $developer = DeveloperProfile::factory()->create();

    $response = $this->actingAs($developer->user)->postJson('/api/v1/developer/applications', publicationPayload());

    $response->assertCreated()->assertJsonPath('application.status', 'approved')->assertJsonCount(4, 'application.screenshots');
    $application = Application::query()->firstOrFail();
    expect($application->published_at)->not->toBeNull();
    expect($developer->fresh()->payment_status->value)->toBe('pending');
    Storage::disk('public')->assertExists($application->icon_path);
    foreach ($application->screenshots as $screenshot) {
        Storage::disk('public')->assertExists($screenshot->image_path);
    }
    $this->getJson('/api/v1/applications')->assertJsonPath('applications.data.0.id', $application->id);
});

test('web publication redirects to the immediately published paid app without enabling paid installs', function () {
    Storage::fake('public');
    $developer = DeveloperProfile::factory()->create();
    $payload = publicationPayload();
    $payload['price'] = '3.50';
    $response = $this->actingAs($developer->user)->post(route('developer.applications.store'), $payload);
    $application = Application::query()->firstOrFail();
    $response->assertRedirect(route('store.show', $application));
    $this->assertDatabaseHas('applications', ['id' => $application->id, 'status' => 'approved', 'price' => 3.50]);
    Storage::disk('public')->assertCount('applications/icons', 1);
    Storage::disk('public')->assertCount('applications/screenshots', 4);
    $this->postJson("/api/v1/applications/{$application->id}/downloads")->assertUnprocessable()->assertJsonValidationErrors('application');
    $this->assertDatabaseCount('downloads', 0);
});

test('rejects missing publishing fields with the shared API error shape', function () {
    $developer = DeveloperProfile::factory()->create();
    $this->actingAs($developer->user)->postJson('/api/v1/developer/applications', [])
        ->assertUnprocessable()->assertJsonPath('message', 'Revisa los campos indicados.')
        ->assertJsonValidationErrors(['name', 'description', 'category_id', 'minimum_age', 'price', 'icon', 'screenshots']);
    $this->assertDatabaseCount('applications', 0);
});

test('rejects invalid publication media and controlled fields', function (string $field) {
    Storage::fake('public');
    $developer = DeveloperProfile::factory()->create();
    $payload = publicationPayload();
    $payload[$field] = match ($field) {
        'screenshots' => array_slice($payload['screenshots'], 0, 3),
        'icon' => UploadedFile::fake()->create('app.exe', 10, 'application/octet-stream'),
        'binary' => UploadedFile::fake()->create('app.apk'),
        'minimum_age' => 19,
        'price' => '-1.00',
        'category_id' => Category::factory()->create(['is_active' => false])->id,
        default => 'approved',
    };
    $this->actingAs($developer->user)->postJson('/api/v1/developer/applications', $payload)
        ->assertUnprocessable()->assertJsonValidationErrors($field);
    $this->assertDatabaseCount('applications', 0);
    Storage::disk('public')->assertDirectoryEmpty('applications');
})->with(['screenshots', 'icon', 'binary', 'minimum_age', 'price', 'category_id', 'status']);

test('rejects unauthenticated writes and nondeveloper publication', function () {
    $this->postJson('/api/v1/developer/applications')->assertUnauthorized();
    $this->getJson('/api/v1/profile')->assertUnauthorized();
    $this->actingAs(User::factory()->create())->postJson('/api/v1/developer/applications')->assertForbidden();
    $this->actingAs(User::factory()->create(['role' => 'admin']))->postJson('/api/v1/developer/applications')->assertForbidden();
});

test('developer listing and detail do not disclose another developers applications', function () {
    $developer = DeveloperProfile::factory()->create();
    $own = Application::factory()->published()->create(['developer_id' => $developer->id]);
    $other = Application::factory()->published()->create();
    Review::factory()->create(['application_id' => $own->id, 'rating' => 5]);

    $this->actingAs($developer->user)->getJson('/api/v1/developer/applications')
        ->assertOk()->assertJsonCount(1, 'applications.data')->assertJsonPath('applications.data.0.id', $own->id)
        ->assertJsonPath('summary.applications_count', 1)->assertJsonPath('summary.downloads_count', 1)
        ->assertJsonPath('summary.reviews_count', 1)->assertJsonPath('summary.average_rating', 5);
    $this->getJson("/api/v1/developer/applications/{$other->id}")->assertNotFound();
    $this->getJson("/api/v1/developer/applications/{$own->id}")->assertOk();
});

test('developer web pages separate dashboard data from publication categories', function () {
    $developer = DeveloperProfile::factory()->create();
    $own = Application::factory()->published()->create(['developer_id' => $developer->id]);
    Application::factory()->published()->create();
    Category::factory()->create(['is_active' => false]);

    $this->actingAs($developer->user)->get(route('developer.dashboard'))
        ->assertInertia(fn (AssertableInertia $page) => $page->component('developer/Dashboard')
            ->has('applications.data', 1)->where('applications.data.0.id', $own->id)
            ->where('summary.applications_count', 1)->where('summary.average_rating', null));
    $this->get(route('developer.applications.create'))
        ->assertInertia(fn (AssertableInertia $page) => $page->component('developer/Create')
            ->has('categories')->missing('applications')->missing('summary'));
    $this->getJson(route('developer.applications.create'))->assertOk()
        ->assertJsonMissingPath('applications')->assertJsonMissingPath('summary');
});

test('legacy developer web links redirect to the canonical destination', function (string $path, string $destination) {
    $developer = DeveloperProfile::factory()->create();
    $this->actingAs($developer->user)->get($path)->assertRedirect(route($destination));
})->with([
    ['/developer/applications', 'developer.dashboard'],
    ['/developer/dashboard?publish=1', 'developer.applications.create'],
    ['/developer/applications?publish=1', 'developer.applications.create'],
]);

test('legacy developer applications redirect preserves the dashboard page and drops obsolete publish query', function () {
    $developer = DeveloperProfile::factory()->create();

    $this->actingAs($developer->user)->get('/developer/applications?page=2&publish=0')
        ->assertRedirect(route('developer.dashboard', ['page' => 2]));
});

test('publication page requires an active authenticated developer', function () {
    $this->get(route('developer.applications.create'))->assertRedirect(route('login'));
    $this->actingAs(User::factory()->create())->get(route('developer.applications.create'))->assertForbidden();
    $this->actingAs(User::factory()->create(['role' => 'admin']))->get(route('developer.applications.create'))->assertForbidden();
    $developer = DeveloperProfile::factory()->create();
    $developer->user->update(['status' => 'suspended']);
    $this->actingAs($developer->user)->get(route('developer.applications.create'))->assertForbidden();
});

test('free installation is persistent idempotent and available to both store roles', function (UserRole $role) {
    $user = User::factory()->create(['role' => $role, 'birth_date' => '1990-01-01']);
    $application = Application::factory()->published()->create();
    $this->actingAs($user)->postJson("/api/v1/applications/{$application->id}/downloads")
        ->assertOk()->assertJsonPath('application.installed', true);
    $first = Download::query()->firstOrFail();
    expect($first->only(['price_paid', 'store_commission', 'developer_net']))->toBe([
        'price_paid' => '0.00', 'store_commission' => '0.00', 'developer_net' => '0.00',
    ]);
    $this->travel(1)->days();
    $this->postJson("/api/v1/applications/{$application->id}/downloads")->assertOk()->assertJsonPath('download.id', $first->id);
    $this->assertDatabaseCount('downloads', 1);
    expect($first->fresh()->downloaded_at->equalTo($first->downloaded_at))->toBeTrue();
    expect($first->fresh()->only(['price_paid', 'store_commission', 'developer_net']))->toBe([
        'price_paid' => '0.00', 'store_commission' => '0.00', 'developer_net' => '0.00',
    ]);
    $this->getJson('/api/v1/profile')->assertJsonPath('summary.downloads_count', 1)->assertJsonMissingPath('library');
    $this->getJson('/api/v1/library')->assertJsonPath('summary.downloads_count', 1)->assertJsonPath('library.data.0.application.id', $application->id);
})->with([UserRole::User, UserRole::Developer]);

test('paid and underage installation cannot create downloads', function (string $restriction) {
    $user = User::factory()->create(['birth_date' => today()->subYears(17)->toDateString()]);
    $application = Application::factory()->published()->create($restriction === 'paid' ? ['price' => '1.00'] : ['minimum_age' => 18]);
    $this->actingAs($user)->postJson("/api/v1/applications/{$application->id}/downloads")
        ->assertUnprocessable()->assertJsonValidationErrors('application');
    $this->assertDatabaseCount('downloads', 0);
})->with(['paid', 'underage']);

test('age boundary permits installation on the required birthday', function () {
    $user = User::factory()->create(['birth_date' => today()->subYears(18)->toDateString()]);
    $application = Application::factory()->published()->create(['minimum_age' => 18]);
    $this->actingAs($user)->postJson("/api/v1/applications/{$application->id}/downloads")->assertOk();
    $this->assertDatabaseHas('downloads', ['user_id' => $user->id, 'application_id' => $application->id]);
});

test('hidden applications cannot be read installed or reviewed', function (string $reason) {
    $user = User::factory()->create();
    $application = Application::factory()->published()->create();
    match ($reason) {
        'draft' => $application->update(['status' => 'draft', 'published_at' => null]),
        'future' => $application->update(['published_at' => now()->addDay()]),
        'category' => $application->category->update(['is_active' => false]),
        'developer' => $application->developer->user->update(['status' => 'suspended']),
        'screenshots' => $application->screenshots()->first()->delete(),
    };
    $this->actingAs($user)->getJson('/api/v1/applications')->assertJsonCount(0, 'applications.data');
    $this->getJson("/api/v1/applications/{$application->id}")->assertNotFound();
    $this->postJson("/api/v1/applications/{$application->id}/downloads")->assertNotFound();
    $this->putJson("/api/v1/applications/{$application->id}/review", ['rating' => 4])->assertNotFound();
    $this->assertDatabaseCount('downloads', 0);
    $this->assertDatabaseCount('reviews', 0);
})->with(['draft', 'future', 'category', 'developer', 'screenshots']);

test('reviews require installation and edit only the authenticated users single review', function () {
    $user = User::factory()->create();
    $application = Application::factory()->published()->create();
    $otherReview = Review::factory()->create(['application_id' => $application->id, 'rating' => 2]);
    $url = "/api/v1/applications/{$application->id}/review";
    $this->actingAs($user)->putJson($url, ['rating' => 5])->assertForbidden();
    $this->postJson("/api/v1/applications/{$application->id}/downloads")->assertOk();
    $this->putJson($url, ['rating' => 5, 'body' => 'Great', 'user_id' => $otherReview->user_id])
        ->assertOk()->assertJsonPath('application.average_rating', 3.5)->assertJsonPath('own_review.body', 'Great');
    $this->putJson($url, ['rating' => 4, 'body' => 'Edited'])->assertOk()->assertJsonPath('application.average_rating', 3);
    $this->assertDatabaseCount('reviews', 2);
    $this->assertDatabaseHas('reviews', ['user_id' => $user->id, 'rating' => 4, 'body' => 'Edited']);
    expect($otherReview->fresh()->rating)->toBe(2);
});

test('review ratings must be integers from one to five', function (mixed $rating) {
    $download = Download::factory()->create();
    $user = User::query()->findOrFail($download->user_id);
    $this->actingAs($user)->putJson("/api/v1/applications/{$download->application_id}/review", ['rating' => $rating])
        ->assertUnprocessable()->assertJsonValidationErrors('rating');
    $this->assertDatabaseCount('reviews', 0);
})->with([0, 6, 2.5, 'bad']);

test('likes use explicit desired state and forbid self likes', function () {
    $review = Review::factory()->create();
    $user = User::factory()->create();
    $url = "/api/v1/reviews/{$review->id}/like";
    $this->actingAs($user)->putJson($url, ['liked' => true])->assertOk()->assertJsonPath('review.likes_count', 1)->assertJsonPath('review.liked', true);
    $this->putJson($url, ['liked' => true])->assertOk()->assertJsonPath('review.likes_count', 1);
    $this->putJson($url, ['liked' => false])->assertOk()->assertJsonPath('review.likes_count', 0);
    $this->putJson($url, ['liked' => false])->assertOk()->assertJsonPath('review.likes_count', 0);
    $this->putJson($url, [])->assertUnprocessable()->assertJsonValidationErrors('liked');
    $this->actingAs($review->user)->putJson($url, ['liked' => true])->assertForbidden();
    $this->assertDatabaseCount('review_likes', 0);
});

test('profile editing persists permitted fields and keeps activation unchanged', function () {
    Storage::fake('public');
    $developer = DeveloperProfile::factory()->create();
    $user = $developer->user;
    $this->actingAs($user)->patchJson('/api/v1/profile', [
        'name' => 'Updated Name', 'email' => 'updated@example.com', 'gender' => 'non_binary',
        'birth_date' => '1991-02-03', 'company_name' => 'Updated Company', 'avatar' => UploadedFile::fake()->image('avatar.png'),
    ])->assertOk()->assertJsonPath('profile.name', 'Updated Name')->assertJsonPath('profile.developer_profile.company_name', 'Updated Company')
        ->assertJsonPath('summary.downloads_count', 0)->assertJsonPath('summary.reviews_count', 0);
    $this->assertDatabaseHas('users', ['id' => $user->id, 'email' => 'updated@example.com', 'email_verified_at' => null]);
    Storage::disk('public')->assertExists($user->fresh()->avatar_path);
    expect($developer->fresh()->payment_status->value)->toBe('pending');
});

test('stale profile instances replace the actual current avatar without reverting newer profile data', function () {
    Storage::fake('public');
    $originalPath = UploadedFile::fake()->image('original.png')->store('avatars', 'public');
    $user = User::factory()->create(['avatar_path' => $originalPath]);
    $firstInstance = User::query()->findOrFail($user->id);
    $secondInstance = User::query()->findOrFail($user->id);
    $update = app(UpdateProfile::class);

    $update($firstInstance, ['name' => 'New Name', 'avatar' => UploadedFile::fake()->image('first.png')]);
    $firstPath = $firstInstance->avatar_path;
    Storage::disk('public')->assertMissing($originalPath);
    Storage::disk('public')->assertExists($firstPath);

    $update($secondInstance, ['avatar' => UploadedFile::fake()->image('second.png')]);

    $current = $user->fresh();
    expect($current->name)->toBe('New Name');
    expect($secondInstance->name)->toBe('New Name');
    expect($secondInstance->avatar_path)->toBe($current->avatar_path);
    Storage::disk('public')->assertMissing($firstPath);
    Storage::disk('public')->assertExists($current->avatar_path);
    Storage::disk('public')->assertCount('avatars', 1);
});

test('avatar replacement preserves the old file until its enclosing transaction commits', function () {
    Storage::fake('public');
    $oldPath = UploadedFile::fake()->image('old.png')->store('avatars', 'public');
    $user = User::factory()->create(['avatar_path' => $oldPath]);

    DB::transaction(function () use ($user, $oldPath): void {
        app(UpdateProfile::class)($user, ['avatar' => UploadedFile::fake()->image('replacement.png')]);
        Storage::disk('public')->assertExists($oldPath);
        Storage::disk('public')->assertExists($user->avatar_path);
    });

    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($user->fresh()->avatar_path);
    Storage::disk('public')->assertCount('avatars', 1);
});

test('an enclosing rollback removes a successfully staged avatar and preserves the original', function () {
    Storage::fake('public');
    $originalPath = UploadedFile::fake()->image('original.png')->store('avatars', 'public');
    $user = User::factory()->create(['avatar_path' => $originalPath, 'name' => 'Original Name']);

    expect(function () use ($user, $originalPath): void {
        DB::transaction(function () use ($user, $originalPath): void {
            app(UpdateProfile::class)($user, ['name' => 'Rolled Back', 'avatar' => UploadedFile::fake()->image('replacement.png')]);
            Storage::disk('public')->assertExists($user->avatar_path);
            Storage::disk('public')->assertExists($originalPath);
            throw new RuntimeException('Rollback enclosing profile transaction');
        });
    })->toThrow(RuntimeException::class, 'Rollback enclosing profile transaction');

    $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Original Name', 'avatar_path' => $originalPath]);
    Storage::disk('public')->assertMissing($user->avatar_path);
    Storage::disk('public')->assertExists($originalPath);
    Storage::disk('public')->assertCount('avatars', 1);
});

test('an enclosing rollback removes all five images after successful nested publication', function () {
    Storage::fake('public');
    $developer = DeveloperProfile::factory()->create();
    $payload = publicationPayload();
    $existingPath = UploadedFile::fake()->image('existing.png')->store('applications/icons', 'public');

    expect(function () use ($developer, $payload): void {
        DB::transaction(function () use ($developer, $payload): void {
            $application = app(PublishApplication::class)($developer->user, $payload);
            $this->assertDatabaseHas('applications', ['id' => $application->id, 'status' => 'approved']);
            Storage::disk('public')->assertExists($application->icon_path);
            Storage::disk('public')->assertCount('applications/screenshots', 4);
            throw new RuntimeException('Rollback enclosing publication transaction');
        });
    })->toThrow(RuntimeException::class, 'Rollback enclosing publication transaction');

    $this->assertDatabaseCount('applications', 0);
    $this->assertDatabaseCount('application_screenshots', 0);
    Storage::disk('public')->assertExists($existingPath);
    Storage::disk('public')->assertCount('applications/icons', 1);
    Storage::disk('public')->assertDirectoryEmpty('applications/screenshots');
});

test('failed publication removes staged images when its category becomes unavailable', function () {
    Storage::fake('public');
    $developer = DeveloperProfile::factory()->create();
    $payload = publicationPayload();
    Category::query()->whereKey($payload['category_id'])->update(['is_active' => false]);
    $existingPath = UploadedFile::fake()->image('existing.png')->store('applications/icons', 'public');

    expect(fn () => app(PublishApplication::class)($developer->user, $payload))->toThrow(ModelNotFoundException::class);

    $this->assertDatabaseCount('applications', 0);
    $this->assertDatabaseCount('application_screenshots', 0);
    Storage::disk('public')->assertExists($existingPath);
    Storage::disk('public')->assertCount('applications/icons', 1);
    Storage::disk('public')->assertDirectoryEmpty('applications/screenshots');
});

test('profile rejects privilege mutation and user company changes', function (string $field, mixed $value) {
    $user = User::factory()->create();
    $this->actingAs($user)->patchJson('/api/v1/profile', [$field => $value])
        ->assertUnprocessable()->assertJsonValidationErrors($field);
    expect($user->fresh()->role)->toBe(UserRole::User);
})->with([
    ['role', 'developer'], ['status', 'suspended'], ['payment_status', 'paid'],
    ['activated_at', '2026-01-01'], ['company_name', 'No'], ['developer_profile', ['payment_status' => 'paid']],
]);

test('profile rejects duplicate email future birthday and invalid avatar', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $this->actingAs($user)->patchJson('/api/v1/profile', [
        'email' => $other->email, 'birth_date' => today()->addDay()->toDateString(),
        'avatar' => UploadedFile::fake()->create('bad.svg', 10, 'image/svg+xml'),
    ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'birth_date', 'avatar']);
    expect($user->fresh()->email)->toBe($user->email);
    $this->patchJson('/api/v1/profile', ['name' => 'Regular User'])->assertOk()->assertJsonPath('profile.name', 'Regular User');
});

test('catalogue filters and sorts use real ratings downloads and seven day trends', function () {
    $this->freezeTime();
    $category = Category::factory()->create(['slug' => 'notes']);
    $older = Application::factory()->published()->create(['name' => 'Notebook', 'category_id' => $category->id, 'published_at' => now()->subDays(20)]);
    $newer = Application::factory()->published()->create(['name' => 'New Notebook', 'category_id' => $category->id, 'price' => '2.00']);
    Download::factory()->count(3)->create(['application_id' => $older->id, 'downloaded_at' => now()->subDays(8)]);
    Review::factory()->create(['application_id' => $older->id, 'rating' => 5]);
    Review::factory()->create(['application_id' => $newer->id, 'rating' => 2]);
    Download::factory()->create(['application_id' => $newer->id, 'downloaded_at' => now()->subDays(2)]);
    $this->getJson('/api/v1/applications?sort=newest')->assertJsonPath('applications.data.0.id', $newer->id);
    $this->getJson('/api/v1/applications?sort=rating')->assertJsonPath('applications.data.0.id', $older->id);
    $this->getJson('/api/v1/applications?sort=downloads')->assertJsonPath('applications.data.0.id', $older->id);
    $this->getJson('/api/v1/applications?sort=trending')->assertJsonPath('applications.data.0.id', $newer->id)->assertJsonPath('applications.data.0.trending_downloads_count', 2);
    $this->getJson('/api/v1/applications?search=NOTEBOOK&category=notes&free=1')->assertJsonCount(1, 'applications.data')->assertJsonPath('applications.data.0.id', $older->id);
    $this->getJson('/api/v1/applications?free=0')->assertJsonCount(1, 'applications.data')->assertJsonPath('applications.data.0.id', $newer->id);
    $this->getJson('/api/v1/applications?sort=price%20desc')->assertUnprocessable()->assertJsonValidationErrors('sort');
    $this->getJson('/api/v1/applications?search=%27%20OR%201=1--')->assertJsonCount(0, 'applications.data');
});

test('home discovery uses independent visible popular and seven day trending rankings', function () {
    $popular = Application::factory()->published()->create(['published_at' => now()->subDays(30)]);
    $trending = Application::factory()->published()->create(['published_at' => now()->subDays(20)]);
    $newest = Application::factory()->published()->create();
    Application::factory()->published()->count(4)->create(['published_at' => now()->subDays(40)]);
    $hidden = Application::factory()->create();
    Download::factory()->count(4)->create(['application_id' => $popular->id, 'downloaded_at' => now()->subDays(8)]);
    Download::factory()->count(2)->create(['application_id' => $trending->id, 'downloaded_at' => now()->subDay()]);
    Download::factory()->count(5)->create(['application_id' => $hidden->id, 'downloaded_at' => now()]);

    $this->getJson('/api/v1/applications')->assertOk()
        ->assertJsonPath('applications.data.0.id', $newest->id)
        ->assertJsonPath('popular.0.id', $popular->id)
        ->assertJsonPath('trending.0.id', $trending->id)
        ->assertJsonCount(4, 'popular')->assertJsonCount(4, 'trending');
    $this->get(route('store'))->assertInertia(fn (AssertableInertia $page) => $page
        ->where('popular.0.id', $popular->id)->where('trending.0.id', $trending->id));
    $this->getJson('/api/v1/applications?sort=downloads')->assertJsonPath('applications.data.0.id', $popular->id)->assertJsonMissingPath('popular');
    $this->getJson('/api/v1/applications?sort=trending')->assertJsonPath('applications.data.0.id', $trending->id)->assertJsonMissingPath('trending');
    $this->getJson('/api/v1/applications?free=1')->assertJsonMissingPath('popular')->assertJsonMissingPath('trending');
    $this->getJson('/api/v1/applications?search=0')->assertJsonMissingPath('popular')->assertJsonMissingPath('trending')->assertJsonCount(0, 'applications.data');
});

test('web likes and unlikes preserve the validated second review page', function () {
    $application = Application::factory()->published()->create();
    $review = Review::factory()->create(['application_id' => $application->id]);
    Review::factory()->count(10)->create(['application_id' => $application->id]);
    $user = User::factory()->create();
    $destination = route('store.show', ['application' => $application->id, 'reviews_page' => 2]);

    $this->actingAs($user)->put(route('reviews.like', $review), ['liked' => true, 'reviews_page' => 2])->assertRedirect($destination);
    $this->assertDatabaseHas('review_likes', ['review_id' => $review->id, 'user_id' => $user->id]);
    $this->get($destination)->assertInertia(fn (AssertableInertia $page) => $page
        ->where('reviews.meta.current_page', 2)->where('reviews.data.0.id', $review->id)->where('reviews.data.0.liked', true));
    $this->post(route('reviews.like', $review), ['_method' => 'PUT', 'liked' => false, 'reviews_page' => 2])->assertRedirect($destination);
    $this->assertDatabaseMissing('review_likes', ['review_id' => $review->id, 'user_id' => $user->id]);
    $this->get($destination)->assertInertia(fn (AssertableInertia $page) => $page
        ->where('reviews.meta.current_page', 2)->where('reviews.data.0.liked', false));
    $this->putJson(route('reviews.like', $review), ['liked' => true, 'reviews_page' => 0])->assertUnprocessable()->assertJsonValidationErrors('reviews_page');
    $this->assertDatabaseMissing('review_likes', ['review_id' => $review->id, 'user_id' => $user->id]);
});

test('detail suggestions exclude hidden apps and expose only public author data', function () {
    $application = Application::factory()->published()->create();
    $sibling = Application::factory()->published()->create(['developer_id' => $application->developer_id, 'category_id' => $application->category_id]);
    Application::factory()->create(['developer_id' => $application->developer_id, 'category_id' => $application->category_id]);
    Review::factory()->create(['application_id' => $application->id]);
    $this->getJson("/api/v1/applications/{$application->id}")->assertOk()
        ->assertJsonCount(1, 'similar')->assertJsonPath('similar.0.id', $sibling->id)
        ->assertJsonCount(1, 'same_developer')->assertJsonMissingPath('reviews.data.0.author.email')
        ->assertJsonMissingPath('application.developer.payment_status');
});

test('web and API reads share the catalogue contract and web writes redirect', function () {
    $application = Application::factory()->published()->create();
    $this->get(route('store'))->assertInertia(fn (AssertableInertia $page) => $page->component('store/Index')->has('applications.data', 1)->has('categories')->has('filters'));
    $this->get(route('store.show', $application))->assertInertia(fn (AssertableInertia $page) => $page->component('store/Show', false)->where('application.id', $application->id)->has('reviews')->has('similar')->has('same_developer'));
    $user = User::factory()->create();
    $this->actingAs($user)->post(route('downloads.store', $application))->assertRedirect(route('store.show', $application));
    $this->get(route('profile.show'))->assertInertia(fn (AssertableInertia $page) => $page->component('profile/Show', false)->where('summary.downloads_count', 1));
    $this->assertDatabaseHas('downloads', ['user_id' => $user->id, 'application_id' => $application->id]);
    $this->putJson(route('reviews.update', $application), ['rating' => 0])
        ->assertUnprocessable()->assertJsonPath('message', 'Revisa los campos indicados.')->assertJsonValidationErrors('rating');
    $this->from(route('store.show', $application))->put(route('reviews.update', $application), ['rating' => 0])
        ->assertRedirect(route('store.show', $application))->assertSessionHasErrors('rating');
});

test('suspended users cannot mutate store data', function () {
    $user = User::factory()->create(['status' => 'suspended']);
    $application = Application::factory()->published()->create();
    $this->actingAs($user)->postJson("/api/v1/applications/{$application->id}/downloads")->assertForbidden();
    $this->patchJson('/api/v1/profile', ['name' => 'No'])->assertForbidden();
    $this->assertDatabaseCount('downloads', 0);
});

test('login clears stale intended destinations and preserves the role landing contract', function (UserRole $role, string $landing) {
    $user = User::factory()->create(['role' => $role]);
    $this->withSession(['url.intended' => route('developer.dashboard')])->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
        ->assertRedirect(route($landing))->assertSessionMissing('url.intended');
})->with([
    [UserRole::User, 'store'],
    [UserRole::Developer, 'store'],
    [UserRole::Admin, 'admin.dashboard'],
]);

test('an unavailable library entry retains history without leaking hidden app details', function () {
    $download = Download::factory()->create();
    $user = User::query()->findOrFail($download->user_id);
    $download->application->category->update(['is_active' => false]);
    $this->actingAs($user)->getJson('/api/v1/library')->assertOk()
        ->assertJsonPath('summary.downloads_count', 1)
        ->assertJsonPath('library.data.0.application', null)
        ->assertJsonPath('library.data.0.available', false);
});

test('likes of hidden applications cannot be changed', function () {
    $review = Review::factory()->create();
    $review->application->update(['status' => 'unpublished', 'published_at' => null]);
    $this->actingAs(User::factory()->create())->putJson("/api/v1/reviews/{$review->id}/like", ['liked' => true])->assertNotFound();
    $this->assertDatabaseCount('review_likes', 0);
});

test('category seeding is repeatable and preserves configured inactive categories', function () {
    Category::factory()->create(['slug' => 'games', 'is_active' => false]);
    $this->seed(CategorySeeder::class);
    $this->seed(CategorySeeder::class);
    $this->assertDatabaseCount('categories', 5);
    $this->getJson('/api/v1/categories')->assertOk()->assertJsonCount(4, 'categories')->assertJsonMissing(['slug' => 'games']);
});
