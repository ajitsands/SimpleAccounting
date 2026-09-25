<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $settings = getSystemSettings($pdo);
    
    // Fetch currencies
    $stmt = $pdo->query("SELECT * FROM currencies WHERE is_active = 1 ORDER BY is_gcc DESC, country ASC");
    $currencies = $stmt->fetchAll();

    // List of curated Timezones for GCC and India + International
    $timezones = [
        ['zone' => 'Asia/Bahrain', 'label' => 'Bahrain (GMT+3)', 'country' => 'Bahrain'],
        ['zone' => 'Asia/Riyadh', 'label' => 'Saudi Arabia (GMT+3)', 'country' => 'Saudi Arabia'],
        ['zone' => 'Asia/Dubai', 'label' => 'United Arab Emirates (GMT+4)', 'country' => 'UAE'],
        ['zone' => 'Asia/Qatar', 'label' => 'Qatar (GMT+3)', 'country' => 'Qatar'],
        ['zone' => 'Asia/Kuwait', 'label' => 'Kuwait (GMT+3)', 'country' => 'Kuwait'],
        ['zone' => 'Asia/Muscat', 'label' => 'Oman (GMT+4)', 'country' => 'Oman'],
        ['zone' => 'Asia/Kolkata', 'label' => 'India Standard Time (IST GMT+5:30)', 'country' => 'India'],
        ['zone' => 'UTC', 'label' => 'Coordinated Universal Time (UTC)', 'country' => 'Global'],
        ['zone' => 'Europe/London', 'label' => 'London / UK (GMT/BST)', 'country' => 'United Kingdom'],
        ['zone' => 'America/New_York', 'label' => 'Eastern Time (US & Canada)', 'country' => 'United States']
    ];

    $dateFormats = [
        ['format' => 'DD/MM/YYYY', 'example' => date('d/m/Y'), 'label' => 'Day/Month/Year (21/09/2026) - Bahrain/GCC/India Standard'],
        ['format' => 'YYYY-MM-DD', 'example' => date('Y-m-d'), 'label' => 'ISO Standard (2026-09-21)'],
        ['format' => 'MM/DD/YYYY', 'example' => date('m/d/Y'), 'label' => 'Month/Day/Year (09/21/2026) - US Format'],
        ['format' => 'DD-MMM-YYYY', 'example' => date('d-M-Y'), 'label' => 'Day-Month-Year (21-Sep-2026)']
    ];

    sendResponse([
        'status' => 'success',
        'settings' => $settings,
        'currencies' => $currencies,
        'timezones' => $timezones,
        'date_formats' => $dateFormats,
        'server_time' => date('Y-m-d H:i:s'),
        'current_timezone' => date_default_timezone_get()
    ]);
}

if ($method === 'POST' || $method === 'PUT') {
    $data = getRequestBody();
    if (empty($data)) {
        $data = $_POST;
    }

    $allowedKeys = [
        'default_currency', 'timezone', 'date_format', 'company_name',
        'company_logo', 'default_theme', 'company_email', 'company_phone', 'tax_number',
        'company_address'
    ];

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) 
                               VALUES (:setting_key, :setting_value) 
                               ON DUPLICATE KEY UPDATE setting_value = :setting_value_update");
        foreach ($data as $key => $val) {
            if (in_array($key, $allowedKeys)) {
                $stmt->execute([
                    'setting_key' => $key, 
                    'setting_value' => (string)$val,
                    'setting_value_update' => (string)$val
                ]);
            }
        }
        $pdo->commit();

        $updatedSettings = getSystemSettings($pdo);
        sendResponse([
            'status' => 'success',
            'message' => 'Settings updated successfully!',
            'settings' => $updatedSettings
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

sendResponse(['status' => 'error', 'message' => 'Method not allowed'], 405);
