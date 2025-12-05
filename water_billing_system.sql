-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 29, 2025 at 06:56 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `water_billing_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `AccountID` int(11) NOT NULL,
  `Username` varchar(100) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Role_ID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`AccountID`, `Username`, `Password`, `Role_ID`) VALUES
(1, 'mark.santos12', '123456', 1),
(2, 'joey.fernandez19', '123456', 2),
(3, 'allan.cruz28', '123456', 3),
(4, 'ryan.dela cruz38', '123456', 4),
(5, 'leo.manalo71', '123456', 5),
(6, 'alfred.navarro69', '123456', 2),
(7, 'daniel.domingo56', 'password123', 5),
(8, 'rowena.garcia58', 'password123', 5),
(9, 'grace.domingo41', 'password123', 5),
(10, 'jenny.ramos25', 'password123', 5),
(11, 'paulo.mendoza78', 'password123', 5),
(12, 'allan.mendoza79', 'password123', 5),
(13, 'jessa.garcia56', 'password123', 5),
(14, 'maria.aquino54', 'password123', 5),
(15, 'hazel.bautista46', 'password123', 5),
(16, 'grace.bautista92', 'password123', 5),
(17, 'arlene.santos75', 'password123', 5),
(18, 'grace.torres41', 'password123', 5),
(19, 'jenny.gomez97', 'password123', 5),
(20, 'jose.domingo39', 'password123', 5),
(21, 'daniel.navarro40', 'password123', 5),
(22, 'grace.reyes52', 'password123', 5),
(23, 'liza.bautista19', 'password123', 5),
(24, 'rowena.torres30', 'password123', 5),
(25, 'ramon.garcia98', 'password123', 5),
(26, 'liza.garcia64', 'password123', 5),
(27, 'maria.torres50', 'password123', 5),
(28, 'allan.navarro13', 'password123', 5),
(29, 'hazel.domingo40', 'password123', 5),
(30, 'jenny.bautista24', 'password123', 5),
(31, 'carlo.domingo31', 'password123', 5),
(32, 'jude.navarro98', 'password123', 5),
(33, 'allan.cruz33', 'password123', 5),
(34, 'jude.bautista71', 'password123', 5),
(35, 'carlo.mendoza91', 'password123', 5),
(36, 'jenny.navarro38', 'password123', 5),
(37, 'leo.aquino75', 'password123', 5),
(38, 'ramon.flores45', 'password123', 5),
(39, 'daniel.garcia59', 'password123', 5),
(40, 'leo.flores50', 'password123', 5),
(41, 'leo.cruz26', 'password123', 5),
(42, 'mark.garcia22', 'password123', 5),
(43, 'leo.lopez85', 'password123', 5),
(44, 'mark.aquino94', 'password123', 5),
(45, 'jude.reyes51', 'password123', 5),
(46, 'hazel.bautista72', 'password123', 5),
(47, 'jessa.ramos12', 'password123', 5),
(48, 'maria.reyes14', 'password123', 5),
(49, 'arlene.garcia81', 'password123', 5),
(50, 'maria.bautista62', 'password123', 5),
(51, 'rowena.gomez97', 'password123', 5),
(52, 'allan.cruz70', 'password123', 5),
(53, 'allan.flores20', 'password123', 5),
(54, 'liza.garcia85', 'password123', 5),
(55, 'rowena.santos80', 'password123', 5),
(56, 'ana.flores67', 'password123', 5);

-- --------------------------------------------------------

--
-- Table structure for table `bill`
--

CREATE TABLE `bill` (
  `Bill_ID` int(11) NOT NULL,
  `Consumer_ID` int(11) DEFAULT NULL,
  `Reading_ID` int(11) DEFAULT NULL,
  `Billing_Officer_ID` int(11) DEFAULT NULL,
  `Billing_Month` varchar(20) DEFAULT NULL,
  `Amount_Due` decimal(10,2) DEFAULT NULL,
  `Penalty` decimal(10,2) DEFAULT NULL,
  `Previous_Balance` decimal(10,2) DEFAULT NULL,
  `Previous_Penalty` decimal(10,2) DEFAULT NULL,
  `Connection_Fee` decimal(10,2) DEFAULT NULL,
  `Total_Amount` decimal(10,2) DEFAULT NULL,
  `Due_Date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `classification`
--

CREATE TABLE `classification` (
  `Classification_ID` int(11) NOT NULL,
  `Classification_Name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `classification`
--

INSERT INTO `classification` (`Classification_ID`, `Classification_Name`) VALUES
(1, 'Residential'),
(2, 'Commercial'),
(3, 'Government'),
(4, 'Industrial');

-- --------------------------------------------------------

--
-- Table structure for table `consumer`
--

CREATE TABLE `consumer` (
  `Consumer_ID` int(11) NOT NULL,
  `First_Name` varchar(100) DEFAULT NULL,
  `Last_Name` varchar(100) DEFAULT NULL,
  `Address` varchar(255) DEFAULT NULL,
  `Zone_ID` int(11) DEFAULT NULL,
  `Classification_ID` int(11) DEFAULT NULL,
  `Login_ID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `consumer`
--

INSERT INTO `consumer` (`Consumer_ID`, `First_Name`, `Last_Name`, `Address`, `Zone_ID`, `Classification_ID`, `Login_ID`) VALUES
(1, 'Daniel', 'Domingo', 'Purok 2, Barangay 5', 1, 4, 7),
(2, 'Rowena', 'Garcia', 'Purok 4, Barangay 3', 3, 1, 8),
(3, 'Grace', 'Domingo', 'Purok 2, Barangay 2', 2, 3, 9),
(4, 'Jenny', 'Ramos', 'Purok 1, Barangay 4', 2, 3, 10),
(5, 'Paulo', 'Mendoza', 'Purok 1, Barangay 6', 4, 3, 11),
(6, 'Allan', 'Mendoza', 'Purok 3, Barangay 9', 5, 3, 12),
(7, 'Jessa', 'Garcia', 'Purok 2, Barangay 1', 3, 2, 13),
(8, 'Maria', 'Aquino', 'Purok 4, Barangay 5', 2, 3, 14),
(9, 'Hazel', 'Bautista', 'Purok 2, Barangay 10', 2, 2, 15),
(10, 'Grace', 'Bautista', 'Purok 3, Barangay 11', 1, 3, 16),
(11, 'Arlene', 'Santos', 'Purok 7, Barangay 6', 1, 4, 17),
(12, 'Grace', 'Torres', 'Purok 3, Barangay 5', 4, 2, 18),
(13, 'Jenny', 'Gomez', 'Purok 1, Barangay 6', 1, 3, 19),
(14, 'Jose', 'Domingo', 'Purok 1, Barangay 11', 2, 3, 20),
(15, 'Daniel', 'Navarro', 'Purok 7, Barangay 11', 2, 4, 21),
(16, 'Grace', 'Reyes', 'Purok 1, Barangay 9', 1, 4, 22),
(17, 'Liza', 'Bautista', 'Purok 5, Barangay 11', 5, 4, 23),
(18, 'Rowena', 'Torres', 'Purok 4, Barangay 11', 1, 1, 24),
(19, 'Ramon', 'Garcia', 'Purok 3, Barangay 10', 2, 3, 25),
(20, 'Liza', 'Garcia', 'Purok 7, Barangay 4', 2, 3, 26),
(21, 'Maria', 'Torres', 'Purok 5, Barangay 3', 3, 2, 27),
(22, 'Allan', 'Navarro', 'Purok 3, Barangay 6', 2, 4, 28),
(23, 'Hazel', 'Domingo', 'Purok 3, Barangay 3', 1, 2, 29),
(24, 'Jenny', 'Bautista', 'Purok 4, Barangay 5', 5, 1, 30),
(25, 'Carlo', 'Domingo', 'Purok 6, Barangay 11', 5, 4, 31),
(26, 'Jude', 'Navarro', 'Purok 2, Barangay 8', 5, 2, 32),
(27, 'Allan', 'Cruz', 'Purok 6, Barangay 7', 2, 1, 33),
(28, 'Jude', 'Bautista', 'Purok 1, Barangay 5', 2, 1, 34),
(29, 'Carlo', 'Mendoza', 'Purok 1, Barangay 9', 2, 3, 35),
(30, 'Jenny', 'Navarro', 'Purok 1, Barangay 4', 5, 2, 36),
(31, 'Leo', 'Aquino', 'Purok 5, Barangay 7', 2, 2, 37),
(32, 'Ramon', 'Flores', 'Purok 5, Barangay 2', 2, 2, 38),
(33, 'Daniel', 'Garcia', 'Purok 3, Barangay 12', 5, 4, 39),
(34, 'Leo', 'Flores', 'Purok 6, Barangay 4', 5, 2, 40),
(35, 'Leo', 'Cruz', 'Purok 5, Barangay 10', 1, 1, 41),
(36, 'Mark', 'Garcia', 'Purok 5, Barangay 1', 2, 3, 42),
(37, 'Leo', 'Lopez', 'Purok 2, Barangay 5', 4, 3, 43),
(38, 'Mark', 'Aquino', 'Purok 2, Barangay 9', 4, 2, 44),
(39, 'Jude', 'Reyes', 'Purok 2, Barangay 5', 4, 3, 45),
(40, 'Hazel', 'Bautista', 'Purok 5, Barangay 1', 1, 4, 46),
(41, 'Jessa', 'Ramos', 'Purok 7, Barangay 9', 1, 2, 47),
(42, 'Maria', 'Reyes', 'Purok 7, Barangay 10', 5, 4, 48),
(43, 'Arlene', 'Garcia', 'Purok 5, Barangay 5', 3, 4, 49),
(44, 'Maria', 'Bautista', 'Purok 3, Barangay 11', 2, 1, 50),
(45, 'Rowena', 'Gomez', 'Purok 1, Barangay 5', 5, 3, 51),
(46, 'Allan', 'Cruz', 'Purok 7, Barangay 7', 4, 2, 52),
(47, 'Allan', 'Flores', 'Purok 6, Barangay 6', 2, 3, 53),
(48, 'Liza', 'Garcia', 'Purok 3, Barangay 6', 5, 4, 54),
(49, 'Rowena', 'Santos', 'Purok 7, Barangay 7', 3, 3, 55),
(50, 'Ana', 'Flores', 'Purok 4, Barangay 12', 4, 2, 56);

-- --------------------------------------------------------

--
-- Table structure for table `consumer_bill`
--

CREATE TABLE `consumer_bill` (
  `Consumer_Bill_ID` int(11) NOT NULL,
  `Consumer_ID` int(11) DEFAULT NULL,
  `Bill_ID` int(11) DEFAULT NULL,
  `Selected_Months` text DEFAULT NULL,
  `Total_Amount` decimal(10,2) DEFAULT NULL,
  `Created_Date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ledger_entry`
--

CREATE TABLE `ledger_entry` (
  `Ledger_ID` int(11) NOT NULL,
  `Consumer_ID` int(11) DEFAULT NULL,
  `Transaction_Type` varchar(50) DEFAULT NULL,
  `Reference_ID` int(11) DEFAULT NULL,
  `Amount` decimal(10,2) DEFAULT NULL,
  `Transaction_Date` datetime DEFAULT current_timestamp(),
  `Notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meter`
--

CREATE TABLE `meter` (
  `Meter_ID` int(11) NOT NULL,
  `Consumer_ID` int(11) DEFAULT NULL,
  `Meter_Serial_Number` varchar(100) DEFAULT NULL,
  `Meter_Size` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `meter`
--

INSERT INTO `meter` (`Meter_ID`, `Consumer_ID`, `Meter_Serial_Number`, `Meter_Size`) VALUES
(1, 1, 'MS-30251', '1/2 inch'),
(2, 2, 'MS-66392', '3/4 inch'),
(3, 3, 'MS-36909', '1/2 inch'),
(4, 4, 'MS-27354', '3/4 inch'),
(5, 5, 'MS-53429', '3/4 inch'),
(6, 6, 'MS-35140', '1/2 inch'),
(7, 7, 'MS-93958', '3/4 inch'),
(8, 8, 'MS-13237', '1/2 inch'),
(9, 9, 'MS-45777', '1/2 inch'),
(10, 10, 'MS-42724', '3/4 inch'),
(11, 11, 'MS-64769', '3/4 inch'),
(12, 12, 'MS-76923', '3/4 inch'),
(13, 13, 'MS-63941', '3/4 inch'),
(14, 14, 'MS-10578', '1/2 inch'),
(15, 15, 'MS-64236', '1/2 inch'),
(16, 16, 'MS-57998', '1/2 inch'),
(17, 17, 'MS-88223', '3/4 inch'),
(18, 18, 'MS-77498', '3/4 inch'),
(19, 19, 'MS-47544', '3/4 inch'),
(20, 20, 'MS-92325', '1/2 inch'),
(21, 21, 'MS-22926', '3/4 inch'),
(22, 22, 'MS-77600', '1/2 inch'),
(23, 23, 'MS-65065', '1/2 inch'),
(24, 24, 'MS-89585', '3/4 inch'),
(25, 25, 'MS-92891', '1/2 inch'),
(26, 26, 'MS-28357', '1/2 inch'),
(27, 27, 'MS-58088', '1/2 inch'),
(28, 28, 'MS-28222', '1/2 inch'),
(29, 29, 'MS-53218', '3/4 inch'),
(30, 30, 'MS-34614', '1/2 inch'),
(31, 31, 'MS-33466', '1/2 inch'),
(32, 32, 'MS-18408', '1/2 inch'),
(33, 33, 'MS-56537', '1/2 inch'),
(34, 34, 'MS-72337', '1/2 inch'),
(35, 35, 'MS-45642', '1/2 inch'),
(36, 36, 'MS-33992', '3/4 inch'),
(37, 37, 'MS-30788', '3/4 inch'),
(38, 38, 'MS-56412', '3/4 inch'),
(39, 39, 'MS-50687', '1/2 inch'),
(40, 40, 'MS-51889', '3/4 inch'),
(41, 41, 'MS-57224', '1/2 inch'),
(42, 42, 'MS-16404', '3/4 inch'),
(43, 43, 'MS-18535', '1/2 inch'),
(44, 44, 'MS-36069', '1/2 inch'),
(45, 45, 'MS-54931', '1/2 inch'),
(46, 46, 'MS-12789', '1/2 inch'),
(47, 47, 'MS-76956', '3/4 inch'),
(48, 48, 'MS-83369', '1/2 inch'),
(49, 49, 'MS-28923', '1/2 inch'),
(50, 50, 'MS-27111', '3/4 inch');

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `PaymentID` int(11) NOT NULL,
  `ConsumerID` int(11) DEFAULT NULL,
  `BillID` int(11) DEFAULT NULL,
  `PaymentDate` date DEFAULT NULL,
  `AmountPaid` decimal(10,2) DEFAULT NULL,
  `ORNumber` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_allocation`
--

CREATE TABLE `payment_allocation` (
  `Payment_Allocation_ID` int(11) NOT NULL,
  `Payment_ID` int(11) DEFAULT NULL,
  `Bill_ID` int(11) DEFAULT NULL,
  `Amount_Applied` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rate`
--

CREATE TABLE `rate` (
  `Rate_ID` int(11) NOT NULL,
  `Min_Rate` decimal(10,2) DEFAULT NULL,
  `Price_Per_Cubic` decimal(10,2) DEFAULT NULL,
  `Effective_Date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reading`
--

CREATE TABLE `reading` (
  `Reading_ID` int(11) NOT NULL,
  `Route_ID` int(11) DEFAULT NULL,
  `Consumer_ID` int(11) DEFAULT NULL,
  `Meter_ID` int(11) DEFAULT NULL,
  `Meter_Reader_ID` int(11) DEFAULT NULL,
  `Created_Date` datetime DEFAULT current_timestamp(),
  `Reading_Status` enum('Normal','Locked','Malfunction','Estimated') DEFAULT NULL,
  `Previous_Reading` decimal(10,2) DEFAULT NULL,
  `Current_Reading` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `Role_ID` int(11) NOT NULL,
  `Role_Name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`Role_ID`, `Role_Name`) VALUES
(1, 'Admin'),
(2, 'Meter Reader'),
(3, 'Billing Officer'),
(4, 'Cashier'),
(5, 'Consumer');

-- --------------------------------------------------------

--
-- Table structure for table `route`
--

CREATE TABLE `route` (
  `Route_ID` int(11) NOT NULL,
  `Meter_Reader_ID` int(11) DEFAULT NULL,
  `Zone_ID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `Log_ID` int(11) NOT NULL,
  `Account_ID` int(11) DEFAULT NULL,
  `Role` varchar(50) DEFAULT NULL,
  `Action` text DEFAULT NULL,
  `Timestamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `zone`
--

CREATE TABLE `zone` (
  `Zone_ID` int(11) NOT NULL,
  `Zone_Name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `zone`
--

INSERT INTO `zone` (`Zone_ID`, `Zone_Name`) VALUES
(1, 'Zone 1'),
(2, 'Zone 2'),
(3, 'Zone 3'),
(4, 'Zone 4'),
(5, 'Zone 5');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`AccountID`),
  ADD UNIQUE KEY `Username` (`Username`),
  ADD KEY `Role_ID` (`Role_ID`);

--
-- Indexes for table `bill`
--
ALTER TABLE `bill`
  ADD PRIMARY KEY (`Bill_ID`),
  ADD UNIQUE KEY `Reading_ID` (`Reading_ID`),
  ADD KEY `Consumer_ID` (`Consumer_ID`),
  ADD KEY `Billing_Officer_ID` (`Billing_Officer_ID`);

--
-- Indexes for table `classification`
--
ALTER TABLE `classification`
  ADD PRIMARY KEY (`Classification_ID`);

--
-- Indexes for table `consumer`
--
ALTER TABLE `consumer`
  ADD PRIMARY KEY (`Consumer_ID`),
  ADD KEY `Zone_ID` (`Zone_ID`),
  ADD KEY `Classification_ID` (`Classification_ID`),
  ADD KEY `Login_ID` (`Login_ID`);

--
-- Indexes for table `consumer_bill`
--
ALTER TABLE `consumer_bill`
  ADD PRIMARY KEY (`Consumer_Bill_ID`),
  ADD KEY `Consumer_ID` (`Consumer_ID`),
  ADD KEY `Bill_ID` (`Bill_ID`);

--
-- Indexes for table `ledger_entry`
--
ALTER TABLE `ledger_entry`
  ADD PRIMARY KEY (`Ledger_ID`),
  ADD KEY `Consumer_ID` (`Consumer_ID`);

--
-- Indexes for table `meter`
--
ALTER TABLE `meter`
  ADD PRIMARY KEY (`Meter_ID`),
  ADD UNIQUE KEY `Consumer_ID` (`Consumer_ID`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`PaymentID`),
  ADD KEY `ConsumerID` (`ConsumerID`),
  ADD KEY `BillID` (`BillID`);

--
-- Indexes for table `payment_allocation`
--
ALTER TABLE `payment_allocation`
  ADD PRIMARY KEY (`Payment_Allocation_ID`),
  ADD KEY `Payment_ID` (`Payment_ID`),
  ADD KEY `Bill_ID` (`Bill_ID`);

--
-- Indexes for table `rate`
--
ALTER TABLE `rate`
  ADD PRIMARY KEY (`Rate_ID`);

--
-- Indexes for table `reading`
--
ALTER TABLE `reading`
  ADD PRIMARY KEY (`Reading_ID`),
  ADD KEY `Route_ID` (`Route_ID`),
  ADD KEY `Consumer_ID` (`Consumer_ID`),
  ADD KEY `Meter_ID` (`Meter_ID`),
  ADD KEY `Meter_Reader_ID` (`Meter_Reader_ID`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`Role_ID`);

--
-- Indexes for table `route`
--
ALTER TABLE `route`
  ADD PRIMARY KEY (`Route_ID`),
  ADD KEY `Meter_Reader_ID` (`Meter_Reader_ID`),
  ADD KEY `Zone_ID` (`Zone_ID`);

--
-- Indexes for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`Log_ID`),
  ADD KEY `Account_ID` (`Account_ID`);

--
-- Indexes for table `zone`
--
ALTER TABLE `zone`
  ADD PRIMARY KEY (`Zone_ID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `AccountID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `bill`
--
ALTER TABLE `bill`
  MODIFY `Bill_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `classification`
--
ALTER TABLE `classification`
  MODIFY `Classification_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `consumer`
--
ALTER TABLE `consumer`
  MODIFY `Consumer_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `consumer_bill`
--
ALTER TABLE `consumer_bill`
  MODIFY `Consumer_Bill_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ledger_entry`
--
ALTER TABLE `ledger_entry`
  MODIFY `Ledger_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `meter`
--
ALTER TABLE `meter`
  MODIFY `Meter_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `PaymentID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_allocation`
--
ALTER TABLE `payment_allocation`
  MODIFY `Payment_Allocation_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rate`
--
ALTER TABLE `rate`
  MODIFY `Rate_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reading`
--
ALTER TABLE `reading`
  MODIFY `Reading_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `Role_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `route`
--
ALTER TABLE `route`
  MODIFY `Route_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `Log_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `zone`
--
ALTER TABLE `zone`
  MODIFY `Zone_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accounts`
--
ALTER TABLE `accounts`
  ADD CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`Role_ID`) REFERENCES `roles` (`Role_ID`);

--
-- Constraints for table `bill`
--
ALTER TABLE `bill`
  ADD CONSTRAINT `bill_ibfk_1` FOREIGN KEY (`Consumer_ID`) REFERENCES `consumer` (`Consumer_ID`),
  ADD CONSTRAINT `bill_ibfk_2` FOREIGN KEY (`Reading_ID`) REFERENCES `reading` (`Reading_ID`),
  ADD CONSTRAINT `bill_ibfk_3` FOREIGN KEY (`Billing_Officer_ID`) REFERENCES `accounts` (`AccountID`);

--
-- Constraints for table `consumer`
--
ALTER TABLE `consumer`
  ADD CONSTRAINT `consumer_ibfk_1` FOREIGN KEY (`Zone_ID`) REFERENCES `zone` (`Zone_ID`),
  ADD CONSTRAINT `consumer_ibfk_2` FOREIGN KEY (`Classification_ID`) REFERENCES `classification` (`Classification_ID`),
  ADD CONSTRAINT `consumer_ibfk_3` FOREIGN KEY (`Login_ID`) REFERENCES `accounts` (`AccountID`);

--
-- Constraints for table `consumer_bill`
--
ALTER TABLE `consumer_bill`
  ADD CONSTRAINT `consumer_bill_ibfk_1` FOREIGN KEY (`Consumer_ID`) REFERENCES `consumer` (`Consumer_ID`),
  ADD CONSTRAINT `consumer_bill_ibfk_2` FOREIGN KEY (`Bill_ID`) REFERENCES `bill` (`Bill_ID`);

--
-- Constraints for table `ledger_entry`
--
ALTER TABLE `ledger_entry`
  ADD CONSTRAINT `ledger_entry_ibfk_1` FOREIGN KEY (`Consumer_ID`) REFERENCES `consumer` (`Consumer_ID`);

--
-- Constraints for table `meter`
--
ALTER TABLE `meter`
  ADD CONSTRAINT `meter_ibfk_1` FOREIGN KEY (`Consumer_ID`) REFERENCES `consumer` (`Consumer_ID`);

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`ConsumerID`) REFERENCES `consumer` (`Consumer_ID`),
  ADD CONSTRAINT `payment_ibfk_2` FOREIGN KEY (`BillID`) REFERENCES `bill` (`Bill_ID`);

--
-- Constraints for table `payment_allocation`
--
ALTER TABLE `payment_allocation`
  ADD CONSTRAINT `payment_allocation_ibfk_1` FOREIGN KEY (`Payment_ID`) REFERENCES `payment` (`PaymentID`),
  ADD CONSTRAINT `payment_allocation_ibfk_2` FOREIGN KEY (`Bill_ID`) REFERENCES `bill` (`Bill_ID`);

--
-- Constraints for table `reading`
--
ALTER TABLE `reading`
  ADD CONSTRAINT `reading_ibfk_1` FOREIGN KEY (`Route_ID`) REFERENCES `route` (`Route_ID`),
  ADD CONSTRAINT `reading_ibfk_2` FOREIGN KEY (`Consumer_ID`) REFERENCES `consumer` (`Consumer_ID`),
  ADD CONSTRAINT `reading_ibfk_3` FOREIGN KEY (`Meter_ID`) REFERENCES `meter` (`Meter_ID`),
  ADD CONSTRAINT `reading_ibfk_4` FOREIGN KEY (`Meter_Reader_ID`) REFERENCES `accounts` (`AccountID`);

--
-- Constraints for table `route`
--
ALTER TABLE `route`
  ADD CONSTRAINT `route_ibfk_1` FOREIGN KEY (`Meter_Reader_ID`) REFERENCES `accounts` (`AccountID`),
  ADD CONSTRAINT `route_ibfk_2` FOREIGN KEY (`Zone_ID`) REFERENCES `zone` (`Zone_ID`);

--
-- Constraints for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD CONSTRAINT `system_logs_ibfk_1` FOREIGN KEY (`Account_ID`) REFERENCES `accounts` (`AccountID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
