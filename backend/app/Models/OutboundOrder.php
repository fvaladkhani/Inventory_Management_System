<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OutboundOrder extends Model
{
    use HasFactory;

    protected $primaryKey = 'outbound_order_id';
    
    protected $fillable = [
        'warehouse_id', 'user_id', 'customer_id', 'status_id',
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

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
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
        return $this->hasMany(OutboundOrderItem::class, 'outbound_order_id');
    }

    public function tracking()
    {
        return $this->hasMany(OrderTracking::class, 'outbound_order_id');
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class, 'outbound_order_id');
    }
}