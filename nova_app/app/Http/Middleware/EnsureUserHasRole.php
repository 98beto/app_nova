<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $expectedRoles = array_filter(array_map(UserRole::tryFrom(...), $roles));

        abort_unless(
            in_array($request->user()?->role, $expectedRoles, true),
            403,
            'No tienes permiso para acceder a esta sección.',
        );

        return $next($request);
    }
}
