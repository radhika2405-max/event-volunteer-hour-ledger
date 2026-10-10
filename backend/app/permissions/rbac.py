from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

def role_required(allowed_roles):
    """
    Genuine backend-enforced Role-Based Access Control decorator.
    Validates JWT identity and asserts user.role is in allowed_roles.
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get('role')

            if not user_role or user_role not in allowed_roles:
                return jsonify({
                    'error': 'Forbidden: Insufficient privileges',
                    'required_roles': allowed_roles,
                    'current_role': user_role
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def get_current_user_context():
    """
    Returns dict containing identity (user_id), role, student_id (if volunteer), email, full_name.
    """
    claims = get_jwt()
    return {
        'user_id': int(get_jwt_identity()),
        'role': claims.get('role'),
        'student_id': claims.get('student_id'),
        'email': claims.get('email'),
        'full_name': claims.get('full_name')
    }
