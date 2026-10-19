<?php

use App\Enums\UserRole;
use App\Models\User;

test('redirige a los visitantes desde la página de inicio al inicio de sesión', function () {
    $this->get(route('home'))->assertRedirect(route('login'));
});

test('redirige a los usuarios autenticados desde la página de inicio según su rol', function (
    UserRole $role,
    string $routeName,
) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get(route('home'))
        ->assertRedirect(route($routeName));
})->with([
    'usuario' => [UserRole::User, 'store'],
    'desarrollador' => [UserRole::Developer, 'developer.dashboard'],
    'administrador' => [UserRole::Admin, 'admin.dashboard'],
]);
