<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    // Single source of truth for allowed categories — matches the
    // ExpenseManagement.jsx dropdown and the "inventory" category used by
    // auto-generated inventory expenses.
    private const CATEGORIES = [
        'supplies', 'salary', 'rent', 'utilities', 'equipment',
        'marketing', 'insurance', 'tax', 'inventory',
        'maintenance', 'software', 'training', 'other',
    ];

    // ✅ GET ALL EXPENSES
    public function index(Request $request)
    {
        try {
            $clinic_id = $request->user()->clinic_id;

            $query = Expense::where('clinic_id', $clinic_id);

            if ($request->has('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }

            if ($request->has('start_date')) {
                $query->whereDate('expense_date', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->whereDate('expense_date', '<=', $request->end_date);
            }

            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            if ($request->has('employee_id')) {
                $query->where('employee_id', $request->employee_id);
            }

            $expenses = $query->with(['user', 'employee'])
                ->orderBy('expense_date', 'desc')
                ->get();

            $summary = [
                'total' => $expenses->sum('amount'),
                'by_category' => $expenses->groupBy('category')->map(function ($group) {
                    return $group->sum('amount');
                }),
                'this_month' => $expenses->where('expense_date', '>=', now()->startOfMonth())->sum('amount'),
                'today' => $expenses->where('expense_date', '>=', now()->startOfDay())->sum('amount'),
            ];

            return response()->json([
                'success' => true,
                'data' => $expenses,
                'summary' => $summary,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch expenses: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch expenses'
            ], 500);
        }
    }

    /**
     * ✅ CREATE (or merge into) an expense.
     *
     * FIX: If an expense with the SAME TITLE already exists for this
     * clinic, this no longer creates a second row (that's what produced
     * the duplicate "hina trinkgs" x2 entries). Instead it adds the new
     * amount onto the existing expense and refreshes its date/description
     * — same "merge instead of duplicate" pattern used for inventory
     * restocks.
     *
     * If you actually want two separate expenses that happen to share a
     * name (e.g. two different "Rent" charges), give them slightly
     * different titles (e.g. "Rent - July", "Rent - August") — matching
     * is by exact title text.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0.01',
            'expense_date' => 'required|date',
            'category' => 'required|in:' . implode(',', self::CATEGORIES),
            'employee_id' => 'nullable|exists:users,id',
            'employee_name' => 'nullable|string|max:255',
            'employee_role' => 'nullable|string|max:100',
            'payment_method' => 'required|in:cash,bank_transfer,cheque,mobile_money',
            'transaction_id' => 'nullable|string|max:255',
            'receipt_number' => 'nullable|string|max:255',
            'is_recurring' => 'boolean',
            'recurring_period' => 'nullable|in:daily,weekly,monthly,quarterly,yearly',
            'recurring_end_date' => 'nullable|date|after:expense_date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $clinic_id = $request->user()->clinic_id;

            $employee_name = $request->employee_name;
            $employee_role = $request->employee_role;

            if ($request->employee_id) {
                $employee = User::find($request->employee_id);
                if ($employee) {
                    $employee_name = $employee->name;
                    $employee_role = $employee->role;
                }
            }

            // Look for an existing expense with the exact same title for
            // this clinic (case-insensitive, trimmed) — this is what
            // catches accidental double-submits like "hina trinkgs".
            $existing = Expense::where('clinic_id', $clinic_id)
                ->whereRaw('LOWER(TRIM(title)) = ?', [strtolower(trim($request->title))])
                ->first();

            $merged = false;

            if ($existing) {
                // ===== MERGE PATH: add the amount, don't duplicate =====
                $old_amount = $existing->amount;
                $existing->amount += $request->amount;
                $existing->expense_date = $request->expense_date;

                // Fold in whatever new details were given, without losing
                // the running total context.
                if ($request->description) {
                    $existing->description = $request->description;
                }
                if ($request->notes) {
                    $existing->notes = $request->notes;
                }
                if ($request->payment_method) {
                    $existing->payment_method = $request->payment_method;
                }
                if ($request->transaction_id) {
                    $existing->transaction_id = $request->transaction_id;
                }
                if ($request->employee_id) {
                    $existing->employee_id = $request->employee_id;
                    $existing->employee_name = $employee_name;
                    $existing->employee_role = $employee_role;
                }

                $existing->save();

                $expense = $existing;
                $merged = true;

                Log::info('✅ Expense merged into existing row (no duplicate created)', [
                    'expense_id' => $expense->id,
                    'title' => $expense->title,
                    'old_amount' => $old_amount,
                    'added_amount' => $request->amount,
                    'new_amount' => $expense->amount,
                ]);
            } else {
                // ===== NEW EXPENSE PATH =====
                $expense = Expense::create([
                    'clinic_id' => $clinic_id,
                    'user_id' => $request->user()->id,
                    'title' => $request->title,
                    'description' => $request->description,
                    'amount' => $request->amount,
                    'expense_date' => $request->expense_date,
                    'category' => $request->category,
                    'employee_id' => $request->employee_id,
                    'employee_name' => $employee_name,
                    'employee_role' => $employee_role,
                    'payment_method' => $request->payment_method,
                    'transaction_id' => $request->transaction_id,
                    'receipt_number' => $request->receipt_number,
                    'is_recurring' => $request->is_recurring ?? false,
                    'recurring_period' => $request->recurring_period,
                    'recurring_end_date' => $request->recurring_end_date,
                    'status' => 'pending',
                    'notes' => $request->notes,
                ]);

                Log::info('✅ New expense created', [
                    'expense_id' => $expense->id,
                    'clinic_id' => $clinic_id,
                    'category' => $request->category,
                    'amount' => $request->amount,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $merged
                    ? 'Amount added to existing "' . $expense->title . '" expense (no duplicate created)!'
                    : 'Expense created successfully!',
                'data' => $expense->fresh(['user', 'employee']),
                'merged' => $merged,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create expense: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create expense: ' . $e->getMessage()
            ], 500);
        }
    }

    // ✅ GET SINGLE EXPENSE
    public function show($id)
    {
        try {
            $expense = Expense::with(['user', 'employee'])->findOrFail($id);

            if ($expense->clinic_id !== auth()->user()->clinic_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $expense
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Expense not found'
            ], 404);
        }
    }

    // ✅ UPDATE EXPENSE
    public function update(Request $request, $id)
    {
        try {
            $expense = Expense::findOrFail($id);

            if ($expense->clinic_id !== auth()->user()->clinic_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'amount' => 'sometimes|numeric|min:0.01',
                'expense_date' => 'sometimes|date',
                'category' => 'sometimes|in:' . implode(',', self::CATEGORIES),
                'employee_id' => 'nullable|exists:users,id',
                'payment_method' => 'sometimes|in:cash,bank_transfer,cheque,mobile_money',
                'transaction_id' => 'nullable|string|max:255',
                'receipt_number' => 'nullable|string|max:255',
                'status' => 'sometimes|in:pending,approved,paid,cancelled',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $expense->update($request->all());

            Log::info('Expense updated', [
                'expense_id' => $expense->id,
                'updated_by' => auth()->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Expense updated successfully!',
                'data' => $expense->fresh(['user', 'employee'])
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update expense: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update expense'
            ], 500);
        }
    }

    // ✅ DELETE EXPENSE
    public function destroy($id)
    {
        try {
            $expense = Expense::findOrFail($id);

            if ($expense->clinic_id !== auth()->user()->clinic_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $expense->delete();

            Log::info('Expense deleted', [
                'expense_id' => $id,
                'deleted_by' => auth()->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Expense deleted successfully!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete expense: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete expense'
            ], 500);
        }
    }

    // ✅ GET EMPLOYEE LIST FOR SELECTION
    public function getEmployees(Request $request)
    {
        try {
            $clinic_id = $request->user()->clinic_id;

            $employees = User::where('clinic_id', $clinic_id)
                ->whereIn('role', ['doctor', 'cashier'])
                ->select('id', 'name', 'email', 'phone', 'role')
                ->get();

            $staff = [
                [
                    'id' => null,
                    'name' => 'Other Staff',
                    'role' => 'staff'
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $employees,
                'staff' => $staff,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch employees'
            ], 500);
        }
    }
}