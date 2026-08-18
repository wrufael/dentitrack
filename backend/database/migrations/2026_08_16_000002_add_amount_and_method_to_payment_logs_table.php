<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_logs', function (Blueprint $table) {
            // Needed so a "payment_collected" log row can stand on its own
            // as one line of payment history (Patient Credit's payment
            // history list reads these instead of re-deriving from totals).
            $table->decimal('amount', 12, 2)->nullable()->after('performed_by');
            $table->string('payment_method')->nullable()->after('amount');
        });
    }

    public function down(): void
    {
        Schema::table('payment_logs', function (Blueprint $table) {
            $table->dropColumn(['amount', 'payment_method']);
        });
    }
};
