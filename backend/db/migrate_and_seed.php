<?php
/**
 * Simple Accounting Database Migration & Seeder
 */

header('Content-Type: application/json');

$host = '127.0.0.1';
$dbname = 'simple_accounting';
$user = 'root';
$pass = 'S@nds1@b';

// Check if running on remote server
if (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'sandslab.com') !== false) {
    $dbname = 'sandsl23_simpleacc_db';
    $user = 'sandsl23_simpleacc_user';
}

try {
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    // Create database if not exists
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname`");

    // Execute schema
    $schema = file_get_contents(__DIR__ . '/schema.sql');
    $pdo->exec($schema);

    // 1. Seed Currencies
    $currencies = [
        ['code' => 'BHD', 'name' => 'Bahraini Dinar', 'symbol' => 'BD', 'decimal_digits' => 3, 'country' => 'Bahrain', 'is_gcc' => 1],
        ['code' => 'SAR', 'name' => 'Saudi Riyal', 'symbol' => 'SAR', 'decimal_digits' => 2, 'country' => 'Saudi Arabia', 'is_gcc' => 1],
        ['code' => 'AED', 'name' => 'UAE Dirham', 'symbol' => 'AED', 'decimal_digits' => 2, 'country' => 'United Arab Emirates', 'is_gcc' => 1],
        ['code' => 'QAR', 'name' => 'Qatari Riyal', 'symbol' => 'QAR', 'decimal_digits' => 2, 'country' => 'Qatar', 'is_gcc' => 1],
        ['code' => 'KWD', 'name' => 'Kuwaiti Dinar', 'symbol' => 'KWD', 'decimal_digits' => 3, 'country' => 'Kuwait', 'is_gcc' => 1],
        ['code' => 'OMR', 'name' => 'Omani Rial', 'symbol' => 'OMR', 'decimal_digits' => 3, 'country' => 'Oman', 'is_gcc' => 1],
        ['code' => 'INR', 'name' => 'Indian Rupee', 'symbol' => '₹', 'decimal_digits' => 2, 'country' => 'India', 'is_gcc' => 0],
        ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'decimal_digits' => 2, 'country' => 'United States', 'is_gcc' => 0],
        ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'decimal_digits' => 2, 'country' => 'European Union', 'is_gcc' => 0],
        ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£', 'decimal_digits' => 2, 'country' => 'United Kingdom', 'is_gcc' => 0]
    ];

    $stmt = $pdo->prepare("INSERT INTO `currencies` (`code`, `name`, `symbol`, `decimal_digits`, `country`, `is_gcc`) 
                           VALUES (:code, :name, :symbol, :decimal_digits, :country, :is_gcc) 
                           ON DUPLICATE KEY UPDATE `name`=:name, `symbol`=:symbol, `decimal_digits`=:decimal_digits, `country`=:country, `is_gcc`=:is_gcc");
    foreach ($currencies as $curr) {
        $stmt->execute($curr);
    }

    // 2. Seed Default Settings
    $settings = [
        ['setting_key' => 'default_currency', 'setting_value' => 'BHD', 'description' => 'Default system currency code (e.g. BHD, SAR, INR)'],
        ['setting_key' => 'timezone', 'setting_value' => 'Asia/Bahrain', 'description' => 'System Timezone (e.g. Asia/Bahrain, Asia/Kolkata, Asia/Riyadh, Asia/Dubai)'],
        ['setting_key' => 'date_format', 'setting_value' => 'DD/MM/YYYY', 'description' => 'Date display format (DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY, DD-MMM-YYYY)'],
        ['setting_key' => 'company_name', 'setting_value' => 'SaNDSLab Simple Accounting', 'description' => 'Company / Organization Name'],
        ['setting_key' => 'company_logo', 'setting_value' => 'https://qrgenerator.sandslab.com/assets/SaNDSLab-LogoForWhite-C43CoLgA.png', 'description' => 'Company Logo URL'],
        ['setting_key' => 'default_theme', 'setting_value' => 'light', 'description' => 'Default UI Theme (light / dark)'],
        ['setting_key' => 'company_email', 'setting_value' => 'accounts@sandslab.com', 'description' => 'Contact Email'],
        ['setting_key' => 'company_phone', 'setting_value' => '+973 3333 4444', 'description' => 'Contact Phone Number'],
        ['setting_key' => 'company_address', 'setting_value' => 'Suite 402, Building 882, Road 3618, Block 436, Seef District, Kingdom of Bahrain', 'description' => 'Company Physical Address & Location'],
        ['setting_key' => 'tax_number', 'setting_value' => 'BH-VAT-987654321', 'description' => 'VAT / Tax Registration Number']
    ];

    $stmtSetting = $pdo->prepare("INSERT INTO `settings` (`setting_key`, `setting_value`, `description`) 
                                  VALUES (:setting_key, :setting_value, :description) 
                                  ON DUPLICATE KEY UPDATE `description`=:description");
    foreach ($settings as $set) {
        $stmtSetting->execute($set);
    }

    // 3. Seed Default Accounts
    $checkAcc = $pdo->query("SELECT COUNT(*) FROM `accounts`")->fetchColumn();
    if ($checkAcc == 0) {
        $accounts = [
            ['account_name' => 'Ahli United Bank (Main)', 'account_type' => 'bank', 'account_number' => 'BH92AUBB000123456789', 'bank_name' => 'Ahli United Bank', 'currency' => 'BHD', 'initial_balance' => 2500.000, 'current_balance' => 2500.000, 'description' => 'Main corporate business operating account'],
            ['account_name' => 'National Bank of Bahrain', 'account_type' => 'bank', 'account_number' => 'BH45NBBB000987654321', 'bank_name' => 'NBB', 'currency' => 'BHD', 'initial_balance' => 1200.000, 'current_balance' => 1200.000, 'description' => 'Secondary operational account'],
            ['account_name' => 'Office Petty Cash', 'account_type' => 'cash', 'account_number' => 'CASH-001', 'bank_name' => 'Cash in Hand', 'currency' => 'BHD', 'initial_balance' => 350.000, 'current_balance' => 350.000, 'description' => 'Office daily petty expenses cash drawer']
        ];
        $stmtAcc = $pdo->prepare("INSERT INTO `accounts` (`account_name`, `account_type`, `account_number`, `bank_name`, `currency`, `initial_balance`, `current_balance`, `description`) 
                                  VALUES (:account_name, :account_type, :account_number, :bank_name, :currency, :initial_balance, :current_balance, :description)");
        foreach ($accounts as $acc) {
            $stmtAcc->execute($acc);
        }
    }

    // 4. Seed Standard Categories
    $checkCat = $pdo->query("SELECT COUNT(*) FROM `categories`")->fetchColumn();
    if ($checkCat == 0) {
        $categories = [
            // Income
            ['name' => 'Client Invoices & Services', 'type' => 'income', 'icon' => 'Briefcase', 'color' => '#10B981', 'description' => 'Revenue from client consulting and service contracts'],
            ['name' => 'Product Sales', 'type' => 'income', 'icon' => 'ShoppingBag', 'color' => '#059669', 'description' => 'Direct product sales and subscriptions'],
            ['name' => 'Consulting & Retainers', 'type' => 'income', 'icon' => 'Award', 'color' => '#34D399', 'description' => 'Monthly retainer fees and advisory'],
            ['name' => 'Other Income', 'type' => 'income', 'icon' => 'TrendingUp', 'color' => '#6EE7B7', 'description' => 'Miscellaneous income and interest'],

            // Expense
            ['name' => 'Salaries & Wages', 'type' => 'expense', 'icon' => 'Users', 'color' => '#EF4444', 'description' => 'Staff payroll and allowances'],
            ['name' => 'Office Rent & Utilities', 'type' => 'expense', 'icon' => 'Building', 'color' => '#F97316', 'description' => 'Building rent, electricity, water, and internet'],
            ['name' => 'Software & Cloud Subscriptions', 'type' => 'expense', 'icon' => 'Cloud', 'color' => '#8B5CF6', 'description' => 'Hosting, SaaS licenses, domains'],
            ['name' => 'Office Supplies & Stationeries', 'type' => 'expense', 'icon' => 'FileText', 'color' => '#F59E0B', 'description' => 'Pantry, papers, printer ink, office assets'],
            ['name' => 'Travel & Transportation', 'type' => 'expense', 'icon' => 'Truck', 'color' => '#06B6D4', 'description' => 'Fuel, parking, courier, client visits'],
            ['name' => 'Marketing & Advertising', 'type' => 'expense', 'icon' => 'Megaphone', 'color' => '#EC4899', 'description' => 'Online ads, printing, promotional branding'],
            ['name' => 'Bank Charges & Fees', 'type' => 'expense', 'icon' => 'CreditCard', 'color' => '#64748B', 'description' => 'Wire fees, POS commission, account maintenance'],
            ['name' => 'Maintenance & Repairs', 'type' => 'expense', 'icon' => 'Wrench', 'color' => '#78716C', 'description' => 'Hardware repair, AC maintenance'],

            // Other Activities
            ['name' => 'Owner Drawings / Dividend', 'type' => 'other', 'icon' => 'UserCheck', 'color' => '#6366F1', 'description' => 'Partner withdrawals and distribution'],
            ['name' => 'Loan / Debt Repayment', 'type' => 'other', 'icon' => 'RefreshCw', 'color' => '#A855F7', 'description' => 'Principal loan repayments'],
            ['name' => 'Asset Purchase', 'type' => 'other', 'icon' => 'Layers', 'color' => '#3B82F6', 'description' => 'Equipment, computers, furniture capital asset']
        ];
        $stmtCat = $pdo->prepare("INSERT INTO `categories` (`name`, `type`, `icon`, `color`, `description`) 
                                  VALUES (:name, :type, :icon, :color, :description)");
        foreach ($categories as $cat) {
            $stmtCat->execute($cat);
        }
    }

    // 5. Seed Initial Sample Transactions if empty
    $checkTx = $pdo->query("SELECT COUNT(*) FROM `transactions`")->fetchColumn();
    if ($checkTx == 0) {
        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        $threeDaysAgo = date('Y-m-d', strtotime('-3 days'));
        $weekAgo = date('Y-m-d', strtotime('-7 days'));

        $sampleTx = [
            [
                'transaction_date' => $weekAgo,
                'type' => 'income',
                'amount' => 850.000,
                'category_id' => 1,
                'from_account_id' => null,
                'to_account_id' => 1,
                'payee_payer' => 'Al-Manar Technologies',
                'payment_method' => 'Bank Transfer',
                'reference_number' => 'INV-2026-0089',
                'notes' => 'Q1 Web Portal Development milestone 1 payment',
                'status' => 'completed'
            ],
            [
                'transaction_date' => $threeDaysAgo,
                'type' => 'expense',
                'amount' => 145.500,
                'category_id' => 7,
                'from_account_id' => 1,
                'to_account_id' => null,
                'payee_payer' => 'Amazon Web Services',
                'payment_method' => 'Credit Card',
                'reference_number' => 'AWS-INV-9921',
                'notes' => 'Monthly cloud hosting and database cluster servers',
                'status' => 'completed'
            ],
            [
                'transaction_date' => $yesterday,
                'type' => 'expense',
                'amount' => 28.750,
                'category_id' => 8,
                'from_account_id' => 3,
                'to_account_id' => null,
                'payee_payer' => 'Kingdom Stationers',
                'payment_method' => 'Cash',
                'reference_number' => 'REC-4412',
                'notes' => 'A4 printing paper reams, pens, and desk organizer',
                'status' => 'completed'
            ],
            [
                'transaction_date' => $today,
                'type' => 'bank_transfer',
                'amount' => 150.000,
                'category_id' => null,
                'from_account_id' => 1,
                'to_account_id' => 3,
                'payee_payer' => 'Self / Internal Transfer',
                'payment_method' => 'Cheque / Cash Withdrawal',
                'reference_number' => 'TRF-0042',
                'notes' => 'Petty cash replenishment from Ahli United Bank to Office Cash Drawer',
                'status' => 'completed'
            ],
            [
                'transaction_date' => $today,
                'type' => 'income',
                'amount' => 420.000,
                'category_id' => 3,
                'from_account_id' => null,
                'to_account_id' => 1,
                'payee_payer' => 'Gulf Solutions SPC',
                'payment_method' => 'Bank Transfer',
                'reference_number' => 'RET-MAR-26',
                'notes' => 'Monthly software maintenance retainer fee',
                'status' => 'completed'
            ]
        ];

        $stmtTx = $pdo->prepare("INSERT INTO `transactions` (`transaction_date`, `type`, `amount`, `category_id`, `from_account_id`, `to_account_id`, `payee_payer`, `payment_method`, `reference_number`, `notes`, `status`) 
                                 VALUES (:transaction_date, :type, :amount, :category_id, :from_account_id, :to_account_id, :payee_payer, :payment_method, :reference_number, :notes, :status)");
        foreach ($sampleTx as $tx) {
            $stmtTx->execute($tx);
        }
    }

    // 6. Seed Default Users (Admin, Auditor, Regular User)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `users` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `username` VARCHAR(50) NOT NULL UNIQUE,
      `email` VARCHAR(100) NULL,
      `full_name` VARCHAR(100) NOT NULL,
      `password` VARCHAR(255) NOT NULL,
      `role` ENUM('admin', 'user', 'auditor') NOT NULL DEFAULT 'user',
      `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      `auth_token` VARCHAR(255) NULL,
      `last_login` DATETIME NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX `idx_users_username` (`username`),
      INDEX `idx_users_token` (`auth_token`),
      INDEX `idx_users_role` (`role`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $defaultUsers = [
        [
            'username' => 'admin',
            'email' => 'admin@sandslab.com',
            'full_name' => 'System Administrator',
            'password' => password_hash('admin123', PASSWORD_DEFAULT),
            'role' => 'admin',
            'status' => 'active'
        ],
        [
            'username' => 'auditor',
            'email' => 'auditor@sandslab.com',
            'full_name' => 'Compliance Auditor',
            'password' => password_hash('auditor123', PASSWORD_DEFAULT),
            'role' => 'auditor',
            'status' => 'active'
        ],
        [
            'username' => 'user',
            'email' => 'accounts@sandslab.com',
            'full_name' => 'Accounts Officer',
            'password' => password_hash('user123', PASSWORD_DEFAULT),
            'role' => 'user',
            'status' => 'active'
        ]
    ];

    $stmtUser = $pdo->prepare("INSERT INTO `users` (`username`, `email`, `full_name`, `password`, `role`, `status`) 
                               VALUES (:username, :email, :full_name, :password, :role, :status) 
                               ON DUPLICATE KEY UPDATE `full_name`=:full_name, `role`=:role, `status`=:status");
    foreach ($defaultUsers as $u) {
        $stmtUser->execute($u);
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Database migration and seeding completed successfully!',
        'database' => $dbname,
        'default_currency' => 'BHD (Bahraini Dinar - 3 Decimals)',
        'default_users' => [
            ['username' => 'admin', 'password' => 'admin123', 'role' => 'admin (Web & Mobile Full Access)'],
            ['username' => 'user', 'password' => 'user123', 'role' => 'user (Web & Mobile Standard Operations)'],
            ['username' => 'auditor', 'password' => 'auditor123', 'role' => 'auditor (Web Only - Read & Export Excel/PDF)']
        ],
        'supported_gcc' => ['Bahrain (BHD)', 'Saudi Arabia (SAR)', 'UAE (AED)', 'Qatar (QAR)', 'Kuwait (KWD)', 'Oman (OMR)'],
        'supported_india' => 'India (INR - ₹)',
        'date_formats' => ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD-MMM-YYYY']
    ], JSON_PRETTY_PRINT);


} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
