import os
import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

CONFIG_FILE = Path(__file__).resolve().parent.parent.parent / "email_config.json"
SENT_EMAILS_DIR = Path(__file__).resolve().parent.parent.parent / "sent_emails"
SENT_EMAILS_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_CONFIG = {
    "enabled": True,
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "use_tls": True,
    "sender_email": "alerts@vijayawada-civic.gov.in",
    "sender_name": "Vijayawada Civic Safety & Structural Damage Reporter",
    "smtp_user": "",  # e.g. "yourname@gmail.com"
    "smtp_password": "",  # Google App Password (16 characters)
    "default_citizen_email": "rajesh.citizen@gmail.com",
    "default_authority_email": "k.ramesh.safety@vijayawada.gov.in",
    "admin_alert_email": "commissioner.vmc@ap.gov.in"
}

def get_email_config() -> Dict[str, Any]:
    merged = DEFAULT_CONFIG.copy()
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                merged.update(cfg)
        except Exception:
            pass

    # Cloud Deployment Environment Variables (Render, Railway, AWS, Docker)
    if os.environ.get("SMTP_USER"):
        merged["smtp_user"] = os.environ.get("SMTP_USER")
    if os.environ.get("SMTP_PASSWORD"):
        merged["smtp_password"] = os.environ.get("SMTP_PASSWORD")
    if os.environ.get("SMTP_SERVER"):
        merged["smtp_server"] = os.environ.get("SMTP_SERVER")
    if os.environ.get("SMTP_PORT"):
        try:
            merged["smtp_port"] = int(os.environ.get("SMTP_PORT"))
        except Exception:
            pass
    if os.environ.get("SENDER_NAME"):
        merged["sender_name"] = os.environ.get("SENDER_NAME")

    return merged

def save_email_config(config: Dict[str, Any]) -> bool:
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving email config: {e}")
        return False

def build_html_template(
    title: str,
    preheader: str,
    badge_text: str,
    badge_color: str,
    ticket_code: str,
    hazard_type: str,
    address: str,
    details_html: str,
    action_url: str = "http://localhost:5173",
    action_label: str = "View Ticket in Portal"
) -> str:
    """Generates an official civic email layout with responsive design."""
    now_str = datetime.now().strftime("%d %b %Y, %I:%M %p")
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f1f5f9; color: #1e293b; }}
    .wrapper {{ max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }}
    .header {{ background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 28px 24px; text-align: center; color: #ffffff; }}
    .logo-badge {{ display: inline-block; padding: 6px 14px; background: rgba(99, 102, 241, 0.25); border: 1px solid rgba(165, 180, 252, 0.3); border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #c7d2fe; margin-bottom: 12px; }}
    .header h1 {{ margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }}
    .header p {{ margin: 6px 0 0 0; font-size: 12px; color: #94a3b8; }}
    .content {{ padding: 28px 24px; }}
    .badge {{ display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 16px; background-color: {badge_color}; color: #ffffff; }}
    .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 18px 0; }}
    .card-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 13px; }}
    .card-row:last-child {{ border-bottom: none; }}
    .card-label {{ color: #64748b; font-weight: 600; }}
    .card-val {{ color: #0f172a; font-weight: 700; text-align: right; }}
    .btn {{ display: inline-block; padding: 12px 28px; background: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-size: 13px; font-weight: 700; text-align: center; margin: 16px 0; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); }}
    .footer {{ background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-badge">🏢 Vijayawada Municipal Corporation</div>
      <h1>Broken Building Reporter</h1>
      <p>Automated Civic Safety & Structural Damage Governance System</p>
    </div>
    <div class="content">
      <div class="badge">{badge_text}</div>
      <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #0f172a;">{title}</h2>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569; line-height: 1.5;">{preheader}</p>

      <div class="card">
        <div class="card-row">
          <span class="card-label">Ticket Reference:</span>
          <span class="card-val" style="color: #4f46e5; font-family: monospace;">{ticket_code}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Reported Hazard:</span>
          <span class="card-val">{hazard_type}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Location:</span>
          <span class="card-val">{address}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Timestamp:</span>
          <span class="card-val">{now_str}</span>
        </div>
      </div>

      <div style="font-size: 13px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        {details_html}
      </div>

      <div style="text-align: center;">
        <a href="{action_url}" class="btn">{action_label} &rarr;</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px 0;">This is an automated dispatch from the Civic Safety Command Center, Vijayawada.</p>
      <p style="margin: 0;">In case of immediate structural collapse emergency, contact VMC Emergency Helpline: <strong>1800-425-4440</strong>.</p>
    </div>
  </div>
</body>
</html>"""

def send_email_dispatch(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> Dict[str, Any]:
    """
    Dispatches email via SMTP if credentials are configured;
    always saves the generated email to sent_emails/ directory as audit evidence.
    """
    config = get_email_config()
    now = datetime.now()
    timestamp_slug = now.strftime("%Y%m%d_%H%M%S")
    clean_email = to_email.replace("@", "_at_").replace(".", "_")
    file_prefix = f"{timestamp_slug}_{clean_email}"
    
    # Save HTML snapshot for visual audit
    html_file = SENT_EMAILS_DIR / f"{file_prefix}.html"
    try:
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(html_content)
    except Exception as e:
        print(f"Warning: could not write email audit HTML: {e}")

    result = {
        "success": True,
        "to_email": to_email,
        "subject": subject,
        "timestamp": now.isoformat(),
        "delivery_method": "simulated_local",
        "saved_path": str(html_file),
        "error": None
    }

    # Attempt real SMTP transmission if configured
    smtp_user = config.get("smtp_user")
    smtp_pass = config.get("smtp_password")
    
    if config.get("enabled") and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{config.get('sender_name', 'Broken Building Reporter')} <{smtp_user}>"
            msg["To"] = to_email
            
            # Plain text part
            fallback = text_content or f"{subject}\nView details at http://localhost:5173"
            msg.attach(MIMEText(fallback, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            server = smtplib.SMTP(config.get("smtp_server", "smtp.gmail.com"), config.get("smtp_port", 587), timeout=10)
            if config.get("use_tls", True):
                server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, [to_email], msg.as_string())
            server.quit()
            
            result["delivery_method"] = "smtp_delivered"
            print(f"[EMAIL] Delivered live email to {to_email} via SMTP: {subject}")
        except Exception as e:
            err_msg = str(e)
            result["delivery_method"] = "smtp_failed_saved_locally"
            result["error"] = err_msg
            print(f"[EMAIL WARNING] SMTP delivery failed ({err_msg}). Saved email snapshot locally to {html_file.name}")
    else:
        print(f"[EMAIL LOG] Simulated email saved to {html_file.name} for {to_email} (Subject: {subject})")

    # Save metadata JSON
    json_file = SENT_EMAILS_DIR / f"{file_prefix}.json"
    try:
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
    except Exception:
        pass

    return result

# --- WORKFLOW-SPECIFIC EMAIL NOTIFIERS ---

def notify_ticket_created(report) -> list:
    """Notify citizen of ticket creation and notify authority triage team."""
    config = get_email_config()
    results = []

    # 1. Email to Citizen
    citizen_email = getattr(report, "citizen_email", None) or config.get("default_citizen_email")
    subject_citizen = f"🎫 Ticket Raised: {report.code} - {report.damage_type}"
    details_citizen = f"""
    <p>Thank you for contributing to civic safety. Your report has been logged in the Municipal safety grid and our YOLO AI Vision system has generated preliminary safety diagnostics.</p>
    <p><strong>Next Steps:</strong> Authorized structural engineers from the Municipal Corporation will review the photographic evidence and dispatch an inspection team within the mandated SLA window.</p>
    """
    html_citizen = build_html_template(
        title="Safety Ticket Raised Successfully",
        preheader="Your damage report is registered with the Municipal Corporation.",
        badge_text="Ticket Registered",
        badge_color="#4f46e5",
        ticket_code=report.code,
        hazard_type=report.damage_type,
        address=report.address,
        details_html=details_citizen,
        action_url=f"http://localhost:5173/reports/{report.id}",
        action_label="Track Live Ticket Status"
    )
    r1 = send_email_dispatch(citizen_email, subject_citizen, html_citizen)
    results.append(r1)

    # 2. Email to Authority
    authority_email = config.get("default_authority_email")
    subject_authority = f"🚨 New Triage Incident: {report.code} ({report.damage_type})"
    details_authority = f"""
    <p>A new citizen damage report requires structural safety triage. Review damage photographs and assign field inspection personnel.</p>
    <p><strong>Initial Description:</strong> {report.description or 'No extra description provided.'}</p>
    """
    html_authority = build_html_template(
        title="New Civic Incident Pending Triage",
        preheader="Citizen report awaiting municipal engineering review.",
        badge_text="Triage Required",
        badge_color="#d97706",
        ticket_code=report.code,
        hazard_type=report.damage_type,
        address=report.address,
        details_html=details_authority,
        action_url=f"http://localhost:5173/reports/{report.id}",
        action_label="Open Authority Triage Console"
    )
    r2 = send_email_dispatch(authority_email, subject_authority, html_authority)
    results.append(r2)

    return results

def notify_ai_assessment(report, confidence: float, severity: str, recommendation: str) -> list:
    """Send AI Vision diagnostic results, flagging high severity immediately."""
    config = get_email_config()
    results = []

    badge_color = "#dc2626" if severity == "High" else "#d97706" if severity == "Medium" else "#059669"
    badge_text = f"AI {severity.upper()} SEVERITY ({confidence:.1f}%)"

    subject = f"🔍 AI Inspection Complete: {report.code} - {severity} Severity"
    details = f"""
    <p>Automated YOLO11 neural vision analysis has completed on the photographic evidence submitted for <strong>{report.code}</strong>.</p>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin: 12px 0;">
      <p style="margin: 0 0 6px 0;"><strong>Confidence Score:</strong> <span style="font-size: 15px; color: #4f46e5; font-weight: bold;">{confidence:.1f}%</span></p>
      <p style="margin: 0 0 6px 0;"><strong>Severity Level:</strong> <span style="font-weight: bold;">{severity}</span></p>
      <p style="margin: 0 0 6px 0;"><strong>Assigned Dept:</strong> {report.assigned_dept or 'Building Safety Dept.'}</p>
      <p style="margin: 0;"><strong>Engineering Recommendation:</strong> {recommendation}</p>
    </div>
    """

    # If High, email Authority with urgent subject
    if severity == "High":
        auth_email = config.get("default_authority_email")
        urgent_sub = f"⚠️ CRITICAL HAZARD ALERT: {report.code} verified at {confidence:.1f}%"
        html_auth = build_html_template(
            title="CRITICAL STRUCTURAL HAZARD DETECTED",
            preheader="Automated AI vision classified this case as High Priority.",
            badge_text="URGENT HAZARD",
            badge_color="#dc2626",
            ticket_code=report.code,
            hazard_type=report.damage_type,
            address=report.address,
            details_html=details,
            action_url=f"http://localhost:5173/reports/{report.id}",
            action_label="Inspect & Dispatch Crew Immediately"
        )
        results.append(send_email_dispatch(auth_email, urgent_sub, html_auth))

    return results

def notify_status_updated(report, old_status: str, new_status: str, notes: str = "") -> list:
    """Notify citizen when authority updates status, assigns engineer, or works on case."""
    config = get_email_config()
    citizen_email = getattr(report, "citizen_email", None) or config.get("default_citizen_email")
    
    badge_color = "#059669" if new_status == "Resolved" else "#2563eb"
    badge_text = f"Status: {new_status}"
    
    subject = f"📋 Status Update on Ticket {report.code}: {new_status}"
    details = f"""
    <p>The municipal engineering authority has updated the operational status of your safety report.</p>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin: 12px 0;">
      <p style="margin: 0 0 6px 0;"><strong>Previous Status:</strong> {old_status}</p>
      <p style="margin: 0 0 6px 0;"><strong>Current Status:</strong> <span style="color: #2563eb; font-weight: bold;">{new_status}</span></p>
      <p style="margin: 0 0 6px 0;"><strong>Assigned Dept:</strong> {report.assigned_dept or 'Building Safety Dept.'}</p>
      <p style="margin: 0 0 6px 0;"><strong>Assigned Inspector:</strong> {report.assigned_inspector or 'Er. K. Ramesh (Senior Structural Assessor)'}</p>
      {f'<p style="margin: 0;"><strong>Official Notes:</strong> <em>"{notes}"</em></p>' if notes else ''}
    </div>
    """
    
    html = build_html_template(
        title=f"Ticket Moved to '{new_status}'",
        preheader="Municipal Safety Team has updated your report status.",
        badge_text=badge_text,
        badge_color=badge_color,
        ticket_code=report.code,
        hazard_type=report.damage_type,
        address=report.address,
        details_html=details,
        action_url=f"http://localhost:5173/reports/{report.id}",
        action_label="View Full Progress Timeline"
    )
    
    return [send_email_dispatch(citizen_email, subject, html)]

def notify_ticket_resolved(report, inspector_name: str, repair_notes: str = "") -> list:
    """Special celebration email sent to citizen when ticket is marked SOLVED / RESOLVED."""
    config = get_email_config()
    citizen_email = getattr(report, "citizen_email", None) or config.get("default_citizen_email")

    subject = f"✅ SOLVED: Building Safety Ticket {report.code} Certified Safe"
    details = f"""
    <p style="color: #065f46; font-weight: 600; font-size: 14px;">Great news! The structural damage issue you reported has been inspected, remediated, and officially marked as SOLVED.</p>
    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 14px; border-radius: 10px; margin: 14px 0;">
      <p style="margin: 0 0 8px 0; color: #047857;"><strong>Certified By:</strong> {inspector_name or 'Er. K. Ramesh (Senior Structural Assessor)'}</p>
      <p style="margin: 0 0 8px 0; color: #047857;"><strong>Department:</strong> {report.assigned_dept or 'Building Safety Dept.'}</p>
      <p style="margin: 0; color: #065f46;"><strong>Remediation Certification Notes:</strong><br/><em>"{repair_notes or 'Structural repairs verified compliant with municipal safety codes.'}"</em></p>
    </div>
    <p style="font-size: 12px; color: #64748b;">Thank you for your active civic participation in keeping Vijayawada buildings secure and safe.</p>
    """

    html = build_html_template(
        title="Ticket Solved & Certified Safe",
        preheader="Municipal safety officers have remediated the hazard.",
        badge_text="Solved & Certified",
        badge_color="#059669",
        ticket_code=report.code,
        hazard_type=report.damage_type,
        address=report.address,
        details_html=details,
        action_url=f"http://localhost:5173/reports/{report.id}",
        action_label="View Official Safety Certificate"
    )

    return [send_email_dispatch(citizen_email, subject, html)]

def notify_escalated(report, level_name: str, reason: str) -> list:
    """Send high-priority escalation alert to senior commissioners and civic leadership."""
    config = get_email_config()
    alert_email = config.get("admin_alert_email", "commissioner.vmc@ap.gov.in")

    subject = f"🚨 URGENT ESCALATION: {report.code} Escalated to {level_name}"
    details = f"""
    <p style="color: #991b1b; font-weight: bold;">ATTENTION: This ticket has been formally escalated due to exceeding SLA thresholds or exhibiting critical structural risk.</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 14px; border-radius: 10px; margin: 14px 0;">
      <p style="margin: 0 0 6px 0; color: #b91c1c;"><strong>Escalation Tier:</strong> Level {report.escalation_level} ({level_name})</p>
      <p style="margin: 0 0 6px 0; color: #b91c1c;"><strong>Trigger Reason:</strong> {reason}</p>
      <p style="margin: 0; color: #7f1d1d;"><strong>Building:</strong> {report.address}</p>
    </div>
    """

    html = build_html_template(
        title=f"URGENT ESCALATION: {level_name}",
        preheader="Immediate administrative intervention required.",
        badge_text="Executive Escalation",
        badge_color="#b91c1c",
        ticket_code=report.code,
        hazard_type=report.damage_type,
        address=report.address,
        details_html=details,
        action_url=f"http://localhost:5173/reports/{report.id}",
        action_label="Review Case & Issue Directives"
    )

    return [send_email_dispatch(alert_email, subject, html)]
