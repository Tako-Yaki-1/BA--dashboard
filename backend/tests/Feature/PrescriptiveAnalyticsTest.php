<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\MarketingCampaign;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Transaction;
use App\Support\Catalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PrescriptiveAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_channel_roi_ranks_channels_by_average_return_per_peso(): void
    {
        $this->seed();

        $res = $this->getJson('/api/analytics/prescriptive/channel-roi')->assertOk()->json();

        // every channel shows up exactly once
        $this->assertSame(Catalog::CHANNELS, array_values(array_intersect(Catalog::CHANNELS, array_column($res['data'], 'channel'))));
        $this->assertSame(4, count($res['data']));
        // ranked descending by roi
        $rois = array_column($res['data'], 'roi');
        $sorted = $rois;
        rsort($sorted);
        $this->assertSame($sorted, $rois);

        // each roi equals that channel's revenue / spend, computed independently
        foreach ($res['data'] as $row) {
            $campaignIds = MarketingCampaign::where('channel', $row['channel'])->pluck('id');
            $expectedRevenue = (float) Sale::whereIn('campaign_id', $campaignIds)->sum('total_amount');
            $expectedSpend = (float) MarketingCampaign::where('channel', $row['channel'])->sum('spend');
            $this->assertEqualsWithDelta($expectedRevenue, $row['revenue'], 0.05);
            $this->assertEqualsWithDelta($expectedSpend, $row['spend'], 0.05);
            $this->assertEqualsWithDelta($expectedRevenue / $expectedSpend, $row['roi'], 0.01);
        }
    }

    public function test_allocate_respects_caps_and_sums_to_budget(): void
    {
        $this->seed();

        $res = $this->postJson('/api/analytics/prescriptive/allocate', ['total_budget' => 100000])
            ->assertOk()
            ->json();

        $this->assertSame(4, count($res['allocations']));
        $this->assertEqualsWithDelta(100000, array_sum(array_column($res['allocations'], 'allocated_pesos')), 0.01);

        foreach ($res['allocations'] as $a) {
            $this->assertGreaterThanOrEqual(10.0, $a['share_percent']);
            $this->assertLessThanOrEqual(40.0, $a['share_percent']);
        }

        // the best-ROI channel gets the full cap share
        $best = $this->getJson('/api/analytics/prescriptive/channel-roi')->json('data.0.channel');
        $bestRow = collect($res['allocations'])->first(fn ($a) => $a['channel'] === $best);
        $this->assertEqualsWithDelta(40.0, $bestRow['share_percent'], 0.01);

        // every channel's expected revenue follows roi * allocation
        $rois = collect($this->getJson('/api/analytics/prescriptive/channel-roi')->json('data'))
            ->pluck('roi', 'channel');
        foreach ($res['allocations'] as $a) {
            $this->assertEqualsWithDelta($a['allocated_pesos'] * $rois[$a['channel']], $a['expected_revenue'], 0.01);
        }

        // greedy fill by ROI never does worse than an even split
        $this->assertGreaterThanOrEqual(-0.001, $res['uplift_percent']);
        $this->assertStringContainsString('cap', $res['rule']);
    }

    public function test_allocate_with_custom_bounds(): void
    {
        $this->seed();

        $res = $this->postJson('/api/analytics/prescriptive/allocate', [
            'total_budget' => 80000,
            'min_share' => 20,
            'max_share' => 30,
        ])->assertOk()->json();

        $this->assertEqualsWithDelta(80000, array_sum(array_column($res['allocations'], 'allocated_pesos')), 0.01);
        foreach ($res['allocations'] as $a) {
            $this->assertGreaterThanOrEqual(20.0, $a['share_percent']);
            $this->assertLessThanOrEqual(30.0, $a['share_percent']);
        }
    }

    public function test_allocate_validates(): void
    {
        $this->seed();

        $this->postJson('/api/analytics/prescriptive/allocate', ['total_budget' => -5])
            ->assertUnprocessable()
            ->assertJsonStructure(['message', 'errors' => ['total_budget']]);

        $this->postJson('/api/analytics/prescriptive/allocate', [
            'total_budget' => 1000,
            'min_share' => 50,
            'max_share' => 10,
        ])->assertUnprocessable();
    }

    public function test_what_if_projects_revenue_against_the_baseline(): void
    {
        $this->seed();

        $up = $this->postJson('/api/analytics/prescriptive/what-if', ['pct_change' => 20])->assertOk()->json();
        $this->assertEqualsWithDelta($up['baseline_weekly_budget'] * 1.2, $up['new_weekly_budget'], 0.01);
        $this->assertGreaterThan($up['baseline_weekly_revenue'], $up['projected_weekly_revenue']);

        $down = $this->postJson('/api/analytics/prescriptive/what-if', ['pct_change' => -50])->assertOk()->json();
        $this->assertEqualsWithDelta($down['baseline_weekly_budget'] * 0.5, $down['new_weekly_budget'], 0.01);
        $this->assertLessThan($down['baseline_weekly_revenue'], $down['projected_weekly_revenue']);

        $this->postJson('/api/analytics/prescriptive/what-if', ['pct_change' => 'abc'])
            ->assertUnprocessable();
    }

    public function test_recommendations_are_generated_and_ranked(): void
    {
        $this->seed();

        $res = $this->getJson('/api/analytics/prescriptive/recommendations')->assertOk()->json();

        $this->assertGreaterThanOrEqual(3, count($res['data']));
        $this->assertLessThanOrEqual(5, count($res['data']));

        $ranks = array_column($res['data'], 'rank');
        $this->assertSame(range(1, count($ranks)), $ranks);

        foreach ($res['data'] as $rec) {
            $this->assertArrayHasKey('title', $rec);
            $this->assertArrayHasKey('detail', $rec);
        }
    }

    public function test_process_summary_hands_findings_between_stages(): void
    {
        $this->seed();

        $res = $this->getJson('/api/analytics/process-summary')->assertOk()->json();

        $this->assertSame(['descriptive', 'predictive', 'prescriptive'], array_keys($res['stages']));
        foreach ($res['stages'] as $stage) {
            $this->assertNotEmpty($stage['finding']);
        }
        // the predictive finding hands the spend effect to the prescriptive stage
        $this->assertStringContainsString('P1,000', $res['stages']['predictive']['finding']);
        // the prescriptive decision names the recommended split
        $this->assertStringContainsString('%', $res['stages']['prescriptive']['finding']);
    }

    public function test_counts_endpoint_reports_the_five_tables_for_the_case_study(): void
    {
        $this->seed();

        $res = $this->getJson('/api/meta/counts')->assertOk()->json();

        $this->assertSame(Customer::count(), $res['customers']);
        $this->assertSame(Product::count(), $res['products']);
        $this->assertSame(MarketingCampaign::count(), $res['campaigns']);
        $this->assertSame(Sale::count(), $res['sales']);
        $this->assertSame(Transaction::count(), $res['transactions']);
    }
}
