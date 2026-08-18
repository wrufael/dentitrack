<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\PermissionCatalog;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    /**
     * GET /api/permissions
     * Flat list of every permission that exists.
     */
    public function index(Request $request)
    {
        $flat = [];

        foreach (PermissionCatalog::CATALOG as $category => $labels) {
            foreach ($labels as $label) {
                $flat[] = [
                    'key' => PermissionCatalog::key($category, $label),
                    'label' => $label,
                    'category' => $category,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => $flat,
        ]);
    }

    /**
     * GET /api/permissions/categories
     * Same catalog, grouped by category.
     */
    public function getCategories(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => PermissionCatalog::catalogForApi(),
        ]);
    }
}
