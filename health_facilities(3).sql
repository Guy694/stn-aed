-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db:3306
-- Generation Time: Apr 16, 2026 at 03:52 AM
-- Server version: 8.0.44
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `stn_aed`
--

-- --------------------------------------------------------

--
-- Table structure for table `health_facilities`
--

CREATE TABLE `health_facilities` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อสถานพยาบาล',
  `typecode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ประเภท เช่น รพ.ทั่วไป, รพ.ชุมชน, รพ.สต., ศสช., สสจ, สสอ., สอน.',
  `changwat` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'สตูล' COMMENT 'จังหวัด',
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ที่อยู่',
  `tambon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ตำบล',
  `lat` decimal(10,6) NOT NULL COMMENT 'ละติจูด',
  `lon` decimal(10,6) NOT NULL COMMENT 'ลองจิจูด',
  `district_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ชื่ออำเภอที่ตั้ง',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'สถานะการใช้งาน',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ข้อมูลสถานพยาบาลในจังหวัดสตูล';

--
-- Dumping data for table `health_facilities`
--

INSERT INTO `health_facilities` (`id`, `name`, `typecode`, `changwat`, `address`, `tambon`, `lat`, `lon`, `district_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'รพ.สตูล', 'รพ.ทั่วไป', 'สตูล', '', '', 6.619127, 100.070431, 'เมืองสตูล', 1, '2025-12-11 02:34:44', '2025-12-11 02:34:44'),
(2, 'รพ.ควนกาหลง', 'รพ.ชุมชน', 'สตูล', '', '', 6.865899, 99.974614, 'ควนกาหลง', 1, '2025-12-11 02:34:44', '2025-12-11 02:34:44'),
(3, 'รพ.ควนโดน', 'รพ.ชุมชน', 'สตูล', '', '', 6.776772, 100.095363, 'ควนโดน', 1, '2025-12-11 02:34:44', '2025-12-11 02:34:44'),
(4, 'รพ.ท่าแพ', 'รพ.ชุมชน', 'สตูล', '', '', 6.788048, 99.970215, 'ท่าแพ', 1, '2025-12-11 02:34:44', '2025-12-11 02:34:44'),
(5, 'รพ.ทุ่งหว้า', 'รพ.ชุมชน', 'สตูล', '', '', 7.092565, 99.766717, 'ทุ่งหว้า', 1, '2025-12-11 02:34:44', '2025-12-11 02:34:44');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `health_facilities`
--
ALTER TABLE `health_facilities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_typecode` (`typecode`),
  ADD KEY `idx_location` (`lat`,`lon`),
  ADD KEY `idx_district` (`district_name`),
  ADD KEY `idx_active` (`is_active`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `health_facilities`
--
ALTER TABLE `health_facilities`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
