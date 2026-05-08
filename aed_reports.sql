-- Migration: สร้างตาราง aed_reports สำหรับระบบแจ้งปัญหาเครื่อง AED
-- รัน: mysql -u root stn_aed < aed_reports.sql

CREATE TABLE IF NOT EXISTS `aed_reports` (
  `id`             INT NOT NULL AUTO_INCREMENT,
  `aed_id`         INT NOT NULL COMMENT 'FK → aed.id',
  `reporter_name`  VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ชื่อผู้แจ้ง',
  `reporter_phone` VARCHAR(50)  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'เบอร์ติดต่อผู้แจ้ง',
  `report_type`    ENUM('damaged','maintenance','missing','battery','other') NOT NULL COMMENT 'ประเภทปัญหา',
  `description`    TEXT         CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'รายละเอียดเพิ่มเติม',
  `status`         ENUM('pending','in_progress','resolved') NOT NULL DEFAULT 'pending' COMMENT 'สถานะการดำเนินการ',
  `notified_at`    TIMESTAMP NULL DEFAULT NULL COMMENT 'เวลาที่ส่ง Telegram',
  `resolved_at`    TIMESTAMP NULL DEFAULT NULL COMMENT 'เวลาที่แก้ไขแล้ว',
  `admin_note`     TEXT         CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'หมายเหตุแอดมิน',
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_aed_id` (`aed_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_report_aed` FOREIGN KEY (`aed_id`) REFERENCES `aed` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='รายงานปัญหาเครื่อง AED จากผู้ใช้งาน/เจ้าหน้าที่';
