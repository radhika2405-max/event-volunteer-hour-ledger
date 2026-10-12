import os
from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.graphics.shapes import Drawing, Rect, Line
from reportlab.pdfgen import canvas
from config import Config

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations()
            super().showPage()
        super().save()

    def draw_page_decorations(self):
        # A4 Landscape: 841.89 x 595.27 points
        width, height = landscape(A4)
        
        # Outer Gold Border
        self.setStrokeColor(colors.HexColor('#d97706')) # Warm gold
        self.setLineWidth(3)
        self.rect(20, 20, width - 40, height - 40)

        # Inner Navy Border
        self.setStrokeColor(colors.HexColor('#1e3a8a')) # Deep Navy
        self.setLineWidth(1)
        self.rect(26, 26, width - 52, height - 52)

        # Corner Accents
        self.setFillColor(colors.HexColor('#1e3a8a'))
        self.rect(20, height - 35, 15, 15, fill=1, stroke=0)
        self.rect(width - 35, height - 35, 15, 15, fill=1, stroke=0)
        self.rect(20, 20, 15, 15, fill=1, stroke=0)
        self.rect(width - 35, 20, 15, 15, fill=1, stroke=0)


def generate_certificate_pdf(certificate_data):
    """
    Generates an official A4 Landscape PDF certificate for a verified student volunteer.
    Returns bytes or writes to file.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    institution_style = ParagraphStyle(
        'InstTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1e3a8a')
    )

    sub_inst_style = ParagraphStyle(
        'SubInst',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#475569')
    )

    cert_heading = ParagraphStyle(
        'CertHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#b45309')
    )

    body_intro = ParagraphStyle(
        'BodyIntro',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#334155')
    )

    student_name_style = ParagraphStyle(
        'StudentName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#0f172a')
    )

    body_main = ParagraphStyle(
        'BodyMain',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=18,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#334155')
    )

    hours_highlight = ParagraphStyle(
        'HoursHigh',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=20,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1e3a8a')
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748b')
    )

    sign_style = ParagraphStyle(
        'SignStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1e3a8a')
    )

    sign_sub = ParagraphStyle(
        'SignSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#64748b')
    )

    elements = []

    # Institution Header
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("CHRIST (DEEMED TO BE UNIVERSITY)", institution_style))
    elements.append(Paragraph("DELHI NCR CAMPUS | SCHOOL OF SCIENCES", sub_inst_style))
    elements.append(Paragraph("ADIKALA (IZHAAR KALA KA) — Cultural, Technological & Performing Arts Council", sub_inst_style))
    elements.append(Spacer(1, 18))

    # Certificate Title
    elements.append(Paragraph("CERTIFICATE OF VOLUNTEER CONTRIBUTION", cert_heading))
    elements.append(Spacer(1, 14))

    # Recipient
    elements.append(Paragraph("This is proudly presented to", body_intro))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"<u>{certificate_data.get('student_name', 'Student Name')}</u>", student_name_style))
    elements.append(Spacer(1, 6))

    reg_no = certificate_data.get('registration_number', 'N/A')
    prog = certificate_data.get('programme', 'Department of Computer Science')
    elements.append(Paragraph(f"<b>Registration Number:</b> {reg_no} &nbsp;|&nbsp; <b>Programme:</b> {prog}", body_main))
    elements.append(Spacer(1, 12))

    # Certified labor text
    hours = certificate_data.get('eligibility_snapshot_hours', 20.0)
    minutes = certificate_data.get('eligibility_snapshot_minutes', int(hours * 60))
    policy = certificate_data.get('policy_name', 'All-Events Volunteer Honors Policy')

    elements.append(Paragraph(
        "in recognition of dedicated and exemplary service as a registered student volunteer across college events.<br/>"
        "The recipient has officially completed and verified:", body_main
    ))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(f"★ &nbsp; {hours} Certified Volunteer Hours ({minutes} Minutes) &nbsp; ★", hours_highlight))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"under policy: <i>{policy}</i>", meta_style))
    elements.append(Spacer(1, 24))

    # Signatures & Verification Block
    cert_no = certificate_data.get('certificate_number', 'CHRIST/ADIKALA/2026/0001')
    issue_date = certificate_data.get('issued_at', '2026-03-25')
    if isinstance(issue_date, str) and 'T' in issue_date:
        issue_date = issue_date.split('T')[0]
    token = certificate_data.get('verification_token', '')

    verify_url = f"{Config.FRONTEND_URL}/verify?token={token}"

    footer_data = [
        [
            Paragraph(f"<b>Certificate No:</b> {cert_no}<br/><b>Issue Date:</b> {issue_date}<br/><b>Verification:</b> {token[:16]}...", meta_style),
            Paragraph("___________________________<br/><b>Faculty Coordinator</b><br/><font size=7 color='#64748b'>(Authorized Placeholder)</font>", sign_style),
            Paragraph("___________________________<br/><b>Head of Department</b><br/><font size=7 color='#64748b'>(School of Sciences)</font>", sign_style)
        ]
    ]

    footer_table = Table(footer_data, colWidths=[280, 240, 240])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
    ]))
    elements.append(footer_table)

    doc.build(elements, canvasmaker=NumberedCanvas)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
