<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderTracking extends Model
{
    use HasFactory;

    protected $table = 'order_tracking';
    protected $primaryKey = 'tracking_id';
    
    protected $fillable = [
        'inbound_order_id', 'outbound_order_id', 'status_id', 
        'tracking_date', 'handled_by', 'remarks'
    ];

    protected $casts = [
        'tracking_date' => 'datetime',
    ];

    public function inboundOrder()
    {
        return $this->belongsTo(InboundOrder::class, 'inbound_order_id');
    }

    public function outboundOrder()
    {
        return $this->belongsTo(OutboundOrder::class, 'outbound_order_id');
    }

    public function status()
    {
        return $this->belongsTo(OrderStatus::class, 'status_id');
    }
}