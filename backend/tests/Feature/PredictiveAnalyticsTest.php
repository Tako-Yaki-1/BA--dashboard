<?php

namespace Tests\Feature;

use App\Models\MarketingCampaign;
use App\Models\Sale;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PredictiveAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_model_returns_regression_statistics_with_sensible_signs(): void
    {
        $this->seed();

        $res = $this->getJson('/api/analytics/predictive/model')->assertOk()->json();

        $this->assertArrayHasKey('intercept', $res);
        $this->assertSame(['spend', 'discount_percent'], array_keys($res['coefficients']));
        $this->assertGreaterThan(0, $res['coefficients']['spend']); // spend slope must be positive
        $this->assertGreaterThanOrEqual(0, $res['r_squared']);
        $this->assertLessThanOrEqual(1, $res['r_squared']);
        // plan band for the two-predictor model: 0.60–0.85
        $this->assertGreaterThan(0.5, $res['r_squared']);
        $this->assertLessThan(0.95, $res['r_squared']);
        $this->assertGreaterThanOrEqual($res['adjusted_r_squared'], $res['r_squared']);
        $this->assertGreaterThan(0, $res['rmse']);
        $this->assertSame(MarketingCampaign::count(), $res['n_weeks']);

        // plain-language interpretation mentions the per-₱1,000 effect
        $this->assertStringContainsString('P1,000', $res['interpretation']['spend']);
        $this->assertStringContainsString('discount', $res['interpretation']['discount_percent']);
    }

    public function test_actual_vs_predicted_follows_the_model_equation(): void
    {
        $this->seed();

        $model = $this->getJson('/api/analytics/predictive/model')->assertOk()->json();
        $res = $this->getJson('/api/analytics/predictive/actual-vs-predicted')->assertOk()->json();

        $this->assertSame(MarketingCampaign::count(), count($res['data']));

        $first = $res['data'][0];
        $expected = $model['intercept']
            + $model['coefficients']['spend'] * $first['spend']
            + $model['coefficients']['discount_percent'] * $first['discount_percent'];
        $this->assertEqualsWithDelta($expected, $first['predicted'], 0.5);

        $expectedRevenue = (float) Sale::where('campaign_id', MarketingCampaign::orderBy('week_start')->first()->id)->sum('total_amount');
        $this->assertEqualsWithDelta($expectedRevenue, $first['actual'], 0.01);
    }

    public function test_forecast_projects_the_next_four_monday_weeks(): void
    {
        $this->seed();

        $res = $this->getJson('/api/analytics/predictive/forecast')->assertOk()->json();

        $this->assertSame(4, count($res['data']));
        $this->assertSame('simple trend projection', $res['method']);

        $lastWeek = MarketingCampaign::orderBy('week_start', 'desc')->first()->week_start->toDateString();
        $firstForecast = $res['data'][0];

        // the first projected Monday is exactly 7 days after the last observed week
        $expectedFirst = \Carbon\Carbon::parse($lastWeek)->addDays(7)->toDateString();
        $this->assertSame($expectedFirst, $firstForecast['week_start']);

        // consecutive weekly steps, and every projection is a positive number
        foreach ($res['data'] as $i => $row) {
            $this->assertGreaterThan(0, $row['projected_revenue']);
            if ($i > 0) {
                $prev = \Carbon\Carbon::parse($res['data'][$i - 1]['week_start'])->addDays(7);
                $this->assertTrue($prev->equalTo(\Carbon\Carbon::parse($row['week_start'])));
            }
        }
    }

    public function test_predict_applies_the_model_equation_and_validates(): void
    {
        $this->seed();

        $model = $this->getJson('/api/analytics/predictive/model')->assertOk()->json();

        $res = $this->postJson('/api/analytics/predictive/predict', [
            'spend' => 15000,
            'discount_percent' => 5,
        ])->assertOk()->json();

        $expected = $model['intercept']
            + $model['coefficients']['spend'] * 15000
            + $model['coefficients']['discount_percent'] * 5;
        $this->assertEqualsWithDelta($expected, $res['predicted_weekly_revenue'], 0.5);

        $this->postJson('/api/analytics/predictive/predict', ['spend' => -5, 'discount_percent' => 5])
            ->assertUnprocessable()
            ->assertJsonStructure(['message', 'errors' => ['spend']]);

        $this->postJson('/api/analytics/predictive/predict', ['spend' => 100, 'discount_percent' => 150])
            ->assertUnprocessable();
    }

    public function test_filters_change_the_model(): void
    {
        $this->seed();

        $all = $this->getJson('/api/analytics/predictive/model')->assertOk()->json();
        $tiktok = $this->getJson('/api/analytics/predictive/model?'.http_build_query([
            'channel' => 'TikTok Creator Collabs',
        ]))->assertOk()->json();

        $this->assertSame(13, $tiktok['n_weeks']); // 52 weeks / 4 channels
        $this->assertNotEquals($all['n_weeks'], $tiktok['n_weeks']);
    }
}
