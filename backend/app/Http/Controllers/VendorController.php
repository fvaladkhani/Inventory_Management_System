<?php

namespace App\Http\Controllers;

use App\Models\Vendor;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    public function index(Request $request)
    {
        $query = Vendor::with('contacts');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('vendor_name', 'like', "%{$search}%")
                  ->orWhere('contact_info', 'like', "%{$search}%");
            });
        }

        $vendors = $query->withCount('inboundOrders')
                        ->paginate($request->get('per_page', 15));

        return response()->json($vendors);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vendor_name' => 'required|string|max:255',
            'contact_info' => 'nullable|string|max:255',
            'address' => 'nullable|string',
        ]);

        $vendor = Vendor::create($validated);

        return response()->json($vendor->load('contacts'), 201);
    }

    public function show(Vendor $vendor)
    {
        return response()->json($vendor->load([
            'contacts', 
            'inboundOrders.status', 
            'inboundOrders.warehouse'
        ]));
    }

    public function update(Request $request, Vendor $vendor)
    {
        $validated = $request->validate([
            'vendor_name' => 'required|string|max:255',
            'contact_info' => 'nullable|string|max:255',
            'address' => 'nullable|string',
        ]);

        $vendor->update($validated);

        return response()->json($vendor->load('contacts'));
    }

    public function destroy(Vendor $vendor)
    {
        if ($vendor->inboundOrders()->exists()) {
            return response()->json(['error' => 'Cannot delete vendor with existing orders'], 422);
        }

        $vendor->delete();
        return response()->json(['message' => 'Vendor deleted successfully']);
    }
}