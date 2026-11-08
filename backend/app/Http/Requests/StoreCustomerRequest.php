<?php

namespace App\Http\Requests;

use App\Support\Catalog;
use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'customer_type' => ['required', 'in:'.implode(',', Catalog::CUSTOMER_TYPES)],
            'loyalty_tier' => ['required', 'in:'.implode(',', Catalog::LOYALTY_TIERS)],
            'city' => ['required', 'string', 'max:255'],
            'joined_date' => ['required', 'date'],
        ];
    }
}
