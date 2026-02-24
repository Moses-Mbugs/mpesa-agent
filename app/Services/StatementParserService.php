<?php

namespace App\Services;

use Smalot\PdfParser\Parser;
use Illuminate\Support\Facades\Log;
use Exception;

class StatementParserService
{
    protected $parser;

    public function __construct()
    {
        $this->parser = new Parser();
    }

    public function parsePdf(string $filePath)
    {
        try {
            $pdf = $this->parser->parseFile($filePath);
            $text = $pdf->getText();

            // Log raw text for debugging
            Log::info("Parsed PDF Text: " . substr($text, 0, 500));

            $metadata = $this->extractMetadata($text);
            $transactions = $this->extractTransactions($text);

            return [
                'metadata' => $metadata,
                'transactions' => $transactions
            ];
        } catch (Exception $e) {
            Log::error("PDF Parsing Error: " . $e->getMessage());
            throw new Exception("Failed to parse PDF statement.");
        }
    }

    private function extractMetadata(string $text)
    {
        $metadata = [];
        if (preg_match('/Mobile Number:\s+(\d+)/i', $text, $matches)) {
            // Convert 254... to 0... if needed, but standard is 07... or 2547...
            // Let's keep it as is, or normalize? User input likely 07...
            // M-Pesa statements usually show 2547...
            // Dashboard usually expects 07... or just string match.
            // Let's just return what is found.
            $metadata['phone_number'] = $matches[1];
        }
        if (preg_match('/Customer Name:\s+(.+)/i', $text, $matches)) {
            $metadata['customer_name'] = trim($matches[1]);
        }
        return $metadata;
    }

    private function extractTransactions(string $text)
    {
        Log::info("Starting transaction extraction...");
        $transactions = [];
        $lines = explode("\n", $text);

        $currentBlock = '';

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            // Check if line starts with a Receipt ID and Date (Start of new transaction)
            if (preg_match('/^([A-Z0-9]{10})\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/', $line)) {
                if (!empty($currentBlock)) {
                    $this->processBlock($currentBlock, $transactions);
                }
                $currentBlock = $line;
            } else {
                // Continuation or Junk
                if (preg_match('/^(Page \d+ of|Disclaimer:|Receipt No|SUMMARY|DETAILED STATEMENT|TRANSACTION TYPE|Customer Name|Mobile Number|Date of Statement|Statement Period|TOTAL:)/i', $line)) {
                    continue;
                }
                if (!empty($currentBlock)) {
                    $currentBlock .= " " . $line;
                }
            }
        }

        if (!empty($currentBlock)) {
            $this->processBlock($currentBlock, $transactions);
        }

        Log::info("Extracted " . count($transactions) . " transactions.");
        return $transactions;
    }

    private function processBlock($block, &$transactions)
    {
        // Log::info("Processing block: " . substr($block, 0, 100));
        $pattern = '/^([A-Z0-9]{10})\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})(.*)(COMPLETED|Failed|Cancelled)(.*)$/i';

        if (preg_match($pattern, $block, $matches)) {
            $receipt = $matches[1];
            $date = $matches[2];
            $details = trim($matches[3]);
            $status = strtoupper($matches[4]);
            $amountsStr = $matches[5];

            preg_match_all('/[0-9,]+\.\d{2}/', $amountsStr, $amountMatches);
            $amounts = $amountMatches[0] ?? [];

            if (count($amounts) >= 3) {
                $paidIn = str_replace(',', '', $amounts[0]);
                $withdrawn = str_replace(',', '', $amounts[1]);
                $balance = str_replace(',', '', $amounts[2]);

                $amount = 0;
                $type = 'unknown';

                if (floatval($paidIn) > 0) {
                    $amount = floatval($paidIn);
                    $type = 'receive';
                } elseif (floatval($withdrawn) > 0) {
                    $amount = floatval($withdrawn);
                    $type = 'send';
                }

                if (stripos($details, 'Pay Bill') !== false) {
                    $type = 'paybill';
                } elseif (stripos($details, 'Buy Goods') !== false) {
                    $type = 'buy_goods';
                } elseif (stripos($details, 'Withdraw') !== false) {
                    $type = 'withdraw';
                } elseif (stripos($details, 'Deposit') !== false) {
                    $type = 'deposit';
                } elseif (stripos($details, 'Airtime') !== false) {
                    $type = 'airtime';
                } elseif (stripos($details, 'Fuliza') !== false) {
                    if ($type == 'send') $type = 'loan_repayment';
                }

                $transactions[] = [
                    'mpesa_receipt' => $receipt,
                    'transaction_date' => $date,
                    'description' => $details,
                    'amount' => $amount,
                    'type' => $type,
                    'balance' => $balance,
                    'status' => $status
                ];
            } else {
                 Log::warning("Could not extract amounts for block: $block");
            }
        } else {
             Log::warning("Pattern mismatch for block: $block");
        }
    }
}
