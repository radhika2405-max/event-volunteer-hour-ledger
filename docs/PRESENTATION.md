# EVENT VOLUNTEER HOUR LEDGER
## Complete Presentation Deck & Faculty Viva Voce Defense Guide
**Department:** School of Sciences, CHRIST (Deemed to be University), Delhi NCR Campus  
**Academic Year:** 2025–2026 | **Course:** Database Management Systems (DBMS)  
**Organization:** AADIKALA (Cultural & Technical Wing) & 6 Sub-Clubs (Dance, Emcee, Technical, Creative, Music, Hospitality)  
**Live Hosted Application:** [https://radhika2405-max.github.io/event-volunteer-hour-ledger/](https://radhika2405-max.github.io/event-volunteer-hour-ledger/)

---

# SLIDE DECK OVERVIEW

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION SLIDE FLOW                         │
├─────────┬──────────────────────────────────────────────────────────────┤
│ Slide 1 │ Title & Introduction (Project Identity & Live Deployment)     │
│ Slide 2 │ Real-World Problem Statement (The Excel Spreadsheet Crisis)   │
│ Slide 3 │ The Architectural Solution: The "Ledger Paradigm"            │
│ Slide 4 │ Relational Data Modeling & Entity-Relationship (ER) Design   │
│ Slide 5 │ Database Normalization Journey (1NF -> 2NF -> 3NF & BCNF)    │
│ Slide 6 │ Database Integrity: Primary, Foreign, Unique & Check Rules   │
│ Slide 7 │ Database Views & Eliminating Multi-Club Join Inflation       │
│ Slide 8 │ Database Programmability: Triggers & Change Data Capture     │
│ Slide 9 │ Stored Procedures & ACID Concurrency Control (Row Locks)     │
│ Slide 10│ Query Optimization & Balanced B-Tree Indexing Strategy       │
│ Slide 11│ Live System Features & Certificate Verification Portal       │
│ Slide 12│ Conclusion, Academic Impact & Faculty Viva Q&A Readiness     │
└─────────┴──────────────────────────────────────────────────────────────┘
```

---

## Slide 1: Title & Introduction

### Slide Content & Layout
* **Project Title:** **Event Volunteer Hour Ledger**
* **Subtitle:** An Enterprise-Grade Relational Database Management System for Student Service Hours Accounting, Faculty Verification & Certificate Governance
* **Presented by:** Radhika (and Team)
* **Academic Department:** School of Sciences, CHRIST (Deemed to be University), Delhi NCR Campus
* **Live System URL:** [radhika2405-max.github.io/event-volunteer-hour-ledger](https://radhika2405-max.github.io/event-volunteer-hour-ledger/)
* **Technology Badges:**
  * `MySQL 8.0 Engine`
  * `3NF / BCNF Normalized`
  * `ACID Compliant`
  * `React 18 + Vite (TypeScript)`
  * `Flask REST API`

### 🗣️ Speaker Notes (What to say)
> *"Respected faculty members and examiners, good morning. Today, we are proud to present our Database Management System project: the **Event Volunteer Hour Ledger**.*  
> *In university life, volunteer contributions across cultural, academic, and technical events represent hundreds of student labor hours. However, tracking these hours on spreadsheets or paper timesheets leads to lost updates, duplicate counting, and unverified certificates. We engineered an authoritative, 3NF-normalized relational database system that eliminates these anomalies, enforces strict ACID transactions, and provides verifiable certificate eligibility."*

---

## Slide 2: Real-World Problem Statement & Motivation

### Slide Content & Layout
* **The Domain:** AADIKALA oversees 6 campus sub-clubs: Dance, Emcee, Technical, Creative, Music, and Hospitality.
* **The 4 Critical Database Flaws in Traditional Tracking:**
  1. **Mutable Aggregates & Lost Updates:** Spreadsheets store a single mutable cell for "Total Hours". When multiple event coordinators update hours concurrently, hours are overwritten without an audit trail.
  2. **Multi-Club Join Inflation (Double Counting):** When an event like *SUNERGOS* or *TARANG* is co-hosted by Dance, Music, and Technical sub-clubs, joining clubs directly with hour entries multiplies student hours by the number of participating clubs.
  3. **Premature Certification:** Students with pending, unapproved hours claim certificates before faculty review.
  4. **Absence of Auditability:** No historical record of *who* approved or rejected an entry, *why* it was altered, or *when*.

### 🗣️ Speaker Notes (What to say)
> *"In our college organization, AADIKALA coordinates volunteers across multi-day fests like SUNERGOS and TARANG. Previous manual approaches failed because of fundamental database anomalies: first, mutable aggregates where total hours are directly editable without a paper trail; second, join inflation where multi-club events duplicate hours; third, students claiming certificates before faculty verify their hours; and fourth, a complete lack of change-data audit logging."*

---

## Slide 3: The Architectural Solution: The "Ledger Paradigm"

### Slide Content & Layout
* **The Ledger Paradigm:**
  * Total hours are **NEVER stored as a mutable column** in the `students` table.
  * Every volunteer work interval is an immutable transactional record in `volunteer_hour_entries`.
  * Total hours are computed dynamically via SQL view aggregation:
    $$\text{Approved Hours} = \frac{\sum \text{verified\_minutes}}{60.0} \quad \text{WHERE } \text{submission\_status} \in (\text{'approved'}, \text{'corrected'})$$
* **Strict Three-Tier Architecture:**
  1. **Presentation Layer:** React + Vite (TypeScript, Tailwind CSS, Recharts) hosted on GitHub Pages.
  2. **Application Layer:** Python Flask REST API with Role-Based Access Control (RBAC).
  3. **Database Layer:** MySQL 8.0 with 10 Normalized Tables, 5 Views, Triggers, and Stored Procedures.

### 🗣️ Speaker Notes (What to say)
> *"To solve the mutable update anomaly, we adopted the **Ledger Paradigm** inspired by financial accounting. In our database, the `students` table does not have a `total_hours` column. Instead, every work interval is an immutable record in `volunteer_hour_entries`. Total hours are dynamically aggregated through authoritative database views. Only entries verified by faculty contribute to certified totals, strictly isolating pending and rejected submissions."*

---

## Slide 4: Relational Data Modeling & Entity-Relationship (ER) Design

### Slide Content & Layout
* **10 Normalized Relations:**
  * Core Entities: `users`, `students`, `clubs`, `events`, `certificate_policies`
  * Transactional & Associative Tables: `event_subclubs`, `event_volunteers`, `volunteer_hour_entries`, `certificates`, `audit_logs`
* **Key Cardinalities:**
  * `clubs` $\to$ `clubs` ($1 : N$ Recursive Self-Referential): Models parent club *AADIKALA* and its 6 child sub-clubs (`parent_club_id`).
  * `events` $\leftrightarrow$ `clubs` ($M : N$ via `event_subclubs`): Composite primary key `(event_id, club_id)`.
  * `students` $\leftrightarrow$ `events` ($M : N$ via `event_volunteers`): Unique constraint on `(event_id, student_id)`.
  * `event_volunteers` $\to$ `volunteer_hour_entries` ($1 : N$): Multi-session logging per event.
  * `certificate_policies` $\to$ `certificates` ($1 : N$): Configurable threshold policies.

### 🗣️ Speaker Notes (What to say)
> *"Here is our Entity-Relationship model. We separated authentication identity in `users` from academic records in `students` with a 1-to-1 relationship. We modeled the organizational hierarchy using a self-referential recursive foreign key in `clubs`, where `parent_club_id` links sub-clubs to AADIKALA. Events and sub-clubs share a Many-to-Many relationship resolved through `event_subclubs`, while student participation is captured through the associative entity `event_volunteers`."*

---

## Slide 5: Database Normalization (1NF $\to$ 2NF $\to$ 3NF & BCNF)

### Slide Content & Layout
* **First Normal Form (1NF):**
  * *Violation:* Storing multi-club collaborations as a comma-separated string `sub_clubs = 'Dance, Creative, Technical'` in the events table.
  * *Resolution:* Atomic values enforced; decomposed into junction table `event_subclubs(event_id, club_id)`.
* **Second Normal Form (2NF):**
  * *Violation:* Non-key attributes partially dependent on composite keys.
  * *Resolution:* In `event_subclubs`, only the foreign keys exist. All club metadata belongs to `clubs`, and all event metadata belongs to `events`.
* **Third Normal Form (3NF) & BCNF:**
  * *Violation:* Transitive dependencies ($X \to Y \to Z$). Storing `programme` in `users` or storing calculated `total_hours` in `students`.
  * *Resolution:* Decoupled into `students` and dynamic SQL aggregation views. Every determinant is a candidate key.

### 🗣️ Speaker Notes (What to say)
> *"Our database strictly adheres to Third Normal Form. In 1NF, we eliminated repeating groups by breaking comma-separated sub-club lists into an associative junction table. In 2NF, we ensured zero partial functional dependencies on composite primary keys. In 3NF, we removed transitive dependencies—for instance, separating login credentials in `users` from degree programs in `students`, and removing any derived aggregate columns that would depend transitively on ledger entries."*

---

## Slide 6: Database Integrity: Primary, Foreign, Unique & Check Rules

### Slide Content & Layout
* **Entity Integrity:** Surrogate integer Primary Keys with `AUTO_INCREMENT` across all transactional tables.
* **Referential Integrity Actions:**
  * `ON DELETE CASCADE`: Cascading deletes on operational records (e.g., student hour entries linked to volunteer registration).
  * `ON DELETE RESTRICT`: Prohibits deleting a `certificate_policy` or `certificate` row, protecting academic credentials from accidental deletion.
* **Domain & Check Constraints:**
  ```sql
  CHECK (end_datetime > start_datetime) -- Prevents inverted timelines
  CHECK (break_minutes >= 0)            -- Non-negative rest duration
  CHECK (claimed_minutes > 0)           -- Positive labor request
  CHECK (verified_minutes >= 0)         -- Non-negative verified labor
  ```
* **Unique Constraints:**
  * `UNIQUE KEY (event_id, student_id)`: Prevents accidental duplicate event registrations.
  * `UNIQUE (university_registration_number)`: Enforces unique student registration.
  * `UNIQUE (verification_token)`: Cryptographic token uniqueness for public verification.

### 🗣️ Speaker Notes (What to say)
> *"Data integrity is enforced at the database engine level, not merely in the frontend. We implemented Check Constraints so that an event cannot end before it begins, and break minutes cannot be negative. We implemented composite unique constraints on `(event_id, student_id)` to prevent a volunteer from registering twice for the same event, and `ON DELETE RESTRICT` to protect issued certificates against accidental deletion."*

---

## Slide 7: Database Views & Eliminating Multi-Club Join Inflation

### Slide Content & Layout
* **The Classical Join Inflation Problem:**
  * If Event A has 3 sub-clubs, joining `event_subclubs` directly with `volunteer_hour_entries` multiplies every hour entry by 3!
* **The 5 Production Database Views:**
  1. `vw_student_approved_hours`: Canonical student aggregation (`SUM`, `COUNT(DISTINCT)`).
  2. `vw_certificate_eligibility`: Real-time threshold evaluation separating eligibility from issuance.
  3. `vw_event_volunteer_summary`: Event-wise headcount and verified labor without multi-club duplication.
  4. `vw_subclub_contribution_summary`: Hierarchy-aware labor analytics for Dance, Emcee, Technical, Creative, Music, and Hospitality.
  5. `vw_pending_review_queue`: Actionable queue for faculty approvers.

### 🗣️ Speaker Notes (What to say)
> *"One of our proudest database achievements is solving **Join Inflation**. When an event has multiple collaborating sub-clubs, a naive multi-table join multiplies hours by the number of sub-clubs. We designed five specialized SQL views. In `vw_student_approved_hours`, hours attach to the volunteer participation ID, and we use conditional aggregation: `SUM(CASE WHEN submission_status = 'approved' THEN verified_minutes ELSE 0 END)`. This guarantees mathematical precision across all reports."*

---

## Slide 8: Database Programmability: Triggers & Change Data Capture

### Slide Content & Layout
* **Active Database Triggers:**
  * `trg_vhe_before_insert`: Validates input durations before record creation.
  * `trg_vhe_before_update`: Enforces workflow state machines—rejecting an entry without a `rejection_reason` raises SQL Error `45000`:
    ```sql
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Integrity Error: Rejection requires a clear rejection reason.';
    ```
  * `trg_vhe_after_update`: Automated **Change Data Capture (CDC)**—when hour status or minutes change, it captures old and new values as JSON and inserts them into `audit_logs`.
* **Audit Trail Schema:** Captures `actor_user_id`, `action`, `entity_type`, `entity_id`, `before_state`, `after_state`, and `timestamp`.

### 🗣️ Speaker Notes (What to say)
> *"We utilized advanced database programmability. Our `BEFORE UPDATE` trigger on hour entries enforces state transition integrity: if a faculty member attempts to reject hours without providing a written reason, the database raises an exception and aborts the statement. Meanwhile, the `AFTER UPDATE` trigger automatically records before and after JSON snapshots in `audit_logs`, providing forensic traceability."*

---

## Slide 9: Stored Procedures & ACID Concurrency Control (Row Locks)

### Slide Content & Layout
* **The ACID Guarantee in `sp_issue_certificate`:**
  * **Atomicity:** Certificate issuance, snapshot creation, and audit logging succeed as one atomic unit or roll back completely.
  * **Consistency:** Minimum policy threshold ($\ge 20$ hours = 1,200 minutes) strictly validated before commit.
  * **Isolation (Row-Level Locking):**
    ```sql
    START TRANSACTION;
    -- Shared lock on policy
    SELECT * FROM certificate_policies WHERE policy_id = p_policy_id FOR SHARE;
    -- Exclusive lock on candidate student
    SELECT * FROM students WHERE student_id = p_student_id FOR UPDATE;
    
    -- Check threshold & prevent double issuance:
    IF v_approved_minutes < v_min_minutes THEN ROLLBACK; END IF;
    IF v_existing_cert_count > 0 THEN ROLLBACK; END IF;
    
    INSERT INTO certificates (...) VALUES (...);
    COMMIT;
    ```
  * **Durability:** Committed transactions persist via MySQL InnoDB redo logs.

### 🗣️ Speaker Notes (What to say)
> *"Certificate issuance requires strict ACID compliance. If a student is near the 20-hour threshold, simultaneous approval requests could trigger race conditions. In our stored procedure `sp_issue_certificate`, we execute `START TRANSACTION` and obtain row-level exclusive locks with `SELECT ... FOR UPDATE`. If the student has already received a certificate, or their approved minutes drop below the threshold, the transaction rolls back cleanly with custom SQL error codes."*

---

## Slide 10: Query Optimization & Balanced B-Tree Indexing Strategy

### Slide Content & Layout
* **Indexing Architecture:**
  * **Clustered Indexes:** Primary keys on all tables provide $O(\log N)$ row access.
  * **Secondary B-Tree Indexes:**
    * `idx_users_email` & `idx_students_reg_no`: Sub-millisecond student profile lookups.
    * `idx_vhe_status_verified`: Accelerates aggregate hour calculations in views.
    * `idx_cert_verification_token`: Powers instant public credential verification.
  * **Composite B-Tree Indexes:**
    * `idx_vhe_part_status (participation_id, submission_status)`: Optimizes join-filtering.
    * `idx_events_dates_status (start_datetime, event_status)`: Powers chronological event feeds.
* **Execution Plan (`EXPLAIN`):** Queries use index seeks (`ref` / `range`), eliminating full table scans (`ALL`).

### 🗣️ Speaker Notes (What to say)
> *"To ensure scalability across thousands of volunteers and entries, we engineered a dedicated B-tree indexing strategy. Beyond primary keys, we created secondary indexes on lookup columns like registration numbers and tokens, and composite indexes on `(participation_id, submission_status)`. Using `EXPLAIN`, we verified that our reporting queries execute using efficient index range lookups under 50 milliseconds rather than full table scans."*

---

## Slide 11: Live System Features & Certificate Verification Portal

### Slide Content & Layout
* **Live Hosted Application:** [radhika2405-max.github.io/event-volunteer-hour-ledger](https://radhika2405-max.github.io/event-volunteer-hour-ledger/)
* **Core Application Portals:**
  1. **Volunteer Portal:** Personal dashboard showing total approved hours, registered events, and pending reviews.
  2. **Faculty Approver Hub:** Live review queue with one-click approvals, corrections, and mandatory rejection notes.
  3. **Certificate Eligibility Engine:** Threshold progress bar ($\ge 20$ hours), eligibility status badges.
  4. **Filterable Analytical Reports:** Multi-criteria filtering by Academic Year, Programme, and Minimum Hours with instant CSV Export.
  5. **Public Certificate Verification:** Cryptographic SHA-256 token validator verifying student authenticity.

### 🗣️ Speaker Notes (What to say)
> *"Our user interface is deployed live on GitHub Pages. It features five specialized workspaces: the Volunteer Portal showing personal hours, the Approver Hub where faculty review submissions, the Certificate Eligibility engine tracking the 20-hour requirement, our search-and-filter report table with CSV export, and a public verification screen where anyone can enter a token to verify a certificate's authenticity."*

---

## Slide 12: Conclusion, Academic Impact & Faculty Viva Q&A Readiness

### Slide Content & Layout
* **Key Achievements:**
  * Successfully replaced error-prone spreadsheets with an enterprise-grade 3NF relational DBMS.
  * Solved Join Inflation in multi-club campus events using modular SQL views.
  * Enforced active database triggers, ACID transactions with row-level locks, and automated audit trails.
  * Implemented B-Tree indexing strategy ensuring $< 50$ms query execution time.
* **Open for Viva Voce Examination:**
  * *"Thank you, professors and examiners. We are now pleased to present our live demo and answer your questions."*

### 🗣️ Speaker Notes (What to say)
> *"In conclusion, this project demonstrates how foundational DBMS theory—normalization, relational algebra, constraints, ACID transactions, and indexing—directly solves real-world campus administrative challenges. Thank you, and we are now ready for your questions and the live demonstration."*

---

# PART 2: Comprehensive Viva Voce Defense Questions & Answers

### Q1: "Why did you use the 'Ledger Paradigm' instead of adding a `total_hours` column in `students`?"
> **Answer:**  
> *"Adding `total_hours` to the `students` table introduces a **Transitive Dependency** ($StudentID \to Entries \to TotalHours$), violating **Third Normal Form (3NF)**. Furthermore, it creates a severe **Update Anomaly and Race Condition**: if two coordinators approve different sessions simultaneously, concurrent updates can overwrite each other, causing lost hours. By using the **Ledger Paradigm**, every hour submission is an immutable record, and total hours are dynamically aggregated via SQL views, guaranteeing 100% mathematical consistency."*

### Q2: "What is Join Inflation and how did your schema prevent it?"
> **Answer:**  
> *"Join Inflation occurs when joining across a Many-to-Many relationship. For example, if Event A has 3 sub-clubs in `event_subclubs`, joining `events` directly to `event_subclubs` and then to `volunteer_hour_entries` triples every hour entry. We solved this in our schema and views: `volunteer_hour_entries` links strictly to `event_volunteers(participation_id)`. Club associations remain in the separate junction table and are aggregated independently with `COUNT(DISTINCT)` to guarantee zero duplication."*

### Q3: "How does your database handle ACID transactions during certificate issuance?"
> **Answer:**  
> *"In our stored procedure `sp_issue_certificate`, we wrap issuance inside `START TRANSACTION ... COMMIT`. We use row-level exclusive locks using `SELECT ... FOR UPDATE` on the student record and `FOR SHARE` on the policy. If the student's verified hours are below the 1,200-minute threshold, or if an active certificate already exists, the procedure calls `ROLLBACK` and raises an exception. This guarantees Atomicity and Isolation, preventing duplicate certificate generation."*

### Q4: "What is the difference between a `WHERE` clause and a `HAVING` clause in your eligibility query?"
> **Answer:**  
> *"In our eligibility query in `reports.sql`, the `WHERE` clause filters individual records **before** grouping—we use `WHERE submission_status IN ('approved', 'corrected')` so pending or rejected timesheets are excluded immediately. The `HAVING` clause filters groups **after** aggregation—we use `HAVING SUM(verified_minutes) >= 1200` to select only those students whose cumulative sum reaches or exceeds the 20-hour policy threshold."*

### Q5: "What triggers did you implement and what business rules do they enforce?"
> **Answer:**  
> *"We implemented three triggers in `triggers.sql`. Our `BEFORE INSERT` trigger ensures positive claimed durations and non-negative breaks. Our `BEFORE UPDATE` trigger acts as a state-machine gatekeeper: if a reviewer marks an entry as `rejected` without providing a `rejection_reason`, the trigger raises SQL error `45000` and aborts the update. Finally, our `AFTER UPDATE` trigger captures the old and new states as JSON objects and automatically records them into `audit_logs` for forensic accountability."*
