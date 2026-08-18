<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'clinic_id',
        'patient_id',
        'doctor_id',
        'date',
        'time',
        'status',
        'notes',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    /**
     * Patient belonging to this appointment.
     */
    public function patient()
    {
        return $this->belongsTo(
            Patient::class
        );
    }

    /**
     * Doctor belonging to this appointment.
     */
    public function doctor()
    {
        return $this->belongsTo(
            Doctor::class
        );
    }
}