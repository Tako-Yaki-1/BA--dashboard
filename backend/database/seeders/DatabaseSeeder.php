<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\MarketingCampaign;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Transaction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        foreach (['transactions', 'sales', 'marketing_campaigns', 'products', 'customers'] as $table) {
            DB::table($table)->truncate();
        }
        Schema::enableForeignKeyConstraints();

        $this->call([
            CustomerSeeder::class,
            ProductSeeder::class,
            MarketingCampaignSeeder::class,
            SaleSeeder::class,
        ]);

        // short seed summary, printed after seeding (per build plan 5.1)
        $tickets = [
            'customers' => Customer::count(),
            'products' => Product::count(),
            'marketing_campaigns' => MarketingCampaign::count(),
            'sales' => Sale::count(),
            'transactions' => Transaction::count(),
        ];
        $this->command->info('Seed summary:');
        foreach ($tickets as $table => $count) {
            $this->command->line("  {$table}: {$count} rows");
        }
    }
}
