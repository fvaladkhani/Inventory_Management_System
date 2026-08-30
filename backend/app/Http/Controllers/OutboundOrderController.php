<?php

namespace App\Http\Controllers;

use App\Models\OutboundOrder;
use App\Models\OutboundOrderItem;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OutboundOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = OutboundOrder::with(['warehouse', 'customer', 'status', 'user']);

        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
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
            'customer_id' => 'required|exists:customers,customer_id',
            'status_id' => 'required|exists:order_statuses,status_id',
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

            $order = OutboundOrder::create($validated);

            foreach ($items as $item) {
                $item['outbound_order_id'] = $order->outbound_order_id;
                $item['warehouse_id'] = $validated['warehouse_id'];
                OutboundOrderItem::create($item);
            }

            DB::commit();
            return response()->json($order->load(['warehouse', 'customer', 'status', 'items.product']), 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Failed to create order'], 500);
        }
    }

    public function show(OutboundOrder $outboundOrder)
    {
        return response()->json($outboundOrder->load([
            'warehouse', 'customer', 'status', 'user',
            'items.product', 'items.variant', 'tracking.status'
        ]));
    }

    public function update(Request $request, OutboundOrder $outboundOrder)
    {
        $validated = $request->validate([
            'status_id' => 'required|exists:order_statuses,status_id',
            'order_date' => 'required|date',
            'item_total' => 'required|numeric|min:0',
            'freight_cost' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'order_total' => 'required|numeric|min:0',
        ]);

        $outboundOrder->update($validated);

        return response()->json($outboundOrder->load(['warehouse', 'customer', 'status', 'items.product']));
    }

    public function destroy(OutboundOrder $outboundOrder)
    {
        if ($outboundOrder->status_id == 7) { // Completed
            return response()->json(['error' => 'Cannot delete completed order'], 422);
        }

        $outboundOrder->delete();
        return response()->json(['message' => 'Outbound order deleted successfully']);
    }

    public function ship(Request $request, OutboundOrder $outboundOrder)
    {
        if ($outboundOrder->status_id == 7) {
            return response()->json(['error' => 'Order already completed'], 422);
        }

        DB::beginTransaction();
        try {
            // Check inventory availability
            foreach ($outboundOrder->items as $item) {
                $inventory = Inventory::where([
                    'warehouse_id' => $item->warehouse_id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                ])->first();

                if (!$inventory || $inventory->quantity < $item->quantity) {
                    throw new \Exception("Insufficient inventory for product: {$item->product->product_name}");
                }
            }

            // Update order status to completed
            $outboundOrder->update(['status_id' => 7]);

            // Update inventory and create transactions
            foreach ($outboundOrder->items as $item) {
                $inventory = Inventory::where([
                    'warehouse_id' => $item->warehouse_id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                ])->first();

                $inventory->decrement('quantity', $item->quantity);

                // Create inventory transaction
                InventoryTransaction::create([
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'warehouse_id' => $item->warehouse_id,
                    'user_id' => $request->user()->id,
                    'transaction_type_id' => 2, // outbound
                    'quantity' => -$item->quantity,
                    'transaction_value' => $item->total_price,
                    'transaction_date' => now()->toDateString(),
                    'remarks' => 'Outbound order shipped',
                    'outbound_order_id' => $outboundOrder->outbound_order_id,
                ]);

                // Update shipped date
                $item->update(['shipped_date' => now()]);
            }

            DB::commit();
            return response()->json(['message' => 'Order shipped successfully']);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}