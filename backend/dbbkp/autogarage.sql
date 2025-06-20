-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 20, 2025 at 01:00 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `autogarage`
--

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `customerName` varchar(255) NOT NULL,
  `mobile` text NOT NULL,
  `vehicles` text DEFAULT NULL,
  `regDate` date DEFAULT NULL,
  `scId` int(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `customerName`, `mobile`, `vehicles`, `regDate`, `scId`) VALUES
(4, 'angad Mane', '8866885566', 'MH13AB4547', '2024-10-17', 2),
(5, 'Kashinath Chormale', '9766474229', 'MH23AB4599', '2024-10-19', 2),
(9, 'Kashinath Chormale', '98989898989', 'MH23AB4599', '2024-10-20', 3),
(10, 'dasds', '8989898989', 'MH-13-SD-4', '2024-10-20', 3),
(11, 'jitesh', '8989898989', 'MH-13-SD-4', '2024-10-20', 2),
(12, 'NEW', '8989898989', 'MH-13-SD-4', '2024-10-20', 3),
(13, 'aj11', '919766474227', 'MH-34-SD-3', '2024-10-22', 1),
(14, 'ashish wangi', '9876543210', 'MH-12-DF-5423', '2024-10-21', 2),
(15, 'jitesh123', '8989898989', 'MH-13-SD-4578', '2024-10-23', 1),
(16, 'savan', '5665787787', 'MH-12-SD-4585', '2024-02-21', 1),
(19, 'SARIKA', '5656989898', 'MH-45-SD-3423', '2024-03-01', 1),
(21, 'Gopikishan', '5656878787', 'MH-34-SD-2356, MH-45-DS-3423', '2024-10-22', 1),
(37, 'Sachin', '8754213664', 'MH-23-SF-2345', '2024-10-23', 1),
(38, 'Anagad mane', '9874562130', 'MH-23-DF-2356', '2024-11-17', 1),
(39, 'Surjit Megeri', '9890657748', 'MH-12-FG-4578', '2024-11-17', 1),
(40, 'jitesh', '8989898989', 'MH-13-SD-4578', '2024-11-18', 1),
(41, 'jitesh', '8989898989', 'MH-13-SD-4578', '2024-11-18', 1),
(42, 'Yogesh', '8983458515', 'MH-13-CN-5265', '2024-11-19', 1),
(43, 'Saheb', '123456789', 'Mh-13-ab-7867, Mh-08-gf-7890', '2022-01-08', 2),
(62, 'Saheb23', '21546312', 'HR-10-ab-7282, Mh-12-sg-6542', '2025-09-06', 2),
(63, 'Kriti sanon', '65431287964', 'Mh56ag7890', '2021-05-20', 2),
(64, 'Raghini sawant', '9851456321', 'Mh-12-ad-1234, Mh-12-fg-1234', '2025-06-17', 1),
(66, 'Somesh computer', '098765432', 'Mh13aa0011', '2025-01-06', 2);

-- --------------------------------------------------------

--
-- Table structure for table `servicecenters`
--

CREATE TABLE `servicecenters` (
  `serviceCenterName` varchar(50) DEFAULT NULL,
  `proprietorName` varchar(30) DEFAULT NULL,
  `proprietorMobile` varchar(10) DEFAULT NULL,
  `serviceCenterAddress` varchar(50) DEFAULT NULL,
  `proprietorEmail` varchar(30) DEFAULT NULL,
  `id` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `servicecenters`
--

INSERT INTO `servicecenters` (`serviceCenterName`, `proprietorName`, `proprietorMobile`, `serviceCenterAddress`, `proprietorEmail`, `id`) VALUES
('Akash Bike Service Center', 'Akash Shirolkar', '9876541230', 'Hiraj naka solapur', 'akash@test.com', 1),
('Jitesh Motor services', 'Jit megeri', '7879656565', 'sidhjin hous society', 'jit@test.com', 2),
('Ashish W service Partner', 'Ashish W', '5656566656', 'ashish w solapur', 'ashish@test.com', 3),
('Yogesh bike services', 'Yogesh mane', '6546589898', 'solapur city police', 'y@test.com', 4),
('kc1', 'kc', '9898989898', 'kc pune', 'kc@test.com', 10),
('Rajesh service1', 'Rajesh keni', '9850121314', 'Mumbai', 'Raj@gmail.com', 22),
('Raghav centre', 'Raghav', '9876543120', 'Merut', 'Ragha@hotmail.com', 23);

-- --------------------------------------------------------

--
-- Table structure for table `servicehistory`
--

CREATE TABLE `servicehistory` (
  `id` int(10) NOT NULL,
  `selectedBike` varchar(50) NOT NULL,
  `selectedServices` varchar(100) NOT NULL,
  `serviceDate` date NOT NULL,
  `serviceRemark` varchar(150) NOT NULL,
  `customerId` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `servicehistory`
--

INSERT INTO `servicehistory` (`id`, `selectedBike`, `selectedServices`, `serviceDate`, `serviceRemark`, `customerId`) VALUES
(10, 'MH-34-SD-3', 'oilChange, fullService, mediumService', '2024-11-18', 'asas', 13),
(11, 'MH-45-DS-3423', 'oilChange, mediumService, miscellaneous', '2024-11-18', 'test1', 21),
(12, 'MH13AB4547', 'oilChange, fullService, miscellaneous', '2024-11-18', 'chain cover', 4),
(13, 'MH13AB4547', 'oilChange, fullService, mediumService', '2024-11-18', 'BUPER CHANGE', 4),
(14, 'MH13AB4547', 'miscellaneous', '2024-11-19', 'BIKE STAND', 4),
(15, 'MH13AB4547', 'fullService', '2025-06-17', 'Overalling\nParts changed', 4),
(16, 'MH-13-SD-4', 'miscellaneous', '2025-06-18', 'Change parts', 11),
(17, 'Mh13aa0011', 'mediumService', '2025-06-19', 'Test bike service', 66);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `scId` int(11) DEFAULT NULL,
  `firstLoginDone` tinyint(1) DEFAULT 0,
  `role` varchar(50) NOT NULL DEFAULT 'service_center_user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `scId`, `firstLoginDone`, `role`) VALUES
(1, '9766474227', 'admin', 0, 0, 'admin'),
(4, '8888660217', '1234', 1, 0, 'service_center_user'),
(5, '7020542033', '1234', 2, 0, 'service_center_user'),
(6, '8080700987', '1234', 3, 0, 'service_center_user'),
(7, '1234567890', '1234', 4, 0, 'service_center_user'),
(8, '4561237890', '1234', 5, 0, 'service_center_user'),
(9, '9850121314', '1234', 22, 0, 'service_center_user');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `servicecenters`
--
ALTER TABLE `servicecenters`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `servicehistory`
--
ALTER TABLE `servicehistory`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `fk_users_servicecenters` (`scId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT for table `servicecenters`
--
ALTER TABLE `servicecenters`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `servicehistory`
--
ALTER TABLE `servicehistory`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
