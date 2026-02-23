<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MpesaController;
use App\Http\Controllers\MpesaSummaryController;
use App\Http\Controllers\StatementController;

Route::post('/mpesa/stkpush', [MpesaController::class, 'stkPush']);
Route::post('/mpesa/callback', [MpesaController::class, 'callback']);
Route::post('/mpesa/summary', [MpesaSummaryController::class, 'summarize']);
Route::post('/mpesa/statement', [StatementController::class, 'upload']);
