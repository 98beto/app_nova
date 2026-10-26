<?php

namespace App\Http\Controllers;

use App\Actions\PublishApplication;
use App\Http\Requests\PublishApplicationRequest;
use App\Http\Resources\ApplicationResource;
use App\Models\Application;
use App\Services\StoreQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeveloperApplicationController extends Controller
{
    public function index(Request $request, StoreQuery $query): JsonResponse|RedirectResponse|Response
    {
        if (! $request->is('api/*') && $request->query('publish') === '1') {
            return redirect()->route('developer.applications.create');
        }

        $request->validate(['page' => ['sometimes', 'integer', 'min:1']]);

        if ($request->routeIs('developer.applications.index')) {
            $queryParameters = $request->query();
            unset($queryParameters['publish']);

            return redirect()->route('developer.dashboard', $queryParameters);
        }

        $data = $query->developer($request);

        return $request->is('api/*') || $request->expectsJson() ? response()->json($data) : Inertia::render('developer/Dashboard', $data);
    }

    public function create(Request $request, StoreQuery $query): JsonResponse|Response
    {
        $data = ['categories' => $query->categories()];

        return $request->expectsJson() ? response()->json($data) : Inertia::render('developer/Create', $data);
    }

    public function show(Request $request, Application $application, StoreQuery $query): JsonResponse|Response
    {
        abort_unless($application->developer_id === $request->user()?->developerProfile?->id, 404);
        $application = $query->applications($request->user())->whereKey($application->id)->firstOrFail();
        $data = ['application' => (new ApplicationResource($application))->resolve($request), 'categories' => $query->categories()];

        return $request->is('api/*') || $request->expectsJson() ? response()->json($data) : Inertia::render('developer/Show', $data);
    }

    public function store(PublishApplicationRequest $request, PublishApplication $publish, StoreQuery $query): JsonResponse|RedirectResponse
    {
        $application = $publish($request->user(), $request->publicationData());

        return $request->is('api/*') || $request->expectsJson()
            ? response()->json($query->detail($request, $application), 201)
            : redirect()->route('store.show', $application);
    }
}
