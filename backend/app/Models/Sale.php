<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    public $timestamps = false;

    protected $fillable = ['customer_id', 'campaign_id', 'order_date', 'payment_method', 'total_amount'];

    protected $casts = ['order_date' => 'date', 'total_amount' => 'decimal:2'];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function campaign()
    {
        return $this->belongsTo(MarketingCampaign::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
