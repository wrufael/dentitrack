<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentItem extends Model
{
    protected $fillable = [
        'payment_request_id',
        'name',
        'price',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function paymentRequest()
    {
        return $this->belongsTo(PaymentRequest::class);
    }
}