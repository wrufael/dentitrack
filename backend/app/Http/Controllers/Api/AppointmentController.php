<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AppointmentController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    private function getClinicId(Request $request)
    {
        return $request->user()->clinic_id;
    }

    /**
     * Normalize frontend/backend field names.
     */
    private function normalizeAppointmentData(
        Request $request
    ) {
        return [
            'patient_id' =>
                $request->input(
                    'patient_id',
                    $request->input('patientId')
                ),

            'doctor_id' =>
                $request->input(
                    'doctor_id',
                    $request->input('doctorId')
                ),

            'date' =>
                $request->input(
                    'date',
                    $request->input(
                        'appointment_date'
                    )
                ),

            'time' =>
                $request->input('time'),

            'status' =>
                $request->input(
                    'status',
                    'scheduled'
                ),

            'notes' =>
                $request->input('notes'),
        ];
    }

    /**
     * Make sure patient belongs to this clinic.
     */
    private function patientBelongsToClinic(
        $patientId,
        $clinicId
    ) {
        return Patient::where(
            'id',
            $patientId
        )
            ->where(
                'clinic_id',
                $clinicId
            )
            ->exists();
    }

    /**
     * Make sure doctor belongs to this clinic.
     */
    private function doctorBelongsToClinic(
        $doctorId,
        $clinicId
    ) {
        return Doctor::where(
            'id',
            $doctorId
        )
            ->where(
                'clinic_id',
                $clinicId
            )
            ->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        $clinicId =
            $this->getClinicId($request);

        $query = Appointment::with([
            'patient',
            'doctor',
        ])
            ->where(
                'clinic_id',
                $clinicId
            );

        /*
         * Date filter.
         */
        if ($request->filled('date')) {
            $query->whereDate(
                'date',
                $request->date
            );
        }

        /*
         * Optional patient filter.
         */
        if ($request->filled('patient_id')) {
            $query->where(
                'patient_id',
                $request->patient_id
            );
        }

        /*
         * Optional doctor filter.
         */
        if ($request->filled('doctor_id')) {
            $query->where(
                'doctor_id',
                $request->doctor_id
            );
        }

        /*
         * Optional status filter.
         */
        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->status
            );
        }

        $appointments =
            $query
                ->orderBy(
                    'date',
                    'asc'
                )
                ->orderBy(
                    'time',
                    'asc'
                )
                ->get();

        return response()->json(
            $appointments
        );
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY DATE
    |--------------------------------------------------------------------------
    */

    public function date(
        Request $request,
        $date
    ) {
        $clinicId =
            $this->getClinicId($request);

        $appointments =
            Appointment::with([
                'patient',
                'doctor',
            ])
                ->where(
                    'clinic_id',
                    $clinicId
                )
                ->whereDate(
                    'date',
                    $date
                )
                ->orderBy(
                    'time',
                    'asc'
                )
                ->get();

        return response()->json(
            $appointments
        );
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(
        Request $request
    ) {
        $clinicId =
            $this->getClinicId($request);

        $data =
            $this->normalizeAppointmentData(
                $request
            );

        $validator =
            Validator::make(
                $data,
                [
                    'patient_id' =>
                        'required|integer|exists:patients,id',

                    'doctor_id' =>
                        'required|integer|exists:doctors,id',

                    'date' =>
                        'required|date',

                    'time' =>
                        'required|date_format:H:i',

                    'status' =>
                        'nullable|in:scheduled,confirmed,waiting,in_progress,completed,cancelled,no_show',

                    'notes' =>
                        'nullable|string',
                ]
            );

        if ($validator->fails()) {
            return response()->json(
                [
                    'message' =>
                        'Validation failed',

                    'errors' =>
                        $validator->errors(),
                ],
                422
            );
        }

        /*
         * Security:
         * Patient must belong to the same clinic.
         */
        if (
            !$this->patientBelongsToClinic(
                $data['patient_id'],
                $clinicId
            )
        ) {
            return response()->json(
                [
                    'message' =>
                        'Selected patient does not belong to your clinic.',
                ],
                422
            );
        }

        /*
         * Security:
         * Doctor must belong to the same clinic.
         */
        if (
            !$this->doctorBelongsToClinic(
                $data['doctor_id'],
                $clinicId
            )
        ) {
            return response()->json(
                [
                    'message' =>
                        'Selected doctor does not belong to your clinic.',
                ],
                422
            );
        }

        /*
         * Optional conflict check.
         */
        $existingAppointment =
            Appointment::where(
                'clinic_id',
                $clinicId
            )
                ->where(
                    'doctor_id',
                    $data['doctor_id']
                )
                ->whereDate(
                    'date',
                    $data['date']
                )
                ->where(
                    'time',
                    $data['time']
                )
                ->whereNotIn(
                    'status',
                    [
                        'cancelled',
                        'no_show',
                    ]
                )
                ->exists();

        if ($existingAppointment) {
            return response()->json(
                [
                    'message' =>
                        'The doctor already has an appointment at this date and time.',
                ],
                409
            );
        }

        $appointment =
            Appointment::create(
                [
                    'clinic_id' =>
                        $clinicId,

                    'patient_id' =>
                        $data['patient_id'],

                    'doctor_id' =>
                        $data['doctor_id'],

                    'date' =>
                        $data['date'],

                    'time' =>
                        $data['time'],

                    'status' =>
                        $data['status'] ??
                        'scheduled',

                    'notes' =>
                        $data['notes'],
                ]
            );

        return response()->json(
            $appointment->load([
                'patient',
                'doctor',
            ]),
            201
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    public function show(
        Request $request,
        $id
    ) {
        $clinicId =
            $this->getClinicId($request);

        $appointment =
            Appointment::with([
                'patient',
                'doctor',
            ])
                ->where(
                    'clinic_id',
                    $clinicId
                )
                ->findOrFail($id);

        return response()->json(
            $appointment
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        $id
    ) {
        $clinicId =
            $this->getClinicId($request);

        $appointment =
            Appointment::where(
                'clinic_id',
                $clinicId
            )->findOrFail($id);

        /*
         * Normalize camelCase/database names.
         */
        $data = [];

        if (
            $request->has(
                'patient_id'
            ) ||
            $request->has(
                'patientId'
            )
        ) {
            $data['patient_id'] =
                $request->input(
                    'patient_id',
                    $request->input(
                        'patientId'
                    )
                );
        }

        if (
            $request->has(
                'doctor_id'
            ) ||
            $request->has(
                'doctorId'
            )
        ) {
            $data['doctor_id'] =
                $request->input(
                    'doctor_id',
                    $request->input(
                        'doctorId'
                    )
                );
        }

        if (
            $request->has('date') ||
            $request->has(
                'appointment_date'
            )
        ) {
            $data['date'] =
                $request->input(
                    'date',
                    $request->input(
                        'appointment_date'
                    )
                );
        }

        if ($request->has('time')) {
            $data['time'] =
                $request->input(
                    'time'
                );
        }

        if ($request->has('status')) {
            $data['status'] =
                $request->input(
                    'status'
                );
        }

        if ($request->has('notes')) {
            $data['notes'] =
                $request->input(
                    'notes'
                );
        }

        /*
         * Validation.
         */
        $validator =
            Validator::make(
                $data,
                [
                    'patient_id' =>
                        'sometimes|required|integer|exists:patients,id',

                    'doctor_id' =>
                        'sometimes|required|integer|exists:doctors,id',

                    'date' =>
                        'sometimes|required|date',

                    'time' =>
                        'sometimes|required|date_format:H:i',

                    'status' =>
                        'sometimes|in:scheduled,confirmed,waiting,in_progress,completed,cancelled,no_show',

                    'notes' =>
                        'nullable|string',
                ]
            );

        if ($validator->fails()) {
            return response()->json(
                [
                    'message' =>
                        'Validation failed',

                    'errors' =>
                        $validator->errors(),
                ],
                422
            );
        }

        /*
         * Clinic ownership checks.
         */
        if (
            isset($data['patient_id']) &&
            !$this->patientBelongsToClinic(
                $data['patient_id'],
                $clinicId
            )
        ) {
            return response()->json(
                [
                    'message' =>
                        'Selected patient does not belong to your clinic.',
                ],
                422
            );
        }

        if (
            isset($data['doctor_id']) &&
            !$this->doctorBelongsToClinic(
                $data['doctor_id'],
                $clinicId
            )
        ) {
            return response()->json(
                [
                    'message' =>
                        'Selected doctor does not belong to your clinic.',
                ],
                422
            );
        }

        /*
         * Conflict check when doctor/date/time
         * are being changed.
         */
        $doctorId =
            $data['doctor_id'] ??
            $appointment->doctor_id;

        $date =
            $data['date'] ??
            $appointment->date;

        $time =
            $data['time'] ??
            $appointment->time;

        $conflict =
            Appointment::where(
                'clinic_id',
                $clinicId
            )
                ->where(
                    'doctor_id',
                    $doctorId
                )
                ->whereDate(
                    'date',
                    $date
                )
                ->where(
                    'time',
                    $time
                )
                ->where(
                    'id',
                    '!=',
                    $appointment->id
                )
                ->whereNotIn(
                    'status',
                    [
                        'cancelled',
                        'no_show',
                    ]
                )
                ->exists();

        if ($conflict) {
            return response()->json(
                [
                    'message' =>
                        'The doctor already has another appointment at this date and time.',
                ],
                409
            );
        }

        /*
         * Update only sent fields.
         */
        $appointment->update(
            $data
        );

        return response()->json(
            $appointment
                ->fresh()
                ->load([
                    'patient',
                    'doctor',
                ])
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE STATUS
    |--------------------------------------------------------------------------
    */

    public function updateStatus(
        Request $request,
        $id
    ) {
        $clinicId =
            $this->getClinicId($request);

        $validator =
            Validator::make(
                $request->all(),
                [
                    'status' =>
                        'required|in:scheduled,confirmed,waiting,in_progress,completed,cancelled,no_show',
                ]
            );

        if ($validator->fails()) {
            return response()->json(
                [
                    'message' =>
                        'Invalid appointment status',

                    'errors' =>
                        $validator->errors(),
                ],
                422
            );
        }

        $appointment =
            Appointment::where(
                'clinic_id',
                $clinicId
            )->findOrFail($id);

        $appointment->update(
            [
                'status' =>
                    $request->status,
            ]
        );

        return response()->json(
            $appointment
                ->fresh()
                ->load([
                    'patient',
                    'doctor',
                ])
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function destroy(
        Request $request,
        $id
    ) {
        $clinicId =
            $this->getClinicId($request);

        $appointment =
            Appointment::where(
                'clinic_id',
                $clinicId
            )->findOrFail($id);

        $appointment->delete();

        return response()->json(
            [
                'message' =>
                    'Appointment deleted successfully',
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK CONFLICTS
    |--------------------------------------------------------------------------
    */

    public function conflicts(
        Request $request
    ) {
        $clinicId =
            $this->getClinicId($request);

        $validator =
            Validator::make(
                $request->all(),
                [
                    'doctor_id' =>
                        'required|integer',

                    'date' =>
                        'required|date',

                    'time' =>
                        'required|date_format:H:i',

                    'appointment_id' =>
                        'nullable|integer',
                ]
            );

        if ($validator->fails()) {
            return response()->json(
                [
                    'message' =>
                        'Invalid conflict check data',

                    'errors' =>
                        $validator->errors(),
                ],
                422
            );
        }

        $query =
            Appointment::where(
                'clinic_id',
                $clinicId
            )
                ->where(
                    'doctor_id',
                    $request->doctor_id
                )
                ->whereDate(
                    'date',
                    $request->date
                )
                ->where(
                    'time',
                    $request->time
                )
                ->whereNotIn(
                    'status',
                    [
                        'cancelled',
                        'no_show',
                    ]
                );

        /*
         * Ignore the appointment currently
         * being edited.
         */
        if (
            $request->filled(
                'appointment_id'
            )
        ) {
            $query->where(
                'id',
                '!=',
                $request->appointment_id
            );
        }

        $conflict =
            $query->exists();

        return response()->json(
            [
                'hasConflict' =>
                    $conflict,

                'message' =>
                    $conflict
                        ? 'Doctor already has an appointment at this time.'
                        : 'No conflict found.',
            ]
        );
    }
}