<?php

namespace App\Http\Resources;

use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Application */
class ApplicationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => $this->description,
            'icon_url' => $this->icon_path === null ? null : Storage::disk('public')->url($this->icon_path),
            'minimum_age' => $this->minimum_age,
            'price' => $this->price,
            'is_free' => (float) $this->price === 0.0,
            'status' => $this->status,
            'published_at' => $this->published_at?->toISOString(),
            'category' => ['id' => $this->category->id, 'name' => $this->category->name, 'slug' => $this->category->slug],
            'developer' => ['id' => $this->developer->id, 'company_name' => $this->developer->company_name],
            'screenshots' => $this->screenshots->map(fn ($image): array => ['position' => $image->position, 'url' => Storage::disk('public')->url($image->image_path)])->all(),
            'downloads_count' => (int) $this->downloads_count,
            'trending_downloads_count' => (int) $this->trending_downloads_count,
            'reviews_count' => (int) $this->reviews_count,
            'average_rating' => $this->reviews_avg_rating === null ? null : round((float) $this->reviews_avg_rating, 2),
            'installed' => (bool) $this->installed,
        ];
    }
}
