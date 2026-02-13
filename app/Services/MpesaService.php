<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class MpesaService
{
    public function getAccessToken()
    {

        $response = Http::withBasicAuth(
            env('MPESA_CONSUMER_KEY'),
            env('MPESA_CONSUMER_SECRET')
        )->get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials');


        return $response['access_token'];
    }

    public function stkPush($phone, $amount)
    {
        $accessToken = $this->getAccessToken();

        $timestamp = now()->format('YmdHis');
        $password = base64_encode(
            env('MPESA_SHORTCODE') .
            env('MPESA_PASSKEY') .
            $timestamp
        );

        return Http::withToken($accessToken)->post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            [
                "BusinessShortCode" => env('MPESA_SHORTCODE'),
                "Password" => $password,
                "Timestamp" => $timestamp,
                "TransactionType" => "CustomerPayBillOnline",
                "Amount" => $amount,
                "PartyA" => $phone,
                "PartyB" => env('MPESA_SHORTCODE'),
                "PhoneNumber" => $phone,
                "CallBackURL" => env('MPESA_CALLBACK_URL'),
                "AccountReference" => "AI-Agent",
                "TransactionDesc" => "Test Payment"
            ]
        );
    }
}
