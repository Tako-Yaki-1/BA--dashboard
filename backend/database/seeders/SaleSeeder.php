<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\MarketingCampaign;
use App\Models\Product;
use App\Models\Sale;
use App\Support\Catalog;
use Illuminate\Database\Seeder;

class SaleSeeder extends Seeder
{
    public function run(): void
    {
        mt_srand(2026);

        $campaigns = MarketingCampaign::orderBy('week_start')->get()->all();
        $customers = Customer::orderBy('id')->get()->all();
        $products = Product::orderBy('id')->get()->all();

        // ---- weekly demand ----------------------------------------------------------------
        // Weekly order count rises with spend, with a small lift from the discount, spikes
        // around back-to-school and the 11.11 / 12.12 weeks, and small scale differences per
        // channel (~0.8x to ~1.12x) so TikTok and Discord return more revenue per peso than
        // Campus Pop-up Booths. All driven from the campaign rows so the analytics story holds.
        $channelScale = [
            'Facebook and Instagram Ads' => 1.0,
            'TikTok Creator Collabs' => 1.12,
            'Discord and Gaming Community Sponsorships' => 1.08,
            'Campus Pop-up Booths' => 0.8,
        ];

        $weights = [];
        foreach ($campaigns as $i => $c) {
            $w = ($c->spend / 11000)
                * $channelScale[$c->channel]
                * (1 + $c->discount_percent / 100 * 0.25); // discounts lift orders a little, but cut every unit price

            $week = $c->week_start->toDateString();
            if ($week >= '2026-06-01' && $week <= '2026-08-02') {
                $w *= 1.35; // back-to-school
            } elseif ($week === '2025-11-10') {
                $w *= 1.6; // 11.11 sale
            } elseif ($week === '2025-12-08') {
                $w *= 1.5; // 12.12 sale
            }

            $weights[$i] = $w * (0.87 + mt_rand(0, 26) / 100);
        }

        // distribute exactly 300 orders across weeks proportionally to weight
        $total = array_sum($weights);
        $counts = [];
        $fractional = [];
        $remaining = 300;
        foreach ($campaigns as $i => $c) {
            $exact = 300.0 * $weights[$i] / $total;
            $counts[$i] = (int) $exact;
            $fractional[$i] = $exact - $counts[$i];
            $remaining -= $counts[$i];
        }
        arsort($fractional);
        foreach (array_slice(array_keys($fractional), 0, $remaining, true) as $i) {
            $counts[$i]++;
        }

        // ---- weighted product pool ----------------------------------------------------------
        // cheaper items are ordered more often than full keyboard kits
        $categoryWeight = [
            'Switches' => 30,
            'Keycap Sets' => 24,
            'Deskmats and Accessories' => 18,
            'Mod Parts and Tools' => 16,
            'Keyboard Kits' => 12,
        ];
        $poolByCategory = [];
        foreach ($products as $p) {
            $poolByCategory[$p->category][] = $p;
        }
        $weightedCategories = [];
        foreach ($categoryWeight as $cat => $wgt) {
            for ($j = 0; $j < $wgt; $j++) {
                $weightedCategories[] = $cat;
            }
        }
        $qtyChoices = [1, 1, 1, 1, 1, 2, 2, 3];
        $payChoices = ['GCash', 'GCash', 'GCash', 'GCash', 'GCash', 'Maya', 'Maya', 'Cash on Delivery', 'Cash on Delivery', 'Card'];

        $drawProduct = function () use ($weightedCategories, $poolByCategory): Product {
            $category = $weightedCategories[mt_rand(0, count($weightedCategories) - 1)];
            $pool = $poolByCategory[$category];

            return $pool[mt_rand(0, count($pool) - 1)];
        };
        $drawQty = fn (): int => $qtyChoices[mt_rand(0, count($qtyChoices) - 1)];

        // ---- build orders to hit each week's revenue target ---------------------------------
        // Building each order up to its share of a weekly revenue target keeps weekly revenue
        // following the marketing spend, while per-order size still varies inside delivery
        // tolerance. Target average order value tracks the pool prices and that week's discount.
        $unit = fn (Product $p, MarketingCampaign $c): float =>
            round((float) $p->price * (1 - $c->discount_percent / 100), 2);

        foreach ($campaigns as $i => $c) {
            $nOrders = $counts[$i];
            if ($nOrders === 0) {
                continue;
            }

            // intended revenue for this week: orders already track spend, so this keeps
            // weekly revenue on the same straight line plus bounded noise
            $weekTarget = $nOrders * 5400 * (1 - $c->discount_percent / 100)
                * (0.96 + mt_rand(0, 8) / 100);

            for ($n = 0; $n < $nOrders; $n++) {
                $customer = $customers[mt_rand(0, count($customers) - 1)];
                $orderDate = date('Y-m-d', strtotime($c->week_start->toDateString().' +'.mt_rand(0, 6).' days'));

                // order size varies around the per-order share of the week's target
                $orderTarget = $weekTarget / $nOrders * (0.7 + mt_rand(0, 60) / 100);

                $sale = Sale::create([
                    'customer_id' => $customer->id,
                    'campaign_id' => $c->id,
                    'order_date' => $orderDate,
                    'payment_method' => $payChoices[mt_rand(0, count($payChoices) - 1)],
                    'total_amount' => 0.00, // set below once its line items exist
                ]);

                $total = 0.0;
                $lines = 0;
                // one item minimum; keep adding while well under the order's share of the
                // weekly target so order size tracks the campaign week's revenue goal
                while ($lines === 0 || ($total < $orderTarget * 0.8 && $lines < 9)) {
                    // re-roll an item that would blow far past this order's budget share
                    for ($tries = 0; $tries < 6; $tries++) {
                        $product = $drawProduct();
                        $qty = $drawQty();
                        $unitPrice = $unit($product, $c);
                        $lineTotal = round($unitPrice * $qty, 2);
                        if ($lines === 0 || $lineTotal <= $orderTarget * 1.5) {
                            break;
                        }
                    }
                    $total += $lineTotal;
                    $lines++;

                    $sale->transactions()->create([
                        'product_id' => $product->id,
                        'quantity' => $qty,
                        'unit_price' => $unitPrice,
                        'line_total' => $lineTotal,
                    ]);
                }

                $sale->update(['total_amount' => round($total, 2)]);
            }
        }
    }
}
