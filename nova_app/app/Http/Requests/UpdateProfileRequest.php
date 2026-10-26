<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, [UserRole::User, UserRole::Developer], true);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users')->ignore($this->user()?->id)],
            'gender' => ['sometimes', 'required', Rule::in(['male', 'female', 'non_binary', 'prefer_not_to_say'])],
            'birth_date' => ['sometimes', 'required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'avatar' => ['sometimes', 'required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'company_name' => $this->user()?->role === UserRole::Developer ? ['sometimes', 'required', 'string', 'max:255'] : ['prohibited'],
            'role' => ['prohibited'],
            'status' => ['prohibited'],
            'payment_status' => ['prohibited'],
            'activated_at' => ['prohibited'],
            'developer_profile' => ['prohibited'],
            'avatar_path' => ['prohibited'],
        ];
    }
}
