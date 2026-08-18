<?php
// app/Models/Inventory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    // ✅ FIXED: Use correct table name
    protected $table = 'inventory'; // ← SINGULAR, NOT plural!

    protected $fillable = [
        'clinic_id',
        'user_id',
        'name',
        'category',
        'quantity',
        'buy_price',
        'sell_price',
        'supplier',
        'low_stock_threshold',
        'description',
        'location',
        'expiry_date',
        'batch_number',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'buy_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
        'low_stock_threshold' => 'integer',
        'expiry_date' => 'date',
    ];

    // Relationships
    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'inventory_id');
    }

    // Helper methods
    public function getTotalValueAttribute(): float
    {
        return $this->quantity * $this->buy_price;
    }

    public function getPotentialRevenueAttribute(): float
    {
        return $this->quantity * $this->sell_price;
    }

    public function getPotentialProfitAttribute(): float
    {
        return $this->getPotentialRevenueAttribute() - $this->getTotalValueAttribute();
    }

    public function isLowStock(): bool
    {
        return $this->low_stock_threshold && $this->quantity <= $this->low_stock_threshold;
    }

    public function isOutOfStock(): bool
    {
        return $this->quantity <= 0;
    }

    public function getStatusAttribute(): string
    {
        if ($this->isOutOfStock()) {
            return 'out_of_stock';
        }
        if ($this->isLowStock()) {
            return 'low_stock';
        }
        return 'in_stock';
    }

    public function getCategoryLabelAttribute(): string
    {
        $labels = [
            'consumable' => '🔄 Consumables',
            'medication' => '💊 Medications',
            'instrument' => '🔧 Instruments',
            'equipment' => '⚙️ Equipment',
            'other' => '📋 Other',
        ];
        return $labels[$this->category] ?? $this->category;
    }
}