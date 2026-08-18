<?php
// database/migrations/2026_07_31_093724_create_inventory_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('name');
            $table->enum('category', ['consumable', 'medication', 'instrument', 'equipment', 'other'])->default('consumable');
            $table->integer('quantity')->default(0);
            $table->decimal('buy_price', 10, 2)->default(0);
            $table->decimal('sell_price', 10, 2)->default(0);
            $table->string('supplier')->nullable();
            $table->integer('low_stock_threshold')->default(10);
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('batch_number')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('inventory');
    }
};