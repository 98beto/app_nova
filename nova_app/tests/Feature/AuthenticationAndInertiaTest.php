<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\AuthenticationEventSummary;
use App\Models\User;
use App\Services\Auth\AuthenticationAuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia;

test('inicia la sesión de un usuario válido y lo redirige a la tienda', function () {
    $user = User::factory()->create();

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
        'remember' => false,
    ]);

    $response->assertRedirect(route('store'));
    $this->assertAuthenticatedAs($user);
});

test('rechaza las credenciales de inicio de sesión inválidas', function () {
    $user = User::factory()->create();

    $this->from(route('login'))
        ->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'incorrect-password',
        ])
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('registra un usuario normal y autentica la nueva cuenta', function () {
    $payload = [
        'name' => 'Nueva Persona',
        'email' => 'new.user@example.com',
        'gender' => 'prefer_not_to_say',
        'birth_date' => '1990-01-01',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::User->value,
    ];

    $response = $this->post(route('register.store'), $payload);

    $response->assertRedirect(route('store'));
    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', [
        'email' => $payload['email'],
        'role' => UserRole::User->value,
    ]);
});

test('registra un desarrollador con un perfil de desarrollador pendiente', function () {
    $payload = [
        'name' => 'Nueva Developer',
        'email' => 'developer@example.com',
        'gender' => 'female',
        'birth_date' => '1992-02-02',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::Developer->value,
        'company_name' => 'Nova Labs',
    ];

    $response = $this->post(route('register.store'), $payload);

    $response->assertRedirect(route('store'));
    $user = User::query()->where('email', $payload['email'])->firstOrFail();

    $this->assertAuthenticatedAs($user);
    $this->assertDatabaseHas('developer_profiles', [
        'user_id' => $user->id,
        'company_name' => $payload['company_name'],
        'payment_status' => 'pending',
    ]);
});

test('valida los campos obligatorios y restringidos del registro', function () {
    $this->from(route('register'))
        ->post(route('register.store'), [
            'name' => '',
            'email' => 'NOT-AN-EMAIL',
            'birth_date' => now()->addDay()->toDateString(),
            'password' => 'short',
            'password_confirmation' => 'different',
            'role' => 'admin',
        ])
        ->assertRedirect(route('register'))
        ->assertSessionHasErrors([
            'name',
            'email',
            'gender',
            'birth_date',
            'password',
            'role',
        ]);

    $this->from(route('register'))
        ->post(route('register.store'), [
            'name' => 'Developer Without Company',
            'email' => 'developer.without.company@example.com',
            'gender' => 'prefer_not_to_say',
            'birth_date' => '1990-01-01',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => UserRole::Developer->value,
        ])
        ->assertRedirect(route('register'))
        ->assertSessionHasErrors('company_name');

    $this->assertDatabaseCount('users', 0);
});

test('cierra la sesión de un usuario autenticado y lo redirige al inicio de sesión', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->delete(route('logout'))
        ->assertRedirect(route('login'));

    $this->assertGuest();
});

test('comparte la tienda pública y protege los paneles por rol', function () {
    $this->get(route('store'))->assertOk();
    foreach (['developer.dashboard', 'admin.dashboard'] as $routeName) {
        $this->get(route($routeName))->assertRedirect(route('login'));
    }

    $routesByRole = [
        UserRole::User->value => [['store'], ['developer.dashboard', 'admin.dashboard']],
        UserRole::Developer->value => [['store', 'developer.dashboard'], ['admin.dashboard']],
        UserRole::Admin->value => [['store', 'admin.dashboard'], ['developer.dashboard']],
    ];

    foreach ($routesByRole as $role => [$allowedRoutes, $forbiddenRoutes]) {
        $user = User::factory()->create(['role' => $role]);

        foreach ($allowedRoutes as $routeName) {
            $this->actingAs($user)->get(route($routeName))->assertOk();
        }
        foreach ($forbiddenRoutes as $routeName) {
            $this->actingAs($user)->get(route($routeName))->assertForbidden();
        }
    }

    foreach ([UserStatus::Suspended, UserStatus::Disabled] as $status) {
        $this->actingAs(User::factory()->state(['status' => $status])->create())
            ->get(route('profile.show'))
            ->assertForbidden();
    }
});

test('renderiza las páginas React de inicio de sesión y registro mediante Inertia', function () {
    $this->get(route('login'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('auth/Login'));

    $this->get(route('register'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('auth/Register'));
});

test('renderiza cada panel React protegido mediante Inertia', function () {
    $pages = [
        UserRole::User->value => ['store', 'store/Index'],
        UserRole::Developer->value => ['developer.dashboard', 'developer/Dashboard'],
        UserRole::Admin->value => ['admin.dashboard', 'admin/Dashboard'],
    ];

    foreach ($pages as $role => [$routeName, $component]) {
        $user = User::factory()->create(['role' => $role]);

        $this->actingAs($user)
            ->get(route($routeName))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component($component)
                ->where('auth.user.id', $user->id)
                ->where('auth.user.role', $role));
    }
});

test('mantiene la auditoría de autenticación y su modelo de vista seguros en SQLite', function () {
    app(AuthenticationAuditLogger::class)->record(
        'login',
        User::factory()->create(),
        Request::create(route('login'), 'POST'),
    );

    expect(Schema::hasTable('authentication_audit_events'))->toBeFalse();
    expect(fn () => AuthenticationEventSummary::query()->get())
        ->toThrow('LogicException', 'only available on PostgreSQL');
});
