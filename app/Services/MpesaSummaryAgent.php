<?php

namespace App\Services;

use App\Models\Transaction;
use OpenAI;

class MpesaSummaryAgent
{
    public function generateSummary($phone, $startDate, $endDate)
    {
        $transactions = Transaction::where('phone_number', $phone)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        if ($transactions->isEmpty()) {
            return "No transactions found for this period.";
        }

        $totalSent = $transactions->where('type', 'send')->sum('amount');
        $totalReceived = $transactions->where('type', 'receive')->sum('amount');
        $totalPaybill = $transactions->where('type', 'paybill')->sum('amount');
        $totalTill = $transactions->where('type', 'till')->sum('amount');

        $largestTransaction = $transactions->sortByDesc('amount')->first();

        $dataSummary = "
        Total Sent: KES {$totalSent}
        Total Received: KES {$totalReceived}
        Total Paybill: KES {$totalPaybill}
        Total Till: KES {$totalTill}
        Largest Transaction: KES {$largestTransaction->amount}
        ";

        $client = OpenAI::client(env('OPENAI_API_KEY'));

        $response = $client->chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a financial assistant that writes clear weekly summaries for M-Pesa users in Kenya.'
                ],
                [
                    'role' => 'user',
                    'content' => "Here is the transaction data:\n\n{$dataSummary}\n\nWrite a simple, friendly weekly financial summary in KES."
                ]
            ],
        ]);

        return $response->choices[0]->message->content;
    }
}
