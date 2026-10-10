from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.db import get_db
from app.models import User, Student

auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    with get_db() as session:
        user = session.query(User).filter_by(email=email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid email or password'}), 401

        if user.account_status != 'active':
            return jsonify({'error': f'Account is {user.account_status}. Please contact administrator.'}), 403

        student_id = user.student.student_id if user.student else None
        reg_no = user.student.university_registration_number if user.student else None

        additional_claims = {
            'role': user.role,
            'email': user.email,
            'full_name': user.full_name,
            'student_id': student_id,
            'registration_number': reg_no
        }

        access_token = create_access_token(
            identity=str(user.user_id),
            additional_claims=additional_claims
        )

        return jsonify({
            'access_token': access_token,
            'user': {
                'user_id': user.user_id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'student_id': student_id,
                'registration_number': reg_no
            }
        }), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    with get_db() as session:
        user = session.query(User).get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        student_info = None
        if user.student:
            student_info = user.student.to_dict()

        return jsonify({
            'user': user.to_dict(),
            'student': student_info
        }), 200
