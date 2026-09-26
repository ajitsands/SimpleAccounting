-- ==========================================================
-- Simple Accounting System - Clear All Transactions Script
-- ==========================================================
-- This script safely removes ONLY transactions and attachments.
-- All Categories (Heads), Accounts, Users, and Settings are PRESERVED.

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Truncate Line Items
TRUNCATE TABLE `transaction_items`;

-- 2. Truncate Receipt Attachments Records
TRUNCATE TABLE `attachments`;

-- 3. Truncate Transactions
TRUNCATE TABLE `transactions`;

-- 4. Reset All Account Current Balances to Initial Balance
UPDATE `accounts` SET `current_balance` = `initial_balance`;

SET FOREIGN_KEY_CHECKS = 1;

-- Finished: All transactions cleared. Heads/Categories and Accounts intact.
