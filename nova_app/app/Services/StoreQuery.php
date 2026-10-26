<?php

namespace App\Services;

use App\Http\Resources\ApplicationResource;
use App\Http\Resources\ReviewResource;
use App\Http\Resources\UserResource;
use App\Models\Application;
use App\Models\Category;
use App\Models\Download;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class StoreQuery
{
    /** @return Builder<Application> */
    public function applications(?User $user): Builder
    {
        $userId = $user->id ?? 0;

        return Application::query()->with(['category', 'developer', 'screenshots'])
            ->withCount(['downloads', 'reviews', 'downloads as trending_downloads_count' => fn (Builder $query) => $query->where('downloaded_at', '>=', now()->subDays(7))->where('downloaded_at', '<=', now())])
            ->withAvg('reviews', 'rating')
            ->withExists(['downloads as installed' => fn (Builder $query) => $query->where('user_id', $userId)]);
    }

    /** @return Builder<Review> */
    public function reviews(?User $user): Builder
    {
        $userId = $user->id ?? 0;

        return Review::query()->with('user')->withCount('likes')
            ->withExists(['likes as liked' => fn (Builder $query) => $query->where('users.id', $userId)]);
    }

    /** @return array<int, array<string, mixed>> */
    public function categories(): array
    {
        return Category::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug', 'description'])->toArray();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function catalogue(Request $request, array $filters): array
    {
        $query = $this->applications($request->user())->visible();
        if (($filters['search'] ?? '') !== '') {
            $term = '%'.mb_strtolower($filters['search']).'%';
            $query->where(fn (Builder $query) => $query->whereRaw('LOWER(name) LIKE ?', [$term])->orWhereRaw('LOWER(description) LIKE ?', [$term]));
        }
        if (($filters['category'] ?? '') !== '') {
            $query->whereHas('category', fn (Builder $query) => $query->where('slug', $filters['category']));
        }
        if (isset($filters['free'])) {
            $query->where('price', filter_var($filters['free'], FILTER_VALIDATE_BOOLEAN) ? '=' : '>', 0);
        }
        match ($filters['sort'] ?? 'newest') {
            'rating' => $query->orderByRaw('COALESCE((select AVG(rating) from reviews where reviews.application_id = applications.id), 0) DESC'),
            'downloads' => $query->orderByDesc('downloads_count'),
            'trending' => $query->orderByDesc('trending_downloads_count'),
            default => $query->orderByDesc('published_at'),
        };

        $data = [
            'applications' => $this->applicationPage($query->orderByDesc('id')->paginate(12)->withQueryString(), $request),
            'categories' => $this->categories(),
            'filters' => ['search' => $filters['search'] ?? '', 'category' => $filters['category'] ?? null, 'free' => isset($filters['free']) ? filter_var($filters['free'], FILTER_VALIDATE_BOOLEAN) : null, 'sort' => $filters['sort'] ?? 'newest'],
        ];
        if (($filters['search'] ?? '') === '' && ($filters['category'] ?? '') === '' && ! isset($filters['free']) && ($filters['sort'] ?? 'newest') === 'newest') {
            $data['popular'] = ApplicationResource::collection($this->applications($request->user())->visible()->orderByDesc('downloads_count')->orderByDesc('id')->limit(4)->get())->resolve($request);
            $data['trending'] = ApplicationResource::collection($this->applications($request->user())->visible()->orderByDesc('trending_downloads_count')->orderByDesc('id')->limit(4)->get())->resolve($request);
        }

        return $data;
    }

    /** @return array<string, mixed> */
    public function detail(Request $request, Application $application): array
    {
        $userId = $request->user()->id ?? 0;
        $application = $this->applications($request->user())->visible()->whereKey($application->id)->firstOrFail();
        $reviews = $this->reviews($request->user())->where('application_id', $application->id)->orderByDesc('id')->paginate(10, ['*'], 'reviews_page');

        return [
            'application' => (new ApplicationResource($application))->resolve($request),
            'reviews' => ['data' => ReviewResource::collection($reviews->getCollection())->resolve($request), 'meta' => $this->meta($reviews)],
            'own_review' => ($own = $this->reviews($request->user())->where('application_id', $application->id)->where('user_id', $userId)->first()) === null ? null : (new ReviewResource($own))->resolve($request),
            'similar' => ApplicationResource::collection($this->applications($request->user())->visible()->where('category_id', $application->category_id)->whereKeyNot($application->id)->latest('published_at')->orderByDesc('id')->limit(4)->get())->resolve($request),
            'same_developer' => ApplicationResource::collection($this->applications($request->user())->visible()->where('developer_id', $application->developer_id)->whereKeyNot($application->id)->latest('published_at')->orderByDesc('id')->limit(4)->get())->resolve($request),
        ];
    }

    /** @return array<string, mixed> */
    public function developer(Request $request): array
    {
        $developerId = $request->user()?->developerProfile?->id;
        $query = $this->applications($request->user())->where('developer_id', $developerId ?? 0);
        $ids = Application::query()->where('developer_id', $developerId ?? 0)->select('id');

        return [
            'applications' => $this->applicationPage($query->orderByDesc('id')->paginate(12), $request),
            'categories' => $this->categories(),
            'summary' => [
                'applications_count' => Application::query()->where('developer_id', $developerId ?? 0)->count(),
                'published_count' => Application::query()->visible()->where('developer_id', $developerId ?? 0)->count(),
                'downloads_count' => Download::query()->whereIn('application_id', $ids)->count(),
                'reviews_count' => Review::query()->whereIn('application_id', $ids)->count(),
                'average_rating' => ($rating = Review::query()->whereIn('application_id', $ids)->avg('rating')) === null ? null : round((float) $rating, 2),
            ],
        ];
    }

    /** @return array<string, mixed> */
    public function profile(Request $request): array
    {
        $user = $request->user();
        $reviews = $this->reviews($user)->where('user_id', $user->id)->latest('id')->paginate(10, ['*'], 'reviews_page');

        return [
            'profile' => (new UserResource($user->load('developerProfile')))->resolve($request),
            'reviews' => ['data' => ReviewResource::collection($reviews->getCollection())->resolve($request), 'meta' => $this->meta($reviews)],
            'summary' => ['downloads_count' => Download::query()->where('user_id', $user->id)->count(), 'reviews_count' => $reviews->total()],
        ];
    }

    /** @return array<string, mixed> */
    public function library(Request $request): array
    {
        $user = $request->user();
        $library = Download::query()->where('user_id', $user->id)->orderByDesc('downloaded_at')->orderByDesc('id')->paginate(12, ['*'], 'library_page');
        $applications = $this->applications($user)->visible()->whereIn('id', $library->getCollection()->pluck('application_id'))->get()->keyBy('id');

        return [
            'library' => [
                'data' => $library->getCollection()->map(fn (Download $download): array => [
                    'id' => $download->id,
                    'application_id' => $download->application_id,
                    'downloaded_at' => $download->downloaded_at->toISOString(),
                    'application' => isset($applications[$download->application_id]) ? (new ApplicationResource($applications[$download->application_id]))->resolve($request) : null,
                    'available' => isset($applications[$download->application_id]),
                ])->all(),
                'meta' => $this->meta($library),
            ],
            'summary' => ['downloads_count' => $library->total()],
        ];
    }

    /**
     * @param  LengthAwarePaginator<int, Application>  $page
     * @return array<string, mixed>
     */
    private function applicationPage(LengthAwarePaginator $page, Request $request): array
    {
        return ['data' => ApplicationResource::collection($page->getCollection())->resolve($request), 'meta' => $this->meta($page)];
    }

    /**
     * @param  LengthAwarePaginator<int, covariant \Illuminate\Database\Eloquent\Model>  $page
     * @return array{current_page: int, last_page: int, per_page: int, total: int}
     */
    private function meta(LengthAwarePaginator $page): array
    {
        return ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()];
    }
}
