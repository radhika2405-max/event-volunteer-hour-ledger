from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.db import get_db
from app.models import EventVolunteer, Event, Student
from app.permissions.rbac import role_required, get_current_user_context

participations_bp = Blueprint('participations', __name__, url_prefix='/api/v1')

@participations_bp.route('/events/<int:event_id>/volunteers', methods=['POST'])
@role_required(['admin', 'coordinator'])
def register_volunteer(event_id):
    data = request.get_json() or {}
    student_id = data.get('student_id')
    assigned_club_id = data.get('assigned_club_id')
    assigned_role = data.get('assigned_role', 'Volunteer').strip()

    if not student_id:
        return jsonify({'error': 'student_id is required'}), 400

    with get_db() as session:
        # Check event
        event = session.query(Event).get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        # Check student
        student = session.query(Student).get(student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        # Check duplicate registration
        existing = session.query(EventVolunteer).filter_by(event_id=event_id, student_id=student_id).first()
        if existing:
            return jsonify({'error': 'Student is already registered for this event'}), 409

        participation = EventVolunteer(
            event_id=event_id,
            student_id=student_id,
            assigned_club_id=assigned_club_id,
            assigned_role=assigned_role,
            registration_status='registered'
        )
        session.add(participation)
        session.flush()

        return jsonify(participation.to_dict()), 201


@participations_bp.route('/participations', methods=['GET'])
@jwt_required()
def list_participations():
    ctx = get_current_user_context()
    event_id = request.args.get('event_id')
    student_id = request.args.get('student_id')

    if ctx['role'] == 'volunteer':
        student_id = ctx['student_id']

    with get_db() as session:
        query = session.query(EventVolunteer)
        if event_id:
            query = query.filter(EventVolunteer.event_id == int(event_id))
        if student_id:
            query = query.filter(EventVolunteer.student_id == int(student_id))

        items = query.order_by(EventVolunteer.registered_at.desc()).all()
        return jsonify({'items': [p.to_dict() for p in items], 'total': len(items)}), 200


@participations_bp.route('/participations/<int:participation_id>', methods=['PATCH'])
@role_required(['admin', 'coordinator'])
def update_participation(participation_id):
    data = request.get_json() or {}
    with get_db() as session:
        part = session.query(EventVolunteer).get(participation_id)
        if not part:
            return jsonify({'error': 'Participation record not found'}), 404

        if 'assigned_role' in data:
            part.assigned_role = data['assigned_role']
        if 'assigned_club_id' in data:
            part.assigned_club_id = data['assigned_club_id']
        if 'registration_status' in data:
            part.registration_status = data['registration_status']

        session.flush()
        return jsonify(part.to_dict()), 200
