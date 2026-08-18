<?php
// database/migrations/2026_08_15_create_doctors_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('specialty')->nullable(); // Changed from specialization to specialty
            $table->string('license_number')->nullable();
            $table->string('department')->nullable();
            $table->string('shift')->nullable();
            $table->decimal('salary', 10, 2)->nullable();
            $table->date('start_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique(['user_id', 'clinic_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctors');
    }
};