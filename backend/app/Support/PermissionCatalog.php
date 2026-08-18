<?php

namespace App\Support;

/**
 * Single source of truth for staff roles + the permission catalog.
 *
 * Keys are formatted "Category::Label" so the React app (which uses
 * the exact same category/label strings) can compute the same key
 * without a separate lookup table. If you ever rename a label here,
 * rename it in EmployeesManagement.jsx too.
 */
class PermissionCatalog
{
    /**
     * Roles the owner can assign to an employee.
     */
    public const ROLES = [
        'doctor' => 'Doctor',
        'cashier' => 'Cashier',
        'nurse' => 'Nurse',
        'receptionist' => 'Receptionist',
        'lab_technician' => 'Lab Technician',
    ];

    /**
     * Every permission that exists in the system, grouped by
     * category. This is the UNION of what every role can do — the
     * owner can grant any of these to any employee, regardless of
     * role, when creating or editing them.
     */
    public const CATALOG = [
        'Patients' => [
            'View Patients',
            'View Patients (basic info)',
            'Create Patients',
            'Edit Patients',
            'View Medical History',
        ],
        'Appointments' => [
            'View Appointments',
            'View Appointments (own)',
            'View Appointments (for payment verification)',
            'View Appointments (lab-relevant)',
            'Create Appointments',
            'Edit Appointments',
            'Check-in / Check-out',
        ],
        'Medical Records' => [
            'View Records',
            'Create Records',
            'Edit Records',
            'Add Prescriptions',
            'Update Patient Vitals',
            'View Lab Requests',
            'Update Lab Results',
        ],
        'Payments' => [
            'Create Payment Requests',
            'View Payments',
            'Collect Payments',
            'View Payment History',
            'Generate Receipts',
            'View Daily Summaries',
        ],
    ];

    /**
     * Default permissions granted to a fresh employee of each role.
     * The owner can add to or remove from this set per employee —
     * this is only what gets pre-checked when the role is picked.
     */
    public const ROLE_DEFAULTS = [
        'doctor' => [
            'Patients' => ['View Patients', 'Create Patients', 'Edit Patients', 'View Medical History'],
            'Appointments' => ['View Appointments (own)', 'Create Appointments', 'Edit Appointments'],
            'Medical Records' => ['View Records', 'Create Records', 'Edit Records', 'Add Prescriptions'],
            'Payments' => ['Create Payment Requests', 'View Payments'],
        ],
        'cashier' => [
            'Patients' => ['View Patients (basic info)'],
            'Appointments' => ['View Appointments (for payment verification)'],
            'Payments' => ['Collect Payments', 'View Payment History', 'Generate Receipts', 'View Daily Summaries'],
        ],
        'nurse' => [
            'Patients' => ['View Patients', 'View Medical History'],
            'Appointments' => ['View Appointments'],
            'Medical Records' => ['View Records', 'Update Patient Vitals'],
        ],
        'receptionist' => [
            'Patients' => ['View Patients (basic info)', 'Create Patients'],
            'Appointments' => ['View Appointments', 'Create Appointments', 'Edit Appointments', 'Check-in / Check-out'],
        ],
        'lab_technician' => [
            'Patients' => ['View Patients (basic info)'],
            'Appointments' => ['View Appointments (lab-relevant)'],
            'Medical Records' => ['View Lab Requests', 'Update Lab Results'],
        ],
    ];

    /**
     * "Category::Label" key for a category + label pair.
     */
    public static function key(string $category, string $label): string
    {
        return $category . '::' . $label;
    }

    /**
     * Flat array of every valid permission key that exists.
     */
    public static function allKeys(): array
    {
        $keys = [];

        foreach (self::CATALOG as $category => $labels) {
            foreach ($labels as $label) {
                $keys[] = self::key($category, $label);
            }
        }

        return $keys;
    }

    /**
     * Catalog formatted for the API: grouped list of
     * { category, items: [{ key, label }] }.
     */
    public static function catalogForApi(): array
    {
        $out = [];

        foreach (self::CATALOG as $category => $labels) {
            $out[] = [
                'category' => $category,
                'items' => array_map(
                    fn ($label) => [
                        'key' => self::key($category, $label),
                        'label' => $label,
                    ],
                    $labels
                ),
            ];
        }

        return $out;
    }

    /**
     * Flat list of default permission keys for a role.
     */
    public static function defaultsForRole(string $role): array
    {
        $groups = self::ROLE_DEFAULTS[$role] ?? [];
        $keys = [];

        foreach ($groups as $category => $labels) {
            foreach ($labels as $label) {
                $keys[] = self::key($category, $label);
            }
        }

        return $keys;
    }

    /**
     * Roles list formatted for the API: [{ value, label }].
     */
    public static function rolesForApi(): array
    {
        return array_map(
            fn ($value, $label) => ['value' => $value, 'label' => $label],
            array_keys(self::ROLES),
            array_values(self::ROLES)
        );
    }

    /**
     * Filter a submitted permissions array down to only keys that
     * actually exist in the catalog (ignore/drop anything unknown
     * instead of failing validation on it).
     */
    public static function sanitize(?array $submitted): array
    {
        if (!$submitted) {
            return [];
        }

        $valid = self::allKeys();

        return array_values(array_intersect($submitted, $valid));
    }
}
