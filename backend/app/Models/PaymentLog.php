<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentLog extends Model
{
    protected $fillable = [
        'payment_request_id',
        'action',
        'performed_by',
        'note',
        'amount',
        'payment_method',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function paymentRequest()
    {
        return $this->belongsTo(PaymentRequest::class);
    }

    public function performer()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
