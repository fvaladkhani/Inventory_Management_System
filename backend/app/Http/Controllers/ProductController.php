<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'variants', 'offers', 'inventory.warehouse'])
            ->withSum('inventory as total_inventory', 'quantity');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('product_name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('low_stock') && $request->low_stock) {
            $query->whereHas('inventory', function ($q) {
                $q->whereRaw('quantity <= minimum_quantity');
            });
        }

        $products = $query->paginate($request->get('per_page', 15));

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_name' => 'required|string|max:255',
            'category_id' => 'required|exists:product_categories,category_id',
            'sku' => 'required|string|unique:products,sku',
            'barcode' => 'nullable|string',
            'description' => 'nullable|string',
            'cost_price' => 'required|numeric|min:0',
            'price_gain' => 'required|numeric|min:0',
            'base_price' => 'required|numeric|min:0',
            'dimension' => 'nullable|string',
            'weight' => 'nullable|numeric|min:0',
            'brand' => 'nullable|string',
            'unit_type' => 'nullable|string',
            'minimum_quantity' => 'required|integer|min:0',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $path = $image->store('products', 'public');
            $validated['image_path'] = $path;
        }

        $product = Product::create($validated);

        return response()->json($product->load(['category', 'variants', 'offers']), 201);
    }

    public function show(Product $product)
    {
        return response()->json($product->load([
            'category', 'variants', 'offers', 'inventory.warehouse',
            'inboundOrderItems.inboundOrder', 'outboundOrderItems.outboundOrder'
        ]));
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'product_name' => 'required|string|max:255',
            'category_id' => 'required|exists:product_categories,category_id',
            'sku' => 'required|string|unique:products,sku,' . $product->product_id . ',product_id',
            'barcode' => 'nullable|string',
            'description' => 'nullable|string',
            'cost_price' => 'required|numeric|min:0',
            'price_gain' => 'required|numeric|min:0',
            'base_price' => 'required|numeric|min:0',
            'dimension' => 'nullable|string',
            'weight' => 'nullable|numeric|min:0',
            'brand' => 'nullable|string',
            'unit_type' => 'nullable|string',
            'minimum_quantity' => 'required|integer|min:0',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $path = $image->store('products', 'public');
            $validated['image_path'] = $path;
        }

        $product->update($validated);

        return response()->json($product->load(['category', 'variants', 'offers']));
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['message' => 'Product deleted successfully']);
    }

    public function lowStock()
    {
        $products = Product::whereHas('inventory', function ($query) {
            $query->whereRaw('quantity <= minimum_quantity');
        })->with(['category', 'inventory.warehouse'])->get();

        return response()->json($products);
    }

    public function getImage(Product $product)
    {
        if (!$product->image_path || !Storage::disk('public')->exists($product->image_path)) {
            return response()->json(['error' => 'No image found'], 404);
        }

        return response()->file(storage_path('app/public/' . $product->image_path));
    }
}