<?php

namespace Database\Seeders;

use App\Models\MarketingCampaign;
use App\Support\Catalog;
use Illuminate\Database\Seeder;

class MarketingCampaignSeeder extends Seeder
{
    public function run(): void
    {
        mt_srand(2026);

        // base spend range per channel (PHP); TikTok and Discord get the best return per peso
        $spendRange = [
            'Facebook and Instagram Ads' => [9000, 14000],
            'TikTok Creator Collabs' => [8000, 13000],
            'Discord and Gaming Community Sponsorships' => [7000, 11500],
            'Campus Pop-up Booths' => [6000, 10000],
        ];

        $start = strtotime('2025-08-04'); // a Monday; 52 weeks through 2026-07-27

        for ($w = 0; $w < 52; $w++) {
            $weekStart = date('Y-m-d', strtotime("+$w week", $start));
            $channel = Catalog::CHANNELS[$w % 4]; // 13 weeks per channel, evenly cycled

            [$low, $high] = $spendRange[$channel];
            $spend = mt_rand($low, $high);

            // mild upward trend over the year
            $spend = $spend * (1 + $w / 51 * 0.30);

            // spending is higher around back-to-school (Jun-Jul) and the 11.11 / 12.12 sales
            $season = 1.0;
            if ($weekStart >= '2026-06-01' && $weekStart <= '2026-08-02') {
                $season = 1.15;
            } elseif ($weekStart === '2025-11-10') {
                $season = 1.25;
            } elseif ($weekStart === '2025-12-08') {
                $season = 1.20;
            }
            $spend *= $season * (0.85 + mt_rand(0, 30) / 100); // noise

            // discounts stay small mostly, but spike on 11.11 and 12.12 weeks
            if ($weekStart === '2025-11-10') {
                $discount = mt_rand(20, 25);
            } elseif ($weekStart === '2025-12-08') {
                $discount = mt_rand(15, 20);
            } else {
                $discount = mt_rand(0, 12) / 2; // 0% to 6%
            }

            MarketingCampaign::create([
                'week_start' => $weekStart,
                'channel' => $channel,
                'spend' => round($spend, 2),
                'discount_percent' => $discount,
                'reach' => (int) ($spend * (2.2 + mt_rand(0, 18) / 10)),
            ]);
        }
    }
}
