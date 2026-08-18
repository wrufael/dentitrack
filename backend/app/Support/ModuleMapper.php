<?php

namespace App\Support;

/**
 * Maps permissions to frontend modules/pages.
 * This determines which navigation items and routes an employee can access.
 */
class ModuleMapper
{
    /**
     * Define all available modules in the system.
     * Each module has permissions that grant access to it.
     */
    public const MODULES = [
        [
            'key' => 'dashboard',
            'name' => 'Dashboard',
            'path' => '/dashboard',
            'icon' => 'dashboard',
            'permissions' => [], // Everyone with account can see dashboard
        ],
        [
            'key' => 'patients',
            'name' => 'Patients',
            'path' => '/patients',
            'icon' => 'people',
            'permissions' => [
                'Patients::View Patients',
                'Patients::View Patients (basic info)',
            ],
        ],
        [
            'key' => 'appointments',
            'name' => 'Appointments',
            'path' => '/appointments',
            'icon' => 'calendar',
            'permissions' => [
                'Appointments::View Appointments',
                'Appointments::View Appointments (own)',
                'Appointments::View Appointments (for payment verification)',
                'Appointments::View Appointments (lab-relevant)',
            ],
        ],
        [
            'key' => 'medical_records',
            'name' => 'Medical Records',
            'path' => '/medical-records',
            'icon' => 'medical',
            'permissions' => [
                'Medical Records::View Records',
                'Medical Records::View Lab Requests',
            ],
        ],
        [
            'key' => 'payments',
            'name' => 'Payments',
            'path' => '/payments',
            'icon' => 'payment',
            'permissions' => [
                'Payments::View Payments',
                'Payments::Collect Payments',
                'Payments::View Payment History',
            ],
        ],
        [
            'key' => 'reports',
            'name' => 'Reports',
            'path' => '/reports',
            'icon' => 'report',
            'permissions' => [
                'Payments::View Daily Summaries',
            ],
        ],
        [
            'key' => 'inventory',
            'name' => 'Inventory',
            'path' => '/inventory',
            'icon' => 'inventory',
            'permissions' => [], // Controlled separately if needed
        ],
        [
            'key' => 'employees',
            'name' => 'Employees',
            'path' => '/employees',
            'icon' => 'team',
            'permissions' => [], // Only owners can access (handled by role check)
            'roles' => ['owner', 'platform_admin'],
        ],
        [
            'key' => 'settings',
            'name' => 'Settings',
            'path' => '/settings',
            'icon' => 'settings',
            'permissions' => [], // Only owners can access
            'roles' => ['owner', 'platform_admin'],
        ],
    ];

    /**
     * Get accessible modules for a user based on their role and permissions.
     *
     * @param \App\Models\User $user
     * @return array
     */
    public static function getAccessibleModules($user): array
    {
        // Platform admins and owners get all modules
        if ($user->role === 'platform_admin' || $user->role === 'owner') {
            return self::MODULES;
        }

        $userPermissions = is_array($user->permissions) 
            ? $user->permissions 
            : json_decode($user->permissions, true) ?? [];

        $accessibleModules = [];

        foreach (self::MODULES as $module) {
            // Check role-based access first
            if (!empty($module['roles'])) {
                if (!in_array($user->role, $module['roles'])) {
                    continue; // User doesn't have required role
                }
            }

            // Check permission-based access
            if (empty($module['permissions'])) {
                // No permissions required, add module
                $accessibleModules[] = $module;
            } else {
                // Check if user has at least one of the required permissions
                $hasAccess = false;
                foreach ($module['permissions'] as $requiredPermission) {
                    if (in_array($requiredPermission, $userPermissions)) {
                        $hasAccess = true;
                        break;
                    }
                }

                if ($hasAccess) {
                    $accessibleModules[] = $module;
                }
            }
        }

        return $accessibleModules;
    }

    /**
     * Check if a user can access a specific module.
     *
     * @param \App\Models\User $user
     * @param string $moduleKey
     * @return bool
     */
    public static function canAccessModule($user, string $moduleKey): bool
    {
        $accessibleModules = self::getAccessibleModules($user);
        
        foreach ($accessibleModules as $module) {
            if ($module['key'] === $moduleKey) {
                return true;
            }
        }

        return false;
    }
}
