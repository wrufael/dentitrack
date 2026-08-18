<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = ['clinic_id', 'plan', 'status', 'expires_at'];
}