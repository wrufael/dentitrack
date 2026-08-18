<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('clinic_id')->constrained('clinics')->onDelete('cascade');
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('doctor_id')->constrained('doctors')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('collected_by')->nullable()->constrained('users')->onDelete('set null');

            $table->string('request_code')->unique();

            $table->string('patient_name');
            $table->integer('patient_age')->nullable();
            $table->string('patient_gender')->nullable();
            $table->string('patient_phone')->nullable();

            $table->decimal('total', 10, 2);
            $table->decimal('paid', 10, 2)->default(0);
            $table->decimal('balance', 10, 2);

            $table->string('status')->default('pending');
            $table->string('payment_method')->nullable();
            $table->string('receipt_number')->nullable();
            $table->string('proof_photo_path')->nullable();
            $table->timestamp('proof_uploaded_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_requests');
    }
};