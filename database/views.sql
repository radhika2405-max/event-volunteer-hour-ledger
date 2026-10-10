-- ============================================================================
-- SQL VIEWS FOR EVENT VOLUNTEER HOUR LEDGER
-- Ensures non-inflated joins, modular aggregation, and authoritative reporting.
-- ============================================================================

USE event_volunteer_ledger;

-- ----------------------------------------------------------------------------
-- 1. vw_student_approved_hours
-- Aggregates verified hours and event counts per student.
-- Only approved/corrected verified entries count toward approved totals.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_student_approved_hours AS
SELECT 
    s.student_id,
    s.user_id,
    s.university_registration_number,
    u.full_name AS student_name,
    u.email AS student_email,
    s.programme,
    s.academic_year,
    s.section,
    s.status AS student_status,
    COALESCE(SUM(CASE WHEN vhe.submission_status IN ('approved', 'corrected') THEN vhe.verified_minutes ELSE 0 END), 0) AS total_approved_minutes,
    ROUND(COALESCE(SUM(CASE WHEN vhe.submission_status IN ('approved', 'corrected') THEN vhe.verified_minutes ELSE 0 END), 0) / 60.0, 2) AS total_approved_hours,
    COALESCE(SUM(CASE WHEN vhe.submission_status = 'pending' THEN vhe.claimed_minutes ELSE 0 END), 0) AS total_pending_minutes,
    ROUND(COALESCE(SUM(CASE WHEN vhe.submission_status = 'pending' THEN vhe.claimed_minutes ELSE 0 END), 0) / 60.0, 2) AS total_pending_hours,
    COALESCE(SUM(CASE WHEN vhe.submission_status = 'rejected' THEN vhe.claimed_minutes ELSE 0 END), 0) AS total_rejected_minutes,
    ROUND(COALESCE(SUM(CASE WHEN vhe.submission_status = 'rejected' THEN vhe.claimed_minutes ELSE 0 END), 0) / 60.0, 2) AS total_rejected_hours,
    COUNT(DISTINCT CASE WHEN vhe.submission_status IN ('approved', 'corrected') THEN ev.event_id ELSE NULL END) AS approved_events_count,
    COUNT(DISTINCT ev.event_id) AS total_events_registered
FROM students s
INNER JOIN users u ON s.user_id = u.user_id
LEFT JOIN event_volunteers ev ON s.student_id = ev.student_id
LEFT JOIN volunteer_hour_entries vhe ON ev.participation_id = vhe.participation_id
GROUP BY 
    s.student_id, s.user_id, s.university_registration_number,
    u.full_name, u.email, s.programme, s.academic_year, s.section, s.status;

-- ----------------------------------------------------------------------------
-- 2. vw_certificate_eligibility
-- Compares student approved hours against the active default/global policy.
-- Clearly separates eligibility from actual issuance.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_certificate_eligibility AS
SELECT 
    s.student_id,
    s.university_registration_number,
    u.full_name AS student_name,
    s.programme,
    s.academic_year,
    cp.policy_id,
    cp.policy_name,
    cp.minimum_approved_minutes AS threshold_minutes,
    ROUND(cp.minimum_approved_minutes / 60.0, 2) AS threshold_hours,
    sah.total_approved_minutes,
    sah.total_approved_hours,
    sah.total_pending_hours,
    sah.approved_events_count,
    GREATEST(0, ROUND((cp.minimum_approved_minutes - sah.total_approved_minutes) / 60.0, 2)) AS remaining_hours,
    CASE 
        WHEN c.certificate_status = 'issued' THEN 'Certificate Issued'
        WHEN c.certificate_status = 'revoked' THEN 'Certificate Revoked'
        WHEN sah.total_approved_minutes >= cp.minimum_approved_minutes THEN 'Eligible - Awaiting Certificate Approval'
        WHEN (sah.total_approved_minutes + sah.total_pending_minutes) >= cp.minimum_approved_minutes THEN 'Pending Hours Review'
        ELSE 'Not Eligible'
    END AS eligibility_state,
    c.certificate_number,
    c.certificate_status,
    c.issued_at AS certificate_issued_at,
    c.verification_token
FROM students s
INNER JOIN users u ON s.user_id = u.user_id
JOIN certificate_policies cp ON cp.status = 'active' AND cp.scope_type = 'all_events'
LEFT JOIN vw_student_approved_hours sah ON s.student_id = sah.student_id
LEFT JOIN (
    -- Latest certificate per student for this policy
    SELECT c1.*
    FROM certificates c1
    INNER JOIN (
        SELECT student_id, policy_id, MAX(certificate_id) AS max_cert_id
        FROM certificates
        GROUP BY student_id, policy_id
    ) latest ON c1.certificate_id = latest.max_cert_id
) c ON s.student_id = c.student_id AND cp.policy_id = c.policy_id;

-- ----------------------------------------------------------------------------
-- 3. vw_event_volunteer_summary
-- Summarizes registered volunteers, approved hours, and pending entries per event.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_event_volunteer_summary AS
SELECT 
    e.event_id,
    e.event_name,
    e.event_code,
    e.venue,
    e.start_datetime,
    e.end_datetime,
    e.event_status,
    COUNT(DISTINCT ev.student_id) AS total_registered_volunteers,
    COALESCE(SUM(CASE WHEN vhe.submission_status IN ('approved', 'corrected') THEN vhe.verified_minutes ELSE 0 END), 0) AS total_approved_minutes,
    ROUND(COALESCE(SUM(CASE WHEN vhe.submission_status IN ('approved', 'corrected') THEN vhe.verified_minutes ELSE 0 END), 0) / 60.0, 2) AS total_approved_hours,
    COUNT(CASE WHEN vhe.submission_status = 'pending' THEN 1 ELSE NULL END) AS pending_submissions_count,
    COUNT(CASE WHEN vhe.submission_status IN ('approved', 'corrected') THEN 1 ELSE NULL END) AS approved_submissions_count
FROM events e
LEFT JOIN event_volunteers ev ON e.event_id = ev.event_id
LEFT JOIN volunteer_hour_entries vhe ON ev.participation_id = vhe.participation_id
GROUP BY 
    e.event_id, e.event_name, e.event_code, e.venue,
    e.start_datetime, e.end_datetime, e.event_status;

-- ----------------------------------------------------------------------------
-- 4. vw_club_volunteer_summary
-- Summarizes participation and hours at parent and sub-club levels.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_club_volunteer_summary AS
SELECT 
    c.club_id,
    c.club_name,
    parent.club_name AS parent_club_name,
    c.status AS club_status,
    COUNT(DISTINCT ev.event_id) AS events_count,
    COUNT(DISTINCT ev.student_id) AS distinct_volunteers_count,
    COALESCE(SUM(CASE WHEN vhe.submission_status IN ('approved', 'corrected') THEN vhe.verified_minutes ELSE 0 END), 0) AS total_approved_minutes,
    ROUND(COALESCE(SUM(CASE WHEN vhe.submission_status IN ('approved', 'corrected') THEN vhe.verified_minutes ELSE 0 END), 0) / 60.0, 2) AS total_approved_hours
FROM clubs c
LEFT JOIN clubs parent ON c.parent_club_id = parent.club_id
LEFT JOIN event_volunteers ev ON c.club_id = ev.assigned_club_id
LEFT JOIN volunteer_hour_entries vhe ON ev.participation_id = vhe.participation_id
GROUP BY 
    c.club_id, c.club_name, parent.club_name, c.status;

-- ----------------------------------------------------------------------------
-- 5. vw_pending_hour_approvals
-- Detailed queue of unreviewed volunteer hour submissions.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_pending_hour_approvals AS
SELECT 
    vhe.hour_entry_id,
    vhe.participation_id,
    e.event_id,
    e.event_name,
    e.event_code,
    c.club_name AS assigned_club_name,
    s.student_id,
    s.university_registration_number,
    u_stu.full_name AS student_name,
    s.programme,
    vhe.work_date,
    vhe.start_time,
    vhe.end_time,
    vhe.break_minutes,
    vhe.claimed_minutes,
    ROUND(vhe.claimed_minutes / 60.0, 2) AS claimed_hours,
    vhe.submission_status,
    u_sub.full_name AS submitted_by_name,
    vhe.created_at AS submitted_at
FROM volunteer_hour_entries vhe
INNER JOIN event_volunteers ev ON vhe.participation_id = ev.participation_id
INNER JOIN events e ON ev.event_id = e.event_id
LEFT JOIN clubs c ON ev.assigned_club_id = c.club_id
INNER JOIN students s ON ev.student_id = s.student_id
INNER JOIN users u_stu ON s.user_id = u_stu.user_id
INNER JOIN users u_sub ON vhe.submitted_by = u_sub.user_id
WHERE vhe.submission_status = 'pending';
