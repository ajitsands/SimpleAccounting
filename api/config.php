<?php
/**
 * Simple Accounting System - Core Configuration & DB Helper
 */

// Enable CORS for web frontend (Vite port 5173, localhost, mobile apps, production)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Credentials
$host = '127.0.0.1';
$dbname = 'simple_accounting';
$user = 'root';
$pass = 'S@nds1@b';

// Auto-switch to production if running on server domain
if (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'sandslab.com') !== false) {
    $dbname = 'sandsl23_simpleacc_db';
    $user = 'sandsl23_simpleacc_user';
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => true
    ]);
} catch (PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit();
}

// Helper: Get Settings Cache
function getSystemSettings($pdo) {
    try {
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
        $settings = [];
        while ($row = $stmt->fetch()) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        return $settings;
    } catch (Exception $e) {
        return [];
    }
}

// Timezone Setup
$settings = getSystemSettings($pdo);
$tz = !empty($settings['timezone']) ? $settings['timezone'] : 'Asia/Bahrain';
date_default_timezone_set($tz);

// Upload Directory
$uploadDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Helper: JSON Response Output
function sendResponse($data, $statusCode = 200) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

// Helper: Parse JSON Request Body
function getRequestBody() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

// Helper: Get Current Authenticated User from Bearer Token
function getAuthenticatedUser($pdo) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $token = '';

    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
    } else {
        $token = trim($_GET['token'] ?? '');
    }

    if (empty($token)) {
        return null;
    }

    $stmt = $pdo->prepare("SELECT id, username, email, full_name, role, status FROM users WHERE auth_token = :token AND status = 'active' LIMIT 1");
    $stmt->execute(['token' => $token]);
    return $stmt->fetch() ?: null;
}

