from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pathlib import Path
from datetime import datetime, timedelta
import shutil
import json

import os
from .db import Base, engine, get_db
from .models import Building, Report, Notification, AuditLog
from .schemas import (
    ReportCreate, DuplicateCheck, StatusUpdate, EscalationAction, RepairVerificationSubmit,
    EmailSettingsUpdate, TestEmailRequest
)
from .seed import seed
from .services.ai_service import analyze_image, verify_repair_evidence
from .services.geo_service import find_duplicates, haversine_distance_meters
from .services.email_service import (
    get_email_config,
    save_email_config,
    send_email_dispatch,
    build_html_template,
    notify_ticket_created,
    notify_ai_assessment,
    notify_status_updated,
    notify_ticket_resolved,
    notify_escalated,
    SENT_EMAILS_DIR
)

# Create uploads and sent_emails directory
UPLOADS = Path("uploads").resolve()
UPLOADS.mkdir(parents=True, exist_ok=True)
SENT_EMAILS_DIR.mkdir(parents=True, exist_ok=True)

# Initialize database schema & seed data
Base.metadata.create_all(bind=engine)
try:
    seed()
except Exception as e:
    print(f"Seed error: {e}")

app = FastAPI(title="Broken Building Reporter API", version="2.0")

# Mount uploads and sent_emails for serving images and email previews
app.mount("/uploads", StaticFiles(directory=str(UPLOADS)), name="uploads")
app.mount("/sent_emails", StaticFiles(directory=str(SENT_EMAILS_DIR)), name="sent_emails")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resilient middleware to handle clients configured with /api in baseUrl (prevents /api/api 404)
@app.middleware("http")
async def fix_double_api_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/api/"):
        new_path = request.url.path.replace("/api/api/", "/api/", 1)
        request.scope["path"] = new_path
    response = await call_next(request)
    return response

def report_dict(r: Report) -> dict:
    image_url = f"/uploads/{Path(r.image_path).name}" if r.image_path and Path(r.image_path).is_file() else None
    annotated_url = f"/uploads/{Path(r.annotated_image_path).name}" if r.annotated_image_path and Path(r.annotated_image_path).is_file() else None
    repair_url = f"/uploads/{Path(r.repair_image_path).name}" if r.repair_image_path and Path(r.repair_image_path).is_file() else None

    # Calculate SLA status
    deadline = r.created_at + timedelta(hours=r.sla_hours)
    hours_left = max(0, round((deadline - datetime.utcnow()).total_seconds() / 3600, 1))
    sla_breached = datetime.utcnow() > deadline and r.status not in ["Resolved"]

    detections = []
    try:
        if r.detections_json:
            detections = json.loads(r.detections_json)
    except Exception:
        pass

    return {
        "id": r.id,
        "code": r.code,
        "building_id": r.building_id,
        "building_code": r.building.building_code if r.building else None,
        "damage_type": r.damage_type,
        "description": r.description,
        "latitude": r.latitude,
        "longitude": r.longitude,
        "address": r.address,
        "severity": r.severity,
        "confidence": r.confidence,
        "priority_score": r.priority_score,
        "recommendation": r.recommendation,
        "status": r.status,
        "assigned_dept": r.assigned_dept,
        "assigned_inspector": r.assigned_inspector,
        "sla_hours": r.sla_hours,
        "hours_left": hours_left,
        "sla_breached": sla_breached,
        "is_escalated": r.is_escalated,
        "escalation_level": r.escalation_level,
        "escalation_reason": r.escalation_reason,
        "image_url": image_url,
        "annotated_image_url": annotated_url,
        "repair_image_url": repair_url,
        "repair_notes": r.repair_notes,
        "repair_verified": r.repair_verified,
        "citizen_email": getattr(r, "citizen_email", "rajesh.citizen@gmail.com"),
        "detections": detections,
        "created_at": r.created_at.isoformat(),
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }

@app.get("/api/health")
def health():
    return {"ok": True, "status": "online", "timestamp": datetime.utcnow().isoformat()}

# --- DASHBOARD & METRICS ---
@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    reports = db.query(Report).all()
    total = len(reports)
    high_priority = sum(1 for r in reports if r.severity == "High")
    under_inspection = sum(1 for r in reports if r.status in ["Under Inspection", "Inspection Required"])
    resolved = sum(1 for r in reports if r.status == "Resolved")
    escalated = sum(1 for r in reports if r.is_escalated or r.status == "Escalated")
    
    # Department workload
    depts = {}
    for r in reports:
        d = r.assigned_dept or "Unassigned"
        depts[d] = depts.get(d, 0) + 1

    return {
        "total": total,
        "high_priority": high_priority,
        "under_inspection": under_inspection,
        "resolved": resolved,
        "escalated": escalated,
        "department_distribution": [{"name": k, "count": v} for k, v in depts.items()]
    }

# --- REPORTS CRUD ---
@app.get("/api/reports")
def get_reports(
    status: str = Query(None),
    severity: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Report)
    if isinstance(status, str) and status and status != "All":
        query = query.filter(Report.status == status)
    if isinstance(severity, str) and severity and severity != "All":
        query = query.filter(Report.severity == severity)
    
    reports_list = query.order_by(Report.created_at.desc()).all()
    if isinstance(search, str) and search.strip():
        s = search.lower().strip()
        reports_list = [
            r for r in reports_list
            if s in (r.code or "").lower()
            or s in (r.damage_type or "").lower()
            or s in (r.address or "").lower()
            or s in (r.status or "").lower()
        ]
    return [report_dict(r) for r in reports_list]

@app.get("/api/reports/{rid}")
def get_single_report(rid: int, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == rid).first()
    if not r:
        raise HTTPException(404, "Report not found")
    
    data = report_dict(r)
    # Include audit timeline
    audits = (
        db.query(AuditLog)
        .filter(AuditLog.report_id == rid)
        .order_by(AuditLog.created_at.asc())
        .all()
    )
    data["audits"] = [
        {
            "id": a.id,
            "action": a.action,
            "actor_role": a.actor_role,
            "notes": a.notes,
            "created_at": a.created_at.isoformat()
        }
        for a in audits
    ]
    return data

@app.post("/api/reports/check-duplicate")
def check_duplicate_report(payload: DuplicateCheck, db: Session = Depends(get_db)):
    duplicates = find_duplicates(
        db=db,
        latitude=payload.latitude,
        longitude=payload.longitude,
        damage_type=payload.damage_type,
        threshold_meters=payload.threshold_meters or 120.0
    )
    return {
        "has_duplicates": len(duplicates) > 0,
        "count": len(duplicates),
        "duplicates": duplicates
    }

@app.post("/api/reports")
def create_report(payload: ReportCreate, db: Session = Depends(get_db)):
    # 1. Match or associate to nearest known Building (within 200m)
    nearest_b = None
    min_dist = 999999
    for b in db.query(Building).all():
        dist = haversine_distance_meters(payload.latitude, payload.longitude, b.latitude, b.longitude)
        if dist < 200 and dist < min_dist:
            min_dist = dist
            nearest_b = b

    # If no building matches, create a new building profile automatically
    if not nearest_b:
        b_count = db.query(Building).count() + 1
        nearest_b = Building(
            building_code=f"B-{1050 + b_count}",
            address=payload.address,
            latitude=payload.latitude,
            longitude=payload.longitude,
            risk="Low",
            trend="Stable"
        )
        db.add(nearest_b)
        db.flush()

    count = db.query(Report).count() + 1
    code = f"TKT-2026-{1050 + count:04d}"

    citizen_email = getattr(payload, "citizen_email", None) or "rajesh.citizen@gmail.com"
    r = Report(
        code=code,
        building_id=nearest_b.id,
        damage_type=payload.damage_type,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=payload.address,
        citizen_email=citizen_email,
        status="Reported",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(r)
    db.flush()

    # Log submission audit
    db.add(AuditLog(
        report_id=r.id,
        action="Ticket Raised",
        actor_role="Citizen",
        notes=f"Ticket raised at {payload.address}. Photo evidence queued for AI diagnostic scan.",
        created_at=datetime.utcnow()
    ))
    
    # Notify Citizen via in-app & email
    db.add(Notification(
        title="Safety Ticket Raised",
        message=f"{r.code}: {r.damage_type} registered. Dispatching inspection team.",
        tone="info",
        link=f"/reports/{r.id}",
        recipient_email=r.citizen_email,
        email_sent=True,
        email_subject=f"🎫 Ticket Raised: {r.code} - {r.damage_type}"
    ))

    # Notify Authority triage team
    auth_email = get_email_config().get("default_authority_email", "k.ramesh.safety@vijayawada.gov.in")
    db.add(Notification(
        title="New Incident Pending Triage",
        message=f"{r.code}: {r.damage_type} reported at {r.address}",
        tone="warning",
        link=f"/reports/{r.id}",
        recipient_email=auth_email,
        email_sent=True,
        email_subject=f"🚨 New Triage Incident: {r.code} ({r.damage_type})"
    ))

    db.commit()
    db.refresh(r)

    # Dispatch email notifications
    try:
        notify_ticket_created(r)
    except Exception as em_err:
        print(f"Email dispatch error on ticket create: {em_err}")

    return report_dict(r)

@app.post("/api/reports/{rid}/image")
async def upload_image(rid: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == rid).first()
    if not r:
        raise HTTPException(404, "Report not found")
        
    suffix = Path(file.filename or ".jpg").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(400, "Unsupported image type. Use JPG, PNG or WEBP.")
        
    dest_path = UPLOADS / f"{rid}{suffix}"
    with dest_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    r.image_path = str(dest_path)
    r.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True, "image_path": str(dest_path), "url": f"/uploads/{dest_path.name}"}

@app.post("/api/ai/analyze/{rid}")
def ai_analyze_report(rid: int, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == rid).first()
    if not r:
        raise HTTPException(404, "Report not found")

    result = analyze_image(
        image_path=r.image_path,
        damage_type=r.damage_type,
        description=r.description or "",
        output_annotated_dir=UPLOADS
    )

    r.confidence = result["confidence"]
    r.severity = result["severity"]
    r.priority_score = result["priority_score"]
    r.recommendation = result["recommendation"]
    r.annotated_image_path = result.get("annotated_image_path")
    r.detections_json = json.dumps(result.get("detections", []))

    # Auto assign status & department based on AI findings
    detected_hazard = result.get("detected_primary_hazard") or ""
    active_hazard = detected_hazard or r.damage_type.lower()

    if result["confidence"] >= 60:
        r.status = "AI Verified"
        # Auto-route department based on detected hazard
        if "crack" in active_hazard or "plaster" in active_hazard:
            r.assigned_dept = "Building Safety Dept."
        elif "wire" in active_hazard or "electrical" in active_hazard:
            r.assigned_dept = "Electrical Dept."
        elif "leak" in active_hazard or "water" in active_hazard or "damp" in active_hazard:
            r.assigned_dept = "Engineering Dept."
        else:
            r.assigned_dept = "Town Planning Dept."
    else:
        r.status = "Inspection Required"
        r.assigned_dept = "Building Safety Dept."

    # Update building risk trend
    if r.building:
        if r.severity == "High":
            r.building.risk = "High"
            r.building.trend = "Increasing"
        elif r.building.risk != "High" and r.severity == "Medium":
            r.building.risk = "Medium"

    # Audit log
    db.add(AuditLog(
        report_id=r.id,
        action=r.status,
        actor_role="AI Vision Engine",
        notes=f"YOLO detection completed. Severity: {r.severity}, Confidence: {r.confidence}%. Bounding boxes generated.",
        created_at=datetime.utcnow()
    ))

    # If high severity, notify authorities immediately
    if r.severity == "High":
        auth_email = get_email_config().get("default_authority_email", "k.ramesh.safety@vijayawada.gov.in")
        db.add(Notification(
            title="HIGH PRIORITY HAZARD VERIFIED",
            message=f"{r.code}: {r.damage_type} verified with {r.confidence}% confidence at {r.address}",
            tone="danger",
            link=f"/reports/{r.id}",
            recipient_email=auth_email,
            email_sent=True,
            email_subject=f"⚠️ CRITICAL HAZARD ALERT: {r.code} verified at {r.confidence:.1f}%"
        ))

    db.commit()
    db.refresh(r)

    # Dispatch AI diagnostic notification email
    try:
        notify_ai_assessment(r, r.confidence, r.severity, r.recommendation or "")
    except Exception as em_err:
        print(f"Email dispatch error on AI assess: {em_err}")
    return {
        "report": report_dict(r),
        "recommendation": r.recommendation,
        "detections": result.get("detections", [])
    }

@app.put("/api/reports/{rid}/status")
def update_report_status(rid: int, payload: StatusUpdate, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == rid).first()
    if not r:
        raise HTTPException(404, "Report not found")
        
    old_status = r.status
    r.status = payload.status
    if payload.assigned_dept:
        r.assigned_dept = payload.assigned_dept
    if payload.assigned_inspector:
        r.assigned_inspector = payload.assigned_inspector
    r.updated_at = datetime.utcnow()

    # Log audit
    db.add(AuditLog(
        report_id=r.id,
        action=f"Status Changed: {old_status} -> {r.status}",
        actor_role="Authority",
        notes=payload.notes or f"Updated status to {r.status}. Dept: {r.assigned_dept or 'N/A'}",
        created_at=datetime.utcnow()
    ))
    
    cit_email = getattr(r, "citizen_email", None) or "rajesh.citizen@gmail.com"
    
    if r.status == "Resolved":
        if payload.notes:
            r.repair_notes = payload.notes
        db.add(Notification(
            title=f"Ticket Solved & Certified Safe",
            message=f"{r.code} at {r.address} marked as Solved by {r.assigned_inspector or 'Building Safety Dept.'}.",
            tone="success",
            link=f"/reports/{r.id}",
            recipient_email=cit_email,
            email_sent=True,
            email_subject=f"✅ SOLVED: Building Safety Ticket {r.code} Certified Safe"
        ))
        try:
            notify_ticket_resolved(r, r.assigned_inspector or "Er. K. Ramesh (Senior Structural Assessor)", payload.notes or "")
        except Exception as em_err:
            print(f"Email error on ticket resolved: {em_err}")
    else:
        db.add(Notification(
            title=f"Report Status Updated: {r.status}",
            message=f"{r.code} at {r.address} has been moved to '{r.status}'.",
            tone="info",
            link=f"/reports/{r.id}",
            recipient_email=cit_email,
            email_sent=True,
            email_subject=f"📋 Status Update on Ticket {r.code}: {r.status}"
        ))
        try:
            notify_status_updated(r, old_status, r.status, payload.notes or "")
        except Exception as em_err:
            print(f"Email error on status update: {em_err}")

    db.commit()
    db.refresh(r)
    return report_dict(r)

# --- REPAIR VERIFICATION ---
@app.post("/api/reports/{rid}/repair")
async def verify_repair(
    rid: int,
    notes: str = Query(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    r = db.query(Report).filter(Report.id == rid).first()
    if not r:
        raise HTTPException(404, "Report not found")

    suffix = Path(file.filename or ".jpg").suffix.lower()
    dest_path = UPLOADS / f"repair_{rid}{suffix}"
    with dest_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    r.repair_image_path = str(dest_path)
    r.repair_notes = notes

    # Run AI verification
    verification = verify_repair_evidence(str(dest_path), r.damage_type)
    r.repair_verified = verification["verified"]
    
    if verification["verified"]:
        r.status = "Resolved"
        log_action = "Repair Verified & Resolved"
        tone = "success"
        notif_msg = f"{r.code}: AI verified repair completion. Hazard cleared at {r.address}."
    else:
        r.status = "Repair Pending"
        log_action = "Repair Verification Inconclusive"
        tone = "warning"
        notif_msg = f"{r.code}: Repair inspection detected residual damage ({verification['confidence']}%). Re-work required."

    r.updated_at = datetime.utcnow()

    db.add(AuditLog(
        report_id=r.id,
        action=log_action,
        actor_role="AI System + Authority",
        notes=verification["notes"] + (f" Note: {notes}" if notes else ""),
        created_at=datetime.utcnow()
    ))

    db.add(Notification(
        title="Repair Verification Update",
        message=notif_msg,
        tone=tone,
        link=f"/reports/{r.id}"
    ))

    db.commit()
    db.refresh(r)
    return {
        "report": report_dict(r),
        "verification": verification
    }

# --- ESCALATION WORKFLOW ---
@app.post("/api/reports/{rid}/escalate")
def escalate_report(rid: int, payload: EscalationAction, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == rid).first()
    if not r:
        raise HTTPException(404, "Report not found")

    r.is_escalated = True
    r.status = "Escalated"
    r.escalation_level = payload.level
    r.escalation_reason = payload.reason
    r.updated_at = datetime.utcnow()

    levels = {
        1: "Ward Engineer",
        2: "Department Head",
        3: "Municipal Commissioner",
        4: "State Urban Development Directorate"
    }
    level_name = levels.get(payload.level, "Higher Authority")

    db.add(AuditLog(
        report_id=r.id,
        action=f"Escalated to Level {payload.level} ({level_name})",
        actor_role="Authority Escalation System",
        notes=payload.reason,
        created_at=datetime.utcnow()
    ))

    adm_email = get_email_config().get("admin_alert_email", "commissioner.vmc@ap.gov.in")
    db.add(Notification(
        title=f"URGENT ESCALATION: {level_name}",
        message=f"{r.code} at {r.address} escalated to {level_name}. Reason: {payload.reason}",
        tone="danger",
        link=f"/reports/{r.id}",
        recipient_email=adm_email,
        email_sent=True,
        email_subject=f"🚨 URGENT ESCALATION: {r.code} Escalated to {level_name}"
    ))

    db.commit()
    db.refresh(r)

    # Dispatch email
    try:
        notify_escalated(r, level_name, payload.reason)
    except Exception as em_err:
        print(f"Email error on escalation: {em_err}")

    return report_dict(r)

@app.get("/api/escalations")
def get_escalations(db: Session = Depends(get_db)):
    reports = db.query(Report).filter((Report.is_escalated == True) | (Report.status == "Escalated")).all()
    out = []
    for r in reports:
        out.append({
            "report_id": r.id,
            "code": r.code,
            "damage_type": r.damage_type,
            "address": r.address,
            "severity": r.severity,
            "level": r.escalation_level or 1,
            "reason": r.escalation_reason or "Exceeded mandated response deadline without required resolution.",
            "hours_overdue": 18,
            "created_at": r.created_at.isoformat()
        })
    return out

@app.get("/api/inspections")
def get_inspections(db: Session = Depends(get_db)):
    reports = db.query(Report).filter(
        Report.status.in_(["Inspection Required", "Under Inspection", "Assigned"])
    ).all()
    return [report_dict(r) for r in reports]

# --- BUILDINGS DIRECTORY ---
@app.get("/api/buildings")
def get_buildings(db: Session = Depends(get_db)):
    buildings_list = db.query(Building).all()
    out = []
    for b in buildings_list:
        rs = b.reports
        total = len(rs)
        high = sum(1 for r in rs if r.severity == "High")
        resolved = sum(1 for r in rs if r.status == "Resolved")
        out.append({
            "id": b.id,
            "building_code": b.building_code,
            "address": b.address,
            "latitude": b.latitude,
            "longitude": b.longitude,
            "risk": b.risk,
            "trend": b.trend,
            "total_reports": total,
            "high_priority": high,
            "resolved": resolved
        })
    return out

@app.get("/api/buildings/{bid}")
def get_building_profile(bid: int, db: Session = Depends(get_db)):
    b = db.query(Building).filter(Building.id == bid).first()
    if not b:
        raise HTTPException(404, "Building not found")
        
    history = []
    for r in sorted(b.reports, key=lambda x: x.created_at, reverse=True):
        history.append({
            "id": r.id,
            "code": r.code,
            "date": r.created_at.strftime("%b %d, %Y"),
            "damage_type": r.damage_type,
            "severity": r.severity,
            "status": r.status,
            "confidence": r.confidence,
            "note": r.description or "Reported visible damage."
        })
        
    return {
        "id": b.id,
        "building_code": b.building_code,
        "address": b.address,
        "latitude": b.latitude,
        "longitude": b.longitude,
        "risk": b.risk,
        "trend": b.trend,
        "total_reports": len(b.reports),
        "high_priority": sum(1 for r in b.reports if r.severity == "High"),
        "resolved": sum(1 for r in b.reports if r.status == "Resolved"),
        "history": history
    }

# --- NOTIFICATIONS & EMAIL DISPATCH ---
@app.get("/api/notifications")
def get_notifications(db: Session = Depends(get_db)):
    notifs = db.query(Notification).order_by(Notification.created_at.desc()).limit(30).all()
    unread_count = sum(1 for n in notifs if not n.is_read)
    return {
        "unread_count": unread_count,
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "tone": n.tone,
                "link": n.link,
                "is_read": n.is_read,
                "recipient_email": getattr(n, "recipient_email", "rajesh.citizen@gmail.com") or "rajesh.citizen@gmail.com",
                "email_sent": getattr(n, "email_sent", True),
                "email_subject": getattr(n, "email_subject", None),
                "created_at": n.created_at.isoformat()
            }
            for n in notifs
        ]
    }

@app.put("/api/notifications/{nid}/read")
def mark_notification_read(nid: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == nid).first()
    if n:
        n.is_read = True
        db.commit()
    return {"ok": True}

@app.post("/api/notifications/mark-all-read")
def mark_all_notifications_read(db: Session = Depends(get_db)):
    db.query(Notification).update({Notification.is_read: True})
    db.commit()
    return {"ok": True}

@app.get("/api/notifications/settings")
def get_email_settings():
    cfg = get_email_config()
    masked = cfg.copy()
    if masked.get("smtp_password"):
        masked["has_password"] = True
        masked["smtp_password"] = "••••••••••••••••"
    else:
        masked["has_password"] = False
    return masked

@app.put("/api/notifications/settings")
def update_email_settings(payload: EmailSettingsUpdate):
    curr = get_email_config()
    new_cfg = payload.dict()
    # Preserve existing password if user didn't change masked string
    if not new_cfg.get("smtp_password") or "••••" in new_cfg.get("smtp_password"):
        new_cfg["smtp_password"] = curr.get("smtp_password", "")
    save_email_config(new_cfg)
    return {"ok": True, "settings": get_email_settings()}

@app.post("/api/notifications/test-email")
def send_test_email(payload: TestEmailRequest):
    html = build_html_template(
        title="Civic Safety Notification Test",
        preheader="This verifies your Broken Building Reporter email notification pipeline.",
        badge_text="System Verified",
        badge_color="#4f46e5",
        ticket_code="TKT-2026-TEST",
        hazard_type="Structural Inspection Alert",
        address="Municipal Administrative Complex, Vijayawada",
        details_html=f"""
        <p>{payload.message}</p>
        <p style="background: #e0e7ff; padding: 10px; border-radius: 8px; color: #3730a3; font-weight: 500;">
          If you are reading this email, your notification configuration in <strong>Broken Building Reporter</strong> is active and delivering alerts!
        </p>
        """,
        action_url="http://localhost:5173",
        action_label="Open Live Dashboard"
    )
    res = send_email_dispatch(payload.to_email, payload.subject or "🔔 Test Notification from Broken Building Reporter", html)
    return res

@app.get("/api/notifications/sent-emails")
def list_sent_emails():
    out = []
    if SENT_EMAILS_DIR.exists():
        for p in sorted(SENT_EMAILS_DIR.glob("*.json"), key=os.path.getmtime, reverse=True)[:25]:
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    html_path = p.with_suffix(".html")
                    if html_path.exists():
                        data["html_url"] = f"/sent_emails/{html_path.name}"
                    out.append(data)
            except Exception:
                pass
    return {"total": len(out), "emails": out}
    db.commit()
    return {"ok": True}

# --- ANALYTICS ---
@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    reports = db.query(Report).all()
    total = len(reports)
    resolved = sum(1 for r in reports if r.status == "Resolved")
    escalated = sum(1 for r in reports if r.is_escalated)
    
    # Category counts
    cat_counts = {}
    for r in reports:
        cat_counts[r.damage_type] = cat_counts.get(r.damage_type, 0) + 1
        
    return {
        "kpis": {
            "total_reports": total,
            "resolution_rate": f"{round((resolved / max(1, total)) * 100)}%",
            "avg_response_days": "1.8 days",
            "escalation_count": escalated,
            "high_risk_buildings": db.query(Building).filter(Building.risk == "High").count()
        },
        "monthly_trend": [
            {"month": "May", "count": 28},
            {"month": "Jun", "count": 35},
            {"month": "Jul", "count": 42},
            {"month": "Aug", "count": 59},
            {"month": "Sep", "count": 51},
            {"month": "Oct", "count": 68},
            {"month": "Nov", "count": total}
        ],
        "category_breakdown": [
            {"category": k, "count": v} for k, v in cat_counts.items()
        ],
        "sla_performance": {
            "within_sla": round(((total - escalated) / max(1, total)) * 100),
            "breached_sla": round((escalated / max(1, total)) * 100)
        }
    }
