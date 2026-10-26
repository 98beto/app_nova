<?php

namespace App\Http\Controllers;

use App\Http\Requests\CatalogueRequest;
use App\Models\Application;
use App\Services\StoreQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function index(CatalogueRequest $request, StoreQuery $query): JsonResponse|Response
    {
        $data = $query->catalogue($request, $request->validated());

        return $request->is('api/*') || $request->expectsJson() ? response()->json($data) : Inertia::render('store/Index', $data);
    }

    public function show(Request $request, Application $application, StoreQuery $query): JsonResponse|Response
    {
        $request->validate(['reviews_page' => ['sometimes', 'integer', 'min:1']]);
        $data = $query->detail($request, $application);

        return $request->is('api/*') || $request->expectsJson() ? response()->json($data) : Inertia::render('store/Show', $data);
    }

    public function categories(StoreQuery $query): JsonResponse
    {
        return response()->json(['categories' => $query->categories()]);
    }
}
