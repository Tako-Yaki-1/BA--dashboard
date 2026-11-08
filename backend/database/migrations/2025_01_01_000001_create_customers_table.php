<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('customer_type'); // Student, Gamer, Office Worker, Hobbyist
            $table->string('loyalty_tier'); // Bronze, Silver, Gold
            $table->string('city');
            $table->date('joined_date');
            $table->index('joined_date');
            $table->index('customer_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
