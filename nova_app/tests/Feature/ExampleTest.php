<?php

use App\Enums\UserRole;
use App\Models\User;

test('redirects guests from home to login', function () {
    $this->get(route('home'))->assertRedirect(route('login'));
});

test('redirects authenticated users from home based on their role', function (
    UserRole $role,
    string $routeName,
) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get(route('home'))
        ->assertRedirect(route($routeName));
})->with([
    'user' => [UserRole::User, 'store'],
    'developer' => [UserRole::Developer, 'developer.dashboard'],
    'admin' => [UserRole::Admin, 'admin.dashboard'],
]);
