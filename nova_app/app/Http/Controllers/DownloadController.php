<?php

namespace App\Http\Controllers;

use App\Actions\InstallApplication;
use App\Models\Application;
use App\Services\StoreQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DownloadController extends Controller
{
    public function store(Request $request, Application $application, InstallApplication $install, StoreQuery $query): JsonResponse|RedirectResponse
    {
        $download = $install($request->user(), $application);

        return $request->is('api/*') || $request->expectsJson()
            ? response()->json(['download' => ['id' => $download->id, 'application_id' => $download->application_id, 'downloaded_at' => $download->downloaded_at->toISOString()]] + $query->detail($request, $application))
            : redirect()->route('store.show', $application);
    }
}
