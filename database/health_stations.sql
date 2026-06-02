-- Health Station schema and seed data.
-- Source: ข้อมูลสถานี Health Station จังหวัดสตูล
-- Area: สำนักงานสาธารณสุขอำเภอเมืองสตูล

SET NAMES utf8mb4;
SET time_zone = '+07:00';

DROP TABLE IF EXISTS `health_stations`;

CREATE TABLE `health_stations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `station_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อ Health Station / จุดบริการ',
  `district_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'อำเภอ',
  `tambon_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ตำบล',
  `target_area` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'พื้นที่เป้าหมาย/ชุมชน',
  `station_type` enum('community','rphst') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'community'
    COMMENT 'community=จุดบริการชุมชน, rphst=ใน รพ.สต.',
  `portable_equipment` tinyint(1) NOT NULL DEFAULT 1
    COMMENT '1=อุปกรณ์ขนไป-กลับ (ไม่ได้วางประจำ), 0=วางประจำ',
  -- อุปกรณ์
  `has_scale` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'เครื่องชั่งน้ำหนัก/ที่วัดส่วนสูง',
  `has_bp_monitor` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'เครื่องวัดความดันโลหิต',
  `has_dtx` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'เครื่องเจาะ DTX+Strip',
  `has_waist_tape` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'สายวัดรอบเอว',
  -- สื่อ
  `has_educational_materials` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'มีโปสเตอร์/เอกสารให้ความรู้',
  -- อสม.
  `has_aom_assigned` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'มี อสม.อยู่ประจำ',
  `aom_schedule` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ตารางการปฏิบัติงาน อสม. (หมุนเวียน)',
  -- สถานะ
  `is_open` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะการเปิด Health Station',
  `open_hours` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'เวลา/วันให้บริการ',
  -- พิกัด
  `lat` decimal(10,7) DEFAULT NULL,
  `lon` decimal(10,7) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'หมายเหตุ',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hs_district` (`district_name`),
  KEY `idx_hs_tambon` (`tambon_name`),
  KEY `idx_hs_location` (`lat`, `lon`),
  KEY `idx_hs_status` (`is_open`),
  KEY `idx_hs_type` (`station_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ข้อมูล Health Station จุดบริการสุขภาพชุมชน';

-- ตัวอย่าง seed data (3-5 รายการ)
INSERT INTO `health_stations` (
  `station_name`, `district_name`, `tambon_name`, `target_area`, `station_type`,
  `portable_equipment`, `has_scale`, `has_bp_monitor`, `has_dtx`, `has_waist_tape`,
  `has_educational_materials`, `has_aom_assigned`, `aom_schedule`,
  `is_open`, `open_hours`, `lat`, `lon`, `notes`
) VALUES
(
  'Health Station วัดมำบัง', 'เมืองสตูล', 'พิมาน', 'ชุมชนวัดมำบัง',
  'community', 1,
  1, 1, 1, 1,
  1, 0, 'อสม.หมุนเวียน ทุกวันพุธ 08:00-12:00',
  1, 'ทุกวันพุธ 08:00-12:00',
  6.6275, 100.0670,
  'อุปกรณ์ขนไป-กลับ เจ้าหน้าที่และ อสม.รับผิดชอบร่วมกัน'
),
(
  'Health Station ตลาดสตูล', 'เมืองสตูล', 'พิมาน', 'ชุมชนตลาดสตูล',
  'community', 1,
  1, 1, 0, 1,
  1, 0, 'อสม.หมุนเวียน ทุกวันศุกร์ 08:00-12:00',
  1, 'ทุกวันศุกร์ 08:00-12:00',
  6.6199, 100.0708,
  NULL
),
(
  'Health Station รพ.สต.ฉลุง (ประจำ)', 'เมืองสตูล', 'ฉลุง', 'ผู้รับบริการ รพ.สต.ฉลุง',
  'rphst', 0,
  1, 1, 1, 1,
  1, 1, 'อสม.หมุนเวียนตามตาราง ทุกวันอังคาร-พฤหัสบดี',
  1, 'จันทร์-ศุกร์ 08:30-16:30',
  6.5742, 100.0453,
  'อุปกรณ์ครบครัน วางประจำ รพ.สต.'
),
(
  'Health Station ชุมชนบ้านใหม่', 'เมืองสตูล', 'คลองขุด', 'ชุมชนบ้านใหม่',
  'community', 1,
  1, 1, 1, 0,
  1, 0, 'อสม.หมุนเวียน ทุกวันจันทร์ 09:00-12:00',
  1, 'ทุกวันจันทร์ 09:00-12:00',
  6.6512, 100.0321,
  'ยังไม่มีสายวัดรอบเอว ต้องการจัดหาเพิ่ม'
),
(
  'Health Station รพ.สต.ตำมะลัง (ประจำ)', 'เมืองสตูล', 'ตำมะลัง', 'ผู้รับบริการ รพ.สต.ตำมะลัง',
  'rphst', 0,
  1, 1, 1, 1,
  1, 1, 'อสม.หมุนเวียนทุกวันทำการ',
  1, 'จันทร์-ศุกร์ 08:30-16:30',
  6.5985, 99.9852,
  'อุปกรณ์ครบ มีพื้นที่ให้บริการแยก'
);
