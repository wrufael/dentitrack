<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Clinic Owner
        $owner = User::create([
            'clinic_id' => 1,
            'name' => 'Clinic Owner',
            'email' => 'owner@dentitrack.com',
            'password' => bcrypt('password123'),
            'role' => 'owner',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // 2. Doctor
        $doctorUser = User::create([
            'clinic_id' => 1,
            'name' => 'Dr. John Doe',
            'email' => 'doctor@dentitrack.com',
            'password' => bcrypt('password123'),
            'role' => 'doctor',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        DB::table('doctors')->insert([
            'clinic_id' => 1,
            'user_id' => $doctorUser->id,
            'specialization' => 'General Dentistry',
            'license_number' => 'LIC-0001',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Cashier
        $cashierUser = User::create([
            'clinic_id' => 1,
            'name' => 'Cashier One',
            'email' => 'cashier@dentitrack.com',
            'password' => bcrypt('password123'),
            'role' => 'cashier',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        DB::table('cashiers')->insert([
            'clinic_id' => 1,
            'user_id' => $cashierUser->id,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. Platform Admin (no clinic)
        User::create([
            'clinic_id' => null,
            'name' => 'Platform Admin',
            'email' => 'admin@dentitrack.com',
            'password' => bcrypt('password123'),
            'role' => 'platform_admin',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
    }
}