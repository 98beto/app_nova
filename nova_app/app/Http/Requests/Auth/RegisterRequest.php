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

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre completo es obligatorio.',
            'name.string' => 'El nombre completo debe ser texto.',
            'name.max' => 'El nombre completo no puede superar los 255 caracteres.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'Ingresa un correo electrónico válido.',
            'email.lowercase' => 'El correo electrónico debe escribirse en minúsculas.',
            'email.max' => 'El correo electrónico no puede superar los 255 caracteres.',
            'email.unique' => 'Este correo electrónico ya está registrado.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',
            'password.min' => 'La contraseña debe tener al menos :min caracteres.',
            'avatar.image' => 'La fotografía debe ser una imagen válida.',
            'avatar.mimes' => 'La fotografía debe ser un archivo JPG, PNG o WebP.',
            'avatar.max' => 'La fotografía no puede superar los 5 MB.',
            'gender.required' => 'El género es obligatorio.',
            'gender.in' => 'Selecciona un género válido.',
            'birth_date.required' => 'La fecha de nacimiento es obligatoria.',
            'birth_date.date' => 'Ingresa una fecha de nacimiento válida.',
            'birth_date.before_or_equal' => 'La fecha de nacimiento no puede ser futura.',
            'role.required' => 'El tipo de cuenta es obligatorio.',
            'role.enum' => 'Selecciona el tipo de cuenta usuario o desarrollador.',
            'company_name.required' => 'La empresa es obligatoria para desarrolladores.',
            'company_name.string' => 'El nombre de la empresa debe ser texto.',
            'company_name.max' => 'El nombre de la empresa no puede superar los 255 caracteres.',
        ];
    }
}
