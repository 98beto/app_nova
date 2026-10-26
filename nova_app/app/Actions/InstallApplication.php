<?php

namespace App\Actions;

use App\Models\Application;
use App\Models\Download;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InstallApplication
{
    public function __invoke(User $user, Application $application): Download
    {
        return DB::transaction(function () use ($user, $application): Download {
            $application = Application::query()->visible()->whereKey($application->id)->lockForUpdate()->firstOrFail();
            if ((float) $application->price !== 0.0) {
                throw ValidationException::withMessages(['application' => 'Las instalaciones de pago aún no están disponibles.']);
            }
            if ($user->birth_date->diffInYears(today(), false) < $application->minimum_age) {
                throw ValidationException::withMessages(['application' => 'No cumples la edad mínima de esta aplicación.']);
            }

            return Download::query()->firstOrCreate(
                ['user_id' => $user->id, 'application_id' => $application->id],
                ['downloaded_at' => now()],
            );
        });
    }
}
