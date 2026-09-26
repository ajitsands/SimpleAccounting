<?php
/**
 * Simple Accounting System - Authentication API
 * Supports Web and Mobile Auth with Role Enforcement (Admin, User, Auditor)
 */

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'me';

if ($action === 'login') {
    $body = getRequestBody();
    $username = trim($body['username'] ?? '');
    $password = trim($body['password'] ?? '');
    $clientType = strtolower(trim($body['client_type'] ?? 'web')); // 'web' or 'mobile'

    if (empty($username) || empty($password)) {
        sendResponse([
            'status' => 'error',
            'message' => 'Username and password are required'
        ], 400);
    }

    // Lookup user
    $stmt = $pdo->prepare("SELECT id, username, email, full_name, password, role, status FROM users WHERE username = :username LIMIT 1");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        sendResponse([
            'status' => 'error',
            'message' => 'Invalid username or password'
        ], 401);
    }

    if ($user['status'] !== 'active') {
        sendResponse([
            'status' => 'error',
            'message' => 'Your account has been deactivated. Please contact your administrator.'
        ], 403);
    }

    // ENFORCE AUDITOR RESTRICTION: No mobile login for Auditors
    if ($clientType === 'mobile' && $user['role'] === 'auditor') {
        sendResponse([
            'status' => 'error',
            'message' => 'Auditor access is restricted to the Web Portal only for audit review and data exports.'
        ], 403);
    }

    // Generate session auth token
    $token = bin2hex(random_bytes(32));
    $stmtToken = $pdo->prepare("UPDATE users SET auth_token = :token, last_login = NOW() WHERE id = :id");
    $stmtToken->execute([
        'token' => $token,
        'id' => $user['id']
    ]);

    unset($user['password']);

    sendResponse([
        'status' => 'success',
        'message' => 'Login successful',
        'token' => $token,
        'user' => [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'full_name' => $user['full_name'],
            'role' => $user['role'],
            'status' => $user['status']
        ]
    ]);
}

if ($action === 'me') {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $token = '';

    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
    } else {
        $token = trim($_GET['token'] ?? '');
    }

    if (empty($token)) {
        sendResponse([
            'status' => 'error',
            'message' => 'Unauthenticated'
        ], 401);
    }

    $stmt = $pdo->prepare("SELECT id, username, email, full_name, role, status, last_login FROM users WHERE auth_token = :token AND status = 'active' LIMIT 1");
    $stmt->execute(['token' => $token]);
    $user = $stmt->fetch();

    if (!$user) {
        sendResponse([
            'status' => 'error',
            'message' => 'Invalid or expired session token'
        ], 401);
    }

    sendResponse([
        'status' => 'success',
        'user' => [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'full_name' => $user['full_name'],
            'role' => $user['role'],
            'status' => $user['status'],
            'last_login' => $user['last_login']
        ]
    ]);
}

if ($action === 'logout') {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $token = '';

    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
    } else {
        $token = trim($_GET['token'] ?? '');
    }

    if (!empty($token)) {
        $stmt = $pdo->prepare("UPDATE users SET auth_token = NULL WHERE auth_token = :token");
        $stmt->execute(['token' => $token]);
    }

    sendResponse([
        'status' => 'success',
        'message' => 'Logged out successfully'
    ]);
}

sendResponse(['status' => 'error', 'message' => 'Invalid auth action'], 400);
