<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Clinic;
use App\Support\ModuleMapper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Throwable;

class AuthController extends Controller
{
    /**
     * REGISTER
     *
     * Registration is FREE.
     * payment_method is only stored as the user's selected method.
     * No money is charged and no payment verification is required.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',

            'email' => 'required|email|max:255|unique:users,email',

            'password' => 'required|string|min:6|confirmed',

            'role' => 'required|in:owner,doctor,cashier',

            'phone' => 'nullable|string|max:30',

            // Clinic information for owner registration
            'clinic_name' => 'required_if:role,owner|nullable|string|max:255',

            'clinic_phone' => 'nullable|string|max:30',

            'clinic_address' => 'nullable|string|max:500',

            // Registration is FREE.
            // This is only a selected payment method.
            'payment_method' => [
                'nullable',
                'in:cash,telebirr,cbe_birr,bank_transfer,other'
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please check the registration information.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $result = DB::transaction(function () use ($request) {

                $clinic = null;

                /*
                 * Create clinic only when registering an owner.
                 */
                if ($request->role === 'owner') {
                    $clinic = Clinic::create([
                        'name' => $request->clinic_name,
                        'phone' => $request->clinic_phone,
                        'address' => $request->clinic_address,

                        // Clinic is active immediately.
                        'status' => 'active',
                    ]);
                }

                /*
                 * Create user.
                 *
                 * Registration is completely FREE.
                 * payment_method does NOT trigger a payment.
                 */
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),

                    'role' => $request->role,

                    'phone' => $request->phone ?? null,

                    'clinic_id' => $clinic?->id,

                    // Always active.
                    'is_active' => true,

                    /*
                     * Store selected payment method if your users
                     * table has this column.
                     */
                    'payment_method' => $request->payment_method ?? null,

                    /*
                     * Registration itself costs nothing.
                     */
                    'payment_status' => 'free',
                ]);

                /*
                 * Automatically log the user in after registration.
                 */
                $token = $user->createToken('auth_token')->plainTextToken;

                return [
                    'user' => $user,
                    'clinic' => $clinic,
                    'token' => $token,
                ];
            });

            $user = $result['user'];
            $clinic = $result['clinic'];

            Log::info('User registered successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'clinic_id' => $user->clinic_id,
                'payment_method' => $request->payment_method,
                'payment_status' => 'free',
            ]);

            return response()->json([
                'success' => true,

                'message' => 'Registration successful. Your account is ready to use.',

                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'phone' => $user->phone,
                    'clinic_id' => $user->clinic_id,
                    'clinic_status' => $clinic?->status ?? 'active',
                    'clinic_name' => $clinic?->name,
                    'is_active' => 1,

                    'payment_method' => $user->payment_method ?? null,
                    'payment_status' => 'free',
                    'permissions' => $user->permissions ?? [],
                    'accessible_modules' => \App\Support\ModuleMapper::getAccessibleModules($user),
                ],

                'token' => $result['token'],

                'role' => $user->role,

                /*
                 * Tell React explicitly that no payment is required.
                 */
                'payment' => [
                    'required' => false,
                    'amount' => 0,
                    'status' => 'free',
                    'method' => $request->payment_method ?? null,
                ],
            ], 201);

        } catch (Throwable $e) {

            Log::error('Registration failed', [
                'message' => $e->getMessage(),
                'email' => $request->email,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : null,
            ], 500);
        }
    }


    /**
     * LOGIN
     */
    public function login(Request $request)
    {
        $key = 'login_attempts_' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'success' => false,
                'message' => 'Too many login attempts. Please try again in '
                    . RateLimiter::availableIn($key)
                    . ' seconds.'
            ], 429);
        }

        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            RateLimiter::hit($key, 60);

            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        if (!Hash::check($request->password, $user->password)) {
            RateLimiter::hit($key, 60);

            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Role is identified from the account itself now — the
        // frontend no longer sends one, so there's nothing to
        // cross-check it against.

        /*
         * EVERYONE IS ACTIVE.
         *
         * No approval system.
         * No payment verification.
         */
        if (!$user->is_active) {
            $user->update([
                'is_active' => true,
            ]);
        }

        RateLimiter::clear($key);

        $token = $user->createToken('auth_token')->plainTextToken;

        $clinicStatus = 'active';
        $clinicName = null;

        if ($user->clinic_id) {
            $clinic = Clinic::find($user->clinic_id);

            if ($clinic) {
                $clinicStatus = $clinic->status ?? 'active';
                $clinicName = $clinic->name;
            }
        }

        Log::info('User logged in successfully', [
            'user_id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
        ]);

        return response()->json([
            'success' => true,

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone ?? null,
                'clinic_id' => $user->clinic_id,
                'clinic_status' => $clinicStatus,
                'clinic_name' => $clinicName,
                'permissions' => $user->permissions ?? [],
                'accessible_modules' => ModuleMapper::getAccessibleModules($user),

                // Always active
                'is_active' => 1,

                'payment_method' => $user->payment_method ?? null,
                'payment_status' => $user->payment_status ?? 'free',
            ],

            'token' => $token,

            'role' => $user->role,

            'payment' => [
                'required' => false,
                'amount' => 0,
                'status' => 'free',
            ],
        ]);
    }


    /**
     * LOGOUT
     */
    public function logout(Request $request)
    {
        try {
            if ($request->user()->currentAccessToken()) {
                $request->user()->currentAccessToken()->delete();
            }
        } catch (Throwable $e) {
            // Token may already be invalid.
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }


    /**
     * CURRENT USER
     */
    public function user(Request $request)
    {
        $user = $request->user();

        $clinicStatus = 'active';
        $clinicName = null;

        if ($user->clinic_id) {
            $clinic = Clinic::find($user->clinic_id);

            if ($clinic) {
                $clinicStatus = $clinic->status ?? 'active';
                $clinicName = $clinic->name;
            }
        }

        return response()->json([
            'success' => true,

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone ?? null,
                'clinic_id' => $user->clinic_id,

                'clinic_status' => $clinicStatus,
                'clinic_name' => $clinicName,
                'permissions' => $user->permissions ?? [],
                'accessible_modules' => ModuleMapper::getAccessibleModules($user),

                // Always active
                'is_active' => 1,

                'payment_method' => $user->payment_method ?? null,
                'payment_status' => $user->payment_status ?? 'free',
            ],

            'payment' => [
                'required' => false,
                'amount' => 0,
                'status' => 'free',
            ],
        ]);
    }

    /**
     * GET /api/auth/modules
     * Get accessible modules for the current user
     */
    public function getModules(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => ModuleMapper::getAccessibleModules($user),
        ]);
    }
}