<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $primaryKey = 'customer_id';
    
    protected $fillable = [
        'customer_name', 'contact_info', 'email', 'phone', 'address'
    ];

    public function outboundOrders()
    {
        return $this->hasMany(OutboundOrder::class, 'customer_id');
    }

    public function getTotalOrdersAttribute()
    {
        return $this->outboundOrders()->count();
    }

    public function getTotalSpentAttribute()
    {
        return $this->outboundOrders()->sum('order_total');
    }
}