<?php

namespace App\Http\Controllers;

use App\Http\Requests\PredictRequest;
use App\Services\PredictiveAnalytics;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PredictiveController extends Controller
{
    private const FILTERS = ['date_from', 'date_to', 'channel'];

    public function model(Request $request): JsonResponse
    {
        $service = new PredictiveAnalytics($request->only(self::FILTERS));

        return response()->json($service->model());
    }

    public function actualVsPredicted(Request $request): JsonResponse
    {
        $service = new PredictiveAnalytics($request->only(self::FILTERS));

        return response()->json($service->actualVsPredicted());
    }

    public function forecast(Request $request): JsonResponse
    {
        $service = new PredictiveAnalytics($request->only(self::FILTERS));

        return response()->json($service->forecast());
    }

    public function predict(PredictRequest $request): JsonResponse
    {
        $service = new PredictiveAnalytics([]);

        return response()->json(
            $service->predict((float) $request->validated('spend'), (float) $request->validated('discount_percent'))
        );
    }
}
