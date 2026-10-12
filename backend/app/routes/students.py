from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.db import get_db
from app.models import Student, User, EventVolunteer, VolunteerHourEntry
from app.permissions.rbac import role_required, get_current_user_context
from sqlalchemy import or_, func

students_bp = Blueprint('students', __name__, url_prefix='/api/v1/students')

@students_bp.route('', methods=['GET'])
@jwt_required()
def get_students():
    ctx = get_current_user_context()
    user_role = ctx['role']
    caller_student_id = ctx['student_id']

    # Volunteers can only view themselves
    if user_role == 'volunteer':
        with get_db() as session:
            student = session.query(Student).get(caller_student_id)
            if not student:
                return jsonify({'items': [], 'total': 0}), 200
            return jsonify({'items': [student.to_dict()], 'total': 1}), 200

    # Authorized staff / faculty
    search = request.args.get('search', '').strip()
    programme = request.args.get('programme', '').strip()
    academic_year = request.args.get('academic_year', '').strip()
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))

    with get_db() as session:
        query = session.query(Student).join(User, Student.user_id == User.user_id)

        if search:
            query = query.filter(or_(
                Student.university_registration_number.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            ))

        if programme:
            query = query.filter(Student.programme == programme)

        if academic_year:
            query = query.filter(Student.academic_year == academic_year)

        total = query.count()
        students = query.order_by(Student.university_registration_number.asc()).offset((page - 1) * limit).limit(limit).all()

        return jsonify({
            'items': [s.to_dict() for s in students],
            'total': total,
            'page': page,
            'limit': limit
        }), 200


@students_bp.route('/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student_detail(student_id):
    ctx = get_current_user_context()
    if ctx['role'] == 'volunteer' and ctx['student_id'] != student_id:
        return jsonify({'error': 'Forbidden: You cannot view another student profile'}), 403

    with get_db() as session:
        student = session.query(Student).get(student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        # Participations and hours
        participations = session.query(EventVolunteer).filter_by(student_id=student_id).all()
        part_list = []
        for p in participations:
            hours_data = [h.to_dict() for h in p.hour_entries]
            p_dict = p.to_dict()
            p_dict['hours'] = hours_data
            part_list.append(p_dict)

        # Aggregate hours
        approved_mins = session.query(func.coalesce(func.sum(VolunteerHourEntry.verified_minutes), 0))\
            .join(EventVolunteer, VolunteerHourEntry.participation_id == EventVolunteer.participation_id)\
            .filter(EventVolunteer.student_id == student_id, VolunteerHourEntry.submission_status.in_(['approved', 'corrected']))\
            .scalar()

        pending_mins = session.query(func.coalesce(func.sum(VolunteerHourEntry.claimed_minutes), 0))\
            .join(EventVolunteer, VolunteerHourEntry.participation_id == EventVolunteer.participation_id)\
            .filter(EventVolunteer.student_id == student_id, VolunteerHourEntry.submission_status == 'pending')\
            .scalar()

        data = student.to_dict()
        data['total_approved_minutes'] = int(approved_mins or 0)
        data['total_approved_hours'] = round(float(approved_mins or 0) / 60.0, 2)
        data['total_pending_minutes'] = int(pending_mins or 0)
        data['total_pending_hours'] = round(float(pending_mins or 0) / 60.0, 2)
        data['participations'] = part_list

        return jsonify(data), 200


@students_bp.route('', methods=['POST'])
@role_required(['admin'])
def create_student():
    data = request.get_json() or {}
    reg_no = data.get('university_registration_number', '').strip()
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    programme = data.get('programme', '').strip()
    academic_year = data.get('academic_year', '2025-2026').strip()
    section = data.get('section', 'A').strip()

    if not reg_no or not full_name or not email or not programme:
        return jsonify({'error': 'Registration number, name, email, and programme are required'}), 400

    from werkzeug.security import generate_password_hash

    with get_db() as session:
        if session.query(User).filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        if session.query(Student).filter_by(university_registration_number=reg_no).first():
            return jsonify({'error': 'Registration number already exists'}), 400

        user = User(
            full_name=full_name,
            email=email,
            password_hash=generate_password_hash("Student@123"),
            role='volunteer',
            account_status='active'
        )
        session.add(user)
        session.flush()

        student = Student(
            user_id=user.user_id,
            university_registration_number=reg_no,
            programme=programme,
            academic_year=academic_year,
            section=section,
            contact_email=email,
            status='active'
        )
        session.add(student)
        session.flush()

        return jsonify(student.to_dict()), 201
