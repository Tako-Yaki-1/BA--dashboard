<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    public $timestamps = false;

    protected $fillable = ['name', 'customer_type', 'loyalty_tier', 'city', 'joined_date'];

    protected $casts = ['joined_date' => 'date'];

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}
