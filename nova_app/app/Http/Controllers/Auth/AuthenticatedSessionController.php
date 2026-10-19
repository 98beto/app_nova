<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Services\Auth\AuthenticationAuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/Login');
    }

    public function store(LoginRequest $request, AuthenticationAuditLogger $auditLogger): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        /** @var User $user */
        $user = $request->user();
        $auditLogger->record('login', $user, $request);

        return redirect()->to($this->homePath($user));
    }

    public function destroy(Request $request, AuthenticationAuditLogger $auditLogger): RedirectResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        $auditLogger->record('logout', $user, $request);

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        Auth::forgetGuards();

        return redirect()->route('login');
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
