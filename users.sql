-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db:3306
-- Generation Time: Apr 16, 2026 at 03:49 AM
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
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','user') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `role`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2b$10$rYKKJaoPaznSZKqPXwNcX.pdTX5Ax22t5hHphvVjwW4ZqOKMwpJWq', 'ผู้ดูแลระบบ', 'admin', '2026-02-05 01:46:26', '2026-02-05 01:46:26'),
(2, 'chakrit', '$2b$10$rYKKJaoPaznSZKqPXwNcX.pdTX5Ax22t5hHphvVjwW4ZqOKMwpJWq', '1234', 'user', '2026-02-05 02:06:24', '2026-02-05 02:06:24'),
(3, 'testuser', '$2b$10$F1jl/rGbH/wPntuNKVcpX.jn6pTtOMNPuKxbcjoihonTxo2GLMSPa', 'Test User', 'user', '2026-02-05 06:53:31', '2026-02-05 06:53:31'),
(4, 'sky', '$2b$10$6ho54bQXusYR5EsKKDfdTehyq1dhQRu9b2MbmdNBfSG6/sM2sxXVe', 'ชาคริต ทองนวล', 'user', '2026-02-06 15:20:10', '2026-02-06 15:20:10'),
(5, '55', '$2b$10$EkwEtxPONbW1ybj9Tb6GBuEq...lCT74Kpthkla7E4BHmY.ure4ZS', '55', 'user', '2026-02-09 08:09:52', '2026-02-09 08:09:52');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
