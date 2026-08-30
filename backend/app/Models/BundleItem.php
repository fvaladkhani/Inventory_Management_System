<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BundleItem extends Model
{
    use HasFactory;

    protected $primaryKey = 'bundle_item_id';
    
    protected $fillable = [
        'bundle_id', 'product_id', 'quantity'
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function bundle()
    {
        return $this->belongsTo(ProductBundle::class, 'bundle_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}