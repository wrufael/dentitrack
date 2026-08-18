<?php
// app/Models/Expense.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $table = 'expenses';

    protected $fillable = [
        'clinic_id',
        'user_id',
        'title',
        'description',
        'amount',
        'expense_date',
        'category',
        'employee_id',
        'employee_name',
        'employee_role',
        'payment_method',
        'transaction_id',
        'receipt_number',
        'attachment',
        'is_recurring',
        'recurring_period',
        'recurring_end_date',
        'status',
        'paid_at',
        'notes',
        // ✅ ADD THESE NEW FIELDS
        'source',        // 'manual' or 'inventory'
        'inventory_id',  // Link to inventory item
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'date',
        'paid_at' => 'datetime',
        'is_recurring' => 'boolean',
        'recurring_end_date' => 'date',
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

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    // ✅ NEW RELATIONSHIP
    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }

    // Category Labels
    public static function getCategoryLabels()
    {
        return [
            'salary' => '💰 Salary',
            'rent' => '🏢 Rent',
            'utilities' => '💡 Utilities',
            'inventory' => '📦 Inventory',
            'marketing' => '📢 Marketing',
            'maintenance' => '🔧 Maintenance',
            'insurance' => '🛡️ Insurance',
            'software' => '💻 Software',
            'training' => '📚 Training',
            'tax' => '🏛️ Tax',
            'other' => '📋 Other',
        ];
    }

    public function getCategoryLabelAttribute()
    {
        return self::getCategoryLabels()[$this->category] ?? $this->category;
    }

    // Status Labels
    public static function getStatusLabels()
    {
        return [
            'pending' => '⏳ Pending',
            'approved' => '✅ Approved',
            'paid' => '💳 Paid',
            'cancelled' => '❌ Cancelled',
        ];
    }

    public function getStatusLabelAttribute()
    {
        return self::getStatusLabels()[$this->status] ?? $this->status;
    }
}