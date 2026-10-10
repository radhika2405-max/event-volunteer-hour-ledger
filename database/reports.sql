-- ============================================================================
-- ANALYTICAL QUERIES & DBMS CONCEPTS DEMONSTRATION: reports.sql
-- Academic project demonstration for CHRIST (Deemed to be University)
-- ============================================================================

USE event_volunteer_ledger;

-- ----------------------------------------------------------------------------
-- 1. IDENTIFY STUDENTS WHO MEET OR EXCEED THE CONFIGURED THRESHOLD (>= 20 Hours)
-- Demonstrates: INNER JOIN, LEFT JOIN, SUM with CASE, GROUP BY, HAVING, subquery
-- ----------------------------------------------------------------------------
-- Business rationale: Identifies candidates immediately eligible for official
-- Certificate of Volunteer Contribution.
SELECT 
    s.university_registration_number,
    u.full_name AS student_name,
    s.programme,
    s.academic_year,
    ROUND(SUM(vhe.verified_minutes) / 60.0, 2) AS approved_hours,
    COUNT(DISTINCT ev.event_id) AS events_attended
FROM students s
INNER JOIN users u ON s.user_id = u.user_id
INNER JOIN event_volunteers ev ON s.student_id = ev.student_id
INNER JOIN volunteer_hour_entries vhe ON ev.participation_id = vhe.participation_id
WHERE vhe.submission_status IN ('approved', 'corrected')
GROUP BY s.student_id, s.university_registration_number, u.full_name, s.programme, s.academic_year
HAVING SUM(vhe.verified_minutes) >= (
    SELECT minimum_approved_minutes 
    FROM certificate_policies 
    WHERE scope_type = 'all_events' AND status = 'active' 
    LIMIT 1
)
ORDER BY approved_hours DESC;

-- ----------------------------------------------------------------------------
-- 2. IDENTIFY STUDENTS CLOSE TO ELIGIBILITY (Within 5 Hours of Threshold: 15-19.99 Hrs)
-- Demonstrates: Subqueries, HAVING with BETWEEN, mathematical transformations
-- ----------------------------------------------------------------------------
-- Business rationale: Enables faculty and coordinators to encourage volunteers
-- nearing certificate milestones to participate in upcoming events.
SELECT 
    s.university_registration_number,
    u.full_name AS student_name,
    s.programme,
    ROUND(SUM(vhe.verified_minutes) / 60.0, 2) AS approved_hours,
    ROUND((cp.minimum_approved_minutes - SUM(vhe.verified_minutes)) / 60.0, 2) AS hours_needed_to_reach_threshold,
    COUNT(DISTINCT ev.event_id) AS events_attended
FROM students s
INNER JOIN users u ON s.user_id = u.user_id
INNER JOIN event_volunteers ev ON s.student_id = ev.student_id
INNER JOIN volunteer_hour_entries vhe ON ev.participation_id = vhe.participation_id
CROSS JOIN (
    SELECT minimum_approved_minutes 
    FROM certificate_policies 
    WHERE scope_type = 'all_events' AND status = 'active' 
    LIMIT 1
) cp
WHERE vhe.submission_status IN ('approved', 'corrected')
GROUP BY s.student_id, s.university_registration_number, u.full_name, s.programme, cp.minimum_approved_minutes
HAVING SUM(vhe.verified_minutes) < cp.minimum_approved_minutes 
   AND SUM(vhe.verified_minutes) >= (cp.minimum_approved_minutes - 300) -- within 5 hours (300 mins)
ORDER BY hours_needed_to_reach_threshold ASC;

-- ----------------------------------------------------------------------------
-- 3. EVENT-WISE APPROVED VOLUNTEER HOURS WITHOUT DOUBLE COUNTING
-- Demonstrates: LEFT JOIN, DISTINCT student count, conditional SUM
-- ----------------------------------------------------------------------------
-- Business rationale: Multiple sub-clubs may collaborate in one event.
-- This query computes exact aggregate verified labor per event without inflation.
SELECT 
    e.event_id,
    e.event_code,
    e.event_name,
    e.venue,
    COUNT(DISTINCT ev.student_id) AS total_distinct_volunteers,
    COUNT(vhe.hour_entry_id) AS total_logged_sessions,
    ROUND(COALESCE(SUM(CASE WHEN vhe.submission_status IN ('approved', 'corrected') THEN vhe.verified_minutes ELSE 0 END), 0) / 60.0, 2) AS total_approved_hours,
    ROUND(COALESCE(SUM(CASE WHEN vhe.submission_status = 'pending' THEN vhe.claimed_minutes ELSE 0 END), 0) / 60.0, 2) AS pending_claimed_hours
FROM events e
LEFT JOIN event_volunteers ev ON e.event_id = ev.event_id
LEFT JOIN volunteer_hour_entries vhe ON ev.participation_id = vhe.participation_id
GROUP BY e.event_id, e.event_code, e.event_name, e.venue
ORDER BY total_approved_hours DESC;

-- ----------------------------------------------------------------------------
-- 4. SUB-CLUB-WISE CONTRIBUTION BREAKDOWN (PARENT AADIKALA & 6 SUB-CLUBS)
-- Demonstrates: Self-join on hierarchical clubs table, multi-table aggregation
-- ----------------------------------------------------------------------------
-- Business rationale: Measures engagement and labor across Dance, Emcee,
-- Technical, Creative, Music, and Hospitality sub-clubs under parent AADIKALA.
SELECT 
    c.club_id,
    c.club_name AS sub_club,
    COALESCE(p.club_name, 'PARENT ORG') AS parent_organization,
    COUNT(DISTINCT ev.student_id) AS active_volunteers_count,
    COUNT(DISTINCT ev.event_id) AS events_supported,
    ROUND(COALESCE(SUM(CASE WHEN vhe.submission_status IN ('approved', 'corrected') THEN vhe.verified_minutes ELSE 0 END), 0) / 60.0, 2) AS verified_hours_contributed
FROM clubs c
LEFT JOIN clubs p ON c.parent_club_id = p.club_id
LEFT JOIN event_volunteers ev ON c.club_id = ev.assigned_club_id
LEFT JOIN volunteer_hour_entries vhe ON ev.participation_id = vhe.participation_id
WHERE c.parent_club_id IS NOT NULL -- focus on the 6 sub-clubs
GROUP BY c.club_id, c.club_name, p.club_name
ORDER BY verified_hours_contributed DESC;

-- ----------------------------------------------------------------------------
-- 5. PENDING SUBMISSIONS IMPACT SIMULATION
-- Demonstrates: Conditional aggregation comparing current vs projected eligibility
-- ----------------------------------------------------------------------------
-- Business rationale: Shows which students will immediately become eligible if
-- their pending timesheets are approved by faculty.
SELECT 
    s.university_registration_number,
    u.full_name AS student_name,
    ROUND(COALESCE(SUM(CASE WHEN vhe.submission_status IN ('approved', 'corrected') THEN vhe.verified_minutes ELSE 0 END), 0) / 60.0, 2) AS current_approved_hours,
    ROUND(COALESCE(SUM(CASE WHEN vhe.submission_status = 'pending' THEN vhe.claimed_minutes ELSE 0 END), 0) / 60.0, 2) AS pending_hours,
    ROUND(COALESCE(SUM(CASE WHEN vhe.submission_status IN ('approved', 'corrected', 'pending') THEN 
        CASE WHEN vhe.submission_status = 'pending' THEN vhe.claimed_minutes ELSE vhe.verified_minutes END 
    ELSE 0 END), 0) / 60.0, 2) AS projected_total_hours,
    CASE 
        WHEN COALESCE(SUM(CASE WHEN vhe.submission_status IN ('approved', 'corrected') THEN vhe.verified_minutes ELSE 0 END), 0) >= 1200 
            THEN 'Already Eligible'
        WHEN COALESCE(SUM(CASE WHEN vhe.submission_status IN ('approved', 'corrected', 'pending') THEN 
            CASE WHEN vhe.submission_status = 'pending' THEN vhe.claimed_minutes ELSE vhe.verified_minutes END 
        ELSE 0 END), 0) >= 1200 
            THEN 'Will Become Eligible If Pending Approved'
        ELSE 'Ineligible'
    END AS projection_status
FROM students s
INNER JOIN users u ON s.user_id = u.user_id
INNER JOIN event_volunteers ev ON s.student_id = ev.student_id
INNER JOIN volunteer_hour_entries vhe ON ev.participation_id = vhe.participation_id
GROUP BY s.student_id, s.university_registration_number, u.full_name
HAVING pending_hours > 0
ORDER BY projected_total_hours DESC;

-- ----------------------------------------------------------------------------
-- 6. CERTIFICATE LIFECYCLE AUDIT REPORT
-- Demonstrates: Join between issued certificates, students, users, and audit trail
-- ----------------------------------------------------------------------------
-- Business rationale: Ensures regulatory compliance and traceability for issued
-- or revoked certificates.
SELECT 
    c.certificate_number,
    s.university_registration_number,
    u.full_name AS student_name,
    cp.policy_name,
    c.certificate_status,
    c.eligibility_snapshot_minutes / 60.0 AS verified_hours_at_issuance,
    c.issued_at,
    issuer.full_name AS issued_by_name,
    c.revocation_reason,
    c.verification_token
FROM certificates c
INNER JOIN students s ON c.student_id = s.student_id
INNER JOIN users u ON s.user_id = u.user_id
INNER JOIN certificate_policies cp ON c.policy_id = cp.policy_id
INNER JOIN users issuer ON c.issued_by = issuer.user_id
ORDER BY c.issued_at DESC;
