# Test Plan and Quality Assurance Report
**Project:** Event Volunteer Hour Ledger  
**Institution:** CHRIST (Deemed to be University), Delhi NCR Campus | School of Sciences  
**Test Suite:** pytest Backend Integration & Unit Tests  

---

## 1. Test Execution Commands & Results

### Command Executed:
```bash
python -m pytest "backend/tests/test_backend.py" -v
```

### Actual Terminal Execution Output:
```text
============================= test session starts =============================
platform win32 -- Python 3.14.3, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\Hp\Downloads\event-volunteer-hour-ledger\backend
collected 18 items

tests/test_backend.py::test_valid_and_invalid_login PASSED               [  5%]
tests/test_backend.py::test_unauthenticated_api_access PASSED            [ 11%]
tests/test_backend.py::test_student_cannot_access_other_student_record PASSED [ 16%]
tests/test_backend.py::test_student_cannot_approve_hours PASSED          [ 22%]
tests/test_backend.py::test_student_cannot_access_admin_audit_logs PASSED [ 27%]
tests/test_backend.py::test_student_a_ineligible_at_18_hours PASSED      [ 33%]
tests/test_backend.py::test_student_b_eligible_at_20_hours PASSED        [ 38%]
tests/test_backend.py::test_student_c_pending_hours_excluded_from_approved_totals PASSED [ 44%]
tests/test_backend.py::test_student_d_eligible_at_24_hours PASSED        [ 50%]
tests/test_backend.py::test_negative_break_and_invalid_duration_rejected PASSED [ 55%]
tests/test_backend.py::test_rejection_requires_reason PASSED             [ 61%]
tests/test_backend.py::test_ineligible_student_cannot_be_issued_certificate PASSED [ 66%]
tests/test_backend.py::test_eligible_student_can_be_issued_certificate PASSED [ 72%]
tests/test_backend.py::test_public_certificate_verification PASSED       [ 77%]
tests/test_backend.py::test_revoked_certificate_verification PASSED      [ 83%]
tests/test_backend.py::test_certificate_download_pdf PASSED              [ 88%]
tests/test_backend.py::test_certificate_eligibility_report PASSED        [ 94%]
tests/test_backend.py::test_report_csv_export PASSED                     [100%]

======================= 18 passed in 4.88s ========================
```

---

## 2. Test Verification Matrix

| Category | Test Case | Test Scenario & Verification | Status |
|---|---|---|---|
| **Authentication** | `test_valid_and_invalid_login` | Validates rejection of incorrect credentials (HTTP 401) and issuance of JWT token for valid credentials. | **PASSED** |
| **Authentication** | `test_unauthenticated_api_access` | Asserts that accessing protected API routes without Bearer token returns HTTP 401. | **PASSED** |
| **Authorization (RBAC)** | `test_student_cannot_access_other_student_record` | Prevents IDOR: Student A attempting to query Student B's profile returns HTTP 403 Forbidden. | **PASSED** |
| **Authorization (RBAC)** | `test_student_cannot_approve_hours` | Asserts volunteers cannot invoke faculty approval endpoints (HTTP 403 Forbidden). | **PASSED** |
| **Authorization (RBAC)** | `test_student_cannot_access_admin_audit_logs` | Confirms volunteers cannot view administrative audit logs (HTTP 403 Forbidden). | **PASSED** |
| **Mandatory Scenario** | `test_student_a_ineligible_at_18_hours` | **Student A:** 7h + 6h + 5h = 18.0h. Verifies eligibility is `'Not Eligible'` against 20h threshold. | **PASSED** |
| **Mandatory Scenario** | `test_student_b_eligible_at_20_hours` | **Student B:** 8h + 7h + 5h = 20.0h. Verifies eligibility is `'Eligible - Awaiting Certificate Approval'`. | **PASSED** |
| **Mandatory Scenario** | `test_student_c_pending_hours_excluded_from_approved_totals` | **Student C:** 18h approved + 5h pending. Asserts pending hours DO NOT count toward approved hours; status is `'Pending Hours Review'`. | **PASSED** |
| **Mandatory Scenario** | `test_student_d_eligible_at_24_hours` | **Student D:** 24.0h approved. Confirms eligible status for high-hour contributors. | **PASSED** |
| **Data Integrity** | `test_negative_break_and_invalid_duration_rejected` | Submitting negative breaks or end time before start time is rejected with HTTP 400. | **PASSED** |
| **State Transitions** | `test_rejection_requires_reason` | Rejecting an hour entry without a mandatory reason fails with HTTP 400 Bad Request. | **PASSED** |
| **Certificate Rules** | `test_ineligible_student_cannot_be_issued_certificate` | Attempting to issue a certificate to Student A (18 hours) is rejected with HTTP 400. | **PASSED** |
| **Certificate Rules** | `test_eligible_student_can_be_issued_certificate` | Certificate issuance succeeds for Student B (20 hours), capturing eligibility snapshot. | **PASSED** |
| **Public Verification** | `test_public_certificate_verification` | Queries token without auth; returns `VALID`, recipient name, hours, and issue date without private IDs. | **PASSED** |
| **Public Verification** | `test_revoked_certificate_verification` | Queries revoked certificate token; returns `REVOKED` status and audited reason. | **PASSED** |
| **PDF Generation** | `test_certificate_download_pdf` | Asserts ReportLab generates valid binary PDF stream (`application/pdf`) with size > 1KB. | **PASSED** |
| **Reports** | `test_certificate_eligibility_report` | Verifies dynamic eligibility report reflects database records across $\ge 20$ volunteers. | **PASSED** |
| **Reports** | `test_report_csv_export` | Asserts `export=csv` produces valid downloadable CSV file with appropriate headers and student rows. | **PASSED** |

---

## 3. Production Frontend Build Verification

### Command Executed:
```bash
npm run build (in frontend/)
```

### Result:
- `tsc` completed with zero TypeScript errors.
- Vite transformed 2,221 modules and emitted `dist/` bundle in 1m 6s.
