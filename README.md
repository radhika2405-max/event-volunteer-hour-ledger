# ADIKALA LEDGER — Event Volunteer Hour Ledger
### Volunteer Hours, Verification & Certificate Eligibility Management System
**Institution:** CHRIST (Deemed to be University), Delhi NCR Campus | School of Sciences  
**Parent Organization:** ADIKALA (Izhaar Kala Ka)  
**Constituent Sub-Clubs:** Dance, Emcee, Technical, Creative, Music, Hospitality  

---

## 🚀 Live Demo & Submission Access

The project can be opened and evaluated on **any laptop, tablet, or phone** without any local setup:

👉 **Live Web Application:** [https://radhika2405-max.github.io/event-volunteer-hour-ledger/](https://radhika2405-max.github.io/event-volunteer-hour-ledger/)  
👉 **Public Certificate Verifier:** [https://radhika2405-max.github.io/event-volunteer-hour-ledger/#/verify](https://radhika2405-max.github.io/event-volunteer-hour-ledger/#/verify)  
👉 **1-Click Offline Preview:** Double-click `start_preview.bat` (Windows) or `./start_preview.sh` (macOS/Linux)  

---

## 1. Project Overview & Problem Statement
College volunteer contributions are vital to academic symposia, hackathons, and cultural fests. However, traditional paper sheets or unnormalized spreadsheets suffer from lost updates, unverified hours, join inflation across multi-club collaborations, and unauthorized certificate issuance.

The **Event Volunteer Hour Ledger** is a complete, production-style Database Management Systems (DBMS) project. It models student volunteer hours as an immutable relational ledger, enforces 3NF normalization, calculates authoritative cumulative hours using SQL aggregation, automatically evaluates threshold eligibility (default: 20 approved hours), and issues tamper-proof downloadable PDF certificates with public cryptographic verification tokens.

---

## 2. Technology Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, React Router.
- **Backend:** Python 3.14, Flask, Flask-CORS, Flask-JWT-Extended, SQLAlchemy, PyMySQL, Cryptography, ReportLab.
- **Database:** MySQL 8.x (Normalized 3NF relational schema, views, triggers, stored procedures, ACID transactions).
- **Testing:** `pytest` (Backend integration and unit test suite).

---

## 3. Quick Demo Logins

The application features **1-Click Quick Demo Login** buttons on the login page:

| Role | Email | Password | Primary Scope |
|---|---|---|---|
| **Administrator** | `admin@christuniversity.in` | `Admin@123` | System management, audit logs, policy thresholds, administrative hour corrections. |
| **Event Coordinator** | `coordinator@christuniversity.in` | `Coord@123` | Create events, register volunteers, log volunteer timesheets. |
| **Faculty Approver** | `faculty@christuniversity.in` | `Faculty@123` | Review pending queue, approve/reject hours with reason, authorize certificates. |
| **Sub-club Lead (Tech)** | `lead.tech@christuniversity.in` | `Lead@123` | View assigned sub-club scope (Technical Wing), monitor participant timesheets. |
| **Volunteer A** | `student.a@christuniversity.in` | `Student@123` | **Student A:** 18.0 approved hours (Ineligible against 20h threshold). |
| **Volunteer B** | `student.b@christuniversity.in` | `Student@123` | **Student B:** 20.0 approved hours (Eligible for honors certificate). |

---

## 4. Installation & Setup Instructions

### Prerequisites
- Python 3.10+ (Installed and available as `python`)
- Node.js 18+ and `npm`
- MySQL 8.x running locally on port 3306

### Step 1: Database Initialization
1. Configure credentials in `.env` (or copy from `.env.example`):
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=event_volunteer_ledger
   ```
2. Execute the database initialization script or apply SQL files in order:
   ```bash
   # From project root:
   mysql -u root -p < database/schema.sql
   mysql -u root -p event_volunteer_ledger < database/views.sql
   mysql -u root -p event_volunteer_ledger < database/triggers.sql
   mysql -u root -p event_volunteer_ledger < database/procedures.sql
   mysql -u root -p event_volunteer_ledger < database/indexes.sql
   mysql -u root -p event_volunteer_ledger < database/seed.sql
   ```

### Step 2: Running the Backend Server
```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```
*Backend starts on `http://localhost:5000` with REST endpoints prefixed at `/api/v1`.*

### Step 3: Running the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*Frontend opens at `http://localhost:5173`.*

---

## 5. Running Automated Tests

Run the full backend integration and scenario test suite via `pytest`:
```bash
cd backend
python -m pytest tests/test_backend.py -v
```
**Test Results:** 18 out of 18 test cases pass, validating authentication, RBAC boundaries, threshold calculations, rejection reasoning, idempotent certificate issuance, PDF generation, and CSV reporting.

---

## 6. Signature Feature: Automatic Certificate Eligibility Report

Access via **Eligibility Report** in the sidebar navigation:
- **Filters:** Academic Year, Programme, Event, Sub-club Wing, Policy, Min Hours, Eligibility State, Student Search.
- **Authoritative Metrics:** Summarizes Eligible, Ineligible, Pending Review, and Certificate Issued counts without double-counting.
- **Export to CSV:** Direct CSV download formatted for institutional archival.
- **Print View:** Clean print stylesheet for formal academic reporting.

---

## 7. Public Certificate Verification Portal

Visit `http://localhost:5173/verify`:
- Enter any cryptographic certificate verification token.
- **Demo Valid Token:** `d3b07384d113edec49eaa6238ad5ff00b98e1a78` (Eshan Gupta, 22.0 hrs).
- **Demo Revoked Token:** `c4ca4238a0b923820dcc509a6f75849b23820dcc` (Fatima Khan, Revocation audit reason displayed).

---

## 8. Academic Viva Reference Questions & Answers

### Q1: Why was this project selected for a DBMS implementation?
**Ans:** Volunteer management is a classic problem requiring relational integrity. It necessitates strict entity relationships (many-to-many event/sub-club collaborations), immutable audit trails, discrete time-interval logging rather than editable totals, and automated aggregation to determine threshold-based milestones.

### Q2: How is Normalization applied in this schema?
**Ans:** 
- **1NF:** Composite primary keys (`event_subclubs`) eliminate repeating multi-value columns for collaborating sub-clubs.
- **2NF:** Non-key attributes are fully functionally dependent on surrogate and candidate keys; event properties are decoupled from participation junction records.
- **3NF:** Authentication (`users`) is separated from academic identity (`students`). Derived fields like `total_hours` are completely excluded from tables and computed dynamically via views, eliminating update anomalies.

### Q3: Why are hours stored as entries instead of an editable total column?
**Ans:** An editable total column violates 3NF, lacks historical provenance, and is vulnerable to race conditions and lost updates. By recording each interval as a separate ledger entry in `volunteer_hour_entries`, every minute has an audited start time, end time, reviewer, and status.

### Q4: How do SUM and GROUP BY calculate cumulative hours accurately?
**Ans:** 
$$H_s = \frac{\sum \text{verified\_minutes}}{60.0}$$
Using `SUM(CASE WHEN submission_status IN ('approved', 'corrected') THEN verified_minutes ELSE 0 END)` grouped by `student_id`, only approved time contributes to certified hours, while pending and rejected entries are strictly isolated.

### Q5: How do triggers differ from stored procedures?
**Ans:** 
- **Triggers** (`triggers.sql`) run automatically in response to database events (`BEFORE INSERT`, `AFTER UPDATE`). We use triggers to enforce mandatory rejection reasons and write automatic audit records.
- **Stored Procedures** (`procedures.sql`) are invoked explicitly by name with parameters (e.g., `sp_issue_certificate`), allowing multi-step business logic wrapped in transactions.

### Q6: Why is a SQL View useful here?
**Ans:** Views like `vw_certificate_eligibility` provide a clean abstraction layer. Frontend and report queries interact with a consistent view that computes threshold comparisons and state logic without having to rewrite complex multi-table joins and conditional aggregations across multiple application routes.

### Q7: How do database transactions protect certificate issuance?
**Ans:** `sp_issue_certificate` uses `START TRANSACTION`, obtains row-level locks (`FOR SHARE` on policy, `FOR UPDATE` on hours), verifies threshold compliance and uniqueness, creates the certificate record, and commits. If any check fails, it executes `ROLLBACK`, guaranteeing that invalid or duplicate certificates are never created.

### Q8: What happens when an approved hour entry is corrected?
**Ans:** The administrator performs an audited correction via `POST /api/v1/hours/:id/correct`. The entry status becomes `corrected`, `correction_notes` are mandated, and an audit entry is inserted capturing the before and after verified minutes. Views immediately reflect the recalculated total.

### Q9: Why cannot pending hours count toward certificate eligibility?
**Ans:** Pending hours represent proposed work that has not undergone verification by authorized faculty. Allowing unreviewed hours to count would compromise institutional standards and reward unverified claims.

---

## 11. Academic PDF & Research Deliverables

The project includes pre-compiled, publication-grade academic PDF documents in `docs/outputs/`:

1. **`Event_Volunteer_Hour_Ledger_Research_Poster.pdf`**: Publication-grade Academic Conference Research Poster (A1 Landscape: 841mm x 594mm / 2384pt x 1684pt).
2. **`Event_Volunteer_Hour_Ledger_Presentation.pdf`**: Complete 12-slide presentation deck with structured speaker notes and Viva Voce defense guide.
3. **`Event_Volunteer_Hour_Ledger_Academic_Project_Report.pdf`**: Formal 18-section academic project report following CHRIST University format (Certificate of approval, 3NF normalization, ER diagrams, 10 table schema, 5 views, triggers, ACID proof, analytical queries).
4. **`docs/poster.html`**: Interactive, responsive, printable web research poster for browser display, projectors, and ultra-high-DPI printing (`Ctrl + P`).

To re-generate all PDFs from source:
```bash
python docs/generate_poster_pdf.py
python docs/generate_presentation_pdf.py
python docs/generate_report_pdf.py
```
