<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Auth\AuthenticationAuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthenticatedSessionController extends Controller
{
    public function store(LoginRequest $request, AuthenticationAuditLogger $auditLogger): JsonResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        /** @var User $user */
        $user = $request->user();
        $auditLogger->record('login', $user, $request);

        return response()->json([
            'message' => 'Sesión iniciada correctamente.',
            'data' => new UserResource($user->loadMissing('developerProfile')),
        ]);
    }

    public function show(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'message' => 'Usuario autenticado.',
            'data' => new UserResource($user->loadMissing('developerProfile')),
        ]);
    }

    public function destroy(Request $request, AuthenticationAuditLogger $auditLogger): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        $auditLogger->record('logout', $user, $request);

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        Auth::forgetGuards();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
            'data' => null,
        ]);
    }
}
