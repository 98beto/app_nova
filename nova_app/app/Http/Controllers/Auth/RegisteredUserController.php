<?php

namespace App\Http\Controllers\Auth;

use App\Actions\CreateUser;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/Register');
    }

    public function store(RegisterRequest $request, CreateUser $createUser): RedirectResponse
    {
        $user = $createUser($request->validated());

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->to($this->homePath($user));
    }

    private function homePath(User $user): string
    {
        return match ($user->role) {
            UserRole::User => route('store'),
            UserRole::Developer => route('developer.dashboard'),
            UserRole::Admin => route('admin.dashboard'),
        };
    }
}
