-- ============================================================================
-- DETERMINISTIC SEED DATA FOR EVENT VOLUNTEER HOUR LEDGER
-- CHRIST (Deemed to be University), Delhi NCR Campus | School of Sciences
-- Organization: AADIKALA & 6 Sub-clubs
-- ============================================================================

USE event_volunteer_ledger;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE certificates;
TRUNCATE TABLE volunteer_hour_entries;
TRUNCATE TABLE event_volunteers;
TRUNCATE TABLE event_subclubs;
TRUNCATE TABLE event_coordinator_assignments;
TRUNCATE TABLE club_lead_assignments;
TRUNCATE TABLE certificate_policies;
TRUNCATE TABLE events;
TRUNCATE TABLE clubs;
TRUNCATE TABLE students;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users (user_id, full_name, email, password_hash, role, account_status, created_at, updated_at) VALUES
(1, 'Prof. Dr. Rajesh Sharma', 'admin@christuniversity.in', 'scrypt:32768:8:1$hHOC7BX77DXlDKBa$9bbcc9de2e068b56b3bd03d131db0ada64a59cfd6b0dfb26c1684af89b6d06ea2118d69abf3b6cbe10f7de78eeb63bb3e3a9847cd8047a6a958e089fbe050712', 'admin', 'active', NOW(), NOW()),
(2, 'Priya Menon', 'coordinator@christuniversity.in', 'scrypt:32768:8:1$BdYfEbrQxPCwO0Fp$e6bcde739c59a0610ba7daaf059a2ac6f1db4beeaa7c75c2a51cac3c0578ee2c183f2634e6f2ab849fd089695a90babb1c9a6612e833b776f85e37e4b050377d', 'coordinator', 'active', NOW(), NOW()),
(3, 'Dr. Anita Desai', 'faculty@christuniversity.in', 'scrypt:32768:8:1$CUJsj2b8CFvigYXX$9b416a1b37b5f73376f9f69fe496a9a5e179ba04776bf5db72b645364e07333aff347abc5ab09c4ffdda073b69f872be5a87aeb9a02710c5ecd635dc6a43e944', 'approver', 'active', NOW(), NOW()),
(4, 'Kavita Sundaram', 'lead.tech@christuniversity.in', 'scrypt:32768:8:1$an6RLbWukxu7XyDD$22a16e79a99d12df4f5dd896caaddd0cd7db47ab7919dc4d6ada53d582fae95d7d7ccee9ba39507e5cdc17b6cee895a68a006117248f71cd1b3a4b4961810213', 'club_lead', 'active', NOW(), NOW()),
(5, 'Aarav Sharma', 'student.a@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(6, 'Bhavna Patel', 'student.b@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(7, 'Chirag Verma', 'student.c@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(8, 'Divya Nair', 'student.d@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(9, 'Eshan Gupta', 'student.e@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(10, 'Fatima Khan', 'student.f@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(11, 'Gaurav Joshi', 'gaurav.joshi@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(12, 'Harshita Rao', 'harshita.rao@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(13, 'Ishaan Sen', 'ishaan.sen@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(14, 'Janhavi Kulkarni', 'janhavi.k@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(15, 'Karan Malhotra', 'karan.m@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(16, 'Lavanya Pillai', 'lavanya.p@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(17, 'Manish Tiwari', 'manish.t@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(18, 'Neha Chawla', 'neha.c@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(19, 'Omkar Deshmukh', 'omkar.d@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(20, 'Pooja Hegde', 'pooja.h@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(21, 'Rohan Bhatt', 'rohan.b@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(22, 'Sneha Mukherjee', 'sneha.m@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(23, 'Tanmay Saxena', 'tanmay.s@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(24, 'Urvi Aggarwal', 'urvi.a@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(25, 'Varun Kapoor', 'varun.k@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW()),
(26, 'Zoya Farooqui', 'zoya.f@christuniversity.in', 'scrypt:32768:8:1$EFBea4RTfAY7NUYr$a929b5bd8ea7d30baf027cc469f231d876a1411ce9403a8dd1fd5380cc5013f9c087114a81cfe49d5783f2297b15855718e9f657dc0464f9a606a87451d68c11', 'volunteer', 'active', NOW(), NOW());

INSERT INTO students (student_id, user_id, university_registration_number, programme, academic_year, section, contact_email, status, created_at) VALUES
(1, 5, '2347101', 'B.Sc Data Science', '2025-2026', 'A', 'student.a@christuniversity.in', 'active', NOW()),
(2, 6, '2347102', 'BCA', '2025-2026', 'A', 'student.b@christuniversity.in', 'active', NOW()),
(3, 7, '2347103', 'B.Sc Data Science', '2025-2026', 'B', 'student.c@christuniversity.in', 'active', NOW()),
(4, 8, '2347104', 'B.Sc Computer Science', '2025-2026', 'A', 'student.d@christuniversity.in', 'active', NOW()),
(5, 9, '2347105', 'BCA', '2025-2026', 'B', 'student.e@christuniversity.in', 'active', NOW()),
(6, 10, '2347106', 'M.Sc Data Science', '2025-2026', 'A', 'student.f@christuniversity.in', 'active', NOW()),
(7, 11, '2347107', 'B.Sc Data Science', '2025-2026', 'A', 'gaurav.joshi@christuniversity.in', 'active', NOW()),
(8, 12, '2347108', 'BCA', '2025-2026', 'A', 'harshita.rao@christuniversity.in', 'active', NOW()),
(9, 13, '2347109', 'B.Sc Computer Science', '2025-2026', 'B', 'ishaan.sen@christuniversity.in', 'active', NOW()),
(10, 14, '2347110', 'B.Sc Data Science', '2025-2026', 'B', 'janhavi.k@christuniversity.in', 'active', NOW()),
(11, 15, '2347111', 'BCA', '2025-2026', 'A', 'karan.m@christuniversity.in', 'active', NOW()),
(12, 16, '2347112', 'M.Sc Computer Science', '2025-2026', 'A', 'lavanya.p@christuniversity.in', 'active', NOW()),
(13, 17, '2347113', 'B.Sc Data Science', '2025-2026', 'A', 'manish.t@christuniversity.in', 'active', NOW()),
(14, 18, '2347114', 'BCA', '2025-2026', 'B', 'neha.c@christuniversity.in', 'active', NOW()),
(15, 19, '2347115', 'B.Sc Computer Science', '2025-2026', 'A', 'omkar.d@christuniversity.in', 'active', NOW()),
(16, 20, '2347116', 'B.Sc Data Science', '2025-2026', 'B', 'pooja.h@christuniversity.in', 'active', NOW()),
(17, 21, '2347117', 'BCA', '2025-2026', 'A', 'rohan.b@christuniversity.in', 'active', NOW()),
(18, 22, '2347118', 'M.Sc Data Science', '2025-2026', 'A', 'sneha.m@christuniversity.in', 'active', NOW()),
(19, 23, '2347119', 'B.Sc Data Science', '2025-2026', 'A', 'tanmay.s@christuniversity.in', 'active', NOW()),
(20, 24, '2347120', 'BCA', '2025-2026', 'B', 'urvi.a@christuniversity.in', 'active', NOW()),
(21, 25, '2347121', 'B.Sc Computer Science', '2025-2026', 'B', 'varun.k@christuniversity.in', 'active', NOW()),
(22, 26, '2347122', 'B.Sc Data Science', '2025-2026', 'A', 'zoya.f@christuniversity.in', 'active', NOW());

INSERT INTO clubs (club_id, club_name, parent_club_id, description, status, created_at) VALUES
(1, 'AADIKALA', NULL, 'Official Umbrella Arts, Technology and Cultural Organization of School of Sciences', 'active', NOW()),
(2, 'Dance Sub-club', 1, 'Choreography, classical and western performance arts wing', 'active', NOW()),
(3, 'Emcee Sub-club', 1, 'Anchoring, public speaking, and stage hosting wing', 'active', NOW()),
(4, 'Technical Sub-club', 1, 'AV operations, technical staging, IT and digital media wing', 'active', NOW()),
(5, 'Creative Sub-club', 1, 'Stage decor, graphic design, craft and aesthetic curation wing', 'active', NOW()),
(6, 'Music Sub-club', 1, 'Instrumental, vocal harmonies and choir wing', 'active', NOW()),
(7, 'Hospitality Sub-club', 1, 'Guest reception, volunteer coordination, ushering and logistics wing', 'active', NOW());

INSERT INTO club_lead_assignments (club_id, user_id, assigned_at) VALUES (4, 4, NOW());

INSERT INTO events (event_id, event_name, event_code, description, venue, start_datetime, end_datetime, event_status, created_by, created_at, updated_at) VALUES
(1, 'SUNERGOS 2025', 'EVT-SUN-2025', 'Annual Inter-College Science & Innovation Fest organized by School of Sciences', 'Central Auditorium & Science Block', '2025-11-14 09:00:00', '2025-11-15 18:00:00', 'completed', 1, NOW(), NOW()),
(2, 'TGZ - Tech Genesis', 'EVT-TGZ-2025', 'Flagship National Technical Symposium featuring hackathons and symposium tracks', 'Computer Science Complex, Block B', '2025-12-02 09:30:00', '2025-12-03 17:30:00', 'completed', 2, NOW(), NOW()),
(3, 'Science Exhibition 2026', 'EVT-SCI-2026', 'Annual Science Exhibition showcasing research projects, IoT models, and tech demonstrations', 'Main Quadrangle', '2026-01-20 09:00:00', '2026-01-21 16:30:00', 'completed', 1, NOW(), NOW()),
(4, 'Department Farewell 2026', 'EVT-FAR-2026', 'Grand farewell celebration honoring graduating batches of School of Sciences', 'Campus Amphitheatre', '2026-02-10 14:00:00', '2026-02-10 20:00:00', 'completed', 2, NOW(), NOW()),
(5, 'Christmas Celebration 2025', 'EVT-XMAS-2025', 'University-wide winter festivity, choir performances, and community cheer', 'Christ Lawn & Stage 1', '2025-12-22 15:00:00', '2025-12-22 21:00:00', 'completed', 1, NOW(), NOW()),
(6, 'Gratitude Day 2026', 'EVT-GRAT-2026', 'Institutional appreciation day dedicated to support staff and community leaders', 'Mariam Hall', '2026-02-28 09:00:00', '2026-02-28 17:00:00', 'completed', 2, NOW(), NOW()),
(7, 'Family Day 2026', 'EVT-FAM-2026', 'Faculty, student and alumni family gathering with exhibition stalls and cultural shows', 'Sports Complex & Central Lawn', '2026-03-05 10:00:00', '2026-03-05 18:00:00', 'completed', 1, NOW(), NOW()),
(8, 'TARANG 2026', 'EVT-TRG-2026', 'Flagship Inter-Department Cultural Arts and Performing Arts Extravaganza', 'University Main Auditorium', '2026-03-20 09:00:00', '2026-03-22 20:00:00', 'published', 2, NOW(), NOW());

INSERT INTO event_coordinator_assignments (event_id, user_id, assigned_at) VALUES (1, 2, NOW()), (2, 2, NOW()), (3, 2, NOW()), (4, 2, NOW()), (5, 2, NOW()), (6, 2, NOW()), (7, 2, NOW()), (8, 2, NOW());

INSERT INTO event_subclubs (event_id, club_id) VALUES
(1, 4), (1, 5), (1, 7),
(2, 4), (2, 3),
(3, 4), (3, 5), (3, 7),
(4, 2), (4, 3), (4, 6), (4, 7),
(5, 6), (5, 5), (5, 7),
(6, 7), (6, 3), (6, 5),
(7, 5), (7, 7), (7, 2),
(8, 2), (8, 3), (8, 4), (8, 5), (8, 6), (8, 7);

INSERT INTO certificate_policies (policy_id, policy_name, minimum_approved_minutes, scope_type, applicable_event_id, applicable_club_id, effective_from, effective_until, requires_faculty_approval, status, created_by, created_at) VALUES
(1, 'All-Events Volunteer Honors Policy (20 Hours)', 1200, 'all_events', NULL, NULL, '2025-06-01', NULL, TRUE, 'active', 1, NOW()),
(2, 'Annual Technical Excellence Certificate (15 Hours)', 900, 'club', NULL, 4, '2025-06-01', NULL, TRUE, 'active', 1, NOW()),
(3, 'TARANG 2026 Special Volunteer Recognition (12 Hours)', 720, 'event', 8, NULL, '2026-01-01', NULL, TRUE, 'active', 1, NOW());

INSERT INTO event_volunteers (participation_id, event_id, student_id, assigned_club_id, assigned_role, registration_status, registered_at) VALUES
(1, 1, 1, 4, 'Tech Operations Lead', 'attended', NOW()),
(2, 2, 1, 4, 'Lab Coordinator', 'attended', NOW()),
(3, 8, 1, 4, 'Stage AV Assistant', 'attended', NOW()),
(4, 1, 2, 7, 'Head Usher', 'attended', NOW()),
(5, 3, 2, 7, 'Reception Desk Incharge', 'attended', NOW()),
(6, 5, 2, 7, 'Guest Liaison', 'attended', NOW()),
(7, 1, 3, 5, 'Stage Decor Coordinator', 'attended', NOW()),
(8, 2, 3, 5, 'Creative Booth Designer', 'attended', NOW()),
(9, 3, 3, 5, 'Exhibition Banner Curation', 'attended', NOW()),
(10, 6, 4, 7, 'Overall Operations Head', 'attended', NOW()),
(11, 1, 5, 3, 'Ceremony Emcee', 'attended', NOW()),
(12, 4, 5, 3, 'Farewell Host', 'attended', NOW()),
(13, 2, 6, 4, 'Data Track Volunteer', 'attended', NOW()),
(14, 7, 6, 4, 'Community Outreach Volunteer', 'attended', NOW()),
(15, 1, 7, 4, 'Network Support', 'attended', NOW()),
(16, 2, 8, 3, 'Stage Announcer', 'attended', NOW()),
(17, 1, 9, 6, 'Choir Vocalist', 'attended', NOW()),
(18, 3, 10, 5, 'Model Builder', 'attended', NOW()),
(19, 4, 11, 2, 'Dance Troupe Lead', 'attended', NOW()),
(20, 5, 12, 6, 'Guitarist', 'attended', NOW()),
(21, 6, 13, 7, 'VIP Hospitality', 'attended', NOW()),
(22, 7, 14, 5, 'Stage Decorator', 'attended', NOW()),
(23, 8, 15, 4, 'Lighting Assistant', 'attended', NOW()),
(24, 1, 16, 7, 'Registration Desk', 'attended', NOW()),
(25, 2, 17, 4, 'Coding Judge Assistant', 'attended', NOW()),
(26, 3, 18, 4, 'Hardware Lab Assistant', 'attended', NOW()),
(27, 4, 19, 3, 'Stage Moderator', 'attended', NOW()),
(28, 5, 20, 7, 'Refreshment Logistics', 'attended', NOW()),
(29, 6, 21, 5, 'Photography Assistant', 'attended', NOW()),
(30, 7, 22, 2, 'Flash Mob Performer', 'attended', NOW());

INSERT INTO volunteer_hour_entries (hour_entry_id, participation_id, work_date, start_time, end_time, break_minutes, claimed_minutes, verified_minutes, submission_status, submitted_by, reviewed_by, reviewed_at, rejection_reason, correction_notes, created_at, updated_at) VALUES
(1, 1, '2025-11-14', '09:00:00', '16:30:00', 30, 420, 420, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(2, 2, '2025-12-02', '09:30:00', '16:00:00', 30, 360, 360, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(3, 3, '2026-03-20', '10:00:00', '15:30:00', 30, 300, 300, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(4, 4, '2025-11-14', '09:00:00', '17:30:00', 30, 480, 480, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(5, 5, '2026-01-20', '09:00:00', '16:30:00', 30, 420, 420, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(6, 6, '2025-12-22', '15:00:00', '20:30:00', 30, 300, 300, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(7, 7, '2025-11-14', '08:00:00', '18:30:00', 30, 600, 600, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(8, 8, '2025-12-02', '09:00:00', '17:30:00', 30, 480, 480, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(9, 9, '2026-01-21', '10:00:00', '15:30:00', 30, 300, 0, 'pending', 2, NULL, NOW(), NULL, NULL, NOW(), NOW()),
(10, 10, '2026-02-27', '08:00:00', '20:30:00', 30, 720, 720, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(11, 10, '2026-02-28', '08:00:00', '20:30:00', 30, 720, 720, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(12, 11, '2025-11-14', '08:00:00', '20:30:00', 30, 720, 720, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(13, 12, '2026-02-10', '10:00:00', '20:30:00', 30, 600, 600, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(14, 13, '2025-12-02', '08:30:00', '19:00:00', 30, 600, 600, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(15, 14, '2026-03-05', '08:30:00', '19:00:00', 30, 600, 600, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(16, 15, '2025-11-14', '09:00:00', '17:00:00', 0, 480, 360, 'corrected', 2, 1, NOW(), NULL, 'Audited: Student took an unscheduled 2-hour offline break during afternoon session', NOW(), NOW()),
(17, 16, '2025-12-02', '10:00:00', '16:00:00', 0, 360, 0, 'rejected', 2, 3, NOW(), 'Absence reported during primary session by event faculty in-charge', NULL, NOW(), NOW()),
(18, 17, '2025-11-14', '10:00:00', '16:00:00', 30, 330, 330, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(19, 18, '2026-01-20', '09:00:00', '17:00:00', 60, 420, 420, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(20, 19, '2026-02-10', '14:00:00', '20:00:00', 30, 330, 330, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(21, 20, '2025-12-22', '15:00:00', '21:00:00', 30, 330, 330, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(22, 21, '2026-02-28', '09:00:00', '17:00:00', 60, 420, 420, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(23, 22, '2026-03-05', '10:00:00', '18:00:00', 60, 420, 420, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(24, 23, '2026-03-20', '10:00:00', '18:00:00', 60, 420, 0, 'pending', 2, NULL, NOW(), NULL, NULL, NOW(), NOW()),
(25, 24, '2025-11-15', '09:00:00', '16:00:00', 30, 390, 390, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(26, 25, '2025-12-03', '09:30:00', '16:30:00', 30, 390, 390, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(27, 26, '2026-01-21', '09:30:00', '16:30:00', 30, 390, 390, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(28, 27, '2026-02-10', '14:00:00', '19:30:00', 30, 300, 300, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(29, 28, '2025-12-22', '15:00:00', '20:30:00', 30, 300, 300, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(30, 29, '2026-02-28', '09:00:00', '16:00:00', 30, 390, 390, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW()),
(31, 30, '2026-03-05', '11:00:00', '16:00:00', 30, 270, 270, 'approved', 2, 3, NOW(), NULL, NULL, NOW(), NOW());

INSERT INTO certificates (certificate_id, student_id, policy_id, certificate_number, eligibility_snapshot_minutes, issued_at, issued_by, certificate_status, revocation_reason, verification_token, pdf_path, created_at) VALUES
(1, 5, 1, 'CHRIST/AADIKALA/2026/0005-7821', 1320, '2026-02-15 11:30:00', 3, 'issued', NULL, 'd3b07384d113edec49eaa6238ad5ff00b98e1a78', 'certificates/cert_0005.pdf', NOW()),
(2, 6, 1, 'CHRIST/AADIKALA/2026/0006-4412', 1200, '2026-03-01 10:00:00', 1, 'revoked', 'Internal audit revealed overlap with off-campus academic symposium attendance record.', 'c4ca4238a0b923820dcc509a6f75849b23820dcc', 'certificates/cert_0006.pdf', NOW());

INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, before_state, after_state, reason, timestamp, request_id) VALUES
(1, 'SYSTEM_INIT', 'system', 1, NULL, JSON_OBJECT('version', '1.0.0', 'school', 'School of Sciences'), 'System initialized with AADIKALA clubs & policies', NOW(), 'REQ-INIT-001'),
(3, 'HOUR_APPROVAL', 'volunteer_hour_entries', 1, JSON_OBJECT('status', 'pending'), JSON_OBJECT('status', 'approved', 'verified_minutes', 420), 'Verified by Faculty Approver for SUNERGOS', NOW(), 'REQ-APP-001'),
(3, 'CERTIFICATE_ISSUED', 'certificates', 1, NULL, JSON_OBJECT('student_id', 5, 'certificate_number', 'CHRIST/AADIKALA/2026/0005-7821', 'hours', 22.0), 'Honors Certificate issued to Eshan Gupta', NOW(), 'REQ-CERT-001'),
(1, 'CERTIFICATE_REVOKED', 'certificates', 2, JSON_OBJECT('status', 'issued'), JSON_OBJECT('status', 'revoked'), 'Revoked due to conflicting attendance audit', NOW(), 'REQ-REV-001');
