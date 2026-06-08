-- Adds registration email support and staff position master data.
-- Run once after 001_runtime_tables.sql in existing environments:
--   mysql -u <user> -p <database> < database/migrations/002_registration_email_positions.sql

SET NAMES utf8mb4;
SET time_zone = '+07:00';

SET @reg_email_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'staff_registration_requests'
    AND COLUMN_NAME = 'email'
);
SET @sql := IF(
  @reg_email_exists = 0,
  'ALTER TABLE `staff_registration_requests` ADD COLUMN `email` VARCHAR(255) NULL AFTER `full_name`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @users_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
);
SET @user_email_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'email'
);
SET @sql := IF(
  @users_table_exists > 0 AND @user_email_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `email` VARCHAR(255) NULL AFTER `full_name`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `staff_positions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_staff_positions_name` (`name`),
  INDEX `idx_staff_positions_active_sort` (`is_active`, `sort_order`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `staff_positions` (`name`, `sort_order`) VALUES
('แพทย์', 1),
('ทันตแพทย์', 2),
('เภสัชกร', 3),
('พยาบาลวิชาชีพ', 4),
('นักวิชาการสาธารณสุข', 5),
('เจ้าพนักงานสาธารณสุข', 6),
('เจ้าพนักงานทันตสาธารณสุข', 7),
('นักกายภาพบำบัด', 8),
('นักเทคนิคการแพทย์', 9),
('นักรังสีการแพทย์', 10),
('แพทย์แผนไทย', 11),
('นักโภชนาการ', 12),
('นักจิตวิทยาคลินิก', 13),
('เจ้าพนักงานเภสัชกรรม', 14),
('เจ้าพนักงานเวชสถิติ', 15),
('พนักงานช่วยเหลือคนไข้', 16),
('อาสาสมัครสาธารณสุขประจำหมู่บ้าน', 17),
('ผู้ช่วยเจ้าหน้าที่สาธารณสุข', 18),
('เจ้าหน้าที่บันทึกข้อมูล', 19),
('เจ้าหน้าที่งานสุขศึกษา', 20);
