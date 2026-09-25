<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $transactionId = intval($_POST['transaction_id'] ?? 0);

    // 1. Direct Multipart File Upload
    $file = $_FILES['attachment'] ?? $_FILES['file'] ?? null;
    
    if ($file && $file['error'] === UPLOAD_ERR_OK) {
        $origName = basename($file['name']);
        $fileSize = $file['size'];
        $fileType = mime_content_type($file['tmp_name']) ?: $file['type'];
        
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
        
        if (!in_array($ext, $allowedExts)) {
            sendResponse(['status' => 'error', 'message' => 'Invalid file type. Allowed: JPG, PNG, WEBP, PDF, DOCX'], 400);
        }

        // Limit size to 15MB
        if ($fileSize > 15 * 1024 * 1024) {
            sendResponse(['status' => 'error', 'message' => 'File exceeds maximum 15MB size limit'], 400);
        }

        $newFileName = 'receipt_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        $destPath = $uploadDir . $newFileName;

        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            $attachmentId = null;
            if ($transactionId > 0) {
                $stmt = $pdo->prepare("INSERT INTO attachments (transaction_id, file_name, file_path, file_type, file_size) VALUES (:tx_id, :fname, :fpath, :ftype, :fsize)");
                $stmt->execute([
                    'tx_id' => $transactionId,
                    'fname' => $origName,
                    'fpath' => 'uploads/' . $newFileName,
                    'ftype' => $fileType,
                    'fsize' => $fileSize
                ]);
                $attachmentId = $pdo->lastInsertId();
            }

            // Determine Base URL
            $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost:3031';
            $fileUrl = "$protocol://$host/uploads/$newFileName";

            sendResponse([
                'status' => 'success',
                'message' => 'File uploaded successfully',
                'data' => [
                    'id' => $attachmentId,
                    'file_name' => $origName,
                    'file_path' => 'uploads/' . $newFileName,
                    'file_url' => $fileUrl,
                    'file_type' => $fileType,
                    'file_size' => $fileSize
                ]
            ]);
        } else {
            sendResponse(['status' => 'error', 'message' => 'Failed to save uploaded file'], 500);
        }
    }

    // 2. Base64 Upload (Common from Mobile Apps)
    $data = getRequestBody();
    if (!empty($data['base64'])) {
        $base64 = $data['base64'];
        $origName = $data['file_name'] ?? ('mobile_receipt_' . time() . '.jpg');
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION)) ?: 'jpg';
        
        // Remove base64 header if present
        if (preg_match('/^data:image\/(\w+);base64,/', $base64, $typeMatch)) {
            $base64 = substr($base64, strpos($base64, ',') + 1);
            $ext = strtolower($typeMatch[1]);
        }

        $decodedData = base64_decode($base64);
        if ($decodedData === false) {
            sendResponse(['status' => 'error', 'message' => 'Invalid base64 payload'], 400);
        }

        $newFileName = 'mobile_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        $destPath = $uploadDir . $newFileName;
        file_put_contents($destPath, $decodedData);
        $fileSize = strlen($decodedData);
        $fileType = 'image/' . $ext;

        $attachmentId = null;
        $tId = intval($data['transaction_id'] ?? 0);
        if ($tId > 0) {
            $stmt = $pdo->prepare("INSERT INTO attachments (transaction_id, file_name, file_path, file_type, file_size) VALUES (:tx_id, :fname, :fpath, :ftype, :fsize)");
            $stmt->execute([
                'tx_id' => $tId,
                'fname' => $origName,
                'fpath' => 'uploads/' . $newFileName,
                'ftype' => $fileType,
                'fsize' => $fileSize
            ]);
            $attachmentId = $pdo->lastInsertId();
        }

        $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost:3031';
        $fileUrl = "$protocol://$host/uploads/$newFileName";

        sendResponse([
            'status' => 'success',
            'message' => 'Base64 image uploaded successfully',
            'data' => [
                'id' => $attachmentId,
                'file_name' => $origName,
                'file_path' => 'uploads/' . $newFileName,
                'file_url' => $fileUrl,
                'file_type' => $fileType,
                'file_size' => $fileSize
            ]
        ]);
    }

    sendResponse(['status' => 'error', 'message' => 'No file provided'], 400);
}

sendResponse(['status' => 'error', 'message' => 'Method not allowed'], 405);
