<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Helper function to recalculate live account balances
function recalculateAccounts($pdo) {
    // Get all accounts (Office Petty Cash / Cash always first, followed by Bank accounts)
    $accounts = $pdo->query("SELECT * FROM accounts WHERE is_active = 1 ORDER BY CASE WHEN account_type = 'cash' OR account_name LIKE '%Petty Cash%' THEN 0 ELSE 1 END, id ASC")->fetchAll();
    
    foreach ($accounts as &$acc) {
        $accId = $acc['id'];
        
        // Income into this account
        $stmtInc = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE to_account_id = :id AND type = 'income' AND status = 'completed'");
        $stmtInc->execute(['id' => $accId]);
        $incomeSum = (float)$stmtInc->fetchColumn();

        // Expense from this account
        $stmtExp = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE from_account_id = :id AND type = 'expense' AND status = 'completed'");
        $stmtExp->execute(['id' => $accId]);
        $expenseSum = (float)$stmtExp->fetchColumn();

        // Other activities from this account
        $stmtOthOut = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE from_account_id = :id AND type = 'other' AND status = 'completed'");
        $stmtOthOut->execute(['id' => $accId]);
        $otherOutSum = (float)$stmtOthOut->fetchColumn();

        // Other activities into this account
        $stmtOthIn = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE to_account_id = :id AND type = 'other' AND status = 'completed'");
        $stmtOthIn->execute(['id' => $accId]);
        $otherInSum = (float)$stmtOthIn->fetchColumn();

        // Bank transfers into this account
        $stmtTrfIn = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE to_account_id = :id AND type = 'bank_transfer' AND status = 'completed'");
        $stmtTrfIn->execute(['id' => $accId]);
        $transferInSum = (float)$stmtTrfIn->fetchColumn();

        // Bank transfers out of this account
        $stmtTrfOut = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE from_account_id = :id AND type = 'bank_transfer' AND status = 'completed'");
        $stmtTrfOut->execute(['id' => $accId]);
        $transferOutSum = (float)$stmtTrfOut->fetchColumn();

        $calcBalance = (float)$acc['initial_balance'] + $incomeSum + $otherInSum + $transferInSum - $expenseSum - $otherOutSum - $transferOutSum;
        $acc['calculated_balance'] = $calcBalance;
        $acc['total_income'] = $incomeSum;
        $acc['total_expense'] = $expenseSum;
        $acc['total_transfers_in'] = $transferInSum;
        $acc['total_transfers_out'] = $transferOutSum;

        // Update current_balance field in DB
        $stmtUp = $pdo->prepare("UPDATE accounts SET current_balance = :bal WHERE id = :id");
        $stmtUp->execute(['bal' => $calcBalance, 'id' => $accId]);
    }
    return $accounts;
}

if ($method === 'GET') {
    $accountId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    // If specific account details and history requested
    if ($accountId > 0) {
        $stmt = $pdo->prepare("SELECT * FROM accounts WHERE id = :id AND is_active = 1");
        $stmt->execute(['id' => $accountId]);
        $account = $stmt->fetch();

        if (!$account) {
            sendResponse(['status' => 'error', 'message' => 'Account not found'], 404);
        }

        // Fetch recent transactions for this account
        $stmtTx = $pdo->prepare("
            SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon,
                   fa.account_name as from_account_name, ta.account_name as to_account_name
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN accounts fa ON t.from_account_id = fa.id
            LEFT JOIN accounts ta ON t.to_account_id = ta.id
            WHERE (t.from_account_id = :id OR t.to_account_id = :id)
            ORDER BY t.transaction_date DESC, t.id DESC
            LIMIT 50
        ");
        $stmtTx->execute(['id' => $accountId]);
        $transactions = $stmtTx->fetchAll();

        sendResponse(['status' => 'success', 'account' => $account, 'transactions' => $transactions]);
    }

    $accounts = recalculateAccounts($pdo);
    sendResponse(['status' => 'success', 'data' => $accounts]);
}

if ($method === 'POST') {
    $data = getRequestBody();
    if (empty($data)) $data = $_POST;

    $accountName = trim($data['account_name'] ?? '');
    $accountType = trim($data['account_type'] ?? 'bank');
    $accountNumber = trim($data['account_number'] ?? '');
    $bankName = trim($data['bank_name'] ?? '');
    $currency = trim($data['currency'] ?? 'BHD');
    $initialBalance = floatval($data['initial_balance'] ?? 0);
    $description = trim($data['description'] ?? '');

    if (empty($accountName)) {
        sendResponse(['status' => 'error', 'message' => 'Account name is required'], 400);
    }

    $stmt = $pdo->prepare("INSERT INTO accounts (account_name, account_type, account_number, bank_name, currency, initial_balance, current_balance, description) 
                           VALUES (:account_name, :account_type, :account_number, :bank_name, :currency, :initial_balance, :current_balance, :description)");
    $stmt->execute([
        'account_name' => $accountName,
        'account_type' => $accountType,
        'account_number' => $accountNumber,
        'bank_name' => $bankName,
        'currency' => $currency,
        'initial_balance' => $initialBalance,
        'current_balance' => $initialBalance,
        'description' => $description
    ]);

    sendResponse(['status' => 'success', 'message' => 'Account created successfully', 'id' => $pdo->lastInsertId()]);
}

if ($method === 'PUT') {
    $data = getRequestBody();
    $id = intval($data['id'] ?? 0);
    if ($id <= 0) {
        sendResponse(['status' => 'error', 'message' => 'Valid Account ID required'], 400);
    }

    $stmt = $pdo->prepare("UPDATE accounts SET 
        account_name = :account_name,
        account_type = :account_type,
        account_number = :account_number,
        bank_name = :bank_name,
        currency = :currency,
        initial_balance = :initial_balance,
        description = :description
        WHERE id = :id");
    
    $stmt->execute([
        'id' => $id,
        'account_name' => trim($data['account_name'] ?? ''),
        'account_type' => trim($data['account_type'] ?? 'bank'),
        'account_number' => trim($data['account_number'] ?? ''),
        'bank_name' => trim($data['bank_name'] ?? ''),
        'currency' => trim($data['currency'] ?? 'BHD'),
        'initial_balance' => floatval($data['initial_balance'] ?? 0),
        'description' => trim($data['description'] ?? '')
    ]);

    recalculateAccounts($pdo);
    sendResponse(['status' => 'success', 'message' => 'Account updated successfully']);
}

if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if ($id <= 0) {
        $data = getRequestBody();
        $id = intval($data['id'] ?? 0);
    }

    if ($id <= 0) {
        sendResponse(['status' => 'error', 'message' => 'Valid Account ID required'], 400);
    }

    $stmt = $pdo->prepare("UPDATE accounts SET is_active = 0 WHERE id = :id");
    $stmt->execute(['id' => $id]);

    sendResponse(['status' => 'success', 'message' => 'Account deactivated successfully']);
}

sendResponse(['status' => 'error', 'message' => 'Method not allowed'], 405);
