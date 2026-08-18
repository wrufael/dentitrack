<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PatientController extends Controller
{
    
/**
     * True if the employee's owner-granted permissions include any of
     * the given "Patients" module labels (e.g. 'View Patients',
     * 'Create Patients'). This is what makes access follow what the
     * owner actually checked in Employee Management, instead of a
     * fixed role list — a receptionist, nurse, or lab tech granted
     * "View Patients" can view; without it, they can't, regardless
     * of role.
     */
    private function hasPatientPermission($user, array $labels): bool
    {
        if (!$user) {
            return false;
        }

        $perms = is_array($user->permissions) ? $user->permissions : [];

        foreach ($labels as $label) {
            if (in_array('Patients::' . $label, $perms, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Who is allowed to CREATE / EDIT patient records.
     * Owner/cashier always can. Any other employee (nurse,
     * receptionist, lab_technician, etc.) can too, IF the owner
     * granted them "Create Patients" or "Edit Patients".
     */
    private function canManagePatients($user): bool
    {
        if (!$user) {
            return false;
        }

        $role = strtolower(trim((string) $user->role));

        if (in_array($role, [
            'owner', 'business_owner', 'business-owner',
            'clinic_owner', 'clinic-owner', 'cashier',
        ], true)) {
            return true;
        }

        return $this->hasPatientPermission($user, ['Create Patients', 'Edit Patients']);
    }

    /**
     * Who is allowed to READ patient records (list + single patient).
     * Same as canManagePatients() plus 'doctor' (built-in — doctors
     * always need to open a patient to record a consultation) — plus
     * any employee the owner granted "View Patients" or
     * "View Patients (basic info)" to.
     */
    private function canViewPatients($user): bool
    {
        if (!$user) {
            return false;
        }

        $role = strtolower(trim((string) $user->role));

        if (in_array($role, [
            'owner', 'business_owner', 'business-owner',
            'clinic_owner', 'clinic-owner', 'cashier', 'doctor',
        ], true)) {
            return true;
        }

        return $this->hasPatientPermission($user, [
            'View Patients', 'View Patients (basic info)',
        ]);
    }
    private function paymentValidationRules(): array
    {
        return [
            'payment_method' => ['nullable', 'in:free,cash,telebirr,cbe_birr,bank_transfer,card'],
            'payment_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', 'string'],

            'telebirr_phone' => ['nullable', 'string', 'max:255'],
            'telebirr_reference' => ['nullable', 'string', 'max:255'],
            'cbe_birr_phone' => ['nullable', 'string', 'max:255'],
            'cbe_birr_reference' => ['nullable', 'string', 'max:255'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'bank_reference' => ['nullable', 'string', 'max:255'],
            'card_holder_name' => ['nullable', 'string', 'max:255'],
            'card_last_four' => ['nullable', 'string', 'max:4'],
        ];
    }

    /**
     * Build the payment-related column values to save,
     * with safe defaults when nothing is sent (e.g. cashier's
     * simpler registration form).
     */
    private function buildPaymentData(Request $request): array
    {
        $method = $request->payment_method ?? 'free';

        return [
            'payment_method' => $method,

            'payment_amount' => $method === 'free'
                ? 0
                : (float) ($request->payment_amount ?? 0),

            'payment_status' => $method === 'free'
                ? 'free'
                : ($request->payment_status ?? 'paid'),

            'payment_phone' => $request->telebirr_phone
                ?: $request->cbe_birr_phone
                ?: null,

            'payment_reference' => $request->telebirr_reference
                ?: $request->cbe_birr_reference
                ?: $request->bank_reference
                ?: null,

            'payment_bank_name' => $request->bank_name ?: null,

            'card_holder_name' => $method === 'card'
                ? ($request->card_holder_name ?: null)
                : null,

            'card_last_four' => $method === 'card'
                ? ($request->card_last_four ?: null)
                : null,
        ];
    }

    /**
     * Search patients within the user's clinic.
     *
     * Used by:
     * - New Appointment modal (PatientSearchInput.jsx)
     * - New Payment Request modal (once wired to real data)
     *
     * Intentionally NOT restricted by canManagePatients() —
     * doctors need to search patients too, not just
     * owners/cashiers.
     */
    public function search(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->clinic_id) {
            return response()->json([
                'success' => false,
                'message' => 'User is not associated with a clinic.',
            ], 403);
        }

        $term = trim((string) $request->query('q', ''));

        if ($term === '') {
            return response()->json([]);
        }

        $patients = Patient::where('clinic_id', $user->clinic_id)
            ->where(function ($q) use ($term) {
                $q->where('full_name', 'like', "%{$term}%")
                  ->orWhere('patient_code', 'like', "%{$term}%")
                  ->orWhere('phone', 'like', "%{$term}%");
            })
            ->orderBy('full_name')
            ->limit(20)
            ->get();

        // PatientSearchInput.jsx expects: id, name, patient_id, phone, age
        return response()->json(
            $patients->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->full_name,
                    'patient_id' => $p->patient_code,
                    'phone' => $p->phone,
                    'age' => $p->age,
                    'gender' => $p->gender,
                ];
            })
        );
    }

    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->clinic_id) {
            return response()->json([
                'success' => false,
                'message' => 'User is not associated with a clinic.',
            ], 403);
        }

        if (!$this->canViewPatients($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to view patients.',
                'role' => $user->role,
            ], 403);
        }

        $query = Patient::where('clinic_id', $user->clinic_id);

        if ($request->filled('search')) {
            $search = trim($request->search);

            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('patient_code', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $patients = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $patients,
            'summary' => [
                'total' => $patients->count(),
                'male' => $patients->where('gender', 'male')->count(),
                'female' => $patients->where('gender', 'female')->count(),
                'children' => $patients->where('age', '<=', 12)->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->clinic_id) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is not associated with a clinic.',
            ], 403);
        }

        if (!$this->canManagePatients($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to register patients.',
                'your_role' => $user->role,
            ], 403);
        }

        $rules = array_merge([
            'full_name' => ['required', 'string', 'max:255'],
            'age' => ['required', 'integer', 'min:0', 'max:120'],
            'gender' => ['required', 'in:male,female,other'],
            'phone' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'emergency_contact' => ['nullable', 'string', 'max:255'],
        ], $this->paymentValidationRules());

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $patient = DB::transaction(function () use ($request, $user) {

            $patient = Patient::create(array_merge([
                'clinic_id' => $user->clinic_id,
                'full_name' => trim($request->full_name),
                'age' => (int) $request->age,
                'gender' => $request->gender,
                'phone' => trim($request->phone),
                'address' => $request->address ? trim($request->address) : null,
                'emergency_contact' => $request->emergency_contact ? trim($request->emergency_contact) : null,
                'registered_by' => $user->id,
            ], $this->buildPaymentData($request)));

            $patient->patient_code = 'PAT-' . str_pad($patient->id, 4, '0', STR_PAD_LEFT);
            $patient->save();

            return $patient->fresh();
        });

        return response()->json([
            'success' => true,
            'message' => 'Patient registered successfully.',
            'data' => $patient,
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || !$user->clinic_id) {
            return response()->json([
                'success' => false,
                'message' => 'User is not associated with a clinic.',
            ], 403);
        }

        if (!$this->canViewPatients($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to view this patient.',
                'your_role' => $user->role,
            ], 403);
        }

        $patient = Patient::where('clinic_id', $user->clinic_id)->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $patient,
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->clinic_id) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is not associated with a clinic.',
            ], 403);
        }

        if (!$this->canManagePatients($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to update patients.',
                'your_role' => $user->role,
            ], 403);
        }

        $patient = Patient::where('clinic_id', $user->clinic_id)->findOrFail($id);

        $rules = array_merge([
            'full_name' => 'required|string|max:255',
            'age' => 'required|integer|min:0|max:120',
            'gender' => 'required|in:male,female,other',
            'phone' => 'required|string|max:255',
            'address' => 'nullable|string',
            'emergency_contact' => 'nullable|string|max:255',
        ], $this->paymentValidationRules());

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $patient->update(array_merge([
            'full_name' => trim($request->full_name),
            'age' => (int) $request->age,
            'gender' => $request->gender,
            'phone' => trim($request->phone),
            'address' => $request->address ? trim($request->address) : null,
            'emergency_contact' => $request->emergency_contact ? trim($request->emergency_contact) : null,
        ], $this->buildPaymentData($request)));

        return response()->json([
            'success' => true,
            'message' => 'Patient updated successfully.',
            'data' => $patient->fresh(),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->clinic_id) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is not associated with a clinic.',
            ], 403);
        }

        $role = strtolower(trim((string) $user->role));

        if (!in_array($role, [
            'owner', 'business_owner', 'business-owner',
            'clinic_owner', 'clinic-owner',
        ], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Only the business/clinic owner can delete patients.',
                'your_role' => $user->role,
            ], 403);
        }

        $patient = Patient::where('clinic_id', $user->clinic_id)->findOrFail($id);
        $patient->delete();

        return response()->json([
            'success' => true,
            'message' => 'Patient deleted successfully.',
        ]);
    }
}