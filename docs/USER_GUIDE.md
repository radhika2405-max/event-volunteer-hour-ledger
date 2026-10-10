# User Guide — Event Volunteer Hour Ledger
**CHRIST (Deemed to be University), Delhi NCR Campus | School of Sciences**  
**Primary Organization:** AADIKALA

---

## 1. Quick Demonstration Access

For local evaluation, the application provides **1-Click Quick Demo Login** buttons directly on the login page (`http://localhost:5173/login`):

| Role | Pre-configured Email | Default Password | Primary Permissions |
|---|---|---|---|
| **System Administrator** | `admin@christuniversity.in` | `Admin@123` | Full access, user accounts, policy thresholds, administrative corrections, audit trail. |
| **Event Coordinator** | `coordinator@christuniversity.in` | `Coord@123` | Create events, register volunteers, log volunteer hours, view event statistics. |
| **Faculty Approver** | `faculty@christuniversity.in` | `Faculty@123` | Review pending hour submissions, approve/reject hours with reason, authorize certificates. |
| **Sub-club Lead (Tech)** | `lead.tech@christuniversity.in` | `Lead@123` | View assigned sub-club scope (Technical Wing), monitor participant timesheets. |
| **Student Volunteer A** | `student.a@christuniversity.in` | `Student@123` | Student A (18 hrs, Ineligible) — View personal progress toward 20-hour milestone. |
| **Student Volunteer B** | `student.b@christuniversity.in` | `Student@123` | Student B (20 hrs, Eligible) — Eligible volunteer awaiting certificate issuance. |

---

## 2. Core Workflows by Role

### 2.1 Event Coordinator Workflow
1. **Create an Event:**
   - Navigate to **Events** $\rightarrow$ click **+ Create New Event**.
   - Fill in Event Name, unique Code (e.g., `EVT-SCI-2026`), Venue, and Start/End datetimes.
   - Select collaborating sub-clubs (e.g. *Technical, Creative, Hospitality*). Click **Create Event**.
2. **Register a Volunteer:**
   - On the event card, click **+ Register**.
   - Select a student from the dropdown, designate their sub-club wing and assigned role.
   - Click **Confirm Registration** (duplicates are automatically prevented).
3. **Log Volunteer Hours:**
   - Navigate to **Hour Ledger** $\rightarrow$ click **+ Log Volunteer Hours**.
   - Select the student event assignment, work date, start time, end time, and break duration.
   - System auto-computes claimed duration. Click **Submit Hours** (saved as `pending`).

### 2.2 Faculty Approver Workflow
1. **Review Pending Queue:**
   - On the **Hour Ledger** page or **Dashboard**, unreviewed submissions appear in the **Pending Review Queue**.
2. **Approve Hours:**
   - Click **Approve**. The entry is immediately committed to verified totals, updating the student's eligibility.
3. **Reject Hours:**
   - Click **Reject**. A modal will prompt for the **Mandatory Rejection Reason** (e.g. *Absence reported during primary session*).
   - Enter reason and confirm. Rejection reason is recorded and visible to coordinators.

### 2.3 Signature Feature: Generating the Certificate Eligibility Report
1. Navigate to **Eligibility Report** in the sidebar.
2. Filter by:
   - **Academic Year** (e.g. `2025-2026`)
   - **Programme** (e.g. `B.Sc Data Science`, `BCA`)
   - **Event** or **Sub-club Wing**
   - **Eligibility State** (e.g. `Eligible - Awaiting Certificate Approval`, `Pending Hours Review`)
3. The KPI cards update dynamically to show counts of Eligible, Pending Review, Ineligible, and Issued students.
4. Click **Export CSV** to download a spreadsheet for department records.
5. Click **Print Report** for an academic formatted print layout.

### 2.4 Authorizing & Downloading Certificates
1. On the **Eligibility Report** or **Certificates** page, locate an eligible student (e.g., *Bhavna Patel*).
2. Click **Issue Certificate**.
   - The backend atomically checks that verified hours $\ge 20$, generates a unique certificate number (e.g. `CHRIST/AADIKALA/2026/0002-...`) and cryptographic token.
3. Once issued, click **PDF** to download the official A4 Landscape Certificate of Volunteer Contribution.

### 2.5 Public Verification Portal
1. Anyone (employers, faculty, evaluators) can visit `http://localhost:5173/verify`.
2. Enter the certificate token or click the quick demo buttons:
   - Click **Valid Cert Token** to see the green verified credential for Eshan Gupta (22 certified hours).
   - Click **Revoked Cert Token** to see the red revoked alert for Fatima Khan with official audit notes.
