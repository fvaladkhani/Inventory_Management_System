<?php

namespace App\Http\Controllers;

use App\Models\InboundOrder;
use App\Models\InboundOrderItem;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InboundOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = InboundOrder::with(['warehouse', 'vendor', 'status', 'user']);

        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->has('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->has('status_id')) {
            $query->where('status_id', $request->status_id);
        }

        $orders = $query->orderBy('order_date', 'desc')
                       ->paginate($request->get('per_page', 15));

        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,warehouse_id',
            'vendor_id' => 'required|exists:vendors,vendor_id',
            'status_id' => 'required|exists:order_statuses,status_id',
            'delivery_agent' => 'nullable|string',
            'order_date' => 'required|date',
            'item_total' => 'required|numeric|min:0',
            'freight_cost' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'order_total' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.variant_id' => 'nullable|exists:product_variants,variant_id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.total_price' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $validated['user_id'] = $request->user()->id;
            $items = $validated['items'];
            unset($validated['items']);

            $order = InboundOrder::create($validated);

            foreach ($items as $item) {
                $item['inbound_order_id'] = $order->inbound_order_id;
                $item['warehouse_id'] = $validated['warehouse_id'];
                InboundOrderItem::create($item);
            }

            DB::commit();
            return response()->json($order->load(['warehouse', 'vendor', 'status', 'items.product']), 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Failed to create order'], 500);
        }
    }

    public function show(InboundOrder $inboundOrder)
    {
        return response()->json($inboundOrder->load([
            'warehouse', 'vendor', 'status', 'user',
            'items.product', 'items.variant', 'tracking.status'
        ]));
    }

    public function update(Request $request, InboundOrder $inboundOrder)
    {
        $validated = $request->validate([
            'status_id' => 'required|exists:order_statuses,status_id',
            'delivery_agent' => 'nullable|string',
            'order_date' => 'required|date',
            'item_total' => 'required|numeric|min:0',
            'freight_cost' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'order_total' => 'required|numeric|min:0',
        ]);

        $inboundOrder->update($validated);

        return response()->json($inboundOrder->load(['warehouse', 'vendor', 'status', 'items.product']));
    }

    public function destroy(InboundOrder $inboundOrder)
    {
        if ($inboundOrder->status_id == 7) { // Completed
            return response()->json(['error' => 'Cannot delete completed order'], 422);
        }

        $inboundOrder->delete();
        return response()->json(['message' => 'Inbound order deleted successfully']);
    }

    public function receive(Request $request, InboundOrder $inboundOrder)
    {
        if ($inboundOrder->status_id == 7) {
            return response()->json(['error' => 'Order already completed'], 422);
        }

        DB::beginTransaction();
        try {
            // Update order status to completed
            $inboundOrder->update(['status_id' => 7]);

            // Update inventory and create transactions
            foreach ($inboundOrder->items as $item) {
                // Update or create inventory record
                $inventory = Inventory::firstOrCreate([
                    'warehouse_id' => $item->warehouse_id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                ], ['quantity' => 0]);

                $inventory->increment('quantity', $item->quantity);

                // Create inventory transaction
                InventoryTransaction::create([
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'warehouse_id' => $item->warehouse_id,
                    'user_id' => $request->user()->id,
                    'transaction_type_id' => 1, // inbound
                    'quantity' => $item->quantity,
                    'transaction_value' => $item->total_price,
                    'transaction_date' => now()->toDateString(),
                    'remarks' => 'Inbound order received',
                    'inbound_order_id' => $inboundOrder->inbound_order_id,
                ]);

                // Update received date
                $item->update(['received_date' => now()]);
            }

            DB::commit();
            return response()->json(['message' => 'Order received successfully']);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Failed to receive order'], 500);
        }
    }
}