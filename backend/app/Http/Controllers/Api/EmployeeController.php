<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Cashier;
use App\Support\PermissionCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    /**
     * Roles the owner is allowed to create/manage through this
     * screen. Owner and platform_admin are handled elsewhere
     * (clinic registration / platform admin management).
     */
    private const MANAGEABLE_ROLES = [
        'doctor',
        'cashier',
        'nurse',
        'receptionist',
        'lab_technician',
    ];

    private const EMPLOYEE_FIELDS = [
        'id', 'name', 'email', 'phone', 'role', 'permissions', 'is_active', 'created_at',
    ];

    /**
     * GET /api/employees/summary
     * Get employee statistics for the owner (total count, monthly expenses)
     */
    public function summary(Request $request)
    {
        $user = $request->user();

        // Total number of employees
        $totalEmployees = User::where('clinic_id', $user->clinic_id)
            ->whereIn('role', self::MANAGEABLE_ROLES)
            ->count();

        // Active employees
        $activeEmployees = User::where('clinic_id', $user->clinic_id)
            ->whereIn('role', self::MANAGEABLE_ROLES)
            ->where('is_active', true)
            ->count();

        // Monthly salary expense (current month)
        $currentMonth = now()->format('Y-m');
        $monthlySalaryExpense = DB::table('expenses')
            ->where('clinic_id', $user->clinic_id)
            ->where('category', 'salary')
            ->whereRaw("DATE_FORMAT(expense_date, '%Y-%m') = ?", [$currentMonth])
            ->where('status', '!=', 'cancelled')
            ->sum('amount');

        // Breakdown by role
        $employeesByRole = User::where('clinic_id', $user->clinic_id)
            ->whereIn('role', self::MANAGEABLE_ROLES)
            ->select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->get()
            ->pluck('count', 'role');

        return response()->json([
            'success' => true,
            'data' => [
                'total_employees' => $totalEmployees,
                'active_employees' => $activeEmployees,
                'inactive_employees' => $totalEmployees - $activeEmployees,
                'monthly_salary_expense' => floatval($monthlySalaryExpense ?? 0),
                'employees_by_role' => $employeesByRole,
            ],
        ]);
    }

    /**
     * GET /api/employees
     * List every staff member in the owner's clinic (excludes the
     * owner's own account and any platform_admin rows).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $employees = User::where('clinic_id', $user->clinic_id)
            ->whereIn('role', self::MANAGEABLE_ROLES)
            ->orderBy('created_at', 'desc')
            ->get(self::EMPLOYEE_FIELDS);

        return response()->json([
            'success' => true,
            'data' => $employees,
        ]);
    }

    /**
     * GET /api/employees/search?q=...
     * Search by name, email, or role within the owner's clinic.
     */
    public function search(Request $request)
    {
        $user = $request->user();
        $term = trim((string) $request->query('q', $request->query('search', '')));

        $query = User::where('clinic_id', $user->clinic_id)
            ->whereIn('role', self::MANAGEABLE_ROLES);

        if ($term !== '') {
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('role', 'like', "%{$term}%");
            });
        }

        $employees = $query->orderBy('name')->get(self::EMPLOYEE_FIELDS);

        return response()->json([
            'success' => true,
            'data' => $employees,
        ]);
    }

    /**
     * GET /api/employees/{id}
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        $employee = User::where('clinic_id', $user->clinic_id)
            ->whereIn('role', self::MANAGEABLE_ROLES)
            ->findOrFail($id, self::EMPLOYEE_FIELDS);

        return response()->json([
            'success' => true,
            'data' => $employee,
        ]);
    }

    /**
     * GET /api/employees/roles
     * Roles the owner can assign, for the "Role" dropdown.
     */
    public function getRoles(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => PermissionCatalog::rolesForApi(),
        ]);
    }

    /**
     * GET /api/employees/permissions
     * Full permission catalog (every module/action that exists),
     * grouped by category, for the permission checklist UI.
     */
    public function getPermissions(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => PermissionCatalog::catalogForApi(),
        ]);
    }

    /**
     * GET /api/employees/role-permissions/{roleId}
     * Default permission keys pre-checked when a role is selected.
     */
    public function getRolePermissions(Request $request, $roleId)
    {
        if (!array_key_exists($roleId, PermissionCatalog::ROLES)) {
            return response()->json([
                'success' => false,
                'message' => 'Unknown role.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => PermissionCatalog::defaultsForRole($roleId),
        ]);
    }

    /**
     * POST /api/employees
     * Create a new staff account. For doctor/cashier roles, also
     * creates the matching profile row in the doctors/cashiers
     * tables, since other parts of the app (payment requests,
     * appointments) reference those tables directly.
     *
     * `permissions` is optional — if the owner doesn't customize
     * anything, the employee gets that role's default permission
     * set. If provided, it can add modules the role wouldn't
     * normally have, or drop ones it would.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'in:' . implode(',', self::MANAGEABLE_ROLES)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $permissions = $request->has('permissions')
            ? PermissionCatalog::sanitize($request->input('permissions'))
            : PermissionCatalog::defaultsForRole($request->role);

        $employee = DB::transaction(function () use ($request, $user, $permissions) {
            $newUser = User::create([
                'name' => trim($request->name),
                'email' => trim($request->email),
                'phone' => $request->phone ? trim($request->phone) : null,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'permissions' => $permissions,
                'clinic_id' => $user->clinic_id,
                'is_active' => true,
            ]);

            if ($request->role === 'doctor') {
                Doctor::create([
                    'clinic_id' => $user->clinic_id,
                    'user_id' => $newUser->id,
                    'specialty' => null,
                    'is_active' => true,
                ]);
            }

            if ($request->role === 'cashier') {
                Cashier::create([
                    'clinic_id' => $user->clinic_id,
                    'user_id' => $newUser->id,
                    'is_active' => true,
                ]);
            }

            return $newUser;
        });

        return response()->json([
            'success' => true,
            'message' => 'Employee created successfully.',
            'data' => $employee,
        ], 201);
    }

    /**
     * PUT /api/employees/{id}
     * Update name/email/phone/role/permissions. Password only
     * changes if a new one is provided.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        $employee = User::where('clinic_id', $user->clinic_id)
            ->whereIn('role', self::MANAGEABLE_ROLES)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $employee->id],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['required', 'in:' . implode(',', self::MANAGEABLE_ROLES)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // If the role changed and permissions weren't explicitly
        // sent, fall back to that role's defaults rather than
        // keeping the old role's permission set.
        $permissions = $request->has('permissions')
            ? PermissionCatalog::sanitize($request->input('permissions'))
            : ($request->role !== $employee->role
                ? PermissionCatalog::defaultsForRole($request->role)
                : ($employee->permissions ?? PermissionCatalog::defaultsForRole($employee->role)));

        $employee->update([
            'name' => trim($request->name),
            'email' => trim($request->email),
            'phone' => $request->phone ? trim($request->phone) : null,
            'role' => $request->role,
            'permissions' => $permissions,
            ...($request->filled('password')
                ? ['password' => Hash::make($request->password)]
                : []),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Employee updated successfully.',
            'data' => $employee->fresh(self::EMPLOYEE_FIELDS),
        ]);
    }

    /**
     * POST /api/employees/{id}/permissions
     * Update ONLY an employee's permission set (used by a dedicated
     * "Manage Access" action, separate from the full edit form).
     */
    public function updatePermissions(Request $request, $id)
    {
        $user = $request->user();

        $employee = User::where('clinic_id', $user->clinic_id)
            ->whereIn('role', self::MANAGEABLE_ROLES)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $employee->update([
            'permissions' => PermissionCatalog::sanitize($request->input('permissions')),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permissions updated.',
            'data' => $employee->fresh(self::EMPLOYEE_FIELDS),
        ]);
    }

    /**
     * POST /api/employees/{id}/activate
     */
    public function activate(Request $request, $id)
    {
        $user = $request->user();

        $employee = User::where('clinic_id', $user->clinic_id)
            ->whereIn('role', self::MANAGEABLE_ROLES)
            ->findOrFail($id);

        $employee->update(['is_active' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Employee activated.',
            'data' => $employee->fresh(self::EMPLOYEE_FIELDS),
        ]);
    }

    /**
     * POST /api/employees/{id}/deactivate
     */
    public function deactivate(Request $request, $id)
    {
        $user = $request->user();

        $employee = User::where('clinic_id', $user->clinic_id)
            ->whereIn('role', self::MANAGEABLE_ROLES)
            ->findOrFail($id);

        $employee->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Employee deactivated.',
            'data' => $employee->fresh(self::EMPLOYEE_FIELDS),
        ]);
    }

    /**
     * POST /api/employees/{id}/reset-password
     * Generates a new temporary password, saves it (hashed), and
     * returns the PLAIN text once so the owner can hand it to the
     * employee. It is never stored or shown again after this.
     */
    public function resetPassword(Request $request, $id)
    {
        $user = $request->user();

        $employee = User::where('clinic_id', $user->clinic_id)
            ->whereIn('role', self::MANAGEABLE_ROLES)
            ->findOrFail($id);

        $temporaryPassword = Str::upper(Str::random(4)) . '-' . random_int(1000, 9999);

        $employee->update([
            'password' => Hash::make($temporaryPassword),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully.',
            'temporary_password' => $temporaryPassword,
        ]);
    }

    /**
     * DELETE /api/employees/{id}
     * Permanently removes the account (and its doctor/cashier
     * profile row, if any).
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        $employee = User::where('clinic_id', $user->clinic_id)
            ->whereIn('role', self::MANAGEABLE_ROLES)
            ->findOrFail($id);

        DB::transaction(function () use ($employee) {
            if ($employee->role === 'doctor') {
                Doctor::where('user_id', $employee->id)->delete();
            }

            if ($employee->role === 'cashier') {
                Cashier::where('user_id', $employee->id)->delete();
            }

            $employee->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Employee removed.',
        ]);
    }
}
