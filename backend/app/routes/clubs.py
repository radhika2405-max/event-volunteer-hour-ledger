from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.db import get_db
from app.models import Club, Event, EventSubclub

clubs_bp = Blueprint('clubs', __name__, url_prefix='/api/v1/clubs')

@clubs_bp.route('', methods=['GET'])
@jwt_required()
def list_clubs():
    with get_db() as session:
        clubs = session.query(Club).order_by(Club.club_id.asc()).all()
        return jsonify({'items': [c.to_dict() for c in clubs]}), 200


@clubs_bp.route('/<int:club_id>/events', methods=['GET'])
@jwt_required()
def get_club_events(club_id):
    with get_db() as session:
        events = session.query(Event).join(EventSubclub, Event.event_id == EventSubclub.event_id)\
            .filter(EventSubclub.club_id == club_id).all()
        return jsonify({'items': [e.to_dict() for e in events]}), 200
