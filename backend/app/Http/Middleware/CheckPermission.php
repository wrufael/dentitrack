<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Middleware that checks if the authenticated user has a specific
 * permission before allowing access to a route.
 * 
 * Usage in routes:
 * Route::get('/patients', [PatientController::class, 'index'])
 *     ->middleware('permission:Patients::View Patients');
 */
class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$permissions  The required permission keys (comma-separated or multiple args)
     * @return mixed
     */
    public function handle(Request $request, Closure $next, string ...$permissions)
    {
        $user = $request->user();

        // Platform admins and owners have full access to everything
        if ($user && ($user->role === 'platform_admin' || $user->role === 'owner')) {
            return $next($request);
        }

        // If multiple permissions provided, user needs at least ONE (OR logic)
        // This allows flexible access (e.g., "View Patients" OR "View Patients (basic info)")
        if ($user && count($permissions) > 0) {
            foreach ($permissions as $permission) {
                // Split by comma in case permissions are passed as comma-separated string
                $permissionList = array_map('trim', explode(',', $permission));
                
                foreach ($permissionList as $perm) {
                    if ($this->hasPermission($user, $perm)) {
                        return $next($request);
                    }
                }
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'You do not have permission to access this resource.',
        ], 403);
    }

    /**
     * Check if the user has a specific permission.
     *
     * @param  \App\Models\User  $user
     * @param  string  $permission
     * @return bool
     */
    private function hasPermission($user, string $permission): bool
    {
        if (!$user || !$user->permissions) {
            return false;
        }

        $permissions = is_array($user->permissions) 
            ? $user->permissions 
            : json_decode($user->permissions, true) ?? [];

        return in_array($permission, $permissions);
    }
}
