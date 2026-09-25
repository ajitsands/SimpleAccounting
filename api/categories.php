<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $type = isset($_GET['type']) ? trim($_GET['type']) : '';
    $sql = "SELECT * FROM categories WHERE is_active = 1";
    $params = [];
    if (!empty($type)) {
        $sql .= " AND type = :type";
        $params['type'] = $type;
    }
    $sql .= " ORDER BY type ASC, name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $categories = $stmt->fetchAll();

    sendResponse(['status' => 'success', 'data' => $categories]);
}

if ($method === 'POST') {
    $data = getRequestBody();
    if (empty($data)) $data = $_POST;

    $name = trim($data['name'] ?? '');
    $type = trim($data['type'] ?? 'expense');
    $icon = trim($data['icon'] ?? 'Tag');
    $color = trim($data['color'] ?? '#3B82F6');
    $description = trim($data['description'] ?? '');

    if (empty($name)) {
        sendResponse(['status' => 'error', 'message' => 'Category name is required'], 400);
    }

    $stmt = $pdo->prepare("INSERT INTO categories (name, type, icon, color, description) VALUES (:name, :type, :icon, :color, :description)");
    $stmt->execute([
        'name' => $name,
        'type' => $type,
        'icon' => $icon,
        'color' => $color,
        'description' => $description
    ]);

    $id = $pdo->lastInsertId();
    sendResponse(['status' => 'success', 'message' => 'Category created', 'data' => ['id' => $id, 'name' => $name, 'type' => $type]]);
}

if ($method === 'PUT') {
    $data = getRequestBody();
    $id = intval($data['id'] ?? 0);
    if ($id <= 0) {
        sendResponse(['status' => 'error', 'message' => 'Valid category ID required'], 400);
    }

    $stmt = $pdo->prepare("UPDATE categories SET name = :name, type = :type, icon = :icon, color = :color, description = :description WHERE id = :id");
    $stmt->execute([
        'id' => $id,
        'name' => trim($data['name'] ?? ''),
        'type' => trim($data['type'] ?? 'expense'),
        'icon' => trim($data['icon'] ?? 'Tag'),
        'color' => trim($data['color'] ?? '#3B82F6'),
        'description' => trim($data['description'] ?? '')
    ]);

    sendResponse(['status' => 'success', 'message' => 'Category updated']);
}

if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if ($id <= 0) {
        $data = getRequestBody();
        $id = intval($data['id'] ?? 0);
    }

    if ($id <= 0) {
        sendResponse(['status' => 'error', 'message' => 'Valid category ID required'], 400);
    }

    // Soft delete
    $stmt = $pdo->prepare("UPDATE categories SET is_active = 0 WHERE id = :id");
    $stmt->execute(['id' => $id]);

    sendResponse(['status' => 'success', 'message' => 'Category deleted']);
}

sendResponse(['status' => 'error', 'message' => 'Method not allowed'], 405);
