<?php
// app/Http/Controllers/Api/InventoryController.php
//
// EXPENSE BEHAVIOR (final):
//  - Adding a brand-new item -> creates ONE expense for it.
//  - Restocking an existing item (adding quantity) -> does NOT create a
//    new expense row. Instead it UPDATES that item's existing expense:
//    adds (qty * new buying price) to the amount, and rewrites the
//    description to show the running total + latest restock info.
//  - Removing stock -> never touches any expense (not a purchase).
//  - If an item has no expense yet for some reason, restocking creates
//    one instead of throwing an error.

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        try {
            $clinic_id = $request->user()->clinic_id;

            if (!$clinic_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No clinic found for this user. Please contact admin.'
                ], 400);
            }

            $query = Inventory::where('clinic_id', $clinic_id);

            if ($request->has('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }

            if ($request->has('search') && $request->search) {
                $search = '%' . $request->search . '%';
                $query->where('name', 'like', $search);
            }

            $inventory = $query->orderBy('name')->get();

            $total_cost = 0;
            $potential_revenue = 0;
            $low_stock = 0;

            foreach ($inventory as $item) {
                $total_cost += $item->quantity * $item->buy_price;
                $potential_revenue += $item->quantity * $item->sell_price;
                if ($item->low_stock_threshold && $item->quantity <= $item->low_stock_threshold) {
                    $low_stock++;
                }
            }

            $summary = [
                'total_value' => $total_cost,
                'total_cost' => $total_cost,
                'potential_revenue' => $potential_revenue,
                'potential_profit' => $potential_revenue - $total_cost,
                'low_stock' => $low_stock,
            ];

            return response()->json([
                'success' => true,
                'data' => $inventory,
                'summary' => $summary
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch inventory: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch inventory: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Small shared helper: find the expense tied to an inventory item.
     * If duplicates exist from before this fix, we use the most recent one
     * so we have a single source of truth going forward.
     */
    private function findExpenseForItem($inventoryId)
    {
        return Expense::where('inventory_id', $inventoryId)
            ->where('source', 'inventory')
            ->latest('id')
            ->first();
    }

    /**
     * Add an item, or restock it if an item with the same name already
     * exists for this clinic.
     */
    public function store(Request $request)
    {
        try {
            Log::info('📥 Inventory store request received', [
                'user_id' => $request->user()->id,
                'user_clinic_id' => $request->user()->clinic_id,
                'data' => $request->all()
            ]);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'category' => 'required|in:consumable,medication,instrument,equipment,other',
                'quantity' => 'required|numeric|min:0',
                'buying_price' => 'required|numeric|min:0',
                'selling_price' => 'required|numeric|min:0',
                'low_stock_threshold' => 'nullable|numeric|min:0',
                'description' => 'nullable|string',
                'supplier' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                Log::error('❌ Validation failed', [
                    'errors' => $validator->errors()->toArray()
                ]);
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $clinic_id = $request->user()->clinic_id;

            if (!$clinic_id) {
                Log::error('❌ No clinic_id found for user', [
                    'user_id' => $request->user()->id,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'No clinic found for this user. Please contact admin to assign a clinic.'
                ], 400);
            }

            DB::beginTransaction();

            $existing = Inventory::where('clinic_id', $clinic_id)
                ->where('name', $request->name)
                ->first();

            $expense = null;
            $expense_created = false;

            if ($existing) {
                // ===== RESTOCK PATH: item already exists =====
                $old_quantity = $existing->quantity;
                $restock_qty = (float) $request->quantity;
                $new_price = (float) $request->buying_price;
                $added_cost = $restock_qty * $new_price;

                $existing->quantity += $restock_qty;
                $existing->buy_price = $new_price; // latest batch price shown on the item
                $existing->sell_price = $request->selling_price;
                $existing->low_stock_threshold = $request->low_stock_threshold ?? $existing->low_stock_threshold;
                $existing->supplier = $request->supplier ?? $existing->supplier;
                $existing->save();

                $inventory = $existing;
                $message = 'Stock updated for existing item';

                // Update the item's ONE expense instead of creating a new row.
                $expense = $this->findExpenseForItem($inventory->id);

                if ($expense) {
                    $expense->amount += $added_cost;
                    $expense->expense_date = now()->toDateString();
                    $expense->description = "Total {$inventory->quantity} unit(s) of {$inventory->name} purchased for a running cost of {$expense->amount} ETB. " .
                        "Latest restock: +{$restock_qty} unit(s) at {$new_price} ETB each" .
                        ($request->supplier ? " from {$request->supplier}" : "") . ".";
                    $expense->notes = "Inventory item ID: {$inventory->id}";
                    $expense->save();
                } else {
                    // No expense on record for this item (e.g. created before this
                    // fix, or its expense was deleted) — create one now.
                    $expense = Expense::create([
                        'clinic_id' => $clinic_id,
                        'user_id' => $request->user()->id,
                        'title' => 'Inventory: ' . $inventory->name,
                        'description' => "Total {$inventory->quantity} unit(s) of {$inventory->name} purchased for a running cost of {$added_cost} ETB. " .
                            "Latest restock: +{$restock_qty} unit(s) at {$new_price} ETB each.",
                        'amount' => $added_cost,
                        'expense_date' => now()->toDateString(),
                        'category' => 'inventory',
                        'payment_method' => 'cash',
                        'notes' => "Inventory item ID: {$inventory->id}",
                        'status' => 'paid',
                        'paid_at' => now(),
                        'source' => 'inventory',
                        'inventory_id' => $inventory->id,
                    ]);
                }

                $expense_created = false; // never a NEW row on restock

                Log::info('✅ Existing item restocked — expense updated, not duplicated', [
                    'inventory_id' => $inventory->id,
                    'name' => $inventory->name,
                    'old_quantity' => $old_quantity,
                    'new_quantity' => $inventory->quantity,
                    'added_cost' => $added_cost,
                    'expense_id' => $expense->id,
                    'expense_new_total' => $expense->amount,
                ]);
            } else {
                // ===== NEW ITEM PATH: create inventory row + one expense =====
                $inventory = Inventory::create([
                    'clinic_id' => $clinic_id,
                    'user_id' => $request->user()->id,
                    'name' => $request->name,
                    'category' => $request->category,
                    'quantity' => $request->quantity,
                    'buy_price' => $request->buying_price,
                    'sell_price' => $request->selling_price,
                    'supplier' => $request->supplier,
                    'low_stock_threshold' => $request->low_stock_threshold ?? 10,
                ]);
                $message = 'Item added to inventory';

                $total_cost = $request->quantity * $request->buying_price;

                $expense = Expense::create([
                    'clinic_id' => $clinic_id,
                    'user_id' => $request->user()->id,
                    'title' => 'Inventory: ' . $request->name,
                    'description' => "Total {$request->quantity} unit(s) of {$request->name} purchased for a running cost of {$total_cost} ETB. " .
                        "Latest restock: +{$request->quantity} unit(s) at {$request->buying_price} ETB each" .
                        ($request->supplier ? " from {$request->supplier}" : "") . ".",
                    'amount' => $total_cost,
                    'expense_date' => now()->toDateString(),
                    'category' => 'inventory',
                    'payment_method' => 'cash',
                    'notes' => "Inventory item ID: {$inventory->id}",
                    'status' => 'paid',
                    'paid_at' => now(),
                    'source' => 'inventory',
                    'inventory_id' => $inventory->id,
                ]);

                $expense_created = true;

                Log::info('✅ New inventory item + expense created', [
                    'inventory_id' => $inventory->id,
                    'expense_id' => $expense->id,
                    'amount' => $total_cost,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $expense_created
                    ? $message . ' and expense recorded!'
                    : $message . ' — item expense total updated (no duplicate row).',
                'data' => $inventory,
                'expense_created' => $expense_created,
                'expense' => $expense,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Failed to add inventory: ' . $e->getMessage());
            Log::error('❌ Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add inventory: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $inventory = Inventory::findOrFail($id);
            $clinic_id = $request->user()->clinic_id;

            if ($inventory->clinic_id !== $clinic_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'category' => 'sometimes|in:consumable,medication,instrument,equipment,other',
                'quantity' => 'sometimes|numeric|min:0',
                'buying_price' => 'sometimes|numeric|min:0',
                'selling_price' => 'sometimes|numeric|min:0',
                'low_stock_threshold' => 'nullable|numeric|min:0',
                'supplier' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $inventory->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Inventory item updated successfully!',
                'data' => $inventory
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update inventory: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update inventory'
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $inventory = Inventory::findOrFail($id);
            $clinic_id = auth()->user()->clinic_id;

            if ($inventory->clinic_id !== $clinic_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $inventory->delete();

            return response()->json([
                'success' => true,
                'message' => 'Item deleted successfully!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete inventory: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete inventory'
            ], 500);
        }
    }

    public function lowStock(Request $request)
    {
        try {
            $clinic_id = $request->user()->clinic_id;

            $items = Inventory::where('clinic_id', $clinic_id)
                ->whereColumn('quantity', '<=', 'low_stock_threshold')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $items,
                'count' => $items->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch low stock items'
            ], 500);
        }
    }

    /**
     * Dedicated restock endpoint (used by the "Adjust Stock" modal).
     *
     * quantity is a SIGNED delta from the frontend: positive = add stock,
     * negative = remove stock.
     *
     *  - Adding stock -> updates this item's existing expense total (adds
     *    delta * price). Never creates a new expense row.
     *  - Removing stock -> just lowers quantity. Never touches expenses,
     *    since removing stock isn't a purchase.
     */
    public function restock(Request $request, $id)
    {
        try {
            $inventory = Inventory::findOrFail($id);
            $clinic_id = $request->user()->clinic_id;

            if ($inventory->clinic_id !== $clinic_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'quantity' => 'required|numeric|not_in:0',
                'buying_price' => 'nullable|numeric|min:0',
                'selling_price' => 'nullable|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $old_quantity = $inventory->quantity;
            $delta = (float) $request->quantity;
            $new_quantity = $old_quantity + $delta;

            if ($new_quantity < 0) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot remove more than current stock'
                ], 422);
            }

            // Price used for this batch: whatever was passed in, else the
            // item's current buy price.
            $price_used = $request->filled('buying_price')
                ? (float) $request->buying_price
                : (float) $inventory->buy_price;

            $inventory->quantity = $new_quantity;

            if ($request->filled('buying_price')) {
                $inventory->buy_price = $price_used;
            }
            if ($request->filled('selling_price')) {
                $inventory->sell_price = $request->selling_price;
            }
            $inventory->save();

            $expense = null;
            $expense_updated = false;

            if ($delta > 0) {
                // Adding stock -> update (or create) the item's expense.
                $added_cost = $delta * $price_used;
                $expense = $this->findExpenseForItem($inventory->id);

                if ($expense) {
                    $expense->amount += $added_cost;
                    $expense->expense_date = now()->toDateString();
                    $expense->description = "Total {$inventory->quantity} unit(s) of {$inventory->name} purchased for a running cost of {$expense->amount} ETB. " .
                        "Latest restock: +{$delta} unit(s) at {$price_used} ETB each.";
                    $expense->notes = "Inventory item ID: {$inventory->id}";
                    $expense->save();
                } else {
                    $expense = Expense::create([
                        'clinic_id' => $clinic_id,
                        'user_id' => $request->user()->id,
                        'title' => 'Inventory: ' . $inventory->name,
                        'description' => "Total {$inventory->quantity} unit(s) of {$inventory->name} purchased for a running cost of {$added_cost} ETB. " .
                            "Latest restock: +{$delta} unit(s) at {$price_used} ETB each.",
                        'amount' => $added_cost,
                        'expense_date' => now()->toDateString(),
                        'category' => 'inventory',
                        'payment_method' => 'cash',
                        'notes' => "Inventory item ID: {$inventory->id}",
                        'status' => 'paid',
                        'paid_at' => now(),
                        'source' => 'inventory',
                        'inventory_id' => $inventory->id,
                    ]);
                }

                $expense_updated = true;
            }
            // delta < 0 (removing stock) -> no expense change at all.

            Log::info('✅ Inventory restocked via restock() endpoint', [
                'inventory_id' => $inventory->id,
                'name' => $inventory->name,
                'old_quantity' => $old_quantity,
                'new_quantity' => $inventory->quantity,
                'delta' => $delta,
                'expense_updated' => $expense_updated,
                'expense_id' => $expense?->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $expense_updated
                    ? 'Stock updated and expense total adjusted!'
                    : 'Stock updated!',
                'data' => $inventory,
                'expense_created' => false,
                'expense_updated' => $expense_updated,
                'expense' => $expense,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to restock: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to restock item'
            ], 500);
        }
    }

    public function getCategories()
    {
        return response()->json([
            'success' => true,
            'data' => [
                ['value' => 'consumable', 'label' => '🔄 Consumables'],
                ['value' => 'medication', 'label' => '💊 Medications'],
                ['value' => 'instrument', 'label' => '🔧 Instruments'],
                ['value' => 'equipment', 'label' => '⚙️ Equipment'],
                ['value' => 'other', 'label' => '📋 Other'],
            ]
        ]);
    }
}