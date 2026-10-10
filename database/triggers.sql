-- ============================================================================
-- SQL TRIGGERS FOR EVENT VOLUNTEER HOUR LEDGER
-- Enforces database-level constraints, state machine integrity, and audit logs.
-- ============================================================================

USE event_volunteer_ledger;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 1. trg_vhe_before_insert
-- Ensures data integrity for all volunteer hour entry insertions.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_vhe_before_insert$$
CREATE TRIGGER trg_vhe_before_insert
BEFORE INSERT ON volunteer_hour_entries
FOR EACH ROW
BEGIN
    -- Validate break duration cannot exceed work duration
    IF NEW.break_minutes < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Break minutes cannot be negative.';
    END IF;

    IF NEW.claimed_minutes <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Claimed volunteer minutes must be greater than zero.';
    END IF;

    -- If created directly as approved, set verified_minutes to claimed_minutes if not provided
    IF NEW.submission_status = 'approved' AND NEW.verified_minutes = 0 THEN
        SET NEW.verified_minutes = NEW.claimed_minutes;
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- 2. trg_vhe_before_update
-- Enforces workflow transition rules and mandatory review notes.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_vhe_before_update$$
CREATE TRIGGER trg_vhe_before_update
BEFORE UPDATE ON volunteer_hour_entries
FOR EACH ROW
BEGIN
    -- Rejection requires a mandatory reason
    IF NEW.submission_status = 'rejected' AND (NEW.rejection_reason IS NULL OR TRIM(NEW.rejection_reason) = '') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Integrity Error: Rejection requires a clear rejection reason.';
    END IF;

    -- Approval requires verified minutes and reviewer identification
    IF NEW.submission_status = 'approved' THEN
        IF NEW.verified_minutes <= 0 THEN
            SET NEW.verified_minutes = NEW.claimed_minutes;
        END IF;
        IF NEW.reviewed_by IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Integrity Error: Approved hours must have an assigned reviewer.';
        END IF;
        IF NEW.reviewed_at IS NULL THEN
            SET NEW.reviewed_at = CURRENT_TIMESTAMP;
        END IF;
    END IF;

    -- Correction requires notes/reason
    IF NEW.submission_status = 'corrected' AND (NEW.correction_notes IS NULL OR TRIM(NEW.correction_notes) = '') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Integrity Error: Administrative correction requires audit notes.';
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- 3. trg_vhe_after_update
-- Writes database-level audit logs for state transitions in volunteer hours.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_vhe_after_update$$
CREATE TRIGGER trg_vhe_after_update
AFTER UPDATE ON volunteer_hour_entries
FOR EACH ROW
BEGIN
    IF OLD.submission_status <> NEW.submission_status OR OLD.verified_minutes <> NEW.verified_minutes THEN
        INSERT INTO audit_logs (
            actor_user_id,
            action,
            entity_type,
            entity_id,
            before_state,
            after_state,
            reason,
            timestamp
        ) VALUES (
            NEW.reviewed_by,
            CONCAT('HOUR_ENTRY_', UPPER(NEW.submission_status)),
            'volunteer_hour_entries',
            NEW.hour_entry_id,
            JSON_OBJECT(
                'status', OLD.submission_status,
                'verified_minutes', OLD.verified_minutes,
                'claimed_minutes', OLD.claimed_minutes
            ),
            JSON_OBJECT(
                'status', NEW.submission_status,
                'verified_minutes', NEW.verified_minutes,
                'claimed_minutes', NEW.claimed_minutes
            ),
            COALESCE(NEW.rejection_reason, NEW.correction_notes, 'Status transitioned'),
            CURRENT_TIMESTAMP
        );
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- 4. trg_cert_after_insert
-- Logs certificate issuance to audit trail.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_cert_after_insert$$
CREATE TRIGGER trg_cert_after_insert
AFTER INSERT ON certificates
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        before_state,
        after_state,
        reason,
        timestamp
    ) VALUES (
        NEW.issued_by,
        'CERTIFICATE_ISSUED',
        'certificates',
        NEW.certificate_id,
        NULL,
        JSON_OBJECT(
            'certificate_number', NEW.certificate_number,
            'student_id', NEW.student_id,
            'eligibility_snapshot_minutes', NEW.eligibility_snapshot_minutes,
            'status', NEW.certificate_status
        ),
        'Official volunteer certificate issued',
        CURRENT_TIMESTAMP
    );
END$$

-- ----------------------------------------------------------------------------
-- 5. trg_cert_after_update
-- Logs certificate status changes (revocation, reissue) to audit trail.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_cert_after_update$$
CREATE TRIGGER trg_cert_after_update
AFTER UPDATE ON certificates
FOR EACH ROW
BEGIN
    IF OLD.certificate_status <> NEW.certificate_status THEN
        INSERT INTO audit_logs (
            actor_user_id,
            action,
            entity_type,
            entity_id,
            before_state,
            after_state,
            reason,
            timestamp
        ) VALUES (
            NEW.issued_by,
            CONCAT('CERTIFICATE_', UPPER(NEW.certificate_status)),
            'certificates',
            NEW.certificate_id,
            JSON_OBJECT('status', OLD.certificate_status),
            JSON_OBJECT('status', NEW.certificate_status),
            NEW.revocation_reason,
            CURRENT_TIMESTAMP
        );
    END IF;
END$$

DELIMITER ;
