<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ConsultationController extends Controller
{
    private function canView($user): bool
    {
        if (!$user) {
            return false;
        }

        $role = strtolower(trim((string) $user->role));

        return in_array($role, [
            'owner', 'business_owner', 'business-owner',
            'clinic_owner', 'clinic-owner', 'doctor', 'cashier',
        ], true);
    }

    /**
     * GET /api/patients/{id}/history
     * GET /api/patients/{id}/consultations
     *
     * Used by:
     * - Doctor's "Patient History" view (their own patients' past visits)
     * - Owner's "Patient Medical Records" module (full clinic view)
     */
    public function index(Request $request, $patientId)
    {
        $user = $request->user();

        if (!$user || !$user->clinic_id) {
            return response()->json([
                'success' => false,
                'message' => 'User is not associated with a clinic.',
            ], 403);
        }

        if (!$this->canView($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to view medical records.',
            ], 403);
        }

        $patient = Patient::where('clinic_id', $user->clinic_id)
            ->findOrFail($patientId);

        $consultations = Consultation::with(['doctor.user:id,name'])
            ->where('clinic_id', $user->clinic_id)
            ->where('patient_id', $patient->id)
            ->orderByDesc('visit_date')
            ->orderByDesc('id')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'visit_date' => optional($c->visit_date)->format('Y-m-d'),
                    'doctor_name' => optional($c->doctor->user)->name ?? 'Unknown',
                    'chief_complaint' => $c->chief_complaint,
                    'symptoms' => $c->symptoms,
                    'vital_signs' => $c->vital_signs,
                    'examination_findings' => $c->examination_findings,
                    'diagnosis' => $c->diagnosis,
                    'treatment' => $c->treatment,
                    'prescription' => $c->prescription,
                    'recommendations' => $c->recommendations,
                    'doctor_notes' => $c->doctor_notes,
                    'follow_up_date' => optional($c->follow_up_date)->format('Y-m-d'),
                    'created_at' => $c->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'patient' => [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_code,
                    'name' => $patient->full_name,
                    'age' => $patient->age,
                    'gender' => $patient->gender,
                    'phone' => $patient->phone,
                    'address' => $patient->address,
                ],
                'consultations' => $consultations,
            ],
        ]);
    }

    /**
     * POST /api/consultations
     *
     * Doctor records what was asked / found / treated during a visit.
     * The doctor_id is resolved from the logged-in doctor automatically
     * (an owner can also file one on a doctor's behalf by passing doctor_id).
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->clinic_id) {
            return response()->json([
                'success' => false,
                'message' => 'User is not associated with a clinic.',
            ], 403);
        }

        $role = strtolower(trim((string) $user->role));

        $validator = Validator::make($request->all(), [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'doctor_id' => ['nullable', 'integer', 'exists:doctors,id'],
            'visit_date' => ['nullable', 'date'],
            'chief_complaint' => ['nullable', 'string'],
            'symptoms' => ['nullable', 'string'],
            'vital_signs' => ['nullable', 'string', 'max:255'],
            'examination_findings' => ['nullable', 'string'],
            'diagnosis' => ['nullable', 'string'],
            'treatment' => ['nullable', 'string'],
            'prescription' => ['nullable', 'string'],
            'recommendations' => ['nullable', 'string'],
            'doctor_notes' => ['nullable', 'string'],
            'follow_up_date' => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $patient = Patient::where('clinic_id', $user->clinic_id)
            ->where('id', $request->patient_id)
            ->first();

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient not found in your clinic.',
            ], 404);
        }

        // Resolve doctor: the logged-in doctor, or (owner only) the doctor_id passed in.
        if (in_array($role, ['owner', 'business_owner', 'business-owner', 'clinic_owner', 'clinic-owner'], true)) {
            if (!$request->filled('doctor_id')) {
                return response()->json([
                    'success' => false,
                    'message' => 'doctor_id is required when filing this as an owner.',
                ], 422);
            }

            $doctor = Doctor::where('clinic_id', $user->clinic_id)
                ->where('id', $request->doctor_id)
                ->first();
        } elseif ($role === 'doctor') {
            $doctor = Doctor::where('clinic_id', $user->clinic_id)
                ->where('user_id', $user->id)
                ->first();
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Only doctors (or the clinic owner) can record consultations.',
            ], 403);
        }

        if (!$doctor) {
            return response()->json([
                'success' => false,
                'message' => 'Doctor profile not found for your clinic.',
            ], 404);
        }

        $consultation = Consultation::create([
            'clinic_id' => $user->clinic_id,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'created_by' => $user->id,
            'visit_date' => $request->visit_date ?: now()->toDateString(),
            'chief_complaint' => $request->chief_complaint,
            'symptoms' => $request->symptoms,
            'vital_signs' => $request->vital_signs,
            'examination_findings' => $request->examination_findings,
            'diagnosis' => $request->diagnosis,
            'treatment' => $request->treatment,
            'prescription' => $request->prescription,
            'recommendations' => $request->recommendations,
            'doctor_notes' => $request->doctor_notes,
            'follow_up_date' => $request->follow_up_date,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Consultation recorded successfully.',
            'data' => $consultation,
        ], 201);
    }

    /**
     * PUT /api/consultations/{id}
     *
     * Edit an existing medical record.
     * - Owners can edit any consultation in their clinic (used by the
     *   Owner "Patient Medical Records" module Edit button).
     * - Doctors can only edit their own consultations.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || !$user->clinic_id) {
            return response()->json([
                'success' => false,
                'message' => 'User is not associated with a clinic.',
            ], 403);
        }

        $role = strtolower(trim((string) $user->role));

        $consultation = Consultation::where('clinic_id', $user->clinic_id)->find($id);

        if (!$consultation) {
            return response()->json([
                'success' => false,
                'message' => 'Consultation record not found.',
            ], 404);
        }

        $isOwner = in_array($role, ['owner', 'business_owner', 'business-owner', 'clinic_owner', 'clinic-owner'], true);

        if ($isOwner) {
            // Owners may edit any medical record that belongs to their clinic.
        } elseif ($role === 'doctor') {
            $doctor = Doctor::where('clinic_id', $user->clinic_id)
                ->where('user_id', $user->id)
                ->first();

            if (!$doctor || (int) $consultation->doctor_id !== (int) $doctor->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only edit your own consultations.',
                ], 403);
            }
        } else {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to edit medical records.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'visit_date' => ['nullable', 'date'],
            'chief_complaint' => ['nullable', 'string'],
            'symptoms' => ['nullable', 'string'],
            'vital_signs' => ['nullable', 'string', 'max:255'],
            'examination_findings' => ['nullable', 'string'],
            'diagnosis' => ['nullable', 'string'],
            'treatment' => ['nullable', 'string'],
            'prescription' => ['nullable', 'string'],
            'recommendations' => ['nullable', 'string'],
            'doctor_notes' => ['nullable', 'string'],
            'follow_up_date' => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $consultation->update([
            'visit_date' => $request->filled('visit_date')
                ? $request->visit_date
                : $consultation->visit_date,
            'chief_complaint' => $request->chief_complaint,
            'symptoms' => $request->symptoms,
            'vital_signs' => $request->vital_signs,
            'examination_findings' => $request->examination_findings,
            'diagnosis' => $request->diagnosis,
            'treatment' => $request->treatment,
            'prescription' => $request->prescription,
            'recommendations' => $request->recommendations,
            'doctor_notes' => $request->doctor_notes,
            'follow_up_date' => $request->follow_up_date ?: null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Medical record updated successfully.',
            'data' => $consultation->fresh(),
        ]);
    }
}