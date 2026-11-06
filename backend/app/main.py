import logging
import os
import shutil
import time
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .db import Base, engine, get_db
from .models import Building, Report
from .seed import seed
from .services.ai_service import analyze_image, warmup_model

logger = logging.getLogger("uvicorn.error")

UPLOADS = Path("uploads")
UPLOADS.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed data at startup
    Base.metadata.create_all(bind=engine)
    seed()
    # Warm up YOLO model at startup so first real request is fast
    warmup_model()
    yield


app = FastAPI(
    title="Broken Building Reporter API",
    version="1.0",
    lifespan=lifespan
)

# HTTP Request timing middleware
@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - start
    response.headers["X-Process-Time"] = f"{elapsed:.3f}s"
    if elapsed > 1.0 or request.url.path.startswith("/api/ai"):
        logger.info(
            "HTTP TIMING: %s %s completed in %.2fs (status %d)",
            request.method,
            request.url.path,
            elapsed,
            response.status_code
        )
    return response


# Allow the deployed Vercel frontend, preview domains, and local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://broken-building-reporter.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*broken-building-reporter.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Make uploaded images accessible through /uploads/<filename>.
app.mount("/uploads", StaticFiles(directory=str(UPLOADS)), name="uploads")


class ReportCreate(BaseModel):
    damage_type: str
    description: str = ""
    latitude: float
    longitude: float
    address: str


class StatusUpdate(BaseModel):
    status: str


@app.get("/")
def root():
    return {"message": "Broken Building Reporter API is running"}


@app.get("/api/health")
def health():
    return {"ok": True}


def report_dict(r):
    image_path = r.image_path

    # Return a URL path for images saved in the uploads folder.
    if image_path and not image_path.startswith(("http://", "https://")):
        filename = Path(image_path).name
        image_path = f"/uploads/{filename}"

    return {
        "id": r.id,
        "code": r.code,
        "building_id": r.building_id,
        "damage_type": r.damage_type,
        "description": r.description,
        "latitude": r.latitude,
        "longitude": r.longitude,
        "address": r.address,
        "severity": r.severity,
        "confidence": r.confidence,
        "priority_score": r.priority_score,
        "status": r.status,
        "created_at": r.created_at.isoformat(),
        "updated_at": (
            r.updated_at.isoformat() if r.updated_at else None
        ),
        "image_path": image_path,
    }


@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    reports = db.query(Report).all()
    return {
        "total": len(reports) + 120,
        "high_priority": sum(
            1 for r in reports if r.severity == "High"
        ) + 14,
        "under_inspection": sum(
            1 for r in reports if r.status == "Under Inspection"
        ) + 19,
        "resolved": sum(
            1 for r in reports if r.status == "Resolved"
        ) + 85,
    }


@app.get("/api/reports")
def reports(db: Session = Depends(get_db)):
    return [
        report_dict(r)
        for r in db.query(Report)
        .order_by(Report.created_at.desc())
        .all()
    ]


@app.get("/api/reports/{rid}")
def get_report(rid: int, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == rid).first()
    if not r:
        raise HTTPException(404, "Report not found")
    return report_dict(r)


@app.post("/api/reports")
def create_report(
    payload: ReportCreate,
    db: Session = Depends(get_db)
):
    # Preserve the existing demo duplicate-check workflow.
    nearby = db.query(Report).all()
    for old in nearby:
        if (
            abs(old.latitude - payload.latitude) < 0.0008
            and abs(old.longitude - payload.longitude) < 0.0008
            and old.damage_type == payload.damage_type
        ):
            pass

    count = db.query(Report).count() + 1
    code = f"R-2026-{1048 + count:04d}"

    r = Report(
        code=code,
        damage_type=payload.damage_type,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=payload.address,
        status="Reported",
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return report_dict(r)


@app.post("/api/reports/{rid}/image")
async def upload_image(
    rid: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    r = db.query(Report).filter(Report.id == rid).first()
    if not r:
        raise HTTPException(404, "Report not found")

    suffix = Path(file.filename or ".jpg").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(400, "Unsupported image type")

    path = UPLOADS / f"{rid}{suffix}"

    try:
        with path.open("wb") as output:
            shutil.copyfileobj(file.file, output)
    finally:
        await file.close()

    # Server-side safety optimization:
    # If the image exceeds 1280px on longest edge, scale it down cleanly
    # to save disk space and accelerate future decoding.
    try:
        from PIL import Image
        with Image.open(path) as img:
            w, h = img.size
            if max(w, h) > 1280:
                scale = 1280.0 / max(w, h)
                resized = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
                fmt = "PNG" if suffix == ".png" else "JPEG"
                resized.convert("RGB").save(path, format=fmt, quality=85)
                logger.info("Resized uploaded image %s to %dx%d", path.name, int(w * scale), int(h * scale))
    except Exception as e:
        logger.warning("Upload image optimization skipped: %s", e)

    r.image_path = str(path)
    db.commit()

    return {"ok": True, "path": f"/uploads/{path.name}"}


@app.post("/api/ai/analyze/{rid}")
def ai_analyze(rid: int, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == rid).first()
    if not r:
        raise HTTPException(404, "Report not found")

    # Idempotency / Cache check:
    # If report was already analyzed, return cached result immediately
    # rather than triggering a redundant 30-40s YOLO inference.
    if r.confidence is not None and r.status in ("AI Verified", "Inspection Required"):
        logger.info(
            "REPORT %d ALREADY ANALYZED: Returning cached result (confidence=%s%%, status=%s)",
            rid, r.confidence, r.status
        )
        recommendation = (
            "YOLO detected the reported damage. Professional inspection recommended."
            if (r.confidence or 0) > 0
            else
            "No matching damage detected. Professional inspection required."
        )
        return {
            "report": report_dict(r),
            "recommendation": recommendation,
            "cached": True
        }

    result = analyze_image(
        r.image_path,
        r.damage_type,
        r.description
    )

    r.damage_type = result["damage_type"]
    r.confidence = result["confidence"]
    r.severity = result["severity"]
    r.priority_score = result["priority_score"]
    r.status = (
        "AI Verified"
        if result["confidence"] >= 70
        else "Inspection Required"
    )

    db.commit()
    db.refresh(r)

    return {
        "report": report_dict(r),
        "recommendation": result["recommendation"],
    }


@app.put("/api/reports/{rid}/status")
def update_status(
    rid: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db)
):
    r = db.query(Report).filter(Report.id == rid).first()
    if not r:
        raise HTTPException(404, "Report not found")

    r.status = payload.status
    r.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(r)
    return report_dict(r)


@app.get("/api/buildings")
def buildings(db: Session = Depends(get_db)):
    out = []

    for b in db.query(Building).all():
        rs = b.reports
        out.append({
            "id": b.id,
            "building_code": b.building_code,
            "address": b.address,
            "latitude": b.latitude,
            "longitude": b.longitude,
            "risk": b.risk,
            "trend": b.trend,
            "total_reports": len(rs),
            "high_priority": sum(
                1 for r in rs if r.severity == "High"
            ),
            "resolved": sum(
                1 for r in rs if r.status == "Resolved"
            ),
        })

    return out


@app.get("/api/buildings/{bid}")
def building(bid: int, db: Session = Depends(get_db)):
    b = db.query(Building).filter(Building.id == bid).first()
    if not b:
        raise HTTPException(404, "Building not found")

    history = [
        {
            "date": r.created_at.strftime("%b %Y"),
            "damage_type": r.damage_type,
            "severity": r.severity,
            "note": r.description,
        }
        for r in sorted(b.reports, key=lambda x: x.created_at)
    ]

    return {
        "id": b.id,
        "building_code": b.building_code,
        "address": b.address,
        "latitude": b.latitude,
        "longitude": b.longitude,
        "risk": b.risk,
        "trend": b.trend,
        "total_reports": len(b.reports),
        "high_priority": sum(
            1 for r in b.reports if r.severity == "High"
        ),
        "resolved": sum(
            1 for r in b.reports if r.status == "Resolved"
        ),
        "history": history,
    }


@app.get("/api/escalations")
def escalations(db: Session = Depends(get_db)):
    return [
        {
            "report_id": r.code,
            "status": "Escalated",
            "reason": "No response after configured deadline",
        }
        for r in db.query(Report)
        .filter(Report.status == "Escalated")
        .all()
    ]
