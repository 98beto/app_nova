<?php

namespace App\Http\Controllers;

use App\Actions\UpdateProfile;
use App\Http\Requests\UpdateProfileRequest;
use App\Services\StoreQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function show(Request $request, StoreQuery $query): JsonResponse|Response
    {
        $request->validate(['library_page' => ['sometimes', 'integer', 'min:1'], 'reviews_page' => ['sometimes', 'integer', 'min:1']]);
        $data = $query->profile($request);

        return $request->is('api/*') || $request->expectsJson() ? response()->json($data) : Inertia::render('profile/Show', $data);
    }

    public function update(UpdateProfileRequest $request, UpdateProfile $update, StoreQuery $query): JsonResponse|RedirectResponse
    {
        $update($request->user(), $request->validated());

        return $request->is('api/*') || $request->expectsJson() ? response()->json($query->profile($request)) : redirect()->route('profile.show');
    }
}
