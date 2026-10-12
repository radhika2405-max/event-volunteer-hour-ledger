"""
Generate Academic Presentation Deck & Viva Guide PDF
CHRIST (Deemed to be University), Delhi NCR Campus | School of Sciences
Project: Event Volunteer Hour Ledger
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor('#64748b'))
        
        # Header (on all pages except page 1)
        if self._pageNumber > 1:
            self.drawString(
                54, 750,
                "CHRIST (Deemed to be University) • School of Sciences • Event Volunteer Hour Ledger"
            )
            self.drawRightString(
                612 - 54, 750,
                "Presentation & Viva Defense Guide"
            )
            self.setStrokeColor(colors.HexColor('#cbd5e1'))
            self.setLineWidth(0.5)
            self.line(54, 742, 612 - 54, 742)

        # Footer (on all pages)
        self.setStrokeColor(colors.HexColor('#cbd5e1'))
        self.setLineWidth(0.5)
        self.line(54, 45, 612 - 54, 45)
        self.drawString(
            54, 32,
            "Live App: https://radhika2405-max.github.io/event-volunteer-hour-ledger/ • MySQL 8.0 / 3NF"
        )
        self.drawRightString(
            612 - 54, 32,
            f"Slide / Page {self._pageNumber} of {page_count}"
        )
        self.restoreState()


def build_presentation_pdf(output_path):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch
    )

    styles = getSampleStyleSheet()

    # Typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e3a8a'),
        alignment=1,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#b45309'),
        alignment=1,
        spaceAfter=6
    )

    inst_style = ParagraphStyle(
        'InstMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceAfter=12
    )

    slide_header_style = ParagraphStyle(
        'SlideHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e3a8a'),
        spaceBefore=8,
        spaceAfter=4
    )

    slide_sub_style = ParagraphStyle(
        'SlideSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#047857'),
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b')
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#1e293b'),
        leftIndent=12,
        spaceAfter=3
    )

    speaker_notes_style = ParagraphStyle(
        'SpeakerNotes',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#0f172a')
    )

    code_style = ParagraphStyle(
        'CodeText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#0f172a')
    )

    story = []

    # Cover Title Box
    story.append(Paragraph("EVENT VOLUNTEER HOUR LEDGER", title_style))
    story.append(Paragraph("College Presentation Slide Deck & Comprehensive Viva Voce Guide", subtitle_style))
    story.append(Paragraph(
        "<b>Department:</b> School of Sciences, CHRIST (Deemed to be University), Delhi NCR Campus<br/>"
        "<b>Domain Organization:</b> AADIKALA &amp; 6 Sub-Clubs (Dance, Emcee, Technical, Creative, Music, Hospitality)<br/>"
        "<b>Live Application:</b> <font color='#1e3a8a'><u>https://radhika2405-max.github.io/event-volunteer-hour-ledger/</u></font>",
        inst_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1e3a8a'), spaceAfter=12))

    # Presentation Metadata Card
    meta_data = [
        [
            Paragraph("<b>Database Engine:</b> MySQL 8.0 (InnoDB)", body_style),
            Paragraph("<b>Normal Form:</b> 3NF / BCNF Certified", body_style)
        ],
        [
            Paragraph("<b>Application Stack:</b> React 18 (Vite, TS) + Flask REST", body_style),
            Paragraph("<b>Core Logic:</b> The Ledger Paradigm &amp; ACID Locks", body_style)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[240, 240])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    # Helper function to create slide cards
    def add_slide_card(slide_num, title, subtitle, bullets, speaker_notes, code_snippet=None):
        content = []
        content.append(Paragraph(f"<b>SLIDE {slide_num}: {title.upper()}</b>", slide_header_style))
        content.append(Paragraph(subtitle, slide_sub_style))
        
        # Bullets
        for b in bullets:
            content.append(Paragraph(f"• {b}", bullet_style))

        if code_snippet:
            content.append(Spacer(1, 4))
            t_code = Table([[Paragraph(code_snippet.replace('\n', '<br/>').replace(' ', '&nbsp;'), code_style)]], colWidths=[460])
            t_code.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ('LEFTPADDING', (0,0), (-1,-1), 8),
            ]))
            content.append(t_code)

        # Speaker notes box
        content.append(Spacer(1, 5))
        notes_table = Table([[
            Paragraph(f"<b>🗣️ Speaker Notes (What to say):</b><br/>{speaker_notes}", speaker_notes_style)
        ]], colWidths=[460])
        notes_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fef3c7')),
            ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#d97706')),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
        ]))
        content.append(notes_table)
        content.append(Spacer(1, 12))
        return KeepTogether(content)

    # Slide 1
    story.append(add_slide_card(
        1,
        "Title & System Introduction",
        "A Relational DBMS for University Service Hour Accounting & Certificate Governance",
        [
            "<b>Institutional Context:</b> Developed for CHRIST University (School of Sciences) &amp; AADIKALA.",
            "<b>Primary Challenge:</b> Coordinated volunteering across 6 sub-clubs (Dance, Emcee, Technical, Creative, Music, Hospitality).",
            "<b>Core DBMS Goal:</b> Replace untracked manual spreadsheets with an authoritative 3NF relational database.",
            "<b>Live Production Deployment:</b> Hosted on GitHub Pages with interactive dashboards, reports, and public verifier."
        ],
        "Good morning respected professors and examiners. Today, we present our DBMS project: the Event Volunteer Hour Ledger. In university life, volunteer contributions across cultural, academic, and technical events represent hundreds of student labor hours. However, tracking these hours on spreadsheets or paper timesheets leads to lost updates, duplicate counting, and unverified certificates. We engineered an authoritative, 3NF-normalized relational database system that eliminates these anomalies, enforces strict ACID transactions, and provides verifiable certificate eligibility."
    ))

    # Slide 2
    story.append(add_slide_card(
        2,
        "The Real-World Problem: Fragility of Spreadsheets",
        "Analyzing the 4 Fundamental Database Anomalies of Manual Timesheets",
        [
            "<b>Mutable Aggregates &amp; Lost Updates:</b> Directly editable total-hour cells overwrite previous values without a paper trail during concurrent edits.",
            "<b>Multi-Club Join Inflation:</b> Co-hosted events (e.g., SUNERGOS with 3 sub-clubs) multiply hours by 3 in unnormalized joins.",
            "<b>Premature Certification:</b> Students with pending unapproved hours claim certificates before faculty review.",
            "<b>Lack of Change Data Capture:</b> No audit log of who modified or approved an entry, why it was altered, or when."
        ],
        "In our college organization, AADIKALA coordinates volunteers across multi-day fests like SUNERGOS and TARANG. Previous manual approaches failed because of fundamental database anomalies: first, mutable aggregates where total hours are directly editable without a paper trail; second, join inflation where multi-club events duplicate hours; third, students claiming certificates before faculty verify their hours; and fourth, a complete lack of change-data audit logging."
    ))

    # Slide 3
    story.append(add_slide_card(
        3,
        "The Architectural Solution: The Ledger Paradigm",
        "Decoupling Identity from Immutable Interval Entries & Dynamic SQL Views",
        [
            "<b>The Ledger Principle:</b> Total hours are <i>NEVER</i> stored as a mutable column in the students table.",
            "<b>Formula:</b> Approved Hours = (SUM(verified_minutes) / 60.0) WHERE submission_status IN ('approved', 'corrected').",
            "<b>Strict 3-Tier Architecture:</b> React 18 + Vite Frontend -> Flask REST API -> MySQL 8.0 Database Engine.",
            "<b>Status Isolation:</b> Pending claimed hours and rejected submissions are strictly isolated from certified totals."
        ],
        "To solve the mutable update anomaly, we adopted the Ledger Paradigm inspired by financial accounting. In our database, the students table does not have a total_hours column. Instead, every work interval is an immutable record in volunteer_hour_entries. Total hours are dynamically aggregated through authoritative database views. Only entries verified by faculty contribute to certified totals, strictly isolating pending and rejected submissions."
    ))

    # Slide 4
    story.append(add_slide_card(
        4,
        "Relational Data Modeling & ER Design",
        "10 Normalized Relations Modeling Multi-Club Hierarchies & Associative Participation",
        [
            "<b>Core Entities:</b> users (1:1 with students), clubs, events, certificate_policies.",
            "<b>Recursive Self-Join:</b> clubs.parent_club_id models parent AADIKALA and child sub-clubs.",
            "<b>Associative Junctions:</b> event_subclubs (M:N events to clubs), event_volunteers (M:N students to events).",
            "<b>Ledger & Auditing:</b> volunteer_hour_entries (1:N with participation), audit_logs (Change Data Capture)."
        ],
        "Here is our Entity-Relationship model. We separated authentication identity in users from academic records in students with a 1-to-1 relationship. We modeled the organizational hierarchy using a self-referential recursive foreign key in clubs, where parent_club_id links sub-clubs to AADIKALA. Events and sub-clubs share a Many-to-Many relationship resolved through event_subclubs, while student participation is captured through the associative entity event_volunteers."
    ))

    # Slide 5
    story.append(add_slide_card(
        5,
        "Database Normalization Journey (1NF to 3NF & BCNF)",
        "Systematic Decomposition Eliminating Insertion, Deletion, and Update Anomalies",
        [
            "<b>1NF:</b> Atomic attributes enforced. Comma-separated sub-club lists decomposed into event_subclubs(event_id, club_id).",
            "<b>2NF:</b> Zero partial dependencies. In composite keys, non-key club data remains in clubs, event data in events.",
            "<b>3NF &amp; BCNF:</b> Eliminated transitive dependencies. Program degree decoupled from login user; derived total hours removed.",
            "<b>Result:</b> Every determinant is a candidate key. No redundant facts stored across the entire schema."
        ],
        "Our database strictly adheres to Third Normal Form. In 1NF, we eliminated repeating groups by breaking comma-separated sub-club lists into an associative junction table. In 2NF, we ensured zero partial functional dependencies on composite primary keys. In 3NF, we removed transitive dependencies—for instance, separating login credentials in users from degree programs in students, and removing any derived aggregate columns that would depend transitively on ledger entries."
    ))

    # Slide 6
    story.append(add_slide_card(
        6,
        "Database Integrity: Constraints & Referential Actions",
        "Engine-Enforced Rules Guaranteeing Mathematical & Temporal Realism",
        [
            "<b>Check Constraints:</b> CHECK (end_datetime > start_datetime), CHECK (break_minutes >= 0), CHECK (claimed_minutes > 0).",
            "<b>Referential Integrity Actions:</b> ON DELETE CASCADE for participation child rows; ON DELETE RESTRICT on certificates.",
            "<b>Unique Key Constraints:</b> UNIQUE (event_id, student_id) prevents accidental duplicate event registrations.",
            "<b>Cryptographic Uniqueness:</b> UNIQUE (verification_token) protects public credential authenticity."
        ],
        "Data integrity is enforced at the database engine level, not merely in the frontend. We implemented Check Constraints so that an event cannot end before it begins, and break minutes cannot be negative. We implemented composite unique constraints on (event_id, student_id) to prevent a volunteer from registering twice for the same event, and ON DELETE RESTRICT to protect issued certificates against accidental deletion."
    ))

    # Slide 7
    story.append(add_slide_card(
        7,
        "Database Views & Solving Join Inflation",
        "5 Specialized Virtual Relations Guaranteeing Non-Inflated Aggregation",
        [
            "<b>vw_student_approved_hours:</b> Canonical student aggregation using SUM(CASE WHEN status='approved'...).",
            "<b>vw_certificate_eligibility:</b> Real-time evaluation against active policy (minimum 1,200 mins = 20 hrs).",
            "<b>vw_event_volunteer_summary:</b> Headcount and verified labor per event without duplicate club rows.",
            "<b>vw_subclub_contribution_summary:</b> Hierarchy-aware labor analytics for Dance, Emcee, Technical, Creative, Music, Hospitality.",
            "<b>vw_pending_review_queue:</b> Actionable queue for faculty approvers without exposing sensitive student fields."
        ],
        "One of our proudest database achievements is solving Join Inflation. When an event has multiple collaborating sub-clubs, a naive multi-table join multiplies hours by the number of sub-clubs. We designed five specialized SQL views. In vw_student_approved_hours, hours attach to the volunteer participation ID, and we use conditional aggregation: SUM(CASE WHEN submission_status = 'approved' THEN verified_minutes ELSE 0 END). This guarantees mathematical precision across all reports."
    ))

    # Slide 8
    story.append(add_slide_card(
        8,
        "Database Programmability: Triggers & Change Data Capture",
        "Event-Driven Business Rules & Automated Forensic Audit Logging",
        [
            "<b>trg_vhe_before_insert:</b> Validates non-negative breaks and positive claimed minutes before record creation.",
            "<b>trg_vhe_before_update:</b> Enforces state-machine rules. If status='rejected' without reason, raises SQLSTATE '45000'.",
            "<b>trg_vhe_after_update:</b> Change Data Capture (CDC)—captures before/after JSON states into audit_logs.",
            "<b>Forensic Accountability:</b> Every hour approval, modification, or rejection is permanently timestamped with actor ID."
        ],
        "We utilized advanced database programmability. Our BEFORE UPDATE trigger on hour entries enforces state transition integrity: if a faculty member attempts to reject hours without providing a written reason, the database raises an exception and aborts the statement. Meanwhile, the AFTER UPDATE trigger automatically records before and after JSON snapshots in audit_logs, providing forensic traceability."
    ))

    # Slide 9
    story.append(add_slide_card(
        9,
        "Stored Procedures & ACID Concurrency Control",
        "Row-Level Locking Preventing Double Issuance & Lost Updates",
        [
            "<b>sp_calculate_student_hours:</b> Encapsulated calculation returning approved, pending, rejected minutes.",
            "<b>sp_refresh_certificate_eligibility:</b> Dynamic evaluation against policy threshold.",
            "<b>sp_issue_certificate (ACID Transaction):</b>",
            "  - START TRANSACTION with row-level locks: SELECT ... FOR UPDATE on candidate student.",
            "  - Verifies approved minutes >= 1,200 mins. If below threshold -> ROLLBACK.",
            "  - Verifies no active certificate issued. If already issued -> ROLLBACK.",
            "  - Generates immutable snapshot and SHA-256 verification token, then commits."
        ],
        "Certificate issuance requires strict ACID compliance. If a student is near the 20-hour threshold, simultaneous approval requests could trigger race conditions. In our stored procedure sp_issue_certificate, we execute START TRANSACTION and obtain row-level exclusive locks with SELECT ... FOR UPDATE. If the student has already received a certificate, or their approved minutes drop below the threshold, the transaction rolls back cleanly with custom SQL error codes.",
        "START TRANSACTION;\nSELECT * FROM certificate_policies WHERE policy_id = 1 FOR SHARE;\nSELECT * FROM students WHERE student_id = 4 FOR UPDATE;\n-- If approved_minutes < threshold THEN ROLLBACK; END IF;\nINSERT INTO certificates (...) VALUES (...);\nCOMMIT;"
    ))

    # Slide 10
    story.append(add_slide_card(
        10,
        "Query Optimization & Balanced B-Tree Indexing Strategy",
        "Sub-Millisecond Execution Times on High-Volume Reporting Queries",
        [
            "<b>Clustered Primary Key Indexes:</b> O(log N) row lookups across all 10 relational tables.",
            "<b>Secondary B-Tree Indexes:</b> idx_users_email, idx_students_reg_no, idx_cert_verification_token.",
            "<b>Composite B-Tree Indexes:</b> idx_vhe_part_status on (participation_id, submission_status) for rapid view joins.",
            "<b>Execution Plan (EXPLAIN):</b> Eliminates table scans (ALL), executing queries via index seeks (ref/range) in < 50ms."
        ],
        "To ensure scalability across thousands of volunteers and entries, we engineered a dedicated B-tree indexing strategy. Beyond primary keys, we created secondary indexes on lookup columns like registration numbers and tokens, and composite indexes on (participation_id, submission_status). Using EXPLAIN, we verified that our reporting queries execute using efficient index range lookups under 50 milliseconds rather than full table scans."
    ))

    # Slide 11
    story.append(add_slide_card(
        11,
        "Live System Features & Certificate Verification Portal",
        "React + Vite Frontend Hosted Live on GitHub Pages",
        [
            "<b>Live Application URL:</b> https://radhika2405-max.github.io/event-volunteer-hour-ledger/",
            "<b>Volunteer Workspace:</b> Personal hours breakdown, event registrations, pending submission status.",
            "<b>Faculty Approver Hub:</b> Live queue with one-click approval, corrections, and mandatory rejection notes.",
            "<b>Eligibility Report Engine:</b> Search, multi-criteria filtering (Year, Programme, Hours) and instant CSV export.",
            "<b>Public Verification Portal:</b> Unauthenticated SHA-256 token validator verifying student certificate authenticity."
        ],
        "Our user interface is deployed live on GitHub Pages. It features five specialized workspaces: the Volunteer Portal showing personal hours, the Approver Hub where faculty review submissions, the Certificate Eligibility engine tracking the 20-hour requirement, our search-and-filter report table with CSV export, and a public verification screen where anyone can enter a token to verify a certificate's authenticity."
    ))

    # Slide 12
    story.append(add_slide_card(
        12,
        "Conclusion & Academic Project Achievements",
        "A Production-Ready Demonstration of Comprehensive DBMS Principles",
        [
            "<b>Summary of Accomplishments:</b> Replaced manual spreadsheets with an enterprise 3NF MySQL database.",
            "<b>DBMS Theory Realized:</b> Normalization, Constraints, Views, Triggers, Stored Procedures, ACID, B-Tree Indexes.",
            "<b>Real-World Domain Impact:</b> Solved Join Inflation and eliminated lost updates for CHRIST University's AADIKALA.",
            "<b>Viva Defense Preparedness:</b> Ready for faculty examination and interactive query execution."
        ],
        "In conclusion, this project demonstrates how foundational DBMS theory—normalization, relational algebra, constraints, ACID transactions, and indexing—directly solves real-world campus administrative challenges. Thank you, and we are now ready for your questions and the live demonstration."
    ))

    # Section 2: Viva Voce Defense Guide
    story.append(PageBreak())
    story.append(Paragraph("PART 2: FACULTY VIVA VOCE DEFENSE QUESTIONS & ANSWERS", title_style))
    story.append(Paragraph("Strategic Answers Prepared for External Examiners & Evaluation Panel", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#1e3a8a'), spaceAfter=10))

    viva_qas = [
        (
            "Q1: Why did you use the 'Ledger Paradigm' instead of adding a 'total_hours' column in students?",
            "Adding total_hours to students introduces a Transitive Dependency (StudentID -> Entries -> TotalHours), violating 3NF. Furthermore, it creates a severe Update Anomaly and Race Condition: if two coordinators approve different sessions simultaneously, concurrent updates overwrite each other, causing lost hours. In the Ledger Paradigm, every entry is an immutable record, and total hours are dynamically aggregated via SQL views, guaranteeing 100% mathematical consistency."
        ),
        (
            "Q2: What is Join Inflation and how did your schema prevent it?",
            "Join Inflation occurs when joining across a Many-to-Many relationship. If Event A has 3 sub-clubs in event_subclubs, joining events directly to event_subclubs and then to volunteer_hour_entries multiplies every hour entry by 3. We solved this by attaching hour entries strictly to event_volunteers(participation_id). Club associations remain in the separate junction table and are aggregated independently with COUNT(DISTINCT)."
        ),
        (
            "Q3: How does your database handle ACID transactions during certificate issuance?",
            "In stored procedure sp_issue_certificate, we wrap issuance inside START TRANSACTION ... COMMIT. We use row-level exclusive locks using SELECT ... FOR UPDATE on the student record and FOR SHARE on the policy. If the student's verified hours are below the 1,200-minute threshold, or if an active certificate already exists, the procedure calls ROLLBACK and raises an exception, guaranteeing Atomicity and Isolation."
        ),
        (
            "Q4: What is the difference between a WHERE clause and a HAVING clause in your eligibility query?",
            "In reports.sql Query 1, the WHERE clause filters individual records before grouping—we use WHERE submission_status IN ('approved', 'corrected') so pending or rejected timesheets are excluded immediately. The HAVING clause filters groups after aggregation—we use HAVING SUM(verified_minutes) >= 1200 to select only those students whose cumulative sum reaches or exceeds the 20-hour policy threshold."
        ),
        (
            "Q5: What triggers did you implement and what business rules do they enforce?",
            "We implemented three triggers in triggers.sql. Our BEFORE INSERT trigger ensures positive claimed durations and non-negative breaks. Our BEFORE UPDATE trigger acts as a state-machine gatekeeper: if a reviewer marks an entry as 'rejected' without providing a rejection_reason, it raises SQL error 45000 and aborts the update. Finally, our AFTER UPDATE trigger captures before and after states as JSON objects and automatically records them into audit_logs."
        ),
        (
            "Q6: How do your B-Tree indexes improve query performance?",
            "Without indexes, finding a student by registration number or calculating hours requires a full table scan O(N). We created clustered indexes on primary keys, secondary B-tree indexes on lookup columns (university_registration_number, email, verification_token), and composite B-tree indexes on (participation_id, submission_status). EXPLAIN shows MySQL performs index range lookups in O(log N) time (< 50ms)."
        )
    ]

    for q, a in viva_qas:
        q_table = Table([[
            Paragraph(f"<b>{q}</b><br/><font color='#334155'>{a}</font>", body_style)
        ]], colWidths=[480])
        q_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(q_table)
        story.append(Spacer(1, 6))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Presentation PDF successfully generated: {output_path}")


if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    target_pdf = os.path.join(base_dir, "outputs", "Event_Volunteer_Hour_Ledger_Presentation.pdf")
    build_presentation_pdf(target_pdf)
