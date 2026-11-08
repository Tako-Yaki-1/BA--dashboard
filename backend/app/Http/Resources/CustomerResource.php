<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'customer_type' => $this->customer_type,
            'loyalty_tier' => $this->loyalty_tier,
            'city' => $this->city,
            'joined_date' => $this->joined_date->toDateString(),
        ];
    }
}
