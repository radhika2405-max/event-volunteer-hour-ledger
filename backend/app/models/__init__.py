from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, Time, 
    ForeignKey, Boolean, Enum, JSON, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum('admin', 'coordinator', 'club_lead', 'approver', 'volunteer'), nullable=False, index=True)
    account_status = Column(Enum('active', 'inactive', 'suspended'), nullable=False, default='active')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship('Student', back_populates='user', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'full_name': self.full_name,
            'email': self.email,
            'role': self.role,
            'account_status': self.account_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Student(Base):
    __tablename__ = 'students'

    student_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, unique=True)
    university_registration_number = Column(String(50), nullable=False, unique=True, index=True)
    programme = Column(String(100), nullable=False)
    academic_year = Column(String(20), nullable=False)
    section = Column(String(10), nullable=True)
    contact_email = Column(String(150), nullable=True)
    status = Column(Enum('active', 'graduated', 'inactive'), nullable=False, default='active')
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship('User', back_populates='student')
    participations = relationship('EventVolunteer', back_populates='student', cascade='all, delete-orphan')
    certificates = relationship('Certificate', back_populates='student')

    def to_dict(self):
        return {
            'student_id': self.student_id,
            'user_id': self.user_id,
            'full_name': self.user.full_name if self.user else None,
            'email': self.user.email if self.user else self.contact_email,
            'university_registration_number': self.university_registration_number,
            'programme': self.programme,
            'academic_year': self.academic_year,
            'section': self.section,
            'contact_email': self.contact_email,
            'status': self.status
        }


class Club(Base):
    __tablename__ = 'clubs'

    club_id = Column(Integer, primary_key=True, autoincrement=True)
    club_name = Column(String(100), nullable=False, unique=True)
    parent_club_id = Column(Integer, ForeignKey('clubs.club_id', ondelete='RESTRICT'), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(Enum('active', 'inactive'), nullable=False, default='active')
    created_at = Column(DateTime, default=datetime.utcnow)

    sub_clubs = relationship('Club', backref='parent_club', remote_side=[club_id])

    def to_dict(self):
        return {
            'club_id': self.club_id,
            'club_name': self.club_name,
            'parent_club_id': self.parent_club_id,
            'description': self.description,
            'status': self.status
        }


class Event(Base):
    __tablename__ = 'events'

    event_id = Column(Integer, primary_key=True, autoincrement=True)
    event_name = Column(String(150), nullable=False)
    event_code = Column(String(50), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    venue = Column(String(150), nullable=False)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    event_status = Column(Enum('draft', 'published', 'completed', 'archived'), nullable=False, default='published')
    created_by = Column(Integer, ForeignKey('users.user_id', ondelete='RESTRICT'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sub_clubs = relationship('Club', secondary='event_subclubs', backref='events')
    volunteers = relationship('EventVolunteer', back_populates='event', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'event_id': self.event_id,
            'event_name': self.event_name,
            'event_code': self.event_code,
            'description': self.description,
            'venue': self.venue,
            'start_datetime': self.start_datetime.isoformat() if self.start_datetime else None,
            'end_datetime': self.end_datetime.isoformat() if self.end_datetime else None,
            'event_status': self.event_status,
            'created_by': self.created_by,
            'sub_clubs': [c.to_dict() for c in self.sub_clubs] if self.sub_clubs else []
        }


class EventSubclub(Base):
    __tablename__ = 'event_subclubs'

    event_id = Column(Integer, ForeignKey('events.event_id', ondelete='CASCADE'), primary_key=True)
    club_id = Column(Integer, ForeignKey('clubs.club_id', ondelete='CASCADE'), primary_key=True)


class EventVolunteer(Base):
    __tablename__ = 'event_volunteers'

    participation_id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey('events.event_id', ondelete='CASCADE'), nullable=False)
    student_id = Column(Integer, ForeignKey('students.student_id', ondelete='CASCADE'), nullable=False)
    assigned_club_id = Column(Integer, ForeignKey('clubs.club_id', ondelete='SET NULL'), nullable=True)
    assigned_role = Column(String(100), nullable=False, default='Volunteer')
    registration_status = Column(Enum('registered', 'attended', 'cancelled'), nullable=False, default='registered')
    registered_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('event_id', 'student_id', name='uq_event_student'),
    )

    event = relationship('Event', back_populates='volunteers')
    student = relationship('Student', back_populates='participations')
    assigned_club = relationship('Club')
    hour_entries = relationship('VolunteerHourEntry', back_populates='participation', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'participation_id': self.participation_id,
            'event_id': self.event_id,
            'event_name': self.event.event_name if self.event else None,
            'student_id': self.student_id,
            'student_name': self.student.user.full_name if self.student and self.student.user else None,
            'registration_number': self.student.university_registration_number if self.student else None,
            'assigned_club_id': self.assigned_club_id,
            'assigned_club_name': self.assigned_club.club_name if self.assigned_club else None,
            'assigned_role': self.assigned_role,
            'registration_status': self.registration_status,
            'registered_at': self.registered_at.isoformat() if self.registered_at else None
        }


class VolunteerHourEntry(Base):
    __tablename__ = 'volunteer_hour_entries'

    hour_entry_id = Column(Integer, primary_key=True, autoincrement=True)
    participation_id = Column(Integer, ForeignKey('event_volunteers.participation_id', ondelete='CASCADE'), nullable=False)
    work_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    break_minutes = Column(Integer, nullable=False, default=0)
    claimed_minutes = Column(Integer, nullable=False)
    verified_minutes = Column(Integer, nullable=False, default=0)
    submission_status = Column(Enum('pending', 'approved', 'rejected', 'corrected'), nullable=False, default='pending')
    submitted_by = Column(Integer, ForeignKey('users.user_id', ondelete='RESTRICT'), nullable=False)
    reviewed_by = Column(Integer, ForeignKey('users.user_id', ondelete='RESTRICT'), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    correction_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    participation = relationship('EventVolunteer', back_populates='hour_entries')
    submitter = relationship('User', foreign_keys=[submitted_by])
    reviewer = relationship('User', foreign_keys=[reviewed_by])

    def to_dict(self):
        return {
            'hour_entry_id': self.hour_entry_id,
            'participation_id': self.participation_id,
            'event_id': self.participation.event_id if self.participation else None,
            'event_name': self.participation.event.event_name if self.participation and self.participation.event else None,
            'student_id': self.participation.student_id if self.participation else None,
            'student_name': self.participation.student.user.full_name if self.participation and self.participation.student and self.participation.student.user else None,
            'registration_number': self.participation.student.university_registration_number if self.participation and self.participation.student else None,
            'work_date': self.work_date.isoformat() if self.work_date else None,
            'start_time': str(self.start_time) if self.start_time else None,
            'end_time': str(self.end_time) if self.end_time else None,
            'break_minutes': self.break_minutes,
            'claimed_minutes': self.claimed_minutes,
            'claimed_hours': round(self.claimed_minutes / 60.0, 2),
            'verified_minutes': self.verified_minutes,
            'verified_hours': round(self.verified_minutes / 60.0, 2),
            'submission_status': self.submission_status,
            'submitted_by': self.submitted_by,
            'submitted_by_name': self.submitter.full_name if self.submitter else None,
            'reviewed_by': self.reviewed_by,
            'reviewed_by_name': self.reviewer.full_name if self.reviewer else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'rejection_reason': self.rejection_reason,
            'correction_notes': self.correction_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CertificatePolicy(Base):
    __tablename__ = 'certificate_policies'

    policy_id = Column(Integer, primary_key=True, autoincrement=True)
    policy_name = Column(String(150), nullable=False)
    minimum_approved_minutes = Column(Integer, nullable=False, default=1200)
    scope_type = Column(Enum('all_events', 'event', 'club'), nullable=False, default='all_events')
    applicable_event_id = Column(Integer, ForeignKey('events.event_id', ondelete='CASCADE'), nullable=True)
    applicable_club_id = Column(Integer, ForeignKey('clubs.club_id', ondelete='CASCADE'), nullable=True)
    effective_from = Column(Date, nullable=False)
    effective_until = Column(Date, nullable=True)
    requires_faculty_approval = Column(Boolean, nullable=False, default=True)
    status = Column(Enum('active', 'inactive'), nullable=False, default='active')
    created_by = Column(Integer, ForeignKey('users.user_id', ondelete='RESTRICT'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'policy_id': self.policy_id,
            'policy_name': self.policy_name,
            'minimum_approved_minutes': self.minimum_approved_minutes,
            'minimum_approved_hours': round(self.minimum_approved_minutes / 60.0, 2),
            'scope_type': self.scope_type,
            'applicable_event_id': self.applicable_event_id,
            'applicable_club_id': self.applicable_club_id,
            'effective_from': self.effective_from.isoformat() if self.effective_from else None,
            'effective_until': self.effective_until.isoformat() if self.effective_until else None,
            'requires_faculty_approval': self.requires_faculty_approval,
            'status': self.status
        }


class Certificate(Base):
    __tablename__ = 'certificates'

    certificate_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey('students.student_id', ondelete='RESTRICT'), nullable=False)
    policy_id = Column(Integer, ForeignKey('certificate_policies.policy_id', ondelete='RESTRICT'), nullable=False)
    certificate_number = Column(String(100), nullable=False, unique=True)
    eligibility_snapshot_minutes = Column(Integer, nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow)
    issued_by = Column(Integer, ForeignKey('users.user_id', ondelete='RESTRICT'), nullable=False)
    certificate_status = Column(Enum('issued', 'revoked', 'reissued'), nullable=False, default='issued')
    revocation_reason = Column(Text, nullable=True)
    verification_token = Column(String(64), nullable=False, unique=True, index=True)
    pdf_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship('Student', back_populates='certificates')
    policy = relationship('CertificatePolicy')
    issuer = relationship('User', foreign_keys=[issued_by])

    def to_dict(self):
        return {
            'certificate_id': self.certificate_id,
            'student_id': self.student_id,
            'student_name': self.student.user.full_name if self.student and self.student.user else None,
            'registration_number': self.student.university_registration_number if self.student else None,
            'programme': self.student.programme if self.student else None,
            'policy_id': self.policy_id,
            'policy_name': self.policy.policy_name if self.policy else None,
            'certificate_number': self.certificate_number,
            'eligibility_snapshot_minutes': self.eligibility_snapshot_minutes,
            'eligibility_snapshot_hours': round(self.eligibility_snapshot_minutes / 60.0, 2),
            'issued_at': self.issued_at.isoformat() if self.issued_at else None,
            'issued_by_name': self.issuer.full_name if self.issuer else None,
            'certificate_status': self.certificate_status,
            'revocation_reason': self.revocation_reason,
            'verification_token': self.verification_token,
            'pdf_path': self.pdf_path
        }


class AuditLog(Base):
    __tablename__ = 'audit_logs'

    audit_id = Column(Integer, primary_key=True, autoincrement=True)
    actor_user_id = Column(Integer, ForeignKey('users.user_id', ondelete='SET NULL'), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer, nullable=False)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    request_id = Column(String(100), nullable=True)

    actor = relationship('User')

    def to_dict(self):
        return {
            'audit_id': self.audit_id,
            'actor_user_id': self.actor_user_id,
            'actor_name': self.actor.full_name if self.actor else 'System',
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'before_state': self.before_state,
            'after_state': self.after_state,
            'reason': self.reason,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'request_id': self.request_id
        }


class EventCoordinatorAssignment(Base):
    __tablename__ = 'event_coordinator_assignments'

    assignment_id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey('events.event_id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)


class ClubLeadAssignment(Base):
    __tablename__ = 'club_lead_assignments'

    assignment_id = Column(Integer, primary_key=True, autoincrement=True)
    club_id = Column(Integer, ForeignKey('clubs.club_id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
