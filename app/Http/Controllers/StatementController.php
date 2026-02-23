<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\StatementParserService;
use App\Models\Transaction;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class StatementController extends Controller
{
    protected $parser;

    public function __construct(StatementParserService $parser)
    {
        $this->parser = $parser;
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240', // 10MB max
            'phone' => 'required|string', // To associate with a user
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            // Store in the 'local' disk (storage/app/private by default in Laravel 11/12)
            $path = $file->storeAs('statements', 'statement_' . time() . '.pdf');

            // Get the full absolute path using the Storage facade
            $fullPath = Storage::path($path);

            try {
                $parsedData = $this->parser->parsePdf($fullPath);

                $count = 0;
                foreach ($parsedData as $data) {
                    // Avoid duplicates
                    if (Transaction::where('mpesa_receipt', $data['mpesa_receipt'])->exists()) {
                        continue;
                    }

                    Transaction::create([
                        'phone_number' => $request->phone,
                        'mpesa_receipt' => $data['mpesa_receipt'],
                        'transaction_date' => $data['transaction_date'],
                        'description' => $data['description'],
                        'amount' => $data['amount'],
                        'type' => $data['type'],
                        'balance' => $data['balance'],
                        'result_code' => strtoupper($data['status']) == 'COMPLETED' ? '0' : '1',
                        'result_desc' => $data['status'],
                    ]);
                    $count++;
                }

                return response()->json([
                    'message' => 'Statement processed successfully',
                    'transactions_imported' => $count
                ]);

            } catch (\Exception $e) {
                Log::error("Statement Processing Error: " . $e->getMessage());
                return response()->json(['error' => 'Failed to process statement: ' . $e->getMessage()], 500);
            }
        }

        return response()->json(['error' => 'No file uploaded'], 400);
    }
}
