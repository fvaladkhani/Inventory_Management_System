<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\InboundOrderController;
use App\Http\Controllers\OutboundOrderController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\ProductVariantController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductBundleController;
use App\Http\Controllers\ProductOfferController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/inventory-overview', [DashboardController::class, 'inventoryOverview']);
    Route::get('/dashboard/sales-trends', [DashboardController::class, 'salesTrends']);
    Route::get('/dashboard/top-products', [DashboardController::class, 'topProducts']);
    Route::get('/dashboard/warehouse-utilization', [DashboardController::class, 'warehouseUtilization']);
    Route::get('/dashboard/recent-activity', [DashboardController::class, 'recentActivity']);

    // Products
    Route::apiResource('products', ProductController::class);
    Route::get('/products/{product}/image', [ProductController::class, 'getImage']);
    Route::get('/products-low-stock', [ProductController::class, 'lowStock']);

    // Inventory
    Route::apiResource('inventory', InventoryController::class);
    Route::get('/inventory-summary', [InventoryController::class, 'summary']);
    Route::get('/inventory-movements', [InventoryController::class, 'movements']);

    // Customers
    Route::apiResource('customers', CustomerController::class);

    // Vendors
    Route::apiResource('vendors', VendorController::class);

    // Warehouses
    Route::apiResource('warehouses', WarehouseController::class);

    // Inbound Orders
    Route::apiResource('inbound-orders', InboundOrderController::class);
    Route::post('/inbound-orders/{inboundOrder}/receive', [InboundOrderController::class, 'receive']);

    // Outbound Orders
    Route::apiResource('outbound-orders', OutboundOrderController::class);
    Route::post('/outbound-orders/{outboundOrder}/ship', [OutboundOrderController::class, 'ship']);

    // Product Categories
    Route::get('/product-categories', function () {
        return response()->json(\App\Models\ProductCategory::all());
    });

    // Order Statuses
    Route::get('/order-statuses', function () {
        return response()->json(\App\Models\OrderStatus::all());
    });

    // Transaction Types
    Route::get('/transaction-types', function () {
        return response()->json(\App\Models\TransactionType::all());
    });


    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::post('/settings', [SettingController::class, 'store']);
    Route::put('/settings/{key}', [SettingController::class, 'update']);
    Route::delete('/settings/{key}', [SettingController::class, 'destroy']);
    Route::post('/settings/initialize', [SettingController::class, 'initialize']);

    // Product Categories (CRUD کامل)
    Route::apiResource('product-categories', ProductCategoryController::class);

    // Product Variants (CRUD کامل)
    Route::apiResource('product-variants', ProductVariantController::class);

    // Users (CRUD کامل)
    Route::apiResource('users', UserController::class);

    // Product Bundles (CRUD کامل)
    Route::apiResource('product-bundles', ProductBundleController::class);

    // Product Offers (CRUD کامل)
    Route::apiResource('product-offers', ProductOfferController::class);
});