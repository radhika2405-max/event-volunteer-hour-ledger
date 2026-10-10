from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config

jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize JWT
    jwt.init_app(app)

    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({'error': 'Missing authorization token'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return jsonify({'error': 'Invalid authorization token'}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired, please log in again'}), 401

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.students import students_bp
    from app.routes.events import events_bp
    from app.routes.clubs import clubs_bp
    from app.routes.participations import participations_bp
    from app.routes.hours import hours_bp
    from app.routes.eligibility import eligibility_bp
    from app.routes.reports import reports_bp
    from app.routes.certificates import certificates_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(clubs_bp)
    app.register_blueprint(participations_bp)
    app.register_blueprint(hours_bp)
    app.register_blueprint(eligibility_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(certificates_bp)
    app.register_blueprint(admin_bp)

    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'healthy',
            'system': 'Event Volunteer Hour Ledger API',
            'institution': 'CHRIST (Deemed to be University), Delhi NCR Campus',
            'school': 'School of Sciences'
        }), 200

    return app
