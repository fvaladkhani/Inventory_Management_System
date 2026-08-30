<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use HasFactory;

    protected $primaryKey = 'warehouse_id';
    
    protected $fillable = [
        'warehouse_name', 'location'
    ];

    public function inventory()
    {
        return $this->hasMany(Inventory::class, 'warehouse_id');
    }

    public function inboundOrders()
    {
        return $this->hasMany(InboundOrder::class, 'warehouse_id');
    }

    public function outboundOrders()
    {
        return $this->hasMany(OutboundOrder::class, 'warehouse_id');
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class, 'warehouse_id');
    }
}