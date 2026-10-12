"""
Generate Academic Research Poster PDF
CHRIST (Deemed to be University), Delhi NCR Campus | School of Sciences
Project: Event Volunteer Hour Ledger
Format: High-Resolution Academic Conference Poster (A1 Landscape: 841mm x 594mm / 2384pt x 1684pt)
"""

import os
from reportlab.lib.pagesizes import landscape
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm

# Poster Dimensions: A1 Landscape (841 x 594 mm = 2383.94 x 1683.78 pt)
POSTER_WIDTH = 841.89 * mm
POSTER_HEIGHT = 595.28 * mm

def build_poster_pdf(output_path):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    # 25mm margins around the entire poster
    margin = 20 * mm
    doc = SimpleDocTemplate(
        output_path,
        pagesize=(POSTER_WIDTH, POSTER_HEIGHT),
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin
    )

    styles = getSampleStyleSheet()

    # Poster Typography Palette
    poster_title_style = ParagraphStyle(
        'PosterTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=32,
        leading=38,
        textColor=colors.HexColor('#ffffff'),
        alignment=1,
        spaceAfter=4
    )

    poster_subtitle_style = ParagraphStyle(
        'PosterSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#fde68a'),
        alignment=1,
        spaceAfter=6
    )

    poster_meta_style = ParagraphStyle(
        'PosterMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#e2e8f0'),
        alignment=1
    )

    box_title_style = ParagraphStyle(
        'BoxTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=6
    )

    box_subtitle_style = ParagraphStyle(
        'BoxSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#047857'),
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'PosterBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'PosterBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1e293b'),
        leftIndent=10,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'PosterCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )

    highlight_style = ParagraphStyle(
        'PosterHighlight',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#b45309')
    )

    story = []

    # =========================================================================
    # 1. HEADER BANNER
    # =========================================================================
    header_content = [
        Paragraph("CHRIST (DEEMED TO BE UNIVERSITY) • DELHI NCR CAMPUS • SCHOOL OF SCIENCES", ParagraphStyle('InstHead', parent=poster_meta_style, fontSize=13, fontName='Helvetica-Bold', textColor=colors.HexColor('#93c5fd'), spaceAfter=4)),
        Paragraph("EVENT VOLUNTEER HOUR LEDGER", poster_title_style),
        Paragraph("A Relational Database Management System for Service Hour Accounting, Faculty Verification &amp; Certificate Eligibility", poster_subtitle_style),
        Paragraph("<b>Author / Presenter:</b> Radhika (and Team) &nbsp;&bull;&nbsp; <b>Organization:</b> ADIKALA (Dance, Emcee, Technical, Creative, Music, Hospitality Sub-Clubs) &nbsp;&bull;&nbsp; <b>Live App:</b> <font color='#fde68a'><u>https://radhika2405-max.github.io/event-volunteer-hour-ledger/</u></font>", poster_meta_style)
    ]
    
    t_header = Table([[header_content]], colWidths=[POSTER_WIDTH - (2 * margin)])
    t_header.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0f172a')),
        ('BOX', (0,0), (-1,-1), 2, colors.HexColor('#1e3a8a')),
        ('TOPPADDING', (0,0), (-1,-1), 14),
        ('BOTTOMPADDING', (0,0), (-1,-1), 14),
        ('LEFTPADDING', (0,0), (-1,-1), 20),
        ('RIGHTPADDING', (0,0), (-1,-1), 20),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 12))

    # =========================================================================
    # 2. THREE-COLUMN POSTER GRID
    # =========================================================================
    # Total available width = POSTER_WIDTH - 2*margin = 2383.94 - 113.38 = 2270 pt
    # 3 columns with 15pt gap in between
    col_width = (POSTER_WIDTH - (2 * margin) - (2 * 14)) / 3.0  # Approx 739 pt each

    def make_card(title, content_list, border_color='#cbd5e1', bg_color='#ffffff', title_color='#1e3a8a'):
        t_style = ParagraphStyle('CTitle', parent=box_title_style, textColor=colors.HexColor(title_color))
        card_story = [Paragraph(title, t_style)]
        card_story.extend(content_list)
        
        t_box = Table([[card_story]], colWidths=[col_width - 8])
        t_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg_color)),
            ('BOX', (0,0), (-1,-1), 1.2, colors.HexColor(border_color)),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ]))
        return t_box

    # -------------------------------------------------------------------------
    # COLUMN 1: CONTEXT, PROBLEM & THE LEDGER PARADIGM
    # -------------------------------------------------------------------------
    col1_cards = []

    # Card 1.1: Problem & Motivation
    col1_cards.append(make_card(
        "1. Real-World Context &amp; The Spreadsheet Crisis",
        [
            Paragraph("<b>Institutional Domain:</b> CHRIST University's student wing <b>ADIKALA</b> coordinates student leadership across 6 specialized sub-clubs: Dance, Emcee, Technical, Creative, Music, and Hospitality. Festivals like <i>SUNERGOS</i> and <i>TARANG</i> mobilize hundreds of volunteer service hours.", body_style),
            Paragraph("<b>The 4 Fatal Spreadsheet Flaws:</b>", highlight_style),
            Paragraph("<b>• Mutable Update Anomaly:</b> Spreadsheets store a single mutable 'Total Hours' cell; concurrent edits overwrite historical totals without a paper trail.", bullet_style),
            Paragraph("<b>• Multi-Club Join Inflation:</b> Co-hosted events associate multiple sub-clubs; unnormalized queries multiply volunteer hours by the club count.", bullet_style),
            Paragraph("<b>• Premature Certification:</b> Unreviewed timesheets allow students to falsely claim threshold eligibility before faculty signoff.", bullet_style),
            Paragraph("<b>• Zero Forensic Auditability:</b> Absence of Change Data Capture (CDC) prevents determining who edited, approved, or revoked hours.", bullet_style)
        ],
        border_color='#b45309',
        bg_color='#fffbeb'
    ))
    col1_cards.append(Spacer(1, 10))

    # Card 1.2: The Ledger Paradigm
    col1_cards.append(make_card(
        "2. The Core Solution: The Ledger Paradigm",
        [
            Paragraph("To permanently eliminate the mutable aggregate anomaly, the schema applies the <b>Ledger Paradigm</b> inspired by double-entry financial accounting:", body_style),
            Paragraph("<b>Key Invariant:</b> Total hours are <i>NEVER</i> stored as a mutable column in the <code>students</code> table.", highlight_style),
            Paragraph("Every volunteer interval is an immutable transactional entry in <code>volunteer_hour_entries</code> with start/end timestamps and break duration.", body_style),
            Paragraph("<b>Dynamic Authoritative Aggregation:</b>", body_style),
            Table([[
                Paragraph("<b>Approved Hours:</b> H<sub>s</sub> = &sum;(verified_minutes) / 60.0<br/>WHERE submission_status IN ('approved', 'corrected')", code_style)
            ]], colWidths=[col_width - 32], style=[
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#e2e8f0')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
                ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ('LEFTPADDING', (0,0), (-1,-1), 8)
            ]),
            Spacer(1, 4),
            Paragraph("<b>Status Isolation:</b> Pending claimed hours and rejected submissions are strictly isolated from certified totals.", body_style)
        ],
        border_color='#0284c7',
        bg_color='#f0f9ff'
    ))
    col1_cards.append(Spacer(1, 10))

    # Card 1.3: Objectives & Policy Rules
    col1_cards.append(make_card(
        "3. System Objectives &amp; Policy Governance",
        [
            Paragraph("<b>Core University Milestone Rule:</b> Students achieving &ge; 20 verified volunteer hours (1,200 minutes) across university events earn an official <i>Certificate of Volunteer Contribution</i>.", body_style),
            Paragraph("• Deliver a 3NF/BCNF relational database in MySQL 8.0.", bullet_style),
            Paragraph("• Enforce engine-level Check Constraints and Foreign Key Actions.", bullet_style),
            Paragraph("• Implement database triggers for workflow rules and audit logging.", bullet_style),
            Paragraph("• Wrap certificate issuance in ACID transactions with row-level locks.", bullet_style),
            Paragraph("• Deploy a public verification engine validating cryptographic tokens.", bullet_style)
        ],
        border_color='#cbd5e1'
    ))

    # -------------------------------------------------------------------------
    # COLUMN 2: RELATIONAL ARCHITECTURE, ER MODEL & NORMALIZATION
    # -------------------------------------------------------------------------
    col2_cards = []

    # Card 2.1: System Architecture & 10 Normalized Relations
    col2_cards.append(make_card(
        "4. Three-Tier Architecture &amp; ER Design",
        [
            Paragraph("<b>1. Presentation Layer:</b> React 18 + Vite (TypeScript, Tailwind CSS, Recharts) hosted live on GitHub Pages.<br/><b>2. Application Layer:</b> Python 3.14 Flask REST API with Role-Based Access Control (RBAC).<br/><b>3. Database Layer:</b> MySQL 8.0 InnoDB Engine with 10 Normalized Tables:", body_style),
            Table([
                [Paragraph("<b>Relation</b>", code_style), Paragraph("<b>Key Attributes</b>", code_style), Paragraph("<b>Cardinality &amp; Purpose</b>", code_style)],
                [Paragraph("<code>users</code>", code_style), Paragraph("<code>user_id (PK), email, role</code>", code_style), Paragraph("1:1 with students; login identity &amp; RBAC.", code_style)],
                [Paragraph("<code>students</code>", code_style), Paragraph("<code>student_id (PK), user_id (FK)</code>", code_style), Paragraph("Academic registry; reg number &amp; programme.", code_style)],
                [Paragraph("<code>clubs</code>", code_style), Paragraph("<code>club_id (PK), parent_club_id</code>", code_style), Paragraph("1:N Recursive Self-Join (ADIKALA &amp; sub-clubs).", code_style)],
                [Paragraph("<code>events</code>", code_style), Paragraph("<code>event_id (PK), event_code</code>", code_style), Paragraph("1:N with participation; campus event logs.", code_style)],
                [Paragraph("<code>event_subclubs</code>", code_style), Paragraph("<code>(event_id, club_id) (PK)</code>", code_style), Paragraph("M:N junction linking events to collaborating clubs.", code_style)],
                [Paragraph("<code>event_volunteers</code>", code_style), Paragraph("<code>participation_id (PK)</code>", code_style), Paragraph("M:N student-event associative entity; UNIQUE.", code_style)],
                [Paragraph("<code>hour_entries</code>", code_style), Paragraph("<code>hour_entry_id (PK)</code>", code_style), Paragraph("1:N transactional ledger of work intervals.", code_style)],
                [Paragraph("<code>policies</code>", code_style), Paragraph("<code>policy_id (PK)</code>", code_style), Paragraph("1:N threshold policies (1,200 min = 20 hr).", code_style)],
                [Paragraph("<code>certificates</code>", code_style), Paragraph("<code>certificate_id (PK)</code>", code_style), Paragraph("1:N immutable award snapshot + SHA-256 token.", code_style)],
                [Paragraph("<code>audit_logs</code>", code_style), Paragraph("<code>audit_id (PK)</code>", code_style), Paragraph("Change Data Capture before/after JSON states.", code_style)],
            ], colWidths=[75, 150, 180], style=[
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ('TOPPADDING', (0,0), (-1,-1), 3), ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                ('LEFTPADDING', (0,0), (-1,-1), 4)
            ])
        ],
        border_color='#1e3a8a',
        bg_color='#ffffff'
    ))
    col2_cards.append(Spacer(1, 10))

    # Card 2.2: Normalization Journey & Eliminating Join Inflation
    col2_cards.append(make_card(
        "5. Normalization Journey &amp; Solving Join Inflation",
        [
            Paragraph("<b>Decomposition Steps (1NF &rarr; 3NF/BCNF):</b>", box_subtitle_style),
            Paragraph("<b>• 1NF (Atomicity):</b> Decomposed repeating comma-separated sub-club lists into junction entity <code>event_subclubs(event_id, club_id)</code>.", bullet_style),
            Paragraph("<b>• 2NF (Full Functional Dependency):</b> Decoupled club attributes (name) and event attributes (dates, venues) from junction composite keys.", bullet_style),
            Paragraph("<b>• 3NF &amp; BCNF (No Transitive Dependencies):</b> Isolated authentication from academic enrollment. Removed mutable calculated totals.", bullet_style),
            Spacer(1, 4),
            Paragraph("<b>The Join Inflation Resolution:</b>", box_subtitle_style),
            Paragraph("When an event involves 3 sub-clubs, joining clubs directly to hour entries triples student hours! Our design attaches hours strictly to <code>event_volunteers(participation_id)</code>. Club summaries use independent <code>COUNT(DISTINCT)</code> aggregations, guaranteeing zero double-counting.", body_style)
        ],
        border_color='#047857',
        bg_color='#f0fdf4'
    ))

    # -------------------------------------------------------------------------
    # COLUMN 3: PROGRAMMABILITY, CONCURRENCY, RESULTS & VERIFICATION
    # -------------------------------------------------------------------------
    col3_cards = []

    # Card 3.1: Active Triggers & ACID Stored Procedures
    col3_cards.append(make_card(
        "6. Active Triggers &amp; ACID Concurrency",
        [
            Paragraph("<b>Database Triggers (Workflow &amp; Audit Logging):</b>", box_subtitle_style),
            Paragraph("• <code>trg_vhe_before_insert</code>: Validates positive claimed minutes &amp; non-negative breaks.", bullet_style),
            Paragraph("• <code>trg_vhe_before_update</code>: Gatekeeper—rejecting hours without <code>rejection_reason</code> raises <code>SIGNAL SQLSTATE '45000'</code>.", bullet_style),
            Paragraph("• <code>trg_vhe_after_update</code>: Automatically logs old &amp; new states into <code>audit_logs</code> as JSON.", bullet_style),
            Spacer(1, 4),
            Paragraph("<b>ACID Certificate Issuance (Row-Level Locking):</b>", box_subtitle_style),
            Paragraph("In <code>sp_issue_certificate</code>, race conditions are blocked via row locks:", body_style),
            Table([[
                Paragraph("START TRANSACTION;<br/>"
                          "SELECT * FROM policies WHERE policy_id = 1 FOR SHARE;<br/>"
                          "SELECT * FROM students WHERE student_id = 4 FOR UPDATE;<br/>"
                          "IF approved_minutes &lt; 1200 THEN ROLLBACK; END IF;<br/>"
                          "IF active_cert_count &gt; 0 THEN ROLLBACK; END IF;<br/>"
                          "INSERT INTO certificates (...) VALUES (...);<br/>"
                          "COMMIT;", code_style)
            ]], colWidths=[col_width - 32], style=[
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#64748b')),
                ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ('LEFTPADDING', (0,0), (-1,-1), 8)
            ]),
        ],
        border_color='#7c3aed',
        bg_color='#faf5ff'
    ))
    col3_cards.append(Spacer(1, 10))

    # Card 3.2: Query Optimization & Indexing Strategy
    col3_cards.append(make_card(
        "7. Balanced B-Tree Indexing &amp; Analytics",
        [
            Paragraph("<b>Indexing Architecture:</b>", box_subtitle_style),
            Paragraph("• <b>Primary Clustered:</b> O(log N) row access across all 10 tables.", bullet_style),
            Paragraph("• <b>Secondary B-Tree:</b> <code>idx_users_email</code>, <code>idx_students_reg_no</code>, <code>idx_cert_token</code>.", bullet_style),
            Paragraph("• <b>Composite B-Tree:</b> <code>idx_vhe_part_status (participation_id, submission_status)</code> speeds view joins.", bullet_style),
            Paragraph("• <b>Query Execution (EXPLAIN):</b> Evaluates joins using index seeks (<code>ref/range</code>) under 50ms, eliminating full table scans (<code>ALL</code>).", bullet_style),
            Spacer(1, 4),
            Paragraph("<b>6 Analytical Reporting Queries (reports.sql):</b>", box_subtitle_style),
            Paragraph("1. Eligible Students (&ge; 20 Hrs) &bull; 2. Near-Threshold Volunteers (15–19.99 Hrs)<br/>"
                      "3. Event Labor without Duplication &bull; 4. Sub-Club Breakdown (Dance, Emcee, etc.)<br/>"
                      "5. Pending Timesheets Impact Simulation &bull; 6. Certificate Traceability Log", body_style)
        ],
        border_color='#0284c7',
        bg_color='#f0f9ff'
    ))
    col3_cards.append(Spacer(1, 10))

    # Card 3.3: Production Results, Live Verifier & Conclusion
    col3_cards.append(make_card(
        "8. Production Results &amp; Live Verification",
        [
            Paragraph("<b>Automated Test Scenarios Verified:</b>", box_subtitle_style),
            Paragraph("• <b>Student A (18h):</b> Ineligible &bull; <b>Student B (20h):</b> Eligible for Certificate<br/>"
                      "• <b>Student C (18h + 5h pending):</b> Review Pending &bull; <b>Student D (24h):</b> Certified", body_style),
            Spacer(1, 4),
            Paragraph("<b>Live Deployment &amp; Public Token Verifier:</b>", box_subtitle_style),
            Paragraph("Every certificate is embedded with a SHA-256 token verifiable at the live URL:<br/>"
                      "<font color='#1e3a8a'><b>https://radhika2405-max.github.io/event-volunteer-hour-ledger/</b></font>", body_style),
            Spacer(1, 4),
            Paragraph("<b>Conclusion:</b> Successfully models enterprise relational theory to solve real-world university service governance without data anomalies.", highlight_style)
        ],
        border_color='#047857',
        bg_color='#ecfdf5'
    ))

    # Assemble 3 columns in master table
    grid_data = [[col1_cards, col2_cards, col3_cards]]
    t_grid = Table(grid_data, colWidths=[col_width, col_width, col_width])
    t_grid.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_grid)

    doc.build(story)
    print(f"Research Poster PDF successfully generated: {output_path}")


if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    target_pdf = os.path.join(base_dir, "outputs", "Event_Volunteer_Hour_Ledger_Research_Poster.pdf")
    build_poster_pdf(target_pdf)
