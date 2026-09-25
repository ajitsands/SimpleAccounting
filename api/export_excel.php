<?php
/**
 * Server-side Excel / CSV Export Generator for Simple Accounting
 */
require_once __DIR__ . '/config.php';

$dateFrom = trim($_GET['date_from'] ?? '');
$dateTo = trim($_GET['date_to'] ?? '');
$type = trim($_GET['type'] ?? '');
$format = trim($_GET['format'] ?? 'csv');

$where = ["1=1"];
$params = [];

if (!empty($type)) {
    $where[] = "t.type = :type";
    $params['type'] = $type;
}
if (!empty($dateFrom)) {
    $where[] = "t.transaction_date >= :date_from";
    $params['date_from'] = $dateFrom;
}
if (!empty($dateTo)) {
    $where[] = "t.transaction_date <= :date_to";
    $params['date_to'] = $dateTo;
}

$whereClause = implode(" AND ", $where);

$sql = "
    SELECT t.id, t.transaction_date, t.type, t.amount,
           c.name as category_name,
           fa.account_name as from_account,
           ta.account_name as to_account,
           t.payee_payer, t.payment_method, t.reference_number, t.notes, t.status,
           (SELECT COUNT(att.id) FROM attachments att WHERE att.transaction_id = t.id) as attachment_count
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts fa ON t.from_account_id = fa.id
    LEFT JOIN accounts ta ON t.to_account_id = ta.id
    WHERE $whereClause
    ORDER BY t.transaction_date DESC, t.id DESC
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$settings = getSystemSettings($pdo);
$currency = $settings['default_currency'] ?? 'BHD';
$dateFormat = $settings['date_format'] ?? 'DD/MM/YYYY';

$filename = 'Accounting_Report_' . date('Ymd_His') . '.csv';

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Pragma: no-cache');
header('Expires: 0');

// Add UTF-8 BOM for proper Excel Unicode display
echo "\xEF\xBB\xBF";

$output = fopen('php://output', 'w');

// Title Headers
fputcsv($output, [$settings['company_name'] ?? 'SaNDSLab Simple Accounting - Financial Statement']);
fputcsv($output, ['Export Date:', date('Y-m-d H:i:s'), 'Timezone:', date_default_timezone_get(), 'Currency:', $currency]);
if (!empty($dateFrom) || !empty($dateTo)) {
    fputcsv($output, ['Period Filter:', ($dateFrom ?: 'Beginning') . ' to ' . ($dateTo ?: 'Today')]);
}
fputcsv($output, []); // Empty line

// Column Headers
fputcsv($output, [
    'Tx ID',
    'Date (' . $dateFormat . ')',
    'Type',
    'Category',
    'Account / Source',
    'Destination Account',
    'Payee / Payer',
    'Payment Method',
    'Reference No',
    'Amount (' . $currency . ')',
    'Attachments',
    'Status',
    'Notes / Description'
]);

$totalIncome = 0;
$totalExpense = 0;

foreach ($rows as $r) {
    $amt = (float)$r['amount'];
    if ($r['type'] === 'income') $totalIncome += $amt;
    if ($r['type'] === 'expense') $totalExpense += $amt;

    // Format date display
    $displayDate = $r['transaction_date'];
    $timestamp = strtotime($r['transaction_date']);
    if ($dateFormat === 'DD/MM/YYYY') {
        $displayDate = date('d/m/Y', $timestamp);
    } elseif ($dateFormat === 'MM/DD/YYYY') {
        $displayDate = date('m/d/Y', $timestamp);
    } elseif ($dateFormat === 'DD-MMM-YYYY') {
        $displayDate = date('d-M-Y', $timestamp);
    }

    fputcsv($output, [
        $r['id'],
        $displayDate,
        strtoupper($r['type']),
        $r['category_name'] ?: 'General / Uncategorized',
        $r['from_account'] ?: '-',
        $r['to_account'] ?: '-',
        $r['payee_payer'] ?: '-',
        $r['payment_method'] ?: '-',
        $r['reference_number'] ?: '-',
        number_format($amt, 3, '.', ''),
        $r['attachment_count'] > 0 ? ($r['attachment_count'] . ' Attached') : 'None',
        strtoupper($r['status']),
        $r['notes'] ?: ''
    ]);
}

// Summary Rows
fputcsv($output, []);
fputcsv($output, ['', '', '', '', '', '', '', '', 'Total Income:', number_format($totalIncome, 3, '.', '') . ' ' . $currency]);
fputcsv($output, ['', '', '', '', '', '', '', '', 'Total Expense:', number_format($totalExpense, 3, '.', '') . ' ' . $currency]);
fputcsv($output, ['', '', '', '', '', '', '', '', 'Net Balance / Profit:', number_format($totalIncome - $totalExpense, 3, '.', '') . ' ' . $currency]);

fclose($output);
exit();
