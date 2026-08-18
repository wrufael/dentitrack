<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentRequest;
use App\Models\PaymentItem;
use App\Models\PaymentLog;
use App\Models\Patient;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = PaymentRequest::with(['items'])->where('clinic_id', $user->clinic_id);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('patient_name', 'like', "%{$search}%")
                  ->orWhere('request_code', 'like', "%{$search}%");
            });
        }

        $payments = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $payments,
            'summary' => [
                'total' => $payments->count(),
                'pending' => $payments->where('status', 'pending')->count(),
                'partial' => $payments->where('status', 'partial')->count(),
                'paid' => $payments->where('status', 'paid')->count(),
                'done' => $payments->where('status', 'done')->count(),
                'total_amount' => $payments->sum('total'),
            ],
        ]);
    }

    public function show(Request $request, $id)
    {
        $payment = PaymentRequest::with(['items', 'logs'])
            ->where('clinic_id', $request->user()->clinic_id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $payment,
        ]);
    }

    /**
     * Create a treatment payment request for an EXISTING registered patient.
     * Both owners and doctors can call this route.
     *
     * doctor_id is now OPTIONAL in the request: a logged-in doctor is
     * resolved automatically from their user account (the frontend
     * doesn't know its own `doctors.id`, only the logged-in user).
     * An owner filing this on a doctor's behalf must still pass doctor_id.
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

        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|integer|exists:patients,id',
            'doctor_id' => 'nullable|integer|exists:doctors,id',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Make sure the patient actually belongs to this clinic.
        $patient = Patient::where('clinic_id', $user->clinic_id)
            ->where('id', $request->patient_id)
            ->first();

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient not found in your clinic.',
            ], 404);
        }

        $role = strtolower(trim((string) $user->role));

        if ($role === 'doctor') {
            // Ignore any doctor_id sent from the client — always use the
            // doctor profile tied to the logged-in user for this clinic.
            $doctor = Doctor::where('clinic_id', $user->clinic_id)
                ->where('user_id', $user->id)
                ->first();
        } elseif (in_array($role, ['owner', 'business_owner', 'business-owner', 'clinic_owner', 'clinic-owner'], true)) {
            if (!$request->filled('doctor_id')) {
                return response()->json([
                    'success' => false,
                    'message' => 'doctor_id is required when filing this as an owner.',
                ], 422);
            }

            $doctor = Doctor::where('clinic_id', $user->clinic_id)
                ->where('id', $request->doctor_id)
                ->first();
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Only doctors (or the clinic owner) can create payment requests.',
            ], 403);
        }

        if (!$doctor) {
            return response()->json([
                'success' => false,
                'message' => 'Doctor profile not found for your clinic.',
            ], 404);
        }

        $total = collect($request->items)->sum('price');

        $payment = DB::transaction(function () use ($request, $user, $patient, $doctor, $total) {

            $count = PaymentRequest::where('clinic_id', $user->clinic_id)->count();

            $req = PaymentRequest::create([
                'clinic_id' => $user->clinic_id,
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'created_by' => $user->id,

                'request_code' => 'REQ-' . str_pad($count + 1001, 4, '0', STR_PAD_LEFT),

                // Snapshot of patient info at time of request
                'patient_name' => $patient->full_name,
                'patient_age' => $patient->age,
                'patient_gender' => $patient->gender,
                'patient_phone' => $patient->phone,

                'total' => $total,
                'paid' => 0,
                'balance' => $total,
                'status' => 'pending',
                'notes' => $request->notes,
                'due_date' => $request->due_date,
            ]);

            foreach ($request->items as $item) {
                PaymentItem::create([
                    'payment_request_id' => $req->id,
                    'name' => $item['name'],
                    'price' => $item['price'],
                ]);
            }

            PaymentLog::create([
                'payment_request_id' => $req->id,
                'action' => 'created',
                'performed_by' => $user->id,
                'note' => 'Payment request created',
            ]);

            return $req->load('items');
        });

        return response()->json([
            'success' => true,
            'data' => $payment,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();

        $payment = PaymentRequest::where('clinic_id', $user->clinic_id)->findOrFail($id);

        if (!in_array($payment->status, ['pending', 'partial'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending or partially paid requests can be edited.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $total = collect($request->items)->sum('price');

        DB::transaction(function () use ($request, $payment, $total, $user) {
            $payment->items()->delete();

            foreach ($request->items as $item) {
                PaymentItem::create([
                    'payment_request_id' => $payment->id,
                    'name' => $item['name'],
                    'price' => $item['price'],
                ]);
            }

            $payment->update([
                'total' => $total,
                'balance' => max($total - $payment->paid, 0),
                'notes' => $request->notes ?? $payment->notes,
            ]);

            PaymentLog::create([
                'payment_request_id' => $payment->id,
                'action' => 'updated',
                'performed_by' => $user->id,
                'note' => 'Payment request items updated',
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => $payment->fresh(['items']),
        ]);
    }

    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        $payment = PaymentRequest::where('clinic_id', $user->clinic_id)->findOrFail($id);

        if (!in_array($payment->status, ['pending', 'partial'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending or partially paid requests can be cancelled.',
            ], 422);
        }

        $payment->update(['status' => 'cancelled']);

        PaymentLog::create([
            'payment_request_id' => $payment->id,
            'action' => 'cancelled',
            'performed_by' => $user->id,
            'note' => 'Payment request cancelled',
        ]);

        return response()->json([
            'success' => true,
            'data' => $payment->fresh(['items']),
        ]);
    }

    /**
     * POST /api/payments/{id}/collect
     */
    public function collect(Request $request, $id)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|in:Cash,Telebirr,CBEBirr,Card',
            'proof_photo' => 'required_unless:payment_method,Cash|nullable|image|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $payment = PaymentRequest::where('clinic_id', $user->clinic_id)->findOrFail($id);

        $remaining = $payment->total - $payment->paid;

        if ($request->payment_method !== 'Cash' && round($request->amount, 2) !== round($remaining, 2)) {
            return response()->json([
                'success' => false,
                'message' => "Amount must exactly match the outstanding balance of ETB {$remaining} for {$request->payment_method} payments."
            ], 422);
        }

        $photoPath = null;
        $uploadedAt = null;

        if ($request->payment_method !== 'Cash') {
            $requestReceivedAt = Carbon::now();

            if ($request->filled('action_started_at')) {
                $startedAt = Carbon::parse($request->action_started_at);
                $diffMinutes = $startedAt->diffInMinutes($requestReceivedAt);

                if ($diffMinutes > 2) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Proof photo must be uploaded within 2 minutes of starting the transaction. Please try again.'
                    ], 422);
                }
            }

            $photoPath = $request->file('proof_photo')->store('payment-proofs', 'public');
            $uploadedAt = $requestReceivedAt;
        }

        $newPaid = $payment->paid + $request->amount;
        $newBalance = max($payment->total - $newPaid, 0);
        $newStatus = $newBalance <= 0 ? 'paid' : 'partial';

        $payment->update([
            'paid' => $newPaid,
            'balance' => $newBalance,
            'status' => $newStatus,
            'payment_method' => $request->payment_method,
            'receipt_number' => 'RCP-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
            'collected_by' => $user->id,
            'proof_photo_path' => $photoPath,
            'proof_uploaded_at' => $uploadedAt,
        ]);

        PaymentLog::create([
            'payment_request_id' => $payment->id,
            'action' => 'payment_collected',
            'performed_by' => $user->id,
            'amount' => $request->amount,
            'payment_method' => $request->payment_method,
            'note' => "Collected ETB {$request->amount} via {$request->payment_method}"
                . ($photoPath ? ' (proof uploaded)' : ''),
        ]);

        return response()->json([
            'success' => true,
            'data' => $payment->fresh(['items']),
        ]);
    }

    public function startTreatment(Request $request, $id)
    {
        $user = $request->user();
        $payment = PaymentRequest::where('clinic_id', $user->clinic_id)->findOrFail($id);

        if ($payment->status !== 'paid') {
            return response()->json(['success' => false, 'message' => 'Payment must be fully paid first'], 422);
        }

        $payment->update(['status' => 'done']);

        PaymentLog::create([
            'payment_request_id' => $payment->id,
            'action' => 'treatment_started',
            'performed_by' => $user->id,
            'note' => 'Treatment marked as done',
        ]);

        return response()->json([
            'success' => true,
            'data' => $payment->fresh(['items']),
        ]);
    }

    /**
     * GET /api/payments/pending
     *
     * Requests still awaiting (full or partial) collection. Used by the
     * cashier Dashboard and as the default "Pending" tab on the cashier
     * Payment Requested page.
     */
    public function pending(Request $request)
    {
        $user = $request->user();

        $payments = PaymentRequest::with(['items'])
            ->where('clinic_id', $user->clinic_id)
            ->whereIn('status', ['pending', 'partial'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    /**
     * GET /api/payments/history
     *
     * Requests that have been fully collected (optionally treatment
     * started). Used by the cashier "Paid" tab / collection history.
     */
    public function history(Request $request)
    {
        $user = $request->user();

        $query = PaymentRequest::with(['items'])
            ->where('clinic_id', $user->clinic_id)
            ->whereIn('status', ['paid', 'done']);

        if ($request->filled('from')) {
            $query->whereDate('updated_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('updated_at', '<=', $request->to);
        }

        $payments = $query->orderBy('updated_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    /**
     * GET /api/payments/daily-summary
     *
     * Powers the cashier Dashboard stat cards: today's collection total,
     * how many requests are still pending/partial (and their outstanding
     * balance), and how many collection transactions happened today.
     *
     * NOTE: "today_collection" is derived from PaymentRequest rows whose
     * status became paid/done/partial today. For a fully precise
     * per-transaction total (e.g. a request partially paid yesterday and
     * completed today should only count today's portion), add a nullable
     * `amount` decimal column to `payment_logs` and sum that instead —
     * happy to wire that up once the column exists.
     */
    public function dailySummary(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today();

        $touchedToday = PaymentRequest::where('clinic_id', $user->clinic_id)
            ->whereIn('status', ['paid', 'partial', 'done'])
            ->whereDate('updated_at', $today)
            ->get();

        $todayCollection = $touchedToday->sum('paid');

        $pendingQuery = PaymentRequest::where('clinic_id', $user->clinic_id)
            ->whereIn('status', ['pending', 'partial']);

        $pendingCount = (clone $pendingQuery)->count();
        $pendingAmount = (clone $pendingQuery)->sum('balance');

        $clinicRequestIds = PaymentRequest::where('clinic_id', $user->clinic_id)->pluck('id');

        $transactionsToday = PaymentLog::where('action', 'payment_collected')
            ->whereIn('payment_request_id', $clinicRequestIds)
            ->whereDate('created_at', $today)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'today_collection' => (float) $todayCollection,
                'pending_count' => $pendingCount,
                'pending_amount' => (float) $pendingAmount,
                'transactions_count' => $transactionsToday,
                'credit_collections' => (float) $pendingAmount,
            ],
        ]);
    }

    /**
     * GET /api/payments/credit-report
     *
     * Powers the owner "Patient Credit" screen. A payment request counts
     * as a credit / payment-plan record when it was created with a
     * due_date (see store()) — plain same-day payment requests leave
     * due_date null and are excluded here.
     *
     * Each record's `payments` array is built from payment_logs rows
     * with action = payment_collected, using the amount/payment_method
     * columns added specifically for this report.
     */
    public function creditReport(Request $request)
    {
        $user = $request->user();

        $records = PaymentRequest::with(['items'])
            ->where('clinic_id', $user->clinic_id)
            ->whereNotNull('due_date')
            ->where('status', '!=', 'cancelled')
            ->orderBy('due_date', 'asc')
            ->get();

        $requestIds = $records->pluck('id');

        $logs = PaymentLog::whereIn('payment_request_id', $requestIds)
            ->where('action', 'payment_collected')
            ->orderBy('created_at', 'asc')
            ->get()
            ->groupBy('payment_request_id');

        $data = $records->map(function ($record) use ($logs) {
            $payments = ($logs->get($record->id) ?? collect())->map(function ($log) {
                return [
                    'id' => $log->id,
                    'date' => optional($log->created_at)->format('Y-m-d'),
                    'amount' => (float) $log->amount,
                    'method' => $log->payment_method,
                ];
            })->values();

            return [
                'id' => $record->id,
                'requestId' => $record->request_code,
                'patient' => $record->patient_name,
                'patientId' => $record->patient_id,
                'service' => optional($record->items->first())->name,
                'items' => $record->items,
                'total' => (float) $record->total,
                'paid' => (float) $record->paid,
                'balance' => (float) $record->balance,
                'dueDate' => optional($record->due_date)->format('Y-m-d'),
                'status' => $record->status,
                'payments' => $payments,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}