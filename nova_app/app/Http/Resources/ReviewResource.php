<?php

namespace App\Http\Resources;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Review */
class ReviewResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'application_id' => $this->application_id,
            'author' => ['id' => $this->user->id, 'name' => $this->user->name, 'avatar_url' => $this->user->avatar_path === null ? null : Storage::disk('public')->url($this->user->avatar_path)],
            'rating' => $this->rating,
            'body' => $this->body,
            'likes_count' => (int) $this->likes_count,
            'liked' => (bool) $this->liked,
            'is_own' => $this->user_id === $request->user()?->id,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
