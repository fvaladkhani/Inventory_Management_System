<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Warehouse;
use App\Models\ProductCategory;
use App\Models\OrderStatus;
use App\Models\TransactionType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // Default admin user
        \Illuminate\Support\Facades\DB::table('users')->insert([
            'username' => 'admin',
            'password' => Hash::make('admin'),
            'name' => 'Administrator',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Order Statuses
        \Illuminate\Support\Facades\DB::table('order_statuses')->insert([
            ['status_id' => 1, 'status_name' => 'Draft', 'description' => 'Order has been created'],
            ['status_id' => 2, 'status_name' => 'Pending', 'description' => 'Waiting approval and payment'],
            ['status_id' => 7, 'status_name' => 'Completed', 'description' => 'Order has been completed'],
        ]);

        // Transaction Types
        \Illuminate\Support\Facades\DB::table('transaction_types')->insert([
            ['type_id' => 1, 'type_name' => 'inbound', 'description' => 'Stock inbound transaction'],
            ['type_id' => 2, 'type_name' => 'outbound', 'description' => 'Stock outbound transaction'],
            ['type_id' => 3, 'type_name' => 'adjustment', 'description' => 'Inventory adjustment transaction'],
            ['type_id' => 4, 'type_name' => 'transfer', 'description' => 'Warehouse transfer transaction'],
        ]);

        // Warehouses
        \Illuminate\Support\Facades\DB::table('warehouses')->insert([
            ['warehouse_id' => 1, 'warehouse_name' => 'Main Warehouse', 'location' => 'Downtown'],
            ['warehouse_id' => 2, 'warehouse_name' => 'West Side Depot', 'location' => 'West Industrial'],
        ]);

        // Categories
        \Illuminate\Support\Facades\DB::table('product_categories')->insert([
            ['category_id' => 1, 'category_name' => 'Electronics'],
            ['category_id' => 2, 'category_name' => 'Furniture'],
        ]);
    }
}

