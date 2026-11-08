<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_lists_customers_with_pagination_and_search(): void
    {
        Customer::create(['name' => 'Ana Reyes', 'customer_type' => 'Gamer', 'loyalty_tier' => 'Gold', 'city' => 'Manila', 'joined_date' => '2025-01-01']);
        Customer::create(['name' => 'Bo Cruz', 'customer_type' => 'Student', 'loyalty_tier' => 'Bronze', 'city' => 'Cebu City', 'joined_date' => '2025-02-01']);

        $this->getJson('/api/customers')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.name', 'Ana Reyes');

        $this->getJson('/api/customers?q=Bo')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Bo Cruz');
    }

    public function test_store_stores_a_customer(): void
    {
        $this->postJson('/api/customers', [
            'name' => 'New Person',
            'customer_type' => 'Hobbyist',
            'loyalty_tier' => 'Silver',
            'city' => 'Davao City',
            'joined_date' => '2026-04-20',
        ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'New Person');

        $this->assertDatabaseHas('customers', ['name' => 'New Person']);
    }

    public function test_store_rejects_an_unknown_customer_type(): void
    {
        $this->postJson('/api/customers', [
            'name' => 'Bad Type',
            'customer_type' => 'Wizard',
            'loyalty_tier' => 'Silver',
            'city' => 'Davao City',
            'joined_date' => '2026-04-20',
        ])
            ->assertUnprocessable()
            ->assertJsonStructure(['message', 'errors' => ['customer_type']]);
    }

    public function test_update_and_delete_a_customer(): void
    {
        $customer = Customer::create(['name' => 'Old Name', 'customer_type' => 'Gamer', 'loyalty_tier' => 'Bronze', 'city' => 'Manila', 'joined_date' => '2025-01-01']);

        $this->putJson("/api/customers/{$customer->id}", [
            'name' => 'New Name',
            'customer_type' => 'Gamer',
            'loyalty_tier' => 'Gold',
            'city' => 'Makati',
            'joined_date' => '2025-01-01',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name');

        $this->assertDatabaseHas('customers', ['id' => $customer->id, 'name' => 'New Name']);

        $this->deleteJson("/api/customers/{$customer->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('customers', ['id' => $customer->id]);
    }

    public function test_a_product_used_in_transactions_cannot_be_deleted(): void
    {
        $customer = Customer::create(['name' => 'A', 'customer_type' => 'Gamer', 'loyalty_tier' => 'Bronze', 'city' => 'Manila', 'joined_date' => '2025-01-01']);
        $product = Product::create(['name' => 'Used Switches', 'category' => 'Switches', 'price' => 500, 'cost' => 300]);
        $sale = Sale::create(['customer_id' => $customer->id, 'campaign_id' => null, 'order_date' => '2025-01-05', 'payment_method' => 'GCash', 'total_amount' => 500]);
        Transaction::create(['sale_id' => $sale->id, 'product_id' => $product->id, 'quantity' => 1, 'unit_price' => 500, 'line_total' => 500]);

        $this->deleteJson("/api/products/{$product->id}")
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'This product is used in one or more transactions and cannot be deleted.']);
    }
}
