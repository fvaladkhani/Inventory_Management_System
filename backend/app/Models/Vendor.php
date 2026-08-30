<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasFactory;

    protected $primaryKey = 'vendor_id';
    
    protected $fillable = [
        'vendor_name', 'contact_info', 'address'
    ];

    public function contacts()
    {
        return $this->hasMany(Contact::class, 'vendor_id');
    }

    public function inboundOrders()
    {
        return $this->hasMany(InboundOrder::class, 'vendor_id');
    }

    public function getTotalOrdersAttribute()
    {
        return $this->inboundOrders()->count();
    }

    public function getTotalPurchasedAttribute()
    {
        return $this->inboundOrders()->sum('order_total');
    }
}