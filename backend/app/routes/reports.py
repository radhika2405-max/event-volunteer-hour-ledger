import io
import csv
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required
from app.db import get_db
from app.permissions.rbac import role_required, get_current_user_context
from sqlalchemy import text
from datetime import datetime

reports_bp = Blueprint('reports', __name__, url_prefix='/api/v1/reports')

@reports_bp.route('/certificate-eligibility', methods=['GET'])
@role_required(['admin', 'coordinator', 'approver', 'club_lead'])
def certificate_eligibility_report():
    academic_year = request.args.get('academic_year', '').strip()
    programme = request.args.get('programme', '').strip()
    event_id = request.args.get('event_id', '').strip()
    club_id = request.args.get('club_id', '').strip()
    policy_id = request.args.get('policy_id', '').strip()
    min_hours = request.args.get('min_hours', '').strip()
    status_filter = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip()
    export_format = request.args.get('export', '').lower().strip()

    # Query vw_certificate_eligibility with joins for filtering
    sql = """
    SELECT 
        ce.student_id,
        ce.university_registration_number,
        ce.student_name,
        ce.programme,
        ce.academic_year,
        ce.policy_id,
        ce.policy_name,
        ce.threshold_hours,
        ce.total_approved_hours,
        ce.total_pending_hours,
        ce.approved_events_count,
        ce.remaining_hours,
        ce.eligibility_state,
        ce.certificate_number,
        ce.certificate_status,
        ce.certificate_issued_at,
        ce.verification_token
    FROM vw_certificate_eligibility ce
    WHERE 1=1
    """
    params = {}

    if academic_year:
        sql += " AND ce.academic_year = :academic_year"
        params['academic_year'] = academic_year

    if programme:
        sql += " AND ce.programme = :programme"
        params['programme'] = programme

    if min_hours:
        try:
            sql += " AND ce.total_approved_hours >= :min_hours"
            params['min_hours'] = float(min_hours)
        except ValueError:
            pass

    if status_filter:
        sql += " AND ce.eligibility_state = :status_filter"
        params['status_filter'] = status_filter

    if search:
        sql += " AND (ce.student_name LIKE :search OR ce.university_registration_number LIKE :search)"
        params['search'] = f"%{search}%"

    if event_id:
        sql += """ AND ce.student_id IN (
            SELECT ev.student_id FROM event_volunteers ev WHERE ev.event_id = :event_id
        )"""
        params['event_id'] = int(event_id)

    if club_id:
        sql += """ AND ce.student_id IN (
            SELECT ev.student_id FROM event_volunteers ev WHERE ev.assigned_club_id = :club_id
        )"""
        params['club_id'] = int(club_id)

    sql += " ORDER BY ce.total_approved_hours DESC, ce.student_name ASC"

    with get_db() as session:
        result = session.execute(text(sql), params)
        items = [dict(row._mapping) for row in result]

        # Calculate summary metric counts
        summary = {
            'total_students': len(items),
            'eligible_count': sum(1 for x in items if 'Eligible' in x['eligibility_state'] or x['eligibility_state'] == 'Certificate Issued'),
            'ineligible_count': sum(1 for x in items if x['eligibility_state'] == 'Not Eligible'),
            'pending_review_count': sum(1 for x in items if x['eligibility_state'] == 'Pending Hours Review'),
            'issued_count': sum(1 for x in items if x['eligibility_state'] == 'Certificate Issued')
        }

        # CSV Export Handling
        if export_format == 'csv':
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow([
                'Registration Number', 'Student Name', 'Programme', 'Academic Year',
                'Approved Hours', 'Pending Hours', 'Events Count', 'Threshold (Hours)',
                'Remaining Hours', 'Eligibility Status', 'Certificate Number', 'Issued Date'
            ])
            for x in items:
                writer.writerow([
                    x['university_registration_number'],
                    x['student_name'],
                    x['programme'],
                    x['academic_year'],
                    x['total_approved_hours'],
                    x['total_pending_hours'],
                    x['approved_events_count'],
                    x['threshold_hours'],
                    x['remaining_hours'],
                    x['eligibility_state'],
                    x['certificate_number'] or 'N/A',
                    x['certificate_issued_at'] or 'N/A'
                ])
            output.seek(0)
            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={'Content-Disposition': f'attachment;filename=certificate_eligibility_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'}
            )

        return jsonify({
            'report_metadata': {
                'institution': 'CHRIST (Deemed to be University), Delhi NCR Campus',
                'school': 'School of Sciences',
                'organization': 'AADIKALA Volunteer Honor Ledger',
                'generated_at': datetime.utcnow().isoformat() + 'Z'
            },
            'summary': summary,
            'items': items
        }), 200


@reports_bp.route('/event-summary', methods=['GET'])
@role_required(['admin', 'coordinator', 'approver', 'club_lead'])
def event_summary_report():
    with get_db() as session:
        result = session.execute(text("SELECT * FROM vw_event_volunteer_summary ORDER BY start_datetime DESC"))
        items = [dict(row._mapping) for row in result]
        return jsonify({'items': items, 'total': len(items)}), 200


@reports_bp.route('/club-summary', methods=['GET'])
@role_required(['admin', 'coordinator', 'approver', 'club_lead'])
def club_summary_report():
    with get_db() as session:
        result = session.execute(text("SELECT * FROM vw_club_volunteer_summary ORDER BY verified_hours_contributed DESC"))
        items = [dict(row._mapping) for row in result]
        return jsonify({'items': items, 'total': len(items)}), 200


@reports_bp.route('/pending-approvals', methods=['GET'])
@role_required(['admin', 'coordinator', 'approver'])
def pending_approvals_report():
    with get_db() as session:
        result = session.execute(text("SELECT * FROM vw_pending_hour_approvals ORDER BY submitted_at ASC"))
        items = [dict(row._mapping) for row in result]
        return jsonify({'items': items, 'total': len(items)}), 200
