-- Dental unit inventory schema and seed data.
-- Source: แบบฟอร์มสำรวจครุภัณฑ์ยูนิตทันตกรรม ปี 2569
-- Area: สำนักงานสาธารณสุขอำเภอ/โรงพยาบาลอำเภอเมืองสตูล
-- Source note: ข้อมูล ณ วันที่ 29 เมษายน 2569

SET NAMES utf8mb4;
SET time_zone = '+07:00';

DROP TABLE IF EXISTS `dental_unit_reports`;
DROP TABLE IF EXISTS `dental_units`;

CREATE TABLE `dental_units` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `survey_year` smallint unsigned NOT NULL DEFAULT 2569,
  `source_sheet` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'แบบฟอร์มสำรวจครุภัณฑ์ยูนิตทันตกรรม ปี 2569',
  `source_note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'ข้อมูล ณ วันที่ 29 เมษายน 2569',
  `seq_no` int unsigned DEFAULT NULL,
  `facility_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'รพ.สต./หน่วยบริการ',
  `district_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT 'เมืองสตูล',
  `tambon_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fixed_dental_staff` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'มีทันตบุคลากรประจำ',
  `fixed_dental_staff_count` int unsigned NOT NULL DEFAULT 0,
  `fixed_dental_staff_names` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rotating_dental_staff_schedule` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rotating_dental_staff_names` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dental_services` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'บริการทันตกรรม เช่น อุด/ขูด/ถอน',
  `dental_unit_count` int unsigned NOT NULL DEFAULT 0,
  `unit_age_text` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ready_unit_count` int unsigned DEFAULT NULL,
  `repair_unit_count` int unsigned DEFAULT NULL,
  `broken_unit_count` int unsigned DEFAULT NULL,
  `procurement_note` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'จำนวน/รายละเอียดที่ต้องการจัดซื้อ รื้อถอน หรืออื่นๆ',
  `service_days` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avg_patients_per_day` int unsigned DEFAULT NULL,
  `avg_patients_per_month` int unsigned DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lon` decimal(10,7) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=เปิดให้บริการ/ใช้งาน, 0=ไม่เปิดให้บริการ',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dental_units_source_seq` (`source_sheet`, `seq_no`),
  KEY `idx_dental_units_district` (`district_name`),
  KEY `idx_dental_units_tambon` (`tambon_name`),
  KEY `idx_dental_units_location` (`lat`, `lon`),
  KEY `idx_dental_units_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ข้อมูลสำรวจครุภัณฑ์ยูนิตทันตกรรม';

CREATE TABLE `dental_unit_reports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `dental_unit_id` bigint unsigned NOT NULL,
  `reporter_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reporter_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `report_type` enum('damaged','maintenance','battery','missing','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','in_progress','resolved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `admin_note` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notified_at` timestamp NULL DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dental_unit_reports_unit` (`dental_unit_id`),
  KEY `idx_dental_unit_reports_status` (`status`),
  CONSTRAINT `fk_dental_unit_reports_unit`
    FOREIGN KEY (`dental_unit_id`) REFERENCES `dental_units` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='รายงานปัญหา/แจ้งซ่อมยูนิตทันตกรรม';

INSERT INTO `dental_units` (
  `seq_no`, `facility_name`, `district_name`, `fixed_dental_staff`, `fixed_dental_staff_count`,
  `fixed_dental_staff_names`, `rotating_dental_staff_schedule`, `rotating_dental_staff_names`,
  `dental_services`, `dental_unit_count`, `unit_age_text`, `ready_unit_count`, `repair_unit_count`,
  `broken_unit_count`, `procurement_note`, `service_days`, `avg_patients_per_day`,
  `avg_patients_per_month`, `status`
) VALUES
(1, 'บ้านปาเต๊ะ', 'เมืองสตูล', 0, 0, NULL, '4 วัน/เดือน', 'นายศรันย์ หมินโฉ๊ะ', 'ถอน', 1, '20', NULL, NULL, 1, 'ถอนฟันได้อย่างเดียว', 'ทุกวันจันทร์', 8, 32, 1),
(2, 'บ้านวังพะเนียด', 'เมืองสตูล', 0, 0, NULL, '2 วัน/เดือน', 'อริสา จันทร์คง', 'ขูด/ถอน', 1, '3', 1, NULL, NULL, NULL, 'วันศุกร์ สัปดาห์ที่ 1 และ 3 ของเดือน', 8, 16, 1),
(3, 'บ้านควน 1', 'เมืองสตูล', 0, 0, NULL, '4 วัน/เดือน', 'อริสา จันทร์คง', 'ถอน', 1, '20+', NULL, NULL, 1, 'ระบบกรอและ suction ใช้งานไม่ได้ ยูนิตปรับขึ้น-ลง และเอนได้อย่างเดียว', 'ทุกวันพุธ', 8, 32, 1),
(4, 'บ้านทุ่ง', 'เมืองสตูล', 0, 0, NULL, '4 วัน/เดือน', 'นายฟัยซอล สุมาตรา', 'ขูด/ถอน', 1, '5 ปี', 1, NULL, NULL, NULL, 'ทุกวันอังคาร', 6, 24, 1),
(5, 'บ้านใหม่', 'เมืองสตูล', 0, 0, NULL, '4 วัน/เดือน', 'นายฟัยซอล สุมาตรา', 'ถอน', 1, '20+', NULL, NULL, 1, 'ยูนิตปรับขึ้น-ลง และเอนได้อย่างเดียว', 'ทุกวันพุธ', 8, 32, 1),
(6, 'ปูยู', 'เมืองสตูล', 0, 0, NULL, 'ไม่มี', 'ไม่มี', 'ไม่มี ส่งต่อ ไปยัง รพ.สตูล / ตำมะลัง', 0, '-', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0),
(7, 'เจ๊ะบิลัง', 'เมืองสตูล', 0, 0, NULL, '4 วัน/เดือน', 'ทพ.จิตรกร แก้วอุทัย / นายซอบีรีน สามัญ', 'อุด/ขูด/ถอน', 2, '5+', 1, 1, NULL, NULL, 'ทุกวันพุธ', 20, 80, 1),
(8, 'ฉลุง', 'เมืองสตูล', 0, 0, NULL, '8 วัน/เดือน', 'ทพ.จิตรกร แก้วอุทัย / นางสาววชิรา วงแหวน', 'ถอน', 2, '5+', 1, 1, NULL, 'ตัวที่ต้องส่งซ่อม ปั๊มลมรั่ว', 'ทุกวันจันทร์ และพฤหัสบดี', 15, 60, 1),
(9, 'ตำมะลัง', 'เมืองสตูล', 0, 0, NULL, '4 วัน/เดือน', 'นายอัมมาน หลีดินซุด', 'ถอน', 1, '20 ปี+', NULL, 1, NULL, 'ระบบกรอใช้งานไม่ได้ ยูนิตปรับขึ้น-ลง และเอนได้อย่างเดียว', 'ทุกวันพฤหัสบดี', 12, 48, 1),
(10, 'เกาะยาว', 'เมืองสตูล', 0, 0, NULL, 'ไม่มี', 'ไม่มี', 'ไม่มี ส่งต่อ ไปยัง รพ.สตูล / ตำมะลัง', 0, '-', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0),
(11, 'คลองขุด', 'เมืองสตูล', 0, 0, NULL, 'ไม่มี', 'ไม่มี', NULL, 1, '20 ปี+', NULL, NULL, 1, NULL, NULL, NULL, NULL, 0),
(12, 'ตันหยงโป', 'เมืองสตูล', 0, 0, NULL, 'ไม่มี', 'ไม่มี', 'ไม่มี ส่งต่อ ไปยัง เจ๊ะบิลัง / ควนขัน', 0, '-', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0),
(13, 'บ้านควน 2', 'เมืองสตูล', 0, 0, NULL, '4 วัน/เดือน', 'ทพ.จิตรกร แก้วอุทัย / นายซอบีรีน สามัญ', 'อุด/ขูด/ถอน', 1, '15+', NULL, 1, NULL, 'ปั๊มลม / suction เสีย', 'ทุกวันอังคาร', 15, 60, 1),
(14, 'เกาะสาหร่าย', 'เมืองสตูล', 0, 0, NULL, 'ไม่มี', 'ไม่มี', NULL, 0, '-', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0),
(15, 'ตันหยงกลิง', 'เมืองสตูล', 0, 0, NULL, 'ไม่มี', 'ไม่มี', NULL, 0, '-', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0),
(16, 'คลองขุด(สาขา)', 'เมืองสตูล', 0, 0, NULL, 'ไม่มี', 'ไม่มี', NULL, 0, '-', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0),
(17, 'ควนขัน', 'เมืองสตูล', 0, 0, NULL, '4 วัน/เดือน', 'นายอัมมาน หลีดินซุด', 'ขูด/ถอน', 1, '12 ปี+', 1, NULL, NULL, NULL, 'ทุกวันอังคาร', 10, 40, 1),
(18, 'หลีเป๊ะ', 'เมืองสตูล', 0, 0, NULL, 'ปีละ 2 ครั้ง ครั้งละ 3 วัน', 'นายอัสรัณย์ เบญญคุปต์', 'ขูด/ถอน', 1, '10+', NULL, 1, NULL, 'ระบบลม Airotor มีปัญหา', NULL, NULL, NULL, 1),
(19, 'pcu พิมาน1', 'เมืองสตูล', 0, 0, NULL, '12 วัน/เดือน', 'นายอัสรัณย์ เบญญคุปต์', 'อุด/ขูด/ถอน', 1, '5+', 1, NULL, NULL, NULL, 'ทุกวันพุธ และศุกร์', 10, 80, 1),
(20, 'pcu พิมาน2', 'เมืองสตูล', 0, 0, NULL, 'ไม่มี', 'ไม่มี', NULL, 0, '-', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0);
