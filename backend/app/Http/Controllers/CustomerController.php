<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    private const SORTABLE = ['id', 'name', 'customer_type', 'loyalty_tier', 'city', 'joined_date'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Customer::query()
            ->when($request->filled('q'), fn ($q) => $q->where('name', 'like', '%'.$request->string('q').'%'))
            ->when($request->filled('customer_type'), fn ($q) => $q->where('customer_type', $request->input('customer_type')))
            ->when($request->filled('loyalty_tier'), fn ($q) => $q->where('loyalty_tier', $request->input('loyalty_tier')));

        $sort = $request->input('sort', 'id');
        $dir = $request->input('dir') === 'desc' ? 'desc' : 'asc';
        if (in_array($sort, self::SORTABLE)) {
            $query->orderBy($sort, $dir);
        }

        return CustomerResource::collection($query->paginate($request->integer('per_page', 10)));
    }

    public function store(StoreCustomerRequest $request): CustomerResource
    {
        return CustomerResource::make(Customer::create($request->validated()));
    }

    public function show(Customer $customer): CustomerResource
    {
        return CustomerResource::make($customer);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): CustomerResource
    {
        $customer->update($request->validated());

        return CustomerResource::make($customer);
    }

    public function destroy(Customer $customer): \Illuminate\Http\Response
    {
        $customer->delete();

        return response()->noContent();
    }
}
