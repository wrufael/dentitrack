<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClinicController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\ConsultationController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\CashierController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RevenueController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;


// ============================================================
// PUBLIC ROUTES
// ============================================================

// Authentication
Route::post('/login', [
    AuthController::class,
    'login'
]);

// Clinic registration
Route::post('/register-clinic', [
    RegistrationController::class,
    'register'
]);

Route::post('/save-registration-draft', [
    RegistrationController::class,
    'saveDraft'
]);


// ============================================================
// PROTECTED ROUTES
// ============================================================

Route::middleware('auth:sanctum')->group(function () {

    // ========================================================
    // USER
    // ========================================================

    Route::get('/user', [
        AuthController::class,
        'user'
    ]);

    Route::put('/user', [
        AuthController::class,
        'update'
    ]);

    Route::post('/logout', [
        AuthController::class,
        'logout'
    ]);

    Route::get('/auth/modules', [
        AuthController::class,
        'getModules'
    ]);


    // ========================================================
    // CLINIC
    // ========================================================

    Route::get('/clinic', [
        ClinicController::class,
        'show'
    ]);

    Route::put('/clinic', [
        ClinicController::class,
        'update'
    ]);


    // ========================================================
    // PATIENTS
    // ========================================================
    //
    // IMPORTANT:
    // Specific routes MUST come before /{id} routes.
    //
    // The frontend will use:
    //
    // GET    /api/patients
    // GET    /api/patients?search=...
    // POST   /api/patients
    // GET    /api/patients/{id}
    // PUT    /api/patients/{id}
    // DELETE /api/patients/{id}
    //
    // PatientController handles the real MySQL data.
    // ========================================================

    Route::get('/patients/search', [
        PatientController::class,
        'search'
    ])->middleware('permission:Patients::View Patients,Patients::View Patients (basic info)');

    Route::get('/patients/{id}/history', [
        ConsultationController::class,
        'index'
    ])->middleware('permission:Patients::View Medical History');

    // Same data, clearer name — used by the Owner "Patient Medical Records" module
    // and the Doctor's patient history view.
    Route::get('/patients/{id}/consultations', [
        ConsultationController::class,
        'index'
    ])->middleware('permission:Medical Records::View Records');

    // Apply permission middleware to patient resource routes
    Route::get('/patients', [PatientController::class, 'index'])
        ->middleware('permission:Patients::View Patients,Patients::View Patients (basic info)');
    Route::post('/patients', [PatientController::class, 'store'])
        ->middleware('permission:Patients::Create Patients');
    Route::get('/patients/{id}', [PatientController::class, 'show'])
        ->middleware('permission:Patients::View Patients,Patients::View Patients (basic info)');
    Route::put('/patients/{id}', [PatientController::class, 'update'])
        ->middleware('permission:Patients::Edit Patients');
    Route::delete('/patients/{id}', [PatientController::class, 'destroy'])
        ->middleware('permission:Patients::Edit Patients');


    // ========================================================
    // CONSULTATIONS (doctor Q&A / diagnosis / treatment)
    // ========================================================

    Route::post('/consultations', [
        ConsultationController::class,
        'store'
    ])->middleware('permission:Medical Records::Create Records');

    // Edit an existing medical record (owner: any record in clinic,
    // doctor: only their own). Used by the Owner "Patient Medical
    // Records" Edit button and can be reused by the doctor UI too.
    Route::put('/consultations/{id}', [
        ConsultationController::class,
        'update'
    ])->middleware('permission:Medical Records::Edit Records');


    // ========================================================
    // DOCTORS
    // ========================================================

    Route::post('/doctors/{id}/activate', [
        DoctorController::class,
        'activate'
    ]);

    Route::post('/doctors/{id}/deactivate', [
        DoctorController::class,
        'deactivate'
    ]);

    Route::post('/doctors/{id}/reset-password', [
        DoctorController::class,
        'resetPassword'
    ]);

    Route::apiResource('doctors', DoctorController::class);


    // ========================================================
    // CASHIERS
    // ========================================================

    Route::post('/cashiers/{id}/activate', [
        CashierController::class,
        'activate'
    ]);

    Route::post('/cashiers/{id}/deactivate', [
        CashierController::class,
        'deactivate'
    ]);

    Route::post('/cashiers/{id}/reset-password', [
        CashierController::class,
        'resetPassword'
    ]);

    Route::apiResource('cashiers', CashierController::class);


    // ========================================================
    // EMPLOYEES (NEW - Complete Employee Management)
    // ========================================================
    //
    // Specific routes MUST come before /{id} routes.
    // Owner only: manage all employees with roles and permissions.
    // ========================================================

    Route::get('/employees/summary', [EmployeeController::class, 'summary']);
    Route::get('/employees/search', [EmployeeController::class, 'search']);
    Route::get('/employees/roles', [EmployeeController::class, 'getRoles']);
    Route::get('/employees/permissions', [EmployeeController::class, 'getPermissions']);
    Route::get('/employees/role-permissions/{roleId}', [EmployeeController::class, 'getRolePermissions']);
    Route::post('/employees/{id}/activate', [EmployeeController::class, 'activate']);
    Route::post('/employees/{id}/deactivate', [EmployeeController::class, 'deactivate']);
    Route::post('/employees/{id}/reset-password', [EmployeeController::class, 'resetPassword']);
    Route::post('/employees/{id}/permissions', [EmployeeController::class, 'updatePermissions']);
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::get('/employees/{id}', [EmployeeController::class, 'show']);
    Route::put('/employees/{id}', [EmployeeController::class, 'update']);
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);


    // ========================================================
    // ROLES (NEW - Role Management)
    // ========================================================
    //
    // Owner only: manage roles and their default permissions.
    // ========================================================

    Route::get('/roles', [RoleController::class, 'index']);
    Route::post('/roles', [RoleController::class, 'store']);
    Route::get('/roles/{id}', [RoleController::class, 'show']);
    Route::put('/roles/{id}', [RoleController::class, 'update']);
    Route::delete('/roles/{id}', [RoleController::class, 'destroy']);
    Route::post('/roles/{id}/permissions', [RoleController::class, 'updatePermissions']);
    Route::get('/roles/{id}/permissions', [RoleController::class, 'getPermissions']);


    // ========================================================
    // PERMISSIONS (NEW - Permission Management)
    // ========================================================
    //
    // Owner only: view all available permissions.
    // ========================================================

    Route::get('/permissions', [PermissionController::class, 'index']);
    Route::get('/permissions/categories', [PermissionController::class, 'getCategories']);


    // ========================================================
    // APPOINTMENTS
    // ========================================================
    //
    // Specific GET routes MUST be before:
    // GET /appointments/{id}
    // ========================================================

    Route::get('/appointments/calendar', [
        AppointmentController::class,
        'calendar'
    ])->middleware('permission:Appointments::View Appointments,Appointments::View Appointments (own),Appointments::View Appointments (for payment verification),Appointments::View Appointments (lab-relevant)');

    Route::get('/appointments/doctor/{doctorId}', [
        AppointmentController::class,
        'doctorAppointments'
    ])->middleware('permission:Appointments::View Appointments,Appointments::View Appointments (own)');

    Route::get('/appointments', [AppointmentController::class, 'index'])
        ->middleware('permission:Appointments::View Appointments,Appointments::View Appointments (own),Appointments::View Appointments (for payment verification),Appointments::View Appointments (lab-relevant)');
    Route::post('/appointments', [AppointmentController::class, 'store'])
        ->middleware('permission:Appointments::Create Appointments');
    Route::get('/appointments/{id}', [AppointmentController::class, 'show'])
        ->middleware('permission:Appointments::View Appointments,Appointments::View Appointments (own),Appointments::View Appointments (for payment verification),Appointments::View Appointments (lab-relevant)');
    Route::put('/appointments/{id}', [AppointmentController::class, 'update'])
        ->middleware('permission:Appointments::Edit Appointments');
    Route::delete('/appointments/{id}', [AppointmentController::class, 'destroy'])
        ->middleware('permission:Appointments::Edit Appointments');


    // ========================================================
    // PAYMENTS (treatment payment requests)
    // ========================================================
    //
    // Specific routes MUST be before /payments/{id}.
    //
    // Both owners and doctors can create/edit/cancel requests.
    // Cashiers (and owners) collect payments and start treatment.
    // ========================================================

    Route::get('/payments/pending', [
        PaymentController::class,
        'pending'
    ])->middleware('permission:Payments::View Payments,Payments::Collect Payments');

    Route::get('/payments/history', [
        PaymentController::class,
        'history'
    ])->middleware('permission:Payments::View Payment History');

    Route::get('/payments/daily-summary', [
        PaymentController::class,
        'dailySummary'
    ])->middleware('permission:Payments::View Daily Summaries');

    // ========================================================
    // CREDIT REPORT - Specific route before {id}
    // ========================================================
    Route::get('/payments/credit-report', [
        PaymentController::class,
        'creditReport'
    ])->middleware('permission:Payments::View Payment History');

    Route::post('/payments/{id}/collect', [
        PaymentController::class,
        'collect'
    ])->middleware('permission:Payments::Collect Payments');

    Route::post('/payments/{id}/cancel', [
        PaymentController::class,
        'cancel'
    ])->middleware('permission:Payments::Create Payment Requests');

    Route::post('/payments/{id}/start-treatment', [
        PaymentController::class,
        'startTreatment'
    ])->middleware('permission:Payments::Collect Payments');

    Route::get('/payments/{id}', [
        PaymentController::class,
        'show'
    ])->middleware('permission:Payments::View Payments');

    Route::put('/payments/{id}', [
        PaymentController::class,
        'update'
    ])->middleware('permission:Payments::Create Payment Requests');

    Route::get('/payments', [
        PaymentController::class,
        'index'
    ])->middleware('permission:Payments::View Payments');

    Route::post('/payments', [
        PaymentController::class,
        'store'
    ])->middleware('permission:Payments::Create Payment Requests');


    // ========================================================
    // REPORTS
    // ========================================================

    Route::get('/reports/revenue', [
        ReportController::class,
        'revenue'
    ]);

    Route::get('/reports/summary', [
        ReportController::class,
        'summary'
    ]);

    Route::get('/reports/clinical', [
        ReportController::class,
        'clinical'
    ]);

    Route::get('/reports/credit', [
        ReportController::class,
        'credit'
    ]);

    Route::get('/reports/demographics', [
        ReportController::class,
        'demographics'
    ]);


    // ========================================================
    // OWNER ONLY
    // ========================================================

    Route::middleware('role:owner')->group(function () {

        // ====================================================
        // EXPENSES
        // ====================================================
        //
        // Specific routes MUST be before /expenses/{id}.
        // ====================================================

        Route::get('/expenses/employees', [
            ExpenseController::class,
            'getEmployees'
        ]);

        Route::get('/expenses/summary', [
            ExpenseController::class,
            'summary'
        ]);

        Route::get('/expenses', [
            ExpenseController::class,
            'index'
        ]);

        Route::post('/expenses', [
            ExpenseController::class,
            'store'
        ]);

        Route::get('/expenses/{id}', [
            ExpenseController::class,
            'show'
        ]);

        Route::put('/expenses/{id}', [
            ExpenseController::class,
            'update'
        ]);

        Route::delete('/expenses/{id}', [
            ExpenseController::class,
            'destroy'
        ]);


        // ====================================================
        // INVENTORY
        // ====================================================
        //
        // Specific routes MUST be before /inventory/{id}.
        // ====================================================

        Route::get('/inventory/low-stock', [
            InventoryController::class,
            'lowStock'
        ]);

        Route::get('/inventory/categories', [
            InventoryController::class,
            'getCategories'
        ]);

        Route::get('/inventory', [
            InventoryController::class,
            'index'
        ]);

        Route::post('/inventory', [
            InventoryController::class,
            'store'
        ]);

        Route::get('/inventory/{id}', [
            InventoryController::class,
            'show'
        ]);

        Route::put('/inventory/{id}', [
            InventoryController::class,
            'update'
        ]);

        Route::delete('/inventory/{id}', [
            InventoryController::class,
            'destroy'
        ]);

        Route::patch('/inventory/{id}/restock', [
            InventoryController::class,
            'restock'
        ]);


        // ====================================================
        // REVENUE
        // ====================================================

        Route::get('/revenue/summary', [
            RevenueController::class,
            'dailySummary'
        ]);

        Route::get('/revenue', [
            RevenueController::class,
            'index'
        ]);

        Route::post('/revenue', [
            RevenueController::class,
            'store'
        ]);

        Route::put('/revenue/{id}', [
            RevenueController::class,
            'update'
        ]);

        Route::delete('/revenue/{id}', [
            RevenueController::class,
            'destroy'
        ]);
    });


    // ========================================================
    // PLATFORM ADMIN ONLY
    // ========================================================

    Route::middleware('role:platform_admin')->group(function () {


        // ====================================================
        // CLINICS MANAGEMENT
        // ====================================================

        Route::get('/clinics', [
            ClinicController::class,
            'index'
        ]);

        Route::post('/clinics', [
            ClinicController::class,
            'store'
        ]);

        Route::get('/clinics/{id}', [
            ClinicController::class,
            'show'
        ]);

        Route::put('/clinics/{id}', [
            ClinicController::class,
            'update'
        ]);

        Route::delete('/clinics/{id}', [
            ClinicController::class,
            'destroy'
        ]);

        Route::post('/clinics/{id}/activate', [
            ClinicController::class,
            'activate'
        ]);

        Route::post('/clinics/{id}/deactivate', [
            ClinicController::class,
            'deactivate'
        ]);


        // ====================================================
        // SUBSCRIPTIONS
        // ====================================================

        Route::get('/subscriptions', [
            SubscriptionController::class,
            'index'
        ]);

        Route::post('/subscriptions', [
            SubscriptionController::class,
            'store'
        ]);

        Route::get('/subscriptions/{id}', [
            SubscriptionController::class,
            'show'
        ]);

        Route::put('/subscriptions/{id}', [
            SubscriptionController::class,
            'update'
        ]);

        Route::delete('/subscriptions/{id}', [
            SubscriptionController::class,
            'destroy'
        ]);


        // ====================================================
        // SUBSCRIPTION REQUESTS
        // ====================================================

        Route::get('/subscription-requests', [
            SubscriptionController::class,
            'requests'
        ]);

        Route::post('/subscription-requests/{id}/approve', [
            SubscriptionController::class,
            'approveRequest'
        ]);

        Route::post('/subscription-requests/{id}/reject', [
            SubscriptionController::class,
            'rejectRequest'
        ]);


        // ====================================================
        // CLINIC REGISTRATIONS
        // ====================================================

        Route::get('/admin/registrations', [
            RegistrationController::class,
            'index'
        ]);

        Route::get('/admin/registrations/{id}', [
            RegistrationController::class,
            'show'
        ]);
    });
});


// ============================================================
// FALLBACK
// ============================================================

Route::fallback(function () {

    return response()->json([
        'success' => false,
        'message' => 'Route not found'
    ], 404);
});