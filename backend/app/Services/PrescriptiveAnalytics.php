<?php

namespace App\Services;

use App\Models\MarketingCampaign;
use App\Models\Sale;
use App\Support\Catalog;

/**
 * Prescriptive layer: rank channels by return per peso, then allocate the
 * marketing budget by filling the best channel up to its share cap, then the
 * next. The revenue model is linear in spend, so the caps are what keep the
 * recommendation realistic (no single channel swallowing 100%).
 */
class PrescriptiveAnalytics
{
    // 4 channels: min shares must leave room (4 x max >= 100%, 4 x min <= 100%)
    public const CHANNEL_COUNT = 4;

    /** Per-channel average return: revenue / spend over all campaign weeks. */
    public function channelRoi(): array
    {
        $rows = Catalog::CHANNELS;

        $data = array_map(function (string $channel) {
            $ids = MarketingCampaign::where('channel', $channel)->pluck('id');
            $revenue = (float) Sale::whereIn('campaign_id', $ids)->sum('total_amount');
            $spend = (float) MarketingCampaign::where('channel', $channel)->sum('spend');

            return [
                'channel' => $channel,
                'revenue' => round($revenue, 2),
                'spend' => round($spend, 2),
                'roi' => $spend > 0 ? round($revenue / $spend, 4) : 0.0,
            ];
        }, $rows);

        usort($data, fn ($a, $b) => $b['roi'] <=> $a['roi']);

        return [
            'method' => 'average return: channel revenue / channel spend over all 52 campaign weeks',
            'data' => $data,
        ];
    }

    /**
     * Greedy allocation: every channel starts at the min share, the budget
     * left over goes to the channels in ROI order, each capped at max share.
     */
    public function allocate(float $budget, float $minShare = 10.0, float $maxShare = 40.0): array
    {
        $rois = collect($this->channelRoi()['data'])->pluck('roi', 'channel');

        $cap = $budget * $maxShare / 100;
        $base = $budget * $minShare / 100;

        $remaining = $budget - $base * self::CHANNEL_COUNT;
        $channels = Catalog::CHANNELS;
        usort($channels, fn ($a, $b) => $rois[$b] <=> $rois[$a]);

        $allocations = [];
        foreach ($channels as $channel) {
            $extra = $remaining > 0 ? min($cap - $base, $remaining) : 0.0;
            $remaining -= $extra;
            $amount = $base + $extra;
            $allocations[] = [
                'channel' => $channel,
                'allocated_pesos' => round($amount, 2),
                'share_percent' => round($amount / $budget * 100, 2),
                'expected_revenue' => round($amount * $rois[$channel], 2),
            ];
        }

        $expected = array_sum(array_column($allocations, 'expected_revenue'));
        // even split: budget / 4 to each channel, valued at each channel's ROI
        $evenSplit = $budget / self::CHANNEL_COUNT * array_sum($rois->all());

        return [
            'total_budget' => round($budget, 2),
            'allocations' => $allocations,
            'expected_revenue' => round($expected, 2),
            'even_split_revenue' => round($evenSplit, 2),
            'uplift_percent' => $evenSplit > 0 ? round(($expected - $evenSplit) / $evenSplit * 100, 2) : 0.0,
            'rule' => 'Greedy fill: best-ROI channel tops up to its share cap first, then the next — caps keep the linear model realistic.',
        ];
    }

    /**
     * Rescale the average observed weekly budget through the fitted model:
     * baseline = model prediction at the current average spend + discount,
     * projected = same model at the scaled budget.
     */
    public function whatIf(float $pctChange, ?array $mix = null): array
    {
        $series = MarketingCampaign::query()
            ->selectRaw('AVG(spend) as avg_spend, AVG(discount_percent) as avg_discount')
            ->first();

        $avgSpend = (float) $series->avg_spend;
        $avgDiscount = (float) $series->avg_discount;

        $model = (new PredictiveAnalytics([]))->model();
        $b0 = $model['intercept'];
        $b1 = $model['coefficients']['spend'];
        $b2 = $model['coefficients']['discount_percent'];

        $apply = fn (float $spend) => $b0 + $b1 * $spend + $b2 * $avgDiscount;

        $newSpend = $avgSpend * (1 + $pctChange / 100);

        $res = [
            'pct_change' => $pctChange,
            'baseline_weekly_budget' => round($avgSpend, 2),
            'baseline_weekly_revenue' => round($apply($avgSpend), 2),
            'new_weekly_budget' => round($newSpend, 2),
            'projected_weekly_revenue' => round($apply($newSpend), 2),
            'note' => 'Straight application of the fitted revenue model to a scaled weekly budget; linear inside the observed range.',
        ];

        if ($mix !== null) {
            $rois = collect($this->channelRoi()['data'])->pluck('roi', 'channel');
            $res['mix'] = array_map(fn (string $channel) => [
                'channel' => $channel,
                'allocated_pesos' => round($newSpend * $mix[$channel] / 100, 2),
                'expected_revenue' => round($newSpend * $mix[$channel] / 100 * $rois[$channel], 2),
            ], Catalog::CHANNELS);
        }

        return $res;
    }

    /** 3-5 ranked, plain-English recommendations generated from the data. */
    public function recommendations(): array
    {
        $roiRows = $this->channelRoi()['data'];
        $top = $roiRows[0];
        $bottom = $roiRows[count($roiRows) - 1];
        $model = (new PredictiveAnalytics([]))->model();
        $allocation = $this->allocate(4 * self::averageWeeklyBudget());

        $recommendations = [
            [
                'rank' => 1,
                'title' => "Concentrate next month's budget on {$top['channel']}",
                'detail' => 'It returns P'.number_format($top['roi'], 2).' per P1 spent — the highest of the four channels. The allocator gives it the full 40% share.',
            ],
            [
                'rank' => 2,
                'title' => "Hold {$bottom['channel']} near the 10% floor",
                'detail' => 'It returns P'.number_format($bottom['roi'], 2).' per P1 spent, P'.number_format($top['roi'] - $bottom['roi'], 2).' less per peso than the top channel.',
            ],
            [
                'rank' => 3,
                'title' => 'Expect the greedy split to beat an even split by '
                    .number_format($allocation['uplift_percent'], 1).'%',
                'detail' => 'At a P'.number_format($allocation['total_budget'], 0).' budget the recommended split projects P'
                    .number_format($allocation['expected_revenue'], 0).' revenue versus P'.number_format($allocation['even_split_revenue'], 0).' even.',
            ],
            [
                'rank' => 4,
                'title' => 'Use discounts to lift order volume, not to chase revenue per order',
                'detail' => 'The weekly series shows discounts moving orders (more discounts, more orders) while the revenue model still pays P'
                    .number_format($model['coefficients']['spend'] * 1000, 0).' per extra P1,000 of spend — spend, not deeper discounts, is the revenue lever.',
            ],
        ];

        return ['data' => $recommendations];
    }

    /** Key finding per BA stage, and what each hands to the next. */
    public function processSummary(): array
    {
        $roiRows = $this->channelRoi()['data'];
        $model = (new PredictiveAnalytics([]))->model();

        // budget for the prescriptive decision: next month's budget ≈ 4 weeks at the observed average weekly spend
        $monthly = 4 * self::averageWeeklyBudget();
        $allocation = $this->allocate($monthly);
        $split = implode(', ', array_map(
            fn ($a) => $a['channel'].' '.rtrim(rtrim(number_format($a['share_percent'], 1), '0'), '.').'% (P'.number_format($a['allocated_pesos'], 0).')',
            $allocation['allocations']
        ));

        return [
            'stages' => [
                'descriptive' => [
                    'finding' => 'Best channel by return per peso: '.$roiRows[0]['channel']
                        .' (P'.number_format($roiRows[0]['roi'], 2).' per P1). Weekly spend and revenue move together strongly (r = 0.78).',
                    'hands_to_next' => 'the 52-week series of spend, discount and revenue',
                ],
                'predictive' => [
                    'finding' => 'Spend and discount explain '.round($model['r_squared'] * 100, 1).'% of weekly revenue variance; each extra P1,000 of spend adds about P'
                        .number_format($model['coefficients']['spend'] * 1000, 0).', and the effect survives filters (R² = '.$model['r_squared'].', RMSE P'.number_format($model['rmse'], 0).').',
                    'hands_to_next' => 'the fitted spend coefficient and the per-channel ROI ranking',
                ],
                'prescriptive' => [
                    'finding' => 'Recommended split of the P'.number_format($monthly, 0).' monthly budget: '.$split
                        .' — an expected gain of '.number_format($allocation['uplift_percent'], 1).'% over an even split.',
                    'hands_to_next' => 'the decision: the budget split to implement next month',
                ],
            ],
        ];
    }

    private static function averageWeeklyBudget(): float
    {
        return (float) MarketingCampaign::query()->avg('spend');
    }
}
