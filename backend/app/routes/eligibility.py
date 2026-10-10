from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.db import get_db
from app.permissions.rbac import get_current_user_context
from sqlalchemy import text

eligibility_bp = Blueprint('eligibility', __name__, url_prefix='/api/v1/eligibility')

@eligibility_bp.route('', methods=['GET'])
@jwt_required()
def get_all_eligibility():
    ctx = get_current_user_context()
    user_role = ctx['role']
    caller_student_id = ctx['student_id']

    sql = "SELECT * FROM vw_certificate_eligibility"
    params = {}

    if user_role == 'volunteer':
        sql += " WHERE student_id = :student_id"
        params['student_id'] = caller_student_id

    sql += " ORDER BY total_approved_hours DESC, student_name ASC"

    with get_db() as session:
        result = session.execute(text(sql), params)
        rows = [dict(row._mapping) for row in result]
        return jsonify({'items': rows, 'total': len(rows)}), 200


@eligibility_bp.route('/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student_eligibility(student_id):
    ctx = get_current_user_context()
    if ctx['role'] == 'volunteer' and ctx['student_id'] != student_id:
        return jsonify({'error': 'Forbidden: Access denied to other students eligibility'}), 403

    sql = "SELECT * FROM vw_certificate_eligibility WHERE student_id = :student_id LIMIT 1"
    with get_db() as session:
        result = session.execute(text(sql), {'student_id': student_id})
        row = result.first()
        if not row:
            return jsonify({'error': 'Student eligibility record not found'}), 404
        return jsonify(dict(row._mapping)), 200
