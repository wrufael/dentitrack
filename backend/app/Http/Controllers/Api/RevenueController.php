<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Revenue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class RevenueController extends Controller
{
    public function index(Request $request)
    {
        try {
            $clinic_id = $request->user()->clinic_id;
            
            if (!$clinic_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No clinic found for this user'
                ], 400);
            }
            
            $query = Revenue::where('clinic_id', $clinic_id);
            
            if ($request->has('start_date') && $request->start_date) {
                $query->whereDate('date', '>=', $request->start_date);
            }
            if ($request->has('end_date') && $request->end_date) {
                $query->whereDate('date', '<=', $request->end_date);
            }
            if ($request->has('payment_method') && $request->payment_method !== 'all') {
                $query->where('payment_method', $request->payment_method);
            }
            
            $revenues = $query->orderBy('date', 'desc')->get();
            
            $summary = [
                'today' => $revenues->where('date', now()->toDateString())->sum('amount'),
                'this_month' => $revenues->where('date', '>=', now()->startOfMonth()->toDateString())->sum('amount'),
                'total' => $revenues->sum('amount'),
            ];
            
            return response()->json([
                'success' => true,
                'data' => $revenues,
                'summary' => $summary
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to fetch revenues: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch revenues: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'source' => 'required|string|max:255',
                'amount' => 'required|numeric|min:0.01',
                'payment_method' => 'required|in:cash,bank_transfer,mobile_money,card',
                'date' => 'required|date',
                'description' => 'nullable|string',
                'transaction_id' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $clinic_id = $request->user()->clinic_id;
            
            if (!$clinic_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No clinic found for this user'
                ], 400);
            }

            $revenue = Revenue::create([
                'clinic_id' => $clinic_id,
                'user_id' => $request->user()->id,
                'source' => $request->source,
                'amount' => $request->amount,
                'payment_method' => $request->payment_method,
                'date' => $request->date,
                'description' => $request->description,
                'transaction_id' => $request->transaction_id,
            ]);

            Log::info('Revenue added', [
                'revenue_id' => $revenue->id,
                'clinic_id' => $clinic_id,
                'amount' => $request->amount,
                'user_id' => $request->user()->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Revenue added successfully!',
                'data' => $revenue
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to add revenue: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add revenue: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $revenue = Revenue::findOrFail($id);
            
            if ($revenue->clinic_id !== auth()->user()->clinic_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $revenue->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Revenue deleted successfully!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete revenue: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete revenue'
            ], 500);
        }
    }
}