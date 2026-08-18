<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->onDelete('cascade');
            $table->enum('plan', ['basic', 'standard', 'premium']);
            $table->decimal('price', 10, 2);
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['active', 'expired', 'suspended', 'pending'])->default('pending');
            $table->boolean('auto_renew')->default(false);
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};