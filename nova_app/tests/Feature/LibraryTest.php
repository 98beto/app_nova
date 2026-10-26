<?php

use App\Enums\UserRole;
use App\Models\Download;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

test('library web and API paginate only the authenticated users installs for both store roles', function (UserRole $role) {
    $user = User::factory()->create(['role' => $role]);
    $other = Download::factory()->create();
    $oldest = Download::factory()->create(['user_id' => $user->id, 'downloaded_at' => '2026-01-01']);
    $downloads = Download::factory()->count(12)->create(['user_id' => $user->id, 'downloaded_at' => '2026-02-01']);
    $url = '/api/v1/library?user_id='.$other->user_id.'&page=9&reviews_page=8';

    $this->actingAs($user)->getJson($url)->assertOk()
        ->assertJsonCount(12, 'library.data')->assertJsonPath('library.data.0.id', $downloads->last()->id)
        ->assertJsonPath('library.data.11.id', $downloads->first()->id)
        ->assertJsonPath('library.data.0.application.installed', true)
        ->assertJsonPath('library.meta', ['current_page' => 1, 'last_page' => 2, 'per_page' => 12, 'total' => 13])
        ->assertJsonPath('summary', ['downloads_count' => 13])
        ->assertJsonMissingPath('profile')->assertJsonMissingPath('reviews');
    $second = $this->getJson($url.'&library_page=2')->assertOk()
        ->assertJsonCount(1, 'library.data')->assertJsonPath('library.data.0.id', $oldest->id)
        ->assertJsonPath('library.meta.current_page', 2)->assertJsonPath('summary.downloads_count', 13);
    $this->get(route('library.index', ['library_page' => 2, 'reviews_page' => 8]))
        ->assertInertia(fn (AssertableInertia $page) => $page->component('library/Index')
            ->where('library', $second->json('library'))->where('summary', $second->json('summary'))
            ->missing('profile')->missing('reviews'));
    $this->getJson('/api/v1/library?library_page=3')->assertOk()
        ->assertJsonCount(0, 'library.data')->assertJsonPath('summary.downloads_count', 13);
})->with([UserRole::User, UserRole::Developer]);

test('profile keeps reviews and counts without fetching installed applications or download rows', function () {
    $review = Review::factory()->create();
    $user = $review->user;
    $this->actingAs($user);
    DB::enableQueryLog();

    try {
        $this->getJson('/api/v1/profile?library_page=2')->assertOk()
            ->assertJsonMissingPath('library')->assertJsonPath('summary.downloads_count', 1)
            ->assertJsonPath('summary.reviews_count', 1)->assertJsonPath('reviews.data.0.id', $review->id);
        $queries = collect(DB::getQueryLog())->pluck('query');
        expect($queries->filter(fn (string $sql) => str_contains($sql, 'from "applications"')))->toBeEmpty();
        expect($queries->filter(fn (string $sql) => str_contains($sql, 'from "downloads"') && ! str_contains($sql, 'count(*)')))->toBeEmpty();
    } finally {
        DB::disableQueryLog();
        DB::flushQueryLog();
    }

    $this->get(route('profile.show'))->assertInertia(fn (AssertableInertia $page) => $page
        ->component('profile/Show')->missing('library')->where('summary.downloads_count', 1)->has('reviews.data', 1));
    $this->patchJson('/api/v1/profile', ['name' => 'Updated'])->assertOk()
        ->assertJsonMissingPath('library')->assertJsonPath('profile.name', 'Updated')->assertJsonPath('summary.downloads_count', 1);
});

test('empty library returns an isolated empty bundle', function () {
    $this->actingAs(User::factory()->create())->getJson('/api/v1/library')->assertOk()
        ->assertExactJson(['library' => ['data' => [], 'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 12, 'total' => 0]], 'summary' => ['downloads_count' => 0]]);
});

test('library requires authentication on web and API', function () {
    $this->get(route('library.index'))->assertRedirect(route('login'));
    $this->getJson('/api/v1/library')->assertUnauthorized();
});

test('library forbids administrators and inactive store accounts', function (string $role, string $status) {
    $this->actingAs(User::factory()->create(['role' => $role, 'status' => $status]))
        ->get(route('library.index'))->assertForbidden();
    $this->getJson('/api/v1/library')->assertForbidden();
})->with([
    ['admin', 'active'], ['user', 'suspended'], ['developer', 'suspended'], ['user', 'disabled'], ['developer', 'disabled'],
]);

test('library validates its positive integer page parameter', function (string $page) {
    $this->actingAs(User::factory()->create())->getJson('/api/v1/library?library_page='.$page)
        ->assertUnprocessable()->assertJsonValidationErrors('library_page');
    $this->get(route('library.index', ['library_page' => $page]))->assertSessionHasErrors('library_page');
})->with(['0', '-1', '1.5', 'invalid']);

test('profile reviews paginate independently of obsolete library parameters', function () {
    $user = User::factory()->create();
    $reviews = Review::factory()->count(11)->create(['user_id' => $user->id]);

    $this->actingAs($user)->getJson('/api/v1/profile?reviews_page=2&library_page=999')->assertOk()
        ->assertJsonMissingPath('library')->assertJsonCount(1, 'reviews.data')
        ->assertJsonPath('reviews.data.0.id', $reviews->first()->id)
        ->assertJsonPath('reviews.meta.current_page', 2)->assertJsonPath('summary.downloads_count', 11);
});
