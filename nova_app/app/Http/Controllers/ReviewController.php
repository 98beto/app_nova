<?php

namespace App\Http\Controllers;

use App\Actions\SaveReview;
use App\Actions\SetReviewLike;
use App\Http\Resources\ReviewResource;
use App\Models\Application;
use App\Models\Review;
use App\Services\StoreQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function update(Request $request, Application $application, SaveReview $save, StoreQuery $query): JsonResponse|RedirectResponse
    {
        $data = $request->validate(['rating' => ['required', 'integer', 'between:1,5'], 'body' => ['nullable', 'string', 'max:5000']]);
        $save($request->user(), $application, $data);

        return $request->is('api/*') || $request->expectsJson() ? response()->json($query->detail($request, $application)) : redirect()->route('store.show', $application);
    }

    public function like(Request $request, Review $review, SetReviewLike $setLike, StoreQuery $query): JsonResponse|RedirectResponse
    {
        $data = $request->validate(['liked' => ['required', 'boolean'], 'reviews_page' => ['sometimes', 'integer', 'min:1']]);
        $setLike($request->user(), $review, $request->boolean('liked'));

        return $request->is('api/*') || $request->expectsJson()
            ? response()->json(['review' => (new ReviewResource($query->reviews($request->user())->whereKey($review->id)->firstOrFail()))->resolve($request)])
            : redirect()->route('store.show', ['application' => $review->application_id] + (isset($data['reviews_page']) ? ['reviews_page' => $data['reviews_page']] : []));
    }
}
