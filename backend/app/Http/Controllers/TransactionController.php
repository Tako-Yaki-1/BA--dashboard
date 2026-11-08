<?php

namespace App\Http\Controllers;

use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TransactionController extends Controller
{
    /** Read-only: line items are browsed and filtered, but are seeded data. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Transaction::query()
            ->with(['product', 'sale'])
            // q searches the product name
            ->when($request->filled('q'), fn ($q) => $q->whereHas('product', fn ($p) => $p->where('name', 'like', '%'.$request->string('q').'%')))
            ->when($request->filled('category'), fn ($q) => $q->whereHas('product', fn ($p) => $p->where('category', $request->input('category'))))
            ->when($request->filled('channel'), fn ($q) => $q->whereHas('sale.campaign', fn ($c) => $c->where('channel', $request->input('channel'))))
            ->when($request->filled('date_from'), fn ($q) => $q->whereHas('sale', fn ($s) => $s->whereDate('order_date', '>=', $request->input('date_from'))))
            ->when($request->filled('date_to'), fn ($q) => $q->whereHas('sale', fn ($s) => $s->whereDate('order_date', '<=', $request->input('date_to'))));

        $sort = $request->input('sort', 'id');
        $dir = $request->input('dir') === 'desc' ? 'desc' : 'asc';
        if (in_array($sort, ['id', 'quantity', 'unit_price', 'line_total'])) {
            $query->orderBy($sort, $dir);
        }

        return TransactionResource::collection($query->paginate($request->integer('per_page', 10)));
    }

    public function show(Transaction $transaction): TransactionResource
    {
        return TransactionResource::make($transaction->loadMissing(['product', 'sale']));
    }
}
