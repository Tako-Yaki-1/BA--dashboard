<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PredictRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'spend' => ['required', 'numeric', 'min:0'],
            'discount_percent' => ['required', 'numeric', 'between:0,100'],
        ];
    }

    public function messages(): array
    {
        return [
            'spend.min' => 'Spend cannot be negative.',
            'discount_percent.between' => 'Discount percent must be between 0 and 100.',
        ];
    }
}
