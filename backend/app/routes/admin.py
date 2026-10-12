from flask import Blueprint, request, jsonify
from app.db import get_db
from app.models import AuditLog, CertificatePolicy, User, Student, Event, VolunteerHourEntry, Certificate
from app.permissions.rbac import role_required, get_current_user_context
from sqlalchemy import func, desc

admin_bp = Blueprint('admin', __name__, url_prefix='/api/v1/admin')

@admin_bp.route('/audit-logs', methods=['GET'])
@role_required(['admin'])
def list_audit_logs():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 50))
    action = request.args.get('action')
    entity_type = request.args.get('entity_type')

    with get_db() as session:
        query = session.query(AuditLog)
        if action:
            query = query.filter(AuditLog.action == action)
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)

        total = query.count()
        logs = query.order_by(AuditLog.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()

        return jsonify({
            'items': [l.to_dict() for l in logs],
            'total': total,
            'page': page,
            'limit': limit
        }), 200


@admin_bp.route('/certificate-policies', methods=['GET'])
@role_required(['admin', 'approver', 'coordinator'])
def list_policies():
    with get_db() as session:
        policies = session.query(CertificatePolicy).order_by(CertificatePolicy.policy_id.asc()).all()
        return jsonify({'items': [p.to_dict() for p in policies]}), 200


@admin_bp.route('/certificate-policies', methods=['POST'])
@role_required(['admin'])
def create_policy():
    ctx = get_current_user_context()
    data = request.get_json() or {}

    name = data.get('policy_name', '').strip()
    min_minutes = int(data.get('minimum_approved_minutes', 1200))
    scope_type = data.get('scope_type', 'all_events')
    effective_from = data.get('effective_from', '2026-01-01')

    if not name or min_minutes <= 0:
        return jsonify({'error': 'Valid policy name and positive minimum approved minutes are required'}), 400

    with get_db() as session:
        policy = CertificatePolicy(
            policy_name=name,
            minimum_approved_minutes=min_minutes,
            scope_type=scope_type,
            effective_from=effective_from,
            requires_faculty_approval=True,
            status='active',
            created_by=ctx['user_id']
        )
        session.add(policy)
        session.flush()

        session.add(AuditLog(
            actor_user_id=ctx['user_id'],
            action='POLICY_CREATED',
            entity_type='certificate_policies',
            entity_id=policy.policy_id,
            before_state=None,
            after_state=policy.to_dict(),
            reason=f'Created policy {name}'
        ))

        return jsonify(policy.to_dict()), 201


@admin_bp.route('/certificate-policies/<int:policy_id>', methods=['PATCH'])
@role_required(['admin'])
def update_policy(policy_id):
    ctx = get_current_user_context()
    data = request.get_json() or {}

    with get_db() as session:
        policy = session.query(CertificatePolicy).get(policy_id)
        if not policy:
            return jsonify({'error': 'Policy not found'}), 404

        old_state = policy.to_dict()

        if 'minimum_approved_minutes' in data:
            policy.minimum_approved_minutes = int(data['minimum_approved_minutes'])
        if 'status' in data:
            policy.status = data['status']
        if 'policy_name' in data:
            policy.policy_name = data['policy_name'].strip()

        session.flush()

        session.add(AuditLog(
            actor_user_id=ctx['user_id'],
            action='POLICY_UPDATED',
            entity_type='certificate_policies',
            entity_id=policy.policy_id,
            before_state=old_state,
            after_state=policy.to_dict(),
            reason=f'Updated policy {policy.policy_name}'
        ))

        return jsonify(policy.to_dict()), 200


@admin_bp.route('/dashboard-stats', methods=['GET'])
@role_required(['admin', 'coordinator', 'approver', 'club_lead', 'volunteer'])
def get_dashboard_stats():
    with get_db() as session:
        total_volunteers = session.query(func.count(Student.student_id)).scalar() or 0
        total_events = session.query(func.count(Event.event_id)).scalar() or 0

        total_approved_minutes = session.query(func.coalesce(func.sum(VolunteerHourEntry.verified_minutes), 0))\
            .filter(VolunteerHourEntry.submission_status.in_(['approved', 'corrected'])).scalar() or 0

        pending_hours_count = session.query(func.count(VolunteerHourEntry.hour_entry_id))\
            .filter(VolunteerHourEntry.submission_status == 'pending').scalar() or 0

        total_certs_issued = session.query(func.count(Certificate.certificate_id))\
            .filter(Certificate.certificate_status == 'issued').scalar() or 0

        return jsonify({
            'total_volunteers': int(total_volunteers),
            'total_events': int(total_events),
            'total_approved_hours': round(float(total_approved_minutes) / 60.0, 2),
            'pending_hour_approvals': int(pending_hours_count),
            'certificates_issued': int(total_certs_issued)
        }), 200
