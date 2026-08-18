<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // Who created it
            
            // Expense Details
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('amount', 15, 2);
            $table->date('expense_date');
            
            // Category System
            $table->enum('category', [
                'salary',           // Employee salaries
                'rent',             // Clinic rent
                'utilities',        // Electricity, water, internet
                'inventory',        // Medical supplies, equipment
                'marketing',        // Advertising, promotions
                'maintenance',      // Equipment repair, cleaning
                'insurance',        // Clinic insurance
                'software',         // Software subscriptions
                'training',         // Staff training
                'tax',              // Tax payments
                'other'             // Miscellaneous
            ])->default('other');
            
            // For salary category
            $table->foreignId('employee_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('employee_name')->nullable();
            $table->string('employee_role')->nullable(); // doctor, cashier, admin
            
            // Payment Details
            $table->enum('payment_method', ['cash', 'bank_transfer', 'cheque', 'mobile_money'])->default('cash');
            $table->string('transaction_id')->nullable();
            $table->string('receipt_number')->nullable();
            $table->string('attachment')->nullable(); // File path
            
            // Recurring expenses
            $table->boolean('is_recurring')->default(false);
            $table->enum('recurring_period', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])->nullable();
            $table->date('recurring_end_date')->nullable();
            
            // Status
            $table->enum('status', ['pending', 'approved', 'paid', 'cancelled'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['clinic_id', 'category']);
            $table->index(['clinic_id', 'expense_date']);
            $table->index(['clinic_id', 'employee_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('expenses');
    }
};