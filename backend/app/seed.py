from datetime import datetime, timedelta
from pathlib import Path
from .db import Base, engine, SessionLocal
from .models import Building, Report, Notification, AuditLog
from .services.ai_service import analyze_image

UPLOADS_DIR = Path("uploads").resolve()
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # If buildings already seeded, don't duplicate
    if db.query(Building).count() > 0:
        db.close()
        return

    print("Seeding database with realistic civic data for Vijayawada...")

    # 1. Buildings
    buildings_data = [
        ("B-1048", "Heritage Plaza, MG Road, Vijayawada", 16.5062, 80.6480, "High", "Increasing"),
        ("B-1022", "Hillview Apartments, Gunadala, Vijayawada", 16.5248, 80.6493, "Medium", "Stable"),
        ("B-0987", "Benz Tower, Ring Road, Vijayawada", 16.4970, 80.6570, "Low", "Decreasing"),
        ("B-0955", "Municipal Commercial Hub, Eluru Road, Vijayawada", 16.5180, 80.6350, "High", "Increasing"),
        ("B-0911", "Krishna Riverfront Residency, Labbipet, Vijayawada", 16.5002, 80.6425, "Medium", "Stable"),
        ("B-0876", "Auto Nagar Tech Park, Patamata, Vijayawada", 16.4955, 80.6680, "Low", "Stable"),
        ("B-0832", "Royal Heights, Mogalrajpuram, Vijayawada", 16.5188, 80.6510, "Medium", "Increasing"),
        ("B-0774", "Barrage View Tower, Governorpet, Vijayawada", 16.5085, 80.6080, "High", "Increasing"),
    ]

    buildings = []
    for code, addr, lat, lon, risk, trend in buildings_data:
        b = Building(
            building_code=code,
            address=addr,
            latitude=lat,
            longitude=lon,
            risk=risk,
            trend=trend,
            created_at=datetime.utcnow() - timedelta(days=60)
        )
        db.add(b)
        buildings.append(b)
    db.commit()

    # 2. Reports
    reports_data = [
        {
            "code": "R-2026-1048",
            "b_idx": 0,
            "damage_type": "Wall Crack",
            "description": "Severe vertical shear crack expanding along the northeast pillar near the ground floor entrance.",
            "severity": "High",
            "confidence": 92.0,
            "priority_score": 91,
            "status": "Under Inspection",
            "assigned_dept": "Building Safety Dept.",
            "assigned_inspector": "Er. K. Ramesh (Senior Structural Assessor)",
            "sla_hours": 48,
            "days_ago": 2,
            "img_id": 1,
            "recommendation": "YOLO detected high-confidence crack (92%). Immediate shoring and cordon recommended."
        },
        {
            "code": "R-2026-1022",
            "b_idx": 1,
            "damage_type": "Water Leakage",
            "description": "Continuous water seepage from external drainage pipe causing plaster bubbling and moisture spreading.",
            "severity": "Medium",
            "confidence": 85.0,
            "priority_score": 68,
            "status": "Repair Pending",
            "assigned_dept": "Engineering Dept.",
            "assigned_inspector": "S. Naidu (Plumbing & Waterworks)",
            "sla_hours": 72,
            "days_ago": 4,
            "img_id": 2,
            "recommendation": "Moderate water leakage detected (85%). Drainage line replacement required."
        },
        {
            "code": "R-2026-0987",
            "b_idx": 2,
            "damage_type": "Damaged Plaster",
            "description": "Surface spalling and cosmetic crack repaired and recoated on front elevation.",
            "severity": "Low",
            "confidence": 78.0,
            "priority_score": 38,
            "status": "Resolved",
            "assigned_dept": "Town Planning Dept.",
            "assigned_inspector": "M. Sunitha (Zonal Inspector)",
            "sla_hours": 120,
            "days_ago": 10,
            "img_id": 3,
            "repair_verified": True,
            "repair_notes": "Plaster patched with epoxy mortar; weatherproof coating reapplied.",
            "recommendation": "Surface defect resolved and verified."
        },
        {
            "code": "R-2026-0955",
            "b_idx": 3,
            "damage_type": "Exposed Wiring",
            "description": "High voltage junction box opened with bare uninsulated wires dangling over public walkway.",
            "severity": "High",
            "confidence": 95.0,
            "priority_score": 96,
            "status": "Escalated",
            "assigned_dept": "Electrical Dept.",
            "assigned_inspector": "P. Vijay (Chief Electrical Inspector)",
            "sla_hours": 24,
            "is_escalated": True,
            "escalation_level": 2,
            "escalation_reason": "SLA deadline breached without field response. Escalated to Municipal Commissioner.",
            "days_ago": 3,
            "img_id": 4,
            "recommendation": "Critical electrical hazard detected (95%). Power cut and insulated conduit required immediately."
        },
        {
            "code": "R-2026-0940",
            "b_idx": 4,
            "damage_type": "Structural Crack",
            "description": "Diagonal cross-beam crack visible on 2nd-floor balcony support slab.",
            "severity": "High",
            "confidence": 88.0,
            "priority_score": 90,
            "status": "Assigned",
            "assigned_dept": "Building Safety Dept.",
            "assigned_inspector": "Er. T. Rao (Civil Structural)",
            "sla_hours": 48,
            "days_ago": 1,
            "img_id": 5,
            "recommendation": "High risk structural crack detected (88%). Load-bearing test required."
        },
        {
            "code": "R-2026-0914",
            "b_idx": 5,
            "damage_type": "Broken Windows",
            "description": "Multiple shattered glass panels on upper facade posing hazard during heavy winds.",
            "severity": "Low",
            "confidence": 62.0,
            "priority_score": 35,
            "status": "Resolved",
            "assigned_dept": "Town Planning Dept.",
            "assigned_inspector": "K. Prasad (Building Officer)",
            "sla_hours": 96,
            "days_ago": 14,
            "img_id": 6,
            "repair_verified": True,
            "repair_notes": "Shattered panes removed and safety acrylic panels installed.",
            "recommendation": "Window hazard removed."
        },
        {
            "code": "R-2026-0881",
            "b_idx": 6,
            "damage_type": "Wall Crack",
            "description": "Hairline diagonal fissure across parapet wall after recent monsoon rains.",
            "severity": "Inspection Required",
            "confidence": 54.0,
            "priority_score": 45,
            "status": "Inspection Required",
            "assigned_dept": "Building Safety Dept.",
            "assigned_inspector": None,
            "sla_hours": 72,
            "days_ago": 5,
            "img_id": 7,
            "recommendation": "Visual evidence is inconclusive (54%). Human certified inspection required."
        },
        {
            "code": "R-2026-0842",
            "b_idx": 7,
            "damage_type": "Structural Crack",
            "description": "Foundation settling fissure on basement retaining wall near riverbank embankment.",
            "severity": "High",
            "confidence": 89.0,
            "priority_score": 94,
            "status": "Under Inspection",
            "assigned_dept": "Building Safety Dept.",
            "assigned_inspector": "Er. K. Ramesh (Senior Structural Assessor)",
            "sla_hours": 48,
            "days_ago": 6,
            "img_id": 8,
            "recommendation": "High confidence foundation crack detected (89%). Urgent soil stability check required."
        }
    ]

    for item in reports_data:
        b = buildings[item["b_idx"]]
        created_time = datetime.utcnow() - timedelta(days=item["days_ago"])
        img_file = UPLOADS_DIR / f"{item['img_id']}.jpg"
        img_path = str(img_file) if img_file.is_file() else None
        
        # Check if annotated image exists or generate
        annotated_path = None
        if img_path:
            res = analyze_image(img_path, item["damage_type"], item["description"], UPLOADS_DIR)
            annotated_path = res.get("annotated_image_path")

        r = Report(
            code=item["code"],
            building_id=b.id,
            damage_type=item["damage_type"],
            description=item["description"],
            latitude=b.latitude,
            longitude=b.longitude,
            address=b.address,
            severity=item["severity"],
            confidence=item["confidence"],
            priority_score=item["priority_score"],
            status=item["status"],
            assigned_dept=item.get("assigned_dept"),
            assigned_inspector=item.get("assigned_inspector"),
            sla_hours=item.get("sla_hours", 48),
            is_escalated=item.get("is_escalated", False),
            escalation_level=item.get("escalation_level", 0),
            escalation_reason=item.get("escalation_reason"),
            repair_verified=item.get("repair_verified", False),
            repair_notes=item.get("repair_notes"),
            recommendation=item["recommendation"],
            image_path=img_path,
            annotated_image_path=annotated_path,
            created_at=created_time,
            updated_at=created_time
        )
        db.add(r)
        db.flush()

        # Audit logs for realistic history
        db.add(AuditLog(
            report_id=r.id,
            action="Report Submitted",
            actor_role="Citizen",
            notes="Initial damage report submitted with photographic evidence.",
            created_at=created_time
        ))
        db.add(AuditLog(
            report_id=r.id,
            action="AI Verified",
            actor_role="AI System",
            notes=f"YOLO analysis: {r.damage_type} verified with {r.confidence}% confidence.",
            created_at=created_time + timedelta(minutes=2)
        ))
        if r.status in ["Assigned", "Under Inspection", "Repair Pending", "Resolved", "Escalated"]:
            db.add(AuditLog(
                report_id=r.id,
                action="Department Assigned",
                actor_role="Authority",
                notes=f"Assigned to {r.assigned_dept} (Officer: {r.assigned_inspector or 'TBD'})",
                created_at=created_time + timedelta(hours=3)
            ))
        if r.is_escalated:
            db.add(AuditLog(
                report_id=r.id,
                action="Escalated",
                actor_role="System",
                notes=r.escalation_reason,
                created_at=created_time + timedelta(hours=28)
            ))
        if r.repair_verified:
            db.add(AuditLog(
                report_id=r.id,
                action="Repair Verified",
                actor_role="Authority",
                notes=r.repair_notes,
                created_at=created_time + timedelta(days=2)
            ))

    # 3. Notifications
    notifs = [
        ("CRITICAL ESCALATION", "Report R-2026-0955: Exposed high-voltage wiring exceeded 24h SLA. Escalated to Commissioner.", "danger", "/reports/4"),
        ("New Inspection Scheduled", "Building B-1048: Senior Engineer assigned for on-site wall crack shoring review.", "info", "/reports/1"),
        ("Repair Verification Successful", "Report R-2026-0987: Benz Tower plaster restoration marked verified and resolved.", "success", "/reports/3"),
        ("High Priority Report Received", "Building B-0774: Foundation crack reported near riverbank approach.", "warning", "/reports/8"),
    ]
    for title, msg, tone, link in notifs:
        db.add(Notification(
            title=title,
            message=msg,
            tone=tone,
            link=link,
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=len(title))
        ))

    db.commit()
    db.close()
    print("Database seeding completed successfully with visual media references.")

if __name__ == "__main__":
    seed()
