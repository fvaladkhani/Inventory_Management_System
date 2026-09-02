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
use App\Http\Controllers\OrderStatusController;
use App\Http\Controllers\TransactionTypeController;

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
    Route::apiResource('inbound-orders', InboundOrderController::class)
        ->parameters(['inbound-orders' => 'inboundOrder']);
    Route::post('/inbound-orders/{inboundOrder}/receive', [InboundOrderController::class, 'receive']);

    // Outbound Orders
    Route::apiResource('outbound-orders', OutboundOrderController::class)
        ->parameters(['outbound-orders' => 'outboundOrder']);
    Route::post('/outbound-orders/{outboundOrder}/ship', [OutboundOrderController::class, 'ship']);

    // Product Categories
    // Lookup resources also expose the full CRUD API used by the frontend.
    Route::apiResource('order-statuses', OrderStatusController::class)
        ->parameters(['order-statuses' => 'status']);
    Route::apiResource('transaction-types', TransactionTypeController::class)
        ->parameters(['transaction-types' => 'type']);


    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::post('/settings', [SettingController::class, 'store']);
    Route::put('/settings/{key}', [SettingController::class, 'update']);
    Route::delete('/settings/{key}', [SettingController::class, 'destroy']);
    Route::post('/settings/initialize', [SettingController::class, 'initialize']);

    // Product Categories (CRUD کامل)
    Route::apiResource('product-categories', ProductCategoryController::class)
        ->parameters(['product-categories' => 'category']);

    // Product Variants (CRUD کامل)
    Route::apiResource('product-variants', ProductVariantController::class)
        ->parameters(['product-variants' => 'variant']);

    // Users (CRUD کامل)
    Route::apiResource('users', UserController::class);

    // Product Bundles (CRUD کامل)
    Route::apiResource('product-bundles', ProductBundleController::class)
        ->parameters(['product-bundles' => 'bundle']);

    // Product Offers (CRUD کامل)
    Route::apiResource('product-offers', ProductOfferController::class)
        ->parameters(['product-offers' => 'offer']);
});