-- Runtime support tables for permissions, visit logs, and admin audit logs.
-- Run once per environment before deployment:
--   mysql -u <user> -p <database> < database/migrations/001_runtime_tables.sql

SET NAMES utf8mb4;
SET time_zone = '+07:00';

CREATE TABLE IF NOT EXISTS `user_module_permissions` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `module_key` VARCHAR(64) NOT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_by` BIGINT UNSIGNED NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `module_key`),
  KEY `idx_module_key` (`module_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `website_visit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `visited_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` BIGINT UNSIGNED NULL,
  `username` VARCHAR(120) NULL,
  `role` VARCHAR(40) NULL,
  `method` VARCHAR(16) NOT NULL DEFAULT 'GET',
  `path` VARCHAR(512) NOT NULL,
  `query_string` TEXT NULL,
  `ip_address` VARCHAR(64) NULL,
  `network_segment` VARCHAR(64) NULL,
  `user_agent` TEXT NULL,
  `referer` VARCHAR(1024) NULL,
  `accept_language` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_visit_time` (`visited_at`),
  INDEX `idx_visit_ip` (`ip_address`),
  INDEX `idx_visit_path` (`path`),
  INDEX `idx_visit_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actor_user_id` BIGINT UNSIGNED NULL,
  `actor_username` VARCHAR(120) NULL,
  `actor_role` VARCHAR(40) NULL,
  `action` VARCHAR(80) NOT NULL,
  `entity_type` VARCHAR(80) NOT NULL,
  `entity_id` VARCHAR(80) NULL,
  `summary` VARCHAR(500) NULL,
  `metadata` JSON NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_audit_created_at` (`created_at`),
  INDEX `idx_audit_actor` (`actor_user_id`),
  INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
  INDEX `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `security_event_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `event_type` VARCHAR(80) NOT NULL,
  `severity` VARCHAR(20) NOT NULL DEFAULT 'info',
  `title` VARCHAR(255) NOT NULL,
  `summary` VARCHAR(1000) NULL,
  `actor_user_id` BIGINT UNSIGNED NULL,
  `actor_username` VARCHAR(120) NULL,
  `actor_role` VARCHAR(40) NULL,
  `ip_address` VARCHAR(64) NULL,
  `network_segment` VARCHAR(64) NULL,
  `method` VARCHAR(16) NULL,
  `path` VARCHAR(512) NULL,
  `user_agent` TEXT NULL,
  `referer` VARCHAR(1024) NULL,
  `metadata` JSON NULL,
  `notified_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_security_created_at` (`created_at`),
  INDEX `idx_security_event_type` (`event_type`),
  INDEX `idx_security_severity` (`severity`),
  INDEX `idx_security_ip` (`ip_address`),
  INDEX `idx_security_actor` (`actor_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `staff_registration_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source` VARCHAR(20) NOT NULL DEFAULT 'form',
  `line_user_id` VARCHAR(191) NULL,
  `username` VARCHAR(120) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `position_name` VARCHAR(255) NULL,
  `facility_name` VARCHAR(255) NULL,
  `note` TEXT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `reviewed_by` BIGINT UNSIGNED NULL,
  `reviewed_at` DATETIME NULL,
  `user_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_reg_status_created` (`status`, `created_at`),
  INDEX `idx_reg_line_user` (`line_user_id`),
  INDEX `idx_reg_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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