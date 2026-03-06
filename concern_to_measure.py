#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Concern to Measure -- printable worksheet PDF generator.
Uses reportlab to produce a professional A4 PDF handout.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.colors import HexColor

# == Colour palette ============================================================
C_HEADING = HexColor("#1a2e4a")   # Deep navy
C_ACCENT  = HexColor("#2d6a9f")   # Mid-blue
C_LIGHT   = HexColor("#e8f0f7")   # Light blue tint
C_MID     = HexColor("#c5d8ec")   # Mid-blue tint
C_BORDER  = HexColor("#a0b8d0")   # Subtle border
C_CAPTION = HexColor("#555555")   # Caption grey
C_WHITE   = colors.white

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm

# == Styles ====================================================================
_base = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, parent=_base["Normal"], **kw)

sTitle      = S("sTitle",      fontSize=18, leading=22, textColor=C_HEADING,
                fontName="Helvetica-Bold", spaceBefore=0, spaceAfter=4)
sSubtitle   = S("sSubtitle",   fontSize=9,  leading=12, textColor=C_CAPTION,
                fontName="Helvetica-Oblique", spaceAfter=6)
sSectionHd  = S("sSectionHd",  fontSize=11, leading=14, textColor=C_WHITE,
                fontName="Helvetica-Bold", spaceBefore=6, spaceAfter=2)
sBodyBold   = S("sBodyBold",   fontSize=8.5, leading=12, textColor=C_HEADING,
                fontName="Helvetica-Bold")
sBody       = S("sBody",       fontSize=8.5, leading=12, textColor=colors.black)
sNote       = S("sNote",       fontSize=7.5, leading=10, textColor=C_CAPTION,
                fontName="Helvetica-Oblique")
sFieldLabel = S("sFieldLabel", fontSize=8,   leading=11, textColor=C_HEADING,
                fontName="Helvetica-Bold")
sCheckItem  = S("sCheckItem",  fontSize=8.5, leading=13, textColor=colors.black,
                leftIndent=6)
sCheckSub   = S("sCheckSub",   fontSize=7.5, leading=11, textColor=C_CAPTION,
                fontName="Helvetica-Oblique", leftIndent=12)
sCaption    = S("sCaption",    fontSize=7.5, leading=10, textColor=C_CAPTION,
                fontName="Helvetica-Oblique", alignment=TA_CENTER, spaceBefore=3)

# == Helpers ===================================================================

def rule(color=C_ACCENT, thickness=0.75):
    return HRFlowable(width="100%", thickness=thickness, color=color,
                      spaceAfter=3, spaceBefore=3)


def section_header(text):
    tbl = Table([[Paragraph(text, sSectionHd)]],
                colWidths=[PAGE_W - 2 * MARGIN])
    tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), C_HEADING),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
    ]))
    return tbl


def field_row(label, lines=1, note=None):
    rows = [[Paragraph(label, sFieldLabel)]]
    for _ in range(lines):
        rows.append([hr_write()])
    tbl = Table(rows, colWidths=[PAGE_W - 2 * MARGIN])
    tbl.setStyle(TableStyle([
        ("LEFTPADDING",   (0, 0), (-1, -1), 2),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 2),
        ("TOPPADDING",    (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    elems = [tbl]
    if note:
        elems.append(Paragraph(note, sNote))
    return elems


def check(label, sub=None):
    items = [Paragraph("\u2610  " + label, sCheckItem)]
    if sub:
        items.append(Paragraph(sub, sCheckSub))
    return items


def header_row():
    cw = (PAGE_W - 2 * MARGIN) / 3
    data = [[
        Paragraph("Who / role: ___________________________", sFieldLabel),
        Paragraph("Date: ____________________", sFieldLabel),
        Paragraph("System / service: ___________________________", sFieldLabel),
    ]]
    tbl = Table(data, colWidths=[cw, cw, cw])
    tbl.setStyle(TableStyle([
        ("LEFTPADDING",   (0, 0), (-1, -1), 2),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 2),
        ("TOPPADDING",    (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    return tbl


def hr():
    """Tight rule for structural separators."""
    return HRFlowable(width="100%", thickness=0.5, color=C_BORDER,
                      spaceAfter=1, spaceBefore=4)


def hr_write():
    """Spacious rule giving ~8 mm of handwriting room above the line."""
    return HRFlowable(width="100%", thickness=0.5, color=C_BORDER,
                      spaceAfter=2, spaceBefore=22)


def scenario_table():
    c1 = (PAGE_W - 2 * MARGIN) * 0.60
    c2 = (PAGE_W - 2 * MARGIN) * 0.40
    labels = [
        ("Environment (assumptions):",
         "Load / degraded mode / location / user group"),
        ("Stimulus (event / load / failure / threat / change):",
         "What triggers the scenario?"),
        ("Scope (service / transaction / user group / component):",
         "Boundary of concern"),
        ("Response (observable behaviour):",
         "What the system does in response"),
        ("Response measure (how success is measured):",
         "Quantitative target -- feeds directly into the Requirement instance"),
    ]
    rows = []
    for lbl, hint in labels:
        rows.append([Paragraph(lbl, sFieldLabel),
                     Paragraph("<i>" + hint + "</i>", sNote)])
        rows.append([hr_write(), hr_write()])
    tbl = Table(rows, colWidths=[c1, c2])
    tbl.setStyle(TableStyle([
        ("LEFTPADDING",   (0, 0), (-1, -1), 2),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 2),
        ("TOPPADDING",    (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    return tbl


def measure_table():
    full = PAGE_W - 2 * MARGIN
    c1, c2 = full * 0.65, full * 0.35

    evidence = ("Evidence method:  \u2610 Test   \u2610 Monitoring   "
                "\u2610 Audit   \u2610 Drill   \u2610 Other: __________")

    rows = [
        [Paragraph('Requirement instance (SMART "shall" statement):', sFieldLabel), ""],
        [hr_write(), ""],
        [hr_write(), ""],
        [Paragraph("Metric(s) & target(s):", sFieldLabel),
         Paragraph("Measurement point (where measured):", sFieldLabel)],
        [hr_write(), hr_write()],
        [Paragraph("Time window / conditions:", sFieldLabel),
         Paragraph("Owner: _________________  Due / gate: _____________", sFieldLabel)],
        [hr_write(), hr_write()],
        [Paragraph(evidence, sBody), ""],
    ]
    tbl = Table(rows, colWidths=[c1, c2])
    tbl.setStyle(TableStyle([
        ("SPAN", (0, 0), (1, 0)),
        ("SPAN", (0, 1), (1, 1)),
        ("SPAN", (0, 2), (1, 2)),
        ("SPAN", (0, 7), (1, 7)),
        ("LEFTPADDING",   (0, 0), (-1, -1), 2),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 2),
        ("TOPPADDING",    (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND",    (0, 7), (1, 7), C_LIGHT),
        ("TOPPADDING",    (0, 7), (1, 7), 4),
        ("BOTTOMPADDING", (0, 7), (1, 7), 4),
    ]))
    return tbl


def process_flow():
    steps = [
        ("A", "Raw statement\n(verbatim)"),
        ("B", "Classify\nconcern type"),
        ("C", "Reframe as\na concern"),
        ("D", "Scenario\n(env / stim / resp)"),
        ("E", "Measure\n(metric + evidence)"),
        ("F", "Requirement\ninstance (SMART)"),
    ]
    cw = (PAGE_W - 2 * MARGIN) / len(steps)
    cells = [Paragraph("<b>" + s[0] + "</b><br/>" + s[1], sCaption)
             for s in steps]
    tbl = Table([cells], colWidths=[cw] * len(steps))
    tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), C_LIGHT),
        ("BACKGROUND",    (0, 0), (0, 0),   C_MID),
        ("BACKGROUND",    (5, 0), (5, 0),   C_MID),
        ("BOX",           (0, 0), (-1, -1), 0.5, C_BORDER),
        ("INNERGRID",     (0, 0), (-1, -1), 0.5, C_BORDER),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("FONTSIZE",      (0, 0), (-1, -1), 7.5),
    ]))
    return tbl

# == Build =====================================================================

def build_pdf(out_path="concern_to_measure.pdf"):
    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN,  bottomMargin=14 * mm,
        title="Concern to Measure -- Printable Worksheet",
        author="Architecture Practice",
        subject=("Stakeholder concern decomposition worksheet "
                 "(ISO/IEC/IEEE 42010 / ISO 25010 / TOGAF)"),
    )

    story = []

    # -- Title -----------------------------------------------------------------
    story.append(Paragraph("Concern to Measure", sTitle))
    story.append(rule())
    story.append(Paragraph(
        "Convert stakeholder language into structured concerns, scenarios, and measurable "
        "requirement instances. Follows ISO/IEC/IEEE 42010:2011 and TOGAF / BCS guidance. "
        "Allow 10-20 minutes per statement.",
        sSubtitle))

    story.append(process_flow())
    story.append(Paragraph(
        "Figure: Raw statement \u2192 Classify \u2192 Reframe \u2192 "
        "Scenario \u2192 Measure \u2192 Requirement instance",
        sCaption))
    story.append(Spacer(1, 4 * mm))

    # -- Section 1: Raw Statement ---------------------------------------------
    story.append(KeepTogether([
        section_header("1 \u00b7 Raw Statement"),
        Spacer(1, 2 * mm),
        header_row(),
        Spacer(1, 3 * mm),
    ]))

    for lbl, lines, note in [
        ("Raw statement (verbatim):", 2, None),
        ("Context -- when / where / which user journey or business scenario:", 2,
         "Include environment assumptions: peak / normal / degraded  \u00b7  "
         "locations  \u00b7  user groups."),
        ("Impact -- what is at risk (harm / cost / delay / compliance / operations):", 2, None),
    ]:
        story += field_row(lbl, lines, note)
        story.append(Spacer(1, 2 * mm))

    story.append(Spacer(1, 2 * mm))

    # -- Section 2: Classify --------------------------------------------------
    story.append(KeepTogether([
        section_header("2 \u00b7 Classify Concern Type  [tick all that apply]"),
        Spacer(1, 2 * mm),
        Paragraph("<b>Functional attributes</b> -- what the system must do", sBodyBold),
    ]))

    for item in [
        "Workflow / process step (create, approve, fulfil, reconcile)",
        "Data capture / validation / calculations",
        "Reporting / analytics output",
        "Integration / API / interface behaviour",
        "Roles / permissions / approvals (as a functional need)",
        "Notifications / messaging",
        "Search / retrieval",
        "Audit trail as a feature (who did what, when)",
        "Other: _______________________________",
    ]:
        story += check(item)

    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        "<b>Quality attributes / NFR types</b> -- how well it must do it  "
        "<i>(ISO/IEC 25010 primary labels \u2192 BCS NFR terms)</i>", sBodyBold))

    for lbl, sub in [
        ("Performance efficiency (ISO 25010) \u2192 Performance "
         "(BCS: throughput / response time)", None),
        ("Reliability (ISO 25010) \u2192 Availability / reliability / recoverability (BCS)",
         None),
        ("Security (ISO 25010) \u2192 Security / privacy / information assurance (BCS)",
         None),
        ("Usability (ISO 25010) \u2192 Usability / customer experience  "
         "(accessibility often sits here)", None),
        ("Compatibility (ISO 25010) \u2192 Interoperability / integratability (BCS)",
         None),
        ("Maintainability (ISO 25010) \u2192 Maintainability / modifiability / evolvability (BCS)",
         None),
        ("Portability (ISO 25010) \u2192 Portability (BCS)",
         "Tip: keep type vs instance clear -- e.g. 'throughput' as type vs "
         "'100 tps' as instance (Avancier)."),
    ]:
        story += check(lbl, sub)

    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        "<b>Planning &amp; governance attributes</b> -- constraints, risks, controls  "
        "<i>(ISO 42010 \u00a74.2)</i>", sBodyBold))

    for item in [
        "Cost / affordability",
        "Schedule / deadline / time-to-market",
        "Feasibility / known limitations",
        "Regulatory / compliance constraint",
        "Risk / assumptions / issues / dependencies  (RAID prompts)",
        "Standards / policy / principles constraint",
        "Decision authority required (who must approve / sign off)",
        "Supplier / contract / governance control requirement",
        "Other: _______________________________",
    ]:
        story += check(item)

    story.append(Spacer(1, 3 * mm))
    story += check("Possible conflict (forces)?   \u2610 Yes   \u2610 No")
    story.append(Paragraph(
        "If yes, name competing concerns and treat them as forces "
        "rather than personal disagreement.",
        sNote))
    story.append(Spacer(1, 4 * mm))

    # -- Section 3: Reframe ---------------------------------------------------
    story.append(KeepTogether([
        section_header("3 \u00b7 Reframe as a Concern  [neutral, actionable]"),
        Spacer(1, 2 * mm),
        Paragraph(
            "<i>Template: \"Our concern is [topic] so that [stakeholder outcome], "
            "under [context].\"</i>  -- ISO 42010 defines concern as a stakeholder interest; "
            "TOGAF emphasises concerns as roots of requirements decomposition.",
            sNote),
        Spacer(1, 2 * mm),
    ]))
    story += field_row("Reframed concern:", 2)
    story.append(Spacer(1, 4 * mm))

    # -- Section 4: Scenario --------------------------------------------------
    story.append(KeepTogether([
        section_header(
            "4 \u00b7 Scenario  [make it refutable -- SEI QAW / ATAM structure]"),
        Spacer(1, 2 * mm),
        scenario_table(),
        Spacer(1, 4 * mm),
    ]))

    # -- Section 5: Measure ---------------------------------------------------
    story.append(KeepTogether([
        section_header("5 \u00b7 Measure  [requirement instance + evidence]"),
        Spacer(1, 2 * mm),
        Paragraph(
            "BCS: NFRs are usually quantitatively measurable; link each SMART "
            '"shall" statement to an acceptance test, monitoring threshold, '
            "or audit criterion.",
            sNote),
        Spacer(1, 2 * mm),
        measure_table(),
    ]))

    story.append(Spacer(1, 6 * mm))
    story.append(rule(color=C_BORDER, thickness=0.5))
    story.append(Paragraph(
        "References: ISO/IEC/IEEE 42010:2011 \u00b7 ISO/IEC 25010:2011 \u00b7 "
        "TOGAF\u00ae (The Open Group) \u00b7 BCS Non-Functional Requirements guide \u00b7 "
        "SEI Quality Attribute Workshop (QAW) / ATAM \u00b7 Avancier Limited NFR guidance",
        sNote))

    doc.build(story)
    print("PDF written -> " + out_path)


if __name__ == "__main__":
    build_pdf("concern_to_measure.pdf")
