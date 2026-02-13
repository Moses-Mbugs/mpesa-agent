<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MpesaController;

Route::post('/mpesa/stkpush', [MpesaController::class, 'stkPush']);
Route::post('/mpesa/callback', [MpesaController::class, 'callback']);
