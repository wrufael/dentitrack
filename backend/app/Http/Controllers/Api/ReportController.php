<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentRequest;
use App\Models\Expense;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function revenue(Request $request)
    {
        $clinicId = $request->user()->clinic_id;

        $revenue = PaymentRequest::where('clinic_id', $clinicId)
            ->whereIn('status', ['paid', 'done'])
            ->selectRaw('DATE(created_at) as date, SUM(paid) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($revenue);
    }

    public function summary(Request $request)
    {
        $clinicId = $request->user()->clinic_id;

        $totalRevenue = PaymentRequest::where('clinic_id', $clinicId)
            ->whereIn('status', ['paid', 'done'])
            ->sum('paid');

        $totalExpenses = Expense::where('clinic_id', $clinicId)->sum('amount');
        $totalPatients = Patient::where('clinic_id', $clinicId)->count();

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net' => $totalRevenue - $totalExpenses,
            'total_patients' => $totalPatients,
        ]);
    }
}