<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\MpesaSummaryAgent;

class MpesaSummaryController extends Controller
{
    public function summarize(Request $request, MpesaSummaryAgent $agent)
    {
        $request->validate([
            'phone' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $summary = $agent->generateSummary(
            $request->phone,
            $request->start_date,
            $request->end_date
        );

        return response()->json([
            'summary' => $summary
        ]);
    }
}
