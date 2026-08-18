<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'clinic_id', 'patient_id', 'doctor_id', 'created_by', 'collected_by',
        'request_code', 'patient_name', 'patient_age', 'patient_gender', 'patient_phone',
        'total', 'paid', 'balance', 'status',
        'payment_method', 'receipt_number', 'proof_photo_path', 'proof_uploaded_at',
        'notes', 'due_date',
    ];

    protected $casts = [
        'proof_uploaded_at' => 'datetime',
        'due_date' => 'date:Y-m-d',
        'total' => 'decimal:2',
        'paid' => 'decimal:2',
        'balance' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(PaymentItem::class);
    }

    public function logs()
    {
        return $this->hasMany(PaymentLog::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function collector()
    {
        return $this->belongsTo(User::class, 'collected_by');
    }
}
