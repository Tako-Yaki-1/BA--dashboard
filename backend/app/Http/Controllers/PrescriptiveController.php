<?php

namespace App\Http\Controllers;

use App\Http\Requests\AllocateRequest;
use App\Http\Requests\WhatIfRequest;
use App\Services\PrescriptiveAnalytics;
use Illuminate\Http\JsonResponse;

class PrescriptiveController extends Controller
{
    public function channelRoi(): JsonResponse
    {
        $service = new PrescriptiveAnalytics();

        return response()->json($service->channelRoi());
    }

    public function allocate(AllocateRequest $request): JsonResponse
    {
        $service = new PrescriptiveAnalytics();

        return response()->json($service->allocate(
            (float) $request->validated('total_budget'),
            (float) $request->validated('min_share'),
            (float) $request->validated('max_share'),
        ));
    }

    public function whatIf(WhatIfRequest $request): JsonResponse
    {
        $service = new PrescriptiveAnalytics();

        return response()->json($service->whatIf(
            (float) $request->validated('pct_change'),
            $request->validated('channel_mix'),
        ));
    }

    public function recommendations(): JsonResponse
    {
        $service = new PrescriptiveAnalytics();

        return response()->json($service->recommendations());
    }

    /** Key findings handed between Descriptive → Predictive → Prescriptive. */
    public function processSummary(): JsonResponse
    {
        $service = new PrescriptiveAnalytics();

        return response()->json($service->processSummary());
    }
}
