<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Helper: Compute Fiscal Year (Accounting Year: April 1 to March 31)
function getFiscalYear($dateStr) {
    $time = strtotime($dateStr ?: date('Y-m-d'));
    $year = (int)date('Y', $time);
    $month = (int)date('n', $time);

    if ($month >= 4) {
        $startYear = $year;
        $endYear = $year + 1;
    } else {
        $startYear = $year - 1;
        $endYear = $year;
    }

    return substr((string)$startYear, -2) . '-' . substr((string)$endYear, -2);
}

// Helper: Get Prefix for Voucher Type
function getVoucherPrefix($type) {
    switch ($type) {
        case 'income': return 'RCP';
        case 'expense': return 'PV';
        case 'bank_transfer': return 'TRF';
        default: return 'JV';
    }
}

// Helper: Generate Sequential Voucher Number per Fiscal Year (Safe against back-dated entries)
function generateVoucherNumber($pdo, $type, $dateStr) {
    $prefix = getVoucherPrefix($type);
    $fy = getFiscalYear($dateStr);
    
    // Find all existing vouchers for this prefix and fiscal year to determine highest sequence
    $stmt = $pdo->prepare("
        SELECT voucher_no FROM transactions 
        WHERE fiscal_year = :fy AND type = :type AND voucher_no LIKE :pattern
    ");
    $stmt->execute([
        'fy' => $fy,
        'type' => $type,
        'pattern' => $prefix . '-' . $fy . '-%'
    ]);
    $existing = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $maxSeq = 0;
    foreach ($existing as $v) {
        // Extract sequence digits e.g. PV-26-27-00008 or PV-26-27-00008A
        if (preg_match('/-(\d{1,6})(?:[A-Za-z.\-_0-9]*)?$/', $v, $matches)) {
            $seq = intval($matches[1]);
            if ($seq > $maxSeq) $maxSeq = $seq;
        }
    }

    $nextNum = max($maxSeq + 1, count($existing) + 1);

    // Ensure candidate is unique in DB
    while (true) {
        $candidate = sprintf("%s-%s-%05d", $prefix, $fy, $nextNum);
        $check = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE voucher_no = :vno");
        $check->execute(['vno' => $candidate]);
        if ($check->fetchColumn() == 0) {
            return $candidate;
        }
        $nextNum++;
    }
}

if ($method === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;

    if ($id > 0) {
        $stmt = $pdo->prepare("
            SELECT t.*, 
                   c.name as category_name, c.color as category_color, c.icon as category_icon,
                   fa.account_name as from_account_name, fa.account_type as from_account_type,
                   ta.account_name as to_account_name, ta.account_type as to_account_type
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN accounts fa ON t.from_account_id = fa.id
            LEFT JOIN accounts ta ON t.to_account_id = ta.id
            WHERE t.id = :id
        ");
        $stmt->execute(['id' => $id]);
        $tx = $stmt->fetch();

        if (!$tx) {
            sendResponse(['status' => 'error', 'message' => 'Transaction not found'], 404);
        }

        // Line Items
        $stmtItems = $pdo->prepare("
            SELECT ti.*, c.name as category_name, c.color as category_color 
            FROM transaction_items ti 
            LEFT JOIN categories c ON ti.category_id = c.id 
            WHERE ti.transaction_id = :id 
            ORDER BY ti.id ASC
        ");
        $stmtItems->execute(['id' => $id]);
        $tx['items'] = $stmtItems->fetchAll();

        // Attachments
        $stmtAtt = $pdo->prepare("SELECT * FROM attachments WHERE transaction_id = :id ORDER BY id ASC");
        $stmtAtt->execute(['id' => $id]);
        $tx['attachments'] = $stmtAtt->fetchAll();

        sendResponse(['status' => 'success', 'data' => $tx]);
    }

    // List with Filters
    $type = trim($_GET['type'] ?? '');
    $categoryId = intval($_GET['category_id'] ?? 0);
    $accountId = intval($_GET['account_id'] ?? 0);
    $dateFrom = trim($_GET['date_from'] ?? '');
    $dateTo = trim($_GET['date_to'] ?? '');
    $fiscalYear = trim($_GET['fiscal_year'] ?? '');
    $search = trim($_GET['search'] ?? $_GET['q'] ?? '');
    $status = trim($_GET['status'] ?? '');
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(500, max(1, intval($_GET['limit'] ?? 100)));
    $offset = ($page - 1) * $limit;

    $where = ["1=1"];
    $params = [];

    if (!empty($type) && in_array($type, ['expense', 'income', 'bank_transfer', 'other'])) {
        $where[] = "t.type = :type";
        $params['type'] = $type;
    }

    if ($categoryId > 0) {
        $where[] = "t.category_id = :category_id";
        $params['category_id'] = $categoryId;
    }

    if ($accountId > 0) {
        $where[] = "(t.from_account_id = :acc_from OR t.to_account_id = :acc_to)";
        $params['acc_from'] = $accountId;
        $params['acc_to'] = $accountId;
    }

    if (!empty($dateFrom)) {
        $where[] = "t.transaction_date >= :date_from";
        $params['date_from'] = $dateFrom;
    }

    if (!empty($dateTo)) {
        $where[] = "t.transaction_date <= :date_to";
        $params['date_to'] = $dateTo;
    }

    if (!empty($fiscalYear)) {
        $where[] = "t.fiscal_year = :fiscal_year";
        $params['fiscal_year'] = $fiscalYear;
    }

    if (!empty($status)) {
        $where[] = "t.status = :status";
        $params['status'] = $status;
    }

    if (!empty($search)) {
        $where[] = "(t.payee_payer LIKE :search1 OR t.reference_number LIKE :search2 OR t.voucher_no LIKE :search3 OR t.notes LIKE :search4 OR c.name LIKE :search5)";
        $params['search1'] = "%$search%";
        $params['search2'] = "%$search%";
        $params['search3'] = "%$search%";
        $params['search4'] = "%$search%";
        $params['search5'] = "%$search%";
    }

    $whereClause = implode(" AND ", $where);

    // Total Count
    $countStmt = $pdo->prepare("
        SELECT COUNT(t.id) 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE $whereClause
    ");
    $countStmt->execute($params);
    $totalCount = (int)$countStmt->fetchColumn();

    // Query Data
    $sql = "
        SELECT t.*, 
               c.name as category_name, c.color as category_color, c.icon as category_icon,
               fa.account_name as from_account_name, fa.account_type as from_account_type,
               ta.account_name as to_account_name, ta.account_type as to_account_type,
               (SELECT COUNT(att.id) FROM attachments att WHERE att.transaction_id = t.id) as attachment_count,
               (SELECT COUNT(ti.id) FROM transaction_items ti WHERE ti.transaction_id = t.id) as item_count
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN accounts fa ON t.from_account_id = fa.id
        LEFT JOIN accounts ta ON t.to_account_id = ta.id
        WHERE $whereClause
        ORDER BY t.transaction_date DESC, t.id DESC
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $transactions = $stmt->fetchAll();

    // Load attachments and line items for returned transactions
    if (!empty($transactions)) {
        $txIds = array_column($transactions, 'id');
        $inQuery = implode(',', array_fill(0, count($txIds), '?'));

        // Load Attachments
        $stmtAtt = $pdo->prepare("SELECT * FROM attachments WHERE transaction_id IN ($inQuery) ORDER BY id ASC");
        $stmtAtt->execute($txIds);
        $allAttachments = $stmtAtt->fetchAll();

        $attachmentsByTx = [];
        $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost:3031';
        
        foreach ($allAttachments as $att) {
            $att['file_url'] = "$protocol://$host/" . $att['file_path'];
            $attachmentsByTx[$att['transaction_id']][] = $att;
        }

        // Load Line Items
        $stmtItems = $pdo->prepare("
            SELECT ti.*, c.name as category_name, c.color as category_color 
            FROM transaction_items ti 
            LEFT JOIN categories c ON ti.category_id = c.id 
            WHERE ti.transaction_id IN ($inQuery) 
            ORDER BY ti.id ASC
        ");
        $stmtItems->execute($txIds);
        $allItems = $stmtItems->fetchAll();

        $itemsByTx = [];
        foreach ($allItems as $item) {
            $itemsByTx[$item['transaction_id']][] = $item;
        }

        foreach ($transactions as &$tx) {
            $tx['attachments'] = $attachmentsByTx[$tx['id']] ?? [];
            $tx['items'] = $itemsByTx[$tx['id']] ?? [];
        }
    }

    sendResponse([
        'status' => 'success',
        'data' => $transactions,
        'pagination' => [
            'total' => $totalCount,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($totalCount / $limit)
        ]
    ]);
}

if ($method === 'POST') {
    $data = getRequestBody();
    if (empty($data)) $data = $_POST;

    // Batch Action: Re-Sequence Voucher Numbers Chronologically by Date
    $action = trim($_GET['action'] ?? $data['action'] ?? '');
    if ($action === 'resequence') {
        $targetFY = trim($data['fiscal_year'] ?? $_GET['fiscal_year'] ?? '');
        $targetType = trim($data['type'] ?? $_GET['type'] ?? ''); // 'all', 'expense', 'income', 'bank_transfer', 'other'

        $where = ["1=1"];
        $params = [];

        if (!empty($targetFY) && $targetFY !== 'all') {
            $where[] = "fiscal_year = :fy";
            $params['fy'] = $targetFY;
        }
        if (!empty($targetType) && $targetType !== 'all') {
            $where[] = "type = :type";
            $params['type'] = $targetType;
        }

        $whereClause = implode(" AND ", $where);

        $stmt = $pdo->prepare("
            SELECT id, transaction_date, type, voucher_no, fiscal_year 
            FROM transactions 
            WHERE $whereClause 
            ORDER BY transaction_date ASC, created_at ASC, id ASC
        ");
        $stmt->execute($params);
        $txList = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($txList)) {
            sendResponse([
                'status' => 'success',
                'message' => 'No matching transactions found to re-sequence.',
                'updated_count' => 0
            ]);
        }

        $pdo->beginTransaction();
        try {
            $counters = [];
            $updatedCount = 0;
            $updateStmt = $pdo->prepare("UPDATE transactions SET voucher_no = :vno, fiscal_year = :fy WHERE id = :id");

            foreach ($txList as $tx) {
                $fy = getFiscalYear($tx['transaction_date']);
                $type = $tx['type'];
                $prefix = getVoucherPrefix($type);
                $key = $fy . '_' . $type;

                if (!isset($counters[$key])) {
                    $counters[$key] = 1;
                } else {
                    $counters[$key]++;
                }

                $newVoucherNo = sprintf("%s-%s-%05d", $prefix, $fy, $counters[$key]);
                
                $updateStmt->execute([
                    'vno' => $newVoucherNo,
                    'fy' => $fy,
                    'id' => $tx['id']
                ]);
                $updatedCount++;
            }

            $pdo->commit();

            sendResponse([
                'status' => 'success',
                'message' => "Successfully re-sequenced {$updatedCount} voucher numbers chronologically by transaction date.",
                'updated_count' => $updatedCount
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendResponse(['status' => 'error', 'message' => 'Failed to re-sequence vouchers: ' . $e->getMessage()], 500);
        }
    }

    $type = trim($data['type'] ?? 'expense');
    $date = trim($data['transaction_date'] ?? date('Y-m-d'));
    $categoryId = !empty($data['category_id']) ? intval($data['category_id']) : null;
    $fromAccountId = !empty($data['from_account_id']) ? intval($data['from_account_id']) : null;
    $toAccountId = !empty($data['to_account_id']) ? intval($data['to_account_id']) : null;
    $payeePayer = trim($data['payee_payer'] ?? '');
    $paymentMethod = trim($data['payment_method'] ?? 'Cash');
    $referenceNumber = trim($data['reference_number'] ?? '');
    $notes = trim($data['notes'] ?? '');
    $status = trim($data['status'] ?? 'completed');
    $attachmentIds = $data['attachment_ids'] ?? [];
    $rawItems = $data['items'] ?? [];

    if (!in_array($type, ['expense', 'income', 'bank_transfer', 'other'])) {
        sendResponse(['status' => 'error', 'message' => 'Invalid transaction type'], 400);
    }

    // Line items processing & amount calculation
    $items = [];
    $totalAmount = 0;

    if (!empty($rawItems) && is_array($rawItems)) {
        foreach ($rawItems as $it) {
            $itemDesc = trim($it['item_description'] ?? $it['description'] ?? '');
            $qty = floatval($it['quantity'] ?? 1);
            if ($qty <= 0) $qty = 1;
            $unitPrice = floatval($it['unit_price'] ?? 0);
            $itemAmt = isset($it['amount']) && floatval($it['amount']) > 0 
                ? floatval($it['amount']) 
                : ($qty * $unitPrice);
            $catId = !empty($it['category_id']) ? intval($it['category_id']) : $categoryId;
            $itemNotes = trim($it['notes'] ?? '');

            if ($itemAmt > 0 || !empty($itemDesc)) {
                $items[] = [
                    'category_id' => $catId,
                    'item_description' => $itemDesc ?: 'Item',
                    'quantity' => $qty,
                    'unit_price' => $unitPrice > 0 ? $unitPrice : $itemAmt,
                    'amount' => $itemAmt,
                    'notes' => $itemNotes
                ];
                $totalAmount += $itemAmt;
            }
        }
    }

    // If no line items provided, use the global amount field
    $amount = floatval($data['amount'] ?? 0);
    if ($totalAmount > 0) {
        $amount = $totalAmount;
    } elseif ($amount > 0) {
        // Create 1 default line item
        $items[] = [
            'category_id' => $categoryId,
            'item_description' => $payeePayer ?: ($type === 'bank_transfer' ? 'Fund Transfer' : 'General Item'),
            'quantity' => 1.00,
            'unit_price' => $amount,
            'amount' => $amount,
            'notes' => $notes
        ];
    }

    if ($amount <= 0) {
        sendResponse(['status' => 'error', 'message' => 'Amount must be greater than 0'], 400);
    }

    // Fiscal Year & Voucher Number Calculation
    $fiscalYear = getFiscalYear($date);
    $voucherNo = trim($data['voucher_no'] ?? '');
    if (empty($voucherNo)) {
        $voucherNo = generateVoucherNumber($pdo, $type, $date);
    }

    // Default account assignment if not provided
    if ($type === 'expense' && empty($fromAccountId)) {
        $defaultAcc = $pdo->query("SELECT id FROM accounts WHERE is_active = 1 ORDER BY id ASC LIMIT 1")->fetchColumn();
        $fromAccountId = $defaultAcc ?: null;
    } elseif ($type === 'income' && empty($toAccountId)) {
        $defaultAcc = $pdo->query("SELECT id FROM accounts WHERE is_active = 1 ORDER BY id ASC LIMIT 1")->fetchColumn();
        $toAccountId = $defaultAcc ?: null;
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("
            INSERT INTO transactions (
                transaction_date, type, amount, category_id, from_account_id, to_account_id, 
                payee_payer, payment_method, reference_number, voucher_no, fiscal_year, notes, status
            ) 
            VALUES (
                :tdate, :ttype, :amount, :cat_id, :from_acc, :to_acc, 
                :payee, :method, :ref_no, :vno, :fy, :notes, :status
            )
        ");
        $stmt->execute([
            'tdate' => $date,
            'ttype' => $type,
            'amount' => $amount,
            'cat_id' => $categoryId,
            'from_acc' => $fromAccountId,
            'to_acc' => $toAccountId,
            'payee' => $payeePayer,
            'method' => $paymentMethod,
            'ref_no' => $referenceNumber,
            'vno' => $voucherNo,
            'fy' => $fiscalYear,
            'notes' => $notes,
            'status' => $status
        ]);
        $txId = $pdo->lastInsertId();

        // Insert Line Items
        $stmtItem = $pdo->prepare("
            INSERT INTO transaction_items (transaction_id, category_id, item_description, quantity, unit_price, amount, notes)
            VALUES (:tx_id, :cat_id, :item_desc, :qty, :unit_price, :amt, :notes)
        ");
        foreach ($items as $it) {
            $stmtItem->execute([
                'tx_id' => $txId,
                'cat_id' => $it['category_id'],
                'item_desc' => $it['item_description'],
                'qty' => $it['quantity'],
                'unit_price' => $it['unit_price'],
                'amt' => $it['amount'],
                'notes' => $it['notes']
            ]);
        }

        // Link already uploaded attachment IDs
        if (!empty($attachmentIds) && is_array($attachmentIds)) {
            $stmtAtt = $pdo->prepare("UPDATE attachments SET transaction_id = :tx_id WHERE id = :att_id");
            foreach ($attachmentIds as $attId) {
                $stmtAtt->execute(['tx_id' => $txId, 'att_id' => intval($attId)]);
            }
        }

        // Direct base64 attachment or file upload if supplied in request
        if (!empty($data['attachment_base64'])) {
            $base64 = $data['attachment_base64'];
            $origName = $data['attachment_filename'] ?? ('receipt_' . time() . '.jpg');
            $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION)) ?: 'jpg';
            if (preg_match('/^data:image\/(\w+);base64,/', $base64, $m)) {
                $base64 = substr($base64, strpos($base64, ',') + 1);
                $ext = strtolower($m[1]);
            }
            $decoded = base64_decode($base64);
            if ($decoded !== false) {
                $newFileName = 'tx_' . $txId . '_' . time() . '.' . $ext;
                file_put_contents($uploadDir . $newFileName, $decoded);
                
                $stmtNewAtt = $pdo->prepare("INSERT INTO attachments (transaction_id, file_name, file_path, file_type, file_size) VALUES (:tx_id, :fname, :fpath, :ftype, :fsize)");
                $stmtNewAtt->execute([
                    'tx_id' => $txId,
                    'fname' => $origName,
                    'fpath' => 'uploads/' . $newFileName,
                    'ftype' => 'image/' . $ext,
                    'fsize' => strlen($decoded)
                ]);
            }
        }

        $pdo->commit();

        sendResponse([
            'status' => 'success',
            'message' => 'Transaction saved successfully',
            'data' => [
                'id' => $txId, 
                'amount' => $amount, 
                'type' => $type, 
                'date' => $date,
                'voucher_no' => $voucherNo,
                'fiscal_year' => $fiscalYear,
                'items_count' => count($items)
            ]
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

if ($method === 'PUT') {
    $data = getRequestBody();
    $id = intval($data['id'] ?? 0);
    if ($id <= 0) {
        sendResponse(['status' => 'error', 'message' => 'Valid Transaction ID required'], 400);
    }

    $type = trim($data['type'] ?? 'expense');
    $date = trim($data['transaction_date'] ?? date('Y-m-d'));
    $categoryId = !empty($data['category_id']) ? intval($data['category_id']) : null;
    $fromAccountId = !empty($data['from_account_id']) ? intval($data['from_account_id']) : null;
    $toAccountId = !empty($data['to_account_id']) ? intval($data['to_account_id']) : null;
    $payeePayer = trim($data['payee_payer'] ?? '');
    $paymentMethod = trim($data['payment_method'] ?? 'Cash');
    $referenceNumber = trim($data['reference_number'] ?? '');
    $notes = trim($data['notes'] ?? '');
    $status = trim($data['status'] ?? 'completed');
    $rawItems = $data['items'] ?? null;

    // Line items processing
    $items = [];
    $totalAmount = 0;

    if (!empty($rawItems) && is_array($rawItems)) {
        foreach ($rawItems as $it) {
            $itemDesc = trim($it['item_description'] ?? $it['description'] ?? '');
            $qty = floatval($it['quantity'] ?? 1);
            if ($qty <= 0) $qty = 1;
            $unitPrice = floatval($it['unit_price'] ?? 0);
            $itemAmt = isset($it['amount']) && floatval($it['amount']) > 0 
                ? floatval($it['amount']) 
                : ($qty * $unitPrice);
            $catId = !empty($it['category_id']) ? intval($it['category_id']) : $categoryId;
            $itemNotes = trim($it['notes'] ?? '');

            if ($itemAmt > 0 || !empty($itemDesc)) {
                $items[] = [
                    'category_id' => $catId,
                    'item_description' => $itemDesc ?: 'Item',
                    'quantity' => $qty,
                    'unit_price' => $unitPrice > 0 ? $unitPrice : $itemAmt,
                    'amount' => $itemAmt,
                    'notes' => $itemNotes
                ];
                $totalAmount += $itemAmt;
            }
        }
    }

    $amount = floatval($data['amount'] ?? 0);
    if ($totalAmount > 0) {
        $amount = $totalAmount;
    }

    $fiscalYear = getFiscalYear($date);
    $voucherNo = trim($data['voucher_no'] ?? '');
    if (empty($voucherNo)) {
        $currVoucher = $pdo->query("SELECT voucher_no FROM transactions WHERE id = $id")->fetchColumn();
        $voucherNo = $currVoucher ?: generateVoucherNumber($pdo, $type, $date);
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("
            UPDATE transactions SET 
                transaction_date = :tdate,
                type = :ttype,
                amount = :amount,
                category_id = :cat_id,
                from_account_id = :from_acc,
                to_account_id = :to_acc,
                payee_payer = :payee,
                payment_method = :method,
                reference_number = :ref_no,
                voucher_no = :vno,
                fiscal_year = :fy,
                notes = :notes,
                status = :status
            WHERE id = :id
        ");

        $stmt->execute([
            'id' => $id,
            'tdate' => $date,
            'ttype' => $type,
            'amount' => $amount,
            'cat_id' => $categoryId,
            'from_acc' => $fromAccountId,
            'to_acc' => $toAccountId,
            'payee' => $payeePayer,
            'method' => $paymentMethod,
            'ref_no' => $referenceNumber,
            'vno' => $voucherNo,
            'fy' => $fiscalYear,
            'notes' => $notes,
            'status' => $status
        ]);

        // If items are supplied in update, replace existing line items
        if (!empty($items)) {
            $pdo->prepare("DELETE FROM transaction_items WHERE transaction_id = :id")->execute(['id' => $id]);
            $stmtItem = $pdo->prepare("
                INSERT INTO transaction_items (transaction_id, category_id, item_description, quantity, unit_price, amount, notes)
                VALUES (:tx_id, :cat_id, :item_desc, :qty, :unit_price, :amt, :notes)
            ");
            foreach ($items as $it) {
                $stmtItem->execute([
                    'tx_id' => $id,
                    'cat_id' => $it['category_id'],
                    'item_desc' => $it['item_description'],
                    'qty' => $it['quantity'],
                    'unit_price' => $it['unit_price'],
                    'amt' => $it['amount'],
                    'notes' => $it['notes']
                ]);
            }
        }

        $pdo->commit();
        sendResponse(['status' => 'success', 'message' => 'Transaction updated successfully', 'voucher_no' => $voucherNo]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if ($id <= 0) {
        $data = getRequestBody();
        $id = intval($data['id'] ?? 0);
    }

    if ($id <= 0) {
        sendResponse(['status' => 'error', 'message' => 'Valid Transaction ID required'], 400);
    }

    // Delete attachments files and records
    $stmtAtt = $pdo->prepare("SELECT file_path FROM attachments WHERE transaction_id = :id");
    $stmtAtt->execute(['id' => $id]);
    $files = $stmtAtt->fetchAll();
    foreach ($files as $f) {
        $fullPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . $f['file_path'];
        if (file_exists($fullPath)) {
            @unlink($fullPath);
        }
    }

    $pdo->prepare("DELETE FROM attachments WHERE transaction_id = :id")->execute(['id' => $id]);
    $pdo->prepare("DELETE FROM transaction_items WHERE transaction_id = :id")->execute(['id' => $id]);
    $pdo->prepare("DELETE FROM transactions WHERE id = :id")->execute(['id' => $id]);

    sendResponse(['status' => 'success', 'message' => 'Transaction, line items and attachments deleted successfully']);
}

sendResponse(['status' => 'error', 'message' => 'Method not allowed'], 405);
