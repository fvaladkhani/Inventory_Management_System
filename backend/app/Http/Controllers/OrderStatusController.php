<?php

namespace App\Http\Controllers;

use App\Models\OrderStatus;
use Illuminate\Http\Request;

class OrderStatusController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(OrderStatus::query()->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request)
    {
        $status = OrderStatus::create($request->validate([
            'status_name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]));
        return response()->json($status, 201);
    }

    public function show(OrderStatus $status) { return response()->json($status); }

    public function update(Request $request, OrderStatus $status)
    {
        $status->update($request->validate([
            'status_name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]));
        return response()->json($status);
    }

    public function destroy(OrderStatus $status)
    {
        if ($status->inboundOrders()->exists() || $status->outboundOrders()->exists()) {
            return response()->json(['error' => 'Cannot delete status in use'], 422);
        }
        $status->delete();
        return response()->json(['message' => 'Status deleted successfully']);
    }
}