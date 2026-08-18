<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('clinic_registrations', function (Blueprint $table) {
            $table->id();
            
            // Clinic Information
            $table->string('clinic_name');
            $table->string('clinic_email')->unique();
            $table->string('clinic_phone');
            $table->text('address')->nullable();
            $table->string('city')->default('Addis Ababa');
            $table->string('country')->default('Ethiopia');
            $table->string('website')->nullable();
            $table->string('tax_id')->nullable();
            
            // Owner Information
            $table->string('owner_name');
            $table->date('owner_dob')->nullable();
            $table->enum('owner_gender', ['male', 'female', 'other'])->default('male');
            $table->string('owner_nationality')->default('Ethiopian');
            $table->string('owner_id_number')->nullable();
            $table->string('owner_phone');
            $table->string('owner_email')->unique();
            $table->string('owner_password');
            
            // License Information
            $table->string('license_number')->nullable();
            $table->string('license_authority')->nullable();
            $table->date('license_issue_date')->nullable();
            $table->date('license_expiry_date')->nullable();
            
            // Document Paths
            $table->string('business_license')->nullable();
            $table->string('owner_id_document')->nullable();
            $table->string('clinic_photo')->nullable();
            
            // Business Details
            $table->enum('requested_plan', ['basic', 'standard', 'premium'])->default('basic');
            $table->integer('estimated_doctors')->nullable();
            $table->integer('estimated_staff')->nullable();
            $table->integer('years_in_operation')->nullable();
            $table->string('clinic_hours')->nullable();
            
            // ✅ PAYMENT INFORMATION (ADDED)
            $table->string('payment_method')->nullable();
            $table->string('transaction_id')->nullable()->unique();
            $table->string('payment_status')->default('pending');
            $table->timestamp('subscription_expires_at')->nullable();
            
            // Status
            $table->enum('status', ['draft', 'pending', 'active', 'rejected'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('clinic_registrations');
    }
};