-- ============================================================================
-- PERFORMANCE & INTEGRITY INDEXES FOR EVENT VOLUNTEER HOUR LEDGER
-- Justified indexing strategy to accelerate reports, joins, and lookup queries.
-- ============================================================================

USE event_volunteer_ledger;

DROP PROCEDURE IF EXISTS sp_add_index_if_not_exists;

DELIMITER $$
CREATE PROCEDURE sp_add_index_if_not_exists(
    IN p_table_name VARCHAR(64),
    IN p_index_name VARCHAR(64),
    IN p_columns_sql VARCHAR(255)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_exists
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = p_table_name
      AND index_name = p_index_name;
      
    IF v_exists = 0 THEN
        SET @sql_stmt = CONCAT('CREATE INDEX ', p_index_name, ' ON ', p_table_name, ' (', p_columns_sql, ');');
        PREPARE stmt FROM @sql_stmt;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

-- 1. Index on Student Registration Number, Programme, Year (lookup in verification & reports)
CALL sp_add_index_if_not_exists('students', 'idx_students_prog_year', 'programme, academic_year');

-- 2. Index on User Email and Role (accelerates login auth & RBAC filtering)
CALL sp_add_index_if_not_exists('users', 'idx_users_email_role', 'email, role');

-- 3. Index on Event Code & Status (used when browsing & associating sub-clubs)
CALL sp_add_index_if_not_exists('events', 'idx_events_code_status', 'event_code, event_status');

-- 4. Index on Event Volunteer Participation combinations
CALL sp_add_index_if_not_exists('event_volunteers', 'idx_ev_event_student', 'event_id, student_id');

-- 5. Composite Index on Hour Entries: Participation + Status (heavily used by SUM/GROUP BY views)
CALL sp_add_index_if_not_exists('volunteer_hour_entries', 'idx_vhe_part_status_verified', 'participation_id, submission_status, verified_minutes');

-- 6. Index on Work Date (accelerates date-range reporting and timesheet queries)
CALL sp_add_index_if_not_exists('volunteer_hour_entries', 'idx_vhe_workdate', 'work_date');

-- 7. Index on Certificate Number and Verification Token (public verification lookup speed)
CALL sp_add_index_if_not_exists('certificates', 'idx_cert_token_status', 'verification_token, certificate_status');

-- 8. Index on Audit Logs by Timestamp and Entity Type (accelerates admin audit log queries)
CALL sp_add_index_if_not_exists('audit_logs', 'idx_audit_time_entity', 'timestamp, entity_type');

DROP PROCEDURE IF EXISTS sp_add_index_if_not_exists;
