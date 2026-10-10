import os
import hashlib
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file, Response
from flask_jwt_extended import jwt_required
from app.db import get_db
from app.models import Certificate, CertificatePolicy, Student, EventVolunteer, VolunteerHourEntry, AuditLog
from app.permissions.rbac import role_required, get_current_user_context
from app.services.pdf_service import generate_certificate_pdf
from config import Config
from sqlalchemy import func

certificates_bp = Blueprint('certificates', __name__, url_prefix='/api/v1/certificates')

@certificates_bp.route('/issue', methods=['POST'])
@role_required(['admin', 'approver'])
def issue_certificate():
    ctx = get_current_user_context()
    data = request.get_json() or {}
    student_id = data.get('student_id')
    policy_id = data.get('policy_id', 1)

    if not student_id:
        return jsonify({'error': 'student_id is required'}), 400

    with get_db() as session:
        student = session.query(Student).get(student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        policy = session.query(CertificatePolicy).get(policy_id)
        if not policy or policy.status != 'active':
            return jsonify({'error': 'Active certificate policy not found'}), 400

        # Check existing active certificate for this policy
        existing_cert = session.query(Certificate).filter_by(
            student_id=student_id, policy_id=policy_id, certificate_status='issued'
        ).first()
        if existing_cert:
            return jsonify({
                'message': 'Certificate already issued for this policy',
                'certificate': existing_cert.to_dict()
            }), 200

        # Calculate authoritative verified hours
        approved_mins = float(session.query(func.coalesce(func.sum(VolunteerHourEntry.verified_minutes), 0))\
            .join(EventVolunteer, VolunteerHourEntry.participation_id == EventVolunteer.participation_id)\
            .filter(EventVolunteer.student_id == student_id, VolunteerHourEntry.submission_status.in_(['approved', 'corrected']))\
            .scalar())

        if approved_mins < policy.minimum_approved_minutes:
            return jsonify({
                'error': f'Student has {round(approved_mins/60.0, 2)} approved hours, which does not meet threshold {round(policy.minimum_approved_minutes/60.0, 2)} hours.'
            }), 400

        # Generate unique certificate number & token
        now_str = datetime.now().strftime('%Y%m%d%H%M%S')
        cert_num = f"CHRIST/AADIKALA/2026/{student_id:04d}-{now_str[-4:]}"
        token = hashlib.sha256(f"{cert_num}:{student_id}:{now_str}".encode()).hexdigest()

        cert = Certificate(
            student_id=student_id,
            policy_id=policy_id,
            certificate_number=cert_num,
            eligibility_snapshot_minutes=int(approved_mins),
            issued_at=datetime.now(),
            issued_by=ctx['user_id'],
            certificate_status='issued',
            verification_token=token
        )
        session.add(cert)
        session.flush()

        # Audit log
        session.add(AuditLog(
            actor_user_id=ctx['user_id'],
            action='CERTIFICATE_ISSUED',
            entity_type='certificates',
            entity_id=cert.certificate_id,
            before_state=None,
            after_state={'certificate_number': cert_num, 'student_id': student_id, 'hours': round(approved_mins / 60.0, 2)},
            reason=f'Certificate authorized and issued under policy {policy.policy_name}'
        ))

        return jsonify({
            'message': 'Certificate successfully issued',
            'certificate': cert.to_dict()
        }), 201


@certificates_bp.route('', methods=['GET'])
@jwt_required()
def list_certificates():
    ctx = get_current_user_context()
    user_role = ctx['role']
    student_id = request.args.get('student_id')

    # Security scoping: Student can only view their own certificates
    if user_role == 'volunteer':
        student_id = ctx['student_id']

    with get_db() as session:
        query = session.query(Certificate)
        if student_id:
            query = query.filter(Certificate.student_id == int(student_id))

        certs = query.order_by(Certificate.issued_at.desc()).all()
        return jsonify({'items': [c.to_dict() for c in certs], 'total': len(certs)}), 200


@certificates_bp.route('/<int:cert_id>/download', methods=['GET'])
@jwt_required()
def download_certificate(cert_id):
    ctx = get_current_user_context()
    with get_db() as session:
        cert = session.query(Certificate).get(cert_id)
        if not cert:
            return jsonify({'error': 'Certificate not found'}), 404

        # Security check: Student cannot download another student's certificate
        if ctx['role'] == 'volunteer' and cert.student_id != ctx['student_id']:
            return jsonify({'error': 'Forbidden: You cannot download another student certificate'}), 403

        cert_dict = cert.to_dict()
        pdf_bytes = generate_certificate_pdf(cert_dict)

        filename = f"Certificate_{cert.certificate_number.replace('/', '_')}.pdf"
        return Response(
            pdf_bytes,
            mimetype='application/pdf',
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )


@certificates_bp.route('/verify/<string:token>', methods=['GET'])
def public_verify_certificate(token):
    """
    Public verification endpoint - No authentication required.
    Does NOT leak private identifiers. Returns validity status, recipient, hours, and issue date.
    """
    with get_db() as session:
        cert = session.query(Certificate).filter_by(verification_token=token).first()
        if not cert:
            return jsonify({
                'verification_status': 'NOT_FOUND',
                'message': 'No certificate corresponds to this verification token.'
            }), 404

        return jsonify({
            'verification_status': 'VALID' if cert.certificate_status == 'issued' else 'REVOKED',
            'certificate_number': cert.certificate_number,
            'student_name': cert.student.user.full_name,
            'programme': cert.student.programme,
            'institution': 'CHRIST (Deemed to be University), Delhi NCR Campus',
            'school': 'School of Sciences',
            'organization': 'AADIKALA Volunteer Honor Ledger',
            'policy_name': cert.policy.policy_name,
            'verified_volunteer_hours': cert.to_dict()['eligibility_snapshot_hours'],
            'issued_at': cert.issued_at.strftime('%Y-%m-%d') if cert.issued_at else None,
            'certificate_status': cert.certificate_status,
            'revocation_reason': cert.revocation_reason if cert.certificate_status == 'revoked' else None
        }), 200


@certificates_bp.route('/<int:cert_id>/revoke', methods=['POST'])
@role_required(['admin'])
def revoke_certificate(cert_id):
    ctx = get_current_user_context()
    data = request.get_json() or {}
    reason = data.get('reason', '').strip()

    if not reason:
        return jsonify({'error': 'A clear revocation reason is mandatory'}), 400

    with get_db() as session:
        cert = session.query(Certificate).get(cert_id)
        if not cert:
            return jsonify({'error': 'Certificate not found'}), 404

        if cert.certificate_status == 'revoked':
            return jsonify({'error': 'Certificate is already revoked'}), 400

        cert.certificate_status = 'revoked'
        cert.revocation_reason = reason
        session.flush()

        session.add(AuditLog(
            actor_user_id=ctx['user_id'],
            action='CERTIFICATE_REVOKED',
            entity_type='certificates',
            entity_id=cert.certificate_id,
            before_state={'status': 'issued'},
            after_state={'status': 'revoked', 'reason': reason},
            reason=reason
        ))

        return jsonify({
            'message': 'Certificate revoked successfully',
            'certificate': cert.to_dict()
        }), 200
