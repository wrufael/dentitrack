<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use Illuminate\Http\Request;

class ClinicController extends Controller
{
    public function show(Request $request)
    {
        $clinic = Clinic::findOrFail($request->user()->clinic_id);
        return response()->json($clinic);
    }

    public function update(Request $request)
    {
        $clinic = Clinic::findOrFail($request->user()->clinic_id);
        $clinic->update($request->only([
            'name', 'owner_name', 'owner_phone', 'email', 'address', 'city', 'country'
        ]));
        return response()->json($clinic);
    }
}