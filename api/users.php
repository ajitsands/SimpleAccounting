<?php
/**
 * Simple Accounting System - User Management API
 * Accessible by Admin users only
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET /api/users.php
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT id, username, email, full_name, role, status, last_login, created_at FROM users ORDER BY id ASC");
    $users = $stmt->fetchAll();
    sendResponse([
        'status' => 'success',
        'data' => $users
    ]);
}

// POST /api/users.php (Create User)
if ($method === 'POST') {
    $body = getRequestBody();
    $username = strtolower(trim($body['username'] ?? ''));
    $email = trim($body['email'] ?? '');
    $fullName = trim($body['full_name'] ?? '');
    $password = trim($body['password'] ?? '');
    $role = in_array($body['role'] ?? '', ['admin', 'user', 'auditor']) ? $body['role'] : 'user';

    if (empty($username) || empty($fullName) || empty($password)) {
        sendResponse(['status' => 'error', 'message' => 'Username, full name, and password are required'], 400);
    }

    if (strlen($password) < 4) {
        sendResponse(['status' => 'error', 'message' => 'Password must be at least 4 characters long'], 400);
    }

    // Check existing username
    $check = $pdo->prepare("SELECT id FROM users WHERE username = :username");
    $check->execute(['username' => $username]);
    if ($check->fetch()) {
        sendResponse(['status' => 'error', 'message' => 'Username already exists'], 409);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (username, email, full_name, password, role, status) VALUES (:username, :email, :full_name, :password, :role, 'active')");
    $stmt->execute([
        'username' => $username,
        'email' => $email,
        'full_name' => $fullName,
        'password' => $hash,
        'role' => $role
    ]);

    sendResponse([
        'status' => 'success',
        'message' => 'User created successfully',
        'id' => (int)$pdo->lastInsertId()
    ], 201);
}

// PUT /api/users.php (Update User)
if ($method === 'PUT') {
    $body = getRequestBody();
    $id = (int)($body['id'] ?? 0);
    $email = trim($body['email'] ?? '');
    $fullName = trim($body['full_name'] ?? '');
    $role = in_array($body['role'] ?? '', ['admin', 'user', 'auditor']) ? $body['role'] : 'user';
    $status = in_array($body['status'] ?? '', ['active', 'inactive']) ? $body['status'] : 'active';
    $password = trim($body['password'] ?? '');

    if ($id <= 0 || empty($fullName)) {
        sendResponse(['status' => 'error', 'message' => 'Valid User ID and full name are required'], 400);
    }

    if (!empty($password)) {
        if (strlen($password) < 4) {
            sendResponse(['status' => 'error', 'message' => 'Password must be at least 4 characters long'], 400);
        }
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET email = :email, full_name = :full_name, role = :role, status = :status, password = :password, auth_token = NULL WHERE id = :id");
        $stmt->execute([
            'email' => $email,
            'full_name' => $fullName,
            'role' => $role,
            'status' => $status,
            'password' => $hash,
            'id' => $id
        ]);
    } else {
        $stmt = $pdo->prepare("UPDATE users SET email = :email, full_name = :full_name, role = :role, status = :status WHERE id = :id");
        $stmt->execute([
            'email' => $email,
            'full_name' => $fullName,
            'role' => $role,
            'status' => $status,
            'id' => $id
        ]);
    }

    sendResponse([
        'status' => 'success',
        'message' => 'User updated successfully'
    ]);
}

// DELETE /api/users.php?id=X (Deactivate / Delete)
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        sendResponse(['status' => 'error', 'message' => 'Invalid User ID'], 400);
    }

    // Deactivate user
    $stmt = $pdo->prepare("UPDATE users SET status = 'inactive', auth_token = NULL WHERE id = :id");
    $stmt->execute(['id' => $id]);

    sendResponse([
        'status' => 'success',
        'message' => 'User deactivated successfully'
    ]);
}

sendResponse(['status' => 'error', 'message' => 'Method not allowed'], 405);
