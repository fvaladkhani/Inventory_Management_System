<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransactionType extends Model
{
    use HasFactory;

    protected $primaryKey = 'type_id';
    
    protected $fillable = [
        'type_name', 'description'
    ];

    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class, 'transaction_type_id');
    }
}