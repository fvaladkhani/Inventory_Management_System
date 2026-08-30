<?php

namespace App\Http\Controllers;

use App\Models\ProductCategory;
use Illuminate\Http\Request;

class ProductCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductCategory::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('category_name', 'like', "%{$search}%");
        }

        $categories = $query->paginate($request->get('per_page', 15));
        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category = ProductCategory::create($validated);
        return response()->json($category, 201);
    }

    public function show(ProductCategory $category)
    {
        return response()->json($category);
    }

    public function update(Request $request, ProductCategory $category)
    {
        $validated = $request->validate([
            'category_name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category->update($validated);
        return response()->json($category);
    }

    public function destroy(ProductCategory $category)
    {
        if ($category->products()->exists()) {
            return response()->json(['error' => 'Cannot delete category with products'], 422);
        }

        $category->delete();
        return response()->json(['message' => 'Category deleted successfully']);
    }
}