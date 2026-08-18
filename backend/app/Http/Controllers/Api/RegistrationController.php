<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicRegistration;
use App\Models\Clinic;
use App\Models\User;
use App\Models\ClinicSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RegistrationController extends Controller
{
    // ✅ REGISTER - Direct registration (NO ADMIN APPROVAL NEEDED)
    public function register(Request $request)
    {
        // Match frontend field names
        $validator = Validator::make($request->all(), [
            // Clinic Info
            'clinicName' => 'required|string|max:255',
            'clinicEmail' => 'required|email',
            'clinicPhone' => 'required|string|max:20',
            'taxId' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'website' => 'nullable|url|max:255',
            
            // Owner Info
            'ownerName' => 'required|string|max:255',
            'ownerEmail' => 'required|email|unique:users,email',
            'ownerPhone' => 'required|string|max:20',
            'password' => 'required|string|min:8',
            
            // Documents (optional)
            'businessLicense' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'ownerId' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'clinicPhoto' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            
            // Subscription & Payment
            'subscriptionPlan' => 'required|in:basic,standard,premium',
            'paymentMethod' => 'required|in:telebirr,bank,card',
            'transactionId' => 'required|string',
        ]);

        if ($validator->fails()) {
            Log::error('Registration validation failed', [
                'errors' => $validator->errors()->toArray()
            ]);
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Upload documents if provided
            $businessLicensePath = $request->hasFile('businessLicense') 
                ? $this->uploadFile($request->file('businessLicense'), 'business_licenses') 
                : null;
            
            $ownerIdPath = $request->hasFile('ownerId') 
                ? $this->uploadFile($request->file('ownerId'), 'owner_ids') 
                : null;
            
            $clinicPhotoPath = $request->hasFile('clinicPhoto') 
                ? $this->uploadFile($request->file('clinicPhoto'), 'clinic_photos') 
                : null;

            // 1️⃣ CREATE USER FIRST (ACTIVE)
            $user = User::create([
                'name' => $request->ownerName,
                'email' => $request->ownerEmail,
                'phone' => $request->ownerPhone,
                'password' => Hash::make($request->password),
                'role' => 'owner',
                'clinic_id' => null,
                'is_active' => 1, // ✅ ACTIVE IMMEDIATELY
            ]);

            // 2️⃣ CREATE CLINIC (ACTIVE)
            $clinic = Clinic::create([
                'name' => $request->clinicName,
                'email' => $request->clinicEmail,
                'phone' => $request->clinicPhone,
                'address' => $request->address,
                'city' => $request->city ?? 'Addis Ababa',
                'country' => $request->country ?? 'Ethiopia',
                'tax_id' => $request->taxId,
                'website' => $request->website,
                'subscription_plan' => $request->subscriptionPlan,
                'status' => 'active',
                'is_active' => 1,
                'subscription_expires_at' => now()->addYear(),
            ]);

            // 3️⃣ UPDATE USER WITH CLINIC ID
            $user->update([
                'clinic_id' => $clinic->id,
            ]);

            // 4️⃣ CREATE REGISTRATION RECORD (FOR REFERENCE)
            $registration = ClinicRegistration::create([
                'clinic_name' => $request->clinicName,
                'clinic_email' => $request->clinicEmail,
                'clinic_phone' => $request->clinicPhone,
                'address' => $request->address,
                'city' => $request->city ?? 'Addis Ababa',
                'country' => $request->country ?? 'Ethiopia',
                'website' => $request->website,
                'tax_id' => $request->taxId,
                'owner_name' => $request->ownerName,
                'owner_phone' => $request->ownerPhone,
                'owner_email' => $request->ownerEmail,
                'owner_password' => Hash::make($request->password),
                'business_license' => $businessLicensePath,
                'owner_id_document' => $ownerIdPath,
                'clinic_photo' => $clinicPhotoPath,
                'requested_plan' => $request->subscriptionPlan,
                'payment_method' => $request->paymentMethod,
                'transaction_id' => $request->transactionId,
                'payment_status' => 'completed',
                'subscription_expires_at' => now()->addYear(),
                'status' => 'active', // ✅ NO APPROVAL NEEDED
                'approved_at' => now(),
            ]);

            // 5️⃣ CREATE SUBSCRIPTION RECORD
            $amount = $this->getPlanAmount($request->subscriptionPlan);
            $subscription = ClinicSubscription::create([
                'clinic_id' => $clinic->id,
                'plan' => $request->subscriptionPlan,
                'payment_method' => $request->paymentMethod,
                'transaction_id' => $request->transactionId,
                'amount' => $amount,
                'currency' => 'ETB',
                'status' => 'completed',
                'payment_date' => now(),
                'expires_at' => now()->addYear(),
                'metadata' => [
                    'registered_at' => now()->toISOString(),
                    'registration_id' => $registration->id,
                ],
            ]);

            DB::commit();

            Log::info('✅ Clinic registered successfully', [
                'clinic_id' => $clinic->id,
                'user_id' => $user->id,
                'email' => $request->ownerEmail,
                'plan' => $request->subscriptionPlan,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Clinic registered successfully!',
                'data' => [
                    'clinic' => $clinic,
                    'user' => $user,
                    'subscription' => $subscription,
                    'registration' => $registration,
                    'credentials' => [
                        'email' => $request->ownerEmail,
                        'password' => $request->password,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Registration failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // Helper: Upload file
    private function uploadFile($file, $folder)
    {
        try {
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs("public/clinic_documents/{$folder}", $filename);
            return str_replace('public/', 'storage/', $path);
        } catch (\Exception $e) {
            Log::error('File upload failed: ' . $e->getMessage());
            return null;
        }
    }

    // Helper: Get plan amount
    private function getPlanAmount($plan)
    {
        return match($plan) {
            'basic' => 1000,
            'standard' => 2500,
            'premium' => 5000,
            default => 2500,
        };
    }

    // ✅ SAVE DRAFT - Save registration progress
    public function saveDraft(Request $request)
    {
        try {
            $registration = ClinicRegistration::updateOrCreate(
                ['owner_email' => $request->ownerEmail, 'status' => 'draft'],
                [
                    'clinic_name' => $request->clinicName,
                    'clinic_email' => $request->clinicEmail,
                    'clinic_phone' => $request->clinicPhone,
                    'owner_name' => $request->ownerName,
                    'owner_phone' => $request->ownerPhone,
                    'status' => 'draft',
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Draft saved successfully',
                'data' => $registration
            ]);
        } catch (\Exception $e) {
            Log::error('Save draft failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save draft'
            ], 500);
        }
    }

    // ✅ ADMIN GET ALL REGISTRATIONS (Read Only)
    public function index(Request $request)
    {
        try {
            $status = $request->get('status', 'all');
            
            $query = ClinicRegistration::query();
            
            if ($status !== 'all') {
                $query->where('status', $status);
            }
            
            $registrations = $query->orderBy('created_at', 'desc')->get()->map(function ($reg) {
                return [
                    'id' => $reg->id,
                    'clinic_name' => $reg->clinic_name,
                    'clinic_email' => $reg->clinic_email,
                    'clinic_phone' => $reg->clinic_phone,
                    'owner_name' => $reg->owner_name,
                    'owner_email' => $reg->owner_email,
                    'owner_phone' => $reg->owner_phone,
                    'subscription_plan' => $reg->requested_plan,
                    'payment_method' => $reg->payment_method ?? 'N/A',
                    'transaction_id' => $reg->transaction_id ?? 'N/A',
                    'status' => $reg->status,
                    'created_at' => $reg->created_at,
                    'address' => $reg->address,
                    'city' => $reg->city,
                    'country' => $reg->country,
                ];
            });

            // Calculate stats
            $total = ClinicRegistration::count();
            $active = ClinicRegistration::where('status', 'active')->count();
            $pending = ClinicRegistration::where('status', 'pending')->count();
            $rejected = ClinicRegistration::where('status', 'rejected')->count();

            return response()->json([
                'success' => true,
                'registrations' => $registrations,
                'stats' => [
                    'total' => $total,
                    'active' => $active,
                    'pending' => $pending,
                    'rejected' => $rejected,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to fetch registrations: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch registrations'
            ], 500);
        }
    }

    // ✅ ADMIN GET SINGLE REGISTRATION
    public function show($id)
    {
        try {
            $registration = ClinicRegistration::findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $registration
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration not found'
            ], 404);
        }
    }
}