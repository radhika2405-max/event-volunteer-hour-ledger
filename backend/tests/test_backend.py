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
    assert data['eligibility_state'] == 'Eligible - Awaiting Certificate Approval'

def test_student_c_pending_hours_excluded_from_approved_totals(client, faculty_token):
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
