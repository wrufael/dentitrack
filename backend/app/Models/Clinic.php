<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Clinic extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'owner_name',
        'owner_phone',
        'email',
        'address',
        'city',
        'country',
        'subscription_plan',
        'is_active',
        'status',
        'subscription_expires_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'subscription_expires_at' => 'datetime',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function owner()
    {
        return $this->hasOne(User::class)->where('role', 'owner');
    }

    public function doctors()
    {
        return $this->hasMany(User::class)->where('role', 'doctor');
    }

    public function cashiers()
    {
        return $this->hasMany(User::class)->where('role', 'cashier');
    }

    public function isApproved()
    {
        return $this->status === 'approved' && $this->is_active;
    }
}