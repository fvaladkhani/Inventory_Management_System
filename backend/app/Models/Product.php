<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $primaryKey = 'product_id';
    
    protected $fillable = [
        'product_name', 'category_id', 'sku', 'barcode', 'description',
        'cost_price', 'price_gain', 'base_price', 'dimension', 'weight',
        'brand', 'unit_type', 'minimum_quantity', 'image_path'
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'price_gain' => 'decimal:2',
        'base_price' => 'decimal:2',
        'weight' => 'decimal:2',
        'minimum_quantity' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class, 'product_id');
    }

    public function offers()
    {
        return $this->hasMany(ProductOffer::class, 'product_id');
    }

    public function inventory()
    {
        return $this->hasMany(Inventory::class, 'product_id');
    }

    public function bundleItems()
    {
        return $this->hasMany(BundleItem::class, 'product_id');
    }

    public function inboundOrderItems()
    {
        return $this->hasMany(InboundOrderItem::class, 'product_id');
    }

    public function outboundOrderItems()
    {
        return $this->hasMany(OutboundOrderItem::class, 'product_id');
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class, 'product_id');
    }

    public function getTotalInventoryAttribute($value = null)
    {
        if ($value !== null) {
            return (int) $value;
        }

        if ($this->relationLoaded('inventory')) {
            return $this->inventory->sum('quantity');
        }

        return $this->inventory()->sum('quantity');
    }

    public function getCurrentPriceAttribute()
    {
        $activeOffer = $this->offers()
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->first();

        if ($activeOffer) {
            return $this->base_price * (1 - $activeOffer->discount_percentage / 100);
        }

        return $this->base_price;
    }
}