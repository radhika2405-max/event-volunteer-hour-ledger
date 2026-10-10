# Event Volunteer Hour Ledger — REST API Documentation
**Institution:** CHRIST (Deemed to be University), Delhi NCR Campus | School of Sciences  
**Parent Organization:** AADIKALA (Dance, Emcee, Technical, Creative, Music, Hospitality)  
**API Version:** v1 (`/api/v1`)  
**Base URL:** `http://localhost:5000/api/v1`

---

## 1. Authentication & Session

### `POST /api/v1/auth/login`
- **Description:** Authenticates user via institutional email and password hash verification.
- **Request Body:**
  ```json
  {
    "email": "faculty@christuniversity.in",
    "password": "Faculty@123"
  }
  ```
- **Responses:**
  - `200 OK`: Returns JWT `access_token` and user profile object.
  - `401 Unauthorized`: Invalid credentials.
  - `403 Forbidden`: Account inactive or suspended.

### `POST /api/v1/auth/logout`
- **Description:** Invalidates local session token.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `200 OK`

### `GET /api/v1/auth/me`
- **Description:** Returns authenticated user profile, assigned roles, and student profile if mapped.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `200 OK`

---

## 2. Students & Academic Identity

### `GET /api/v1/students`
- **Access:** Administrator, Coordinator, Faculty Approver, Sub-club Lead (Scoped: Volunteer only sees own profile).
- **Query Parameters:** `search`, `programme`, `academic_year`, `page`, `limit`
- **Response:** `200 OK` with paginated list of students.

### `GET /api/v1/students/:id`
- **Access:** Authorized staff or the authenticated student themselves.
- **Response:** `200 OK` with complete participation history and aggregate approved/pending hours.
- **Security:** Insecure direct object references (IDOR) blocked for volunteers viewing other students (`403 Forbidden`).

### `POST /api/v1/students`
- **Access:** Administrator only.
- **Request Body:** `university_registration_number`, `full_name`, `email`, `programme`, `academic_year`, `section`
- **Response:** `201 Created`

---

## 3. Campus Events Management

### `GET /api/v1/events`
- **Query Parameters:** `status` (`published`, `completed`, `draft`)
- **Response:** `200 OK` with event list, participating sub-clubs, volunteer counts, and approved hours.

### `GET /api/v1/events/:id`
- **Response:** `200 OK` with event details and volunteer roster.

### `POST /api/v1/events`
- **Access:** Administrator, Event Coordinator.
- **Request Body:**
  ```json
  {
    "event_name": "Science Exhibition 2026",
    "event_code": "EVT-SCI-2026",
    "venue": "Main Quadrangle",
    "description": "Annual tech exhibits",
    "start_datetime": "2026-01-20T09:00:00",
    "end_datetime": "2026-01-21T16:30:00",
    "sub_club_ids": [4, 5, 7]
  }
  ```
- **Validation:** Enforces `end_datetime > start_datetime` and unique `event_code`.

---

## 4. Volunteer Participation & Registrations

### `POST /api/v1/events/:id/volunteers`
- **Access:** Administrator, Coordinator.
- **Request Body:**
  ```json
  {
    "student_id": 5,
    "assigned_club_id": 4,
    "assigned_role": "Audio Visual Support"
  }
  ```
- **Integrity Rule:** Duplicate active registrations for the same event/student pair are rejected (`409 Conflict`).

### `GET /api/v1/participations`
- **Access:** Filterable by `event_id` or `student_id`.

---

## 5. Authoritative Hour Ledger

### `POST /api/v1/hours`
- **Access:** Administrator, Event Coordinator.
- **Request Body:**
  ```json
  {
    "participation_id": 1,
    "work_date": "2026-03-20",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "break_minutes": 30
  }
  ```
- **Behavior:** Status initialized as `pending`. Validates non-negative breaks and positive duration.

### `GET /api/v1/hours`
- **Query Parameters:** `status` (`pending`, `approved`, `rejected`, `corrected`), `student_id`, `event_id`.
- **Scoping:** Volunteers can only see their own hours.

### `POST /api/v1/hours/:id/approve`
- **Access:** Administrator, Faculty Approver.
- **Behavior:** Transitions entry from `pending` to `approved`, sets `verified_minutes = claimed_minutes`, records `reviewed_by`, and triggers database audit logging.

### `POST /api/v1/hours/:id/reject`
- **Access:** Administrator, Faculty Approver.
- **Request Body:** `{"reason": "Mandatory explanation"}`
- **Validation:** Rejection without a reason is rejected with `400 Bad Request`.

### `POST /api/v1/hours/:id/correct`
- **Access:** Administrator only.
- **Request Body:**
  ```json
  {
    "verified_minutes": 360,
    "correction_notes": "Audited: Deducted 2 unrecorded absence hours verified by log"
  }
  ```
- **Behavior:** Sets status to `corrected`, preserves history, and writes before/after state to `audit_logs`.

---

## 6. Signature Feature: Eligibility Report

### `GET /api/v1/reports/certificate-eligibility`
- **Access:** Administrator, Coordinator, Approver, Club Lead.
- **Query Parameters:** `academic_year`, `programme`, `event_id`, `club_id`, `policy_id`, `min_hours`, `status`, `search`, `export=csv`.
- **Calculation:** Authoritative calculation via `vw_certificate_eligibility`. Eliminates multi-club join inflation.
- **Responses:**
  - `200 OK` (JSON): Metadata, summary metrics, and candidate rows.
  - `200 OK` (CSV): Formatted CSV attachment with headers when `export=csv`.

---

## 7. Certificate Issuance & Public Verification

### `POST /api/v1/certificates/issue`
- **Access:** Administrator, Faculty Approver.
- **Request Body:** `{"student_id": 2, "policy_id": 1}`
- **Integrity Rule:** Atomically verifies approved hours $\ge$ policy threshold. Idempotent: duplicate requests return existing certificate without reissuance.

### `GET /api/v1/certificates/:id/download`
- **Access:** Authorized staff or the recipient student.
- **Response:** Binary PDF stream generated via ReportLab in A4 Landscape.

### `GET /api/v1/certificates/verify/:token`
- **Access:** PUBLIC (No authentication required).
- **Description:** Verifies authenticity of certificate by unique cryptographic token.
- **Response:**
  ```json
  {
    "verification_status": "VALID",
    "certificate_number": "CHRIST/AADIKALA/2026/0005-7821",
    "student_name": "Eshan Gupta",
    "programme": "BCA",
    "institution": "CHRIST (Deemed to be University), Delhi NCR Campus",
    "school": "School of Sciences",
    "verified_volunteer_hours": 22.0,
    "issued_at": "2026-02-15",
    "certificate_status": "issued"
  }
  ```
  *(Returns `REVOKED` or `NOT_FOUND` as appropriate. Never exposes internal user IDs or passwords).*

### `POST /api/v1/certificates/:id/revoke`
- **Access:** Administrator only.
- **Request Body:** `{"reason": "Documented audit reason"}`
- **Behavior:** Updates status to `revoked`, marks record invalid for public verification, and writes audit trail.

---

## 8. Administration & Audit

### `GET /api/v1/admin/audit-logs`
- **Access:** Administrator only.
- **Response:** Paginated security and change events.

### `GET /api/v1/admin/certificate-policies`
- **Response:** Configured thresholds and scopes.

### `PATCH /api/v1/admin/certificate-policies/:id`
- **Access:** Administrator only.
- **Request Body:** `{"minimum_approved_minutes": 1200, "status": "active"}`
