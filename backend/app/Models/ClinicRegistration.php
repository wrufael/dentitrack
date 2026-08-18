<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ClinicRegistration extends Model
{
    use HasFactory;

    protected $table = 'clinic_registrations';

    protected $fillable = [
        'clinic_name',
        'clinic_email',
        'clinic_phone',
        'address',
        'city',
        'country',
        'website',
        'tax_id',
        'owner_name',
        'owner_dob',
        'owner_gender',
        'owner_nationality',
        'owner_id_number',
        'owner_phone',
        'owner_email',
        'owner_password',  // ✅ WILL BE HASHED
        'license_number',
        'license_authority',
        'license_issue_date',
        'license_expiry_date',
        'requested_plan',
        'estimated_doctors',
        'estimated_staff',
        'years_in_operation',
        'clinic_hours',
        'license_document',
        'id_document',
        'clinic_photo',
        'bank_statement',
        'tax_clearance',
        'status', // pending, approved, rejected
        'admin_notes',
        'approved_at',
        'rejected_at'
    ];

    protected $casts = [
        'owner_dob' => 'date',
        'license_issue_date' => 'date',
        'license_expiry_date' => 'date',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'estimated_doctors' => 'integer',
        'estimated_staff' => 'integer',
        'years_in_operation' => 'integer',
    ];

    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isApproved()
    {
        return $this->status === 'approved';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }
}