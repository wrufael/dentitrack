<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Clinic;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create clinic
        $clinic = Clinic::create([
            'name' => 'Dr. Rediet Dental Clinic',
            'owner_name' => 'Dr. Rediet Haile',
            'owner_phone' => '+251 91 000 0001',
            'email' => 'clinic@drrediet.com',
            'address' => 'Addis Ababa, Ethiopia',
            'city' => 'Addis Ababa',
            'country' => 'Ethiopia',
            'subscription_plan' => 'premium',
            'is_active' => true,
        ]);

        // Create Owner
        User::create([
            'name' => 'Dr. Rediet Haile',
            'email' => 'owner@dentitrack.com',
            'phone' => '+251 91 000 0001',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'clinic_id' => $clinic->id,
            'is_active' => true,
        ]);

        // Create Doctor
        User::create([
            'name' => 'Dr. Liya Hailu',
            'email' => 'doctor@dentitrack.com',
            'phone' => '+251 91 000 0002',
            'password' => Hash::make('password123'),
            'role' => 'doctor',
            'clinic_id' => $clinic->id,
            'is_active' => true,
        ]);

        // Create Cashier
        User::create([
            'name' => 'Saron Kebede',
            'email' => 'cashier@dentitrack.com',
            'phone' => '+251 91 000 0003',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'clinic_id' => $clinic->id,
            'is_active' => true,
        ]);

        // Create Platform Admin
        User::create([
            'name' => 'System Admin',
            'email' => 'admin@dentitrack.com',
            'phone' => '+251 91 000 0000',
            'password' => Hash::make('password123'),
            'role' => 'platform_admin',
            'clinic_id' => null,
            'is_active' => true,
        ]);

        $this->command->info('✅ Users created successfully!');
        $this->command->info('Owner: owner@dentitrack.com / password123');
        $this->command->info('Doctor: doctor@dentitrack.com / password123');
        $this->command->info('Cashier: cashier@dentitrack.com / password123');
        $this->command->info('Admin: admin@dentitrack.com / password123');
    }
}