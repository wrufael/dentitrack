<?php
// app/Models/Doctor.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Doctor extends Model
{
    use HasFactory;

    protected $fillable = [
        'clinic_id',
        'user_id',
        'specialty',
        'license_number',
        'department',
        'shift',
        'salary',
        'start_date',
        'is_active'
    ];

    protected $casts = [
        'start_date' => 'date',
        'salary' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function getFullNameAttribute(): string
    {
        return $this->user ? $this->user->name : 'Unknown';
    }

    public function getEmailAttribute(): string
    {
        return $this->user ? $this->user->email : '';
    }

    public function getPhoneAttribute(): string
    {
        return $this->user ? $this->user->phone : '';
    }
}