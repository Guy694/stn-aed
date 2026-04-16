-- AED seed data prepared from all published Google Sheet tabs on 2026-04-16
-- Tabs merged: หน่วยบริการที่มีตำแหน่ง, หน่วยบริการ, งบสภากาชาดไทย, งบโครงการ, งบอบจ.
-- Coordinate priority: exact sheet coordinate > health_facilities match > tambon centroid

SET NAMES utf8mb4;
START TRANSACTION;

DROP TABLE IF EXISTS `aed`;

CREATE TABLE `aed` (
  `id` int NOT NULL AUTO_INCREMENT,
  `source_sheet` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อแท็บต้นทาง',
  `source_seq` int DEFAULT NULL COMMENT 'ลำดับในแท็บต้นทาง',
  `location_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ประเภทระเบียน เช่น facility_inventory หรือ community_site',
  `aed_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'รหัสเครื่อง AED ถ้ามี',
  `location_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อจุดติดตั้งหรือหน่วยบริการ',
  `manager_facility_id` int DEFAULT NULL COMMENT 'อ้างอิง health_facilities เมื่อจับคู่ได้',
  `manager_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'หน่วยงานหรือสถานบริการดูแลเครื่อง',
  `manager_typecode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ประเภทหน่วยดูแล',
  `changwat` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'สตูล',
  `district_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tambon_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `village_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'หมู่หรือรหัสหมู่บ้านจากต้นทาง',
  `quantity_total` int NOT NULL DEFAULT '0' COMMENT 'จำนวนเครื่องที่มี',
  `quantity_damaged` int NOT NULL DEFAULT '0' COMMENT 'จำนวนเครื่องชำรุด',
  `population_count` int DEFAULT NULL COMMENT 'จำนวนประชากร',
  `personnel_count` int DEFAULT NULL COMMENT 'จำนวนบุคลากร',
  `volunteer_count` int DEFAULT NULL COMMENT 'จำนวน อสม.',
  `service_area_villages` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'พื้นที่รับผิดชอบ',
  `serial_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'หมายเลขเครื่อง',
  `brand` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ยี่ห้อเครื่อง',
  `last_calibration_date` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'วันที่สอบเทียบล่าสุด',
  `battery_expiry_date` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'วันที่หมดอายุแบตเตอรี่',
  `lat` decimal(11,8) DEFAULT NULL COMMENT 'ละติจูด',
  `lon` decimal(11,8) DEFAULT NULL COMMENT 'ลองจิจูด',
  `coordinate_source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unknown' COMMENT 'ที่มาของพิกัด',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'หมายเหตุการรวมข้อมูล',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_aed_source` (`source_sheet`, `source_seq`),
  UNIQUE KEY `uq_aed_code` (`aed_code`),
  KEY `idx_aed_manager_facility` (`manager_facility_id`),
  KEY `idx_aed_district` (`district_name`),
  KEY `idx_aed_tambon` (`tambon_name`),
  KEY `idx_aed_location` (`lat`, `lon`),
  KEY `idx_aed_coordinate_source` (`coordinate_source`),
  CONSTRAINT `fk_aed_manager_facility`
    FOREIGN KEY (`manager_facility_id`) REFERENCES `health_facilities` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ข้อมูล AED ที่รวมจากทุกแท็บของเอกสารต้นทาง';

INSERT INTO `aed` (
  `source_sheet`, `source_seq`, `location_type`, `aed_code`,
  `location_name`, `manager_facility_id`, `manager_name`, `manager_typecode`,
  `changwat`, `district_name`, `tambon_name`, `village_no`,
  `quantity_total`, `quantity_damaged`, `population_count`, `personnel_count`,
  `volunteer_count`, `service_area_villages`, `serial_number`, `brand`,
  `last_calibration_date`, `battery_expiry_date`, `lat`, `lon`,
  `coordinate_source`, `notes`, `is_active`
) VALUES
(
    'งบโครงการ', 1, 'community_site', NULL,
    'อากีล่า รีสอร์ท', NULL, 'รพ.สต.เกาะหลีเป๊ะ', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'เกาะสาหร่าย', '7',
    1, 0, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 6.66294943, 99.75289625,
    'tambon_centroid', 'ข้อมูลจากแท็บงบโครงการ; ใช้ centroid ของตำบลเกาะสาหร่าย', 1
  ),
(
    'งบโครงการ', 2, 'community_site', NULL,
    'บันดาหยา', NULL, 'รพ.สต.เกาะหลีเป๊ะ', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'เกาะสาหร่าย', '7',
    1, 0, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 6.66294943, 99.75289625,
    'tambon_centroid', 'ข้อมูลจากแท็บงบโครงการ; ใช้ centroid ของตำบลเกาะสาหร่าย', 1
  ),
(
    'งบโครงการ', 3, 'community_site', NULL,
    'ไอดีลิค', NULL, 'รพ.สต.เกาะหลีเป๊ะ', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'เกาะสาหร่าย', '7',
    1, 0, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 6.66294943, 99.75289625,
    'tambon_centroid', 'ข้อมูลจากแท็บงบโครงการ; ใช้ centroid ของตำบลเกาะสาหร่าย', 1
  ),
(
    'งบโครงการ', 4, 'community_site', NULL,
    'ภูบาร์', NULL, 'รพ.สต.เกาะหลีเป๊ะ', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'เกาะสาหร่าย', '7',
    1, 0, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 6.66294943, 99.75289625,
    'tambon_centroid', 'ข้อมูลจากแท็บงบโครงการ; ใช้ centroid ของตำบลเกาะสาหร่าย', 1
  ),
(
    'งบโครงการ', 5, 'community_site', NULL,
    'อุทยานแห่งชาติเกาะอาดัง', NULL, 'รพ.สต.เกาะหลีเป๊ะ', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'เกาะสาหร่าย', '7',
    1, 0, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 6.66294943, 99.75289625,
    'tambon_centroid', 'ข้อมูลจากแท็บงบโครงการ; ใช้ centroid ของตำบลเกาะสาหร่าย', 1
  ),
(
    'งบสภากาชาดไทย', 1, 'community_site', NULL,
    'ท่าเทียบเรือตำมะลัง', NULL, 'ด่านควบคุมโรคติดต่อท่าเรือตำมะลัง', NULL,
    'สตูล', 'เมืองสตูล', 'ตำมะลัง', NULL,
    1, 0, NULL, NULL,
    NULL, NULL, 'B20C-00184', NULL,
    NULL, NULL, 6.55570874, 100.04466173,
    'tambon_centroid', 'ข้อมูลจากแท็บงบสภากาชาดไทย; ใช้ centroid ของตำบลตำมะลัง', 1
  ),
(
    'งบสภากาชาดไทย', 2, 'community_site', NULL,
    'ศูนย์วิทยาศาสตร์การกีฬาเทศบาลเมืองสตูล', NULL, 'เทศบาลเมืองสตูล', 'เทศบาล',
    'สตูล', 'เมืองสตูล', 'พิมาน', NULL,
    1, 0, NULL, NULL,
    NULL, NULL, 'B20C-01222', NULL,
    NULL, NULL, 6.61620497, 100.07379925,
    'tambon_centroid', 'ข้อมูลจากแท็บงบสภากาชาดไทย; ใช้ centroid ของตำบลพิมาน', 1
  ),
(
    'งบสภากาชาดไทย', 3, 'community_site', NULL,
    'สนามกีฬากลาง', NULL, 'อบจ.สตูล', 'อบจ.',
    'สตูล', 'เมืองสตูล', 'คลองขุด', NULL,
    1, 0, NULL, NULL,
    NULL, NULL, 'B20C-01224', NULL,
    NULL, NULL, 6.62315537, 100.12062640,
    'tambon_centroid', 'ข้อมูลจากแท็บงบสภากาชาดไทย; ใช้ centroid ของตำบลคลองขุด', 1
  ),
(
    'งบสภากาชาดไทย', 4, 'community_site', NULL,
    'ตลาดนัดตำบลฉลุง', NULL, 'เทศบาลตำบลฉลุง', 'เทศบาล',
    'สตูล', 'เมืองสตูล', 'ฉลุง', '2',
    1, 0, NULL, NULL,
    NULL, NULL, 'B20C-01226', NULL,
    NULL, NULL, 6.72684514, 100.04099704,
    'tambon_centroid', 'ข้อมูลจากแท็บงบสภากาชาดไทย; ใช้ centroid ของตำบลฉลุง', 1
  ),
(
    'งบสภากาชาดไทย', 5, 'community_site', NULL,
    'บ้านเกาะบุโหลนดอน', NULL, 'สุขศาลาเกาะบุโหลนดอน', NULL,
    'สตูล', 'ละงู', 'ปากน้ำ', NULL,
    1, 0, NULL, NULL,
    NULL, NULL, 'B20C-01229', NULL,
    NULL, NULL, 6.86705175, 99.72586569,
    'tambon_centroid', 'ข้อมูลจากแท็บงบสภากาชาดไทย; ใช้ centroid ของตำบลปากน้ำ', 1
  ),
(
    'งบสภากาชาดไทย', 6, 'community_site', NULL,
    'สวนสาธารณะเทศบาลตำบลกำแพง', NULL, 'เทศบาลตำบลกำแพง', 'เทศบาล',
    'สตูล', 'ละงู', 'กำแพง', NULL,
    1, 0, NULL, NULL,
    NULL, NULL, 'B20C-01230', NULL,
    NULL, NULL, 6.93295988, 99.77716583,
    'tambon_centroid', 'ข้อมูลจากแท็บงบสภากาชาดไทย; ใช้ centroid ของตำบลกำแพง', 1
  ),
(
    'งบสภากาชาดไทย', 7, 'community_site', NULL,
    'หน้าเซเว่นอิเลฟเว่น บ้านซอย 10', NULL, 'อบต.', 'อบต.',
    'สตูล', 'ควนกาหลง', 'ควนกาหลง', '2',
    1, 0, NULL, NULL,
    NULL, NULL, 'B20C-01235', NULL,
    NULL, NULL, 6.95255126, 100.02991866,
    'tambon_centroid', 'ข้อมูลจากแท็บงบสภากาชาดไทย; ใช้ centroid ของตำบลควนกาหลง', 1
  ),
(
    'งบสภากาชาดไทย', 8, 'community_site', NULL,
    'ตลาดนัดผัง 1 หน้าที่ทำการอบต.อุใดเจริญ', NULL, 'อบต.อุใดเจริญ', 'อบต.',
    'สตูล', 'ควนกาหลง', 'อุใดเจริญ', NULL,
    1, 0, NULL, NULL,
    NULL, NULL, 'B20C-01236', NULL,
    NULL, NULL, 6.90370984, 99.93811228,
    'tambon_centroid', 'ข้อมูลจากแท็บงบสภากาชาดไทย; ใช้ centroid ของตำบลอุใดเจริญ', 1
  ),
(
    'งบสภากาชาดไทย', 9, 'community_site', NULL,
    'สนามกีฬาศูนย์ราชการที่ว่าการอำเภอท่าแพ', NULL, 'อบต.ท่าแพ', 'อบต.',
    'สตูล', 'ท่าแพ', 'ท่าแพ', NULL,
    1, 0, NULL, NULL,
    NULL, NULL, 'B20C-01240', NULL,
    NULL, NULL, 6.79082868, 99.96434905,
    'tambon_centroid', 'ข้อมูลจากแท็บงบสภากาชาดไทย; ใช้ centroid ของตำบลท่าแพ', 1
  ),
(
    'งบสภากาชาดไทย', 10, 'community_site', NULL,
    'สนามกีฬากลางอำเภอท่าแพ จุดศาลาประชาคม', NULL, 'กลุ่มกู้ชีพเรารักษ์ท่าแพ', NULL,
    'สตูล', 'ท่าแพ', 'ท่าแพ', NULL,
    1, 0, NULL, NULL,
    NULL, NULL, 'B20C-01261', NULL,
    NULL, NULL, 6.79082868, 99.96434905,
    'tambon_centroid', 'ข้อมูลจากแท็บงบสภากาชาดไทย; ใช้ centroid ของตำบลท่าแพ', 1
  ),
(
    'งบสภากาชาดไทย', 11, 'community_site', NULL,
    'ด่านพรมแดนวังประจัน', NULL, 'ด่านควบคุมโรคติดต่อวังประจัน', NULL,
    'สตูล', 'ควนโดน', 'วังประจัน', NULL,
    1, 0, NULL, NULL,
    NULL, NULL, 'B20C-01286', NULL,
    NULL, NULL, 6.75290463, 100.15986834,
    'tambon_centroid', 'ข้อมูลจากแท็บงบสภากาชาดไทย; ใช้ centroid ของตำบลวังประจัน', 1
  ),
(
    'งบสภากาชาดไทย', 12, 'community_site', NULL,
    'อบต.นาทอน', NULL, 'อบต.นาทอน', 'อบต.',
    'สตูล', 'ทุ่งหว้า', 'นาทอน', NULL,
    1, 0, NULL, NULL,
    NULL, NULL, 'B20C-01288', NULL,
    NULL, NULL, 7.03193454, 99.74286035,
    'tambon_centroid', 'ข้อมูลจากแท็บงบสภากาชาดไทย; ใช้ centroid ของตำบลนาทอน', 1
  ),
(
    'งบสภากาชาดไทย', 13, 'community_site', NULL,
    'หน้าเซเว่นอิเลฟเว่น สี่แยกตลาดทุ่งหว้า', NULL, 'หจก.บริษัทเซเว่นฯ', NULL,
    'สตูล', 'ทุ่งหว้า', 'ทุ่งหว้า', '6',
    1, 0, NULL, NULL,
    NULL, NULL, 'B20C-01307', NULL,
    NULL, NULL, 7.12760387, 99.84967972,
    'tambon_centroid', 'ข้อมูลจากแท็บงบสภากาชาดไทย; ใช้ centroid ของตำบลทุ่งหว้า', 1
  ),
(
    'งบสภากาชาดไทย', 14, 'community_site', NULL,
    'อบต.นิคมพัฒนา', NULL, 'อบต.นิคมพัฒนา', 'อบต.',
    'สตูล', 'มะนัง', 'นิคมพัฒนา', NULL,
    1, 0, NULL, NULL,
    NULL, NULL, 'B20C-01470', NULL,
    NULL, NULL, 6.95200010, 99.92555392,
    'tambon_centroid', 'ข้อมูลจากแท็บงบสภากาชาดไทย; ใช้ centroid ของตำบลนิคมพัฒนา', 1
  ),
(
    'งบอบจ.', 1, 'community_site', NULL,
    'สนามรัชกิจประการ', NULL, 'โรงพยาบาลสตูล', NULL,
    'สตูล', 'เมืองสตูล', 'พิมาน', NULL,
    0, 1, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 6.61620497, 100.07379925,
    'tambon_centroid', 'ข้อมูลจากแท็บงบอบจ.; ใช้ centroid ของตำบลพิมาน', 1
  ),
(
    'งบอบจ.', 2, 'community_site', NULL,
    'ศูนย์ผลิตภัณฑ์พื้นเมือง', NULL, 'โรงพยาบาลควนโดน', NULL,
    'สตูล', 'ควนโดน', 'ควนโดน', '1',
    1, 1, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 6.81335051, 100.06019380,
    'tambon_centroid', 'ข้อมูลจากแท็บงบอบจ.; ใช้ centroid ของตำบลควนโดน', 1
  ),
(
    'งบอบจ.', 3, 'community_site', NULL,
    'ท่าเทียบเรือปากบารา', NULL, 'โรงพยาบาลละงู', NULL,
    'สตูล', 'ละงู', 'ปากน้ำ', NULL,
    1, 0, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 6.86705175, 99.72586569,
    'tambon_centroid', 'ข้อมูลจากแท็บงบอบจ.; ใช้ centroid ของตำบลปากน้ำ', 1
  ),
(
    'งบอบจ.', 4, 'community_site', NULL,
    'บริเวณถ้ำภูผาเพชร', NULL, 'โรงพยาบาลมะนัง', NULL,
    'สตูล', 'มะนัง', 'ปาล์มพัฒนา', '9',
    1, 0, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 7.06354444, 99.95350749,
    'tambon_centroid', 'ข้อมูลจากแท็บงบอบจ.; ใช้ centroid ของตำบลปาล์มพัฒนา', 1
  ),
(
    'หน่วยบริการ', 1, 'facility_inventory', NULL,
    '09604 - รพ.สต.คลองขุด หมู่ที่ 02 ตำบลคลองขุด', 12, 'รพ.สต.คลองขุด', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'คลองขุด', NULL,
    1, 0, 10566, 7,
    85, '1 2 5 6', NULL, NULL,
    NULL, NULL, 6.67377300, 100.11209300,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=12', 1
  ),
(
    'หน่วยบริการ', 2, 'facility_inventory', 'PBXF241003005',
    '09605 - รพ.สต.ควนขัน หมู่ที่ 03 ตำบลควนขัน', 15, 'รพ.สต.ควนขัน', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'ควนขัน', NULL,
    0, 0, 7576, 8,
    123, '1-6', NULL, NULL,
    NULL, NULL, 6.62558750, 100.04414060,
    'sheet_exact', 'ข้อมูลสำรวจหน่วยบริการ; ผูกกับแท็บหน่วยบริการที่มีตำแหน่ง', 1
  ),
(
    'หน่วยบริการ', 3, 'facility_inventory', NULL,
    '09606 - รพ.สต.บ้านควน หมู่ที่ 03 ตำบลบ้านควน', 29, 'รพ.สต.บ้านควน ตำบลบ้านควน', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'บ้านควน', NULL,
    0, 0, 7566, 6,
    89, '2 3 5 6 7', NULL, NULL,
    NULL, NULL, 6.70252500, 100.06616700,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=29', 1
  ),
(
    'หน่วยบริการ', 4, 'facility_inventory', NULL,
    '09607 - รพ.สต.บ้านควน หมู่ที่ 04 ตำบลบ้านควน', 29, 'รพ.สต.บ้านควน ตำบลบ้านควน', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'บ้านควน', NULL,
    1, 0, 3699, 5,
    54, '1 4', NULL, NULL,
    NULL, NULL, 6.70252500, 100.06616700,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=29', 1
  ),
(
    'หน่วยบริการ', 5, 'facility_inventory', NULL,
    '09608 - รพ.สต.บ้านฉลุง หมู่ที่ 02 ตำบลฉลุง', 32, 'รพ.สต.บ้านฉลุง ตำบลฉลุง', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'ฉลุง', NULL,
    1, 0, 8498, 7,
    182, '1 2 3 4 10 11 12 13', NULL, NULL,
    NULL, NULL, 6.73977100, 100.04176700,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=32', 1
  ),
(
    'หน่วยบริการ', 6, 'facility_inventory', NULL,
    '09609 - รพ.สต.บ้านทุ่ง หมู่ที่ 02 ตำบลฉลุง', 36, 'รพ.สต.บ้านทุ่ง ตำบลฉลุง', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'ฉลุง', NULL,
    0, 0, 5347, 5,
    89, '5 6 7 8 9 14', NULL, NULL,
    NULL, NULL, 6.73041500, 100.06521600,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=36', 1
  ),
(
    'หน่วยบริการ', 7, 'facility_inventory', NULL,
    '09610 - รพ.สต.บ้านตันหยงกลิง หมู่ที่ 03 ตำบลเกาะสาหร่าย', 33, 'รพ.สต.บ้านตันหยงกลิงตำบลเกาะสาหร่าย', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'เกาะสาหร่าย', NULL,
    0, 0, 1354, 4,
    70, '1 2 2003', NULL, NULL,
    NULL, NULL, 6.72181000, 99.86758000,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=33', 1
  ),
(
    'หน่วยบริการ', 8, 'facility_inventory', NULL,
    '09611 - รพ.สต.เกาะสาหร่าย หมู่ที่ 05 ตำบลเกาะสาหร่าย', 8, 'รพ.สต.เกาะสาหร่าย', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'เกาะสาหร่าย', NULL,
    1, 0, 2613, 4,
    49, '4 5 2006', NULL, NULL,
    NULL, NULL, 6.67075600, 99.86289800,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=8', 1
  ),
(
    'หน่วยบริการ', 9, 'facility_inventory', NULL,
    '09612 - รพ.สต.เกาะหลีเป๊ะ หมู่ที่ 07 ตำบลเกาะสาหร่าย', 9, 'รพ.สต.เกาะหลีเป๊ะ', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'เกาะสาหร่าย', NULL,
    4, 0, 1315, 5,
    10, '7 8', NULL, NULL,
    NULL, NULL, 6.49460800, 99.30754600,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=9', 1
  ),
(
    'หน่วยบริการ', 10, 'facility_inventory', NULL,
    '09613 - รพ.สต.ตันหยงโป หมู่ที่ 01 ตำบลตันหยงโป', 18, 'รพ.สต.ตันหยงโป', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'ตันหยงโป', NULL,
    1, 0, 3166, 4,
    43, '1 2 2003', NULL, NULL,
    NULL, NULL, 6.59504300, 99.95917700,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=18', 1
  ),
(
    'หน่วยบริการ', 11, 'facility_inventory', NULL,
    '09614 - รพ.สต.เจ๊ะบิลัง หมู่ที่ 02 ตำบลเจ๊ะบิลัง', 17, 'รพ.สต.เจ๊ะบิลัง', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'เจ๊ะบิลัง', NULL,
    1, 0, 7259, 7,
    107, '1 2 2005', NULL, NULL,
    NULL, NULL, 6.65506300, 99.98396100,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=17', 1
  ),
(
    'หน่วยบริการ', 12, 'facility_inventory', 'PBXF241003007',
    '09615 - รพ.สต.บ้านปาเต๊ะ หมู่ที่ 06 ตำบลเจ๊ะบิลัง', 42, 'รพ.สต.บ้านปาเต๊ะ ตำบลเจ๊ะบิลัง', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'เจ๊ะบิลัง', NULL,
    0, 0, 3195, 4,
    57, '3 4 2006', NULL, NULL,
    NULL, NULL, 6.73951900, 99.98307930,
    'sheet_exact', 'ข้อมูลสำรวจหน่วยบริการ; ผูกกับแท็บหน่วยบริการที่มีตำแหน่ง', 1
  ),
(
    'หน่วยบริการ', 13, 'facility_inventory', NULL,
    '09616 - รพ.สต.ตำมะลัง หมู่ที่ 03 ตำบลตำมะลัง', 19, 'รพ.สต.ตำมะลัง', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'ตำมะลัง', NULL,
    0, 0, 4905, 6,
    82, '1 2 2003', NULL, NULL,
    NULL, NULL, 6.53799600, 100.05299500,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=19', 1
  ),
(
    'หน่วยบริการ', 14, 'facility_inventory', NULL,
    '09617 - รพ.สต.บ้านเกาะยาว หมู่ที่ 01 ตำบลปูยู', 26, 'รพ.สต.บ้านเกาะยาว  ตำบลปูยู', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'ปูยู', NULL,
    1, 0, 737, 3,
    20, '1', NULL, NULL,
    NULL, NULL, 6.46706100, 100.07337900,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=26', 1
  ),
(
    'หน่วยบริการ', 15, 'facility_inventory', NULL,
    '09618 - รพ.สต.ปูยู หมู่ที่ 02 ตำบลปูยู', 54, 'รพ.สต.ปูยู', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'ปูยู', NULL,
    1, 0, 2421, 5,
    62, '2 3', NULL, NULL,
    NULL, NULL, 6.51399000, 100.09938000,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=54', 1
  ),
(
    'หน่วยบริการ', 16, 'facility_inventory', 'PBXF241003008',
    '09619 - รพ.สต.บ้านใหม่ หมู่ที่ 05 ตำบลควนโพธิ์', 51, 'รพ.สต.บ้านใหม่ ตำบลควนโพธิ์', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'ควนโพธิ์', NULL,
    0, 0, 6059, 5,
    136, '1 - 7', NULL, NULL,
    NULL, NULL, 6.77900740, 100.02547370,
    'sheet_exact', 'ข้อมูลสำรวจหน่วยบริการ; ผูกกับแท็บหน่วยบริการที่มีตำแหน่ง', 1
  ),
(
    'หน่วยบริการ', 17, 'facility_inventory', NULL,
    '09620 - รพ.สต.บ้านวังพะเนียด หมู่ที่ 05 ตำบลเกตรี', 49, 'รพ.สต.บ้านวังพะเนียด ตำบลเกตรี', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'เกตรี', NULL,
    1, 0, 6678, 7,
    155, '1 - 7', NULL, NULL,
    NULL, NULL, 6.67991400, 100.09788000,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=49', 1
  ),
(
    'หน่วยบริการ', 18, 'facility_inventory', 'PBXF241003018',
    '10746 - รพ.สตูล', 1, 'รพ.สตูล', 'รพ.ทั่วไป',
    'สตูล', 'เมืองสตูล', 'พิมาน', NULL,
    0, 0, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 6.61809290, 100.07084840,
    'sheet_exact', 'ข้อมูลสำรวจหน่วยบริการ; ผูกกับแท็บหน่วยบริการที่มีตำแหน่ง', 1
  ),
(
    'หน่วยบริการ', 19, 'facility_inventory', NULL,
    '22811 - สถานพยาบาลเรือนจำจังหวัดสตูล', NULL, '22811 - สถานพยาบาลเรือนจำจังหวัดสตูล', NULL,
    'สตูล', 'เมืองสตูล', 'พิมาน', NULL,
    0, 0, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 6.61620497, 100.07379925,
    'tambon_centroid', 'ข้อมูลสำรวจหน่วยบริการ; ใช้ centroid ของตำบลพิมาน', 1
  ),
(
    'หน่วยบริการ', 20, 'facility_inventory', NULL,
    '24672 - ศสช.ศรีพิมาน', 73, 'ศสช.ศรีพิมาน', 'ศสช.',
    'สตูล', 'เมืองสตูล', 'พิมาน', NULL,
    0, 0, 22812, NULL,
    143, NULL, NULL, NULL,
    NULL, NULL, 6.60177400, 100.06204000,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=73', 1
  ),
(
    'หน่วยบริการ', 21, 'facility_inventory', NULL,
    '77654 - รพ.สต.คลองขุด (สาขา) หมู่ที่ 04 ตำบลคลองขุด', 13, 'รพ.สต.คลองขุด (สาขา)', 'รพ.สต.',
    'สตูล', 'เมืองสตูล', 'คลองขุด', NULL,
    0, 0, 9730, 9,
    85, '3 4 2007', NULL, NULL,
    NULL, NULL, 6.64443000, 100.07396000,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=13', 1
  ),
(
    'หน่วยบริการ', 22, 'facility_inventory', NULL,
    '77708 - ศสช.พิมาน', 64, 'ศสช.พิมาน', 'ศสช.',
    'สตูล', 'เมืองสตูล', 'พิมาน', NULL,
    0, 0, NULL, NULL,
    119, NULL, NULL, NULL,
    NULL, NULL, 6.62440000, 100.06528000,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=64', 1
  ),
(
    'หน่วยบริการ', 23, 'facility_inventory', NULL,
    '09621 - รพ.สต.ควนโดน หมู่ที่ 01 ตำบลควนโดน', 16, 'รพ.สต.ควนโดน', 'รพ.สต.',
    'สตูล', 'ควนโดน', 'ควนโดน', NULL,
    1, 0, 9699, 7,
    168, '1 - 10', NULL, NULL,
    NULL, NULL, 6.78693300, 100.08088600,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=16', 1
  ),
(
    'หน่วยบริการ', 24, 'facility_inventory', NULL,
    '09622 - รพ.สต.บ้านกุบังปะโหลด หมู่ที่ 02 ตำบลควนสตอ', 25, 'รพ.สต.บ้านกุบังปะโหลด', 'รพ.สต.',
    'สตูล', 'ควนโดน', 'ควนสตอ', NULL,
    1, 0, 3320, 6,
    38, '1 - 4 ต.ควนสตอ', NULL, NULL,
    NULL, NULL, 6.74322000, 100.10019300,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=25', 1
  ),
(
    'หน่วยบริการ', 25, 'facility_inventory', NULL,
    '09623 - รพ.สต.ย่านซื่อ หมู่ที่ 04 ตำบลย่านซื่อ', 56, 'รพ.สต.ย่านซื่อ', 'รพ.สต.',
    'สตูล', 'ควนโดน', 'ย่านซื่อ', NULL,
    1, 0, 5184, 5,
    81, '1 - 7', NULL, NULL,
    NULL, NULL, 6.75706400, 100.06910600,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=56', 1
  ),
(
    'หน่วยบริการ', 26, 'facility_inventory', NULL,
    '09624 - รพ.สต.บ้านวังประจัน หมู่ที่ 03 ตำบลวังประจัน', 48, 'รพ.สต.บ้านวังประจัน ตำบลวังประจัน', 'รพ.สต.',
    'สตูล', 'ควนโดน', 'วังประจัน', NULL,
    1, 0, 3154, 5,
    59, '1 - 4', NULL, NULL,
    NULL, NULL, 6.75733200, 100.14595000,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=48', 1
  ),
(
    'หน่วยบริการ', 27, 'facility_inventory', NULL,
    '11402 - รพ.ควนโดน', 3, 'รพ.ควนโดน', 'รพ.ชุมชน',
    'สตูล', 'ควนโดน', 'ควนสตอ', NULL,
    0, 0, 5800, NULL,
    85, '5 - 10 ต.ควนสตอ', NULL, NULL,
    NULL, NULL, 6.77677200, 100.09536300,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=3', 1
  ),
(
    'หน่วยบริการ', 28, 'facility_inventory', NULL,
    '09625 - รพ.สต.ควนกาหลง หมู่ที่ 01 ตำบลควนกาหลง', 14, 'รพ.สต.ควนกาหลง', 'รพ.สต.',
    'สตูล', 'ควนกาหลง', 'ควนกาหลง', NULL,
    1, 0, 3689, 5,
    71, '1 2 10', NULL, NULL,
    NULL, NULL, 6.84114400, 100.07177600,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=14', 1
  ),
(
    'หน่วยบริการ', 29, 'facility_inventory', NULL,
    '09626 - รพ.สต.บ้านควนบ่อทอง หมู่ที่ 01 ตำบลทุ่งนุ้ย', 30, 'รพ.สต.บ้านควนบ่อทอง ตำบลทุ่งนุ้ย', 'รพ.สต.',
    'สตูล', 'ควนกาหลง', 'ทุ่งนุ้ย', NULL,
    1, 0, 4397, 6,
    86, '1 3 7 10 12 ต.ทุ่งนุ้ย', NULL, NULL,
    NULL, NULL, 6.84573400, 100.10214500,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=30', 1
  ),
(
    'หน่วยบริการ', 30, 'facility_inventory', NULL,
    '09627 - รพ.สต.ทุ่งนุ้ย หมู่ที่ 11 ตำบลทุ่งนุ้ย', 21, 'รพ.สต.ทุ่งนุ้ย', 'รพ.สต.',
    'สตูล', 'ควนกาหลง', 'ทุ่งนุ้ย', NULL,
    1, 0, 7573, 7,
    156, '2 4 5 6 8 9 11 ต.ทุ่งนุ้ย', NULL, NULL,
    NULL, NULL, 6.85705600, 100.11071400,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=21', 1
  ),
(
    'หน่วยบริการ', 31, 'facility_inventory', NULL,
    '09628 - รพ.สต.บ้านผัง 34 หมู่ที่ 02 ตำบลอุใดเจริญ', 44, 'รพ.สต.บ้านผัง 34  ตำบลอุใดเจริญ', 'รพ.สต.',
    'สตูล', 'ควนกาหลง', 'อุใดเจริญ', NULL,
    1, 0, 4614, 5,
    74, '2 3 5 8 ต.อุใดเจริญ', NULL, NULL,
    NULL, NULL, 6.87970800, 99.91108400,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=44', 1
  ),
(
    'หน่วยบริการ', 32, 'facility_inventory', NULL,
    '09629 - รพ.สต.อุไดเจริญ หมู่ที่ 01 ตำบลอุใดเจริญ', NULL, '09629 - รพ.สต.อุไดเจริญ หมู่ที่ 01 ตำบลอุใดเจริญ', 'รพ.สต.',
    'สตูล', 'ควนกาหลง', 'อุใดเจริญ', NULL,
    1, 0, 4162, 5,
    85, '1 4 6 7 9 ต.อุใดเจริญ', NULL, NULL,
    NULL, NULL, 6.90370984, 99.93811228,
    'tambon_centroid', 'ข้อมูลสำรวจหน่วยบริการ; ใช้ centroid ของตำบลอุใดเจริญ', 1
  ),
(
    'หน่วยบริการ', 33, 'facility_inventory', NULL,
    '11403 - รพ.ควนกาหลง', 2, 'รพ.ควนกาหลง', 'รพ.ชุมชน',
    'สตูล', 'ควนกาหลง', 'ควนกาหลง', NULL,
    0, 0, 4680, NULL,
    84, '3 4 2007', NULL, NULL,
    NULL, NULL, 6.86589900, 99.97461400,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=2', 1
  ),
(
    'หน่วยบริการ', 34, 'facility_inventory', NULL,
    '14096 - รพ.สต.บ้านกระทูน-พิปูนล้นเกล้า หมู่ที่ 09 ตำบลควนกาหลง', 24, 'รพ.สต.บ้านกะทูน-พิปูนล้นเกล้า', 'รพ.สต.',
    'สตูล', 'ควนกาหลง', 'ควนกาหลง', NULL,
    1, 0, 4316, 5,
    106, '5 6 2009', NULL, NULL,
    NULL, NULL, 6.89626900, 100.01892600,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=24', 1
  ),
(
    'หน่วยบริการ', 35, 'facility_inventory', NULL,
    '14097 - รพ.สต.บ้านเหนือคลอง หมู่ที่ 08 ตำบลควนกาหลง', 50, 'รพ.สต.บ้านเหนือคลอง  ตำบลควนกาหลง', 'รพ.สต.',
    'สตูล', 'ควนกาหลง', 'ควนกาหลง', NULL,
    1, 0, 2060, 4,
    38, '8 11', NULL, NULL,
    NULL, NULL, 6.99542500, 100.02269700,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=50', 1
  ),
(
    'หน่วยบริการ', 36, 'facility_inventory', NULL,
    '09630 - รพ.สต.แป-ระ หมู่ที่ 01 ตำบลแป-ระ', 55, 'รพ.สต.แป-ระ', 'รพ.สต.',
    'สตูล', 'ท่าแพ', 'แป-ระ', NULL,
    0, 0, 6226, 7,
    89, '1 - 7', NULL, NULL,
    NULL, NULL, 6.83927500, 99.92209600,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=55', 1
  ),
(
    'หน่วยบริการ', 37, 'facility_inventory', NULL,
    '09631 - รพ.สต.สาคร หมู่ที่ 02 ตำบลสาคร', 58, 'รพ.สต.สาคร', 'รพ.สต.',
    'สตูล', 'ท่าแพ', 'สาคร', NULL,
    1, 0, 4803, 5,
    87, '1 - 4', NULL, NULL,
    NULL, NULL, 6.74055700, 99.89790200,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=58', 1
  ),
(
    'หน่วยบริการ', 38, 'facility_inventory', NULL,
    '09632 - รพ.สต.บ้านทางยาง หมู่ที่ 07 ตำบลสาคร', 35, 'รพ.สต.บ้านทางยาง ตำบลสาคร', 'รพ.สต.',
    'สตูล', 'ท่าแพ', 'สาคร', NULL,
    1, 0, 3203, 6,
    69, '5 - 8', NULL, NULL,
    NULL, NULL, 6.82711200, 99.87532900,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=35', 1
  ),
(
    'หน่วยบริการ', 39, 'facility_inventory', NULL,
    '09633 - รพ.สต.บ้านแป-ระใต้ หมู่ที่ 04 ตำบลท่าเรือ', 43, 'รพ.สต.บ้านแป-ระใต้', 'รพ.สต.',
    'สตูล', 'ท่าแพ', 'ท่าเรือ', NULL,
    1, 0, 2406, 4,
    60, '2 - 4', NULL, NULL,
    NULL, NULL, 6.81798700, 99.92600800,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=43', 1
  ),
(
    'หน่วยบริการ', 40, 'facility_inventory', NULL,
    '14098 - รพ.สต.ท่าเรือ หมู่ที่ 05 ตำบลท่าเรือ', 20, 'รพ.สต.ท่าเรือ', 'รพ.สต.',
    'สตูล', 'ท่าแพ', 'ท่าเรือ', NULL,
    0, 0, 2734, 5,
    51, '1,5,6', NULL, NULL,
    NULL, NULL, 6.82482900, 99.93186000,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=20', 1
  ),
(
    'หน่วยบริการ', 41, 'facility_inventory', NULL,
    '24058 - ศสช.ตำบลท่าแพ', 63, 'ศสช.ท่าแพ', 'ศสช.',
    'สตูล', 'ท่าแพ', 'ท่าแพ', NULL,
    0, 0, 10273, NULL,
    149, '1-10 , ม.1 สาคร', NULL, NULL,
    NULL, NULL, 6.78817000, 99.97010000,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=63', 1
  ),
(
    'หน่วยบริการ', 42, 'facility_inventory', NULL,
    '11404 - รพ.ท่าแพ', 4, 'รพ.ท่าแพ', 'รพ.ชุมชน',
    'สตูล', 'ท่าแพ', 'ท่าแพ', NULL,
    0, 0, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 6.78804800, 99.97021500,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=4', 1
  ),
(
    'หน่วยบริการ', 43, 'facility_inventory', NULL,
    '09634 - รพ.สต.ละงู หมู่ที่ 02 ตำบลละงู', 57, 'รพ.สต.ละงู', 'รพ.สต.',
    'สตูล', 'ละงู', 'ละงู', NULL,
    0, 0, 7289, 6,
    113, '1,2,7,14,18', NULL, NULL,
    NULL, NULL, 6.83014600, 99.78992600,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=57', 1
  ),
(
    'หน่วยบริการ', 44, 'facility_inventory', NULL,
    '09635 - รพ.สต.บ้านห้วยไทร หมู่ที่ 10 ตำบลละงู', 59, 'รพ.สต.ห้วยไทร', 'รพ.สต.',
    'สตูล', 'ละงู', 'ละงู', NULL,
    0, 0, 7429, 6,
    106, '5,8,9,10,11,13,16', NULL, NULL,
    NULL, NULL, 6.86260000, 99.87223000,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=59', 1
  ),
(
    'หน่วยบริการ', 45, 'facility_inventory', 'PBXF241003002',
    '09636 - รพ.สต.บ้านในเมือง หมู่ที่ 12 ตำบลละงู', 40, 'รพ.สต.บ้านในเมือง ตำบลละงู', 'รพ.สต.',
    'สตูล', 'ละงู', 'ละงู', NULL,
    0, 0, 8488, 6,
    97, '3,4,6,12,15,17', NULL, NULL,
    NULL, NULL, 6.86019980, 99.79280580,
    'sheet_exact', 'ข้อมูลสำรวจหน่วยบริการ; ผูกกับแท็บหน่วยบริการที่มีตำแหน่ง', 1
  ),
(
    'หน่วยบริการ', 46, 'facility_inventory', NULL,
    '09637 - รพ.สต.เขาขาว หมู่ที่ 05 ตำบลเขาขาว', 11, 'รพ.สต.เขาขาว', 'รพ.สต.',
    'สตูล', 'ละงู', 'เขาขาว', NULL,
    0, 0, 6588, 6,
    131, '1 - 7', NULL, NULL,
    NULL, NULL, 6.91399300, 99.82389900,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=11', 1
  ),
(
    'หน่วยบริการ', 47, 'facility_inventory', NULL,
    '09638 - รพ.สต.บ้านบ่อเจ็ดลูก หมู่ที่ 01 ตำบลปากน้ำ', 41, 'รพ.สต.บ้านบ่อเจ็ดลูก', 'รพ.สต.',
    'สตูล', 'ละงู', 'ปากน้ำ', NULL,
    1, 0, 1675, 3,
    32, '1,3', NULL, NULL,
    NULL, NULL, 6.87756800, 99.70000200,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=41', 1
  ),
(
    'หน่วยบริการ', 48, 'facility_inventory', NULL,
    '09639 - รพ.สต.ปากน้ำ หมู่ที่ 04 ตำบลปากน้ำ', 52, 'รพ.สต.ปากน้ำ', 'รพ.สต.',
    'สตูล', 'ละงู', 'ปากน้ำ', NULL,
    1, 0, 9522, 7,
    104, '2,4,5,6,7', NULL, NULL,
    NULL, NULL, 6.84701200, 99.76080800,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=52', 1
  ),
(
    'หน่วยบริการ', 49, 'facility_inventory', 'PBXF241003010',
    '09640 - รพ.สต.บ้านทุ่งไหม้ หมู่ที่ 01 ตำบลน้ำผุด', 38, 'รพ.สต.บ้านทุ่งไหม้  ตำบลน้ำผุด', 'รพ.สต.',
    'สตูล', 'ละงู', 'น้ำผุด', NULL,
    0, 0, 4010, 6,
    59, '1,2,3,7,8', NULL, NULL,
    NULL, NULL, 6.95363220, 99.84176780,
    'sheet_exact', 'ข้อมูลสำรวจหน่วยบริการ; ผูกกับแท็บหน่วยบริการที่มีตำแหน่ง', 1
  ),
(
    'หน่วยบริการ', 50, 'facility_inventory', 'PBXF241003015',
    '09641 - รพ.สต.น้ำผุด หมู่ที่ 05 ตำบลน้ำผุด', 23, 'รพ.สต.น้ำผุด', 'รพ.สต.',
    'สตูล', 'ละงู', 'น้ำผุด', NULL,
    0, 0, 5680, 5,
    92, '4,5,6,9,10,11', NULL, NULL,
    NULL, NULL, 7.15377157, 99.94354007,
    'sheet_exact', 'ข้อมูลสำรวจหน่วยบริการ; ผูกกับแท็บหน่วยบริการที่มีตำแหน่ง', 1
  ),
(
    'หน่วยบริการ', 51, 'facility_inventory', NULL,
    '09642 - รพ.สต.แหลมสน หมู่ที่ 03 ตำบลแหลมสน', 60, 'รพ.สต.แหลมสน', 'รพ.สต.',
    'สตูล', 'ละงู', 'แหลมสน', NULL,
    0, 0, 2988, 4,
    42, '2,3,4,6', NULL, NULL,
    NULL, NULL, 6.94791000, 99.69213100,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=60', 1
  ),
(
    'หน่วยบริการ', 52, 'facility_inventory', NULL,
    '11405 - รพ.ละงู', 7, 'รพ.ละงู', 'รพ.ชุมชน',
    'สตูล', 'ละงู', 'กำแพง', NULL,
    0, 0, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 6.83063000, 99.78947000,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=7', 1
  ),
(
    'หน่วยบริการ', 53, 'facility_inventory', 'PBXF241003012',
    '22015 - รพ.สต.บ้านตันหยงละไน้ หมู่ที่ 01 ตำบลแหลมสน', 34, 'รพ.สต.บ้านตันหยงละไน้ ตำบลแหลมสน', 'รพ.สต.',
    'สตูล', 'ละงู', 'แหลมสน', NULL,
    0, 0, 825, 3,
    20, '1,5', NULL, NULL,
    NULL, NULL, 6.96860470, 99.68485060,
    'sheet_exact', 'ข้อมูลสำรวจหน่วยบริการ; ผูกกับแท็บหน่วยบริการที่มีตำแหน่ง', 1
  ),
(
    'หน่วยบริการ', 54, 'facility_inventory', NULL,
    '77707 - ศสช.กำแพง', 62, 'ศสช.กำแพง', 'ศสช.',
    'สตูล', 'ละงู', 'กำแพง', NULL,
    0, 0, 19152, NULL,
    227, '1 - 12', NULL, NULL,
    NULL, NULL, 6.87658000, 99.78339000,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=62', 1
  ),
(
    'หน่วยบริการ', 55, 'facility_inventory', NULL,
    '09643 - รพ.สต.บ้านนาทอน หมู่ที่ 02 ตำบลนาทอน', 39, 'รพ.สต.บ้านนาทอน ตำบลนาทอน', 'รพ.สต.',
    'สตูล', 'ทุ่งหว้า', 'นาทอน', NULL,
    0, 0, 4512, 6,
    63, '1,2,3,6,7', NULL, NULL,
    NULL, NULL, 7.06857200, 99.75193500,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=39', 1
  ),
(
    'หน่วยบริการ', 56, 'facility_inventory', NULL,
    '09644 - รพ.สต.บ้านวังตง หมู่ที่ 04 ตำบลนาทอน', 47, 'รพ.สต.บ้านวังตง ตำบลนาทอน', 'รพ.สต.',
    'สตูล', 'ทุ่งหว้า', 'นาทอน', NULL,
    0, 0, 2916, 5,
    54, '4,5,8,9', NULL, NULL,
    NULL, NULL, 6.98585700, 99.75180000,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=47', 1
  ),
(
    'หน่วยบริการ', 57, 'facility_inventory', 'PBXF241003003',
    '09645 - รพ.สต.ขอนคลาน หมู่ที่ 03 ตำบลขอนคลาน', 10, 'รพ.สต.ขอนคลาน', 'รพ.สต.',
    'สตูล', 'ทุ่งหว้า', 'ขอนคลาน', NULL,
    0, 0, 2827, 5,
    47, '1 - 4', NULL, NULL,
    NULL, NULL, 7.00731040, 99.68375980,
    'sheet_exact', 'ข้อมูลสำรวจหน่วยบริการ; ผูกกับแท็บหน่วยบริการที่มีตำแหน่ง', 1
  ),
(
    'หน่วยบริการ', 58, 'facility_inventory', NULL,
    '09646 - รพ.สต.ทุ่งบุหลัง หมู่ที่ 05 ตำบลทุ่งบุหลัง', 22, 'รพ.สต.ทุ่งบุหลัง', 'รพ.สต.',
    'สตูล', 'ทุ่งหว้า', 'ทุ่งบุหลัง', NULL,
    1, 0, 2351, 4,
    44, '1 - 5', NULL, NULL,
    NULL, NULL, 7.03468000, 99.68653000,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=22', 1
  ),
(
    'หน่วยบริการ', 59, 'facility_inventory', NULL,
    '09647 - รพ.สต.บ้านทุ่งดินลุ่ม หมู่ที่ 05 ตำบลป่าแก่บ่อหิน', 37, 'รพ.สต.บ้านทุ่งดินลุ่ม ตำบลป่าแก่บ่อหิน', 'รพ.สต.',
    'สตูล', 'ทุ่งหว้า', 'ป่าแก่บ่อหิน', NULL,
    0, 0, 2474, 4,
    41, '1,2,4,5', NULL, NULL,
    NULL, NULL, 7.05688100, 99.80198200,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=37', 1
  ),
(
    'หน่วยบริการ', 60, 'facility_inventory', NULL,
    '09648 - รพ.สต.บ้านเขาแดง หมู่ที่ 07 ตำบลป่าแก่บ่อหิน', 27, 'รพ.สต.บ้านเขาแดง ตำบลป่าแก่บ่อหิน', 'รพ.สต.',
    'สตูล', 'ทุ่งหว้า', 'ป่าแก่บ่อหิน', NULL,
    1, 0, 2003, 5,
    43, '3,6,7', NULL, NULL,
    NULL, NULL, 7.05772400, 99.83839700,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=27', 1
  ),
(
    'หน่วยบริการ', 61, 'facility_inventory', NULL,
    '11406 - รพ.ทุ่งหว้า', 5, 'รพ.ทุ่งหว้า', 'รพ.ชุมชน',
    'สตูล', 'ทุ่งหว้า', 'ทุ่งหว้า', NULL,
    0, 0, 5148, NULL,
    114, '1-6,8', NULL, NULL,
    NULL, NULL, 7.09256500, 99.76671700,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=5', 1
  ),
(
    'หน่วยบริการ', 62, 'facility_inventory', NULL,
    '14715 - รพ.สต.บ้านคีรีวง หมู่ที่ 10 ตำบลทุ่งหว้า', 31, 'รพ.สต.บ้านคีรีวง ตำบลทุ่งหว้า', 'รพ.สต.',
    'สตูล', 'ทุ่งหว้า', 'ทุ่งหว้า', NULL,
    1, 0, 2213, 5,
    41, '7,9,10', NULL, NULL,
    NULL, NULL, 7.09285200, 99.80935800,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=31', 1
  ),
(
    'หน่วยบริการ', 63, 'facility_inventory', NULL,
    '09649 - รพ.สต.ตำบลปาล์มพัฒนา หมู่ที่ 08 ตำบลปาล์มพัฒนา', 53, 'รพ.สต.ปาล์มพัฒนา ', 'รพ.สต.',
    'สตูล', 'มะนัง', 'ปาล์มพัฒนา', NULL,
    1, 0, 4590, 7,
    63, '2 4 7 8', NULL, NULL,
    NULL, NULL, 7.00584400, 99.94518500,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=53', 1
  ),
(
    'หน่วยบริการ', 64, 'facility_inventory', NULL,
    '09650 - รพ.สต.บ้านมะนัง หมู่ที่ 05 ตำบลปาล์มพัฒนา', 46, 'รพ.สต.บ้านมะนัง ตำบลปาล์มพัฒนา', 'รพ.สต.',
    'สตูล', 'มะนัง', 'ปาล์มพัฒนา', NULL,
    1, 0, 3244, 4,
    53, '5 6 2009', NULL, NULL,
    NULL, NULL, 7.06288700, 99.91451700,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=46', 1
  ),
(
    'หน่วยบริการ', 65, 'facility_inventory', NULL,
    '09651 - รพ.สต.บ้านผัง 50 หมู่ที่ 05 ตำบลนิคมพัฒนา', 45, 'รพ.สต.บ้านผัง 50 ตำบลนิคมพัฒนา', 'รพ.สต.',
    'สตูล', 'มะนัง', 'นิคมพัฒนา', NULL,
    1, 0, 2532, 4,
    42, '4 5 2006', NULL, NULL,
    NULL, NULL, 6.94195000, 99.88573600,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=45', 1
  ),
(
    'หน่วยบริการ', 66, 'facility_inventory', NULL,
    '09652 - รพ.สต.เฉลิมพระเกียรติ 60 พรรษา นวมินทราชินี', NULL, '09652 - รพ.สต.เฉลิมพระเกียรติ 60 พรรษา นวมินทราชินี', 'รพ.สต.',
    'สตูล', 'มะนัง', 'นิคมพัฒนา', NULL,
    1, 0, 5256, 8,
    83, '1,2,3,7,8,9 ต.นิคมฯ', NULL, NULL,
    NULL, NULL, 6.95200010, 99.92555392,
    'tambon_centroid', 'ข้อมูลสำรวจหน่วยบริการ; ใช้ centroid ของตำบลนิคมพัฒนา', 1
  ),
(
    'หน่วยบริการ', 67, 'facility_inventory', NULL,
    '28786 - รพ.มะนัง', 6, 'รพ.มะนัง', 'รพ.ชุมชน',
    'สตูล', 'มะนัง', 'ปาล์มพัฒนา', NULL,
    0, 0, 2890, NULL,
    42, '1 3 10 ต.ปาล์มพัฒนา', NULL, NULL,
    NULL, NULL, 7.00599700, 99.91700900,
    'facility_match', 'ข้อมูลสำรวจหน่วยบริการ; ใช้พิกัดจาก health_facilities.id=6', 1
  ),
(
    'หน่วยบริการที่มีตำแหน่ง', 7, 'facility_inventory', 'PBXF241003009',
    'รพ.แประ', NULL, 'รพ.แประ', 'รพ.',
    'สตูล', NULL, NULL, NULL,
    1, 0, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 6.83922650, 99.92214090,
    'sheet_exact', 'มีพิกัดและรหัสเครื่องจากแท็บหน่วยบริการที่มีตำแหน่ง; ไม่มีแถวคู่ในแท็บหน่วยบริการ', 1
  ),
(
    'หน่วยบริการที่มีตำแหน่ง', 10, 'facility_inventory', 'PBXF241003004',
    'รพ.สต.บ้านมุ่งดินลุ่ม', NULL, 'รพ.สต.บ้านมุ่งดินลุ่ม', 'รพ.สต.',
    'สตูล', NULL, NULL, NULL,
    1, 0, NULL, NULL,
    NULL, NULL, NULL, NULL,
    NULL, NULL, 7.05609000, 99.80212200,
    'sheet_exact', 'มีพิกัดและรหัสเครื่องจากแท็บหน่วยบริการที่มีตำแหน่ง; ไม่มีแถวคู่ในแท็บหน่วยบริการ', 1
  )
ON DUPLICATE KEY UPDATE
  `location_type` = VALUES(`location_type`),
  `aed_code` = VALUES(`aed_code`),
  `location_name` = VALUES(`location_name`),
  `manager_facility_id` = VALUES(`manager_facility_id`),
  `manager_name` = VALUES(`manager_name`),
  `manager_typecode` = VALUES(`manager_typecode`),
  `changwat` = VALUES(`changwat`),
  `district_name` = VALUES(`district_name`),
  `tambon_name` = VALUES(`tambon_name`),
  `village_no` = VALUES(`village_no`),
  `quantity_total` = VALUES(`quantity_total`),
  `quantity_damaged` = VALUES(`quantity_damaged`),
  `population_count` = VALUES(`population_count`),
  `personnel_count` = VALUES(`personnel_count`),
  `volunteer_count` = VALUES(`volunteer_count`),
  `service_area_villages` = VALUES(`service_area_villages`),
  `serial_number` = VALUES(`serial_number`),
  `brand` = VALUES(`brand`),
  `last_calibration_date` = VALUES(`last_calibration_date`),
  `battery_expiry_date` = VALUES(`battery_expiry_date`),
  `lat` = VALUES(`lat`),
  `lon` = VALUES(`lon`),
  `coordinate_source` = VALUES(`coordinate_source`),
  `notes` = VALUES(`notes`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = CURRENT_TIMESTAMP;

COMMIT;
