<?php

use App\Enums\UserRole;
use App\Models\User;

test('redirige a los visitantes desde la página de inicio a la tienda', function () {
    $this->get(route('home'))->assertRedirect(route('store'));
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
    'desarrollador' => [UserRole::Developer, 'store'],
    'administrador' => [UserRole::Admin, 'admin.dashboard'],
]);
