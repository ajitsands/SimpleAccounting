<?php
/**
 * Simple Accounting System - Clear All Transactions API / Script
 * 
 * Safely purges:
 *  - transactions
 *  - transaction_items
 *  - attachments
 * Resets:
 *  - accounts.current_balance -> initial_balance
 * 
 * PRESERVES 100%:
 *  - categories (All Income / Expense Heads)
 *  - accounts
 *  - settings
 *  - users
 *  - currencies
 */

require_once __DIR__ . '/config.php';

// Authentication check: Allow logged-in Admin or secret confirmation key
$currentUser = getAuthenticatedUser($pdo);
$confirmParam = $_GET['confirm'] ?? $_POST['confirm'] ?? '';

// Check if user is admin OR direct script execution with confirm=yes
$isAuthorized = ($currentUser && $currentUser['role'] === 'admin') || $confirmParam === 'yes';

if (!$isAuthorized && php_sapi_name() !== 'cli') {
    // If accessed directly from browser without param, show safety confirmation prompt
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($confirmParam)) {
        header('Content-Type: text/html; charset=utf-8');
        echo '<!DOCTYPE html>
        <html>
        <head>
            <title>Clear All Transactions - Confirmation</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: system-ui, sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
                .card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 480px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
                h2 { margin-top: 0; color: #dc2626; font-size: 20px; }
                p { font-size: 14px; line-height: 1.6; color: #475569; }
                .box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px; font-size: 13px; color: #991b1b; margin: 16px 0; }
                .btn { display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px; margin-top: 10px; }
                .btn:hover { background: #b91c1c; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>⚠️ Clear All Transactions</h2>
                <p>This script will permanently remove <strong>all transactions, line items, and uploaded receipt records</strong> and reset account balances back to starting amounts.</p>
                <div class="box">
                    <strong>Preserved:</strong> All Categories (Heads), Accounts, Users, and Settings will remain completely untouched.
                </div>
                <a href="?confirm=yes" class="btn" onclick="return confirm(\'Are you absolutely sure you want to clear all transactions?\')">Yes, Clear All Transactions Now</a>
            </div>
        </body>
        </html>';
        exit();
    }

    sendResponse([
        'status' => 'error',
        'message' => 'Unauthorized: Only Admin users can clear transactions. Alternatively append ?confirm=yes to confirm.'
    ], 403);
}

try {
    $pdo->beginTransaction();

    // 1. Clear transaction items
    $pdo->exec("DELETE FROM `transaction_items`");

    // 2. Clear attachments
    $pdo->exec("DELETE FROM `attachments`");

    // 3. Clear transactions
    $pdo->exec("DELETE FROM `transactions`");

    // 4. Reset account balances to initial balance
    $pdo->exec("UPDATE `accounts` SET `current_balance` = `initial_balance`");

    // 5. Clean upload directory (leave .gitkeep)
    if (file_exists($uploadDir) && is_dir($uploadDir)) {
        $files = scandir($uploadDir);
        foreach ($files as $file) {
            if ($file !== '.' && $file !== '..' && $file !== '.gitkeep') {
                $filePath = $uploadDir . $file;
                if (is_file($filePath)) {
                    @unlink($filePath);
                }
            }
        }
    }

    $pdo->commit();

    if (php_sapi_name() === 'cli') {
        echo "SUCCESS: All transactions and vouchers cleared successfully. Category heads and accounts preserved.\n";
        exit(0);
    }

    // If accessed directly in browser with confirm=yes, display nice success page
    if (isset($_GET['confirm']) && $_GET['confirm'] === 'yes' && !isset($_SERVER['HTTP_X_REQUESTED_WITH']) && !strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json')) {
        header('Content-Type: text/html; charset=utf-8');
        echo '<!DOCTYPE html>
        <html>
        <head>
            <title>Transactions Cleared Successfully</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: system-ui, sans-serif; background: #f0fdf4; color: #166534; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
                .card { background: white; border: 1px solid #bbf7d0; border-radius: 16px; max-width: 480px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); text-align: center; }
                h2 { margin-top: 0; color: #15803d; font-size: 22px; }
                p { font-size: 14px; line-height: 1.6; color: #374151; }
                .btn { display: inline-block; background: #0284c7; color: white; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px; margin-top: 14px; }
            </style>
        </head>
        <body>
            <div class="card">
                <div style="font-size:48px; margin-bottom:12px;">✅</div>
                <h2>Transactions Cleared!</h2>
                <p>All transactions and vouchers have been successfully wiped clean. All Category heads, accounts, and system configuration remain intact.</p>
                <a href="/" class="btn">Return to Dashboard</a>
            </div>
        </body>
        </html>';
        exit();
    }

    sendResponse([
        'status' => 'success',
        'message' => 'All transactions, vouchers, and attachments cleared successfully. All Heads and Accounts preserved.'
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    sendResponse([
        'status' => 'error',
        'message' => 'Failed to clear transactions: ' . $e->getMessage()
    ], 500);
}
