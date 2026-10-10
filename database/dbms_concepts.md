# Database Management System (DBMS) Concepts Demonstrated
## Event Volunteer Hour Ledger
**CHRIST (Deemed to be University), Delhi NCR Campus | School of Sciences**  
**Organization:** AADIKALA & Sub-clubs (Dance, Emcee, Technical, Creative, Music, Hospitality)

---

## 1. Summary of Implemented DBMS Concepts

| DBMS Concept | Implementation Location | Practical Purpose in This System |
|---|---|---|
| **Relational Modeling & Normalization (3NF)** | `schema.sql`, `erd.mmd` | Decoupled users, academic records, events, sub-clubs, and ledger entries to eliminate anomalies. |
| **Primary & Foreign Keys** | All tables in `schema.sql` | Enforce entity integrity and referential integrity between students, events, and hours. |
| **Check Constraints** | `events`, `volunteer_hour_entries` | Ensures `end_datetime > start_datetime`, `break_minutes >= 0`, `claimed_minutes > 0`. |
| **Unique Constraints** | `users`, `students`, `events`, `event_volunteers`, `certificates` | Guarantees uniqueness of emails, registration numbers, event codes, certificates, and prevents duplicate event registrations. |
| **Self-Referential Relationships** | `clubs` table (`parent_club_id`) | Models the hierarchical structure of parent club `AADIKALA` and its 6 sub-clubs. |
| **Many-to-Many Relationships** | `event_subclubs` junction table | Connects campus events (e.g., SUNERGOS) to multiple collaborating sub-clubs. |
| **SQL Joins (INNER, LEFT, Self, Multi-table)** | `views.sql`, `reports.sql` | Combines students with registrations, events, sub-clubs, and hour logs without inflating totals. |
| **Aggregate Functions & GROUP BY / HAVING** | `vw_student_approved_hours`, `reports.sql` | Computes `SUM(verified_minutes)`, `COUNT(DISTINCT event_id)`, and filters via `HAVING SUM >= threshold`. |
| **Conditional Aggregation** | `views.sql`, `reports.sql` | `SUM(CASE WHEN submission_status = 'approved' THEN verified_minutes ELSE 0 END)` isolates approved hours from pending/rejected. |
| **Database Views** | `views.sql` (5 dedicated views) | Provides real-time abstraction for student hours, certificate eligibility, event metrics, and approval queues. |
| **Database Triggers** | `triggers.sql` | Enforces state-transition rules (mandatory rejection reason) and writes audit log entries on updates. |
| **Stored Procedures** | `procedures.sql` | `sp_calculate_student_hours`, `sp_refresh_certificate_eligibility`, `sp_generate_eligibility_report`, `sp_issue_certificate`. |
| **ACID Transactions** | `procedures.sql`, Backend services | Wraps certificate issuance and hour approvals in `START TRANSACTION ... COMMIT / ROLLBACK` with row-level locks. |
| **Indexing Strategy** | `indexes.sql`, `schema.sql` | B-tree indexes on lookup columns (`registration_number`, `email`, `verification_token`) and composite indexes for reports. |
| **Audit Trails & Change Data Capture** | `audit_logs` table & triggers | Stores actor, entity, before/after JSON states, reasons, and timestamps for accountability. |

---

## 2. In-Depth Technical Demonstration

### 2.1 The Ledger Paradigm vs. Mutable Totals
Instead of storing a mutable column `total_hours` on the `students` table, hours are stored as individual ledger entries in `volunteer_hour_entries`.
- **Why?** Mutable totals suffer from race conditions, lost updates, and lack verifiable origins.
- **How it works:**
  $$H_s = \frac{\sum \text{verified\_minutes}}{60.0}$$
  Only records with status `'approved'` or `'corrected'` contribute to certified totals. Pending and rejected submissions are strictly isolated via SQL aggregation.

### 2.2 Preventing Join Inflation in Multi-Club Events
A common trap in SQL reporting occurs when joining across many-to-many relationships:
```sql
-- DANGEROUS: If an event has 3 sub-clubs, joining event_subclubs directly into hour entries
-- can multiply every hour entry by 3!
```
**Our Solution in `views.sql` & `reports.sql`:**
Hours are attached directly to `event_volunteers(participation_id)`. Distinct counts (`COUNT(DISTINCT student_id)`) and separate club summaries ensure that multi-club events never duplicate volunteer hours.

### 2.3 ACID Transactions in Certificate Issuance
In `sp_issue_certificate`:
1. `START TRANSACTION;`
2. Row-level read lock on policy: `SELECT ... FOR SHARE;`
3. Check approved hours with exclusive lock: `SELECT ... FOR UPDATE;`
4. If `approved_minutes < threshold`, `ROLLBACK` with code `INELIGIBLE`.
5. If already issued active certificate, `ROLLBACK` with code `ALREADY_ISSUED`.
6. Insert certificate record with immutable snapshot and unique token.
7. `COMMIT;`
This guarantees idempotency and prevents race conditions where a student could be issued duplicate certificates.
