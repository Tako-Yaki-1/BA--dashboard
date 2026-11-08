<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Support\Catalog;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        mt_srand(2026); // fixed seed so every run gives the same data

        $combos = [];
        foreach (Catalog::FIRST_NAMES as $first) {
            foreach (Catalog::LAST_NAMES as $last) {
                $combos[] = $first.' '.$last;
            }
        }
        shuffle($combos); // shuffle() uses mt_rand, so it is deterministic here
        $names = array_slice(array_unique($combos), 0, 60);

        // weight: Students buy keyboards for school, Gamers and Hobbyists abound
        $typePool = ['Student', 'Student', 'Student', 'Gamer', 'Gamer', 'Gamer', 'Office Worker', 'Office Worker', 'Hobbyist', 'Hobbyist'];
        $tierPool = ['Bronze', 'Bronze', 'Bronze', 'Bronze', 'Bronze', 'Silver', 'Silver', 'Silver', 'Gold'];
        $cityPool = [];
        foreach (Catalog::CITIES as $i => $city) {
            $n = $i < 6 ? 2 : 1; // favor Metro Manila
            for ($j = 0; $j < $n; $j++) {
                $cityPool[] = $city;
            }
        }

        foreach ($names as $i => $name) {
            Customer::create([
                'name' => $name,
                'customer_type' => $typePool[mt_rand(0, count($typePool) - 1)],
                'loyalty_tier' => $tierPool[mt_rand(0, count($tierPool) - 1)],
                'city' => $cityPool[mt_rand(0, count($cityPool) - 1)],
                // random join date within the last ~3 years
                'joined_date' => date('Y-m-d', mt_rand(strtotime('2024-01-01'), strtotime('2026-08-31'))),
            ]);
        }
    }
}
