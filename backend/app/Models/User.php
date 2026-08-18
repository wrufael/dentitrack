<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'permissions',
        'clinic_id',
        'is_active',
        'email_verified_at',
        'remember_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'permissions' => 'array',
    ];

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function isPlatformAdmin()
    {
        return $this->role === 'platform_admin';
    }

    public function isOwner()
    {
        return $this->role === 'owner';
    }

    public function isDoctor()
    {
        return $this->role === 'doctor';
    }

    public function isCashier()
    {
        return $this->role === 'cashier';
    }
}