<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OutboundOrderItem extends Model
{
    use HasFactory;

    protected $primaryKey = 'outbound_order_item_id';
    
    protected $fillable = [
        'outbound_order_id', 'product_id', 'variant_id', 'warehouse_id',
        'quantity', 'unit_price', 'total_price', 'shipped_date'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'shipped_date' => 'datetime',
    ];

    public function outboundOrder()
    {
        return $this->belongsTo(OutboundOrder::class, 'outbound_order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }
}