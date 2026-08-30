<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create("users", function (Blueprint $table) {
            $table->id();
            $table->string("username", 50)->unique();
            $table->string("password");
            $table->string("name", 100);
            $table->timestamps();
        });

        Schema::create("warehouses", function (Blueprint $table) {
            $table->id("warehouse_id");
            $table->string("warehouse_name");
            $table->string("location")->nullable();
            $table->timestamps();
        });

        Schema::create("product_categories", function (Blueprint $table) {
            $table->id("category_id");
            $table->string("category_name");
            $table->text("description")->nullable();
            $table->timestamps();
        });

        Schema::create("products", function (Blueprint $table) {
            $table->id("product_id");
            $table->foreignId("category_id")->constrained("product_categories", "category_id");
            $table->string("product_name");
            $table->string("sku")->unique()->nullable();
            $table->string("barcode")->nullable();
            $table->text("description")->nullable();
            $table->decimal("cost_price", 10, 2)->nullable();
            $table->decimal("price_gain", 10, 2)->nullable();
            $table->decimal("base_price", 10, 2);
            $table->string("dimension")->nullable();
            $table->decimal("weight", 10, 2)->nullable();
            $table->string("brand")->nullable();
            $table->string("unit_type")->nullable();
            $table->integer("minimum_quantity")->default(0);
            $table->string("image_path")->nullable();
            $table->timestamps();
        });

        Schema::create("product_variants", function (Blueprint $table) {
            $table->id("variant_id");
            $table->foreignId("product_id")->constrained("products", "product_id")->onDelete("cascade");
            $table->string("variant_name");
            $table->string("variant_sku")->unique()->nullable();
            $table->decimal("additional_price", 10, 2)->default(0);
            $table->timestamps();
        });

        Schema::create("inventory", function (Blueprint $table) {
            $table->id("inventory_id");
            $table->foreignId("warehouse_id")->constrained("warehouses", "warehouse_id");
            $table->foreignId("product_id")->constrained("products", "product_id");
            $table->foreignId("variant_id")->nullable()->constrained("product_variants", "variant_id");
            $table->integer("quantity")->default(0);
            $table->timestamps();
        });

        Schema::create("vendors", function (Blueprint $table) {
            $table->id("vendor_id");
            $table->string("vendor_name");
            $table->string("contact_info")->nullable();
            $table->text("address")->nullable();
            $table->timestamps();
        });

        Schema::create("customers", function (Blueprint $table) {
            $table->id("customer_id");
            $table->string("customer_name");
            $table->string("contact_info")->nullable();
            $table->string("email")->nullable();
            $table->string("phone")->nullable();
            $table->text("address")->nullable();
            $table->timestamps();
        });

        Schema::create("order_statuses", function (Blueprint $table) {
            $table->id("status_id");
            $table->string("status_name");
            $table->text("description")->nullable();
            $table->timestamps();
        });

        Schema::create("transaction_types", function (Blueprint $table) {
            $table->id("type_id");
            $table->string("type_name");
            $table->text("description")->nullable();
            $table->timestamps();
        });

        Schema::create("inbound_orders", function (Blueprint $table) {
            $table->id("inbound_order_id");
            $table->foreignId("warehouse_id")->constrained("warehouses", "warehouse_id");
            $table->foreignId("user_id")->constrained("users");
            $table->foreignId("vendor_id")->constrained("vendors", "vendor_id");
            $table->foreignId("status_id")->constrained("order_statuses", "status_id");
            $table->string("delivery_agent")->nullable();
            $table->date("order_date")->nullable();
            $table->decimal("item_total", 10, 2)->nullable();
            $table->decimal("freight_cost", 10, 2)->nullable();
            $table->decimal("discount", 10, 2)->nullable();
            $table->decimal("order_total", 10, 2)->nullable();
            $table->timestamps();
        });

        Schema::create("inbound_order_items", function (Blueprint $table) {
            $table->id("inbound_order_item_id");
            $table->foreignId("inbound_order_id")->constrained("inbound_orders", "inbound_order_id")->onDelete("cascade");
            $table->foreignId("product_id")->constrained("products", "product_id");
            $table->foreignId("variant_id")->nullable()->constrained("product_variants", "variant_id");
            $table->foreignId("warehouse_id")->constrained("warehouses", "warehouse_id");
            $table->integer("quantity")->nullable();
            $table->decimal("unit_price", 10, 2)->nullable();
            $table->decimal("total_price", 10, 2)->nullable();
            $table->timestamp("received_date")->nullable();
            $table->timestamps();
        });

        Schema::create("outbound_orders", function (Blueprint $table) {
            $table->id("outbound_order_id");
            $table->foreignId("warehouse_id")->constrained("warehouses", "warehouse_id");
            $table->foreignId("user_id")->constrained("users");
            $table->foreignId("customer_id")->constrained("customers", "customer_id");
            $table->foreignId("status_id")->constrained("order_statuses", "status_id");
            $table->date("order_date")->nullable();
            $table->decimal("item_total", 10, 2)->nullable();
            $table->decimal("freight_cost", 10, 2)->nullable();
            $table->decimal("discount", 10, 2)->nullable();
            $table->decimal("order_total", 10, 2)->nullable();
            $table->timestamps();
        });

        Schema::create("outbound_order_items", function (Blueprint $table) {
            $table->id("outbound_order_item_id");
            $table->foreignId("outbound_order_id")->constrained("outbound_orders", "outbound_order_id")->onDelete("cascade");
            $table->foreignId("product_id")->constrained("products", "product_id");
            $table->foreignId("variant_id")->nullable()->constrained("product_variants", "variant_id");
            $table->foreignId("warehouse_id")->constrained("warehouses", "warehouse_id");
            $table->integer("quantity")->nullable();
            $table->decimal("unit_price", 10, 2)->nullable();
            $table->decimal("total_price", 10, 2)->nullable();
            $table->timestamp("shipped_date")->nullable();
            $table->timestamps();
        });

        Schema::create("inventory_transactions", function (Blueprint $table) {
            $table->id("transaction_id");
            $table->foreignId("product_id")->constrained("products", "product_id");
            $table->foreignId("variant_id")->nullable()->constrained("product_variants", "variant_id");
            $table->foreignId("warehouse_id")->constrained("warehouses", "warehouse_id");
            $table->foreignId("user_id")->constrained("users");
            $table->foreignId("transaction_type_id")->constrained("transaction_types", "type_id");
            $table->integer("quantity")->nullable();
            $table->decimal("transaction_value", 10, 2)->nullable();
            $table->date("transaction_date")->nullable();
            $table->text("remarks")->nullable();
            $table->foreignId("inbound_order_id")->nullable()->constrained("inbound_orders", "inbound_order_id")->onDelete("set null");
            $table->foreignId("outbound_order_id")->nullable()->constrained("outbound_orders", "outbound_order_id")->onDelete("set null");
            $table->timestamps();
        });

        Schema::create("contacts", function (Blueprint $table) {
            $table->id("contact_id");
            $table->foreignId("vendor_id")->nullable()->constrained("vendors", "vendor_id")->onDelete("cascade");
            $table->string("contact_name");
            $table->string("contact_position")->nullable();
            $table->string("contact_email")->nullable();
            $table->string("contact_phone")->nullable();
            $table->timestamps();
        });

        Schema::create("order_tracking", function (Blueprint $table) {
            $table->id("tracking_id");
            $table->foreignId("inbound_order_id")->nullable()->constrained("inbound_orders", "inbound_order_id")->onDelete("cascade");
            $table->foreignId("outbound_order_id")->nullable()->constrained("outbound_orders", "outbound_order_id")->onDelete("cascade");
            $table->foreignId("status_id")->constrained("order_statuses", "status_id");
            $table->timestamp("tracking_date")->useCurrent();
            $table->string("handled_by")->nullable();
            $table->text("remarks")->nullable();
            $table->timestamps();
        });

        Schema::create("product_bundles", function (Blueprint $table) {
            $table->id("bundle_id");
            $table->string("bundle_name");
            $table->string("sku")->nullable();
            $table->string("barcode")->nullable();
            $table->text("description")->nullable();
            $table->decimal("bundle_price", 10, 2);
            $table->timestamps();
        });

        Schema::create("bundle_items", function (Blueprint $table) {
            $table->id("bundle_item_id");
            $table->foreignId("bundle_id")->constrained("product_bundles", "bundle_id")->onDelete("cascade");
            $table->foreignId("product_id")->constrained("products", "product_id");
            $table->integer("quantity");
            $table->timestamps();
        });

        Schema::create("product_offers", function (Blueprint $table) {
            $table->id("offer_id");
            $table->foreignId("product_id")->constrained("products", "product_id")->onDelete("cascade");
            $table->decimal("discount_percentage", 5, 2);
            $table->timestamp("start_date");
            $table->timestamp("end_date");
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists("product_offers");
        Schema::dropIfExists("bundle_items");
        Schema::dropIfExists("product_bundles");
        Schema::dropIfExists("order_tracking");
        Schema::dropIfExists("contacts");
        Schema::dropIfExists("inventory_transactions");
        Schema::dropIfExists("outbound_order_items");
        Schema::dropIfExists("outbound_orders");
        Schema::dropIfExists("inbound_order_items");
        Schema::dropIfExists("inbound_orders");
        Schema::dropIfExists("transaction_types");
        Schema::dropIfExists("order_statuses");
        Schema::dropIfExists("customers");
        Schema::dropIfExists("vendors");
        Schema::dropIfExists("inventory");
        Schema::dropIfExists("product_variants");
        Schema::dropIfExists("products");
        Schema::dropIfExists("product_categories");
        Schema::dropIfExists("warehouses");
        Schema::dropIfExists("users");
    }
};
