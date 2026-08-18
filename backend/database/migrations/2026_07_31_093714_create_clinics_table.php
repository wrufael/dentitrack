<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('clinics', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('owner_name');
            $table->string('owner_phone');
            $table->string('email')->unique();
            $table->text('address')->nullable();
            $table->string('city')->default('Addis Ababa');
            $table->string('country')->default('Ethiopia');
            $table->enum('subscription_plan', ['basic', 'standard', 'premium'])->default('basic');
            $table->boolean('is_active')->default(true);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('subscription_expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('clinics');
    }
};