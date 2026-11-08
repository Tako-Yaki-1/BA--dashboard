<?php

namespace App\Http\Requests;

use App\Support\Catalog;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // same rules; without "required" an omitted field stays untouched
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'customer_type' => ['sometimes', 'in:'.implode(',', Catalog::CUSTOMER_TYPES)],
            'loyalty_tier' => ['sometimes', 'in:'.implode(',', Catalog::LOYALTY_TIERS)],
            'city' => ['sometimes', 'string', 'max:255'],
            'joined_date' => ['sometimes', 'date'],
        ];
    }
}
