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
            'phone' => 'nullable|string', // Optional, will try to extract from statement
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            // Store in the 'local' disk (storage/app/private by default in Laravel 11/12)
            $path = $file->storeAs('statements', 'statement_' . time() . '.pdf');

            // Get the full absolute path using the Storage facade
            $fullPath = Storage::path($path);

            try {
                $result = $this->parser->parsePdf($fullPath);
                $transactions = $result['transactions'];
                $metadata = $result['metadata'];

                $phoneNumber = $request->phone;
                $detectedPhone = null;

                if (!empty($metadata['phone_number'])) {
                    $extractedPhone = $metadata['phone_number'];
                    // Normalize 2547.../2541... to 07.../01...
                    if (str_starts_with($extractedPhone, '254')) {
                        $extractedPhone = '0' . substr($extractedPhone, 3);
                    }
                    $phoneNumber = $extractedPhone;
                    $detectedPhone = $phoneNumber;
                }

                if (empty($phoneNumber)) {
                    // Clean up file if processing fails
                    // Storage::delete($path); // Optional: delete file
                    return response()->json([
                        'error' => 'Could not detect phone number from statement. Please provide one manually.'
                    ], 400);
                }

                $count = 0;
                foreach ($transactions as $data) {
                    // Avoid duplicates
                    if (Transaction::where('mpesa_receipt', $data['mpesa_receipt'])->exists()) {
                        continue;
                    }

                    Transaction::create([
                        'phone_number' => $phoneNumber,
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
                    'transactions_imported' => $count,
                    'detected_phone' => $detectedPhone
                ]);

            } catch (\Exception $e) {
                Log::error("Statement Processing Error: " . $e->getMessage());
                return response()->json(['error' => 'Failed to process statement: ' . $e->getMessage()], 500);
            }
        }

        return response()->json(['error' => 'No file uploaded'], 400);
    }
}
