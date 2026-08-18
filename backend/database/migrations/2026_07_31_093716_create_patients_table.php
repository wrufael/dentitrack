<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->onDelete('cascade');
            $table->string('full_name');
            $table->integer('age');
            $table->enum('gender', ['male', 'female', 'other']);
            $table->string('phone');
            $table->text('address')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->string('patient_code')->unique();
            $table->foreignId('registered_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('registered_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};