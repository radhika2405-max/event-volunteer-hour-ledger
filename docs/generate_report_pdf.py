"""
Generate Comprehensive Academic Project Report PDF
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
                "CHRIST (Deemed to be University) • School of Sciences • Academic DBMS Report"
            )
            self.drawRightString(
                612 - 54, 750,
                "Event Volunteer Hour Ledger"
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
            "Live App: https://radhika2405-max.github.io/event-volunteer-hour-ledger/ • MySQL 8.0"
        )
        self.drawRightString(
            612 - 54, 32,
            f"Page {self._pageNumber} of {page_count}"
        )
        self.restoreState()


def build_academic_report_pdf(output_path):
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

    # Academic Typography Hierarchy
    cover_title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=21,
        leading=25,
        textColor=colors.HexColor('#1e3a8a'),
        alignment=1,
        spaceAfter=6
    )

    cover_sub_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#d97706'),
        alignment=1,
        spaceAfter=6
    )

    cover_meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155'),
        alignment=1,
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'HeadingH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e3a8a'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'HeadingH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13.5,
        textColor=colors.HexColor('#047857'),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=5
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

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#0f172a')
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#0f172a')
    )

    story = []

    # =========================================================================
    # COVER / TITLE PAGE
    # =========================================================================
    story.append(Paragraph("CHRIST (DEEMED TO BE UNIVERSITY)", cover_sub_style))
    story.append(Paragraph("DELHI NCR CAMPUS • SCHOOL OF SCIENCES", ParagraphStyle('InstName', parent=cover_sub_style, fontSize=10, textColor=colors.HexColor('#64748b'))))
    story.append(Spacer(1, 10))
    story.append(Paragraph("ACADEMIC PROJECT REPORT", cover_title_style))
    story.append(Paragraph("EVENT VOLUNTEER HOUR LEDGER", ParagraphStyle('ProjTitle', parent=cover_title_style, fontSize=17, textColor=colors.HexColor('#1e3a8a'))))
    story.append(Paragraph("A Relational Database Management System for Service Hour Accounting, Faculty Verification &amp; Certificate Eligibility", cover_sub_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "<b>Course:</b> Database Management Systems (DBMS) Laboratory &amp; Theory<br/>"
        "<b>Academic Year:</b> 2025–2026 | <b>Degree:</b> Bachelor of Science / Computer Applications<br/>"
        "<b>Student Organization:</b> AADIKALA (Cultural, Technological and Performing Arts Wing)<br/>"
        "<b>Sub-Clubs:</b> Dance, Emcee, Technical, Creative, Music, Hospitality<br/>"
        "<b>Live System Deployment:</b> <font color='#1e3a8a'><u>https://radhika2405-max.github.io/event-volunteer-hour-ledger/</u></font>",
        cover_meta_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1e3a8a'), spaceAfter=12))

    # Certificate of Bonafide Work Card
    cert_text = (
        "<b>CERTIFICATE OF BONAFIDE WORK</b><br/>"
        "This is to certify that this project report entitled <b>'Event Volunteer Hour Ledger'</b> "
        "is a bonafide record of academic work carried out by the student under the School of Sciences, "
        "CHRIST (Deemed to be University), Delhi NCR Campus. The implementation adheres to Third Normal Form (3NF), "
        "enforces ACID transactions, and provides authoritative student service certificate governance.<br/><br/>"
        "_______________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _______________________<br/>"
        "<b>Faculty Mentor / Guide</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Head of Department</b>"
    )
    t_cert = Table([[Paragraph(cert_text, body_style)]], colWidths=[480])
    t_cert.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_cert)
    story.append(Spacer(1, 14))

    # Abstract Box
    abstract_text = (
        "<b>ABSTRACT</b><br/>"
        "The <b>Event Volunteer Hour Ledger</b> is a relational database management application developed to track student "
        "service contributions across university events, calculate verified cumulative hours, and automatically determine "
        "eligibility for official university volunteer certificates. Traditional paper timesheets or unnormalized spreadsheets "
        "suffer from mutable update anomalies, lost updates during concurrent edits, double-counting in multi-club collaborations, "
        "and unverified certificate generation. By structuring volunteer contributions as an immutable transactional ledger in "
        "MySQL 8.0 normalized to 3NF/BCNF, the system guarantees ACID transactions, prevents join inflation, enforces engine-level "
        "integrity constraints, automates change-data audit logging via triggers, and provides sub-millisecond query execution via "
        "balanced B-tree indexing. The application is deployed live with a React + Vite frontend and Python Flask REST API."
    )
    t_abs = Table([[Paragraph(abstract_text, body_style)]], colWidths=[480])
    t_abs.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fef3c7')),
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#d97706')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_abs)

    # =========================================================================
    # SECTION 1: INTRODUCTION & PROBLEM STATEMENT
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("1. Introduction &amp; Problem Statement", h1_style))
    story.append(Paragraph(
        "Campus life at CHRIST University Delhi NCR thrives on student volunteer leadership across academic conferences, "
        "cultural symposia, and community outreach. The umbrella student organization <b>AADIKALA</b> coordinates six specialized "
        "sub-clubs: Dance, Emcee, Technical, Creative, Music, and Hospitality. Organizing campus-wide festivals like <i>SUNERGOS</i> "
        "and <i>TARANG</i> requires coordinated student labor spanning setup, stage coordination, and guest hospitality.",
        body_style
    ))
    story.append(Paragraph(
        "Historically, service hours were tracked using manual paper forms and shared cloud spreadsheets. This traditional approach "
        "exhibited four fatal database flaws:",
        body_style
    ))
    story.append(Paragraph("<b>1. Mutable Aggregates &amp; Lost Updates:</b> Total hours were stored as a single editable number on student records. When multiple coordinators approved hours concurrently, uncoordinated writes caused lost updates without an audit trail.", bullet_style))
    story.append(Paragraph("<b>2. Multi-Club Join Inflation:</b> Campus events are frequently co-hosted by multiple sub-clubs (e.g. Technical and Hospitality). In unnormalized spreadsheets or queries, students co-registered with multiple clubs had their hours multiplied by the number of participating clubs.", bullet_style))
    story.append(Paragraph("<b>3. Premature Certification:</b> Students with pending, unverified timesheets claimed certificates before faculty review due to the lack of status isolation.", bullet_style))
    story.append(Paragraph("<b>4. Complete Absence of Auditability:</b> Modifications, rejections, and approvals lacked Change Data Capture (CDC), preventing administrative traceability.", bullet_style))

    # =========================================================================
    # SECTION 2: OBJECTIVES & SCOPE
    # =========================================================================
    story.append(Paragraph("2. Objectives &amp; System Scope", h1_style))
    story.append(Paragraph("The primary academic and technical objectives of this project are:", body_style))
    story.append(Paragraph("• Engineer a 3NF/BCNF relational database schema in MySQL 8.0 eliminating all data anomalies.", bullet_style))
    story.append(Paragraph("• Implement the <b>Ledger Paradigm</b>: Hours are stored as discrete, verified entries rather than mutable totals.", bullet_style))
    story.append(Paragraph("• Guarantee mathematical accuracy through SQL views with conditional aggregation, resolving join inflation.", bullet_style))
    story.append(Paragraph("• Enforce business rules via active database triggers (e.g., mandatory rejection reasons with SQL error 45000).", bullet_style))
    story.append(Paragraph("• Enforce ACID compliance in stored procedures using row-level locking (<code>SELECT ... FOR UPDATE</code>).", bullet_style))
    story.append(Paragraph("• Deliver a filterable Certificate Eligibility Report engine and public SHA-256 certificate verification portal.", bullet_style))

    # Scope Table
    scope_data = [
        [Paragraph("<b>In Scope</b>", body_style), Paragraph("<b>Out of Scope</b>", body_style)],
        [
            Paragraph("• User authentication &amp; RBAC (5 roles)<br/>• Interval hour logging with break deduction<br/>• Multi-club event association<br/>• Automated audit trails via triggers<br/>• Real-time eligibility evaluation<br/>• PDF certificate &amp; CSV report generation<br/>• Public cryptographic token verification", body_style),
            Paragraph("• Physical biometric hardware integration<br/>• University fee/ERP financial payment gateways<br/>• Native iOS/Android compiled binaries (web PWA deployed)", body_style)
        ]
    ]
    t_scope = Table(scope_data, colWidths=[240, 240])
    t_scope.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_scope)
    story.append(Spacer(1, 8))

    # =========================================================================
    # SECTION 3: SYSTEM ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("3. System Architecture", h1_style))
    story.append(Paragraph(
        "The application employs a decoupled Three-Tier Architecture separating user interface, business API logic, and relational persistence:",
        body_style
    ))
    arch_data = [
        [Paragraph("<b>Tier</b>", body_style), Paragraph("<b>Technology Stack</b>", body_style), Paragraph("<b>Responsibilities</b>", body_style)],
        [
            Paragraph("<b>Presentation Tier</b>", body_style),
            Paragraph("React 18, Vite, TypeScript, Tailwind CSS, Recharts (Hosted on GitHub Pages)", body_style),
            Paragraph("Interactive Volunteer Portal, Approver Hub, Eligibility Engine, Searchable Reports with CSV export, and Public Token Verifier.", body_style)
        ],
        [
            Paragraph("<b>Application Tier</b>", body_style),
            Paragraph("Python 3.14, Flask REST API, Flask-JWT-Extended, PyMySQL, ReportLab", body_style),
            Paragraph("Role-Based Access Control (RBAC), token issuance, JSON serialization, PDF rendering, and parameterized query execution.", body_style)
        ],
        [
            Paragraph("<b>Database Tier</b>", body_style),
            Paragraph("MySQL 8.0 InnoDB Engine", body_style),
            Paragraph("10 Normalized Tables in 3NF, 5 Specialized Views, Triggers, Stored Procedures, Check Constraints, B-Tree Indexes.", body_style)
        ]
    ]
    t_arch = Table(arch_data, colWidths=[90, 160, 230])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 4: RELATIONAL DATABASE MODELING & ER DESIGN
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("4. Relational Data Modeling &amp; Entity-Relationship Design", h1_style))
    story.append(Paragraph(
        "The database schema is engineered across 10 normalized tables. The Entity-Relationship structure captures real-world "
        "university relationships with rigorous cardinalities:",
        body_style
    ))
    
    er_table_data = [
        [Paragraph("<b>Entity / Table</b>", body_style), Paragraph("<b>Primary Key</b>", body_style), Paragraph("<b>Foreign Keys</b>", body_style), Paragraph("<b>Cardinality &amp; Purpose</b>", body_style)],
        [Paragraph("<code>users</code>", body_style), Paragraph("<code>user_id</code>", body_style), Paragraph("None", body_style), Paragraph("1:1 with students; authentication identity and system roles.", body_style)],
        [Paragraph("<code>students</code>", body_style), Paragraph("<code>student_id</code>", body_style), Paragraph("<code>user_id</code> (Unique)", body_style), Paragraph("1:1 with users; stores university registration number, degree programme.", body_style)],
        [Paragraph("<code>clubs</code>", body_style), Paragraph("<code>club_id</code>", body_style), Paragraph("<code>parent_club_id</code>", body_style), Paragraph("1:N Recursive Self-Join; models parent AADIKALA and child sub-clubs.", body_style)],
        [Paragraph("<code>events</code>", body_style), Paragraph("<code>event_id</code>", body_style), Paragraph("<code>created_by</code>", body_style), Paragraph("1:N with participation; campus events with dates, venues, statuses.", body_style)],
        [Paragraph("<code>event_subclubs</code>", body_style), Paragraph("<code>(event_id, club_id)</code>", body_style), Paragraph("<code>event_id, club_id</code>", body_style), Paragraph("M:N junction connecting events to collaborating sub-clubs.", body_style)],
        [Paragraph("<code>event_volunteers</code>", body_style), Paragraph("<code>participation_id</code>", body_style), Paragraph("<code>event_id, student_id</code>", body_style), Paragraph("M:N associative entity; UNIQUE (event_id, student_id).", body_style)],
        [Paragraph("<code>volunteer_hour_entries</code>", body_style), Paragraph("<code>hour_entry_id</code>", body_style), Paragraph("<code>participation_id</code>", body_style), Paragraph("1:N with participation; transactional ledger of work intervals.", body_style)],
        [Paragraph("<code>certificate_policies</code>", body_style), Paragraph("<code>policy_id</code>", body_style), Paragraph("None", body_style), Paragraph("1:N with certificates; sets threshold (e.g. 1,200 mins = 20 hrs).", body_style)],
        [Paragraph("<code>certificates</code>", body_style), Paragraph("<code>certificate_id</code>", body_style), Paragraph("<code>student_id, policy_id</code>", body_style), Paragraph("1:N with students; immutable award snapshot with SHA-256 token.", body_style)],
        [Paragraph("<code>audit_logs</code>", body_style), Paragraph("<code>audit_id</code>", body_style), Paragraph("<code>actor_user_id</code>", body_style), Paragraph("1:N with users; captures before/after JSON states via triggers.", body_style)],
    ]
    t_er = Table(er_table_data, colWidths=[95, 95, 110, 180])
    t_er.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_er)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 5: NORMALIZATION ANALYSIS (1NF to 3NF & BCNF)
    # =========================================================================
    story.append(Paragraph("5. Database Normalization Analysis (1NF $\\to$ 3NF &amp; BCNF)", h1_style))
    story.append(Paragraph(
        "Normalization was conducted systematically to eliminate redundancy while preserving functional dependencies:",
        body_style
    ))
    story.append(Paragraph(
        "<b>5.1 First Normal Form (1NF):</b> Enforced atomic attribute domains. Multi-club collaborations previously stored as "
        "<code>sub_clubs = 'Dance, Creative, Technical'</code> violated 1NF. This was decomposed into the associative relation "
        "<code>event_subclubs(event_id, club_id)</code> with composite primary key <code>(event_id, club_id)</code>.",
        body_style
    ))
    story.append(Paragraph(
        "<b>5.2 Second Normal Form (2NF):</b> Removed partial functional dependencies. In composite keys such as <code>event_subclubs</code>, "
        "no non-key attribute depends on a subset of the primary key. Club attributes (<code>club_name</code>) depend strictly on <code>club_id</code>, "
        "and event attributes (<code>venue, dates</code>) depend strictly on <code>event_id</code>.",
        body_style
    ))
    story.append(Paragraph(
        "<b>5.3 Third Normal Form (3NF) &amp; BCNF:</b> Eliminated transitive dependencies ($X \\to Y \\to Z$). Login credentials "
        "(<code>password_hash, role</code>) were isolated into <code>users</code>, while academic data (<code>programme, registration_number</code>) "
        "resides in <code>students</code>. Crucially, derived total approved hours was eliminated from <code>students</code> because it represented "
        "a transitive dependency on the state of <code>volunteer_hour_entries</code>. Total hours are dynamically evaluated via SQL views.",
        body_style
    ))

    # =========================================================================
    # SECTION 6: INTEGRITY CONSTRAINTS & BUSINESS RULES
    # =========================================================================
    story.append(Paragraph("6. Database Integrity Constraints", h1_style))
    story.append(Paragraph(
        "Integrity rules are enforced directly by the MySQL storage engine, guaranteeing mathematical and temporal realism:",
        body_style
    ))
    rules_data = [
        [Paragraph("<b>Constraint Type</b>", body_style), Paragraph("<b>Implementation Code</b>", body_style), Paragraph("<b>Enforced Business Rule</b>", body_style)],
        [Paragraph("<b>CHECK Constraint</b>", body_style), Paragraph("<code>CHECK (end_datetime &gt; start_datetime)</code>", code_style), Paragraph("Prohibits events ending before their start timestamp.", body_style)],
        [Paragraph("<b>CHECK Constraint</b>", body_style), Paragraph("<code>CHECK (break_minutes &gt;= 0)</code>", code_style), Paragraph("Prohibits negative break durations.", body_style)],
        [Paragraph("<b>CHECK Constraint</b>", body_style), Paragraph("<code>CHECK (claimed_minutes &gt; 0)</code>", code_style), Paragraph("Ensures volunteer timesheets record positive work duration.", body_style)],
        [Paragraph("<b>UNIQUE Constraint</b>", body_style), Paragraph("<code>UNIQUE (event_id, student_id)</code>", code_style), Paragraph("Prevents duplicate registrations for the same event.", body_style)],
        [Paragraph("<b>UNIQUE Constraint</b>", body_style), Paragraph("<code>UNIQUE (verification_token)</code>", code_style), Paragraph("Guarantees uniqueness of public certificate validation hashes.", body_style)],
        [Paragraph("<b>Referential Action</b>", body_style), Paragraph("<code>ON DELETE CASCADE</code>", code_style), Paragraph("Cascades teardown from registrations to logged time intervals.", body_style)],
        [Paragraph("<b>Referential Action</b>", body_style), Paragraph("<code>ON DELETE RESTRICT</code>", code_style), Paragraph("Protects issued certificates and policies from accidental deletion.", body_style)],
    ]
    t_rules = Table(rules_data, colWidths=[110, 160, 210])
    t_rules.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_rules)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 7: ADVANCED DBMS IMPLEMENTATION
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("7. Advanced DBMS Implementation &amp; Techniques", h1_style))

    # 7.1 Views
    story.append(Paragraph("7.1 Database Views &amp; Resolving Join Inflation", h2_style))
    story.append(Paragraph(
        "A common pitfall in volunteer management is <b>Join Inflation</b>: when an event has 3 co-organizing sub-clubs in "
        "<code>event_subclubs</code>, joining events directly with hour entries multiplies every recorded hour by 3. "
        "Our solution decouples club association from participation and utilizes 5 dedicated SQL views:",
        body_style
    ))
    story.append(Paragraph("1. <code>vw_student_approved_hours</code>: Computes canonical approved, pending, and rejected hours per student using conditional <code>SUM(CASE WHEN...)</code>.", bullet_style))
    story.append(Paragraph("2. <code>vw_certificate_eligibility</code>: Compares student totals against the active threshold policy (1,200 mins = 20 hrs), isolating eligibility from issuance.", bullet_style))
    story.append(Paragraph("3. <code>vw_event_volunteer_summary</code>: Headcount and verified labor per event without duplicate club rows.", bullet_style))
    story.append(Paragraph("4. <code>vw_subclub_contribution_summary</code>: Hierarchy-aware analytics for parent AADIKALA and child sub-clubs.", bullet_style))
    story.append(Paragraph("5. <code>vw_pending_review_queue</code>: Exposes pending submissions to faculty approvers without exposing sensitive password hashes.", bullet_style))

    # 7.2 Triggers
    story.append(Paragraph("7.2 Active Database Triggers (Workflow &amp; Audit Logging)", h2_style))
    story.append(Paragraph(
        "Triggers enforce business invariants and Change Data Capture (CDC):",
        body_style
    ))
    story.append(Paragraph("• <b><code>trg_vhe_before_insert</code>:</b> Validates input durations before row insertion.", bullet_style))
    story.append(Paragraph("• <b><code>trg_vhe_before_update</code>:</b> State machine gatekeeper. If a faculty member attempts to reject hours without providing a written reason, it raises <code>SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Integrity Error: Rejection requires a clear rejection reason.'</code>.", bullet_style))
    story.append(Paragraph("• <b><code>trg_vhe_after_update</code>:</b> Automated audit logger. When hour status or minutes change, it captures old and new values as JSON objects and writes them into <code>audit_logs</code>.", bullet_style))

    # 7.3 Stored Procedures & ACID Transactions
    story.append(Paragraph("7.3 Stored Procedures &amp; ACID Concurrency Control", h2_style))
    story.append(Paragraph(
        "Certificate issuance is executed via stored procedure <code>sp_issue_certificate</code> wrapped in an explicit ACID transaction:",
        body_style
    ))
    story.append(Paragraph("• <b>Atomicity:</b> Validation checks, certificate row creation, and audit logging succeed as one unit or roll back completely.", bullet_style))
    story.append(Paragraph("• <b>Consistency:</b> The active policy threshold (1,200 mins) must be satisfied before commit.", bullet_style))
    story.append(Paragraph("• <b>Isolation:</b> Uses row-level exclusive locks: <code>SELECT ... FOR UPDATE</code> on the candidate student row and <code>FOR SHARE</code> on the policy row, preventing concurrent duplicate certificate generation.", bullet_style))
    story.append(Paragraph("• <b>Durability:</b> Committed transactions are guaranteed by InnoDB write-ahead redo logging.", bullet_style))

    # 7.4 Indexing
    story.append(Paragraph("7.4 Indexing Strategy &amp; Query Optimization", h2_style))
    story.append(Paragraph(
        "To guarantee high throughput across thousands of records, we implemented a targeted B-Tree indexing strategy:",
        body_style
    ))
    story.append(Paragraph("• <b>Primary Clustered Indexes:</b> On all auto-increment primary keys for $O(\\log N)$ lookups.", bullet_style))
    story.append(Paragraph("• <b>Secondary B-Tree Indexes:</b> <code>idx_users_email</code>, <code>idx_students_reg_no</code>, <code>idx_cert_verification_token</code> enable sub-millisecond searches.", bullet_style))
    story.append(Paragraph("• <b>Composite Indexes:</b> <code>idx_vhe_part_status (participation_id, submission_status)</code> accelerates view joins. <code>EXPLAIN</code> analysis confirms queries use index seeks (<code>ref/range</code>) rather than full table scans (<code>ALL</code>).", bullet_style))

    # =========================================================================
    # SECTION 8: ANALYTICAL REPORTING QUERIES
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("8. Analytical Reporting Queries &amp; SQL Demonstrations", h1_style))
    story.append(Paragraph(
        "The project implements 6 advanced analytical queries in <code>database/reports.sql</code> showcasing advanced SQL features:",
        body_style
    ))

    # Query 1 Box
    q1_text = (
        "<b>Query 1: Identify Students Eligible for Certificate (&gt;= 20 Hours Threshold)</b><br/>"
        "<i>Demonstrates:</i> INNER JOIN, SUM with CASE, GROUP BY, HAVING with subquery.<br/>"
        "<code>SELECT s.university_registration_number, u.full_name, ROUND(SUM(vhe.verified_minutes)/60.0, 2) AS approved_hours<br/>"
        "FROM students s INNER JOIN users u ON s.user_id = u.user_id<br/>"
        "INNER JOIN event_volunteers ev ON s.student_id = ev.student_id<br/>"
        "INNER JOIN volunteer_hour_entries vhe ON ev.participation_id = vhe.participation_id<br/>"
        "WHERE vhe.submission_status IN ('approved', 'corrected')<br/>"
        "GROUP BY s.student_id, s.university_registration_number, u.full_name<br/>"
        "HAVING SUM(vhe.verified_minutes) &gt;= (SELECT minimum_approved_minutes FROM certificate_policies WHERE status='active' LIMIT 1);</code>"
    )
    t_q1 = Table([[Paragraph(q1_text, body_style)]], colWidths=[480])
    t_q1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_q1)
    story.append(Spacer(1, 8))

    # Query 2 Box
    q2_text = (
        "<b>Query 2: Students Close to Eligibility (Within 5 Hours of Threshold: 15–19.99 Hrs)</b><br/>"
        "<i>Demonstrates:</i> CROSS JOIN with policy configuration, HAVING range comparison.<br/>"
        "<i>Business Purpose:</i> Enables coordinators to identify and encourage near-threshold volunteers to participate in upcoming events."
    )
    t_q2 = Table([[Paragraph(q2_text, body_style)]], colWidths=[480])
    t_q2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_q2)
    story.append(Spacer(1, 8))

    # Queries 3-6 Overview
    other_queries = (
        "<b>Query 3 (Event-Wise Labor without Duplication):</b> Aggregates distinct volunteer counts and verified hours per event.<br/>"
        "<b>Query 4 (Sub-Club Contribution Breakdown):</b> Self-joins on hierarchical <code>clubs</code> table to measure labor across Dance, Emcee, Technical, Creative, Music, Hospitality.<br/>"
        "<b>Query 5 (Pending Hours Impact Simulation):</b> Projects which students will cross the 20-hour mark if their pending timesheets are approved.<br/>"
        "<b>Query 6 (Certificate Audit Trail):</b> Comprehensive traceability linking certificate numbers, recipients, issuing faculty, and SHA-256 tokens."
    )
    t_other = Table([[Paragraph(other_queries, body_style)]], colWidths=[480])
    t_other.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_other)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 9: APPLICATION & LIVE DEPLOYMENT
    # =========================================================================
    story.append(Paragraph("9. Full-Stack Implementation &amp; Live Deployment", h1_style))
    story.append(Paragraph(
        "The system has been completely implemented and hosted live on GitHub Pages:",
        body_style
    ))
    live_card = (
        "<b>LIVE APPLICATION URL:</b> <font color='#1e3a8a'><u>https://radhika2405-max.github.io/event-volunteer-hour-ledger/</u></font><br/>"
        "• <b>Volunteer Portal:</b> Shows logged intervals, real-time verified progress, and registered events.<br/>"
        "• <b>Approver Hub:</b> Faculty interface for approving hours, issuing corrections, and rejecting invalid claims.<br/>"
        "• <b>Eligibility Engine:</b> Interactive threshold bar (&gt;= 20 hours) and multi-filter report with CSV export.<br/>"
        "• <b>Public Verifier:</b> Unauthenticated SHA-256 token validator verifying credential authenticity."
    )
    t_live = Table([[Paragraph(live_card, body_style)]], colWidths=[480])
    t_live.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#e0f2fe')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0284c7')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_live)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 10: TESTING, CONCLUSION & REFERENCES
    # =========================================================================
    story.append(Paragraph("10. Testing, Verification &amp; Test Scenarios", h1_style))
    story.append(Paragraph(
        "The system was evaluated against automated test suites and realistic volunteer scenarios:",
        body_style
    ))
    story.append(Paragraph("• <b>Student A (18 Hours Approved, 0 Pending):</b> Correctly classified as <code>Not Eligible</code> (Needs 2.0 hours).", bullet_style))
    story.append(Paragraph("• <b>Student B (20 Hours Approved, 0 Pending):</b> Correctly classified as <code>Eligible - Awaiting Approval</code>.", bullet_style))
    story.append(Paragraph("• <b>Student C (18 Hours Approved, 5 Hours Pending):</b> Correctly classified as <code>Pending Hours Review</code>; simulation confirms projected eligibility.", bullet_style))
    story.append(Paragraph("• <b>Student D (24 Hours Approved, Certificate Issued):</b> Correctly classified as <code>Certificate Issued</code> with immutable snapshot hours.", bullet_style))

    story.append(Paragraph("11. Conclusion &amp; References", h1_style))
    story.append(Paragraph(
        "The <b>Event Volunteer Hour Ledger</b> successfully applies database management system theory to solve a critical campus "
        "administrative challenge for CHRIST (Deemed to be University). By strictly enforcing 3NF normalization, ACID transaction boundaries, "
        "view-based dynamic aggregation, and role-based access control, the system eliminates data anomalies and ensures reliable academic certificate governance.",
        body_style
    ))
    story.append(Paragraph("<b>References:</b><br/>"
        "1. Elmasri, R., &amp; Navathe, S. B. <i>Fundamentals of Database Systems</i>, 7th Edition, Pearson.<br/>"
        "2. Silberschatz, A., Korth, H. F., &amp; Sudarshan, S. <i>Database System Concepts</i>, 7th Edition, McGraw-Hill.<br/>"
        "3. MySQL 8.0 Reference Manual — Stored Routines, Views, Triggers, and InnoDB Transaction Model.<br/>"
        "4. Flask Documentation &amp; SQLAlchemy 2.0 Unified Documentation.",
        body_style
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Academic Project Report PDF successfully generated: {output_path}")


if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    target_pdf = os.path.join(base_dir, "outputs", "Event_Volunteer_Hour_Ledger_Academic_Project_Report.pdf")
    build_academic_report_pdf(target_pdf)
