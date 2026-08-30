<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index(Request $request)
    {
        $query = Warehouse::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('warehouse_name', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }

        $warehouses = $query->paginate($request->get('per_page', 15));

        return response()->json($warehouses);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'warehouse_name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        $warehouse = Warehouse::create($validated);

        return response()->json($warehouse, 201);
    }

    public function show(Warehouse $warehouse)
    {
        return response()->json($warehouse);
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'warehouse_name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        $warehouse->update($validated);

        return response()->json($warehouse);
    }

    public function destroy(Warehouse $warehouse)
    {
        if ($warehouse->inventory()->exists() || 
            $warehouse->inboundOrders()->exists() || 
            $warehouse->outboundOrders()->exists()) {
            return response()->json(['error' => 'Cannot delete warehouse with existing data'], 422);
        }

        $warehouse->delete();
        return response()->json(['message' => 'Warehouse deleted successfully']);
    }
}