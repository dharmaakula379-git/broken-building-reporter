import json
import logging
import os
import shutil
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
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
from .services.ai_service import analyze_image, warmup_model, _inference_lock

logger = logging.getLogger("uvicorn.error")

UPLOADS = Path("uploads")
UPLOADS.mkdir(parents=True, exist_ok=True)

# Explicit completed lifecycle statuses that confirm AI analysis was executed.
AI_COMPLETED_STATUSES = {
    "AI Verified",
    "Inspection Required",
    "Assigned",
    "Under Inspection",
    "Repair Pending",
    "Resolved",
}


def is_analysis_complete(r: Report) -> bool:
    """
    Returns True ONLY if the report has an explicit, completed AI analysis result.
    Guarantees that unanalyzed, in-flight, failed, or partially-written reports
    are NEVER treated as cached hits.
    """
    if r is None:
        return False
    if r.confidence is None or r.status == "Reported":
        return False
    if r.status not in AI_COMPLETED_STATUSES:
        return False
    if r.priority_score is None:
        return False
    return True


def _cached_report_response(r: Report) -> dict:
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


_geocode_cache: dict = {}
_geocode_lock = threading.Lock()
_last_nominatim_time = 0.0


@app.get("/api/geocode")
def geocode_address(q: str = ""):
    """
    Geocodes a street or building address to latitude and longitude using
    OpenStreetMap Nominatim, respecting usage policies (1 req/sec limit,
    custom User-Agent, and query caching).
    """
    clean_q = (q or "").strip()
    if not clean_q or len(clean_q) < 3:
        return {
            "found": False,
            "message": "Address query must be at least 3 characters long.",
            "address": clean_q,
        }

    norm_key = " ".join(clean_q.lower().split())
    if norm_key in _geocode_cache:
        return {**_geocode_cache[norm_key], "cached": True}

    with _geocode_lock:
        # Double check cache inside lock
        if norm_key in _geocode_cache:
            return {**_geocode_cache[norm_key], "cached": True}

        # Respect OpenStreetMap Nominatim 1 request/second rate limit
        global _last_nominatim_time
        now = time.time()
        elapsed = now - _last_nominatim_time
        if elapsed < 1.0:
            time.sleep(1.0 - elapsed)
        _last_nominatim_time = time.time()

        params = urllib.parse.urlencode({
            "q": clean_q,
            "format": "json",
            "limit": 1,
            "addressdetails": 0
        })
        url = f"https://nominatim.openstreetmap.org/search?{params}"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "BrokenBuildingReporter/1.0 (contact: admin@brokenbuildingreporter.local)",
                "Accept-Language": "en"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=6.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception as exc:
            logger.warning("Geocoding request failed for %r: %s", clean_q, exc)
            return {
                "found": False,
                "error": "Geocoding service unavailable. You can enter coordinates manually.",
                "address": clean_q
            }

        if isinstance(data, list) and len(data) > 0:
            item = data[0]
            try:
                lat = round(float(item["lat"]), 6)
                lon = round(float(item["lon"]), 6)
                result = {
                    "found": True,
                    "latitude": lat,
                    "longitude": lon,
                    "display_name": item.get("display_name", clean_q),
                    "address": clean_q
                }
            except (ValueError, KeyError) as e:
                logger.warning("Failed parsing Nominatim response: %s", e)
                return {
                    "found": False,
                    "message": "Could not parse coordinates from geocoding service.",
                    "address": clean_q
                }
        else:
            result = {
                "found": False,
                "message": f"Could not find coordinates for '{clean_q}'. Please verify or enter coordinates manually.",
                "address": clean_q
            }

        if len(_geocode_cache) > 500:
            _geocode_cache.clear()
        _geocode_cache[norm_key] = result
        return result


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


# Synchronous def ensures file I/O and PIL resizing run in Starlette's threadpool,
# completely preventing CPU blocking on the asyncio event loop.
@app.post("/api/reports/{rid}/image")
def upload_image(
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
        file.file.close()

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


# Synchronous def ensures that waiting for the inference lock runs in Starlette's
# threadpool worker thread and NEVER blocks the FastAPI asyncio event loop.
@app.post("/api/ai/analyze/{rid}")
def ai_analyze(rid: int, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == rid).first()
    if not r:
        raise HTTPException(404, "Report not found")

    # Double-checked locking — Check 1: Fast path before acquiring the lock
    if is_analysis_complete(r):
        logger.info(
            "REPORT %d ALREADY ANALYZED (Pre-lock cache hit: confidence=%s%%, status=%s)",
            rid, r.confidence, r.status
        )
        return _cached_report_response(r)

    # Acquire inference lock to serialize CPU inference
    lock_start = time.perf_counter()
    acquired = _inference_lock.acquire(blocking=True, timeout=120)
    if not acquired:
        logger.error("INFERENCE LOCK TIMEOUT for report %d", rid)
        raise HTTPException(503, "AI inference engine is busy. Please try again.")

    try:
        # Double-checked locking — Check 2: Re-query DB after acquiring lock.
        # If another concurrent request analyzed this report while we were waiting
        # in the queue, return the newly committed result immediately without running YOLO.
        db.refresh(r)
        if is_analysis_complete(r):
            lock_wait = time.perf_counter() - lock_start
            logger.info(
                "REPORT %d ALREADY ANALYZED (Post-lock double-check hit: waited %.2fs, confidence=%s%%, status=%s)",
                rid, lock_wait, r.confidence, r.status
            )
            return _cached_report_response(r)

        result = analyze_image(
            r.image_path,
            r.damage_type,
            r.description,
            lock_already_acquired=True
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
    except Exception:
        db.rollback()
        raise
    finally:
        _inference_lock.release()


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
