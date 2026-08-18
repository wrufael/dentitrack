<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            // Controller/model already read & write 'recommendations' — the
            // column itself was just never added to the table, which is why
            // every consultation save fails with:
            // SQLSTATE[42S22]: Column not found: 1054 Unknown column
            // 'recommendations' in 'field list'.
            if (!Schema::hasColumn('consultations', 'recommendations')) {
                $table->text('recommendations')->nullable()->after('prescription');
            }
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropColumn('recommendations');
        });
    }
};
