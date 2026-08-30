<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Inventory;
use App\Models\InboundOrder;
use App\Models\OutboundOrder;
use App\Models\Customer;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_products' => Product::count(),
            'total_inventory_value' => DB::table('inventory')
                ->join('products', 'inventory.product_id', '=', 'products.product_id')
                ->sum(DB::raw('inventory.quantity * products.base_price')),
            'low_stock_items' => Inventory::whereHas('product', function ($query) {
                $query->whereRaw('inventory.quantity <= products.minimum_quantity');
            })->count(),
            'total_customers' => Customer::count(),
            'total_vendors' => Vendor::count(),
            'pending_inbound_orders' => InboundOrder::where('status_id', '!=', 7)->count(),
            'pending_outbound_orders' => OutboundOrder::where('status_id', '!=', 7)->count(),
        ];

        return response()->json($stats);
    }

    public function inventoryOverview()
    {
        $overview = DB::select("
            SELECT
                pc.category_name,
                COUNT(DISTINCT p.product_id) as product_count,
                SUM(i.quantity) as total_quantity,
                SUM(i.quantity * p.base_price) as total_value,
                SUM(CASE WHEN i.quantity <= p.minimum_quantity THEN 1 ELSE 0 END) as low_stock_count
            FROM product_categories pc
            LEFT JOIN products p ON pc.category_id = p.category_id
            LEFT JOIN inventory i ON p.product_id = i.product_id
            GROUP BY pc.category_id, pc.category_name
            ORDER BY total_value DESC
        ");

        return response()->json($overview);
    }

    public function salesTrends(Request $request)
    {
        $months = (int) $request->get('months', 12);

        // استفاده از Query Builder (روش پیشنهادی)
        $trends = DB::table('outbound_orders')
            ->select(
                DB::raw("strftime('%Y-%m', order_date) as month"),
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(order_total) as total_sales'),
                DB::raw('AVG(order_total) as avg_order_value')
            )
            ->where('order_date', '>=', now()->subMonths($months)->toDateString())
            ->where('status_id', 7)
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json($trends);
    }

    public function topProducts(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $type = $request->get('type', 'quantity');

        if ($type === 'revenue') {
            $products = DB::table('products as p')
                ->join('outbound_order_items as ooi', 'p.product_id', '=', 'ooi.product_id')
                ->join('outbound_orders as oo', 'ooi.outbound_order_id', '=', 'oo.outbound_order_id')
                ->select(
                    'p.product_name',
                    'p.sku',
                    DB::raw('SUM(ooi.quantity * ooi.unit_price) as total_revenue'),
                    DB::raw('SUM(ooi.quantity) as total_quantity')
                )
                ->where('oo.status_id', 7)
                ->groupBy('p.product_id', 'p.product_name', 'p.sku')
                ->orderBy('total_revenue', 'DESC')
                ->limit($limit)
                ->get();
        } else {
            $products = DB::table('products as p')
                ->join('outbound_order_items as ooi', 'p.product_id', '=', 'ooi.product_id')
                ->join('outbound_orders as oo', 'ooi.outbound_order_id', '=', 'oo.outbound_order_id')
                ->select(
                    'p.product_name',
                    'p.sku',
                    DB::raw('SUM(ooi.quantity) as total_quantity'),
                    DB::raw('SUM(ooi.quantity * ooi.unit_price) as total_revenue')
                )
                ->where('oo.status_id', 7)
                ->groupBy('p.product_id', 'p.product_name', 'p.sku')
                ->orderBy('total_quantity', 'DESC')
                ->limit($limit)
                ->get();
        }

        return response()->json($products);
    }

    public function warehouseUtilization()
    {
        $utilization = DB::table('warehouses as w')
            ->leftJoin('inventory as i', 'w.warehouse_id', '=', 'i.warehouse_id')
            ->leftJoin('products as p', 'i.product_id', '=', 'p.product_id')
            ->select(
                'w.warehouse_name',
                'w.location',
                DB::raw('COUNT(DISTINCT i.product_id) as unique_products'),
                DB::raw('SUM(i.quantity) as total_items'),
                DB::raw('SUM(i.quantity * p.base_price) as total_value'),
                DB::raw('SUM(CASE WHEN i.quantity <= p.minimum_quantity THEN 1 ELSE 0 END) as low_stock_items')
            )
            ->groupBy('w.warehouse_id', 'w.warehouse_name', 'w.location')
            ->orderBy('total_value', 'DESC')
            ->get();

        return response()->json($utilization);
    }

    public function recentActivity()
    {
        $activities = DB::select("
            SELECT
                'inbound' as type,
                io.inbound_order_id as order_id,
                io.order_date,
                io.order_total,
                v.vendor_name as partner_name,
                os.status_name,
                w.warehouse_name
            FROM inbound_orders io
            JOIN vendors v ON io.vendor_id = v.vendor_id
            JOIN order_statuses os ON io.status_id = os.status_id
            JOIN warehouses w ON io.warehouse_id = w.warehouse_id
            WHERE io.created_at >= datetime('now', '-7 days')

            UNION ALL

            SELECT
                'outbound' as type,
                oo.outbound_order_id as order_id,
                oo.order_date,
                oo.order_total,
                c.customer_name as partner_name,
                os.status_name,
                w.warehouse_name
            FROM outbound_orders oo
            JOIN customers c ON oo.customer_id = c.customer_id
            JOIN order_statuses os ON oo.status_id = os.status_id
            JOIN warehouses w ON oo.warehouse_id = w.warehouse_id
            WHERE oo.created_at >= datetime('now', '-7 days')

            ORDER BY order_date DESC
            LIMIT 20
        ");

        return response()->json($activities);
    }
}