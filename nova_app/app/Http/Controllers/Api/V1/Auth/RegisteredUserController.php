<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\CreateUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\Auth\AuthenticationAuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class RegisteredUserController extends Controller
{
    public function store(
        RegisterRequest $request,
        CreateUser $createUser,
        AuthenticationAuditLogger $auditLogger,
    ): JsonResponse {
        $user = $createUser($request->validated());

        Auth::login($user);
        $request->session()->regenerate();
        $auditLogger->record('register', $user, $request);

        return response()->json([
            'message' => 'Cuenta creada correctamente.',
            'data' => new UserResource($user),
        ], 201);
    }
}
