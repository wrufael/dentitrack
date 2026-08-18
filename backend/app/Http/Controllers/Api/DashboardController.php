<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentRequest;
use App\Models\PaymentItem;
use App\Models\Expense;
use App\Models\Patient;
use App\Models\Inventory;
use App\Models\Doctor;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard/owner
     *
     * Single call powering the Owner Dashboard — replaces the hardcoded
     * STATS object that used to live in pages/owner/OwnerDashboard.jsx.
     */
    public function owner(Request $request)
    {
        $user = $request->user();
        $clinicId = $user->clinic_id;
        $today = Carbon::today();
        $monthStart = Carbon::now()->startOfMonth();

        $paidStatuses = ['paid', 'done'];

        $todaysRevenue = PaymentRequest::where('clinic_id', $clinicId)
            ->whereIn('status', $paidStatuses)
            ->whereDate('updated_at', $today)
            ->sum('paid');

        $patientsToday = Appointment::where('clinic_id', $clinicId)
            ->whereDate('date', $today)
            ->distinct('patient_id')
            ->count('patient_id');

        $pendingPayments = PaymentRequest::where('clinic_id', $clinicId)
            ->whereIn('status', ['pending', 'partial'])
            ->sum('balance');

        $monthRevenue = PaymentRequest::where('clinic_id', $clinicId)
            ->whereIn('status', $paidStatuses)
            ->where('updated_at', '>=', $monthStart)
            ->sum('paid');

        $monthExpenses = Expense::where('clinic_id', $clinicId)
            ->where('expense_date', '>=', $monthStart)
            ->sum('amount');

        $netProfit = $monthRevenue - $monthExpenses;

        $totalRevenue = PaymentRequest::where('clinic_id', $clinicId)
            ->whereIn('status', $paidStatuses)
            ->sum('paid');

        $totalExpenses = Expense::where('clinic_id', $clinicId)->sum('amount');

        $totalPatients = Patient::where('clinic_id', $clinicId)->count();

        $inventoryValue = Inventory::where('clinic_id', $clinicId)
            ->selectRaw('COALESCE(SUM(quantity * buy_price), 0) as value')
            ->value('value');

        // Revenue vs Expenses — last 14 days, one point per day.
        $rangeStart = Carbon::today()->subDays(13);

        $revenueByDay = PaymentRequest::where('clinic_id', $clinicId)
            ->whereIn('status', $paidStatuses)
            ->where('updated_at', '>=', $rangeStart)
            ->selectRaw('DATE(updated_at) as day, SUM(paid) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $expensesByDay = Expense::where('clinic_id', $clinicId)
            ->where('expense_date', '>=', $rangeStart)
            ->selectRaw('DATE(expense_date) as day, SUM(amount) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $trend = [];
        for ($i = 0; $i < 14; $i++) {
            $day = $rangeStart->copy()->addDays($i)->toDateString();
            $trend[] = [
                'date' => $day,
                'revenue' => (float) ($revenueByDay[$day] ?? 0),
                'expenses' => (float) ($expensesByDay[$day] ?? 0),
            ];
        }

        // Revenue by service — top treatment items across paid requests.
        $revenueByService = PaymentItem::whereHas('paymentRequest', function ($q) use ($clinicId, $paidStatuses) {
                $q->where('clinic_id', $clinicId)->whereIn('status', $paidStatuses);
            })
            ->selectRaw('name, SUM(price) as total')
            ->groupBy('name')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'value' => (float) $row->total]);

        return response()->json([
            'success' => true,
            'data' => [
                'todays_revenue' => (float) $todaysRevenue,
                'patients_today' => (int) $patientsToday,
                'pending_payments' => (float) $pendingPayments,
                'net_profit_month' => (float) $netProfit,
                'total_revenue' => (float) $totalRevenue,
                'total_expenses' => (float) $totalExpenses,
                'total_patients' => (int) $totalPatients,
                'inventory_value' => (float) $inventoryValue,
                'revenue_trend' => $trend,
                'revenue_by_service' => $revenueByService,
            ],
        ]);
    }

    /**
     * GET /api/dashboard/doctor
     *
     * Powers the Doctor Dashboard — replaces the old usePayments() mock
     * context read. Everything here is scoped to the logged-in doctor's
     * own patients/requests, not the whole clinic.
     */
    public function doctor(Request $request)
    {
        $user = $request->user();
        $clinicId = $user->clinic_id;
        $today = Carbon::today();

        $doctor = Doctor::where('clinic_id', $clinicId)
            ->where('user_id', $user->id)
            ->first();

        if (!$doctor) {
            return response()->json([
                'success' => false,
                'message' => 'Doctor profile not found for your clinic.',
            ], 404);
        }

        $patientsToday = Appointment::where('clinic_id', $clinicId)
            ->where('doctor_id', $doctor->id)
            ->whereDate('date', $today)
            ->distinct('patient_id')
            ->count('patient_id');

        $pendingCount = PaymentRequest::where('clinic_id', $clinicId)
            ->where('doctor_id', $doctor->id)
            ->whereIn('status', ['pending', 'partial'])
            ->count();

        $todaysRevenue = PaymentRequest::where('clinic_id', $clinicId)
            ->where('doctor_id', $doctor->id)
            ->whereIn('status', ['paid', 'done'])
            ->whereDate('updated_at', $today)
            ->sum('paid');

        $recentPatients = PaymentRequest::where('clinic_id', $clinicId)
            ->where('doctor_id', $doctor->id)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'patient_name', 'total', 'status', 'created_at'])
            ->map(fn ($r) => [
                'id' => $r->id,
                'patient' => $r->patient_name,
                'total' => (float) $r->total,
                'status' => $r->status,
                'date' => optional($r->created_at)->format('Y-m-d'),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'patients_today' => (int) $patientsToday,
                'pending_payments' => (int) $pendingCount,
                'todays_revenue' => (float) $todaysRevenue,
                'recent_patients' => $recentPatients,
            ],
        ]);
    }
}
