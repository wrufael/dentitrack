<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    use HasFactory;

    protected $fillable = [
        'clinic_id',
        'patient_id',
        'doctor_id',
        'created_by',
        'visit_date',
        'chief_complaint',
        'symptoms',
        'vital_signs',
        'examination_findings',
        'diagnosis',
        'treatment',
        'prescription',
        'recommendations',
        'doctor_notes',
        'follow_up_date',
    ];

    protected $casts = [
        'visit_date' => 'date',
        'follow_up_date' => 'date',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}