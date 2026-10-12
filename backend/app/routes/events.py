from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.db import get_db
from app.models import Event, Club, EventSubclub, EventVolunteer, VolunteerHourEntry, User
from app.permissions.rbac import role_required, get_current_user_context
from datetime import datetime
from sqlalchemy import func

events_bp = Blueprint('events', __name__, url_prefix='/api/v1/events')

@events_bp.route('', methods=['GET'])
@jwt_required()
def list_events():
    status = request.args.get('status', '').strip()
    with get_db() as session:
        query = session.query(Event)
        if status:
            query = query.filter(Event.event_status == status)

        events = query.order_by(Event.start_datetime.desc()).all()
        results = []
        for e in events:
            # Aggregate stats
            vol_count = session.query(func.count(EventVolunteer.participation_id))\
                .filter(EventVolunteer.event_id == e.event_id).scalar()

            approved_mins = session.query(func.coalesce(func.sum(VolunteerHourEntry.verified_minutes), 0))\
                .join(EventVolunteer, VolunteerHourEntry.participation_id == EventVolunteer.participation_id)\
                .filter(EventVolunteer.event_id == e.event_id, VolunteerHourEntry.submission_status.in_(['approved', 'corrected']))\
                .scalar()

            pending_count = session.query(func.count(VolunteerHourEntry.hour_entry_id))\
                .join(EventVolunteer, VolunteerHourEntry.participation_id == EventVolunteer.participation_id)\
                .filter(EventVolunteer.event_id == e.event_id, VolunteerHourEntry.submission_status == 'pending')\
                .scalar()

            item = e.to_dict()
            item['volunteer_count'] = vol_count
            item['approved_hours'] = round(float(approved_mins or 0) / 60.0, 2)
            item['pending_submissions'] = pending_count
            results.append(item)

        return jsonify({'items': results, 'total': len(results)}), 200


@events_bp.route('/<int:event_id>', methods=['GET'])
@jwt_required()
def get_event(event_id):
    with get_db() as session:
        event = session.query(Event).get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        data = event.to_dict()
        # Include volunteers list
        volunteers = session.query(EventVolunteer).filter_by(event_id=event_id).all()
        data['volunteers'] = [v.to_dict() for v in volunteers]
        return jsonify(data), 200


@events_bp.route('', methods=['POST'])
@role_required(['admin', 'coordinator'])
def create_event():
    data = request.get_json() or {}
    ctx = get_current_user_context()

    event_name = data.get('event_name', '').strip()
    event_code = data.get('event_code', '').strip().upper()
    venue = data.get('venue', '').strip()
    description = data.get('description', '').strip()
    start_dt_str = data.get('start_datetime', '').strip()
    end_dt_str = data.get('end_datetime', '').strip()
    sub_club_ids = data.get('sub_club_ids', [])

    if not event_name or not event_code or not venue or not start_dt_str or not end_dt_str:
        return jsonify({'error': 'Event name, code, venue, start time, and end time are required'}), 400

    try:
        start_dt = datetime.fromisoformat(start_dt_str.replace('Z', ''))
        end_dt = datetime.fromisoformat(end_dt_str.replace('Z', ''))
    except Exception:
        return jsonify({'error': 'Invalid datetime format. Use ISO format (YYYY-MM-DDTHH:MM:SS)'}), 400

    if end_dt <= start_dt:
        return jsonify({'error': 'Event end datetime must be strictly after start datetime'}), 400

    with get_db() as session:
        if session.query(Event).filter_by(event_code=event_code).first():
            return jsonify({'error': 'Event code already exists'}), 400

        event = Event(
            event_name=event_name,
            event_code=event_code,
            description=description,
            venue=venue,
            start_datetime=start_dt,
            end_datetime=end_dt,
            event_status='published',
            created_by=ctx['user_id']
        )
        session.add(event)
        session.flush()

        # Link sub-clubs
        for cid in sub_club_ids:
            session.add(EventSubclub(event_id=event.event_id, club_id=cid))

        session.flush()
        return jsonify(event.to_dict()), 201


@events_bp.route('/<int:event_id>', methods=['PATCH'])
@role_required(['admin', 'coordinator'])
def update_event(event_id):
    data = request.get_json() or {}
    with get_db() as session:
        event = session.query(Event).get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        if 'event_name' in data:
            event.event_name = data['event_name'].strip()
        if 'venue' in data:
            event.venue = data['venue'].strip()
        if 'description' in data:
            event.description = data['description'].strip()
        if 'event_status' in data:
            event.event_status = data['event_status']
        if 'start_datetime' in data:
            event.start_datetime = datetime.fromisoformat(data['start_datetime'].replace('Z', ''))
        if 'end_datetime' in data:
            event.end_datetime = datetime.fromisoformat(data['end_datetime'].replace('Z', ''))

        if event.end_datetime <= event.start_datetime:
            return jsonify({'error': 'End time must be after start time'}), 400

        if 'sub_club_ids' in data:
            session.query(EventSubclub).filter_by(event_id=event_id).delete()
            for cid in data['sub_club_ids']:
                session.add(EventSubclub(event_id=event_id, club_id=cid))

        session.flush()
        return jsonify(event.to_dict()), 200


@events_bp.route('/<int:event_id>/volunteers', methods=['GET'])
@jwt_required()
def get_event_volunteers(event_id):
    with get_db() as session:
        volunteers = session.query(EventVolunteer).filter_by(event_id=event_id).all()
        return jsonify({'items': [v.to_dict() for v in volunteers], 'total': len(volunteers)}), 200
