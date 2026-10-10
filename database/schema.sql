-- ============================================================================
-- EVENT VOLUNTEER HOUR LEDGER — COMPLETE RELATIONAL SCHEMA
-- Institution: CHRIST (Deemed to be University), Delhi NCR Campus
-- School: School of Sciences | Parent Club: AADIKALA
-- Target Database: MySQL 8.x
-- ============================================================================

CREATE DATABASE IF NOT EXISTS event_volunteer_ledger
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE event_volunteer_ledger;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE (Authentication & Role-Based Access Control)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'coordinator', 'club_lead', 'approver', 'volunteer') NOT NULL,
    account_status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. STUDENTS TABLE (Institutional Identity & Academic Profile)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    university_registration_number VARCHAR(50) NOT NULL UNIQUE,
    programme VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    section VARCHAR(10) NULL,
    contact_email VARCHAR(150) NULL,
    status ENUM('active', 'graduated', 'inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_students_reg_no (university_registration_number),
    INDEX idx_students_academic (academic_year, programme)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. CLUBS TABLE (Hierarchical Club Structure: AADIKALA & Sub-clubs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clubs (
    club_id INT AUTO_INCREMENT PRIMARY KEY,
    club_name VARCHAR(100) NOT NULL UNIQUE,
    parent_club_id INT NULL,
    description TEXT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clubs_parent FOREIGN KEY (parent_club_id) 
        REFERENCES clubs(club_id) ON DELETE RESTRICT,
    INDEX idx_clubs_parent (parent_club_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. EVENTS TABLE (Campus Events)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(150) NOT NULL,
    event_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    venue VARCHAR(150) NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    event_status ENUM('draft', 'published', 'completed', 'archived') NOT NULL DEFAULT 'published',
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_creator FOREIGN KEY (created_by) 
        REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT chk_event_dates CHECK (end_datetime > start_datetime),
    INDEX idx_events_code (event_code),
    INDEX idx_events_dates (start_datetime, end_datetime),
    INDEX idx_events_status (event_status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. EVENT_SUBCLUBS TABLE (Many-to-Many: Events & Sub-clubs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_subclubs (
    event_id INT NOT NULL,
    club_id INT NOT NULL,
    PRIMARY KEY (event_id, club_id),
    CONSTRAINT fk_es_event FOREIGN KEY (event_id) 
        REFERENCES events(event_id) ON DELETE CASCADE,
    CONSTRAINT fk_es_club FOREIGN KEY (club_id) 
        REFERENCES clubs(club_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. EVENT_VOLUNTEERS TABLE (Volunteer Registrations per Event)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_volunteers (
    participation_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    student_id INT NOT NULL,
    assigned_club_id INT NULL,
    assigned_role VARCHAR(100) NOT NULL DEFAULT 'Volunteer',
    registration_status ENUM('registered', 'attended', 'cancelled') NOT NULL DEFAULT 'registered',
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ev_event FOREIGN KEY (event_id) 
        REFERENCES events(event_id) ON DELETE CASCADE,
    CONSTRAINT fk_ev_student FOREIGN KEY (student_id) 
        REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_ev_club FOREIGN KEY (assigned_club_id) 
        REFERENCES clubs(club_id) ON DELETE SET NULL,
    CONSTRAINT uq_event_student UNIQUE (event_id, student_id),
    INDEX idx_ev_student (student_id),
    INDEX idx_ev_event (event_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. VOLUNTEER_HOUR_ENTRIES TABLE (Authoritative Ledger Entries)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS volunteer_hour_entries (
    hour_entry_id INT AUTO_INCREMENT PRIMARY KEY,
    participation_id INT NOT NULL,
    work_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT NOT NULL DEFAULT 0,
    claimed_minutes INT NOT NULL,
    verified_minutes INT NOT NULL DEFAULT 0,
    submission_status ENUM('pending', 'approved', 'rejected', 'corrected') NOT NULL DEFAULT 'pending',
    submitted_by INT NOT NULL,
    reviewed_by INT NULL,
    reviewed_at DATETIME NULL,
    rejection_reason TEXT NULL,
    correction_notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vhe_participation FOREIGN KEY (participation_id) 
        REFERENCES event_volunteers(participation_id) ON DELETE CASCADE,
    CONSTRAINT fk_vhe_submitter FOREIGN KEY (submitted_by) 
        REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_vhe_reviewer FOREIGN KEY (reviewed_by) 
        REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT chk_break_minutes CHECK (break_minutes >= 0),
    CONSTRAINT chk_claimed_minutes CHECK (claimed_minutes > 0),
    CONSTRAINT chk_verified_minutes CHECK (verified_minutes >= 0),
    INDEX idx_vhe_participation_status (participation_id, submission_status),
    INDEX idx_vhe_work_date (work_date),
    INDEX idx_vhe_status (submission_status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. CERTIFICATE_POLICIES TABLE (Configurable Threshold Policies)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificate_policies (
    policy_id INT AUTO_INCREMENT PRIMARY KEY,
    policy_name VARCHAR(150) NOT NULL,
    minimum_approved_minutes INT NOT NULL DEFAULT 1200, -- Default: 20 hours
    scope_type ENUM('all_events', 'event', 'club') NOT NULL DEFAULT 'all_events',
    applicable_event_id INT NULL,
    applicable_club_id INT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE NULL,
    requires_faculty_approval BOOLEAN NOT NULL DEFAULT TRUE,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cp_creator FOREIGN KEY (created_by) 
        REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_cp_event FOREIGN KEY (applicable_event_id) 
        REFERENCES events(event_id) ON DELETE CASCADE,
    CONSTRAINT fk_cp_club FOREIGN KEY (applicable_club_id) 
        REFERENCES clubs(club_id) ON DELETE CASCADE,
    CONSTRAINT chk_min_minutes CHECK (minimum_approved_minutes > 0),
    INDEX idx_cp_status (status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 9. CERTIFICATES TABLE (Issued & Revoked Certificates)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
    certificate_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    policy_id INT NOT NULL,
    certificate_number VARCHAR(100) NOT NULL UNIQUE,
    eligibility_snapshot_minutes INT NOT NULL,
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    issued_by INT NOT NULL,
    certificate_status ENUM('issued', 'revoked', 'reissued') NOT NULL DEFAULT 'issued',
    revocation_reason TEXT NULL,
    verification_token VARCHAR(64) NOT NULL UNIQUE,
    pdf_path VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cert_student FOREIGN KEY (student_id) 
        REFERENCES students(student_id) ON DELETE RESTRICT,
    CONSTRAINT fk_cert_policy FOREIGN KEY (policy_id) 
        REFERENCES certificate_policies(policy_id) ON DELETE RESTRICT,
    CONSTRAINT fk_cert_issuer FOREIGN KEY (issued_by) 
        REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_cert_student (student_id),
    INDEX idx_cert_token (verification_token),
    INDEX idx_cert_status (certificate_status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 10. AUDIT_LOGS TABLE (Security & Modification Audit Trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    actor_user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT NOT NULL,
    before_state JSON NULL,
    after_state JSON NULL,
    reason TEXT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_id VARCHAR(100) NULL,
    CONSTRAINT fk_audit_user FOREIGN KEY (actor_user_id) 
        REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_actor (actor_user_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 11. SUPPORTING TABLES: Coordinators & Club Leads Assignments, Notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_coordinator_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eca_event FOREIGN KEY (event_id) 
        REFERENCES events(event_id) ON DELETE CASCADE,
    CONSTRAINT fk_eca_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT uq_event_coordinator UNIQUE (event_id, user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS club_lead_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cla_club FOREIGN KEY (club_id) 
        REFERENCES clubs(club_id) ON DELETE CASCADE,
    CONSTRAINT fk_cla_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT uq_club_lead UNIQUE (club_id, user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_notif_user_read (user_id, is_read)
) ENGINE=InnoDB;
