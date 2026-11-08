<?php

namespace Tests\Feature;

use App\Models\MarketingCampaign;
use App\Models\Customer;
use App\Models\Sale;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DescriptiveAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_summary_returns_the_global_kpis(): void
    {
        $this->seed();

        $res = $this->getJson('/api/analytics/descriptive/summary')->assertOk()->json();

        $this->assertEqualsWithDelta((float) Sale::sum('total_amount'), $res['total_revenue'], 0.01);
        $this->assertSame(Sale::count(), $res['orders']);
        $this->assertEqualsWithDelta(
            (float) Sale::sum('total_amount') / Sale::count(),
            $res['average_order_value'],
            0.01
        );
        $this->assertEqualsWithDelta((float) MarketingCampaign::sum('spend'), $res['total_spend'], 0.01);
        $this->assertEqualsWithDelta(
            (float) Sale::sum('total_amount') / MarketingCampaign::sum('spend'),
            $res['revenue_per_peso'],
            0.01
        );
    }

    public function test_trend_covers_every_campaign_week_with_matching_aggregates(): void
    {
        $this->seed();

        $res = $this->getJson('/api/analytics/descriptive/trend')->assertOk()->json();

        $this->assertSame(MarketingCampaign::count(), count($res['data']));

        $firstWeek = MarketingCampaign::orderBy('week_start')->first();
        $row = collect($res['data'])->firstWhere('week_start', $firstWeek->week_start->toDateString());
        $expectedRevenue = (float) Sale::where('campaign_id', $firstWeek->id)->sum('total_amount');

        $this->assertEqualsWithDelta($expectedRevenue, $row['revenue'], 0.01);
        $this->assertEqualsWithDelta((float) $firstWeek->spend, $row['spend'], 0.01);
        $this->assertSame(Sale::where('campaign_id', $firstWeek->id)->count(), $row['orders']);
    }

    public function test_by_channel_reconciles_with_the_seeded_sales(): void
    {
        $this->seed();

        $res = $this->getJson('/api/analytics/descriptive/by-channel')->assertOk()->json();

        $this->assertSame(4, count($res['data']));
        foreach (\App\Support\Catalog::CHANNELS as $channel) {
            $row = collect($res['data'])->firstWhere('channel', $channel);
            if ($row === null) {
                continue;
            }
            $expectedRevenue = (float) Sale::whereHas('campaign', fn ($q) => $q->where('channel', $channel))
                ->sum('total_amount');
            $this->assertEqualsWithDelta($expectedRevenue, $row['revenue'], 0.01);
            $this->assertGreaterThan(0, $row['spend']);
            $this->assertEqualsWithDelta($row['revenue'] / $row['spend'], $row['revenue_per_peso'], 0.01);
        }
    }

    public function test_statistics_are_ordered_and_order_value_mean_matches_aov(): void
    {
        $this->seed();

        $res = $this->getJson('/api/analytics/descriptive/statistics')->assertOk()->json();

        foreach (['weekly_revenue', 'weekly_spend', 'discount_percent', 'order_value'] as $series) {
            $s = $res[$series];
            $this->assertLessThanOrEqual($s['max'], $s['min']);
            $this->assertGreaterThanOrEqual($s['min'], $s['median']);
            $this->assertEqualsWithDelta($s['max'] - $s['min'], $s['range'], 0.01);
            $this->assertGreaterThan(0, $s['sd']);
        }

        $aov = (float) Sale::sum('total_amount') / Sale::count();
        $this->assertEqualsWithDelta($aov, $res['order_value']['mean'], 0.01);
        $this->assertEqualsWithDelta(MarketingCampaign::count(), $res['weekly_revenue']['n'], 0.01);
    }

    public function test_correlation_matrix_is_symmetric_with_unit_diagonal(): void
    {
        $this->seed();

        $res = $this->getJson('/api/analytics/descriptive/correlation')->assertOk()->json();

        $this->assertSame(4, count($res['variables']));
        $m = $res['matrix'];
        $this->assertSame(4, count($m));

        foreach ($m as $i => $row) {
            $this->assertEqualsWithDelta(1.0, $row[$i], 0.0001);
            foreach ($row as $j => $v) {
                $this->assertEqualsWithDelta($m[$j][$i], $v, 0.0001);
                $this->assertGreaterThan(-1.01, $v);
                $this->assertLessThan(1.01, $v);
            }
        }

        // the seeders build spend↔revenue strongly positive and discount↔orders positive
        $spendRev = $m[array_search('spend', $res['variables'])][array_search('revenue', $res['variables'])];
        $this->assertGreaterThan(0.6, $spendRev);

        $discOrders = $m[array_search('discount_percent', $res['variables'])][array_search('orders', $res['variables'])];
        $this->assertGreaterThan(0.2, $discOrders);
    }

    public function test_filters_change_every_result(): void
    {
        $this->seed();

        $totalRevenue = (float) Sale::sum('total_amount');

        $filtered = $this->getJson('/api/analytics/descriptive/summary?'.http_build_query([
            'channel' => 'TikTok Creator Collabs',
        ]))->assertOk()->json();

        $this->assertLessThan($totalRevenue, $filtered['total_revenue']);
        $this->assertEqualsWithDelta(
            (float) Sale::whereHas('campaign', fn ($q) => $q->where('channel', 'TikTok Creator Collabs'))->sum('total_amount'),
            $filtered['total_revenue'],
            0.01
        );

        // trend with a channel filter only carries that channel's sales
        $trend = $this->getJson('/api/analytics/descriptive/trend?'.http_build_query([
            'channel' => 'TikTok Creator Collabs',
        ]))->assertOk()->json();
        $this->assertEqualsWithDelta(
            (float) Sale::whereHas('campaign', fn ($q) => $q->where('channel', 'TikTok Creator Collabs'))->sum('total_amount'),
            collect($trend['data'])->sum('revenue'),
            0.01
        );
    }

    public function test_customers_and_by_category_return_filled_breakdowns(): void
    {
        $this->seed();

        $res = $this->getJson('/api/analytics/descriptive/customers')->assertOk()->json();

        $this->assertSame(4, count($res['by_type']));
        $this->assertSame(3, count($res['by_tier']));
        $this->assertEqualsWithDelta(
            (float) Sale::sum('total_amount'),
            collect($res['by_type'])->sum('revenue'),
            0.01
        );
        // every seeded customer bought at least once, so each segment's count
        // should match the customers table for the older members
        $totalCustomers = collect($res['by_type'])->sum('customers');
        $this->assertLessThanOrEqual(Customer::count(), $totalCustomers);

        $cat = $this->getJson('/api/analytics/descriptive/by-category')->assertOk()->json();
        $this->assertSame(5, count($cat['data']));
        $this->assertSame(10, count($cat['top_products']));
        $this->assertGreaterThan($cat['top_products'][1]['revenue'], $cat['top_products'][0]['revenue']);
    }
}
