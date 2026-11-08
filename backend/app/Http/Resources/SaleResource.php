<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'customer_name' => $this->whenLoaded('customer', fn () => $this->customer->name),
            'campaign_id' => $this->campaign_id,
            'channel' => $this->whenLoaded('campaign', fn () => $this->campaign?->channel),
            'week_start' => $this->whenLoaded('campaign', fn () => $this->campaign?->week_start?->toDateString()),
            'order_date' => $this->order_date->toDateString(),
            'payment_method' => $this->payment_method,
            'total_amount' => (float) $this->total_amount,
        ];
    }
}
