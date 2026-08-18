<?php
// app/Http/Controllers/Api/DoctorController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class DoctorController extends Controller
{
    protected $defaultPassword = 'password123'; // Temporary password

    public function index(Request $request)
    {
        try {
            $clinicId = $request->user()->clinic_id;
            
            $doctors = Doctor::with(['user' => function($query) {
                $query->select('id', 'name', 'email', 'phone', 'is_active');
            }])
            ->where('clinic_id', $clinicId)
            ->orderBy('created_at', 'desc')
            ->get();

            return response()->json($doctors);
        } catch (\Exception $e) {
            Log::error('Error fetching doctors: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to load doctors'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'phone' => 'required|string|max:20',
                'password' => 'required|string|min:6',
                'specialty' => 'nullable|string|max:255',
                'department' => 'nullable|string|max:255',
                'shift' => 'nullable|string|max:50',
                'salary' => 'nullable|numeric|min:0',
                'start_date' => 'nullable|date',
                'license_number' => 'nullable|string|max:50',
            ]);

            $clinicId = $request->user()->clinic_id;

            DB::beginTransaction();

            // Create user account
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
                'role' => 'doctor',
                'clinic_id' => $clinicId,
                'is_active' => true,
            ]);

            // Create doctor profile
            $doctor = Doctor::create([
                'clinic_id' => $clinicId,
                'user_id' => $user->id,
                'specialty' => $validated['specialty'] ?? null,
                'department' => $validated['department'] ?? null,
                'shift' => $validated['shift'] ?? null,
                'salary' => $validated['salary'] ?? null,
                'start_date' => $validated['start_date'] ?? null,
                'license_number' => $validated['license_number'] ?? null,
                'is_active' => true,
            ]);

            DB::commit();

            // Load the user relationship
            $doctor->load(['user' => function($query) {
                $query->select('id', 'name', 'email', 'phone', 'is_active');
            }]);

            return response()->json($doctor, 201);

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating doctor: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create doctor: ' . $e->getMessage()], 500);
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $clinicId = $request->user()->clinic_id;
            
            $doctor = Doctor::with(['user' => function($query) {
                $query->select('id', 'name', 'email', 'phone', 'is_active');
            }])
            ->where('clinic_id', $clinicId)
            ->where('id', $id)
            ->firstOrFail();

            return response()->json($doctor);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'phone' => 'sometimes|required|string|max:20',
                'specialty' => 'nullable|string|max:255',
                'department' => 'nullable|string|max:255',
                'shift' => 'nullable|string|max:50',
                'salary' => 'nullable|numeric|min:0',
                'start_date' => 'nullable|date',
                'license_number' => 'nullable|string|max:50',
                'is_active' => 'sometimes|boolean',
            ]);

            $clinicId = $request->user()->clinic_id;
            
            $doctor = Doctor::where('clinic_id', $clinicId)
                ->where('id', $id)
                ->firstOrFail();

            DB::beginTransaction();

            // Update user
            if (isset($validated['name']) || isset($validated['phone'])) {
                $userData = [];
                if (isset($validated['name'])) {
                    $userData['name'] = $validated['name'];
                }
                if (isset($validated['phone'])) {
                    $userData['phone'] = $validated['phone'];
                }
                if (isset($validated['is_active'])) {
                    $userData['is_active'] = $validated['is_active'];
                }
                
                $doctor->user()->update($userData);
            }

            // Update doctor
            $doctorData = [];
            if (isset($validated['specialty'])) $doctorData['specialty'] = $validated['specialty'];
            if (isset($validated['department'])) $doctorData['department'] = $validated['department'];
            if (isset($validated['shift'])) $doctorData['shift'] = $validated['shift'];
            if (isset($validated['salary'])) $doctorData['salary'] = $validated['salary'];
            if (isset($validated['start_date'])) $doctorData['start_date'] = $validated['start_date'];
            if (isset($validated['license_number'])) $doctorData['license_number'] = $validated['license_number'];
            
            $doctor->update($doctorData);

            DB::commit();

            // Reload with user
            $doctor->load(['user' => function($query) {
                $query->select('id', 'name', 'email', 'phone', 'is_active');
            }]);

            return response()->json($doctor);

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating doctor: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update doctor'], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $clinicId = $request->user()->clinic_id;
            
            $doctor = Doctor::where('clinic_id', $clinicId)
                ->where('id', $id)
                ->firstOrFail();

            DB::beginTransaction();

            // Delete doctor record
            $doctor->delete();
            
            // Delete user (optional - or just deactivate)
            $doctor->user()->delete();

            DB::commit();

            return response()->json(['message' => 'Doctor deleted successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting doctor: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete doctor'], 500);
        }
    }

    public function toggleStatus(Request $request, $id)
    {
        try {
            $clinicId = $request->user()->clinic_id;
            
            $doctor = Doctor::where('clinic_id', $clinicId)
                ->where('id', $id)
                ->firstOrFail();
            
            $newStatus = !$doctor->is_active;
            $doctor->update(['is_active' => $newStatus]);
            $doctor->user()->update(['is_active' => $newStatus]);

            // Reload with user
            $doctor->load(['user' => function($query) {
                $query->select('id', 'name', 'email', 'phone', 'is_active');
            }]);

            return response()->json($doctor);

        } catch (\Exception $e) {
            Log::error('Error toggling doctor status: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to toggle status'], 500);
        }
    }

    public function resetPassword(Request $request, $id)
    {
        try {
            $clinicId = $request->user()->clinic_id;
            
            $doctor = Doctor::where('clinic_id', $clinicId)
                ->where('id', $id)
                ->firstOrFail();

            // Reset to temporary password
            $doctor->user()->update([
                'password' => Hash::make($this->defaultPassword)
            ]);

            return response()->json([
                'message' => 'Password reset successfully',
                'default_password' => $this->defaultPassword
            ]);

        } catch (\Exception $e) {
            Log::error('Error resetting password: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to reset password'], 500);
        }
    }

    public function activate(Request $request, $id)
    {
        try {
            $clinicId = $request->user()->clinic_id;
            
            $doctor = Doctor::where('clinic_id', $clinicId)
                ->where('id', $id)
                ->firstOrFail();
            
            $doctor->update(['is_active' => true]);
            $doctor->user()->update(['is_active' => true]);

            $doctor->load(['user' => function($query) {
                $query->select('id', 'name', 'email', 'phone', 'is_active');
            }]);

            return response()->json($doctor);

        } catch (\Exception $e) {
            Log::error('Error activating doctor: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to activate doctor'], 500);
        }
    }

    public function deactivate(Request $request, $id)
    {
        try {
            $clinicId = $request->user()->clinic_id;
            
            $doctor = Doctor::where('clinic_id', $clinicId)
                ->where('id', $id)
                ->firstOrFail();
            
            $doctor->update(['is_active' => false]);
            $doctor->user()->update(['is_active' => false]);

            $doctor->load(['user' => function($query) {
                $query->select('id', 'name', 'email', 'phone', 'is_active');
            }]);

            return response()->json($doctor);

        } catch (\Exception $e) {
            Log::error('Error deactivating doctor: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to deactivate doctor'], 500);
        }
    }
}