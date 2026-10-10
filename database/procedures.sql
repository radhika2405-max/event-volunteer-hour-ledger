-- ============================================================================
-- STORED PROCEDURES FOR EVENT VOLUNTEER HOUR LEDGER
-- Implements encapsulated business routines, transactional checks, and reports.
-- ============================================================================

USE event_volunteer_ledger;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 1. sp_calculate_student_hours
-- Calculates approved, pending, rejected minutes and distinct events for a student.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_calculate_student_hours$$
CREATE PROCEDURE sp_calculate_student_hours(
    IN p_student_id INT,
    OUT p_approved_minutes INT,
    OUT p_pending_minutes INT,
    OUT p_rejected_minutes INT,
    OUT p_events_count INT
)
BEGIN
    SELECT 
        COALESCE(SUM(CASE WHEN vhe.submission_status IN ('approved', 'corrected') THEN vhe.verified_minutes ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN vhe.submission_status = 'pending' THEN vhe.claimed_minutes ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN vhe.submission_status = 'rejected' THEN vhe.claimed_minutes ELSE 0 END), 0),
        COUNT(DISTINCT CASE WHEN vhe.submission_status IN ('approved', 'corrected') THEN ev.event_id ELSE NULL END)
    INTO 
        p_approved_minutes,
        p_pending_minutes,
        p_rejected_minutes,
        p_events_count
    FROM event_volunteers ev
    LEFT JOIN volunteer_hour_entries vhe ON ev.participation_id = vhe.participation_id
    WHERE ev.student_id = p_student_id;
END$$

-- ----------------------------------------------------------------------------
-- 2. sp_refresh_certificate_eligibility
-- Evaluates and returns students who cross the threshold for an active policy.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_refresh_certificate_eligibility$$
CREATE PROCEDURE sp_refresh_certificate_eligibility(
    IN p_policy_id INT
)
BEGIN
    DECLARE v_min_minutes INT;
    
    SELECT minimum_approved_minutes INTO v_min_minutes 
    FROM certificate_policies 
    WHERE policy_id = p_policy_id;

    SELECT 
        s.student_id,
        s.university_registration_number,
        u.full_name AS student_name,
        s.programme,
        s.academic_year,
        COALESCE(SUM(vhe.verified_minutes), 0) AS total_approved_minutes,
        ROUND(COALESCE(SUM(vhe.verified_minutes), 0) / 60.0, 2) AS total_approved_hours,
        v_min_minutes AS required_threshold_minutes,
        ROUND(v_min_minutes / 60.0, 2) AS required_threshold_hours,
        CASE 
            WHEN COALESCE(SUM(vhe.verified_minutes), 0) >= v_min_minutes THEN 'ELIGIBLE'
            ELSE 'NOT_ELIGIBLE'
        END AS eligibility_result
    FROM students s
    INNER JOIN users u ON s.user_id = u.user_id
    LEFT JOIN event_volunteers ev ON s.student_id = ev.student_id
    LEFT JOIN volunteer_hour_entries vhe ON ev.participation_id = vhe.participation_id 
        AND vhe.submission_status IN ('approved', 'corrected')
    GROUP BY s.student_id, s.university_registration_number, u.full_name, s.programme, s.academic_year
    ORDER BY total_approved_minutes DESC;
END$$

-- ----------------------------------------------------------------------------
-- 3. sp_generate_eligibility_report
-- Filterable reporting routine for academic verification and audit.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_generate_eligibility_report$$
CREATE PROCEDURE sp_generate_eligibility_report(
    IN p_academic_year VARCHAR(20),
    IN p_programme VARCHAR(100),
    IN p_min_hours DECIMAL(5,2),
    IN p_status_filter VARCHAR(50)
)
BEGIN
    SELECT 
        ce.student_id,
        ce.university_registration_number,
        ce.student_name,
        ce.programme,
        ce.academic_year,
        ce.policy_name,
        ce.threshold_hours,
        ce.total_approved_hours,
        ce.total_pending_hours,
        ce.approved_events_count,
        ce.remaining_hours,
        ce.eligibility_state,
        ce.certificate_number,
        ce.certificate_status,
        ce.certificate_issued_at
    FROM vw_certificate_eligibility ce
    WHERE (p_academic_year IS NULL OR p_academic_year = '' OR ce.academic_year = p_academic_year)
      AND (p_programme IS NULL OR p_programme = '' OR ce.programme = p_programme)
      AND (p_min_hours IS NULL OR ce.total_approved_hours >= p_min_hours)
      AND (p_status_filter IS NULL OR p_status_filter = '' OR ce.eligibility_state = p_status_filter)
    ORDER BY ce.total_approved_hours DESC, ce.student_name ASC;
END$$

-- ----------------------------------------------------------------------------
-- 4. sp_issue_certificate
-- Atomically checks eligibility within a transaction, creates certificate,
-- generates token, and returns the certificate number.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_issue_certificate$$
CREATE PROCEDURE sp_issue_certificate(
    IN p_student_id INT,
    IN p_policy_id INT,
    IN p_issued_by INT,
    OUT p_status_code VARCHAR(20),
    OUT p_out_cert_id INT,
    OUT p_out_cert_number VARCHAR(100)
)
proc_label: BEGIN
    DECLARE v_approved_minutes INT DEFAULT 0;
    DECLARE v_min_minutes INT DEFAULT 0;
    DECLARE v_existing_active_cert INT DEFAULT 0;
    DECLARE v_cert_num VARCHAR(100);
    DECLARE v_token VARCHAR(64);
    DECLARE v_random_part VARCHAR(16);

    -- Exit on error handler with rollback
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_code = 'ERROR';
        SET p_out_cert_id = NULL;
        SET p_out_cert_number = NULL;
    END;

    START TRANSACTION;

    -- Check policy
    SELECT minimum_approved_minutes INTO v_min_minutes
    FROM certificate_policies
    WHERE policy_id = p_policy_id AND status = 'active'
    FOR SHARE;

    IF v_min_minutes IS NULL THEN
        ROLLBACK;
        SET p_status_code = 'POLICY_NOT_FOUND';
        LEAVE proc_label;
    END IF;

    -- Calculate verified hours
    SELECT COALESCE(SUM(vhe.verified_minutes), 0) INTO v_approved_minutes
    FROM event_volunteers ev
    JOIN volunteer_hour_entries vhe ON ev.participation_id = vhe.participation_id
    WHERE ev.student_id = p_student_id AND vhe.submission_status IN ('approved', 'corrected')
    FOR UPDATE;

    -- Verify threshold
    IF v_approved_minutes < v_min_minutes THEN
        ROLLBACK;
        SET p_status_code = 'INELIGIBLE';
        LEAVE proc_label;
    END IF;

    -- Check if active certificate already exists
    SELECT COUNT(*) INTO v_existing_active_cert
    FROM certificates
    WHERE student_id = p_student_id AND policy_id = p_policy_id AND certificate_status = 'issued';

    IF v_existing_active_cert > 0 THEN
        ROLLBACK;
        SET p_status_code = 'ALREADY_ISSUED';
        LEAVE proc_label;
    END IF;

    -- Generate Unique Certificate Number & Token
    SET v_cert_num = CONCAT('CHRIST/AADIKALA/2026/', LPAD(p_student_id, 4, '0'), '-', LPAD(FLOOR(RAND() * 9000 + 1000), 4, '0'));
    SET v_token = SHA2(CONCAT(v_cert_num, NOW(), RAND()), 256);

    -- Insert Certificate
    INSERT INTO certificates (
        student_id,
        policy_id,
        certificate_number,
        eligibility_snapshot_minutes,
        issued_at,
        issued_by,
        certificate_status,
        verification_token
    ) VALUES (
        p_student_id,
        p_policy_id,
        v_cert_num,
        v_approved_minutes,
        NOW(),
        p_issued_by,
        'issued',
        v_token
    );

    SET p_out_cert_id = LAST_INSERT_ID();
    SET p_out_cert_number = v_cert_num;
    SET p_status_code = 'SUCCESS';

    COMMIT;
END$$

DELIMITER ;
