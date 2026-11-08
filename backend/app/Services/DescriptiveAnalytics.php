<?php

namespace App\Services;

use App\Models\MarketingCampaign;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

/**
 * Descriptive aggregates shared by the analytics endpoints.
 *
 * Filter semantics (applied at the data, not the endpoint):
 *  - channel: sales whose campaign channel matches; campaign series filtered likewise.
 *  - date_from/date_to: constrain sales by order_date; campaign-week series (spend,
 *    discount) include every week overlapping a one-week window of the range, so the
 *    spend window lines up with the revenue window in trend/summary comparisons.
 */
class DescriptiveAnalytics
{
    private ?string $dateFrom;
    private ?string $dateTo;
    private ?string $channel;

    public function __construct(array $filters)
    {
        $this->dateFrom = $filters['date_from'] ?? null;
        $this->dateTo = $filters['date_to'] ?? null;
        $this->channel = $filters['channel'] ?? null;
    }

    /** Sales rows for the current filters, safely aggregated. */
    public function salesQuery(): Builder
    {
        return Sale::query()
            ->when($this->channel, fn ($q) => $q->whereHas('campaign', fn ($c) => $c->where('channel', $this->channel)))
            ->when($this->dateFrom, fn ($q) => $q->whereDate('order_date', '>=', $this->dateFrom))
            ->when($this->dateTo, fn ($q) => $q->whereDate('order_date', '<=', $this->dateTo));
    }

    /** Campaign rows for the current filters (weeks overlapping the date range). */
    public function campaignsQuery(): Builder
    {
        return MarketingCampaign::query()
            ->when($this->channel, fn ($q) => $q->where('channel', $this->channel))
            ->when($this->dateTo, fn ($q) => $q->whereDate('week_start', '<=', $this->dateTo))
            ->when($this->dateFrom, fn ($q) => $q->whereDate('week_start', '>=', Carbon::parse($this->dateFrom)->subDays(6)));
    }

    /** One KPI snapshot over the filtered data. */
    public function summary(): array
    {
        $revenue = (float) $this->salesQuery()->clone()->sum('total_amount');
        $orders = (int) $this->salesQuery()->clone()->count();
        $spend = (float) $this->campaignsQuery()->clone()->sum('spend');

        return [
            'total_revenue' => round($revenue, 2),
            'orders' => $orders,
            'average_order_value' => $orders > 0 ? round($revenue / $orders, 2) : 0.0,
            'total_spend' => round($spend, 2),
            'revenue_per_peso' => $spend > 0 ? round($revenue / $spend, 2) : 0.0,
        ];
    }

    /** Weekly series: one row per campaign week in the filtered window. */
    public function trend(): array
    {
        $rows = $this->campaignsQuery()
            ->withCount(['sales as orders' => $this->saleRelationFilter()])
            ->withSum(['sales as revenue' => $this->saleRelationFilter()], 'total_amount')
            ->orderBy('week_start')
            ->get();

        return $rows->map(fn (MarketingCampaign $w) => [
            'week_start' => $w->week_start->toDateString(),
            'channel' => $w->channel,
            'spend' => (float) $w->spend,
            'discount_percent' => (float) $w->discount_percent,
            'reach' => $w->reach,
            'orders' => (int) $w->orders,
            'revenue' => (float) ($w->revenue ?? 0),
        ])->all();
    }

    private function saleRelationFilter(): \Closure
    {
        return fn (Builder $q) => $q
            // a campaign's sales are implicitly that channel's sales
            ->when($this->dateFrom, fn ($qq) => $qq->whereDate('order_date', '>=', $this->dateFrom))
            ->when($this->dateTo, fn ($qq) => $qq->whereDate('order_date', '<=', $this->dateTo));
    }

    public function byChannel(): array
    {
        $spend = $this->campaignsQuery()
            ->selectRaw("channel, SUM(spend) AS spend, AVG(discount_percent) AS discount")
            ->groupBy('channel')
            ->pluck('spend', 'channel');

        $sales = $this->salesQuery()
            ->join('marketing_campaigns', 'sales.campaign_id', '=', 'marketing_campaigns.id')
            ->selectRaw("marketing_campaigns.channel AS channel, COUNT(*) AS orders, SUM(sales.total_amount) AS revenue")
            ->groupBy('marketing_campaigns.channel')
            ->get()
            ->keyBy('channel');

        return $spend->map(fn ($s, $channel) => [
            'channel' => $channel,
            'spend' => round((float) $s, 2),
            'revenue' => round((float) ($sales[$channel]->revenue ?? 0), 2),
            'orders' => (int) ($sales[$channel]->orders ?? 0),
            'revenue_per_peso' => $s > 0 ? round(((float) ($sales[$channel]->revenue ?? 0)) / (float) $s, 2) : 0.0,
        ])->values()->all();
    }

    public function byCategory(): array
    {
        $base = fn () => \App\Models\Transaction::query()
            ->join('products', 'transactions.product_id', '=', 'products.id')
            ->join('sales', 'transactions.sale_id', '=', 'sales.id')
            ->when($this->channel, fn ($q) => $q->whereHas('sale.campaign', fn ($c) => $c->where('channel', $this->channel)))
            ->when($this->dateFrom, fn ($q) => $q->whereDate('sales.order_date', '>=', $this->dateFrom))
            ->when($this->dateTo, fn ($q) => $q->whereDate('sales.order_date', '<=', $this->dateTo));

        $categories = $base()
            ->selectRaw('products.category AS category, SUM(transactions.line_total) AS revenue, SUM(transactions.quantity) AS units')
            ->groupBy('products.category')
            ->orderBy('revenue', 'desc')
            ->get()
            ->map(fn ($r) => [
                'category' => $r->category,
                'revenue' => round((float) $r->revenue, 2),
                'units' => (int) $r->units,
            ])->all();

        // top products by revenue, honoring the same filters
        $top = $base()
            ->selectRaw('products.id, products.name, products.category, SUM(transactions.line_total) AS revenue, SUM(transactions.quantity) AS units')
            ->groupBy('products.id', 'products.name', 'products.category')
            ->orderBy('revenue', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'id' => (int) $r->id,
                'name' => $r->name,
                'category' => $r->category,
                'units' => (int) $r->units,
                'revenue' => round((float) $r->revenue, 2),
            ])->all();

        return ['data' => $categories, 'top_products' => $top];
    }

    public function customers(): array
    {
        $breakdown = function (string $column) {
            return $this->salesQuery()
                ->join('customers', 'sales.customer_id', '=', 'customers.id')
                ->selectRaw("customers.$column AS segment, COUNT(DISTINCT customers.id) AS customers, SUM(sales.total_amount) AS revenue")
                ->groupBy("customers.$column")
                ->get()
                ->map(fn ($r) => [
                    'segment' => $r->segment,
                    'customers' => (int) $r->customers,
                    'revenue' => round((float) $r->revenue, 2),
                ])->all();
        };

        return [
            'by_type' => $breakdown('customer_type'),
            'by_tier' => $breakdown('loyalty_tier'),
        ];
    }

    /** Mean, median, min, max, range and sample SD for the four core series. */
    public function statistics(): array
    {
        $series = $this->trend();
        $orderValues = $this->salesQuery()->pluck('total_amount')->map(fn ($v) => (float) $v)->all();

        $weeklyRevenue = array_map(fn ($r) => $r['revenue'], $series);
        $weeklySpend = array_map(fn ($r) => $r['spend'], $series);
        $discounts = array_map(fn ($r) => $r['discount_percent'], $series);

        return [
            'weekly_revenue' => $this->describe($weeklyRevenue),
            'weekly_spend' => $this->describe($weeklySpend),
            'discount_percent' => $this->describe($discounts),
            'order_value' => $this->describe($orderValues),
        ];
    }

    private function describe(array $values): array
    {
        $n = count($values);
        if ($n === 0) {
            return ['n' => 0, 'mean' => 0.0, 'median' => 0.0, 'min' => 0.0, 'max' => 0.0, 'range' => 0.0, 'sd' => 0.0];
        }

        sort($values);
        $mean = array_sum($values) / $n;
        $median = $n % 2 === 1 ? $values[intdiv($n, 2)] : ($values[$n / 2 - 1] + $values[$n / 2]) / 2;

        // sample standard deviation (n-1 denominator)
        if ($n > 1) {
            $sumSq = 0.0;
            foreach ($values as $v) {
                $sumSq += ($v - $mean) ** 2;
            }
            $sd = sqrt($sumSq / ($n - 1));
        } else {
            $sd = 0.0;
        }

        return [
            'n' => $n,
            'mean' => round($mean, 2),
            'median' => round($median, 2),
            'min' => round($values[0], 2),
            'max' => round($values[$n - 1], 2),
            'range' => round($values[$n - 1] - $values[0], 2),
            'sd' => round($sd, 2),
        ];
    }

    /** Pearson correlation matrix of the weekly spend/discount/orders/revenue series. */
    public function correlation(): array
    {
        $series = $this->trend();
        $columns = [
            'spend' => array_map(fn ($r) => $r['spend'], $series),
            'discount_percent' => array_map(fn ($r) => $r['discount_percent'], $series),
            'orders' => array_map(fn ($r) => (float) $r['orders'], $series),
            'revenue' => array_map(fn ($r) => $r['revenue'], $series),
        ];

        $names = array_keys($columns);
        $matrix = [];
        foreach ($names as $rowVar) {
            $row = [];
            foreach ($names as $colVar) {
                $row[] = $rowVar === $colVar ? 1.0 : self::pearson($columns[$rowVar], $columns[$colVar]);
            }
            $matrix[] = $row;
        }

        return [
            'variables' => $names,
            'matrix' => $matrix,
        ];
    }

    /** Pearson r for two equal-length numeric series; 0 constant/empty input. */
    public static function pearson(array $a, array $b): float
    {
        $n = count($a);
        if ($n < 2 || $n !== count($b)) {
            return 0.0;
        }

        $ma = array_sum($a) / $n;
        $mb = array_sum($b) / $n;

        $num = 0.0;
        $da = 0.0;
        $db = 0.0;
        for ($k = 0; $k < $n; $k++) {
            $xa = $a[$k] - $ma;
            $xb = $b[$k] - $mb;
            $num += $xa * $xb;
            $da += $xa * $xa;
            $db += $xb * $xb;
        }

        if ($da == 0.0 || $db == 0.0) {
            return 0.0;
        }

        return $num / sqrt($da * $db);
    }
}
