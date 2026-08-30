<?php

namespace App\Http\Controllers;

use App\Models\ProductBundle;
use App\Models\BundleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductBundleController extends Controller
{
    public function index(Request $request)
    {
        $bundles = ProductBundle::with(['items.product'])
            ->paginate($request->get('per_page', 15));
        return response()->json($bundles);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bundle_name' => 'required|string|max:255',
            'sku' => 'nullable|string|unique:product_bundles,sku',
            'barcode' => 'nullable|string',
            'description' => 'nullable|string',
            'bundle_price' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        try {
            $bundle = ProductBundle::create([
                'bundle_name' => $validated['bundle_name'],
                'sku' => $validated['sku'],
                'barcode' => $validated['barcode'] ?? null,
                'description' => $validated['description'] ?? null,
                'bundle_price' => $validated['bundle_price'],
            ]);

            foreach ($validated['items'] as $item) {
                BundleItem::create([
                    'bundle_id' => $bundle->bundle_id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);
            }

            DB::commit();
            return response()->json($bundle->load('items.product'), 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Failed to create bundle'], 500);
        }
    }

    public function show(ProductBundle $bundle)
    {
        return response()->json($bundle->load('items.product'));
    }

    public function update(Request $request, ProductBundle $bundle)
    {
        $validated = $request->validate([
            'bundle_name' => 'required|string|max:255',
            'sku' => 'nullable|string|unique:product_bundles,sku,' . $bundle->bundle_id . ',bundle_id',
            'barcode' => 'nullable|string',
            'description' => 'nullable|string',
            'bundle_price' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        try {
            $bundle->update([
                'bundle_name' => $validated['bundle_name'],
                'sku' => $validated['sku'],
                'barcode' => $validated['barcode'] ?? null,
                'description' => $validated['description'] ?? null,
                'bundle_price' => $validated['bundle_price'],
            ]);

            // حذف آیتم‌های قبلی و ایجاد مجدد
            $bundle->items()->delete();
            foreach ($validated['items'] as $item) {
                BundleItem::create([
                    'bundle_id' => $bundle->bundle_id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);
            }

            DB::commit();
            return response()->json($bundle->load('items.product'));
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Failed to update bundle'], 500);
        }
    }

    public function destroy(ProductBundle $bundle)
    {
        $bundle->delete();
        return response()->json(['message' => 'Bundle deleted successfully']);
    }
}