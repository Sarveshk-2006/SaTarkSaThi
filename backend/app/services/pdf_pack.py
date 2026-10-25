"""
Golden Hour complaint pack (PDF).

Built only from data the user actually supplied or that Satark Saathi recorded (incident,
draft, evidence references, timeline and audit timestamps). Nothing is invented: missing
items are listed in a checklist instead of being filled in.

Font note: ReportLab's built-in fonts cannot shape Indic scripts, so characters outside
Windows-1252 are replaced with '?' and the pack states this explicitly. The TXT export
keeps the exact original text.
"""

import io
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


class _SafeText:
    def __init__(self):
        self.replaced = False

    def __call__(self, value) -> str:
        text = "" if value is None else str(value)
        text = text.replace("₹", "INR ")
        out = []
        for ch in text:
            try:
                ch.encode("cp1252")
                out.append(ch)
            except UnicodeEncodeError:
                out.append("?")
                self.replaced = True
        return "".join(out)


def _fmt_dt(dt: Optional[datetime]) -> Optional[str]:
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%d-%b-%Y %H:%M UTC")


def _json(value, default):
    try:
        parsed = json.loads(value) if value else default
        return parsed if isinstance(parsed, type(default)) else default
    except (TypeError, ValueError):
        return default


def build_missing_checklist(fields: Dict) -> List[Tuple[str, bool, str]]:
    """(item, provided, what to do if missing)"""
    return [
        ("Date and time of the incident", bool(fields.get("incident_datetime")), "Note the exact time from your call log, SMS or bank alert."),
        ("Transaction reference / UTR", bool(fields.get("utr")), "Get the 12-digit UTR from your bank statement or UPI app transaction details."),
        ("Bank or payment app used", bool(fields.get("bank")), "Name the bank/app that debited your account."),
        ("Amount lost or at risk", (fields.get("amount") or 0) > 0, "Confirm the exact amount from your bank statement (enter 0 if nothing was debited)."),
        ("Suspect phone / UPI ID / account", bool(fields.get("suspect")), "Copy the caller number, UPI ID or account number used by the suspect."),
        ("Description of what happened", bool(fields.get("description")), "Write the sequence of events in your own words."),
        ("Evidence files (screenshots, recordings)", bool(fields.get("attachments")), "Keep screenshots of chats, call logs and payment screens to attach when filing."),
        ("Timeline of events", bool(fields.get("timeline")), "List each call/message/payment with its time."),
        ("Complainant contact details", bool(fields.get("complainant_phone")), "Add your phone number and address in your profile."),
    ]


def build_complaint_pack(incident, draft, profile, audit_events) -> bytes:
    safe = _SafeText()
    styles = getSampleStyleSheet()
    body = ParagraphStyle("body", parent=styles["BodyText"], fontSize=9.5, leading=13)
    small = ParagraphStyle("small", parent=body, fontSize=8, leading=10, textColor=colors.HexColor("#475569"))
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], fontSize=16, spaceAfter=4)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=12, spaceBefore=10, spaceAfter=4)
    mono = ParagraphStyle("mono", parent=body, fontName="Courier", fontSize=8, leading=10)

    def para(text, style=body):
        return Paragraph(escape(safe(text)).replace("\n", "<br/>"), style)

    meta = _json(incident.evidence_metadata if incident else None, {})
    timeline = _json(draft.timeline_events, []) or meta.get("timeline", []) or []
    attachments = _json(draft.evidence_attachments, []) or meta.get("attachments", []) or []
    transcript = meta.get("transcript")
    utr = (draft.transaction_reference or (incident.transaction_ref if incident else None) or "").strip()
    bank = draft.bank_or_app or (incident.bank_name if incident else None)
    suspect = incident.suspect_contact if incident else None
    incident_dt = draft.incident_datetime or (incident.incident_date if incident else None)
    amount = draft.financial_loss if draft.financial_loss is not None else (incident.financial_loss if incident else 0)
    description = draft.incident_narrative or (incident.description if incident else None)
    channel = draft.communication_channel or meta.get("channel")

    fields = {
        "incident_datetime": draft.incident_datetime,
        "utr": utr,
        "bank": bank,
        "amount": amount,
        "suspect": suspect,
        "description": description,
        "attachments": attachments,
        "timeline": timeline,
        "complainant_phone": profile.phone_number if profile else None,
    }

    story = []
    story.append(para("Satark Saathi - Golden Hour Complaint Pack (DRAFT)", h1))
    story.append(para(
        f"Generated {_fmt_dt(datetime.now(timezone.utc))} | Incident {incident.incident_id if incident else 'N/A'} | "
        f"Draft #{draft.id} | Draft status: {draft.status}", small))
    story.append(Spacer(1, 4))
    story.append(para(
        "NOT SUBMITTED: Satark Saathi has not filed this with police, a bank or cybercrime.gov.in. "
        "Review every section, correct anything inaccurate, then submit it yourself. Reporting does not guarantee recovery.",
        ParagraphStyle("warn", parent=body, textColor=colors.HexColor("#991B1B"))))

    story.append(para("1. Do this now", h2))
    for line in [
        "Call 1930 (National Cyber Crime Helpline) immediately - the first hours matter most.",
        "Register the complaint at https://cybercrime.gov.in using Section 5 of this pack.",
        "Call your bank's fraud line to request a recall and lien on the receiving account (Section 6).",
        "Block UPI/net banking if your credentials were shared.",
    ]:
        story.append(para(f"- {line}"))

    story.append(para("2. Case summary", h2))
    summary_rows = [
        ["Incident ID", incident.incident_id if incident else "N/A"],
        ["Scam category", draft.scam_category or (incident.scam_type if incident else None)],
        ["Communication channel", channel],
        ["Date/time of incident", _fmt_dt(incident_dt) if draft.incident_datetime else None],
        ["Amount lost / at risk", f"INR {amount:,.2f}" if amount else "INR 0.00 (attempted / no debit)"],
        ["Transfer status", draft.transfer_status],
        ["Bank / payment app", bank],
        ["Transaction ref / UTR", utr or None],
        ["Suspect identifier", suspect],
        ["Complainant", profile.full_name if profile else None],
        ["Complainant phone / email", f"{profile.phone_number} / {profile.email or '-'}" if profile else None],
        ["Complainant city", profile.city if profile else None],
        ["Case recorded in app", _fmt_dt(incident.created_at) if incident else None],
    ]
    table = Table(
        [[para(k, small), para(v if v else "[NOT PROVIDED]")] for k, v in summary_rows],
        colWidths=[45 * mm, 125 * mm],
    )
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(table)

    story.append(para("3. Missing information checklist", h2))
    checklist = build_missing_checklist(fields)
    missing = [c for c in checklist if not c[1]]
    story.append(para(
        f"{len(checklist) - len(missing)} of {len(checklist)} items provided. Items marked MISSING were left blank - "
        "nothing has been guessed or filled in for you.", small))
    check_table = Table(
        [[para("[PROVIDED]" if ok else "[MISSING]", small), para(item), para("" if ok else todo, small)] for item, ok, todo in checklist],
        colWidths=[22 * mm, 58 * mm, 90 * mm],
    )
    check_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        *[("BACKGROUND", (0, i), (0, i), colors.HexColor("#FEE2E2")) for i, c in enumerate(checklist) if not c[1]],
    ]))
    story.append(check_table)

    story.append(para("4. Evidence, timeline and recorded actions", h2))
    story.append(para("Evidence references (files are not embedded - attach the originals when filing):", small))
    if attachments:
        for a in attachments:
            story.append(para(f"- {a}"))
    else:
        story.append(para("- [NO EVIDENCE FILES LISTED]"))
    if meta.get("simulation_id"):
        story.append(para(f"- Payment Checkpoint assessment: {meta['simulation_id']}"))
    if incident and incident.analysis_id:
        story.append(para(f"- Scam Analyzer record #{incident.analysis_id}"))
    if transcript:
        story.append(para("Message transcript you supplied (first 1,500 characters):", small))
        story.append(para(str(transcript)[:1500], mono))

    story.append(para("Timeline you supplied:", small))
    if timeline:
        for t in timeline:
            story.append(para(f"- {t}"))
    else:
        story.append(para("- [NO TIMELINE EVENTS PROVIDED]"))

    story.append(para("Actions recorded by Satark Saathi (UTC timestamps):", small))
    if audit_events:
        rows = [[para(_fmt_dt(e.timestamp) or "-", small), para(e.event_type, small), para(e.description, small)] for e in audit_events]
        audit_table = Table(rows, colWidths=[32 * mm, 45 * mm, 93 * mm])
        audit_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(audit_table)
    else:
        story.append(para("- [NO RECORDED ACTIONS]"))

    for number, title, text in [
        (5, "Cyber Crime portal / 1930 complaint draft", draft.portal_complaint_text),
        (6, "Bank nodal officer dispute letter", draft.bank_complaint_text),
        (7, "Cyber police station complaint draft", draft.police_complaint_text),
    ]:
        story.append(PageBreak())
        story.append(para(f"{number}. {title}", h2))
        story.append(para(text or "[DRAFT EMPTY]", mono))

    if safe.replaced:
        story.insert(3, para(
            "Note: some characters (for example Hindi, Marathi or Kannada text) cannot be shown with this PDF's "
            "font and appear as '?'. Use the TXT export for the exact original text.",
            ParagraphStyle("note", parent=small, textColor=colors.HexColor("#92400E"))))

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(colors.HexColor("#64748B"))
        canvas.drawString(15 * mm, 10 * mm, "Satark Saathi draft - review before submission. Not filed with any authority.")
        canvas.drawRightString(195 * mm, 10 * mm, f"Page {doc.page}")
        canvas.restoreState()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm, topMargin=15 * mm, bottomMargin=18 * mm,
        title="Satark Saathi Golden Hour Complaint Pack", author="Satark Saathi (draft)",
    )
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return buffer.getvalue()
