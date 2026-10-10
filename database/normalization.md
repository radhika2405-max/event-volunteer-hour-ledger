# Database Normalization and Design Rationale
## Event Volunteer Hour Ledger
**CHRIST (Deemed to be University), Delhi NCR Campus | School of Sciences**  
**Organization:** AADIKALA and its 6 Sub-Clubs (Dance, Emcee, Technical, Creative, Music, Hospitality)

---

## 1. Objectives of Normalization

The database schema is engineered to achieve **Third Normal Form (3NF)** and **Boyce-Codd Normal Form (BCNF)** across all core transactional entities. The key objectives are:
1. **Elimination of Data Redundancy:** Storing each authoritative fact exactly once.
2. **Prevention of Modification Anomalies:**
   - *Insertion Anomaly:* Allowing event creation without requiring student registrations; allowing student registration without requiring immediate logged hours.
   - *Update Anomaly:* Updating student profile details (e.g. academic programme) in one place without inconsistencies across dozens of event volunteer logs.
   - *Deletion Anomaly:* Deleting an event or unregistering a student without erasing their historic academic identity.
3. **Auditability and Immutability:** Enforcing ledgers where hours are recorded as discrete, verified entries rather than an overwriteable aggregate total.

---

## 2. Normalization Steps (1NF through 3NF)

### 2.1 First Normal Form (1NF)
- **Requirement:** Each column contains atomic values, no repeating groups or comma-separated lists, and each record is identified by a unique Primary Key.
- **Implementation:**
  - Events frequently involve multiple sub-clubs (e.g., SUNERGOS involves Technical, Creative, and Hospitality). Storing `sub_clubs = "Technical, Creative, Hospitality"` in a single column violates 1NF.
  - **Resolution:** Introduced the junction table `event_subclubs (event_id, club_id)` with a composite primary key.
  - Hour submissions contain individual time blocks (date, start time, end time, breaks) rather than multi-date strings.

### 2.2 Second Normal Form (2NF)
- **Requirement:** Must be in 1NF and all non-key attributes must be fully functionally dependent on the entire primary key (no partial dependencies on composite keys).
- **Implementation:**
  - In `event_subclubs`, the composite key is `(event_id, club_id)`. Non-key attributes related strictly to the club (such as `club_name` or `parent_club_id`) or event (such as `venue` or `start_datetime`) are decoupled into `clubs` and `events` respectively.
  - In `event_volunteers`, the primary key is `participation_id` (surrogate) with candidate key `(event_id, student_id)`. Non-key attributes like `student_name` or `programme` are not duplicated here; they reside exclusively in `students` and `users`.

### 2.3 Third Normal Form (3NF)
- **Requirement:** Must be in 2NF and no non-key attribute is transitively dependent on the primary key (no $X \rightarrow Y \rightarrow Z$ dependencies).
- **Implementation:**
  - **Separation of Authentication and Academic Profile:**
    - `users`: Governs login identity (`user_id`, `email`, `password_hash`, `role`).
    - `students`: Governs academic enrollment (`student_id`, `user_id`, `university_registration_number`, `programme`, `academic_year`).
    - Storing `programme` in `users` or `password_hash` in `students` would create transitive or duplicate functional dependencies.
  - **Derived Total Hours:**
    - An editable `total_approved_hours` field in `students` would represent a transitive dependency on the state of `volunteer_hour_entries`.
    - **Resolution:** Total approved hours is dynamically calculated via SQL aggregation (`SUM(verified_minutes) / 60.0`) and materialized views (`vw_student_approved_hours`), guaranteeing mathematical consistency and preventing race conditions.

---

## 3. Entity Relationships and Cardinalities

| Relationship | Entities Involved | Cardinality | Implementation & Foreign Key Rules |
|---|---|---|---|
| Parent-Child Club Hierarchy | `clubs` $\rightarrow$ `clubs` | $1 : N$ (Recursive) | `parent_club_id` references `club_id`. Root `AADIKALA` has NULL parent. Sub-clubs reference AADIKALA. |
| User to Student Profile | `users` $\rightarrow$ `students` | $1 : 1$ | `students.user_id` is UNIQUE FK referencing `users(user_id)` ON DELETE CASCADE. |
| Events to Sub-Clubs | `events` $\leftrightarrow$ `clubs` | $M : N$ | Junction table `event_subclubs (event_id, club_id)` with composite PK. |
| Student Participation | `students` $\leftrightarrow$ `events` | $M : N$ | Junction entity `event_volunteers (participation_id, event_id, student_id)`. Enforced with UNIQUE `(event_id, student_id)`. |
| Volunteer to Hours | `event_volunteers` $\rightarrow$ `volunteer_hour_entries` | $1 : N$ | A volunteer can have multiple logged work intervals for multi-day or staged events. |
| Policy to Certificates | `certificate_policies` $\rightarrow$ `certificates` | $1 : N$ | Policy specifies threshold; certificates capture immutable snapshot at issuance. |
| Student to Certificates | `students` $\rightarrow$ `certificates` | $1 : N$ | A student may earn certificates across different policies or academic cycles. |
| Action Audit Trail | `users` $\rightarrow$ `audit_logs` | $1 : N$ | `audit_logs.actor_user_id` records the operating user; JSON stores before/after state snapshots. |

---

## 4. Key Integrity Guarantees

1. **Composite Uniqueness:** `UNIQUE KEY uq_event_student (event_id, student_id)` prevents accidental duplicate active registrations for the same event.
2. **Check Constraints:**
   - `events`: `CHECK (end_datetime > start_datetime)` prevents impossible timelines.
   - `volunteer_hour_entries`: `CHECK (break_minutes >= 0)`, `CHECK (claimed_minutes > 0)`, `CHECK (verified_minutes >= 0)` prevent negative durations.
3. **Referential Integrity Actions:**
   - Cascading deletes on participation child rows preserve clean teardown if test data is reset.
   - Restrict actions (`ON DELETE RESTRICT`) on critical entities like `certificate_policies` and `certificates` protect academic credentials from accidental deletion.
