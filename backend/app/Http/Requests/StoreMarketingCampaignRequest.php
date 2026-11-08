<?php

namespace App\Http\Requests;

use App\Support\Catalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMarketingCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'week_start' => ['required', 'date', 'unique:marketing_campaigns,week_start'],
            'channel' => ['required', 'in:'.implode(',', Catalog::CHANNELS)],
            'spend' => ['required', 'numeric', 'min:0'],
            'discount_percent' => ['required', 'numeric', 'between:0,100'],
            'reach' => ['required', 'integer', 'min:0'],
        ];
    }
}
