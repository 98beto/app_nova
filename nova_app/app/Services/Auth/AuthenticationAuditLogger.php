<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class AuthenticationAuditLogger
{
    public function record(string $event, ?User $user, Request $request): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        try {
            DB::statement(
                'CALL public.record_authentication_event(?, ?, CAST(? AS inet), ?)',
                [$user?->getKey(), $event, $request->ip(), $request->userAgent()],
            );
        } catch (Throwable $exception) {
            Log::warning('Unable to record authentication audit event.', [
                'event' => $event,
                'user_id' => $user?->getKey(),
                'exception' => $exception,
            ]);
        }
    }
}
