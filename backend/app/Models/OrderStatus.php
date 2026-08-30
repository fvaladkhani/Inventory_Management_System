<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderStatus extends Model
{
    use HasFactory;

    protected $table = 'order_statuses';
    protected $primaryKey = 'status_id';
    
    protected $fillable = [
        'status_name', 'description'
    ];

    public function inboundOrders()
    {
        return $this->hasMany(InboundOrder::class, 'status_id');
    }

    public function outboundOrders()
    {
        return $this->hasMany(OutboundOrder::class, 'status_id');
    }

    public function tracking()
    {
        return $this->hasMany(OrderTracking::class, 'status_id');
    }
}