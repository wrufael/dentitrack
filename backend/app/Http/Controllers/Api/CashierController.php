<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cashier;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class CashierController extends Controller
{
    public function index(Request $request)
    {
        $cashiers = Cashier::with('user')
            ->where('clinic_id', $request->user()->clinic_id)
            ->get();

        return response()->json($cashiers);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:30',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $cashier = DB::transaction(function () use ($request, $user) {
            $newUser = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'role' => 'cashier',
                'clinic_id' => $user->clinic_id,
                'is_active' => true,
            ]);

            return Cashier::create([
                'clinic_id' => $user->clinic_id,
                'user_id' => $newUser->id,
            ]);
        });

        return response()->json($cashier->load('user'), 201);
    }

    public function show(Request $request, $id)
    {
        $cashier = Cashier::with('user')->where('clinic_id', $request->user()->clinic_id)->findOrFail($id);
        return response()->json($cashier);
    }

    public function update(Request $request, $id)
    {
        $cashier = Cashier::where('clinic_id', $request->user()->clinic_id)->findOrFail($id);

        if ($request->filled('name') || $request->filled('phone')) {
            $cashier->user()->update($request->only(['name', 'phone']));
        }

        return response()->json($cashier->load('user'));
    }

    public function destroy(Request $request, $id)
    {
        $cashier = Cashier::where('clinic_id', $request->user()->clinic_id)->findOrFail($id);
        $cashier->user()->update(['is_active' => false]);
        $cashier->delete();
        return response()->json(['message' => 'Cashier removed']);
    }
}