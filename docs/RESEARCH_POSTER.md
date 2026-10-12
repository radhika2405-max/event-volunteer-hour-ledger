# ACADEMIC RESEARCH POSTER GUIDE
## Event Volunteer Hour Ledger: A Relational Database Management System for Service Hour Accounting, Faculty Verification & Certificate Governance
**Institution:** CHRIST (Deemed to be University), Delhi NCR Campus | School of Sciences  
**Academic Year:** 2025–2026 | **Course:** Database Management Systems (DBMS)  
**Author / Presenter:** Radhika (and Team)  
**Student Organization:** AADIKALA & 6 Sub-Clubs (Dance, Emcee, Technical, Creative, Music, Hospitality)  
**Live Hosted Application:** [https://radhika2405-max.github.io/event-volunteer-hour-ledger/](https://radhika2405-max.github.io/event-volunteer-hour-ledger/)

---

## Deliverables Generated

1. 📄 **Printable Vector PDF Poster (A1 Landscape, 841mm x 594mm):**  
   [Event_Volunteer_Hour_Ledger_Research_Poster.pdf](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/docs/outputs/Event_Volunteer_Hour_Ledger_Research_Poster.pdf)
2. 🌐 **Interactive Web & High-DPI Poster (HTML/CSS):**  
   [docs/poster.html](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/docs/poster.html) *(Open in any browser; print with Ctrl+P to any size)*
3. 📘 **Academic Project Report PDF:**  
   [Event_Volunteer_Hour_Ledger_Academic_Project_Report.pdf](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/docs/outputs/Event_Volunteer_Hour_Ledger_Academic_Project_Report.pdf)
4. 📑 **Presentation Slides & Viva Guide PDF:**  
   [Event_Volunteer_Hour_Ledger_Presentation.pdf](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/docs/outputs/Event_Volunteer_Hour_Ledger_Presentation.pdf)

---

# 1. Poster Architecture & Layout Blueprint

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       HEADER BANNER                                              │
│  CHRIST (Deemed to be University) • Delhi NCR Campus • School of Sciences                        │
│  EVENT VOLUNTEER HOUR LEDGER: A 3NF Relational DBMS for University Volunteer Hour Governance      │
│  Author: Radhika | AADIKALA & 6 Sub-Clubs | Live: radhika2405-max.github.io/event-volunteer-hour-ledger │
├───────────────────────────────┬──────────────────────────────────┬───────────────────────────────┤
│           COLUMN 1            │             COLUMN 2             │           COLUMN 3            │
│   Context, Problem & Ledger   │   Relational Schema & Normal.    │   ACID, Indexes & Live Eval   │
├───────────────────────────────┼──────────────────────────────────┼───────────────────────────────┤
│ 1. Real-World Context         │ 4. 3-Tier System Architecture    │ 7. Active Database Triggers   │
│    • AADIKALA & 6 Sub-clubs   │    • React 18, Flask, MySQL 8.0  │    • Workflow rules (SQL 45000│
│    • Co-hosted campus fests   │                                  │    • Automated JSON audit logs│
│                               │ 5. 10 Normalized Relations       │                               │
│ 2. The Spreadsheet Crisis     │    • Recursive clubs self-join   │ 8. Stored Procedures & ACID   │
│    • Mutable update anomaly   │    • Associative participation   │    • Row locks (FOR UPDATE)   │
│    • Join inflation (3x)      │    • Immutable ledger entries    │    • Zero duplicate certs     │
│    • Premature certification  │                                  │                               │
│    • Zero auditability        │ 6. Normalization Journey (3NF)   │ 9. B-Tree Indexing Strategy   │
│                               │    • 1NF: Atomic junction tables │    • O(log N) lookup seeks    │
│ 3. The Ledger Paradigm        │    • 2NF: No partial dependencies│    • Sub-50ms execution       │
│    • Total hours NOT a column │    • 3NF: No transitive dep.     │                               │
│    • Dynamic SQL views:       │                                  │ 10. 6 Analytical Reports      │
│      Hs = Sum(min)/60 WHERE   │ 7. Solving Join Inflation        │    • Eligible >= 20 hrs       │
│      status = 'approved'      │    • Hours link to participation │    • Near threshold (15-20)   │
│    • 20-Hour Milestone Rule   │    • Zero multi-club duplication │                               │
│                               │                                  │ 11. Production Verification   │
│                               │                                  │    • Live Public Verifier     │
└───────────────────────────────┴──────────────────────────────────┴───────────────────────────────┘
```

---

# 2. The 2-Minute Poster Exhibition "Elevator Pitch"

When professors, judges, or fellow students walk up to your research poster during a symposium, use this polished 2-minute walkthrough:

> **"Hello! Welcome to our research poster on the Event Volunteer Hour Ledger.**
>
> **The Problem:**  
> At CHRIST University, our student wing AADIKALA coordinates hundreds of volunteers across six specialized sub-clubs—Dance, Emcee, Technical, Creative, Music, and Hospitality. Traditionally, colleges track these hours on shared spreadsheets. But spreadsheets suffer from four critical database flaws: mutable total hours that get overwritten during concurrent edits, join inflation that triples volunteer hours during co-hosted fests like SUNERGOS, students claiming certificates before faculty review, and a complete lack of change-data audit logging.
>
> **Our Solution — The Ledger Paradigm:**  
> We engineered an enterprise-grade relational database in MySQL 8.0. Following the **Ledger Paradigm**, our `students` table does *not* contain a `total_hours` column. Instead, every work interval is an immutable record, and hours are dynamically aggregated through authoritative SQL views using conditional aggregation.
>
> **Database Rigor & Normalization:**  
> Our schema is normalized to **Third Normal Form (3NF) and BCNF** across 10 tables. We modeled the organizational hierarchy using a recursive self-referential foreign key on `clubs`, resolved many-to-many associations via `event_subclubs` and `event_volunteers`, and eliminated join inflation so co-hosted events never duplicate student labor.
>
> **Integrity, Triggers & ACID Concurrency:**  
> We enforce data integrity at the database engine level. Our `BEFORE UPDATE` trigger enforces business state machines—prohibiting rejections without written reasons via `SQLSTATE 45000`—while our `AFTER UPDATE` trigger captures before and after JSON states into an audit table. In our stored procedure `sp_issue_certificate`, we wrap issuance inside strict ACID transactions with row-level locks using `SELECT ... FOR UPDATE`, guaranteeing that duplicate certificates can never be issued.
>
> **Performance & Live Deployment:**  
> With our balanced B-Tree indexing strategy, complex analytical queries execute in under 50 milliseconds. The entire system is deployed live on GitHub Pages with an interactive volunteer portal, approver hub, filterable eligibility report, and public cryptographic token verifier.
>
> **Thank you! I would be delighted to demonstrate the live system or walk through our SQL schema."**

---

# 3. Core Technical Data on the Poster

### Normalization Decomposition Summary
| Normal Form | Rule Enforced | Practical Implementation in Project |
| :--- | :--- | :--- |
| **1NF** | Atomic attributes, no repeating groups | Decomposed comma-separated sub-club lists into junction entity `event_subclubs(event_id, club_id)`. |
| **2NF** | Zero partial dependencies | Decoupled non-key club data into `clubs` and event data into `events`; junction tables contain only foreign keys. |
| **3NF & BCNF** | Zero transitive dependencies | Decoupled login credentials in `users` from student profile in `students`. Derived `total_hours` completely removed and computed via views. |

### The ACID Transaction Code on the Poster
```sql
START TRANSACTION;
-- 1. Shared lock on active policy
SELECT * FROM certificate_policies WHERE policy_id = 1 FOR SHARE;
-- 2. Exclusive lock on candidate student
SELECT * FROM students WHERE student_id = 4 FOR UPDATE;

-- 3. Verify threshold (>= 1,200 mins) and prevent double issuance
IF v_approved_minutes < 1200 THEN 
    ROLLBACK; 
END IF;
IF v_active_cert_count > 0 THEN 
    ROLLBACK; 
END IF;

-- 4. Insert immutable certificate snapshot and commit
INSERT INTO certificates (student_id, policy_id, verification_token, ...)
VALUES (4, 1, SHA2(CONCAT(UUID(), NOW()), 256), ...);
COMMIT;
```

---

# 4. Summary of Poster Files

* **PDF Poster:** [`docs/outputs/Event_Volunteer_Hour_Ledger_Research_Poster.pdf`](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/docs/outputs/Event_Volunteer_Hour_Ledger_Research_Poster.pdf)  
  *(Ready to print at any print shop on A1 / A2 / A0 paper or conference poster board).*
* **HTML Poster:** [`docs/poster.html`](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/docs/poster.html)  
  *(Ready to present on a TV, monitor, or projector screen; fully responsive and crisp).*
* **Python Generator:** [`docs/generate_poster_pdf.py`](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/docs/generate_poster_pdf.py)  
  *(Source script to re-generate the PDF poster).*
