<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    public $timestamps = false;

    protected $fillable = ['name', 'category', 'price', 'cost'];

    protected $casts = ['price' => 'decimal:2', 'cost' => 'decimal:2'];

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
