<?php

namespace App\Http\Requests;

use App\Support\Catalog;
use Illuminate\Foundation\Http\FormRequest;

class WhatIfRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pct_change' => ['required', 'numeric', 'between:-100,500'],
            'channel_mix' => [
                'nullable',
                'array',
                'size:'.count(Catalog::CHANNELS),
                function ($attribute, $value, $fail) {
                    if (count(array_diff(Catalog::CHANNELS, array_keys((array) $value))) > 0) {
                        $fail('The mix needs a share for each of the four channels.');
                    }
                },
            ],
            'channel_mix.*' => ['numeric', 'min:0', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'pct_change.between' => 'Budget change must be between -100% and +500%.',
            'channel_mix.size' => 'The mix needs a share for each of the four channels.',
        ];
    }

    public function withValidator($validator): void
    {
        // the optional mix must sum to 100%
        $validator->after(function ($validator) {
            $mix = $this->input('channel_mix');
            if (is_array($mix) && array_sum($mix) !== 100.0) {
                $validator->errors()->add('channel_mix', 'The channel mix must add up to 100%.');
            }
        });
    }
}
