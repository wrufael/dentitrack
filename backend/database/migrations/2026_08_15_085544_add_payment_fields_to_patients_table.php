<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->string('payment_method')->default('free')->after('patient_code');
            $table->decimal('payment_amount', 10, 2)->default(0)->after('payment_method');
            $table->string('payment_status')->default('free')->after('payment_amount');
            $table->string('payment_phone')->nullable()->after('payment_status');
            $table->string('payment_reference')->nullable()->after('payment_phone');
            $table->string('payment_bank_name')->nullable()->after('payment_reference');
            $table->string('card_holder_name')->nullable()->after('payment_bank_name');
            $table->string('card_last_four', 4)->nullable()->after('card_holder_name');
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn([
                'payment_method', 'payment_amount', 'payment_status',
                'payment_phone', 'payment_reference', 'payment_bank_name',
                'card_holder_name', 'card_last_four',
            ]);
        });
    }
};