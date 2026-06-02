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
