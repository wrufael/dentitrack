<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClinicSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'clinic_id',
        'plan',
        'payment_method',
        'transaction_id',
        'amount',
        'currency',
        'status',
        'payment_date',
        'expires_at',
        'metadata',
    ];

    protected $casts = [
        'payment_date' => 'datetime',
        'expires_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }
}