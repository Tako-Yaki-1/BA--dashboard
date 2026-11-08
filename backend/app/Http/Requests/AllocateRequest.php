<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AllocateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'total_budget' => ['required', 'numeric', 'min:1'],
            // four channels: share bounds have to leave room for each other
            'min_share' => ['nullable', 'numeric', 'between:0,25'],
            'max_share' => ['nullable', 'numeric', 'between:25,100', 'gte:min_share'],
        ];
    }

    public function messages(): array
    {
        return [
            'total_budget.min' => 'The budget must be at least P1.',
            'min_share.between' => 'Minimum share must be 0–25% (four channels share the budget).',
            'max_share.between' => 'Maximum share must be 25–100% (four channels share the budget).',
            'max_share.gte' => 'The maximum share cannot be lower than the minimum share.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'min_share' => $this->input('min_share', 10.0),
            'max_share' => $this->input('max_share', 40.0),
        ]);
    }
}
