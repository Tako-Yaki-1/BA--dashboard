<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('marketing_campaigns', function (Blueprint $table) {
            $table->id();
            $table->date('week_start')->unique(); // one campaign row per week
            $table->string('channel'); // Facebook and Instagram Ads, TikTok Creator Collabs, Discord and Gaming Community Sponsorships, Campus Pop-up Booths
            $table->decimal('spend', 10, 2);
            $table->decimal('discount_percent', 5, 2);
            $table->unsignedInteger('reach');
            $table->index('channel');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_campaigns');
    }
};
