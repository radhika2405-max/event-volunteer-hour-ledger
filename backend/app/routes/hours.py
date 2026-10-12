from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.db import get_db
from app.models import VolunteerHourEntry, EventVolunteer, AuditLog
from app.permissions.rbac import role_required, get_current_user_context
from datetime import datetime, date, time
from sqlalchemy import func

hours_bp = Blueprint('hours', __name__, url_prefix='/api/v1/hours')

@hours_bp.route('', methods=['POST'])
@role_required(['admin', 'coordinator'])
def submit_hours():
    data = request.get_json() or {}
    ctx = get_current_user_context()

    participation_id = data.get('participation_id')
    work_date_str = data.get('work_date')
    start_time_str = data.get('start_time')
    end_time_str = data.get('end_time')
    break_minutes = int(data.get('break_minutes', 0))

    if not participation_id or not work_date_str or not start_time_str or not end_time_str:
        return jsonify({'error': 'Participation ID, work date, start time, and end time are required'}), 400

    if break_minutes < 0:
        return jsonify({'error': 'Break minutes cannot be negative'}), 400

    try:
        work_date = date.fromisoformat(work_date_str)
        t_start = time.fromisoformat(start_time_str)
        t_end = time.fromisoformat(end_time_str)
    except Exception:
        return jsonify({'error': 'Invalid date or time format. Use YYYY-MM-DD and HH:MM:SS'}), 400

    # Calculate duration
    dt_start = datetime.combine(work_date, t_start)
    dt_end = datetime.combine(work_date, t_end)
    total_duration_minutes = int((dt_end - dt_start).total_seconds() / 60)

    if total_duration_minutes <= 0:
        return jsonify({'error': 'End time must be after start time on the same date'}), 400

    claimed_minutes = total_duration_minutes - break_minutes
    if claimed_minutes <= 0:
        return jsonify({'error': 'Claimed minutes must be greater than zero after deducting break time'}), 400

    with get_db() as session:
        part = session.query(EventVolunteer).get(participation_id)
        if not part:
            return jsonify({'error': 'Participation record not found'}), 404

        entry = VolunteerHourEntry(
            participation_id=participation_id,
            work_date=work_date,
            start_time=t_start,
            end_time=t_end,
            break_minutes=break_minutes,
            claimed_minutes=claimed_minutes,
            verified_minutes=0,
            submission_status='pending',
            submitted_by=ctx['user_id']
        )
        session.add(entry)
        session.flush()

        return jsonify(entry.to_dict()), 201


@hours_bp.route('', methods=['GET'])
@jwt_required()
def list_hours():
    ctx = get_current_user_context()
    user_role = ctx['role']

    status = request.args.get('status')
    student_id = request.args.get('student_id')
    event_id = request.args.get('event_id')

    # Security scoping: Student can only view their own hours
    if user_role == 'volunteer':
        student_id = ctx['student_id']

    with get_db() as session:
        query = session.query(VolunteerHourEntry).join(EventVolunteer, VolunteerHourEntry.participation_id == EventVolunteer.participation_id)

        if status and status.strip():
            query = query.filter(func.lower(VolunteerHourEntry.submission_status) == status.strip().lower())
        if student_id:
            query = query.filter(EventVolunteer.student_id == int(student_id))
        if event_id:
            query = query.filter(EventVolunteer.event_id == int(event_id))

        entries = query.order_by(VolunteerHourEntry.work_date.desc(), VolunteerHourEntry.hour_entry_id.desc()).all()
        return jsonify({'items': [e.to_dict() for e in entries], 'total': len(entries)}), 200


@hours_bp.route('/<int:entry_id>', methods=['GET'])
@jwt_required()
def get_hour_entry(entry_id):
    ctx = get_current_user_context()
    with get_db() as session:
        entry = session.query(VolunteerHourEntry).get(entry_id)
        if not entry:
            return jsonify({'error': 'Hour entry not found'}), 404

        if ctx['role'] == 'volunteer' and entry.participation.student_id != ctx['student_id']:
            return jsonify({'error': 'Forbidden: Access denied to other students hours'}), 403

        return jsonify(entry.to_dict()), 200


@hours_bp.route('/<int:entry_id>/approve', methods=['POST'])
@role_required(['admin', 'approver'])
def approve_hours(entry_id):
    ctx = get_current_user_context()
    with get_db() as session:
        entry = session.query(VolunteerHourEntry).get(entry_id)
        if not entry:
            return jsonify({'error': 'Hour entry not found'}), 404

        if entry.submission_status == 'approved':
            return jsonify({'error': 'Entry is already approved'}), 400

        entry.submission_status = 'approved'
        entry.verified_minutes = entry.claimed_minutes
        entry.reviewed_by = ctx['user_id']
        entry.reviewed_at = datetime.utcnow()
        session.flush()

        return jsonify(entry.to_dict()), 200


@hours_bp.route('/<int:entry_id>/reject', methods=['POST'])
@role_required(['admin', 'approver'])
def reject_hours(entry_id):
    ctx = get_current_user_context()
    data = request.get_json() or {}
    reason = data.get('reason', '').strip()

    if not reason:
        return jsonify({'error': 'A rejection reason is mandatory'}), 400

    with get_db() as session:
        entry = session.query(VolunteerHourEntry).get(entry_id)
        if not entry:
            return jsonify({'error': 'Hour entry not found'}), 404

        entry.submission_status = 'rejected'
        entry.verified_minutes = 0
        entry.rejection_reason = reason
        entry.reviewed_by = ctx['user_id']
        entry.reviewed_at = datetime.utcnow()
        session.flush()

        return jsonify(entry.to_dict()), 200


@hours_bp.route('/<int:entry_id>/correct', methods=['POST'])
@role_required(['admin'])
def correct_hours(entry_id):
    ctx = get_current_user_context()
    data = request.get_json() or {}
    notes = data.get('correction_notes', '').strip()
    verified_minutes = data.get('verified_minutes')

    if not notes or verified_minutes is None:
        return jsonify({'error': 'Correction notes and verified minutes are mandatory for administrative audit'}), 400

    try:
        v_mins = int(verified_minutes)
        if v_mins < 0:
            return jsonify({'error': 'Verified minutes cannot be negative'}), 400
    except ValueError:
        return jsonify({'error': 'Verified minutes must be a valid integer'}), 400

    with get_db() as session:
        entry = session.query(VolunteerHourEntry).get(entry_id)
        if not entry:
            return jsonify({'error': 'Hour entry not found'}), 404

        entry.submission_status = 'corrected'
        entry.verified_minutes = v_mins
        entry.correction_notes = notes
        entry.reviewed_by = ctx['user_id']
        entry.reviewed_at = datetime.utcnow()
        session.flush()

        return jsonify(entry.to_dict()), 200
