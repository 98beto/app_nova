<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CatalogueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:140'],
            'free' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(['newest', 'rating', 'downloads', 'trending'])],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
