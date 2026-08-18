<?php
// database/migrations/2026_08_15_120000_create_consultations_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('clinic_id')
                ->constrained('clinics')
                ->cascadeOnDelete();

            $table->foreignId('patient_id')
                ->constrained('patients')
                ->cascadeOnDelete();

            $table->foreignId('doctor_id')
                ->constrained('doctors')
                ->cascadeOnDelete();

            $table->foreignId('created_by')
                ->constrained('users')
                ->cascadeOnDelete();

            // Visit / consultation info (what the doctor asked & found)
            $table->date('visit_date');
            $table->text('chief_complaint')->nullable();   // reason patient came / questions asked
            $table->text('symptoms')->nullable();
            $table->string('vital_signs')->nullable();     // e.g. "BP 120/80, Temp 36.7"
            $table->text('examination_findings')->nullable();

            // Treatment info
            $table->text('diagnosis')->nullable();
            $table->text('treatment')->nullable();
            $table->text('prescription')->nullable();
            $table->text('doctor_notes')->nullable();
            $table->date('follow_up_date')->nullable();

            // Status
            $table->enum('status', ['draft', 'completed', 'cancelled'])->default('draft');

            $table->timestamps();

            $table->index(['clinic_id', 'patient_id']);
            $table->index(['doctor_id', 'visit_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};