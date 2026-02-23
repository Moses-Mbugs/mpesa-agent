<?php

namespace App\Services;

use App\Models\Transaction;
use OpenAI;
use Carbon\Carbon;

class MpesaSummaryAgent
{
    public function generateSummary($phone, $startDate, $endDate)
    {
        $transactions = Transaction::where('phone_number', $phone)
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('created_at', [$startDate, $endDate])
                      ->orWhereBetween('transaction_date', [$startDate, $endDate]);
            })
            ->get();

        if ($transactions->isEmpty()) {
            return "No transactions found for this period.";
        }

        $totalSent = $transactions->whereIn('type', ['send', 'withdraw', 'paybill', 'buy_goods', 'airtime'])->sum('amount');
        $totalReceived = $transactions->whereIn('type', ['receive', 'deposit'])->sum('amount');
        $totalPaybill = $transactions->where('type', 'paybill')->sum('amount');
        $totalTill = $transactions->whereIn('type', ['till', 'buy_goods'])->sum('amount');

        $largestTransaction = $transactions->sortByDesc('amount')->first();
        $daysInRange = max(1, Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1);
        $avgDailySpend = $totalSent / $daysInRange;
        $categorySums = $transactions
            ->whereIn('type', ['send', 'paybill', 'buy_goods', 'withdraw', 'airtime'])
            ->groupBy('type')
            ->map->sum('amount')
            ->sortDesc()
            ->take(3);
        $monthlySeries = $transactions
            ->groupBy(function ($t) {
                return substr($t->transaction_date ?? '', 0, 7);
            })
            ->map(function ($group) {
                return [
                    'sent' => $group->whereIn('type', ['send', 'withdraw', 'paybill', 'buy_goods', 'airtime'])->sum('amount'),
                    'received' => $group->whereIn('type', ['receive', 'deposit'])->sum('amount'),
                ];
            });

        $dataSummary = "Period: {$startDate} to {$endDate}
Total Sent: KES {$totalSent}
Total Received: KES {$totalReceived}
Net Flow: KES " . ($totalReceived - $totalSent) . "
Average Daily Spend: KES " . number_format($avgDailySpend, 2) . "
Total Paybill: KES {$totalPaybill}
Total Buy Goods: KES {$totalTill}
Largest Transaction: KES {$largestTransaction->amount}
Top Spend Categories: " . $categorySums->map(function ($v, $k) { return "{$k} KES {$v}"; })->values()->implode(', ') . "
Monthly Series (YYYY-MM => sent/received): " . collect($monthlySeries)->map(function ($v, $k) { return "{$k} => {$v['sent']}/{$v['received']}"; })->implode('; ') . "
";

        try {
            $client = OpenAI::client(env('OPENAI_API_KEY'));

            $response = $client->chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a financial assistant that writes clear monthly summaries for M-Pesa users in Kenya. Be concise, data-driven, and actionable.'
                    ],
                    [
                        'role' => 'user',
                        'content' => "Here is the transaction data:\n\n{$dataSummary}\n\nTask:\n1) In 5-8 bullets, summarize the period. Include: total sent/received, net flow, top spend categories, largest transaction, and the most unusual spike if any.\n2) Compare the last month in range to the prior month: mention change in sent and received.\n3) Suggest 2 saving tips tailored to the categories.\nKeep it friendly and use KES."
                    ]
                ],
            ]);

            return $response->choices[0]->message->content;
        } catch (\Throwable $e) {
            $fallback = [];
            $fallback[] = "Period: {$startDate} → {$endDate}";
            $fallback[] = "Total Sent: KES " . number_format($totalSent, 2);
            $fallback[] = "Total Received: KES " . number_format($totalReceived, 2);
            $fallback[] = "Net Flow: KES " . number_format($totalReceived - $totalSent, 2);
            $fallback[] = "Average Daily Spend: KES " . number_format($avgDailySpend, 2);
            $fallback[] = "Top Categories: " . $categorySums->map(function ($v, $k) { return "{$k} KES " . number_format($v, 2); })->values()->implode(', ');
            $fallback[] = "Largest Transaction: KES " . number_format($largestTransaction->amount, 2);

            $ms = collect($monthlySeries);
            $lastMonth = $ms->keys()->last();
            $priorMonth = $ms->keys()->count() > 1 ? $ms->keys()->slice(-2, 1)->first() : null;

            if ($lastMonth && $priorMonth) {
                $lastData = $ms[$lastMonth];
                $priorData = $ms[$priorMonth];
                $sentDiff = $lastData['sent'] - $priorData['sent'];
                $receivedDiff = $lastData['received'] - $priorData['received'];
                $sentChange = $sentDiff >= 0 ? "INCREASED by " . number_format($sentDiff, 2) : "DECREASED by " . number_format(abs($sentDiff), 2);
                $recChange = $receivedDiff >= 0 ? "INCREASED by " . number_format($receivedDiff, 2) : "DECREASED by " . number_format(abs($receivedDiff), 2);
                $fallback[] = "\nMonth-over-Month ({$priorMonth} vs {$lastMonth}):";
                $fallback[] = "- Spending {$sentChange}";
                $fallback[] = "- Income {$recChange}";
            }

            return "Financial Summary (AI Unavailable):\n" . implode("\n", $fallback);
        }
    }
}
