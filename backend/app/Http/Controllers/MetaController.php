<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\MarketingCampaign;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;

class MetaController extends Controller
{
    /**
     * The filter vocabulary the frontend needs for selects and shared filters,
     * plus the range of dates the data actually covers.
     */
    public function __invoke(): JsonResponse
    {
        // min()/max() return raw SQL strings; keep just the date part
        $from = Sale::min('order_date');
        $to = Sale::max('order_date');

        return response()->json([
            'channels' => \App\Support\Catalog::CHANNELS,
            'product_categories' => \App\Support\Catalog::CATEGORIES,
            'customer_types' => \App\Support\Catalog::CUSTOMER_TYPES,
            'loyalty_tiers' => \App\Support\Catalog::LOYALTY_TIERS,
            'date_from' => $from ? substr($from, 0, 10) : null,
            'date_to' => $to ? substr($to, 0, 10) : null,
        ]);
    }

    /** Record counts for the Case Study "data used" section. */
    public function counts(): JsonResponse
    {
        return response()->json([
            'customers' => Customer::count(),
            'products' => Product::count(),
            'campaigns' => MarketingCampaign::count(),
            'sales' => Sale::count(),
            'transactions' => \App\Models\Transaction::count(),
        ]);
    }
}
