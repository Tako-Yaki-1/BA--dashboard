<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketingCampaign extends Model
{
    public $timestamps = false;

    protected $fillable = ['week_start', 'channel', 'spend', 'discount_percent', 'reach'];

    protected $casts = [
        'week_start' => 'date',
        'spend' => 'decimal:2',
        'discount_percent' => 'decimal:2',
    ];

    public function sales()
    {
        // FK is campaign_id on the sales table (column name differs from the model name)
        return $this->hasMany(Sale::class, 'campaign_id');
    }
}
