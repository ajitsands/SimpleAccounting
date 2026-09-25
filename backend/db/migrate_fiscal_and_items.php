<?php
/**
 * Migration script for Fiscal Year Reset & Multi-line Transaction Items
 * Accounting Year: April 1 to March 31
 * Numbering Format: Prefix-FY-Sequence (e.g. PV-26-27-00001, RCP-26-27-00001)
 */

$host = '127.0.0.1';
$dbname = 'simple_accounting';
$user = 'root';
$pass = 'S@nds1@b';

if (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'sandslab.com') !== false) {
    $dbname = 'sandsl23_simpleacc_db';
    $user = 'sandsl23_simpleacc_user';
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // 1. Check and add columns to transactions table
    $columns = $pdo->query("SHOW COLUMNS FROM transactions")->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('voucher_no', $columns)) {
        $pdo->exec("ALTER TABLE transactions ADD COLUMN voucher_no VARCHAR(60) NULL AFTER reference_number, ADD INDEX idx_trans_voucher (voucher_no)");
        echo "Added voucher_no column.\n";
    }

    if (!in_array('fiscal_year', $columns)) {
        $pdo->exec("ALTER TABLE transactions ADD COLUMN fiscal_year VARCHAR(20) NULL AFTER voucher_no, ADD INDEX idx_trans_fy (fiscal_year)");
        echo "Added fiscal_year column.\n";
    }

    // 2. Create transaction_items table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS transaction_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          transaction_id INT NOT NULL,
          category_id INT NULL,
          item_description VARCHAR(255) NOT NULL,
          quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
          unit_price DECIMAL(15, 3) NOT NULL DEFAULT 0.000,
          amount DECIMAL(15, 3) NOT NULL,
          notes TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_item_tx (transaction_id),
          INDEX idx_item_cat (category_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "Ensured transaction_items table exists.\n";

    // Helper: Compute Fiscal Year (April 1 to March 31)
    function computeFiscalYear($dateStr) {
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

    function getVoucherPrefix($type) {
        switch ($type) {
            case 'income': return 'RCP';
            case 'expense': return 'PV';
            case 'bank_transfer': return 'TRF';
            default: return 'JV';
        }
    }

    // 3. Update existing transactions missing voucher_no or fiscal_year
    $stmt = $pdo->query("SELECT id, transaction_date, type, amount, category_id, payee_payer, reference_number, notes, voucher_no, fiscal_year FROM transactions ORDER BY transaction_date ASC, id ASC");
    $allTx = $stmt->fetchAll();

    $fyCounters = []; // ['PV-26-27' => count, ...]

    foreach ($allTx as $tx) {
        $fy = computeFiscalYear($tx['transaction_date']);
        $prefix = getVoucherPrefix($tx['type']);
        $fyKey = "$prefix-$fy";

        if (!isset($fyCounters[$fyKey])) {
            $fyCounters[$fyKey] = 0;
        }
        $fyCounters[$fyKey]++;

        $voucherNo = $tx['voucher_no'];
        if (empty($voucherNo)) {
            $voucherNo = sprintf("%s-%s-%05d", $prefix, $fy, $fyCounters[$fyKey]);
            $upStmt = $pdo->prepare("UPDATE transactions SET voucher_no = :vno, fiscal_year = :fy WHERE id = :id");
            $upStmt->execute(['vno' => $voucherNo, 'fy' => $fy, 'id' => $tx['id']]);
        }

        // 4. Ensure line items exist for this transaction
        $itemCount = $pdo->prepare("SELECT COUNT(*) FROM transaction_items WHERE transaction_id = :id");
        $itemCount->execute(['id' => $tx['id']]);
        if ($itemCount->fetchColumn() == 0) {
            $desc = !empty($tx['payee_payer']) ? $tx['payee_payer'] : ($tx['type'] === 'bank_transfer' ? 'Fund Transfer' : 'General Transaction Item');
            if (!empty($tx['notes'])) $desc .= ' - ' . $tx['notes'];

            $insertItem = $pdo->prepare("
                INSERT INTO transaction_items (transaction_id, category_id, item_description, quantity, unit_price, amount, notes)
                VALUES (:tx_id, :cat_id, :desc, 1.00, :amount, :amount, :notes)
            ");
            $insertItem->execute([
                'tx_id' => $tx['id'],
                'cat_id' => $tx['category_id'],
                'desc' => mb_substr($desc, 0, 255),
                'amount' => $tx['amount'],
                'notes' => $tx['notes']
            ]);
        }
    }

    echo "Migration completed successfully! Processed " . count($allTx) . " transactions.\n";

} catch (Exception $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
    exit(1);
}
