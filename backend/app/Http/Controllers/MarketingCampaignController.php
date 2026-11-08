<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMarketingCampaignRequest;
use App\Http\Requests\UpdateMarketingCampaignRequest;
use App\Http\Resources\MarketingCampaignResource;
use App\Models\MarketingCampaign;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MarketingCampaignController extends Controller
{
    private const SORTABLE = ['id', 'week_start', 'channel', 'spend', 'discount_percent', 'reach'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = MarketingCampaign::query()
            ->when($request->filled('q'), fn ($q) => $q->where('channel', 'like', '%'.$request->string('q').'%'))
            ->when($request->filled('channel'), fn ($q) => $q->where('channel', $request->input('channel')))
            ->when($request->filled('week_from'), fn ($q) => $q->whereDate('week_start', '>=', $request->input('week_from')))
            ->when($request->filled('week_to'), fn ($q) => $q->whereDate('week_start', '<=', $request->input('week_to')));

        $sort = $request->input('sort', 'id');
        $dir = $request->input('dir') === 'desc' ? 'desc' : 'asc';
        if (in_array($sort, self::SORTABLE)) {
            $query->orderBy($sort, $dir);
        }

        return MarketingCampaignResource::collection($query->paginate($request->integer('per_page', 10)));
    }

    public function store(StoreMarketingCampaignRequest $request): MarketingCampaignResource
    {
        return MarketingCampaignResource::make(MarketingCampaign::create($request->validated()));
    }

    public function show(MarketingCampaign $marketing_campaign): MarketingCampaignResource
    {
        return MarketingCampaignResource::make($marketing_campaign);
    }

    public function update(UpdateMarketingCampaignRequest $request, MarketingCampaign $marketing_campaign): MarketingCampaignResource
    {
        $marketing_campaign->update($request->validated());

        return MarketingCampaignResource::make($marketing_campaign);
    }

    public function destroy(MarketingCampaign $marketingCampaign): \Illuminate\Http\Response
    {
        $marketingCampaign->delete();

        return response()->noContent();
    }
}
