<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DescriptiveController;
use App\Http\Controllers\MarketingCampaignController;
use App\Http\Controllers\PredictiveController;
use App\Http\Controllers\PrescriptiveController;
use App\Http\Controllers\MetaController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::get('/meta/filters', MetaController::class);
Route::get('/meta/counts', [MetaController::class, 'counts']);

Route::apiResource('customers', CustomerController::class);
Route::apiResource('products', ProductController::class);
Route::apiResource('marketing-campaigns', MarketingCampaignController::class);

Route::apiResource('sales', SaleController::class)->only(['index', 'show']);
Route::apiResource('transactions', TransactionController::class)->only(['index', 'show']);

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'BA Dashboard API',
        'time' => now()->toIso8601String(),
    ]);
});

Route::prefix('analytics/descriptive')->group(function () {
    Route::get('/summary', [DescriptiveController::class, 'summary']);
    Route::get('/trend', [DescriptiveController::class, 'trend']);
    Route::get('/by-channel', [DescriptiveController::class, 'byChannel']);
    Route::get('/by-category', [DescriptiveController::class, 'byCategory']);
    Route::get('/customers', [DescriptiveController::class, 'customers']);
    Route::get('/statistics', [DescriptiveController::class, 'statistics']);
    Route::get('/correlation', [DescriptiveController::class, 'correlation']);
});

Route::prefix('analytics/predictive')->group(function () {
    Route::get('/model', [PredictiveController::class, 'model']);
    Route::get('/actual-vs-predicted', [PredictiveController::class, 'actualVsPredicted']);
    Route::get('/forecast', [PredictiveController::class, 'forecast']);
    Route::post('/predict', [PredictiveController::class, 'predict']);
});

Route::prefix('analytics/prescriptive')->group(function () {
    Route::get('/channel-roi', [PrescriptiveController::class, 'channelRoi']);
    Route::post('/allocate', [PrescriptiveController::class, 'allocate']);
    Route::post('/what-if', [PrescriptiveController::class, 'whatIf']);
    Route::get('/recommendations', [PrescriptiveController::class, 'recommendations']);
});

Route::get('/analytics/process-summary', [PrescriptiveController::class, 'processSummary']);
