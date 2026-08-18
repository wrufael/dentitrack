<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $table = 'patients';

    protected $fillable = [
        'clinic_id',
        'full_name',
        'age',
        'gender',
        'phone',
        'address',
        'emergency_contact',
        'patient_code',
        'registered_by',

        // Payment
        'payment_method',
        'payment_amount',
        'payment_status',
        'payment_phone',
        'payment_reference',
        'payment_bank_name',
        'card_holder_name',
        'card_last_four',
    ];

    protected $casts = [
        'id' => 'integer',
        'clinic_id' => 'integer',
        'age' => 'integer',
        'registered_by' => 'integer',
        'payment_amount' => 'decimal:2',
        'registered_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function paymentRequests()
    {
        return $this->hasMany(PaymentRequest::class);
    }
}