-- VisitorGate MySQL Schema
-- Run: C:\xampp\mysql\bin\mysql.exe -u root visitorgate < schema.sql

CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    staff_id VARCHAR(64) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    phone VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    role ENUM('admin','security','staff') NOT NULL,
    department_id VARCHAR(64),
    designation VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    availability_status VARCHAR(20) DEFAULT 'available',
    notification_preferences JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Add columns if the table already existed from an older schema version (MariaDB/MySQL 10.0+)
ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_id VARCHAR(64) UNIQUE AFTER id;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) AFTER email;


CREATE TABLE IF NOT EXISTS form_templates (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    fields JSON NOT NULL,
    is_default TINYINT(1) DEFAULT 0,
    created_by VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS visitor_sessions (
    id VARCHAR(64) PRIMARY KEY,
    session_code VARCHAR(100) UNIQUE NOT NULL,
    template_id VARCHAR(64),
    category VARCHAR(50),
    qr_code_url TEXT,
    qr_token VARCHAR(255) UNIQUE,
    qr_token_hash VARCHAR(128),
    status ENUM('ACTIVE','USED','EXPIRED','DESTROYED') DEFAULT 'ACTIVE',
    expires_at DATETIME,
    generated_by VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES form_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS visitor_requests (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64),
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20) NOT NULL,
    visitor_email VARCHAR(255),
    form_data JSON,
    department_id VARCHAR(64),
    staff_id VARCHAR(64),
    approval_status ENUM('PENDING','APPROVED','REJECTED','BUSY','CHECKED_IN','COMPLETED') DEFAULT 'PENDING',
    approved_by VARCHAR(64),
    approval_time DATETIME,
    rejection_reason TEXT,
    escalation_level INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES visitor_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS checkins (
    id VARCHAR(64) PRIMARY KEY,
    visitor_request_id VARCHAR(64),
    session_id VARCHAR(64),
    checkin_time DATETIME NOT NULL,
    checkout_time DATETIME,
    duration_minutes INT,
    gate_location VARCHAR(100),
    security_checkin_id VARCHAR(64),
    security_checkout_id VARCHAR(64),
    status ENUM('INSIDE','EXITED') DEFAULT 'INSIDE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visitor_request_id) REFERENCES visitor_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES visitor_sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    data JSON,
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id VARCHAR(64),
    details JSON,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ═══════ SEED DATA ═══════

INSERT IGNORE INTO departments (id, name, code, is_active) VALUES
('dept-admin', 'Administration', 'ADMIN', 1),
('dept-cse', 'Computer Science & Engineering', 'CSE', 1),
('dept-ece', 'Electronics & Communication', 'ECE', 1),
('dept-mech', 'Mechanical Engineering', 'MECH', 1);

-- Use ON DUPLICATE KEY UPDATE to ensure password_hash is always populated
INSERT INTO users (id, staff_id, email, password_hash, phone, name, role, department_id, designation, is_active, availability_status) VALUES
('admin-user-111', NULL, 'admin@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543210', 'System Admin', 'admin', 'dept-admin', 'Administrator', 1, 'available'),
('sec-user-111', NULL, 'security@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543211', 'Head Security', 'security', 'dept-admin', 'Chief Security Officer', 1, 'available'),

-- CSE Department (10 Staff)
('staff-cse-001', 'VG-CSE-001', 'cse1@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543001', 'Dr. Aruna Singh', 'staff', 'dept-cse', 'HOD & Professor', 1, 'available'),
('staff-cse-002', 'VG-CSE-002', 'cse2@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543002', 'Mr. Babu Rao', 'staff', 'dept-cse', 'Assistant Professor', 1, 'busy'),
('staff-cse-003', 'VG-CSE-003', 'cse3@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543003', 'Ms. Chitra M.', 'staff', 'dept-cse', 'Assistant Professor', 1, 'available'),
('staff-cse-004', 'VG-CSE-004', 'cse4@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543004', 'Dr. Deepak J.', 'staff', 'dept-cse', 'Associate Professor', 1, 'available'),
('staff-cse-005', 'VG-CSE-005', 'cse5@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543005', 'Ms. Esha Gupta', 'staff', 'dept-cse', 'Assistant Professor', 1, 'away'),
('staff-cse-006', 'VG-CSE-006', 'cse6@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543006', 'Mr. Farhan K.', 'staff', 'dept-cse', 'Assistant Professor', 1, 'available'),
('staff-cse-007', 'VG-CSE-007', 'cse7@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543007', 'Ms. Gauri S.', 'staff', 'dept-cse', 'Assistant Professor', 1, 'available'),
('staff-cse-008', 'VG-CSE-008', 'cse8@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543008', 'Mr. Himanshu', 'staff', 'dept-cse', 'Assistant Professor', 1, 'available'),
('staff-cse-009', 'VG-CSE-009', 'cse9@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543009', 'Ms. Ishani P.', 'staff', 'dept-cse', 'Assistant Professor', 1, 'busy'),
('staff-cse-010', 'VG-CSE-010', 'cse10@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876543010', 'Mr. Jitendra', 'staff', 'dept-cse', 'Assistant Professor', 1, 'available'),

-- ECE Department (10 Staff)
('staff-ece-001', 'VG-ECE-001', 'ece1@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544001', 'Dr. Kavita D.', 'staff', 'dept-ece', 'HOD & Professor', 1, 'available'),
('staff-ece-002', 'VG-ECE-002', 'ece2@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544002', 'Mr. Lokesh N.', 'staff', 'dept-ece', 'Assistant Professor', 1, 'available'),
('staff-ece-003', 'VG-ECE-003', 'ece3@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544003', 'Ms. Meena R.', 'staff', 'dept-ece', 'Assistant Professor', 1, 'available'),
('staff-ece-004', 'VG-ECE-004', 'ece4@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544004', 'Mr. Naveen S.', 'staff', 'dept-ece', 'Assistant Professor', 1, 'busy'),
('staff-ece-005', 'VG-ECE-005', 'ece5@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544005', 'Ms. Omila K.', 'staff', 'dept-ece', 'Assistant Professor', 1, 'available'),
('staff-ece-006', 'VG-ECE-006', 'ece6@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544006', 'Mr. Pranav V.', 'staff', 'dept-ece', 'Assistant Professor', 1, 'available'),
('staff-ece-007', 'VG-ECE-007', 'ece7@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544007', 'Ms. Qausar J.', 'staff', 'dept-ece', 'Assistant Professor', 1, 'available'),
('staff-ece-008', 'VG-ECE-008', 'ece8@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544008', 'Mr. Rahul M.', 'staff', 'dept-ece', 'Assistant Professor', 1, 'available'),
('staff-ece-009', 'VG-ECE-009', 'ece9@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544009', 'Ms. Swati L.', 'staff', 'dept-ece', 'Assistant Professor', 1, 'available'),
('staff-ece-010', 'VG-ECE-010', 'ece10@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876544010', 'Mr. Tarun B.', 'staff', 'dept-ece', 'Assistant Professor', 1, 'available'),

-- MECH Department (10 Staff) 
('staff-mech-001', 'VG-MECH-001', 'mech1@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545001', 'Dr. Umesh P.', 'staff', 'dept-mech', 'HOD & Professor', 1, 'available'),
('staff-mech-002', 'VG-MECH-002', 'mech2@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545002', 'Mr. Vipin K.', 'staff', 'dept-mech', 'Assistant Professor', 1, 'available'),
('staff-mech-003', 'VG-MECH-003', 'mech3@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545003', 'Ms. Whitney F.', 'staff', 'dept-mech', 'Assistant Professor', 1, 'available'),
('staff-mech-004', 'VG-MECH-004', 'mech4@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545004', 'Mr. Xavier R.', 'staff', 'dept-mech', 'Assistant Professor', 1, 'available'),
('staff-mech-005', 'VG-MECH-005', 'mech5@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545005', 'Ms. Yamini V.', 'staff', 'dept-mech', 'Assistant Professor', 1, 'busy'),
('staff-mech-006', 'VG-MECH-006', 'mech6@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545006', 'Mr. Zaid H.', 'staff', 'dept-mech', 'Assistant Professor', 1, 'available'),
('staff-mech-007', 'VG-MECH-007', 'mech7@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545007', 'Dr. Aman G.', 'staff', 'dept-mech', 'Associate Professor', 1, 'available'),
('staff-mech-008', 'VG-MECH-008', 'mech8@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545008', 'Mr. Bharat N.', 'staff', 'dept-mech', 'Assistant Professor', 1, 'available'),
('staff-mech-009', 'VG-MECH-009', 'mech9@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545009', 'Ms. Charu D.', 'staff', 'dept-mech', 'Assistant Professor', 1, 'available'),
('staff-mech-010', 'VG-MECH-010', 'mech10@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876545010', 'Mr. Dhruv S.', 'staff', 'dept-mech', 'Assistant Professor', 1, 'available'),

-- Admin Department Staff
('staff-admin-001', 'VG-ADM-001', 'admin1@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876546001', 'Mr. Eshwar P.', 'staff', 'dept-admin', 'Registrar', 1, 'available'),
('staff-admin-002', 'VG-ADM-002', 'admin2@visitorgate.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+919876546002', 'Ms. Fatima Z.', 'staff', 'dept-admin', 'Admin Officer', 1, 'available')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name), role = VALUES(role), staff_id = VALUES(staff_id);

INSERT IGNORE INTO form_templates (id, name, category, description, fields, is_default) VALUES
('tmpl-parent', 'Parent Visitor Form', 'parent', 'For parents and guardians visiting students or staff',
 '[{"id":"name","type":"text","label":"Full Name","required":true,"placeholder":"Enter your full name"},{"id":"phone","type":"phone","label":"Phone Number","required":true,"placeholder":"+91 9876543210"},{"id":"department","type":"dropdown","label":"Department","required":true,"options_source":"departments"},{"id":"staff_id","type":"dropdown","label":"Person to Meet","required":true,"depends_on":"department","options_source":"users"},{"id":"purpose","type":"dropdown","label":"Purpose of Visit","required":true,"options":["Meet Staff","Student Related","Document Submission","Other"]}]',
 1),
('tmpl-admission', 'Admission Enquiry Form', 'admission', 'For prospective students seeking admission information',
 '[{"id":"name","type":"text","label":"Full Name","required":true},{"id":"phone","type":"phone","label":"Phone Number","required":true},{"id":"email","type":"email","label":"Email Address","required":false},{"id":"department","type":"dropdown","label":"Department","required":true,"options_source":"departments"},{"id":"staff_id","type":"dropdown","label":"Person to Meet","required":true,"options_source":"users"},{"id":"purpose","type":"dropdown","label":"Purpose","required":true,"options":["Admission Enquiry","Fee Details","Course Information","Campus Tour"]}]',
 0);
