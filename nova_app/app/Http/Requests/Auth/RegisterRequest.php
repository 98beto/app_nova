<?php

namespace App\Http\Requests\Auth;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'gender' => ['required', Rule::in(['male', 'female', 'non_binary', 'prefer_not_to_say'])],
            'birth_date' => ['required', 'date', 'before_or_equal:today'],
            'role' => ['required', Rule::enum(UserRole::class)->only([UserRole::User, UserRole::Developer])],
            'company_name' => ['nullable', 'string', 'max:255', Rule::requiredIf($this->input('role') === UserRole::Developer->value)],
        ];
    }
}
