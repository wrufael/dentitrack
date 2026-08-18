<?php
// database/migrations/2026_08_11_000001_add_source_to_expenses_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('expenses', function (Blueprint $table) {
            if (!Schema::hasColumn('expenses', 'source')) {
                $table->enum('source', ['manual', 'inventory'])->default('manual')->after('notes');
            }
            if (!Schema::hasColumn('expenses', 'inventory_id')) {
                $table->foreignId('inventory_id')->nullable()->after('source')->constrained('inventory')->onDelete('set null');
            }
        });
    }

    public function down()
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['inventory_id']);
            $table->dropColumn(['source', 'inventory_id']);
        });
    }
};