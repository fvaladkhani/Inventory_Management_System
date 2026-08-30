<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        $group = $request->get('group', 'general');
        $settings = Setting::where('group', $group)->get();
        return response()->json($settings);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|unique:settings,key',
            'value' => 'nullable',
            'group' => 'required|string',
            'type' => 'required|string',
            'description' => 'nullable|string',
        ]);

        $setting = Setting::create($validated);
        return response()->json($setting, 201);
    }

    public function update(Request $request, $key)
    {
        $setting = Setting::where('key', $key)->firstOrFail();

        $validated = $request->validate([
            'value' => 'nullable',
            'description' => 'nullable|string',
        ]);

        $setting->update($validated);
        return response()->json($setting);
    }

    public function destroy($key)
    {
        $setting = Setting::where('key', $key)->firstOrFail();
        $setting->delete();
        return response()->json(['message' => 'Setting deleted successfully']);
    }

    // دریافت تنظیمات پیش‌فرض برای مقداردهی اولیه
    public function initialize()
    {
        $defaults = [
            // تنظیمات عمومی
            ['key' => 'company_name', 'value' => 'My Company', 'group' => 'general', 'type' => 'string'],
            ['key' => 'company_address', 'value' => '', 'group' => 'general', 'type' => 'string'],
            ['key' => 'company_phone', 'value' => '', 'group' => 'general', 'type' => 'string'],
            ['key' => 'company_email', 'value' => '', 'group' => 'general', 'type' => 'string'],
            ['key' => 'company_website', 'value' => '', 'group' => 'general', 'type' => 'string'],
            ['key' => 'currency', 'value' => 'USD', 'group' => 'general', 'type' => 'string'],
            ['key' => 'currency_symbol', 'value' => '$', 'group' => 'general', 'type' => 'string'],
            ['key' => 'timezone', 'value' => 'UTC', 'group' => 'general', 'type' => 'string'],
            ['key' => 'date_format', 'value' => 'YYYY-MM-DD', 'group' => 'general', 'type' => 'string'],
            ['key' => 'time_format', 'value' => 'HH:mm', 'group' => 'general', 'type' => 'string'],

            // تنظیمات واحدها
            ['key' => 'weight_unit', 'value' => 'kg', 'group' => 'units', 'type' => 'string'],
            ['key' => 'dimension_unit', 'value' => 'cm', 'group' => 'units', 'type' => 'string'],
            ['key' => 'volume_unit', 'value' => 'L', 'group' => 'units', 'type' => 'string'],

            // تنظیمات انبار
            ['key' => 'default_warehouse', 'value' => null, 'group' => 'warehouse', 'type' => 'integer'],
            ['key' => 'low_stock_threshold', 'value' => 5, 'group' => 'warehouse', 'type' => 'integer'],
            ['key' => 'enable_auto_reorder', 'value' => false, 'group' => 'warehouse', 'type' => 'boolean'],
            ['key' => 'reorder_quantity', 'value' => 10, 'group' => 'warehouse', 'type' => 'integer'],

            // تنظیمات ایمیل
            ['key' => 'mail_driver', 'value' => 'smtp', 'group' => 'email', 'type' => 'string'],
            ['key' => 'mail_host', 'value' => '', 'group' => 'email', 'type' => 'string'],
            ['key' => 'mail_port', 'value' => 587, 'group' => 'email', 'type' => 'integer'],
            ['key' => 'mail_username', 'value' => '', 'group' => 'email', 'type' => 'string'],
            ['key' => 'mail_password', 'value' => '', 'group' => 'email', 'type' => 'string'],
            ['key' => 'mail_encryption', 'value' => 'tls', 'group' => 'email', 'type' => 'string'],
            ['key' => 'mail_from_address', 'value' => '', 'group' => 'email', 'type' => 'string'],
            ['key' => 'mail_from_name', 'value' => '', 'group' => 'email', 'type' => 'string'],
        ];

        foreach ($defaults as $default) {
            Setting::firstOrCreate(
                ['key' => $default['key']],
                $default
            );
        }

        return response()->json(['message' => 'Settings initialized successfully']);
    }
}