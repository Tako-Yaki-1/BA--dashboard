<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReadEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_meta_filters_returns_vocabulary_and_date_range(): void
    {
        // seeders are deterministic, so the data's date range is fixed
        $this->seed();

        $this->getJson('/api/meta/filters')
            ->assertOk()
            ->assertJsonCount(4, 'channels')
            ->assertJsonCount(5, 'product_categories')
            ->assertJsonCount(4, 'customer_types')
            ->assertJsonCount(3, 'loyalty_tiers')
            ->assertJsonPath('date_from', '2025-08-04');
    }

    public function test_sales_index_filters_by_channel(): void
    {
        $this->seed();

        $filtered = $this->getJson('/api/sales?channel='.urlencode('TikTok Creator Collabs'))
            ->assertOk()
            ->assertJsonPath('meta.total', 86);

        // every row returned belongs to the requested channel
        foreach ($filtered->json('data') as $sale) {
            $this->assertSame('TikTok Creator Collabs', $sale['channel']);
        }
    }

    public function test_transactions_index_filters_by_category(): void
    {
        $this->seed();

        $filtered = $this->getJson('/api/transactions?category='.urlencode('Keyboard Kits'))
            ->assertOk();

        $this->assertGreaterThan(0, $filtered->json('meta.total'));

        foreach ($filtered->json('data') as $line) {
            $this->assertSame('Keyboard Kits', $line['product_category']);
        }
    }
}
