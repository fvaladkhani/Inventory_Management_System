<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductBundle extends Model
{
    use HasFactory;

    protected $primaryKey = 'bundle_id';
    
    protected $fillable = [
        'bundle_name', 'sku', 'barcode', 'description', 'bundle_price'
    ];

    protected $casts = [
        'bundle_price' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(BundleItem::class, 'bundle_id');
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'bundle_items', 'bundle_id', 'product_id')
                    ->withPivot('quantity');
    }
}