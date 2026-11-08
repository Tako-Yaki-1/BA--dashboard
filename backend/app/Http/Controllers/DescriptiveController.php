<?php

namespace App\Http\Controllers;

use App\Services\DescriptiveAnalytics;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read-only descriptive aggregates; every action accepts the same optional
 * date_from / date_to / channel filters.
 */
class DescriptiveController extends Controller
{
    private const FILTERS = ['date_from', 'date_to', 'channel'];

    public function summary(Request $request): JsonResponse
    {
        $service = new DescriptiveAnalytics($request->only(self::FILTERS));

        return response()->json($service->summary());
    }

    public function trend(Request $request): JsonResponse
    {
        $service = new DescriptiveAnalytics($request->only(self::FILTERS));

        return response()->json(['data' => $service->trend()]);
    }

    public function byChannel(Request $request): JsonResponse
    {
        $service = new DescriptiveAnalytics($request->only(self::FILTERS));

        return response()->json(['data' => $service->byChannel()]);
    }

    public function byCategory(Request $request): JsonResponse
    {
        $service = new DescriptiveAnalytics($request->only(self::FILTERS));

        return response()->json($service->byCategory());
    }

    public function customers(Request $request): JsonResponse
    {
        $service = new DescriptiveAnalytics($request->only(self::FILTERS));

        return response()->json($service->customers());
    }

    public function statistics(Request $request): JsonResponse
    {
        $service = new DescriptiveAnalytics($request->only(self::FILTERS));

        return response()->json($service->statistics());
    }

    public function correlation(Request $request): JsonResponse
    {
        $service = new DescriptiveAnalytics($request->only(self::FILTERS));

        return response()->json($service->correlation());
    }
}
