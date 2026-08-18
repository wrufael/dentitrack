<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            // Presence of due_date is what marks a request as a "credit" /
            // payment-plan record for the Patient Credit module — regular
            // same-day payment requests leave this null.
            $table->date('due_date')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            $table->dropColumn('due_date');
        });
    }
};
