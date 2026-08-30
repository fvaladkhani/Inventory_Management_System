<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductOffer extends Model
{
    use HasFactory;

    protected $primaryKey = 'offer_id';
    
    protected $fillable = [
        'product_id', 'discount_percentage', 'start_date', 'end_date'
    ];

    protected $casts = [
        'discount_percentage' => 'decimal:2',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function isActive()
    {
        return $this->start_date <= now() && now() <= $this->end_date;
    }
}