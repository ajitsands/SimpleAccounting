<?php
/**
 * Simple Accounting System - Unified Router and Gateway
 */

// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = trim($requestUri, '/');

// Serve static uploads directly if requested
if (strpos($path, 'uploads/') === 0) {
    $filePath = __DIR__ . '/' . $path;
    if (file_exists($filePath)) {
        $mime = mime_content_type($filePath);
        header("Content-Type: $mime");
        readfile($filePath);
        exit();
    }
}

// Route API endpoints
$apiMap = [
    'api/settings' => __DIR__ . '/api/settings.php',
    'api/categories' => __DIR__ . '/api/categories.php',
    'api/accounts' => __DIR__ . '/api/accounts.php',
    'api/transactions' => __DIR__ . '/api/transactions.php',
    'api/upload' => __DIR__ . '/api/upload.php',
    'api/reports' => __DIR__ . '/api/reports.php',
    'api/export_excel' => __DIR__ . '/api/export_excel.php',
    'api/migrate' => __DIR__ . '/backend/db/migrate_and_seed.php'
];

foreach ($apiMap as $route => $file) {
    if ($path === $route || $path === $route . '.php' || strpos($path, $route . '/') === 0) {
        require $file;
        exit();
    }
}

// Check for web frontend assets (in dist/assets/ or dist/)
if (strpos($path, 'assets/') === 0 || strpos($path, 'dist/assets/') === 0) {
    $cleanPath = preg_replace('#^dist/#', '', $path);
    $assetPath = __DIR__ . '/dist/' . $cleanPath;
    if (file_exists($assetPath)) {
        $ext = strtolower(pathinfo($assetPath, PATHINFO_EXTENSION));
        $mimes = [
            'js' => 'application/javascript',
            'css' => 'text/css',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'svg' => 'image/svg+xml',
            'json' => 'application/json',
            'ico' => 'image/x-icon',
            'woff2' => 'font/woff2',
            'woff' => 'font/woff',
            'ttf' => 'font/ttf'
        ];
        $contentType = $mimes[$ext] ?? 'application/octet-stream';
        header("Content-Type: $contentType");
        readfile($assetPath);
        exit();
    }
}

// Serve Web Frontend SPA (dist/index.html) if available
$distIndex = __DIR__ . '/dist/index.html';
if (file_exists($distIndex)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($distIndex);
    exit();
}

// Fallback: Health check and API system info at root
header('Content-Type: application/json');
echo json_encode([
    'system' => 'SaNDSLab Simple Accounting API',
    'version' => '1.0.0',
    'status' => 'operational',
    'default_currency' => 'BHD (Bahraini Dinar)',
    'timezone' => date_default_timezone_get(),
    'endpoints' => [
        'settings' => '/api/settings.php',
        'categories' => '/api/categories.php',
        'accounts' => '/api/accounts.php',
        'transactions' => '/api/transactions.php',
        'upload' => '/api/upload.php',
        'reports' => '/api/reports.php',
        'export_excel' => '/api/export_excel.php',
        'migrate' => '/api/migrate.php'
    ]
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

