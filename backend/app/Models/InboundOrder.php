<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InboundOrder extends Model
{
    use HasFactory;

    protected $primaryKey = 'inbound_order_id';
    
    protected $fillable = [
        'warehouse_id', 'user_id', 'vendor_id', 'status_id', 'delivery_agent',
        'order_date', 'item_total', 'freight_cost', 'discount', 'order_total'
    ];

    protected $casts = [
        'order_date' => 'date',
        'item_total' => 'decimal:2',
        'freight_cost' => 'decimal:2',
        'discount' => 'decimal:2',
        'order_total' => 'decimal:2',
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    public function status()
    {
        return $this->belongsTo(OrderStatus::class, 'status_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items()
    {
        return $this->hasMany(InboundOrderItem::class, 'inbound_order_id');
    }

    public function tracking()
    {
        return $this->hasMany(OrderTracking::class, 'inbound_order_id');
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class, 'inbound_order_id');
    }
}