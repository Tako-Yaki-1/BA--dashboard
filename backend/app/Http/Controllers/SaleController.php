<?php

namespace App\Http\Controllers;

use App\Http\Resources\SaleResource;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SaleController extends Controller
{
    /** Read-only: sales headers can be browsed and filtered, but are seeded data. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Sale::query()
            ->with(['customer', 'campaign'])
            ->when($request->filled('q'), fn ($q) => $q->whereHas('customer', fn ($c) => $c->where('name', 'like', '%'.$request->string('q').'%')))
            ->when($request->filled('channel'), fn ($q) => $q->whereHas('campaign', fn ($c) => $c->where('channel', $request->input('channel'))))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('order_date', '>=', $request->input('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('order_date', '<=', $request->input('date_to')));

        $sort = $request->input('sort', 'id');
        $dir = $request->input('dir') === 'desc' ? 'desc' : 'asc';
        if (in_array($sort, ['id', 'order_date', 'payment_method', 'total_amount'])) {
            $query->orderBy($sort, $dir);
        }

        return SaleResource::collection($query->paginate($request->integer('per_page', 10)));
    }

    public function show(Sale $sale): SaleResource
    {
        return SaleResource::make($sale->loadMissing(['customer', 'campaign']));
    }
}
