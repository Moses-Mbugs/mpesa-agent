<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        return view('dashboard');
    }

    public function getData(Request $request)
    {
        $phone = $request->query('phone');
        $start = $request->query('start_date');
        $end = $request->query('end_date');

        if (!$phone) {
            return response()->json(['error' => 'Phone number is required'], 400);
        }

        if (!$start || !$end) {
            $range = Transaction::selectRaw('MIN(transaction_date) as start_date, MAX(transaction_date) as end_date')
                ->where('phone_number', $phone)
                ->first();
            $start = $range->start_date;
            $end = $range->end_date;
        }

        $monthlySpending = Transaction::select(
            DB::raw("DATE_FORMAT(transaction_date, '%Y-%m') as month"),
            'type',
            DB::raw('SUM(amount) as total')
        )
        ->where('phone_number', $phone)
        ->whereIn('type', ['send', 'paybill', 'buy_goods', 'withdraw', 'airtime'])
        ->whereBetween('transaction_date', [$start, $end])
        ->groupBy('month', 'type')
        ->orderBy('month', 'asc')
        ->get();

        $months = $monthlySpending->pluck('month')->unique()->values()->all();
        $types = ['send', 'paybill', 'buy_goods', 'withdraw', 'airtime'];

        $datasets = [];
        $colors = [
            'send' => 'rgba(255, 99, 132, 0.7)', // Red
            'paybill' => 'rgba(54, 162, 235, 0.7)', // Blue
            'buy_goods' => 'rgba(153, 102, 255, 0.7)', // Purple
            'withdraw' => 'rgba(255, 159, 64, 0.7)', // Orange
            'airtime' => 'rgba(75, 192, 192, 0.7)', // Teal
        ];

        foreach ($types as $type) {
            $data = [];
            foreach ($months as $month) {
                $record = $monthlySpending->where('month', $month)->where('type', $type)->first();
                $data[] = $record ? $record->total : 0;
            }
            $datasets[] = [
                'label' => ucwords(str_replace('_', ' ', $type)),
                'data' => $data,
                'backgroundColor' => $colors[$type],
                'borderColor' => str_replace('0.7', '1', $colors[$type]),
                'borderWidth' => 1
            ];
        }

        $categoryBreakdown = Transaction::select('type', DB::raw('SUM(amount) as total'))
            ->where('phone_number', $phone)
            ->whereIn('type', ['send', 'paybill', 'buy_goods', 'withdraw', 'airtime', 'receive', 'deposit'])
            ->whereBetween('transaction_date', [$start, $end])
            ->groupBy('type')
            ->get();

        $categoryLabels = $categoryBreakdown->pluck('type');
        $categoryData = $categoryBreakdown->pluck('total');

        $totalSent = Transaction::where('phone_number', $phone)
            ->whereBetween('transaction_date', [$start, $end])
            ->whereIn('type', ['send', 'paybill', 'buy_goods', 'withdraw', 'airtime'])
            ->sum('amount');
        $totalReceived = Transaction::where('phone_number', $phone)
            ->whereBetween('transaction_date', [$start, $end])
            ->whereIn('type', ['receive', 'deposit'])
            ->sum('amount');
        $transactionCount = Transaction::where('phone_number', $phone)
            ->whereBetween('transaction_date', [$start, $end])
            ->count();

        return response()->json([
            'monthly_spending' => [
                'labels' => $months,
                'datasets' => $datasets
            ],
            'category_breakdown' => [
                'labels' => $categoryLabels,
                'data' => $categoryData
            ],
            'totals' => [
                'total_sent' => $totalSent,
                'total_received' => $totalReceived,
                'net_flow' => $totalReceived - $totalSent,
                'transaction_count' => $transactionCount
            ],
            'range' => [
                'start_date' => $start,
                'end_date' => $end
            ]
        ]);
    }

    public function getRange(Request $request)
    {
        $phone = $request->query('phone');
        if (!$phone) {
            return response()->json(['error' => 'Phone number is required'], 400);
        }
        $range = Transaction::selectRaw('MIN(transaction_date) as start_date, MAX(transaction_date) as end_date')
            ->where('phone_number', $phone)
            ->first();
        return response()->json([
            'start_date' => $range->start_date,
            'end_date' => $range->end_date
        ]);
    }
}
