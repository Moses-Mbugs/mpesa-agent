<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'merchant_request_id',
        'checkout_request_id',
        'phone_number',
        'amount',
        'mpesa_receipt',
        'transaction_date',
        'result_code',
        'result_desc',
        'type',
        'description',
        'balance',
    ];
}
