<?php

namespace App\Http\Controllers;

use App\Models\TransactionType;
use Illuminate\Http\Request;

class TransactionTypeController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(TransactionType::query()->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request)
    {
        $type = TransactionType::create($request->validate([
            'type_name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]));
        return response()->json($type, 201);
    }

    public function show(TransactionType $type) { return response()->json($type); }

    public function update(Request $request, TransactionType $type)
    {
        $type->update($request->validate([
            'type_name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]));
        return response()->json($type);
    }

    public function destroy(TransactionType $type)
    {
        if ($type->inventoryTransactions()->exists()) {
            return response()->json(['error' => 'Cannot delete transaction type in use'], 422);
        }
        $type->delete();
        return response()->json(['message' => 'Transaction type deleted successfully']);
    }
}