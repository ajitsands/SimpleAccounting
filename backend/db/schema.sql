-- Simple Accounting System Schema
-- Supports GCC (Bahrain default), India, and International Currencies

CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key` VARCHAR(50) NOT NULL PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `currencies` (
  `code` VARCHAR(10) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `symbol` VARCHAR(10) NOT NULL,
  `decimal_digits` INT NOT NULL DEFAULT 2,
  `country` VARCHAR(100) NOT NULL,
  `is_gcc` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `account_name` VARCHAR(150) NOT NULL,
  `account_type` ENUM('bank', 'cash', 'credit_card', 'digital_wallet', 'other') NOT NULL DEFAULT 'bank',
  `account_number` VARCHAR(100) NULL,
  `bank_name` VARCHAR(150) NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'BHD',
  `initial_balance` DECIMAL(15, 3) NOT NULL DEFAULT 0.000,
  `current_balance` DECIMAL(15, 3) NOT NULL DEFAULT 0.000,
  `description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('expense', 'income', 'bank_transfer', 'other') NOT NULL DEFAULT 'expense',
  `icon` VARCHAR(50) NULL DEFAULT 'Tag',
  `color` VARCHAR(20) NULL DEFAULT '#3B82F6',
  `description` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transaction_date` DATE NOT NULL,
  `type` ENUM('expense', 'income', 'bank_transfer', 'other') NOT NULL,
  `amount` DECIMAL(15, 3) NOT NULL,
  `category_id` INT NULL,
  `from_account_id` INT NULL,
  `to_account_id` INT NULL,
  `payee_payer` VARCHAR(150) NULL,
  `payment_method` VARCHAR(50) NULL DEFAULT 'Cash',
  `reference_number` VARCHAR(100) NULL,
  `voucher_no` VARCHAR(60) NULL,
  `fiscal_year` VARCHAR(20) NULL,
  `notes` TEXT NULL,
  `status` ENUM('completed', 'pending', 'cancelled') NOT NULL DEFAULT 'completed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_trans_date` (`transaction_date`),
  INDEX `idx_trans_type` (`type`),
  INDEX `idx_trans_voucher` (`voucher_no`),
  INDEX `idx_trans_fy` (`fiscal_year`),
  INDEX `idx_trans_category` (`category_id`),
  INDEX `idx_trans_from_account` (`from_account_id`),
  INDEX `idx_trans_to_account` (`to_account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transaction_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` INT NOT NULL,
  `category_id` INT NULL,
  `item_description` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  `unit_price` DECIMAL(15, 3) NOT NULL DEFAULT 0.000,
  `amount` DECIMAL(15, 3) NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_item_tx` (`transaction_id`),
  INDEX `idx_item_cat` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` INT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_type` VARCHAR(100) NOT NULL,
  `file_size` INT NOT NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_attachment_transaction` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

