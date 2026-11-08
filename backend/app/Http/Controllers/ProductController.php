<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    private const SORTABLE = ['id', 'name', 'category', 'price', 'cost'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::query()
            ->when($request->filled('q'), fn ($q) => $q->where('name', 'like', '%'.$request->string('q').'%'))
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->input('category')));

        $sort = $request->input('sort', 'id');
        $dir = $request->input('dir') === 'desc' ? 'desc' : 'asc';
        if (in_array($sort, self::SORTABLE)) {
            $query->orderBy($sort, $dir);
        }

        return ProductResource::collection($query->paginate($request->integer('per_page', 10)));
    }

    public function store(StoreProductRequest $request): ProductResource
    {
        return ProductResource::make(Product::create($request->validated()));
    }

    public function show(Product $product): ProductResource
    {
        return ProductResource::make($product);
    }

    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $product->update($request->validated());

        return ProductResource::make($product);
    }

    public function destroy(Product $product): \Illuminate\Http\Response
    {
        try {
            $product->delete();
        } catch (QueryException) {
            // the FK on transactions restricts product deletes
            abort(422, 'This product is used in one or more transactions and cannot be deleted.');
        }

        return response()->noContent();
    }
}
