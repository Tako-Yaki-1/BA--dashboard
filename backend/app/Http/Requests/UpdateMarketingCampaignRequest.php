<?php

namespace App\Http\Requests;

use App\Support\Catalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMarketingCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // one campaign per week: keep the current row out of the uniqueness check
            'week_start' => ['sometimes', 'date', Rule::unique('marketing_campaigns', 'week_start')->ignore($this->route('marketing_campaign'))],
            'channel' => ['sometimes', 'in:'.implode(',', Catalog::CHANNELS)],
            'spend' => ['sometimes', 'numeric', 'min:0'],
            'discount_percent' => ['sometimes', 'numeric', 'between:0,100'],
            'reach' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
