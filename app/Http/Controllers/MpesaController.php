<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\MpesaService;
use App\Models\Transaction;

class MpesaController extends Controller
{
    public function stkPush(Request $request, MpesaService $mpesa)
    {
        $request->validate([
            'phone' => 'required',
            'amount' => 'required|numeric'
        ]);

        $response = $mpesa->stkPush($request->phone, $request->amount);

        return response()->json($response->json());
    }

    public function callback(Request $request)
    {
        $data = $request->all();

        if (isset($data['Body']['stkCallback'])) {

            $callback = $data['Body']['stkCallback'];

            $metadata = collect($callback['CallbackMetadata']['Item'] ?? [])
                ->pluck('Value', 'Name');

            $transactionDate = $metadata['TransactionDate'] ?? null;
            // Format YYYYMMDDHHmmss to YYYY-MM-DD HH:MM:SS if possible
            if ($transactionDate) {
                $transactionDate = \Carbon\Carbon::createFromFormat('YmdHis', $transactionDate)->format('Y-m-d H:i:s');
            }

            Transaction::create([
                'merchant_request_id' => $callback['MerchantRequestID'] ?? null,
                'checkout_request_id' => $callback['CheckoutRequestID'] ?? null,
                'phone_number' => $metadata['PhoneNumber'] ?? null,
                'amount' => $metadata['Amount'] ?? null,
                'mpesa_receipt' => $metadata['MpesaReceiptNumber'] ?? null,
                'transaction_date' => $transactionDate,
                'result_code' => $callback['ResultCode'] ?? null,
                'result_desc' => $callback['ResultDesc'] ?? null,
                'type' => 'paybill', // Default for STK Push
                'description' => 'M-Pesa Payment',
            ]);
        }

        return response()->json(['status' => 'received']);
    }
}
