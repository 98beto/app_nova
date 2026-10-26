<?php

namespace App\Models;

use Database\Factories\ApplicationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property Carbon|null $published_at
 * @property int $trending_downloads_count
 * @property float|null $reviews_avg_rating
 * @property bool $installed
 */
#[Fillable(['developer_id', 'category_id', 'name', 'slug', 'icon_path', 'description', 'minimum_age', 'price', 'status', 'published_at'])]
class Application extends Model
{
    /** @use HasFactory<ApplicationFactory> */
    use HasFactory;

    /** @return BelongsTo<DeveloperProfile, $this> */
    public function developer(): BelongsTo
    {
        return $this->belongsTo(DeveloperProfile::class, 'developer_id');
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return HasMany<ApplicationScreenshot, $this> */
    public function screenshots(): HasMany
    {
        return $this->hasMany(ApplicationScreenshot::class)->orderBy('position');
    }

    /** @return HasMany<Download, $this> */
    public function downloads(): HasMany
    {
        return $this->hasMany(Download::class);
    }

    /** @return HasMany<Review, $this> */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /** @param Builder<Application> $query */
    #[Scope]
    protected function visible(Builder $query): void
    {
        $query->where('status', 'approved')->whereNotNull('published_at')
            ->where('published_at', '<=', now())->whereNotNull('icon_path')
            ->has('screenshots', '=', 4)
            ->whereHas('category', fn (Builder $category) => $category->where('is_active', true))
            ->whereHas('developer.user', fn (Builder $user) => $user->where('status', 'active')->where('role', 'developer'));
    }

    protected function casts(): array
    {
        return ['price' => 'decimal:2', 'minimum_age' => 'integer', 'published_at' => 'datetime'];
    }
}
