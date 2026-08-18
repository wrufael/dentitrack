<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\PermissionCatalog;
use Illuminate\Http\Request;

/**
 * Roles are currently a fixed, built-in list (see
 * PermissionCatalog::ROLES) rather than rows in the database —
 * every clinic gets the same five staff roles. This controller
 * exposes that list read-only. Per-employee access is still fully
 * customizable via EmployeeController@updatePermissions; only
 * creating brand-new custom role *names* isn't supported yet.
 */
class RoleController extends Controller
{
    /**
     * GET /api/roles
     */
    public function index(Request $request)
    {
        $roles = collect(PermissionCatalog::rolesForApi())->map(function ($role) {
            $role['permissions_count'] = count(PermissionCatalog::defaultsForRole($role['value']));
            return $role;
        });

        return response()->json([
            'success' => true,
            'data' => $roles,
        ]);
    }

    /**
     * GET /api/roles/{id}
     */
    public function show(Request $request, $id)
    {
        if (!array_key_exists($id, PermissionCatalog::ROLES)) {
            return response()->json([
                'success' => false,
                'message' => 'Role not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'value' => $id,
                'label' => PermissionCatalog::ROLES[$id],
                'permissions' => PermissionCatalog::defaultsForRole($id),
            ],
        ]);
    }

    /**
     * GET /api/roles/{id}/permissions
     */
    public function getPermissions(Request $request, $id)
    {
        if (!array_key_exists($id, PermissionCatalog::ROLES)) {
            return response()->json([
                'success' => false,
                'message' => 'Role not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => PermissionCatalog::defaultsForRole($id),
        ]);
    }

    /**
     * POST /api/roles/{id}/permissions
     * Not supported: role defaults are fixed system-wide. To give
     * one employee more or less access, use
     * POST /api/employees/{id}/permissions instead.
     */
    public function updatePermissions(Request $request, $id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Role defaults can\'t be changed here. Use "Manage Access" on an individual employee instead.',
        ], 405);
    }

    /**
     * POST /api/roles — custom role creation isn't supported yet.
     */
    public function store(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Creating custom roles isn\'t supported yet.',
        ], 405);
    }

    public function update(Request $request, $id)
    {
        return response()->json([
            'success' => false,
            'message' => 'System roles can\'t be edited.',
        ], 405);
    }

    public function destroy(Request $request, $id)
    {
        return response()->json([
            'success' => false,
            'message' => 'System roles can\'t be deleted.',
        ], 405);
    }
}
