-- Security event logs for registration, login anomalies, rate limits, and write-volume anomalies.
-- Run once per environment:
--   mysql -u <user> -p <database> < database/migrations/003_security_event_logs.sql

SET NAMES utf8mb4;
SET time_zone = '+07:00';

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
