<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Support\Catalog;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Catalog::PRODUCTS as [$name, $category, $price, $cost]) {
            Product::create([
                'name' => $name,
                'category' => $category,
                'price' => $price,
                'cost' => $cost,
            ]);
        }
    }
}
