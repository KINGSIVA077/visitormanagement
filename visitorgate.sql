-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 10, 2026 at 08:44 AM
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
-- Database: `visitorgate`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` varchar(64) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
('log-40bc58eb', 'admin', 'EVENT_APPROVAL', 'event_registration', 'ereg-1772348321-f77a16ee', '{\"visitor\":\"Rajesh Kumar\",\"pass_token\":\"3dc76115a2d01cff82af9442d68096f7\",\"email_to\":\"rajesh@example.com\",\"pass_url\":\"\\/event-pass.html?token=3dc76115a2d01cff82af9442d68096f7\"}', NULL, '2026-03-01 12:29:24'),
('log-5d3027e6', 'sec-user-111', 'EVENT_CHECKIN', 'event_checkin', 'eci-1772348405-9744f396', '{\"visitor\":\"Rajesh Kumar\"}', NULL, '2026-03-01 12:30:05'),
('log-a98a9e97', 'sec-user-111', 'EVENT_CHECKOUT', 'event_checkin', 'eci-1772348405-9744f396', '{\"duration_minutes\":-270}', NULL, '2026-03-01 12:30:11'),
('log-f281ca07', 'admin', 'EVENT_CREATED', 'event', 'evt-1772348272-88b3462a', '{\"name\":\"Tech Summit 2026\"}', NULL, '2026-03-01 12:27:52'),
('log-fd444bd9', 'visitor', 'EVENT_REGISTRATION', 'event_registration', 'ereg-1772348321-f77a16ee', '{\"event\":\"Tech Summit 2026\",\"visitor\":\"Rajesh Kumar\"}', NULL, '2026-03-01 12:28:41');

-- --------------------------------------------------------

--
-- Table structure for table `blacklist`
--

CREATE TABLE `blacklist` (
  `id` varchar(50) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `checkins`
--

CREATE TABLE `checkins` (
  `id` varchar(64) NOT NULL,
  `visitor_request_id` varchar(64) DEFAULT NULL,
  `session_id` varchar(64) DEFAULT NULL,
  `checkin_time` datetime NOT NULL,
  `checkout_time` datetime DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `gate_location` varchar(100) DEFAULT NULL,
  `security_checkin_id` varchar(64) DEFAULT NULL,
  `security_checkout_id` varchar(64) DEFAULT NULL,
  `status` enum('INSIDE','EXITED') DEFAULT 'INSIDE',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `checkins`
--

INSERT INTO `checkins` (`id`, `visitor_request_id`, `session_id`, `checkin_time`, `checkout_time`, `duration_minutes`, `gate_location`, `security_checkin_id`, `security_checkout_id`, `status`, `created_at`) VALUES
('checkin-1772689209098', 'req-1772686847069-th67pi0pk', 'session-1772686763388-8lort81mx', '2026-03-05 11:10:09', NULL, NULL, 'Main Gate', 'sec-user-111', NULL, 'INSIDE', '2026-03-05 11:10:09'),
('checkin-1772689224373', 'req-1772686847069-th67pi0pk', 'session-1772686763388-8lort81mx', '2026-03-05 11:10:24', '2026-03-05 11:10:30', 0, 'Main Gate', 'sec-user-111', 'sec-user-111', 'EXITED', '2026-03-05 11:10:24'),
('checkin-1772696135571', 'req-1772696035449-kf3ojecoc', 'session-1772695999821-axo5b2214', '2026-03-05 13:05:35', NULL, NULL, 'Main Gate', 'sec-user-111', NULL, 'INSIDE', '2026-03-05 13:05:35');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `code`, `description`, `is_active`, `created_at`) VALUES
('dept-1772298703-a7981484', 'Test Dept', 'TEST', '', 0, '2026-02-28 22:41:43'),
('dept-1772343328-7838b2f7', 'Civil Engineering', 'CIVIL', '', 1, '2026-03-01 11:05:28'),
('dept-1772705782287', 'EEE', 'EEE', '', 1, '2026-03-05 15:46:22'),
('dept-admin', 'Administration', 'ADMIN', NULL, 1, '2026-02-28 22:28:43'),
('dept-cse', 'Computer Engineering', 'CSE', '', 1, '2026-02-28 22:28:43'),
('dept-ece', 'Electronics & Communication Engineering', 'ECE', '', 1, '2026-02-28 22:28:43'),
('dept-mech', 'Mechanical Engineering', 'MECH', NULL, 1, '2026-02-28 22:28:43');

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `event_date` date NOT NULL,
  `event_time` time DEFAULT NULL,
  `venue` varchar(255) DEFAULT NULL,
  `max_participants` int(11) DEFAULT 0,
  `qr_token` varchar(100) NOT NULL,
  `status` enum('ACTIVE','CANCELLED','COMPLETED') DEFAULT 'ACTIVE',
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `custom_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_fields`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `name`, `description`, `event_date`, `event_time`, `venue`, `max_participants`, `qr_token`, `status`, `created_by`, `created_at`, `custom_fields`) VALUES
('evt-1772348272-88b3462a', 'Tech Summit 2026', 'Annual technology conference', '2026-03-15', '10:00:00', 'Main Auditorium', 100, '17115619c8ee998b91b7774f06fe91f0', 'ACTIVE', 'admin', '2026-03-01 12:27:52', NULL),
('evt-1772703877433', 'workshop', '', '2026-12-12', '15:14:00', 'Auditorium', 20, '0f8b4aa267d8de4427837aa6763dd53b', 'ACTIVE', 'admin', '2026-03-05 15:14:37', '[{\"label\":\"Full Name\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Enter your full name\"},{\"label\":\"Email Address\",\"type\":\"email\",\"required\":true,\"placeholder\":\"your.email@example.com\"},{\"label\":\"Phone Number\",\"type\":\"phone\",\"required\":true,\"placeholder\":\"+91 9876543210\"},{\"label\":\"Organization / College\",\"type\":\"text\",\"required\":false,\"placeholder\":\"Your organization name\"},{\"label\":\"Designation / Role\",\"type\":\"text\",\"required\":false,\"placeholder\":\"e.g. Student, Professor\"}]'),
('evt-1772705969438', 'symposium', '', '2026-03-05', '20:50:00', '', 0, 'd3080b3d55710273d61d9d92c07f09f3', 'ACTIVE', 'admin', '2026-03-05 15:49:29', NULL),
('evt-1772774802920', 'Tech Summit 2026', '', '0000-00-00', '00:00:00', 'Main Auditorium', 0, '5c913ba019041dc1f23ad2ec5ca1fa97', 'CANCELLED', 'admin', '2026-03-06 10:56:42', '[{\"label\":\"Full Name\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Enter your full name\"},{\"label\":\"Email Address\",\"type\":\"email\",\"required\":true,\"placeholder\":\"your.email@example.com\"},{\"label\":\"Phone Number\",\"type\":\"phone\",\"required\":true,\"placeholder\":\"+91 9876543210\"},{\"label\":\"Organization / College\",\"type\":\"text\",\"required\":false,\"placeholder\":\"Your organization name\"},{\"label\":\"Designation / Role\",\"type\":\"text\",\"required\":false,\"placeholder\":\"e.g. Student, Professor\"}]'),
('evt-1772775987907', 'New Test Event', '', '2026-05-12', '00:00:00', '', 0, 'bb08fb5a75849bbd80ac9e4291410ff8', 'CANCELLED', 'admin', '2026-03-06 11:16:27', '[{\"label\":\"Full Name\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Enter your full name\"},{\"label\":\"Email Address\",\"type\":\"email\",\"required\":true,\"placeholder\":\"your.email@example.com\"},{\"label\":\"Phone Number\",\"type\":\"phone\",\"required\":true,\"placeholder\":\"+91 9876543210\"},{\"label\":\"Organization / College\",\"type\":\"text\",\"required\":false,\"placeholder\":\"Your organization name\"},{\"label\":\"Designation / Role\",\"type\":\"text\",\"required\":false,\"placeholder\":\"e.g. Student, Professor\"}]'),
('evt-1772783282089', 'hackton', '', '2026-03-06', '13:17:00', 'Auditorium', 200, 'a69782a8b63c0c0aecc40d6842db2288', 'ACTIVE', 'admin', '2026-03-06 13:18:02', '[{\"label\":\"Full Name\",\"type\":\"text\",\"required\":true,\"placeholder\":\"\"},{\"label\":\"Email Address\",\"type\":\"email\",\"required\":true,\"placeholder\":\"\"},{\"label\":\"Phone Number\",\"type\":\"phone\",\"required\":true,\"placeholder\":\"\"},{\"label\":\"department\",\"type\":\"text\",\"required\":false,\"placeholder\":\"\"}]');

-- --------------------------------------------------------

--
-- Table structure for table `event_checkins`
--

CREATE TABLE `event_checkins` (
  `id` varchar(50) NOT NULL,
  `registration_id` varchar(50) NOT NULL,
  `event_id` varchar(50) NOT NULL,
  `checkin_time` datetime NOT NULL,
  `checkout_time` datetime DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `security_id` varchar(50) DEFAULT NULL,
  `gate_location` varchar(100) DEFAULT 'Main Gate',
  `status` enum('INSIDE','EXITED') DEFAULT 'INSIDE',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_checkins`
--

INSERT INTO `event_checkins` (`id`, `registration_id`, `event_id`, `checkin_time`, `checkout_time`, `duration_minutes`, `security_id`, `gate_location`, `status`, `created_at`) VALUES
('eci-1772348405-9744f396', 'ereg-1772348321-f77a16ee', 'evt-1772348272-88b3462a', '2026-03-01 12:30:05', '2026-03-01 12:30:11', -270, 'sec-user-111', 'Main Gate', 'EXITED', '2026-03-01 12:30:05');

-- --------------------------------------------------------

--
-- Table structure for table `event_registrations`
--

CREATE TABLE `event_registrations` (
  `id` varchar(50) NOT NULL,
  `event_id` varchar(50) NOT NULL,
  `visitor_name` varchar(255) NOT NULL,
  `visitor_email` varchar(255) NOT NULL,
  `visitor_phone` varchar(20) NOT NULL,
  `organization` varchar(255) DEFAULT '',
  `designation` varchar(255) DEFAULT '',
  `approval_status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `pass_token` varchar(100) DEFAULT NULL,
  `pass_id` varchar(20) DEFAULT NULL,
  `approved_by` varchar(50) DEFAULT NULL,
  `approval_time` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `custom_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_data`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_registrations`
--

INSERT INTO `event_registrations` (`id`, `event_id`, `visitor_name`, `visitor_email`, `visitor_phone`, `organization`, `designation`, `approval_status`, `pass_token`, `approved_by`, `approval_time`, `rejection_reason`, `created_at`, `custom_data`) VALUES
('ereg-1772348321-f77a16ee', 'evt-1772348272-88b3462a', 'Rajesh Kumar', 'rajesh@example.com', '9876543210', 'ABC University', 'Student', 'APPROVED', '3dc76115a2d01cff82af9442d68096f7', 'admin', '2026-03-01 12:29:24', NULL, '2026-03-01 12:28:41', NULL),
('ereg-1772642457082', 'evt-1772348272-88b3462a', 'Siva', 'sivakumar512037@gmail.com', '9696558556', 'TNGPTC ', 'Student ', 'APPROVED', '28bdf9d54b300c646ee265ff17c679ed', 'System Admin', '2026-03-04 22:11:29', NULL, '2026-03-04 22:10:57', NULL),
('ereg-1772685280482', 'evt-1772348272-88b3462a', 'Santha', 'santha26@gmail.com', '9696558556', 'TNGPTC ', 'Student', 'APPROVED', 'b364cff95c641085d30d0b2a52ff060f', 'System Admin', '2026-03-05 10:07:51', NULL, '2026-03-05 10:04:40', NULL),
('ereg-1772685415922', 'evt-1772348272-88b3462a', 'Vishwanathan', 'sivakumar512037@gmail.com', '6646629146', 'TNGPTC ', 'Student ', 'APPROVED', '0eca7c4606acface5a9143fe1987af33', 'System Admin', '2026-03-05 10:07:59', NULL, '2026-03-05 10:06:55', NULL),
('ereg-1772686599412', 'evt-1772348272-88b3462a', 'Karthi', 'sivakumar512037@gmail.com', '9696558556', 'TNGPTC ', 'Student ', 'APPROVED', '1d0e56e93bad3418d92da9292a84483f', 'System Admin', '2026-03-05 10:26:53', NULL, '2026-03-05 10:26:39', NULL),
('ereg-1772704465069', 'evt-1772703877433', 'Hariharasudhan@forge-iv', 'hariharasudhan@forge-iv.co', '6380071903', 'TNGPTC ', 'Student', 'APPROVED', 'dbd07c31a48f028c30c646268807a349', 'System Admin', '2026-03-05 15:24:52', NULL, '2026-03-05 15:24:25', NULL),
('ereg-1772706105468', 'evt-1772705969438', 'Vsbd', 'bsnd@gmail.com', '9494', 'Vdbd', 'Bdb', 'APPROVED', '98cad845735a452020897cb3fa5c0175', 'System Admin', '2026-03-05 15:52:00', NULL, '2026-03-05 15:51:45', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `form_templates`
--

CREATE TABLE `form_templates` (
  `id` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`fields`)),
  `is_default` tinyint(1) DEFAULT 0,
  `created_by` varchar(64) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `form_templates`
--

INSERT INTO `form_templates` (`id`, `name`, `category`, `description`, `fields`, `is_default`, `created_by`, `created_at`, `updated_at`) VALUES
('tmpl-1772705851179', 'guest', 'other', 'For executive visitors', '[{\"id\":\"purpose\",\"label\":\"Purpose\",\"type\":\"text\"}]', 0, NULL, '2026-03-05 15:47:31', '2026-03-05 15:47:31'),
('tmpl-admission', 'Admission Enquiry Form', 'admission', 'For prospective students seeking admission information', '[{\"id\":\"name\",\"type\":\"text\",\"label\":\"Full Name\",\"required\":true},{\"id\":\"phone\",\"type\":\"phone\",\"label\":\"Phone Number\",\"required\":true},{\"id\":\"email\",\"type\":\"email\",\"label\":\"Email Address\",\"required\":false},{\"id\":\"department\",\"type\":\"dropdown\",\"label\":\"Department\",\"required\":true,\"options_source\":\"departments\"},{\"id\":\"staff_id\",\"type\":\"dropdown\",\"label\":\"Person to Meet\",\"required\":true,\"options_source\":\"users\"},{\"id\":\"purpose\",\"type\":\"dropdown\",\"label\":\"Purpose\",\"required\":true,\"options\":[\"Admission Enquiry\",\"Fee Details\",\"Course Information\",\"Campus Tour\"]}]', 0, NULL, '2026-02-28 22:28:43', '2026-02-28 22:28:43'),
('tmpl-parent', 'Parent Visitor Form', 'parent', 'For parents and guardians visiting students or staff', '[{\"id\":\"name\",\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"placeholder\":\"Enter your full name\"},{\"id\":\"phone\",\"type\":\"phone\",\"label\":\"Phone Number\",\"required\":true,\"placeholder\":\"+91 9876543210\"},{\"id\":\"department\",\"type\":\"dropdown\",\"label\":\"Department\",\"required\":true,\"options_source\":\"departments\"},{\"id\":\"staff_id\",\"type\":\"dropdown\",\"label\":\"Person to Meet\",\"required\":true,\"depends_on\":\"department\",\"options_source\":\"users\"},{\"id\":\"purpose\",\"type\":\"dropdown\",\"label\":\"Purpose of Visit\",\"required\":true,\"options\":[\"Meet Staff\",\"Student Related\",\"Document Submission\",\"Other\"]}]', 1, NULL, '2026-02-28 22:28:43', '2026-02-28 22:28:43');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `data`, `is_read`, `created_at`) VALUES
('notif-1772686847075', 'staff-mech-008', 'visitor_request', 'New Visitor Request', 'K Sivakumar wants to meet you - Purpose: Document Submission', '{\"request_id\":\"req-1772686847069-th67pi0pk\",\"visitor_name\":\"K Sivakumar\",\"visitor_phone\":\"6656644344\"}', 0, '2026-03-05 10:30:47'),
('notif-1772696035480', 'staff-cse-001', 'visitor_request', 'New Visitor Request', 'K Sivakumar wants to meet you - Purpose: Meet Staff', '{\"request_id\":\"req-1772696035449-kf3ojecoc\",\"visitor_name\":\"K Sivakumar\",\"visitor_phone\":\"6656644344\"}', 0, '2026-03-05 13:03:55'),
('notif-1772705137306', 'staff-ece-008', 'visitor_request', 'New Visitor Request', 'Muneesh Kumar wants to meet you - Purpose: Delivery/Vendor', '{\"request_id\":\"req-1772705137266-i845ik1cv\",\"visitor_name\":\"Muneesh Kumar\",\"visitor_phone\":\"9360814272\"}', 0, '2026-03-05 15:35:37'),
('notif-1772706497567', 'staff-cse-001', 'visitor_request', 'New Visitor Request', 'Hwhen wants to meet you - Purpose: Interview', '{\"request_id\":\"req-1772706497539-u4373ecp5\",\"visitor_name\":\"Hwhen\",\"visitor_phone\":\"6689558658\"}', 0, '2026-03-05 15:58:17');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(64) NOT NULL,
  `staff_id` varchar(64) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('admin','security','staff') NOT NULL,
  `department_id` varchar(64) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `availability_status` varchar(20) DEFAULT 'available',
  `notification_preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notification_preferences`)),
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `staff_id`, `email`, `password_hash`, `phone`, `name`, `role`, `department_id`, `designation`, `is_active`, `availability_status`, `notification_preferences`, `created_at`) VALUES
('admin-user-111', NULL, 'admin@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543210', 'System Admin', 'admin', 'dept-admin', 'Administrator', 1, 'available', NULL, '2026-02-28 22:28:43'),
('sec-user-111', NULL, 'security@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543211', 'Head Security', 'security', 'dept-admin', 'Chief Security Officer', 1, 'available', NULL, '2026-02-28 22:28:43'),
('staff-1772298860-8611080d', NULL, 'test@gmail.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+91 9876543210', 'Test Staff', 'staff', 'dept-1772298703-a7981484', 'Tester', 0, 'available', NULL, '2026-02-28 22:44:20'),
('staff-1773119276626', 'VG-CIVIL-553', 'civil1@visitorgate.com', NULL, '9626268091', 'Mr. Saravanakumar R.', 'staff', 'dept-1772343328-7838b2f7', 'HOD(I/C)', 1, 'available', NULL, '2026-03-10 10:37:56'),
('staff-1773119433660', 'VG-CIVIL-419', 'civil2@visitorgate.com', NULL, '9751946236', 'Mr. Arunkumar S.', 'staff', 'dept-1772343328-7838b2f7', 'Lecturer', 1, 'available', NULL, '2026-03-10 10:40:33'),
('staff-1773119623186', 'VG-CIVIL-497', 'civil3@visitorgate.com', NULL, '9976139835', 'Mr. Sivasankar R', 'staff', 'dept-1772343328-7838b2f7', 'Lecturer', 1, 'available', NULL, '2026-03-10 10:43:43'),
('staff-1773119734770', 'VG-CIVIL-690', 'civil4@visitorgate.com', NULL, '9514064290', 'Ms. K. M. Bhuvaneswari', 'staff', 'dept-1772343328-7838b2f7', 'Lecturer(contract)', 1, 'available', NULL, '2026-03-10 10:45:34'),
('staff-1773119895264', 'VG-CIVIL-195', 'civil5@visitorgate.com', NULL, '9629086205', 'Ms. E. Gracy Sweety', 'staff', 'dept-1772343328-7838b2f7', 'Lecturer(AdHoc)', 1, 'available', NULL, '2026-03-10 10:48:15'),
('staff-1773120175255', 'VG-CIVIL-897', 'civil6@visitorgate.com', NULL, '9034877634', 'Mr. V. SuriyaPrakash', 'staff', 'dept-1772343328-7838b2f7', 'Lecturer(AdHoc)', 1, 'available', NULL, '2026-03-10 10:52:55'),
('staff-1773120262467', 'VG-CIVIL-460', 'civil7@visitorgate.com', NULL, '9678945623', 'Mr. M. Ramakrishnan', 'staff', 'dept-1772343328-7838b2f7', 'Lecturer(AdHoc)', 1, 'available', NULL, '2026-03-10 10:54:22'),
('staff-1773120622535', 'VG-CIVIL-598', 'civil8@visitorgate.com', NULL, '8976509811', 'Ms. Raghavi S', 'staff', 'dept-1772343328-7838b2f7', 'Lecturer(AdHoc)', 1, 'available', NULL, '2026-03-10 11:00:22'),
('staff-1773120741363', 'VG-CIVIL-359', 'civil9@visitoragate.com', NULL, '9843410384', 'Mrs. Nagalakshmi M', 'staff', 'dept-1772343328-7838b2f7', 'Lecturer(AdHoc)', 1, 'available', NULL, '2026-03-10 11:02:21'),
('staff-1773122056703', 'VG-CSE-419', 'cse101@visitorgate.com', NULL, '8526264575', 'Mrs. T.Hemachitra', 'staff', 'dept-cse', 'HOD', 1, 'available', NULL, '2026-03-10 11:24:16'),
('staff-1773122333652', 'VG-CSE-874', 'cse102@visitorgate.com', NULL, '9894686246', 'Dr. D. Natarajasivan', 'staff', 'dept-cse', 'Lecturer', 1, 'available', NULL, '2026-03-10 11:28:53'),
('staff-1773122494602', 'VG-CSE-434', 'cse103@visitorgate.com', NULL, '9790556747', 'Mr. Ravikumar V', 'staff', 'dept-cse', 'Lecturer', 1, 'available', NULL, '2026-03-10 11:31:34'),
('staff-1773122665846', 'VG-CSE-685', 'cse105@visitorgate.com', NULL, '9655471020', 'Mrs. Stella J', 'staff', 'dept-cse', 'Lecturer', 1, 'available', NULL, '2026-03-10 11:34:25'),
('staff-1773125748564', 'VG-CSE-106', 'cse104@visitorgate.com', NULL, '9566720960', 'Mrs. Archana K', 'staff', 'dept-cse', 'Lecturer', 1, 'available', NULL, '2026-03-10 12:25:48'),
('staff-1773126025303', 'VG-CSE-476', 'cse106@visitorgate.com', NULL, '9845032985', 'Dr. A H Nandhu Kishore', 'staff', 'dept-cse', 'Lecturer', 1, 'available', NULL, '2026-03-10 12:30:25'),
('staff-1773126427231', 'VG-MECH-736', 'mech201@visitorgate.com', NULL, '', 'Mr. T Balasubramaniam', 'staff', 'dept-mech', 'HOD', 1, 'available', NULL, '2026-03-10 12:37:07'),
('staff-1773126960607', 'VG-MECH-421', 'mech202@visitorgate.com', NULL, '', 'Mr. P Mathivasanthan', 'staff', 'dept-mech', 'HOD', 1, 'available', NULL, '2026-03-10 12:46:00'),
('staff-1773127016744', 'VG-MECH-461', 'mech203@visitorgate.com', NULL, '', 'Mr. S Srikanth', 'staff', 'dept-mech', 'Lecturer', 1, 'available', NULL, '2026-03-10 12:46:56'),
('staff-1773127081476', 'VG-MECH-972', 'mech204@visitorgate.com', NULL, '', 'Mr. Chantrabose R', 'staff', 'dept-mech', 'Lecturer', 1, 'available', NULL, '2026-03-10 12:48:01'),
('staff-1773127143578', 'VG-MECH-856', 'mech205@visitorgate.com', NULL, '', 'Mr. Baskarapandian', 'staff', 'dept-mech', 'Lecturer', 1, 'available', NULL, '2026-03-10 12:49:03'),
('staff-1773127205144', 'VG-MECH-353', 'mech206@visitorgate.com', NULL, '', 'Mr. Lawrence Xavier', 'staff', 'dept-mech', 'Lecturer', 1, 'available', NULL, '2026-03-10 12:50:05'),
('staff-admin-001', 'VG-ADM-001', 'admin1@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876546001', 'Mr. Eshwar P.', 'staff', 'dept-admin', 'Registrar', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-admin-002', 'VG-ADM-002', 'admin2@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876546002', 'Ms. Fatima Z.', 'staff', 'dept-admin', 'Admin Officer', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-cse-001', 'VG-CSE-001', 'cse1@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543001', 'Dr. Aruna Singh', 'staff', 'dept-cse', 'HOD & Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-cse-002', 'VG-CSE-002', 'cse2@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543002', 'Mr. Babu Rao', 'staff', 'dept-cse', 'Assistant Professor', 0, 'busy', NULL, '2026-03-04 22:31:46'),
('staff-cse-003', 'VG-CSE-003', 'cse3@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543003', 'Ms. Chitra M.', 'staff', 'dept-cse', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-cse-004', 'VG-CSE-004', 'cse4@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543004', 'Dr. Deepak J.', 'staff', 'dept-cse', 'Associate Professor', 0, 'busy', NULL, '2026-03-04 22:31:46'),
('staff-cse-005', 'VG-CSE-005', 'cse5@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543005', 'Ms. Esha Gupta', 'staff', 'dept-cse', 'Assistant Professor', 0, 'away', NULL, '2026-03-04 22:31:46'),
('staff-cse-006', 'VG-CSE-006', 'cse6@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543006', 'Mr. Farhan K.', 'staff', 'dept-cse', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-cse-007', 'VG-CSE-007', 'cse7@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543007', 'Ms. Gauri S.', 'staff', 'dept-cse', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-cse-008', 'VG-CSE-008', 'cse8@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543008', 'Mr. Himanshu', 'staff', 'dept-cse', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-cse-009', 'VG-CSE-009', 'cse9@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543009', 'Ms. Ishani P.', 'staff', 'dept-cse', 'Assistant Professor', 0, 'busy', NULL, '2026-03-04 22:31:46'),
('staff-cse-010', 'VG-CSE-010', 'cse10@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543010', 'Mr. Jitendra', 'staff', 'dept-cse', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-ece-001', 'VG-ECE-001', 'ece1@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544001', 'Dr. Kavita D.', 'staff', 'dept-ece', 'HOD & Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-ece-002', 'VG-ECE-002', 'ece2@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544002', 'Mr. Lokesh N.', 'staff', 'dept-ece', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-ece-003', 'VG-ECE-003', 'ece3@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544003', 'Ms. Meena R.', 'staff', 'dept-ece', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-ece-004', 'VG-ECE-004', 'ece4@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544004', 'Mr. Naveen S.', 'staff', 'dept-ece', 'Assistant Professor', 0, 'busy', NULL, '2026-03-04 22:31:46'),
('staff-ece-005', 'VG-ECE-005', 'ece5@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544005', 'Ms. Omila K.', 'staff', 'dept-ece', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-ece-006', 'VG-ECE-006', 'ece6@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544006', 'Mr. Pranav V.', 'staff', 'dept-ece', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-ece-007', 'VG-ECE-007', 'ece7@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544007', 'Ms. Qausar J.', 'staff', 'dept-ece', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-ece-008', 'VG-ECE-008', 'ece8@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544008', 'Mr. Rahul M.', 'staff', 'dept-ece', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-ece-009', 'VG-ECE-009', 'ece9@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544009', 'Ms. Swati L.', 'staff', 'dept-ece', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-ece-010', 'VG-ECE-010', 'ece10@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544010', 'Mr. Tarun B.', 'staff', 'dept-ece', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-mech-001', 'VG-MECH-001', 'mech1@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545001', 'Dr. Umesh P.', 'staff', 'dept-mech', 'HOD & Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-mech-002', 'VG-MECH-002', 'mech2@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545002', 'Mr. Vipin K.', 'staff', 'dept-mech', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-mech-003', 'VG-MECH-003', 'mech3@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545003', 'Ms. Whitney F.', 'staff', 'dept-mech', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-mech-004', 'VG-MECH-004', 'mech4@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545004', 'Mr. Xavier R.', 'staff', 'dept-mech', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-mech-005', 'VG-MECH-005', 'mech5@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545005', 'Ms. Yamini V.', 'staff', 'dept-mech', 'Assistant Professor', 0, 'busy', NULL, '2026-03-04 22:31:46'),
('staff-mech-006', 'VG-MECH-006', 'mech6@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545006', 'Mr. Zaid H.', 'staff', 'dept-mech', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-mech-007', 'VG-MECH-007', 'mech7@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545007', 'Dr. Aman G.', 'staff', 'dept-mech', 'Associate Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-mech-008', 'VG-MECH-008', 'mech8@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545008', 'Mr. Bharat N.', 'staff', 'dept-mech', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-mech-009', 'VG-MECH-009', 'mech9@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545009', 'Ms. Charu D.', 'staff', 'dept-mech', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-mech-010', 'VG-MECH-010', 'mech10@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545010', 'Mr. Dhruv S.', 'staff', 'dept-mech', 'Assistant Professor', 0, 'available', NULL, '2026-03-04 22:31:46'),
('staff-user-111', NULL, 'staff@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543212', 'Dr. Suresh Kumar', 'staff', 'dept-cse', 'Professor & HOD', 0, 'available', NULL, '2026-02-28 22:28:43'),
('staff-user-222', NULL, 'professor@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543213', 'Prof. Ramesh', 'staff', 'dept-cse', 'Associate Professor', 0, 'available', NULL, '2026-02-28 22:28:43');

-- --------------------------------------------------------

--
-- Table structure for table `visitor_requests`
--

CREATE TABLE `visitor_requests` (
  `id` varchar(64) NOT NULL,
  `session_id` varchar(64) DEFAULT NULL,
  `visitor_name` varchar(255) NOT NULL,
  `visitor_phone` varchar(20) NOT NULL,
  `visitor_email` varchar(255) DEFAULT NULL,
  `form_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`form_data`)),
  `department_id` varchar(64) DEFAULT NULL,
  `staff_id` varchar(64) DEFAULT NULL,
  `approval_status` enum('PENDING','APPROVED','REJECTED','BUSY','CHECKED_IN','COMPLETED') DEFAULT 'PENDING',
  `approved_by` varchar(64) DEFAULT NULL,
  `approval_time` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `escalation_level` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `visitor_requests`
--

INSERT INTO `visitor_requests` (`id`, `session_id`, `visitor_name`, `visitor_phone`, `visitor_email`, `form_data`, `department_id`, `staff_id`, `approval_status`, `approved_by`, `approval_time`, `rejection_reason`, `escalation_level`, `created_at`) VALUES
('req-1772686847069-th67pi0pk', 'session-1772686763388-8lort81mx', 'K Sivakumar', '6656644344', 'sivakumar512037@gmail.com', '{\"name\":\"K Sivakumar\",\"phone\":\"6656644344\",\"email\":\"sivakumar512037@gmail.com\",\"purpose\":\"Document Submission\",\"notes\":\"\"}', 'dept-mech', 'staff-mech-008', 'APPROVED', 'staff-mech-008', '2026-03-05 11:02:42', NULL, 0, '2026-03-05 10:30:47'),
('req-1772696035449-kf3ojecoc', 'session-1772695999821-axo5b2214', 'K Sivakumar', '6656644344', 'sivakumar512037@gmail.com', '{\"name\":\"K Sivakumar\",\"phone\":\"6656644344\",\"email\":\"sivakumar512037@gmail.com\",\"purpose\":\"Meet Staff\",\"notes\":\"\"}', 'dept-cse', 'staff-cse-001', 'APPROVED', 'staff-cse-001', '2026-03-05 13:04:42', NULL, 0, '2026-03-05 13:03:55'),
('req-1772705137266-i845ik1cv', 'session-1772704752221-58farfe5e', 'Muneesh Kumar', '9360814272', 'muneesh.kumar@forge-iv.co', '{\"name\":\"Muneesh Kumar\",\"phone\":\"9360814272\",\"email\":\"muneesh.kumar@forge-iv.co\",\"purpose\":\"Delivery/Vendor\",\"notes\":\"Hnk\"}', 'dept-ece', 'staff-ece-008', 'PENDING', NULL, NULL, NULL, 0, '2026-03-05 15:35:37'),
('req-1772706497539-u4373ecp5', 'session-1772706425719-ztmpy0x43', 'Hwhen', '6689558658', 'sivakumar512037@gmail.com', '{\"name\":\"Hwhen\",\"phone\":\"6689558658\",\"email\":\"sivakumar512037@gmail.com\",\"purpose\":\"Interview\",\"notes\":\"Hwhd\"}', 'dept-cse', 'staff-cse-001', 'PENDING', NULL, NULL, NULL, 0, '2026-03-05 15:58:17');

-- --------------------------------------------------------

--
-- Table structure for table `visitor_sessions`
--

CREATE TABLE `visitor_sessions` (
  `id` varchar(64) NOT NULL,
  `session_code` varchar(100) NOT NULL,
  `template_id` varchar(64) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `qr_code_url` text DEFAULT NULL,
  `qr_token` varchar(255) DEFAULT NULL,
  `qr_token_hash` varchar(128) DEFAULT NULL,
  `status` enum('ACTIVE','USED','EXPIRED','DESTROYED') DEFAULT 'ACTIVE',
  `expires_at` datetime DEFAULT NULL,
  `generated_by` varchar(64) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `visitor_sessions`
--

INSERT INTO `visitor_sessions` (`id`, `session_code`, `template_id`, `category`, `qr_code_url`, `qr_token`, `qr_token_hash`, `status`, `expires_at`, `generated_by`, `created_at`) VALUES
('session-1772298181-acea5dd1', 'VMS-1772298181-FD1D5E32', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772298181-FD1D5E32&token=b7fcddec1f8c13edaa8fe80cde3f82e3a4bf8855c15d45a4f58fd2727608c773', 'b7fcddec1f8c13edaa8fe80cde3f82e3a4bf8855c15d45a4f58fd2727608c773', 'b0dfdbda228700716863119705f1748d83f896a986ba72c0fb1eab336e99302a', 'ACTIVE', '2026-03-01 00:03:01', 'sec-user-111', '2026-02-28 22:33:01'),
('session-1772298331-83432684', 'VMS-1772298331-339B1683', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772298331-339B1683&token=e2463fe8094de6317f7bf951d587419f7d0ed309b7eee7bb279b47933530c151', 'e2463fe8094de6317f7bf951d587419f7d0ed309b7eee7bb279b47933530c151', 'a055338030023c2157ec73c2c80d3574cb2d5c3823a64ad13f0014b79b0df85a', 'ACTIVE', '2026-03-01 00:05:31', 'sec-user-111', '2026-02-28 22:35:31'),
('session-1772298334-2c7ca73b', 'VMS-1772298334-B538FC90', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772298334-B538FC90&token=b33053643fd5cd88ae3daa04a3f71ac03d43ced96fff502106a732e49f938251', 'b33053643fd5cd88ae3daa04a3f71ac03d43ced96fff502106a732e49f938251', '017862f66c5c2614d09f3bcfdf29a3e2f5acee29c65721358ce815da31ad0349', 'ACTIVE', '2026-03-01 00:05:34', 'sec-user-111', '2026-02-28 22:35:34'),
('session-1772298341-b327cb95', 'VMS-1772298341-216C8E3F', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298341-216C8E3F&token=04587592a3f71b8a24071bd5dbb8e030701de38c51d524cfd9fc6bb9de911f11', '04587592a3f71b8a24071bd5dbb8e030701de38c51d524cfd9fc6bb9de911f11', 'bda0115654a81e31632d69e1ad3fe90860f358785faac4d1a47cddf93c2d3490', 'ACTIVE', '2026-03-01 00:05:41', 'sec-user-111', '2026-02-28 22:35:41'),
('session-1772298346-09cdfcb0', 'VMS-1772298346-AD9A82A7', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298346-AD9A82A7&token=e0667f168952d03db754c8c0eb2978a9c1d7df0d23a64cc0f20ef3680614ef9d', 'e0667f168952d03db754c8c0eb2978a9c1d7df0d23a64cc0f20ef3680614ef9d', '7420cdcb7224d3272d6faeb2d7b5ff547b6a9e15a2594c1b4a0177d52ac263de', 'ACTIVE', '2026-03-01 00:05:46', 'sec-user-111', '2026-02-28 22:35:46'),
('session-1772298346-2de9e548', 'VMS-1772298346-468ABF1B', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298346-468ABF1B&token=3b659fbbbedf08d79b91c625317b166079400b1b26e8d60a79a09e3d456af273', '3b659fbbbedf08d79b91c625317b166079400b1b26e8d60a79a09e3d456af273', '6379b8afa4da16f39ef6694d20e94b53615feedab40238d5fa657b07260697e4', 'ACTIVE', '2026-03-01 00:05:46', 'sec-user-111', '2026-02-28 22:35:46'),
('session-1772298346-39312eda', 'VMS-1772298346-C2EDDC7A', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298346-C2EDDC7A&token=59622203494d2d14a49da02074a1591ca488059770a3ed0214e4acee2bff5cd7', '59622203494d2d14a49da02074a1591ca488059770a3ed0214e4acee2bff5cd7', '3da08cce3e5ae445bd001e4ee62e8b590a3d352d2d67c6d15f6704dc2e54066e', 'ACTIVE', '2026-03-01 00:05:46', 'sec-user-111', '2026-02-28 22:35:46'),
('session-1772298346-4a07e512', 'VMS-1772298346-E77DA6EE', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298346-E77DA6EE&token=f232a675c4a8947bb1e46568e016b178f746ffc9691ea21f15095c66ad23dfba', 'f232a675c4a8947bb1e46568e016b178f746ffc9691ea21f15095c66ad23dfba', '6ce227a8335bd779a7db8fe0cdc9b62a18ab1ed94ab5815fdf99c9a67845e531', 'ACTIVE', '2026-03-01 00:05:46', 'sec-user-111', '2026-02-28 22:35:46'),
('session-1772298354-d98b403d', 'VMS-1772298354-3195D62D', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298354-3195D62D&token=d5670c11e2e1945f6d93376a6c7d153821e67869cc4a92682d33e6667ec5989a', 'd5670c11e2e1945f6d93376a6c7d153821e67869cc4a92682d33e6667ec5989a', '3c90184e142e5b7fdf429c06135f07b9d135c5314192acb6ba0e012201545657', 'ACTIVE', '2026-03-01 00:05:54', 'sec-user-111', '2026-02-28 22:35:54'),
('session-1772298359-18fb302f', 'VMS-1772298359-F419E22A', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298359-F419E22A&token=f130ac35cefdabca4f514bf599b303016709966e283d288baa235286795691ea', 'f130ac35cefdabca4f514bf599b303016709966e283d288baa235286795691ea', '16ea038e4589149d13e6eba2afc8ecbfbccaa525f9f47468ca030dde38571e81', 'ACTIVE', '2026-03-01 00:05:59', 'sec-user-111', '2026-02-28 22:35:59'),
('session-1772298359-27b02bbc', 'VMS-1772298359-1F5813CF', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298359-1F5813CF&token=3b81a4289ffe8ec9f3e59b61be59fc52b04a353ce6526405ee972cf5697b943a', '3b81a4289ffe8ec9f3e59b61be59fc52b04a353ce6526405ee972cf5697b943a', '91cb94742b22bcf0e4a1ac1275990c72f681a0e18fd6982ebad07ec955dd1b85', 'ACTIVE', '2026-03-01 00:05:59', 'sec-user-111', '2026-02-28 22:35:59'),
('session-1772298359-51900ac5', 'VMS-1772298359-16842023', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298359-16842023&token=b211dcd1e7b5a35a7757030eaa7ee3f4b8381edea966a70ea32013760e72c8ab', 'b211dcd1e7b5a35a7757030eaa7ee3f4b8381edea966a70ea32013760e72c8ab', '0c8bf25e14ae1ffd02151b9f8c6e0f82b0807dcf6187be6ea9dff9336939cea5', 'ACTIVE', '2026-03-01 00:05:59', 'sec-user-111', '2026-02-28 22:35:59'),
('session-1772298359-84c5d983', 'VMS-1772298359-03B9A5E3', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298359-03B9A5E3&token=db7358a4ef50c8e168b0b5ba5b1b8959ce646223439e966b9bc742fa0535f7ee', 'db7358a4ef50c8e168b0b5ba5b1b8959ce646223439e966b9bc742fa0535f7ee', '8ffe17d678bcac12db697e1a89154929e440e421dd38e5952d5b7a6d835ebe77', 'ACTIVE', '2026-03-01 00:05:59', 'sec-user-111', '2026-02-28 22:35:59'),
('session-1772298359-88214074', 'VMS-1772298359-A7E7F310', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298359-A7E7F310&token=a9631f6dfd52909483bd4f13119fe2ca36aab56804c43675b9877f537d3d1b83', 'a9631f6dfd52909483bd4f13119fe2ca36aab56804c43675b9877f537d3d1b83', '6cbc1f9fc73a9537a17307cddf71a1e2a2af403b0cde83d85b4cff442dd2b5bb', 'ACTIVE', '2026-03-01 00:05:59', 'sec-user-111', '2026-02-28 22:35:59'),
('session-1772298359-8e8558fd', 'VMS-1772298359-95E63041', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298359-95E63041&token=c21b1fedbc9e27e1f07988dcb0a7731b086313c24d28ff9f880cd0cb7ea990d7', 'c21b1fedbc9e27e1f07988dcb0a7731b086313c24d28ff9f880cd0cb7ea990d7', '466ed97e794d5ffcd1990031ee66e4ebab2c2b9f61d77bc50b6560df8247eb91', 'ACTIVE', '2026-03-01 00:05:59', 'sec-user-111', '2026-02-28 22:35:59'),
('session-1772298359-964c2341', 'VMS-1772298359-BF732FFF', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298359-BF732FFF&token=b17a87cd23f02f49418284d15c6c92e402dfb1f5567dd23a5bae79dc6696dd0a', 'b17a87cd23f02f49418284d15c6c92e402dfb1f5567dd23a5bae79dc6696dd0a', 'fed9d6dcd279b8a2f458ac847553bf096a6561e5b065f0b8c4c524f63ec22878', 'ACTIVE', '2026-03-01 00:05:59', 'sec-user-111', '2026-02-28 22:35:59'),
('session-1772298359-9718d734', 'VMS-1772298359-591D12E3', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298359-591D12E3&token=cac6d4f0d3771d6df549ded52ff069407ac3ca165670b64d0eacd4a5e8287367', 'cac6d4f0d3771d6df549ded52ff069407ac3ca165670b64d0eacd4a5e8287367', '851f8c64c7dd1b7b6a35a83724f55f9026e3a9cb0f76ca88da57214fdefafdea', 'ACTIVE', '2026-03-01 00:05:59', 'sec-user-111', '2026-02-28 22:35:59'),
('session-1772298359-b4d055dc', 'VMS-1772298359-2D07D364', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298359-2D07D364&token=d881c2c6a3126eea0ebf6fc4652e670bda6ab3c90188914d359f17cbb35cfcc0', 'd881c2c6a3126eea0ebf6fc4652e670bda6ab3c90188914d359f17cbb35cfcc0', '7e6fd2b1ba01f71d22ec29919bbe7e062fbfc23f9f46f51fd91c20d24c3217ad', 'ACTIVE', '2026-03-01 00:05:59', 'sec-user-111', '2026-02-28 22:35:59'),
('session-1772298359-d01228d8', 'VMS-1772298359-E718B9B3', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298359-E718B9B3&token=c2c1bd1c3233e23c17ff750d8c06923f2c6dad483379bd77de3d433c5e0e0e95', 'c2c1bd1c3233e23c17ff750d8c06923f2c6dad483379bd77de3d433c5e0e0e95', '5ae4a91c8f6243e04caf940a8c37802fcee17eb5a670c0b8ef38c4178486f916', 'ACTIVE', '2026-03-01 00:05:59', 'sec-user-111', '2026-02-28 22:35:59'),
('session-1772298359-f0d6a2b0', 'VMS-1772298359-BDA042A9', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298359-BDA042A9&token=17a25d0cc627e5da8566c9c589bdb3d02527e583f04622037b8f97fdbd6092f9', '17a25d0cc627e5da8566c9c589bdb3d02527e583f04622037b8f97fdbd6092f9', '8d8bd18240fe7904348707044e1f32a6e39b26d99cfa2d6e5e04f4ea1fd4375c', 'ACTIVE', '2026-03-01 00:05:59', 'sec-user-111', '2026-02-28 22:35:59'),
('session-1772298362-72290451', 'VMS-1772298362-DD98560D', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772298362-DD98560D&token=3df84c849f1722c8fe023951cf75c486c757cd5d7a7ffb5395fc146828bac999', '3df84c849f1722c8fe023951cf75c486c757cd5d7a7ffb5395fc146828bac999', '3beb50fd7f5d8e3715b807cc6cc5c580cc69e5349181607f36c94b279b30795d', 'ACTIVE', '2026-03-01 00:06:02', 'sec-user-111', '2026-02-28 22:36:02'),
('session-1772298389-ab47a7d1', 'VMS-1772298389-ADB8211F', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772298389-ADB8211F&token=ee76ccc3624ed172c5db3755daac4cd3cea6f5e93a200ae5b8ea765851a33f3d', 'ee76ccc3624ed172c5db3755daac4cd3cea6f5e93a200ae5b8ea765851a33f3d', 'aa443e7e466d2087e875e3e87db1e141b8a599da16782c6a68bfe067a393578e', 'ACTIVE', '2026-03-01 00:06:29', 'sec-user-111', '2026-02-28 22:36:29'),
('session-1772298392-8db0e5b3', 'VMS-1772298392-E6304550', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772298392-E6304550&token=e6f9460eab4019c6b9c43abb7da6037eb22d1c820e997f50fa8d87b0ec5ce623', 'e6f9460eab4019c6b9c43abb7da6037eb22d1c820e997f50fa8d87b0ec5ce623', '309828a44cdfeadb71557149a226055265904f68feb808955e3e1beb0a7ffeb2', 'ACTIVE', '2026-03-01 00:06:32', 'sec-user-111', '2026-02-28 22:36:32'),
('session-1772298914-20f32f9c', 'VMS-1772298914-FE00DD6F', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772298914-FE00DD6F&token=8d34cfa90db801db23a82cfde6ab38b119499849ff1f6c4b8f3dbf03f7817258', '8d34cfa90db801db23a82cfde6ab38b119499849ff1f6c4b8f3dbf03f7817258', '65c9b3ceee5f5bbb0dfb8393c860a340fb2d83b69d165a74340bc1d28a4ecb91', 'ACTIVE', '2026-03-01 00:15:14', 'sec-user-111', '2026-02-28 22:45:14'),
('session-1772299514-89689883', 'VMS-1772299514-AF16E188', NULL, 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772299514-AF16E188&token=f19c0f6ba25f4d9010f67801c03320a3279dc1d5af33eac91362551d4bb44dba', 'f19c0f6ba25f4d9010f67801c03320a3279dc1d5af33eac91362551d4bb44dba', '4bb1737e65e88f5ac8f6541dbb531a2068660c3ebfadb3608d2f36d70c247c14', 'ACTIVE', '2026-03-01 00:25:14', 'sec-user-111', '2026-02-28 22:55:14'),
('session-1772299549-2ff76c39', 'VMS-1772299549-79072AAC', NULL, 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772299549-79072AAC&token=23f9c0002551b474e752fde3969fd4b62e0924c0d888e17e88f97958e0c97c02', '23f9c0002551b474e752fde3969fd4b62e0924c0d888e17e88f97958e0c97c02', '899ecf4595ca122e9b8cb3aadd9517b336540cf6826d3ee40cfc2a40b7d080d1', 'ACTIVE', '2026-03-01 00:25:49', 'sec-user-111', '2026-02-28 22:55:49'),
('session-1772343228-caba8411', 'VMS-1772343228-B7EDAF66', NULL, 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772343228-B7EDAF66&token=ef464514f16944cd5ad59ff70d1746075343d172ec37a3d26c36495795d3e574', 'ef464514f16944cd5ad59ff70d1746075343d172ec37a3d26c36495795d3e574', '4d23309090156faca15ee30a7ae7f5d4fd346a3408a7a08cbb3846f4f11a24fa', 'ACTIVE', '2026-03-01 12:33:48', 'sec-user-111', '2026-03-01 11:03:48'),
('session-1772343231-d1b922a7', 'VMS-1772343231-B49E6420', NULL, 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772343231-B49E6420&token=3c25c30c256bbdbab2ddd4d5081563ddbfe77d31af705e1d4e0c20a95c042d01', '3c25c30c256bbdbab2ddd4d5081563ddbfe77d31af705e1d4e0c20a95c042d01', '1c28002c967de1f9059e62bf8e44a3ec42bdf6374204f925d4dcf54b3281f14d', 'ACTIVE', '2026-03-01 12:33:51', 'sec-user-111', '2026-03-01 11:03:51'),
('session-1772343231-eedef121', 'VMS-1772343231-7B039638', NULL, 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772343231-7B039638&token=034bdaeb5b6d5d1452427d2e09dabb4904294396466d9e17821ea5a15f16b911', '034bdaeb5b6d5d1452427d2e09dabb4904294396466d9e17821ea5a15f16b911', 'a946168ac6dcf25a665432fc7df682396f29b3ff362c42762729d593b787d10d', 'ACTIVE', '2026-03-01 12:33:51', 'sec-user-111', '2026-03-01 11:03:51'),
('session-1772343256-263526f0', 'VMS-1772343256-25D92838', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772343256-25D92838&token=4ad52832e21397c15c36cd32665832115813ea3c5cdee700be37f6e23fecae37', '4ad52832e21397c15c36cd32665832115813ea3c5cdee700be37f6e23fecae37', 'd7ded30c25059b3a3f3cdd4592dcc34f1603954c54f67db2247b249c2a154999', 'ACTIVE', '2026-03-01 12:34:16', 'sec-user-111', '2026-03-01 11:04:16'),
('session-1772343258-aea15055', 'VMS-1772343258-04F4DBD6', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772343258-04F4DBD6&token=c4553d5a3a593043fae45831636b5e5f7681e0998325050d343c1576b70076c6', 'c4553d5a3a593043fae45831636b5e5f7681e0998325050d343c1576b70076c6', 'f733a73f35190967ffd96204420ce87d8d961230c89edc84e48a362a748898bf', 'ACTIVE', '2026-03-01 12:34:18', 'sec-user-111', '2026-03-01 11:04:18'),
('session-1772343260-4a61c58f', 'VMS-1772343260-07CBD7A3', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772343260-07CBD7A3&token=e74acbdc9e6dfff0827b6add9bed6429d62f234497b5b53c35106394fd4bbe9e', 'e74acbdc9e6dfff0827b6add9bed6429d62f234497b5b53c35106394fd4bbe9e', '954d2ec7935535ea80c4ab87d0f66fb28940352e7ae5c8e3f9e466718f29130d', 'ACTIVE', '2026-03-01 12:34:20', 'sec-user-111', '2026-03-01 11:04:20'),
('session-1772343260-5471f864', 'VMS-1772343260-EC92F631', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772343260-EC92F631&token=706b5123083028732acbe8f3f8d56e23d5df9f04534385c6b36dfceb78b55dd7', '706b5123083028732acbe8f3f8d56e23d5df9f04534385c6b36dfceb78b55dd7', '4026f852ac33df0a2cefdaefb60c2225d95ddc63a91adbb50faebcfb4d271020', 'ACTIVE', '2026-03-01 12:34:20', 'sec-user-111', '2026-03-01 11:04:20'),
('session-1772343265-b5454d38', 'VMS-1772343265-C1C3FBDB', NULL, 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772343265-C1C3FBDB&token=a47c0fc7f7255d92e05f885488a219ffb57f04e4c448f8359b2b5e9a49f7f408', 'a47c0fc7f7255d92e05f885488a219ffb57f04e4c448f8359b2b5e9a49f7f408', '545df3bb7a62474aeb18706f905db3c7fedae8a87d84c062eb81b672a8330e4c', 'ACTIVE', '2026-03-01 12:34:25', 'sec-user-111', '2026-03-01 11:04:25'),
('session-1772343269-8cf37289', 'VMS-1772343269-BD6E3627', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772343269-BD6E3627&token=d32ac6eb0f2755c85d03849f06aea335d4efce51bc760817b4ca6650eb7f08a8', 'd32ac6eb0f2755c85d03849f06aea335d4efce51bc760817b4ca6650eb7f08a8', 'eea4f8edd83cb7febed426a1acec9cf8758c74af6f0f9bfd0272bb8b6cf3813f', 'ACTIVE', '2026-03-01 12:34:29', 'sec-user-111', '2026-03-01 11:04:29'),
('session-1772343269-e4986f0e', 'VMS-1772343269-7219AB6E', 'tmpl-parent', 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772343269-7219AB6E&token=526c8319a9c5d17b8d92db5903ec42180bdff816b496a770f8c1c71d1dbc2d93', '526c8319a9c5d17b8d92db5903ec42180bdff816b496a770f8c1c71d1dbc2d93', 'adba17cc5dd262806af189abc13592809dcb37f43acc8b9a2de3f8ecc348d06a', 'ACTIVE', '2026-03-01 12:34:29', 'sec-user-111', '2026-03-01 11:04:29'),
('session-1772349416-4d51f5e6', 'VMS-1772349416-C6D11A7F', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772349416-C6D11A7F&token=592728d8b9b55bc07e675f5c14b5ea5b6b136577911cb9431f49eb3d9f6270fe', '592728d8b9b55bc07e675f5c14b5ea5b6b136577911cb9431f49eb3d9f6270fe', 'b15940a389f870c421ded4deb2f3896a1836820a57fce5de870285e5ee52c2e1', 'ACTIVE', '2026-03-01 14:16:56', 'sec-user-111', '2026-03-01 12:46:56'),
('session-1772349420-079749aa', 'VMS-1772349420-D6996038', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772349420-D6996038&token=ab0ee228ad1bdd7a3ccaf59fcd8a71c98a502a98c8d97c2193def8eb831a21ce', 'ab0ee228ad1bdd7a3ccaf59fcd8a71c98a502a98c8d97c2193def8eb831a21ce', '767f0465b925e7ce0bb44a2774a3ceb60ea0653f05341a30dd5aae1d943181ac', 'ACTIVE', '2026-03-01 14:17:00', 'sec-user-111', '2026-03-01 12:47:00'),
('session-1772349420-50bbd97e', 'VMS-1772349420-C31B0EF2', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772349420-C31B0EF2&token=5bc0ca853c631bc883d8bf8f4cff7c7b719821de460478130229e6bf84600da0', '5bc0ca853c631bc883d8bf8f4cff7c7b719821de460478130229e6bf84600da0', 'af4dcee500f3ef3de16fdb8f1cfd15ac070747628163e0c3aab10f1d54ad2146', 'ACTIVE', '2026-03-01 14:17:00', 'sec-user-111', '2026-03-01 12:47:00'),
('session-1772349421-45937d7a', 'VMS-1772349421-426E4674', NULL, 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772349421-426E4674&token=9945dd7687fd0cfecee7eb38c1848db0920c2593b82cfd76a412100e4d930c6d', '9945dd7687fd0cfecee7eb38c1848db0920c2593b82cfd76a412100e4d930c6d', '5c36d5d40b3b6d29c5373c24d948531e3ec9610a4d9abfe4d174e8ee9039ef75', 'ACTIVE', '2026-03-01 14:17:01', 'sec-user-111', '2026-03-01 12:47:01'),
('session-1772349421-4603b1a8', 'VMS-1772349421-37DB6659', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772349421-37DB6659&token=90c14d8759652b00cb188a2a1a5efbadb493e3a01fd16076eb7f777991cc1565', '90c14d8759652b00cb188a2a1a5efbadb493e3a01fd16076eb7f777991cc1565', '1d4a32215acc05b4da6a7d54df8b8be2c5ce8572d7bc95ba2f19ca0e406b101e', 'ACTIVE', '2026-03-01 14:17:01', 'sec-user-111', '2026-03-01 12:47:01'),
('session-1772349421-83c9f0f2', 'VMS-1772349421-A1FE3374', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772349421-A1FE3374&token=93874aec7b5f72729d915e22512f640c7d6c4e57f0cb91d628371eb346a8ff28', '93874aec7b5f72729d915e22512f640c7d6c4e57f0cb91d628371eb346a8ff28', '7e639e17b44591ae8bf626918eb24c2333b099ea149076e4a9fcceb23c557072', 'ACTIVE', '2026-03-01 14:17:01', 'sec-user-111', '2026-03-01 12:47:01'),
('session-1772349433-079675fb', 'VMS-1772349433-E9EA8B95', NULL, 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772349433-E9EA8B95&token=a4c6e2eecd436520ada322b5dc7952a2a74f0ab9a5af7b0652bef6b21e3a915c', 'a4c6e2eecd436520ada322b5dc7952a2a74f0ab9a5af7b0652bef6b21e3a915c', 'c4228d4f5e83a22529362e59e1bfeb2b403150099d0cd934090d82fdd541ab1b', 'ACTIVE', '2026-03-01 14:17:13', 'sec-user-111', '2026-03-01 12:47:13'),
('session-1772349433-1de36698', 'VMS-1772349433-BC7A7953', NULL, 'parent', 'http://localhost:3001/visitor.html?session=VMS-1772349433-BC7A7953&token=4a73aebf8733860cf4a1f3d92c19f382237189e39c1af299f86c2ff7ed4dbf55', '4a73aebf8733860cf4a1f3d92c19f382237189e39c1af299f86c2ff7ed4dbf55', '7cba2ffe1719ad0db13e94cf0790bf42da9e585935884448d5cf6c3a92157f72', 'ACTIVE', '2026-03-01 14:17:13', 'sec-user-111', '2026-03-01 12:47:13'),
('session-1772349433-72bc508c', 'VMS-1772349433-6AFDF2F0', 'tmpl-admission', 'admission', 'http://localhost:3001/visitor.html?session=VMS-1772349433-6AFDF2F0&token=dd4cad479f3fd6c82cd984677c8cdfdd2dfc521e668e39dd4dc98a59a7b7d2ba', 'dd4cad479f3fd6c82cd984677c8cdfdd2dfc521e668e39dd4dc98a59a7b7d2ba', 'dbbdd3cbea660ea2c975bbcd5c63490d9d15bbf1b7ec25d3d89704756bb1c69c', 'ACTIVE', '2026-03-01 14:17:13', 'sec-user-111', '2026-03-01 12:47:13'),
('session-1772349892-67e2cd37', 'VMS-1772349892-D5AFCDA0', NULL, 'parent', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772349892-D5AFCDA0&token=912f39b6302cbbe1b2e62de587b3542b174f40c92aacc352141b8f15c4c69828', '912f39b6302cbbe1b2e62de587b3542b174f40c92aacc352141b8f15c4c69828', '3a62b77781a7044d571c29edd63570b0e8478e64090bbb51221491cb7c0ce554', 'ACTIVE', '2026-03-01 14:24:52', 'sec-user-111', '2026-03-01 12:54:52'),
('session-1772350016-311cb24d', 'VMS-1772350016-41FA1922', NULL, 'parent', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772350016-41FA1922&token=29a73092b8051295c7a38ba6fe2fdba105cc23472eef809a853ab73f267644da', '29a73092b8051295c7a38ba6fe2fdba105cc23472eef809a853ab73f267644da', 'c69fa5fc3efe03c7611d128e057cc1b5d01e179cc73778dd8101bc8ae1d10ad5', 'ACTIVE', '2026-03-01 14:26:56', 'sec-user-111', '2026-03-01 12:56:56'),
('session-1772352361-61666d49', 'VMS-1772352361-6BA4888D', 'tmpl-admission', 'admission', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772352361-6BA4888D&token=80c5a0991a06d5bb46e525c4750ffb8301144b3028040a22622fd7de93ab21f0', '80c5a0991a06d5bb46e525c4750ffb8301144b3028040a22622fd7de93ab21f0', '16c3a73f13151256bc738f8a7618f06aaa513a9f567e953841aa5cc6ac828d2e', 'ACTIVE', '2026-03-01 15:06:01', 'sec-user-111', '2026-03-01 13:36:01'),
('session-1772352363-782a7288', 'VMS-1772352363-478A6DB3', 'tmpl-admission', 'admission', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772352363-478A6DB3&token=729a79eec1bf6421cc16f7bbc271c77ebe9721ccf1a787ac9ca64e56674fa0f6', '729a79eec1bf6421cc16f7bbc271c77ebe9721ccf1a787ac9ca64e56674fa0f6', '23cf20e55daad629ed1f3162b774854f1cc8fd462b8c197e0bc7bae7815e00c7', 'ACTIVE', '2026-03-01 15:06:03', 'sec-user-111', '2026-03-01 13:36:03'),
('session-1772352364-2a7f0613', 'VMS-1772352364-66C46648', 'tmpl-admission', 'admission', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772352364-66C46648&token=1b574bf64eddf68dce7577edfdb742263e6dc09fde402523a3ecbb4752795bc9', '1b574bf64eddf68dce7577edfdb742263e6dc09fde402523a3ecbb4752795bc9', 'c59c8efd6506c2d5d9b730e21979d54513e915dd4b5b34694aef9ad076336648', 'ACTIVE', '2026-03-01 15:06:04', 'sec-user-111', '2026-03-01 13:36:04'),
('session-1772352365-fbc0afa8', 'VMS-1772352365-9A0D57FD', NULL, 'parent', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772352365-9A0D57FD&token=e1f857e3e5efff1f13e10d02834687d01c001f93ab6eb003dd984885ba7723f7', 'e1f857e3e5efff1f13e10d02834687d01c001f93ab6eb003dd984885ba7723f7', '50529dc214bb259c0ee1f6ea58045dc6905fd42d4c7566c7eac44e01e879a934', 'ACTIVE', '2026-03-01 15:06:05', 'sec-user-111', '2026-03-01 13:36:05'),
('session-1772352367-d1077cff', 'VMS-1772352367-DF91B652', 'tmpl-admission', 'admission', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772352367-DF91B652&token=059f1bf92b0e94e3b25b8fc0c1e3e23cefc0751e93a90f816acc1d449622b48d', '059f1bf92b0e94e3b25b8fc0c1e3e23cefc0751e93a90f816acc1d449622b48d', 'a14e4122c700d6a731b4453170a498b88fa7a0c11ff9a015bd9d81e88d690042', 'ACTIVE', '2026-03-01 15:06:07', 'sec-user-111', '2026-03-01 13:36:07'),
('session-1772352367-edd9a7f7', 'VMS-1772352367-9B18E6A8', NULL, 'parent', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772352367-9B18E6A8&token=0a0baec04db4d88173a31e4d42c7c02da038ffc019f180bb84c2979a1725d40d', '0a0baec04db4d88173a31e4d42c7c02da038ffc019f180bb84c2979a1725d40d', 'd8c47c0c1429171bda061e733b80daedf46494c7b5a4a62fb048aa66d477523f', 'ACTIVE', '2026-03-01 15:06:07', 'sec-user-111', '2026-03-01 13:36:07'),
('session-1772352370-b75f0405', 'VMS-1772352370-BD8DCB73', 'tmpl-admission', 'admission', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772352370-BD8DCB73&token=b7839c780f670c5c98287f59d83db6f64633bcfdc56d13348d9b126a9dc6d1c8', 'b7839c780f670c5c98287f59d83db6f64633bcfdc56d13348d9b126a9dc6d1c8', 'bce22140ef05aff48f6af1c249c6d25f8b45c0f9dfc1f569f8859ac4c297de8b', 'ACTIVE', '2026-03-01 15:06:10', 'sec-user-111', '2026-03-01 13:36:10'),
('session-1772352370-fd38b21c', 'VMS-1772352370-B8D06C38', 'tmpl-admission', 'admission', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772352370-B8D06C38&token=37d4891d13be9c867141ba60c2a0941c4e2c3cfc86784ef12e171cc96bb2744b', '37d4891d13be9c867141ba60c2a0941c4e2c3cfc86784ef12e171cc96bb2744b', '776e549402691ebc039e91bea7ed0269a30bb97f8490c36a5ed329bf1c7b7ffb', 'ACTIVE', '2026-03-01 15:06:10', 'sec-user-111', '2026-03-01 13:36:10'),
('session-1772352376-e72339e0', 'VMS-1772352376-2948C7AC', NULL, 'parent', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772352376-2948C7AC&token=a9dec6c5c087b0f44c58f60007b98a4f774c8ea72a9398ad97f4137f25a509b9', 'a9dec6c5c087b0f44c58f60007b98a4f774c8ea72a9398ad97f4137f25a509b9', '274d8b0cf9edede49f879e7fcf8d3ab4a7893b79d41ce9e977524756a108fa40', 'ACTIVE', '2026-03-01 15:06:16', 'sec-user-111', '2026-03-01 13:36:16'),
('session-1772352564-c0f7657b', 'VMS-1772352564-391FC355', NULL, 'parent', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772352564-391FC355&token=a31060ecc366bdc79219cdd1338bcc9a819b7212ad5b63ed1bf26ad3accc3129', 'a31060ecc366bdc79219cdd1338bcc9a819b7212ad5b63ed1bf26ad3accc3129', 'e80d8f9f0198506d153b0872070dd6a86fafcd517b3b0fadf693d5686b42a8db', 'ACTIVE', '2026-03-01 15:09:24', 'sec-user-111', '2026-03-01 13:39:24'),
('session-1772352680-a90a34a4', 'VMS-1772352680-F801283F', NULL, 'parent', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772352680-F801283F&token=f8be08b53824dc4fca1c4d3b8f75cc5b0fd415646f772011d25f583e91573249', 'f8be08b53824dc4fca1c4d3b8f75cc5b0fd415646f772011d25f583e91573249', '045fb058c1e97d75f3739ec4e4dddc762cb804b1e1197e4cfd0049037157d87a', 'ACTIVE', '2026-03-01 15:11:20', 'sec-user-111', '2026-03-01 13:41:20'),
('session-1772352725-bd9afb14', 'VMS-1772352725-292D8405', NULL, 'parent', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772352725-292D8405&token=6507775a07072a9f1e9421be4506dc33c98b1b5a27e9c70f4cefe65d227eb199', '6507775a07072a9f1e9421be4506dc33c98b1b5a27e9c70f4cefe65d227eb199', 'dd5cf982473b53dd03dd62ca3f4bd5a427fc70bcc88c8e452cd7e28f78f633ef', 'ACTIVE', '2026-03-01 15:12:05', 'sec-user-111', '2026-03-01 13:42:05'),
('session-1772352916-8bf2ba21', 'VMS-1772352916-A72E4CD4', NULL, 'parent', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772352916-A72E4CD4&token=50dd3e97eb7475c66dad978484c50191d09139e3d790b1935fc55d7349a65047', '50dd3e97eb7475c66dad978484c50191d09139e3d790b1935fc55d7349a65047', '33f196d933519365bf123f98806a8f59ef577d338e4b232469f29219553312d8', 'ACTIVE', '2026-03-01 15:15:16', 'sec-user-111', '2026-03-01 13:45:16'),
('session-1772353007-9511da1c', 'VMS-1772353007-647DB95D', 'tmpl-admission', 'admission', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772353007-647DB95D&token=530e175e48756d9782f56e7753a4b4633bd5599789552e127d0b695b97b892cb', '530e175e48756d9782f56e7753a4b4633bd5599789552e127d0b695b97b892cb', '7fceff453c21f1e8633a78c82ffb473d7c91102160d00b97c62c781383e51b45', 'ACTIVE', '2026-03-01 15:16:47', 'sec-user-111', '2026-03-01 13:46:47'),
('session-1772642733069-lom3enxjx', 'VMS-1772642733071-YZ2OVLMG', 'tmpl-admission', 'admission', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772642733071-YZ2OVLMG&token=ba0f3c077ff25d92a8903252f6a68c17acf92c324a3ef153c08ffd692b235544', 'ba0f3c077ff25d92a8903252f6a68c17acf92c324a3ef153c08ffd692b235544', 'e6c079bafbb6df3ae107c679ae1477d1b4900209ef83a1a33546bf6277f0e2af', 'ACTIVE', '2026-03-04 22:45:33', 'sec-user-111', '2026-03-04 22:15:33'),
('session-1772642736759-xw538asyr', 'VMS-1772642736759-TFO4BHNP', NULL, 'parent', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772642736759-TFO4BHNP&token=4621c5af685d9fac8e48f5298f9a561f984d935dc606fcbfab7c9ff8a4c2e0e1', '4621c5af685d9fac8e48f5298f9a561f984d935dc606fcbfab7c9ff8a4c2e0e1', '81169c5257c51de7e2ddca3b4d72965b5b98114426803352623996d01a23a2c5', 'ACTIVE', '2026-03-04 22:45:36', 'sec-user-111', '2026-03-04 22:15:36'),
('session-1772642738241-czuxzawpq', 'VMS-1772642738241-K6NZ6UVP', 'tmpl-admission', 'admission', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772642738241-K6NZ6UVP&token=08177e73638978ea6996ae7fd2d0a5be34c260ad8362387373a109798296808b', '08177e73638978ea6996ae7fd2d0a5be34c260ad8362387373a109798296808b', 'be935f68fe335e5bae6ca38d7cd1137bcea690252702655a214c0d88a17fb3d1', 'ACTIVE', '2026-03-04 22:45:38', 'sec-user-111', '2026-03-04 22:15:38'),
('session-1772644033937-tt55n6nup', 'VMS-1772644033938-JUASH4OO', 'tmpl-admission', 'admission', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772644033938-JUASH4OO&token=6372ec2ca016810440875d3aa491587cac41ededf08bacebbdc5a970120a97f4', '6372ec2ca016810440875d3aa491587cac41ededf08bacebbdc5a970120a97f4', 'aa8c9a7aad5411224918806dfff313429862dbfa64e4e76c79f5c11e8ac46e57', 'ACTIVE', '2026-03-04 23:07:13', 'sec-user-111', '2026-03-04 22:37:13'),
('session-1772644076162-almugnzk2', 'VMS-1772644076162-IT5FV3O1', 'tmpl-parent', 'parent', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772644076162-IT5FV3O1&token=a5b327253e9d05ce9a00c6e0de00bf2858753ac2833863b1655b511d1f7748c3', 'a5b327253e9d05ce9a00c6e0de00bf2858753ac2833863b1655b511d1f7748c3', '6c774ec13f4cb01574a795e80015cbc39e0d6c1fc4b1b3fbda5db505f17553d5', 'ACTIVE', '2026-03-04 23:07:56', 'sec-user-111', '2026-03-04 22:37:56'),
('session-1772644076592-7l0493uy6', 'VMS-1772644076592-CSH09ORC', 'tmpl-parent', 'parent', 'http://192.168.29.137:3001/visitor.html?session=VMS-1772644076592-CSH09ORC&token=b5674c86dedaff3c5f4dc759647b53c1723e77fe71fb58c2a656fc487a0e06f4', 'b5674c86dedaff3c5f4dc759647b53c1723e77fe71fb58c2a656fc487a0e06f4', '882fdf5535fc6c7ab5cd00e146c3b3e8c7217f0764876811baf5de7d880778d3', 'ACTIVE', '2026-03-04 23:07:56', 'sec-user-111', '2026-03-04 22:37:56'),
('session-1772686763388-8lort81mx', 'VMS-1772686763388-4Y3YXY0Y', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772686763388-4Y3YXY0Y&token=aef97e70052e37dd0ad844f8808f4b29f79177fda0bac7a9c05afb92a57a29ce', 'aef97e70052e37dd0ad844f8808f4b29f79177fda0bac7a9c05afb92a57a29ce', '346439cbb4fea698f5712d1dafa0f4f44b1cab8ae91a3b59a83cca3face3b172', 'DESTROYED', '2026-03-05 10:59:23', 'sec-user-111', '2026-03-05 10:29:23'),
('session-1772691006740-61kcuol91', 'VMS-1772691006740-PHRISLEI', 'tmpl-admission', 'admission', 'http://10.188.88.199:3001/visitor.html?session=VMS-1772691006740-PHRISLEI&token=00730bfbbf7c735c81c1e5cf594c79ee27b516bb085937ad13a49d1cd34c2f8f', '00730bfbbf7c735c81c1e5cf594c79ee27b516bb085937ad13a49d1cd34c2f8f', '166fba0cb1101598138271ffaad7570e8c3c925adfd0a4c8f3060c13ea87db59', 'ACTIVE', '2026-03-05 12:10:06', 'sec-user-111', '2026-03-05 11:40:06'),
('session-1772691101800-px7441yli', 'VMS-1772691101801-E4M3C5AX', NULL, 'parent', 'http://10.188.88.199:3001/visitor.html?session=VMS-1772691101801-E4M3C5AX&token=6aaa9e9510470c5afd98744b2babc9aea670b071354605b753c921726cfa6e71', '6aaa9e9510470c5afd98744b2babc9aea670b071354605b753c921726cfa6e71', '68f1b36c8330365de83f12e175c0d96883429be23f1dc1d7f76692c790ac542b', 'ACTIVE', '2026-03-05 12:11:41', 'sec-user-111', '2026-03-05 11:41:41'),
('session-1772691102678-qgndzn7yz', 'VMS-1772691102678-9F3DS86H', 'tmpl-parent', 'parent', 'http://10.188.88.199:3001/visitor.html?session=VMS-1772691102678-9F3DS86H&token=8c3743a7a22be514707ceda9897dc78a2e130324b5d5af81964946b5a84932e4', '8c3743a7a22be514707ceda9897dc78a2e130324b5d5af81964946b5a84932e4', '4ed61365273616a966c2ff3de0a5bf113a62b58f64a57e20d2e11d0c1b948e2e', 'ACTIVE', '2026-03-05 12:11:42', 'sec-user-111', '2026-03-05 11:41:42'),
('session-1772692423418-ji4k0bzud', 'VMS-1772692423418-SU2EZ5A0', NULL, 'parent', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772692423418-SU2EZ5A0&token=9269d0d6911b0e667ba63b243d3d13340ecf2fcadd79462b705335c101c03c42', '9269d0d6911b0e667ba63b243d3d13340ecf2fcadd79462b705335c101c03c42', 'cd6254d11420fbad33bc4313a44d76803fa8b330588ae0d0eb90f8cfe9adbf55', 'ACTIVE', '2026-03-05 12:33:43', 'sec-user-111', '2026-03-05 12:03:43'),
('session-1772694872992-wf4axrb2a', 'VMS-1772694872992-E240URJH', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772694872992-E240URJH&token=139b6a8f69f7b0cba998a7afa2f1927c11a72d445f0fa0ba9bc69938d8bcaf10', '139b6a8f69f7b0cba998a7afa2f1927c11a72d445f0fa0ba9bc69938d8bcaf10', '14de0790b038aa64a440260234720246db1657cb71b4d44bb6c06021c4416caa', 'ACTIVE', '2026-03-05 13:14:33', 'sec-user-111', '2026-03-05 12:44:33'),
('session-1772694873119-cakv3fg4v', 'VMS-1772694873119-L58LG95W', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772694873119-L58LG95W&token=6565c7abbc4cbba11611265d24f8808e021fd0eb103f3e714cf82f3b0187e290', '6565c7abbc4cbba11611265d24f8808e021fd0eb103f3e714cf82f3b0187e290', '8e101dc9853fb22b814e8ba234f4f70a56f95c2304efc4220671a79b91dc5ade', 'ACTIVE', '2026-03-05 13:14:33', 'sec-user-111', '2026-03-05 12:44:33'),
('session-1772694873264-r0gbv3nmg', 'VMS-1772694873264-717ZMBKM', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772694873264-717ZMBKM&token=0c8cbb7c0e3a388be72b5a88ac9c7a1f71ad119fb44bbbccffcc6b8097ad7013', '0c8cbb7c0e3a388be72b5a88ac9c7a1f71ad119fb44bbbccffcc6b8097ad7013', '7dc97f70bfdff55edfe30c5db90be8b3a0dfa5f93a4c130da02531546bcfee45', 'ACTIVE', '2026-03-05 13:14:33', 'sec-user-111', '2026-03-05 12:44:33'),
('session-1772694873490-yv4gnkwir', 'VMS-1772694873490-ZDJY1EFG', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772694873490-ZDJY1EFG&token=7a732feb7aa83413dc6826feecff6cdefa9a549b5f647c575af99a7d56ef4b55', '7a732feb7aa83413dc6826feecff6cdefa9a549b5f647c575af99a7d56ef4b55', '6b210c8e66bd184f2cd1a01ee8d1924942a95a6eb28a61ee43fd0a76aec6ce29', 'ACTIVE', '2026-03-05 13:14:33', 'sec-user-111', '2026-03-05 12:44:33'),
('session-1772695506961-bx6q0ut9q', 'VMS-1772695506962-169MII20', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772695506962-169MII20&token=4c716b8d82ce3626b98f7a91670cbf9b50ef25b5f40734a9d141f8685cb02095', '4c716b8d82ce3626b98f7a91670cbf9b50ef25b5f40734a9d141f8685cb02095', '85e4ba842fdbfcd23e879695abf3f59fe1a777bf48f4a788dab7feb00317674b', 'ACTIVE', '2026-03-05 13:25:06', 'sec-user-111', '2026-03-05 12:55:06'),
('session-1772695507552-9pz5sh446', 'VMS-1772695507552-2T2DLS2H', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772695507552-2T2DLS2H&token=b761eaaa1cca7b53bdb1ab310c1b0870c7f629eec1df0301e8a1519a38f6ab5d', 'b761eaaa1cca7b53bdb1ab310c1b0870c7f629eec1df0301e8a1519a38f6ab5d', '0516cb5519eb015e5fc8c54229d17f691df3b98666102b228530dc586e391cb5', 'ACTIVE', '2026-03-05 13:25:07', 'sec-user-111', '2026-03-05 12:55:07'),
('session-1772695526494-ugebjou84', 'VMS-1772695526494-78Y58AG6', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772695526494-78Y58AG6&token=aef138f5c0a988fa0f2e81bd0c2c96ad8fe1d57b0a70b8d379d8512564da1967', 'aef138f5c0a988fa0f2e81bd0c2c96ad8fe1d57b0a70b8d379d8512564da1967', 'bd3084661483aa35f5d5f161307626e87db4d04476fc2c5b110b82bb9ca2142e', 'ACTIVE', '2026-03-05 13:25:26', 'sec-user-111', '2026-03-05 12:55:26'),
('session-1772695526961-poxuvuxcd', 'VMS-1772695526961-OQ4652XD', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772695526961-OQ4652XD&token=e4a07beb67b921b71e7cbdfa7be318b820dc57eb1ee716a968d6ed3ab8abfe84', 'e4a07beb67b921b71e7cbdfa7be318b820dc57eb1ee716a968d6ed3ab8abfe84', '480de0467e26d7adf4645d25e8c65f2f82ad3f9f35ed4e6d890b8fef85bd41ee', 'ACTIVE', '2026-03-05 13:25:26', 'sec-user-111', '2026-03-05 12:55:26'),
('session-1772695544718-e5re8am0z', 'VMS-1772695544718-POMTNTZS', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772695544718-POMTNTZS&token=fe13e242653e27870d1f0a9eb7327c537348c893d9b66569c87b1078303da2c5', 'fe13e242653e27870d1f0a9eb7327c537348c893d9b66569c87b1078303da2c5', '8a3ab01cbe93370891beaf11d930c15587f99ca77752e7adb61f1828de0dbcd5', 'ACTIVE', '2026-03-05 13:25:44', 'sec-user-111', '2026-03-05 12:55:44'),
('session-1772695545078-u1hr1zj5w', 'VMS-1772695545078-QDJKY04G', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772695545078-QDJKY04G&token=f52544fc015cfb92591960e7c35be8d30d6c7121a479e493906b99b5e0e03926', 'f52544fc015cfb92591960e7c35be8d30d6c7121a479e493906b99b5e0e03926', '5debba2757f927c618a792cae1d32fc467baf88160433c1d0ea57ea503f2a653', 'ACTIVE', '2026-03-05 13:25:45', 'sec-user-111', '2026-03-05 12:55:45'),
('session-1772695545357-r99z3izyx', 'VMS-1772695545357-E52VK6JW', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772695545357-E52VK6JW&token=d25bee3b46bf7347e46916a74d54b4718b680864b27ca5fd3d829f28d13bf75a', 'd25bee3b46bf7347e46916a74d54b4718b680864b27ca5fd3d829f28d13bf75a', 'a04a15b1e713da8cc347ac6a5a622ef87e037b1ca161ad961c983fa4f1b798ee', 'ACTIVE', '2026-03-05 13:25:45', 'sec-user-111', '2026-03-05 12:55:45'),
('session-1772695545618-67a8osak3', 'VMS-1772695545618-SWM8LRFI', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772695545618-SWM8LRFI&token=3f04e31a855a9dd25aa1127bcb9759028e3e95e6f84bc505ca77b2d27ec06d69', '3f04e31a855a9dd25aa1127bcb9759028e3e95e6f84bc505ca77b2d27ec06d69', '0b16ac48f0344b7e330b955212cc5b4f96a1e1b720daf4f45167d17b2b46ea97', 'ACTIVE', '2026-03-05 13:25:45', 'sec-user-111', '2026-03-05 12:55:45'),
('session-1772695545930-dpvs0t590', 'VMS-1772695545930-SI4DZPBR', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772695545930-SI4DZPBR&token=1a233f9a38f70d3d54d35cd2c4c5c7501908497f1cb79709184c2e42dcece736', '1a233f9a38f70d3d54d35cd2c4c5c7501908497f1cb79709184c2e42dcece736', '5fd472265020cdb83844bf0b395d6bb13e008f1f1511bc7c682ab6c72ae14d3d', 'ACTIVE', '2026-03-05 13:25:45', 'sec-user-111', '2026-03-05 12:55:45'),
('session-1772695546191-c4dknui5v', 'VMS-1772695546191-AXGTI7BW', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772695546191-AXGTI7BW&token=6dfcbec30e16cb61745218477eac2a5ebed1d2b1dff6c9e7741001254cdf00ee', '6dfcbec30e16cb61745218477eac2a5ebed1d2b1dff6c9e7741001254cdf00ee', '1547014ebfbc7c9ccc68ef4dea20ab1a787c64397093027a20b3858e62cf65c9', 'ACTIVE', '2026-03-05 13:25:46', 'sec-user-111', '2026-03-05 12:55:46'),
('session-1772695999821-axo5b2214', 'VMS-1772695999821-RNW4VM9L', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772695999821-RNW4VM9L&token=708687b1327afc6fd006bc0e2dcf68aeb6bad76ff25e657a9f382c2edf7dc263', '708687b1327afc6fd006bc0e2dcf68aeb6bad76ff25e657a9f382c2edf7dc263', '308d05c892d737900462e023206be8608f4a9613c5f2512117823ac53edb6d30', 'USED', '2026-03-05 13:33:19', 'sec-user-111', '2026-03-05 13:03:19'),
('session-1772703361743-tdtwfp466', 'VMS-1772703361743-3Z5WOVBJ', 'tmpl-admission', 'admission', 'http://10.180.99.199:3001/visitor.html?session=VMS-1772703361743-3Z5WOVBJ&token=44410aceb34a0dd6efea2426b82b2192eac848329e12549410722fdd8a3701d1', '44410aceb34a0dd6efea2426b82b2192eac848329e12549410722fdd8a3701d1', 'e8214d6db38312d5e69523f2c59b99192303f3437c15d3c29be0ac8c4d5c076d', 'ACTIVE', '2026-03-05 15:36:01', 'sec-user-111', '2026-03-05 15:06:01'),
('session-1772704697596-5msn68n2x', 'VMS-1772704697596-VZWP8HX9', 'tmpl-admission', 'admission', 'http://192.168.11.135:3001/visitor.html?session=VMS-1772704697596-VZWP8HX9&token=0bfe130b56a584bb7234f4b3c39a0eedeefa47ee067a1888fcfcce0f1e4587f1', '0bfe130b56a584bb7234f4b3c39a0eedeefa47ee067a1888fcfcce0f1e4587f1', '409ac228530a483126f52e50b4806c9d51c4567c84d7d8d513cb971a1ecd4cef', 'ACTIVE', '2026-03-05 15:58:17', 'sec-user-111', '2026-03-05 15:28:17'),
('session-1772704705315-fc2hwln9i', 'VMS-1772704705315-G6HTNBFB', NULL, 'parent', 'http://192.168.11.135:3001/visitor.html?session=VMS-1772704705315-G6HTNBFB&token=448d3c25c04de992d4a51869768e41077fa4670b142cb1a01fc00541ca010b47', '448d3c25c04de992d4a51869768e41077fa4670b142cb1a01fc00541ca010b47', '31e0edd45b91d8a78f61fe1e4f17e792ac09cd515620fa204794124777af8b64', 'ACTIVE', '2026-03-05 15:58:25', 'sec-user-111', '2026-03-05 15:28:25'),
('session-1772704749787-e0eezt110', 'VMS-1772704749787-W4UMZQPJ', 'tmpl-admission', 'admission', 'http://192.168.11.135:3001/visitor.html?session=VMS-1772704749787-W4UMZQPJ&token=cf4c7dd0a36b134a02373ea56d3723d25bdce52726c94a12c4a63323dbc59f6b', 'cf4c7dd0a36b134a02373ea56d3723d25bdce52726c94a12c4a63323dbc59f6b', 'c0e691b4666d39e00d70672b6b10459bbf385a4000d9c0d83b9a786952ecd05a', 'ACTIVE', '2026-03-05 15:59:09', 'sec-user-111', '2026-03-05 15:29:09'),
('session-1772704750848-0j82ejvr2', 'VMS-1772704750848-XHKOMODZ', 'tmpl-admission', 'admission', 'http://192.168.11.135:3001/visitor.html?session=VMS-1772704750848-XHKOMODZ&token=2ce84ec5314b2dd3ecd43f9d8ef07f77d7e41c9d2a88c4e73adbe529c164e984', '2ce84ec5314b2dd3ecd43f9d8ef07f77d7e41c9d2a88c4e73adbe529c164e984', '52e53af43dc9b86ec92a56b89ad94517109ae54dcf24d7257adeaabf9a2b33bc', 'ACTIVE', '2026-03-05 15:59:10', 'sec-user-111', '2026-03-05 15:29:10'),
('session-1772704751991-kzfgbrjtt', 'VMS-1772704751991-46N6VQ3Z', 'tmpl-admission', 'admission', 'http://192.168.11.135:3001/visitor.html?session=VMS-1772704751991-46N6VQ3Z&token=0b4696ef75bbfdad850d68a05cf695de411e57db2b3b0b3588dfc7027a8115f4', '0b4696ef75bbfdad850d68a05cf695de411e57db2b3b0b3588dfc7027a8115f4', '29cea1c3bb680d8ab191dafb6dee8fbda8fe73d0fe0f3445b231c7c69880add1', 'ACTIVE', '2026-03-05 15:59:11', 'sec-user-111', '2026-03-05 15:29:11'),
('session-1772704752221-58farfe5e', 'VMS-1772704752221-WJR0R7G9', 'tmpl-admission', 'admission', 'http://192.168.11.135:3001/visitor.html?session=VMS-1772704752221-WJR0R7G9&token=307450aa93b2238f0e894333499b09788f70072d4ce3398e6238db23276a424d', '307450aa93b2238f0e894333499b09788f70072d4ce3398e6238db23276a424d', '90a4e9a17be31577cb0c743fc048d72806f760a55ff1186212d791be2da315b0', 'USED', '2026-03-05 15:59:12', 'sec-user-111', '2026-03-05 15:29:12'),
('session-1772706425719-ztmpy0x43', 'VMS-1772706425719-EVRYHUVW', 'tmpl-admission', 'admission', 'http://10.180.99.199:3001/visitor.html?session=VMS-1772706425719-EVRYHUVW&token=95c588812b430de7feecadd9e83d84392d34c9162409b8c06c920a30ec5ba13d', '95c588812b430de7feecadd9e83d84392d34c9162409b8c06c920a30ec5ba13d', '4e718bbd1e30785b85a2075e0545e75afb0d4acc09c95de9126ee45ca20af699', 'USED', '2026-03-05 16:27:05', 'sec-user-111', '2026-03-05 15:57:05'),
('session-1772789165571-08v4pdc3p', 'VMS-1772789165571-CY4E4A24', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1772789165571-CY4E4A24&token=145f8e6638a7559dc00c35b110c76b9671a59ec66c614b3490cd4686b62e6d7c', '145f8e6638a7559dc00c35b110c76b9671a59ec66c614b3490cd4686b62e6d7c', '03f460d3ec73a27f4cd04656583a2ee4778a4a82458fa04d87a6e384ffce8cf1', 'ACTIVE', '2026-03-06 15:26:05', 'sec-user-111', '2026-03-06 14:56:05'),
('session-1773124155115-j4dvbxdpl', 'VMS-1773124155115-P90XGNZQ', 'tmpl-admission', 'admission', 'http://192.168.10.137:3001/visitor.html?session=VMS-1773124155115-P90XGNZQ&token=7fb3d521a20a0d42e7f9447a23b400bd4d4762964f4f8c27efbea4a979a1c770', '7fb3d521a20a0d42e7f9447a23b400bd4d4762964f4f8c27efbea4a979a1c770', '8c2c89aea10a95f90d416c8aeb96eb63c7a44c590d8229ddb9869fffcdc61c50', 'ACTIVE', '2026-03-10 12:29:15', 'sec-user-111', '2026-03-10 11:59:15'),
('session-1773124200691-7iz9wf0vl', 'VMS-1773124200691-6N0TPVLS', 'tmpl-admission', 'admission', 'http://10.254.191.199:3001/visitor.html?session=VMS-1773124200691-6N0TPVLS&token=90e1f5ff460d7170f6c8c408e8dfcbba1b44ef78f3ab55ce1a86a04b8a2199d3', '90e1f5ff460d7170f6c8c408e8dfcbba1b44ef78f3ab55ce1a86a04b8a2199d3', 'd79285ca74eefdcde20cf49261ed13a45835ebbb728a4d7601ea1e069978b6ed', 'ACTIVE', '2026-03-10 12:30:00', 'sec-user-111', '2026-03-10 12:00:00'),
('session-1773124221287-8ic5eu1xk', 'VMS-1773124221287-27P7X7IZ', 'tmpl-parent', 'parent', 'http://10.254.191.199:3001/visitor.html?session=VMS-1773124221287-27P7X7IZ&token=69bbc0641c62fa5da25ac3b0c8f3ddd8156cf884793e41c4bba8173dc0389086', '69bbc0641c62fa5da25ac3b0c8f3ddd8156cf884793e41c4bba8173dc0389086', 'd5300b06a78ff40c8b0f5c8751112175f4e3fdd2366dae89c83ae72d1514fc0d', 'ACTIVE', '2026-03-10 12:30:21', 'sec-user-111', '2026-03-10 12:00:21'),
('session-1773128027184-1mc8ld02y', 'VMS-1773128027184-OF6Y4L8B', 'tmpl-parent', 'parent', 'http://192.168.10.137:3001/visitor.html?session=VMS-1773128027184-OF6Y4L8B&token=8958ce980d02d03dc5662695be7ae400cc7571c0f8018d01bd30176bf5335d2a', '8958ce980d02d03dc5662695be7ae400cc7571c0f8018d01bd30176bf5335d2a', '9c9ce1c678d9786ca1730bef85fbfc27ad93d669e295fd7972ac8c4de25e6c0e', 'ACTIVE', '2026-03-10 13:33:47', 'sec-user-111', '2026-03-10 13:03:47');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `blacklist`
--
ALTER TABLE `blacklist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- Indexes for table `checkins`
--
ALTER TABLE `checkins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `visitor_request_id` (`visitor_request_id`),
  ADD KEY `session_id` (`session_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `qr_token` (`qr_token`);

--
-- Indexes for table `event_checkins`
--
ALTER TABLE `event_checkins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `registration_id` (`registration_id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `event_registrations`
--
ALTER TABLE `event_registrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pass_token` (`pass_token`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `form_templates`
--
ALTER TABLE `form_templates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `staff_id` (`staff_id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `visitor_requests`
--
ALTER TABLE `visitor_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `visitor_sessions`
--
ALTER TABLE `visitor_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_code` (`session_code`),
  ADD UNIQUE KEY `qr_token` (`qr_token`),
  ADD KEY `template_id` (`template_id`),
  ADD KEY `generated_by` (`generated_by`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `checkins`
--
ALTER TABLE `checkins`
  ADD CONSTRAINT `checkins_ibfk_1` FOREIGN KEY (`visitor_request_id`) REFERENCES `visitor_requests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `checkins_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `visitor_sessions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `event_checkins`
--
ALTER TABLE `event_checkins`
  ADD CONSTRAINT `event_checkins_ibfk_1` FOREIGN KEY (`registration_id`) REFERENCES `event_registrations` (`id`),
  ADD CONSTRAINT `event_checkins_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`);

--
-- Constraints for table `event_registrations`
--
ALTER TABLE `event_registrations`
  ADD CONSTRAINT `event_registrations_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `visitor_requests`
--
ALTER TABLE `visitor_requests`
  ADD CONSTRAINT `visitor_requests_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `visitor_sessions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `visitor_requests_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `visitor_requests_ibfk_3` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `visitor_requests_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `visitor_sessions`
--
ALTER TABLE `visitor_sessions`
  ADD CONSTRAINT `visitor_sessions_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `form_templates` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `visitor_sessions_ibfk_2` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
