<?php

namespace App\Http\Controllers;

use App\Models\ProductVariant;
use Illuminate\Http\Request;

class ProductVariantController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductVariant::with('product');

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        $variants = $query->paginate($request->get('per_page', 15));
        return response()->json($variants);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,product_id',
            'variant_name' => 'required|string|max:255',
            'variant_sku' => 'nullable|string|unique:product_variants,variant_sku',
            'additional_price' => 'required|numeric|min:0',
        ]);

        $variant = ProductVariant::create($validated);
        return response()->json($variant->load('product'), 201);
    }

    public function show(ProductVariant $variant)
    {
        return response()->json($variant->load('product'));
    }

    public function update(Request $request, ProductVariant $variant)
    {
        $validated = $request->validate([
            'variant_name' => 'required|string|max:255',
            'variant_sku' => 'nullable|string|unique:product_variants,variant_sku,' . $variant->variant_id . ',variant_id',
            'additional_price' => 'required|numeric|min:0',
        ]);

        $variant->update($validated);
        return response()->json($variant->load('product'));
    }

    public function destroy(ProductVariant $variant)
    {
        if ($variant->inventory()->exists()) {
            return response()->json(['error' => 'Cannot delete variant with inventory'], 422);
        }

        $variant->delete();
        return response()->json(['message' => 'Variant deleted successfully']);
    }
}