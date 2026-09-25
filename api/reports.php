<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $dateFrom = trim($_GET['date_from'] ?? '');
    $dateTo = trim($_GET['date_to'] ?? '');
    $reportType = trim($_GET['report_type'] ?? 'overview');

    $where = ["status = 'completed'"];
    $params = [];

    if (!empty($dateFrom)) {
        $where[] = "transaction_date >= :date_from";
        $params['date_from'] = $dateFrom;
    }
    if (!empty($dateTo)) {
        $where[] = "transaction_date <= :date_to";
        $params['date_to'] = $dateTo;
    }

    $whereClause = implode(" AND ", $where);

    // 1. Overall Financial Summary
    $stmtIncome = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE $whereClause AND type = 'income'");
    $stmtIncome->execute($params);
    $totalIncome = (float)$stmtIncome->fetchColumn();

    $stmtExpense = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE $whereClause AND type = 'expense'");
    $stmtExpense->execute($params);
    $totalExpense = (float)$stmtExpense->fetchColumn();

    $stmtOther = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE $whereClause AND type = 'other'");
    $stmtOther->execute($params);
    $totalOther = (float)$stmtOther->fetchColumn();

    $stmtTransfers = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE $whereClause AND type = 'bank_transfer'");
    $stmtTransfers->execute($params);
    $totalTransfers = (float)$stmtTransfers->fetchColumn();

    $stmtTxCount = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE $whereClause");
    $stmtTxCount->execute($params);
    $transactionCount = (int)$stmtTxCount->fetchColumn();

    // Accounts Total Live Balances (Petty Cash / Cash first)
    $accounts = $pdo->query("SELECT id, account_name, account_type, bank_name, currency, current_balance FROM accounts WHERE is_active = 1 ORDER BY CASE WHEN account_type = 'cash' OR account_name LIKE '%Petty Cash%' THEN 0 ELSE 1 END, id ASC")->fetchAll();
    $bankTotal = 0;
    $cashTotal = 0;
    foreach ($accounts as $acc) {
        if ($acc['account_type'] === 'cash') {
            $cashTotal += (float)$acc['current_balance'];
        } else {
            $bankTotal += (float)$acc['current_balance'];
        }
    }

    // 2. Monthly Trend (Past 12 Months)
    $monthlyTrendSql = "
        SELECT 
            DATE_FORMAT(transaction_date, '%Y-%m') as month_key,
            DATE_FORMAT(transaction_date, '%b %Y') as month_label,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
            COALESCE(SUM(CASE WHEN type = 'other' THEN amount ELSE 0 END), 0) as other
        FROM transactions
        WHERE status = 'completed' AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
        GROUP BY month_key, month_label
        ORDER BY month_key ASC
    ";
    $monthlyTrend = $pdo->query($monthlyTrendSql)->fetchAll();

    // 3. Category Breakdown for Expenses
    $catExpenseSql = "
        SELECT 
            c.id, 
            c.name, 
            c.color, 
            c.icon,
            COUNT(t.id) as transaction_count,
            COALESCE(SUM(t.amount), 0) as total_amount
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE $whereClause AND t.type = 'expense'
        GROUP BY c.id, c.name, c.color, c.icon
        ORDER BY total_amount DESC
    ";
    $stmtCatExp = $pdo->prepare($catExpenseSql);
    $stmtCatExp->execute($params);
    $categoryExpenses = $stmtCatExp->fetchAll();

    foreach ($categoryExpenses as &$cat) {
        $cat['total_amount'] = (float)$cat['total_amount'];
        $cat['percentage'] = $totalExpense > 0 ? round(($cat['total_amount'] / $totalExpense) * 100, 1) : 0;
    }

    // 4. Category Breakdown for Income
    $catIncomeSql = "
        SELECT 
            c.id, 
            c.name, 
            c.color, 
            c.icon,
            COUNT(t.id) as transaction_count,
            COALESCE(SUM(t.amount), 0) as total_amount
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE $whereClause AND t.type = 'income'
        GROUP BY c.id, c.name, c.color, c.icon
        ORDER BY total_amount DESC
    ";
    $stmtCatInc = $pdo->prepare($catIncomeSql);
    $stmtCatInc->execute($params);
    $categoryIncome = $stmtCatInc->fetchAll();

    foreach ($categoryIncome as &$cat) {
        $cat['total_amount'] = (float)$cat['total_amount'];
        $cat['percentage'] = $totalIncome > 0 ? round(($cat['total_amount'] / $totalIncome) * 100, 1) : 0;
    }

    // 5. Daily Trend (for current month or range)
    $dailySql = "
        SELECT 
            transaction_date,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
        FROM transactions
        WHERE $whereClause
        GROUP BY transaction_date
        ORDER BY transaction_date ASC
    ";
    $stmtDaily = $pdo->prepare($dailySql);
    $stmtDaily->execute($params);
    $dailyTrend = $stmtDaily->fetchAll();

    sendResponse([
        'status' => 'success',
        'summary' => [
            'total_income' => $totalIncome,
            'total_expense' => $totalExpense,
            'net_profit' => $totalIncome - $totalExpense,
            'total_other' => $totalOther,
            'total_transfers' => $totalTransfers,
            'transaction_count' => $transactionCount,
            'bank_total_balance' => $bankTotal,
            'cash_total_balance' => $cashTotal,
            'net_liquidity' => $bankTotal + $cashTotal
        ],
        'monthly_trend' => $monthlyTrend,
        'category_expenses' => $categoryExpenses,
        'category_income' => $categoryIncome,
        'daily_trend' => $dailyTrend,
        'accounts_summary' => $accounts
    ]);
}

sendResponse(['status' => 'error', 'message' => 'Method not allowed'], 405);
