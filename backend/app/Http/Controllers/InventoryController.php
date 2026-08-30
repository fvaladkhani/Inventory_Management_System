<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Inventory::query();

        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        // Low stock filter removed for now to avoid SQL complexity

        $inventory = $query->paginate($request->get('per_page', 15));

        return response()->json($inventory);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,warehouse_id',
            'product_id' => 'required|exists:products,product_id',
            'variant_id' => 'nullable|exists:product_variants,variant_id',
            'quantity' => 'required|integer|min:0',
        ]);

        $inventory = Inventory::create($validated);

        return response()->json($inventory, 201);
    }

    public function show(Inventory $inventory)
    {
        return response()->json($inventory);
    }

    public function update(Request $request, Inventory $inventory)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:0',
        ]);

        $oldQuantity = $inventory->quantity;
        $inventory->update($validated);

        // Create adjustment transaction
        if ($oldQuantity != $validated['quantity']) {
            InventoryTransaction::create([
                'product_id' => $inventory->product_id,
                'variant_id' => $inventory->variant_id,
                'warehouse_id' => $inventory->warehouse_id,
                'user_id' => $request->user()->id,
                'transaction_type_id' => 3, // adjustment
                'quantity' => $validated['quantity'] - $oldQuantity,
                'transaction_value' => 0,
                'transaction_date' => now()->toDateString(),
                'remarks' => 'Manual inventory adjustment',
            ]);
        }

        return response()->json($inventory);
    }

    public function destroy(Inventory $inventory)
    {
        $inventory->delete();
        return response()->json(['message' => 'Inventory record deleted successfully']);
    }

    public function summary()
    {
        $summary = DB::select("
            SELECT 
                w.warehouse_name,
                COUNT(i.inventory_id) as total_products,
                SUM(i.quantity) as total_quantity,
                SUM(CASE WHEN i.quantity <= p.minimum_quantity THEN 1 ELSE 0 END) as low_stock_items,
                SUM(i.quantity * p.base_price) as total_value
            FROM warehouses w
            LEFT JOIN inventory i ON w.warehouse_id = i.warehouse_id
            LEFT JOIN products p ON i.product_id = p.product_id
            GROUP BY w.warehouse_id, w.warehouse_name
        ");

        return response()->json($summary);
    }

    public function movements(Request $request)
    {
        $query = InventoryTransaction::query();

        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('date_from')) {
            $query->where('transaction_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('transaction_date', '<=', $request->date_to);
        }

        $movements = $query->orderBy('transaction_date', 'desc')
                          ->paginate($request->get('per_page', 15));

        return response()->json($movements);
    }
}