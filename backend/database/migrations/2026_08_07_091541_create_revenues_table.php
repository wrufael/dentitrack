<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('revenues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('source');
            $table->decimal('amount', 15, 2);
            $table->enum('payment_method', ['cash', 'bank_transfer', 'mobile_money', 'card'])->default('cash');
            $table->date('date');
            $table->text('description')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('receipt_number')->nullable();
            $table->timestamps();
            
            $table->index(['clinic_id', 'date']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('revenues');
    }
};