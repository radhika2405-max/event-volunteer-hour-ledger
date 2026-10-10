# ACADEMIC PROJECT REPORT
## EVENT VOLUNTEER HOUR LEDGER
### Volunteer Hours, Verification & Certificate Eligibility Management System

**Academic Year:** 2025–2026  
**Institution:** CHRIST (Deemed to be University), Delhi NCR Campus  
**Department:** School of Sciences  
**Parent Student Organization:** AADIKALA (Cultural, Technological and Performing Arts Wing)  

---

## 1. Title Page
- **Project Title:** Event Volunteer Hour Ledger — Volunteer Hours, Verification & Certificate Eligibility Management System
- **Candidate Details:** Academic DBMS Project Submission
- **Department:** School of Sciences, CHRIST (Deemed to be University), Delhi NCR Campus
- **Mentorship:** Academic DBMS Project Evaluation Committee

---

## 2. Certificate or Approval Page (Placeholders)
> **CERTIFICATE OF APPROVAL**  
> This is to certify that this project report entitled *"Event Volunteer Hour Ledger"* is a bona fide record of academic project work carried out under the School of Sciences, CHRIST (Deemed to be University), Delhi NCR Campus.  
>  
> __________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; __________________________  
> **Faculty Guide / Mentor** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Head of Department**  
> *(Academic Demonstration Placeholder)* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; *(School of Sciences)*

---

## 3. Acknowledgement
We express our gratitude to CHRIST (Deemed to be University), Delhi NCR Campus, the faculty of the School of Sciences, and the leadership of AADIKALA for providing the domain requirements and academic guidance to develop this Database Management System.

---

## 4. Abstract
The **Event Volunteer Hour Ledger** is a relational database management application developed to track student service contributions across campus events, calculate verified cumulative hours, and automatically determine eligibility for official university volunteer certificates. Traditional paper timesheets or unnormalized spreadsheets often result in inconsistent records, lost updates, and duplicate certificate issuances. By modeling hours as an immutable relational ledger in MySQL 8.0 normalized to 3NF, the system guarantees ACID transactions, multi-club event association without join inflation, role-based access control, cryptographic verification tokens, and instant export of official eligibility reports.

---

## 5. Introduction
Campus life at CHRIST University thrives on student leadership across academic symposia, cultural festivals, and community outreach. AADIKALA oversees six specialized sub-clubs: Dance, Emcee, Technical, Creative, Music, and Hospitality. Coordinating volunteers across events like SUNERGOS, TGZ, and TARANG requires strict accounting of volunteer labor to reward students fairly with certified academic recognition.

---

## 6. Problem Statement
Previous volunteer tracking approaches suffered from critical database flaws:
1. **Mutable Aggregates:** Total hours stored as directly editable columns, leading to lost updates.
2. **Double Counting:** Multi-club collaborations inflated student hours when joined carelessly.
3. **Premature Certification:** Students with pending hours claimed certificates before faculty review.
4. **Lack of Auditability:** Absence of change-data capture when hours were altered or revoked.

---

## 7. Objectives
1. Implement a 3NF relational database schema in MySQL 8.0.
2. Store volunteer contributions as discrete, verified ledger entries.
3. Automate eligibility calculation via SQL views using configured threshold policies (e.g. 20 hours).
4. Provide backend-enforced Role-Based Access Control (RBAC).
5. Deliver a signature Certificate Eligibility Report with search, multi-criteria filtering, and CSV export.
6. Issue tamper-proof PDF certificates with cryptographic verification tokens.

---

## 8. Scope of the Project
- **In Scope:** Authentication, user roles (Admin, Coordinator, Approver, Lead, Volunteer), event rosters, interval-based hour logging, faculty approval/rejection workflows, threshold-based eligibility calculation, ReportLab PDF generation, public verification portal, administrative audit logs.
- **Out of Scope:** Physical biometric attendance terminals; third-party university ERP payment integration.

---

## 9. Existing System and Proposed System

| Dimension | Existing System | Proposed DBMS System |
|---|---|---|
| **Data Storage** | Manual logs / Excel spreadsheets | MySQL 8.0 in 3NF with foreign key constraints |
| **Integrity** | Prone to accidental overwrites | ACID transactions, check constraints, database triggers |
| **Calculation** | Manual formula calculation | Authoritative SQL aggregation (`SUM`, `GROUP BY`, `HAVING`) |
| **Verification** | Unverified printed certificates | Cryptographic SHA-256 tokens verifiable via public portal |
| **Auditing** | Non-existent | Automated `audit_logs` table tracking before/after JSON states |

---

## 10. Requirements Analysis
- **Functional Requirements:**
  - FR1: Role-based authentication via JWT.
  - FR2: Event creation with many-to-many sub-club associations.
  - FR3: Volunteer hours entry with start/end time and break deduction.
  - FR4: Mandatory rejection reason for unapproved entries.
  - FR5: Real-time calculation of total approved hours, excluding pending and rejected hours.
  - FR6: Generation of filterable Certificate Eligibility Report.
- **Non-Functional Requirements:**
  - NFR1: Performance — Indexed queries returning in $<50$ms.
  - NFR2: Security — Password hashing (`scrypt`/`pbkdf2`), no IDOR leaks.
  - NFR3: Reliability — Idempotent certificate issuance.

---

## 11. System Architecture
```text
┌────────────────────────────────────────────────────────┐
│             React + Vite Frontend (TypeScript)         │
│  Tailwind CSS • Recharts • AppLayout • ProtectedRoutes │
└───────────────────────────▲────────────────────────────┘
                            │ REST JSON (/api/v1)
┌───────────────────────────▼────────────────────────────┐
│                  Flask Backend (Python 3.14)           │
│  Flask-JWT-Extended • RBAC Decorators • ReportLab PDF  │
└───────────────────────────▲────────────────────────────┘
                            │ SQLAlchemy / PyMySQL
┌───────────────────────────▼────────────────────────────┐
│                    MySQL 8.x Database                  │
│  10 Normalized Tables • 5 Views • Triggers • Procedures│
└────────────────────────────────────────────────────────┘
```

---

## 12. ER Diagram
The system defines 10 normalized tables. The editable Mermaid ER diagram is maintained in `database/erd.mmd`:
- `users` (1:1) `students`
- `clubs` (1:N self-reference parent/sub-club)
- `events` (M:N) `clubs` via `event_subclubs`
- `students` (M:N) `events` via `event_volunteers`
- `event_volunteers` (1:N) `volunteer_hour_entries`
- `certificate_policies` (1:N) `certificates`
- `users` (1:N) `audit_logs`

---

## 13. Relational Schema
All tables, data types, primary keys, and foreign keys are defined in `database/schema.sql`.

---

## 14. Normalization
Normal form analysis from 1NF to 3NF is documented in `database/normalization.md`. All transitive and partial dependencies have been removed.

---

## 15. Database Constraints and Relationships
- **Composite Primary Keys:** `event_subclubs (event_id, club_id)`.
- **Unique Constraints:** `uq_event_student (event_id, student_id)`, `users(email)`, `students(university_registration_number)`.
- **Check Constraints:** `end_datetime > start_datetime`, `break_minutes >= 0`, `claimed_minutes > 0`.
- **Foreign Keys:** Cascading deletes on junction rows; restricted deletes on certificates and policies.

---

## 16. SQL Queries, Views, Triggers and Procedures
- **Views:** `vw_student_approved_hours`, `vw_certificate_eligibility`, `vw_event_volunteer_summary`, `vw_club_volunteer_summary`, `vw_pending_hour_approvals`.
- **Triggers:** `trg_vhe_before_insert`, `trg_vhe_before_update`, `trg_vhe_after_update`, `trg_cert_after_insert`, `trg_cert_after_update`.
- **Stored Procedures:** `sp_calculate_student_hours`, `sp_refresh_certificate_eligibility`, `sp_generate_eligibility_report`, `sp_issue_certificate`.
- **Analytical Queries:** See `database/reports.sql`.

---

## 17. Application Modules
1. **Auth & Identity Module:** Secure login, token distribution, session context.
2. **Student Roster Module:** Student profile management, registration indexing.
3. **Events Module:** Multi-sub-club campus event management.
4. **Ledger Module:** Interval time logging, approval queue, admin audit correction.
5. **Eligibility & Reporting Module:** Dynamic threshold evaluation, CSV export.
6. **Certificate Lifecycle Module:** Idempotent issuance, ReportLab PDF rendering, revocation.
7. **Public Verifier Module:** Unauthenticated credential verification.

---

## 18. Implementation
- Backend built with Flask, SQLAlchemy, and ReportLab.
- Frontend built with React 18, Vite, TypeScript, and Tailwind CSS.
- Communication over versioned REST endpoints (`/api/v1`).

---

## 19. Testing and Results
- **Automated Tests:** 18 pytest integration tests passed with 100% pass rate.
- **Frontend Build:** `tsc && vite build` completed successfully without warnings.
- **Test Scenarios Verified:** Student A (18h, Ineligible), Student B (20h, Eligible), Student C (18h approved + 5h pending, Review), Student D (24h, Eligible).

---

## 20. Sample Certificate Eligibility Report
See `docs/TESTING.md` and CSV export format generated from `GET /api/v1/reports/certificate-eligibility?export=csv`.

---

## 21. Screenshots of the Working Application
*(Placeholders available in repository; system verifiable live at `http://localhost:5173`)*.

---

## 22. Limitations
- Current version focuses on web browser interaction; native mobile apps are planned for future phases.
- PDF generation uses pre-set institutional templates; dynamic WYSIWYG template editing is not yet implemented.

---

## 23. Future Enhancements
1. Student NFC smartcard scanning at event venues for automated timestamp logging.
2. Blockchain-anchored verifiable credentials (W3C standard) alongside SHA-256 tokens.
3. Bulk batch certificate email dispatch via SMTP.

---

## 24. Conclusion
The Event Volunteer Hour Ledger successfully implements a robust relational DBMS for CHRIST (Deemed to be University). By strictly enforcing 3NF normalization, ACID transaction boundaries, view-based dynamic aggregation, and role-based access control, the system eliminates data anomalies and ensures reliable academic certificate governance.

---

## 25. References
1. Elmasri, R., & Navathe, S. B. *Fundamentals of Database Systems*, 7th Edition, Pearson.
2. Silberschatz, A., Korth, H. F., & Sudarshan, S. *Database System Concepts*, 7th Edition, McGraw-Hill.
3. MySQL 8.0 Reference Manual — Stored Routines, Views, and Triggers.
4. Flask Documentation & SQLAlchemy 2.0 Unified Documentation.
