<?php

namespace App\Http\Controllers;

use App\Models\ProductOffer;
use Illuminate\Http\Request;

class ProductOfferController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductOffer::with('product');

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('active') && $request->active) {
            $query->where('start_date', '<=', now())
                  ->where('end_date', '>=', now());
        }

        $offers = $query->paginate($request->get('per_page', 15));
        return response()->json($offers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,product_id',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $offer = ProductOffer::create($validated);
        return response()->json($offer->load('product'), 201);
    }

    public function show(ProductOffer $offer)
    {
        return response()->json($offer->load('product'));
    }

    public function update(Request $request, ProductOffer $offer)
    {
        $validated = $request->validate([
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $offer->update($validated);
        return response()->json($offer->load('product'));
    }

    public function destroy(ProductOffer $offer)
    {
        $offer->delete();
        return response()->json(['message' => 'Offer deleted successfully']);
    }
}