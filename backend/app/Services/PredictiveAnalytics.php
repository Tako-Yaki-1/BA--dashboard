<?php

namespace App\Services;

use App\Models\MarketingCampaign;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

/**
 * Predictive layer: weekly_revenue modeled as a linear function of the
 * week's marketing spend and discount percent, fitted with the from-scratch
 * Regression solver. Accepts the same optional date/channel filters as the
 * descriptive service so a filtered model matches its descriptive view.
 */
class PredictiveAnalytics
{
    public function __construct(private array $filters)
    {
    }

    /** The shared weekly series (same definition as the descriptive trend). */
    private function weeklySeries(): array
    {
        $query = MarketingCampaign::query()
            ->when($this->filters['channel'] ?? null, fn ($q, $ch) => $q->where('channel', $ch))
            ->when($this->filters['date_to'] ?? null, fn ($q, $to) => $q->whereDate('week_start', '<=', $to))
            ->when($this->filters['date_from'] ?? null, fn ($q, $from) => $q->whereDate('week_start', '>=', Carbon::parse($from)->subDays(6)))
            ->withCount(['sales as orders'])
            ->orderBy('week_start');

        return $query->get()->map(fn (MarketingCampaign $w) => [
            'week_start' => $w->week_start->toDateString(),
            'spend' => (float) $w->spend,
            'discount_percent' => (float) $w->discount_percent,
            'orders' => (int) $w->orders,
            'revenue' => (float) $w->sales->sum('total_amount'),
        ])->all();
    }

    /** Model fit + plain-language interpretation of both coefficients. */
    public function model(): array
    {
        $series = $this->weeklySeries();
        $rows = array_map(fn ($r) => [$r['revenue'], [$r['spend'], $r['discount_percent']]], $series);
        $fit = Regression::fit($rows);

        if ($fit === null) {
            return ['message' => 'Not enough weeks in this filter to fit a model.'];
        }

        [$intercept, $coefs] = [$fit['intercept'], $fit['coefficients']];

        $n = $fit['n'];
        $k = 2;
        $ssTot = 0.0;
        $yMean = array_sum(array_column($series, 'revenue')) / $n;
        $ssRes = 0.0;
        foreach ($series as $r) {
            $pred = $intercept + $coefs[0] * $r['spend'] + $coefs[1] * $r['discount_percent'];
            $ssRes += ($r['revenue'] - $pred) ** 2;
            $ssTot += ($r['revenue'] - $yMean) ** 2;
        }
        $r2 = $fit['r_squared'];
        $adjR2 = $n - $k - 1 > 0 ? 1 - (1 - $r2) * ($n - 1) / ($n - $k - 1) : $r2;
        $rmse = sqrt($ssRes / $n);

        $spendSlope = $coefs[0];
        $discountSlope = $coefs[1];

        return [
            'outcome' => 'weekly_revenue',
            'predictors' => ['spend', 'discount_percent'],
            'intercept' => round($intercept, 2),
            'coefficients' => [
                'spend' => round($spendSlope, 4),
                'discount_percent' => round($discountSlope, 4),
            ],
            'r_squared' => round($r2, 4),
            'adjusted_r_squared' => round($adjR2, 4),
            'rmse' => round($rmse, 2),
            'n_weeks' => $n,
            'interpretation' => [
                'spend' => 'Each extra P1,000 of weekly marketing spend is associated with about P'
                    .number_format($spendSlope * 1000, 0)
                    .' more weekly revenue, holding the discount level constant.',
                'discount_percent' => 'Each extra percentage point of discount adds about P'
                    .number_format($discountSlope, 0)
                    .' to weekly revenue — more discounts move more orders, at a lower average order value.',
                'fit' => 'The two predictors together explain about '.round($r2 * 100).'% of the week-to-week revenue variance (RMSE P'.number_format($rmse, 0).'). Small sample (52 weeks); assume the linear shape holds only inside the observed spend and discount range.',
            ],
        ];
    }

    /** Actual weekly revenue next to the model's fitted value. */
    public function actualVsPredicted(): array
    {
        $series = $this->weeklySeries();
        $model = $this->model();
        if (isset($model['message'])) {
            return ['data' => []];
        }

        $b0 = $model['intercept'];
        $b1 = $model['coefficients']['spend'];
        $b2 = $model['coefficients']['discount_percent'];

        return ['data' => array_map(fn ($r) => [
            'week_start' => $r['week_start'],
            'spend' => $r['spend'],
            'discount_percent' => $r['discount_percent'],
            'actual' => round($r['revenue'], 2),
            'predicted' => round($b0 + $b1 * $r['spend'] + $b2 * $r['discount_percent'], 2),
        ], $series)];
    }

    /** Next 4 weeks: simple OLS trend on the week index, clearly labeled. */
    public function forecast(): array
    {
        $series = $this->weeklySeries();
        if (count($series) < 3) {
            return ['method' => 'simple trend projection', 'data' => []];
        }

        // simple linear trend on the week index t = 0..n-1
        $rows = array_map(fn ($i, $r) => [$r['revenue'], [(float) $i]], array_keys($series), array_values($series));
        $fit = Regression::fit($rows);
        if ($fit === null) {
            return ['method' => 'simple trend projection', 'data' => []];
        }

        [$intercept, $coefs] = [$fit['intercept'], $fit['coefficients'][0]];
        $n = count($series);
        $lastMonday = Carbon::parse($series[$n - 1]['week_start']);

        $data = [];
        for ($h = 1; $h <= 4; $h++) {
            $data[] = [
                'week_start' => $lastMonday->copy()->addDays(7 * $h)->toDateString(),
                'projected_revenue' => round($intercept + $coefs * ($n - 1 + $h), 2),
            ];
        }

        return [
            'method' => 'simple trend projection',
            'note' => 'Straight-line continuation of the observed weekly revenue trend; not a causal forecast.',
            'data' => $data,
        ];
    }

    /** Apply the fitted model to a hypothetical spend + discount week. */
    public function predict(float $spend, float $discountPercent): array
    {
        $model = $this->model();
        if (isset($model['message'])) {
            return ['message' => $model['message']];
        }

        $predicted = $model['intercept']
            + $model['coefficients']['spend'] * $spend
            + $model['coefficients']['discount_percent'] * $discountPercent;

        return [
            'spend' => $spend,
            'discount_percent' => $discountPercent,
            'predicted_weekly_revenue' => round(max($predicted, 0), 2),
            'note' => 'Model estimate for a week with this spend and discount; valid only inside the observed data range.',
        ];
    }
}
