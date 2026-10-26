<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;

class PublishApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Developer;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:20000'],
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')->where('is_active', true)],
            'minimum_age' => ['required', 'integer', 'between:0,18'],
            'price' => ['required', 'numeric', 'decimal:0,2', 'between:0,9999999999.99'],
            'icon' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'screenshots' => ['required', 'array', 'size:4', 'list'],
            'screenshots.*' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'binary' => ['prohibited'],
            'status' => ['prohibited'],
            'published_at' => ['prohibited'],
            'developer_id' => ['prohibited'],
        ];
    }

    /** @return array{name: string, description: string, category_id: int, minimum_age: int, price: numeric-string, icon: UploadedFile, screenshots: array<UploadedFile>} */
    public function publicationData(): array
    {
        return [
            'name' => $this->validated('name'),
            'description' => $this->validated('description'),
            'category_id' => $this->integer('category_id'),
            'minimum_age' => $this->integer('minimum_age'),
            'price' => $this->validated('price'),
            'icon' => $this->validated('icon'),
            'screenshots' => $this->validated('screenshots'),
        ];
    }
}
