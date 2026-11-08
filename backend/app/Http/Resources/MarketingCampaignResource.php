<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MarketingCampaignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'week_start' => $this->week_start->toDateString(),
            'channel' => $this->channel,
            'spend' => (float) $this->spend,
            'discount_percent' => (float) $this->discount_percent,
            'reach' => $this->reach,
        ];
    }
}
