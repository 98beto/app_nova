<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin User */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar_url' => $this->avatar_path === null
                ? null
                : Storage::disk('public')->url($this->avatar_path),
            'gender' => $this->gender,
            'birth_date' => $this->birth_date->toDateString(),
            'role' => $this->role->value,
            'status' => $this->status->value,
            'developer_profile' => $this->when(
                $this->role->value === 'developer',
                fn (): array => [
                    'company_name' => $this->developerProfile?->company_name,
                    'payment_status' => $this->developerProfile?->payment_status->value,
                    'activated_at' => $this->developerProfile?->activated_at?->toISOString(),
                ],
            ),
        ];
    }
}
