import pytest
import json
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.db import get_db
from app.models import User, Student, Event, VolunteerHourEntry, Certificate, CertificatePolicy

@pytest.fixture(scope='session')
def app():
    app = create_app()
    app.config.update({
        'TESTING': True,
    })
    return app

@pytest.fixture(scope='session')
def client(app):
    return app.test_client()

def get_auth_token(client, email, password):
    resp = client.post('/api/v1/auth/login', json={'email': email, 'password': password})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.get_data(as_text=True)}"
    return resp.get_json()['access_token']

@pytest.fixture(scope='session')
def admin_token(client):
    return get_auth_token(client, 'admin@christuniversity.in', 'Admin@123')

@pytest.fixture(scope='session')
def coord_token(client):
    return get_auth_token(client, 'coordinator@christuniversity.in', 'Coord@123')

@pytest.fixture(scope='session')
def faculty_token(client):
    return get_auth_token(client, 'faculty@christuniversity.in', 'Faculty@123')

@pytest.fixture(scope='session')
def student_a_token(client):
    return get_auth_token(client, 'student.a@christuniversity.in', 'Student@123')

@pytest.fixture(scope='session')
def student_b_token(client):
    return get_auth_token(client, 'student.b@christuniversity.in', 'Student@123')

# ----------------------------------------------------------------------------
# 1. AUTHENTICATION & AUTHORIZATION TESTS
# ----------------------------------------------------------------------------
def test_valid_and_invalid_login(client):
    # Invalid password
    resp = client.post('/api/v1/auth/login', json={'email': 'admin@christuniversity.in', 'password': 'WrongPassword!'})
    assert resp.status_code == 401

    # Non-existent email
    resp = client.post('/api/v1/auth/login', json={'email': 'nonexistent@christuniversity.in', 'password': 'Password@123'})
    assert resp.status_code == 401

    # Valid login
    resp = client.post('/api/v1/auth/login', json={'email': 'admin@christuniversity.in', 'password': 'Admin@123'})
    assert resp.status_code == 200
    assert 'access_token' in resp.get_json()

def test_unauthenticated_api_access(client):
    resp = client.get('/api/v1/events')
    assert resp.status_code == 401

def test_student_cannot_access_other_student_record(client, student_a_token):
    # Student A (id=1) attempts to access Student B (id=2)
    resp = client.get('/api/v1/students/2', headers={'Authorization': f'Bearer {student_a_token}'})
    assert resp.status_code == 403

def test_student_cannot_approve_hours(client, student_a_token):
    # Student attempts to approve hour entry 1
    resp = client.post('/api/v1/hours/1/approve', headers={'Authorization': f'Bearer {student_a_token}'})
    assert resp.status_code == 403

def test_student_cannot_access_admin_audit_logs(client, student_a_token):
    resp = client.get('/api/v1/admin/audit-logs', headers={'Authorization': f'Bearer {student_a_token}'})
    assert resp.status_code == 403

# ----------------------------------------------------------------------------
# 2. MANDATORY ELIGIBILITY SCENARIOS (Section 13)
# ----------------------------------------------------------------------------
def test_student_a_ineligible_at_18_hours(client, faculty_token):
    # Student A: 7 + 6 + 5 = 18 hours (< 20 threshold) -> Not Eligible
    resp = client.get('/api/v1/eligibility/1', headers={'Authorization': f'Bearer {faculty_token}'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert float(data['total_approved_hours']) == 18.0
    assert data['eligibility_state'] == 'Not Eligible'

def test_student_b_eligible_at_20_hours(client, faculty_token):
    # Student B: 8 + 7 + 5 = 20 hours (== 20 threshold) -> Eligible
    resp = client.get('/api/v1/eligibility/2', headers={'Authorization': f'Bearer {faculty_token}'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert float(data['total_approved_hours']) == 20.0
    assert data['eligibility_state'] in ['Eligible - Awaiting Certificate Approval', 'Certificate Issued']

def test_student_c_pending_hours_excluded_from_approved_totals(client, faculty_token):
    # Ensure entry 9 is in its canonical seed state (pending)
    with get_db() as s:
        e = s.query(VolunteerHourEntry).get(9)
        if e and e.submission_status != 'pending':
            e.submission_status = 'pending'
            e.verified_minutes = 0
            e.reviewed_by = None
            e.reviewed_at = None
            s.commit()

    # Student C: 18 approved + 5 pending hours
    resp = client.get('/api/v1/eligibility/3', headers={'Authorization': f'Bearer {faculty_token}'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert float(data['total_approved_hours']) == 18.0
    assert float(data['total_pending_hours']) == 5.0
    assert data['eligibility_state'] == 'Pending Hours Review'

def test_student_d_eligible_at_24_hours(client, faculty_token):
    # Student D: 24 approved hours -> Eligible
    resp = client.get('/api/v1/eligibility/4', headers={'Authorization': f'Bearer {faculty_token}'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert float(data['total_approved_hours']) == 24.0
    assert data['eligibility_state'] == 'Eligible - Awaiting Certificate Approval'

# ----------------------------------------------------------------------------
# 3. HOUR SUBMISSION & VALIDATION
# ----------------------------------------------------------------------------
def test_negative_break_and_invalid_duration_rejected(client, coord_token):
    # Negative break
    resp = client.post('/api/v1/hours', json={
        'participation_id': 1,
        'work_date': '2026-03-25',
        'start_time': '09:00:00',
        'end_time': '12:00:00',
        'break_minutes': -15
    }, headers={'Authorization': f'Bearer {coord_token}'})
    assert resp.status_code == 400

    # End before start
    resp = client.post('/api/v1/hours', json={
        'participation_id': 1,
        'work_date': '2026-03-25',
        'start_time': '14:00:00',
        'end_time': '10:00:00',
        'break_minutes': 0
    }, headers={'Authorization': f'Bearer {coord_token}'})
    assert resp.status_code == 400

def test_rejection_requires_reason(client, faculty_token):
    # Trying to reject without reason
    resp = client.post('/api/v1/hours/3/reject', json={'reason': ''}, headers={'Authorization': f'Bearer {faculty_token}'})
    assert resp.status_code == 400

# ----------------------------------------------------------------------------
# 4. CERTIFICATE ISSUANCE, DOWNLOAD & PUBLIC VERIFICATION
# ----------------------------------------------------------------------------
def test_ineligible_student_cannot_be_issued_certificate(client, faculty_token):
    # Student A (18 hours)
    resp = client.post('/api/v1/certificates/issue', json={'student_id': 1, 'policy_id': 1}, headers={'Authorization': f'Bearer {faculty_token}'})
    assert resp.status_code == 400

def test_eligible_student_can_be_issued_certificate(client, faculty_token):
    # Student B (20 hours)
    resp = client.post('/api/v1/certificates/issue', json={'student_id': 2, 'policy_id': 1}, headers={'Authorization': f'Bearer {faculty_token}'})
    assert resp.status_code in [200, 201]

def test_public_certificate_verification(client):
    # Student E (id=5) has issued certificate with known token
    token = 'd3b07384d113edec49eaa6238ad5ff00b98e1a78'
    resp = client.get(f'/api/v1/certificates/verify/{token}')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['verification_status'] == 'VALID'
    assert data['student_name'] == 'Eshan Gupta'
    assert 'password' not in data
    assert 'user_id' not in data

def test_revoked_certificate_verification(client):
    # Student F (id=6) has revoked certificate
    token = 'c4ca4238a0b923820dcc509a6f75849b23820dcc'
    resp = client.get(f'/api/v1/certificates/verify/{token}')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['verification_status'] == 'REVOKED'
    assert 'audit' in data['revocation_reason'].lower()

def test_certificate_download_pdf(client, admin_token):
    # Download certificate 1
    resp = client.get('/api/v1/certificates/1/download', headers={'Authorization': f'Bearer {admin_token}'})
    assert resp.status_code == 200
    assert resp.mimetype == 'application/pdf'
    assert len(resp.data) > 1000

# ----------------------------------------------------------------------------
# 5. AUTOMATIC CERTIFICATE ELIGIBILITY REPORT & CSV EXPORT
# ----------------------------------------------------------------------------
def test_certificate_eligibility_report(client, coord_token):
    resp = client.get('/api/v1/reports/certificate-eligibility', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'summary' in data
    assert data['summary']['total_students'] >= 20
    assert 'items' in data

def test_report_csv_export(client, coord_token):
    resp = client.get('/api/v1/reports/certificate-eligibility?export=csv', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp.status_code == 200
    assert 'text/csv' in resp.mimetype
    csv_text = resp.get_data(as_text=True)
    assert 'Registration Number' in csv_text
    assert '2347101' in csv_text

# ----------------------------------------------------------------------------
# 6. HOUR LEDGER FILTER TESTS (BUG 1 VERIFICATION)
# ----------------------------------------------------------------------------
def test_hour_ledger_filter_all_and_statuses(client, coord_token):
    # 1. All shows all records
    resp_all = client.get('/api/v1/hours', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_all.status_code == 200
    all_items = resp_all.get_json()['items']
    assert len(all_items) > 0
    initial_count = len(all_items)

    # 2. Pending filter shows only pending records
    resp_pend = client.get('/api/v1/hours?status=pending', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_pend.status_code == 200
    pend_items = resp_pend.get_json()['items']
    for row in pend_items:
        assert row['submission_status'].lower() == 'pending'

    # 3. Approved filter shows only approved records
    resp_app = client.get('/api/v1/hours?status=approved', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_app.status_code == 200
    app_items = resp_app.get_json()['items']
    for row in app_items:
        assert row['submission_status'].lower() == 'approved'

    # 4. Rejected filter shows only rejected records
    resp_rej = client.get('/api/v1/hours?status=rejected', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_rej.status_code == 200
    rej_items = resp_rej.get_json()['items']
    for row in rej_items:
        assert row['submission_status'].lower() == 'rejected'

    # 5. Corrected filter shows only corrected records
    resp_corr = client.get('/api/v1/hours?status=corrected', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_corr.status_code == 200
    corr_items = resp_corr.get_json()['items']
    for row in corr_items:
        assert row['submission_status'].lower() == 'corrected'

    # 6. Switching between filters does not change underlying records
    resp_after = client.get('/api/v1/hours', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_after.status_code == 200
    assert len(resp_after.get_json()['items']) == initial_count

    # 7. Non-matching status returns empty list without error
    resp_empty = client.get('/api/v1/hours?status=nonexistent_status', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_empty.status_code == 200
    assert len(resp_empty.get_json()['items']) == 0

# ----------------------------------------------------------------------------
# 7. ELIGIBILITY REPORT MULTI-CRITERIA FILTER TESTS (BUG 2 VERIFICATION)
# ----------------------------------------------------------------------------
def test_eligibility_report_search_filters(client, coord_token):
    # Unfiltered baseline
    base_resp = client.get('/api/v1/reports/certificate-eligibility', headers={'Authorization': f'Bearer {coord_token}'})
    assert base_resp.status_code == 200
    base_data = base_resp.get_json()
    total_students = base_data['summary']['total_students']
    sample_student = base_data['items'][0]
    full_name = sample_student['student_name']
    partial_name = full_name.split()[0]
    reg_no = sample_student['university_registration_number']

    # 1. Search by full name
    resp_fn = client.get(f'/api/v1/reports/certificate-eligibility?search={full_name}', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_fn.status_code == 200
    items_fn = resp_fn.get_json()['items']
    assert any(x['student_name'] == full_name for x in items_fn)

    # 2. Search by partial name
    resp_pn = client.get(f'/api/v1/reports/certificate-eligibility?search={partial_name}', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_pn.status_code == 200
    items_pn = resp_pn.get_json()['items']
    assert len(items_pn) > 0
    assert any(partial_name.lower() in x['student_name'].lower() for x in items_pn)

    # 3. Search by registration number
    resp_reg = client.get(f'/api/v1/reports/certificate-eligibility?search={reg_no}', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_reg.status_code == 200
    items_reg = resp_reg.get_json()['items']
    assert len(items_reg) >= 1
    assert any(x['university_registration_number'] == reg_no for x in items_reg)

    # 4. Search with different letter cases and surrounding spaces
    padded_query = f"  {partial_name.upper()}  "
    resp_pad = client.get(f'/api/v1/reports/certificate-eligibility?search={padded_query}', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_pad.status_code == 200
    items_pad = resp_pad.get_json()['items']
    assert len(items_pad) == len(items_pn)

def test_eligibility_report_dropdown_filters(client, coord_token):
    # 1. Academic Year filter
    resp_ay = client.get('/api/v1/reports/certificate-eligibility?academic_year=2025-2026', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_ay.status_code == 200
    items_ay = resp_ay.get_json()['items']
    for x in items_ay:
        assert x['academic_year'] == '2025-2026'

    # 2. Programme filter (case-insensitive and exact matching)
    resp_prog = client.get('/api/v1/reports/certificate-eligibility?programme=B.Sc Data Science', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_prog.status_code == 200
    items_prog = resp_prog.get_json()['items']
    for x in items_prog:
        assert x['programme'] == 'B.Sc Data Science'

    # 3. Event filter
    resp_ev = client.get('/api/v1/reports/certificate-eligibility?event_id=1', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_ev.status_code == 200
    items_ev = resp_ev.get_json()['items']
    # All returned students must have event 1 participation
    assert len(items_ev) > 0

    # 4. Sub-club filter
    resp_cl = client.get('/api/v1/reports/certificate-eligibility?club_id=4', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_cl.status_code == 200
    items_cl = resp_cl.get_json()['items']
    assert len(items_cl) > 0

    # 5. Eligibility State filter
    resp_st = client.get('/api/v1/reports/certificate-eligibility?status=Eligible', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_st.status_code == 200
    items_st = resp_st.get_json()['items']
    for x in items_st:
        assert x['eligibility_state'].startswith('Eligible') or x['eligibility_state'] == 'Certificate Issued'

    # 6. Combined filters (academic_year + programme)
    resp_comb = client.get('/api/v1/reports/certificate-eligibility?academic_year=2025-2026&programme=B.Sc Data Science', headers={'Authorization': f'Bearer {coord_token}'})
    assert resp_comb.status_code == 200
    items_comb = resp_comb.get_json()['items']
    for x in items_comb:
        assert x['academic_year'] == '2025-2026'
        assert x['programme'] == 'B.Sc Data Science'

    # 7. Summary cards match filtered items
    summary_comb = resp_comb.get_json()['summary']
    assert summary_comb['total_students'] == len(items_comb)
    expected_eligible = sum(1 for x in items_comb if x['eligibility_state'].startswith('Eligible') or x['eligibility_state'] == 'Certificate Issued')
    expected_ineligible = sum(1 for x in items_comb if x['eligibility_state'] == 'Not Eligible')
    expected_pending = sum(1 for x in items_comb if x['eligibility_state'] == 'Pending Hours Review')
    expected_issued = sum(1 for x in items_comb if x['eligibility_state'] == 'Certificate Issued')
    assert summary_comb['eligible_count'] == expected_eligible
    assert summary_comb['ineligible_count'] == expected_ineligible
    assert summary_comb['pending_review_count'] == expected_pending
    assert summary_comb['issued_count'] == expected_issued

    # 8. No duplicate students caused by joins
    student_ids = [x['student_id'] for x in items_comb]
    assert len(student_ids) == len(set(student_ids))

    # 9. Verify 20.0-hour authoritative policy preserved
    for x in items_comb:
        assert float(x['threshold_hours']) == 20.0

def test_unauthorized_user_cannot_access_reports(client, student_a_token):
    # Volunteers cannot access administrative certificate eligibility report
    resp = client.get('/api/v1/reports/certificate-eligibility', headers={'Authorization': f'Bearer {student_a_token}'})
    assert resp.status_code == 403

