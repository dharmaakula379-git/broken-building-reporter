import logging
import math
import os
import time
import threading
from pathlib import Path
from typing import Optional, Union

import torch
from ultralytics import YOLO
from PIL import Image


def _detect_container_cpu_quota() -> int:
    """
    Detects the effective CPU quota in Linux container environments (Render, Docker, K8s).
    Prioritizes Linux cgroups (v2 and v1) bandwidth limits over host core counts or affinity masks,
    ensuring fractional quotas (e.g., 0.15 - 0.5 CPU) correctly restrict PyTorch to 1 thread.
    """
    cfs_quota_cpus = None

    # 1. Linux cgroups v2: /sys/fs/cgroup/cpu.max ($MAX $PERIOD)
    try:
        cg_v2 = Path("/sys/fs/cgroup/cpu.max")
        if cg_v2.is_file():
            parts = cg_v2.read_text().strip().split()
            if len(parts) == 2 and parts[0] != "max":
                quota, period = float(parts[0]), float(parts[1])
                if period > 0 and quota > 0:
                    cfs_quota_cpus = quota / period
    except Exception:
        pass

    # 2. Linux cgroups v1: cpu.cfs_quota_us & cpu.cfs_period_us
    if cfs_quota_cpus is None:
        try:
            q_path = Path("/sys/fs/cgroup/cpu/cpu.cfs_quota_us")
            p_path = Path("/sys/fs/cgroup/cpu/cpu.cfs_period_us")
            if q_path.is_file() and p_path.is_file():
                quota, period = float(q_path.read_text().strip()), float(p_path.read_text().strip())
                if quota > 0 and period > 0:
                    cfs_quota_cpus = quota / period
        except Exception:
            pass

    # If a cgroup CFS quota is present, respect it directly:
    # Fractional quotas <= 1.0 (such as Render free tier's 0.15 - 0.5 CPU) MUST yield 1 thread.
    if cfs_quota_cpus is not None:
        if cfs_quota_cpus <= 1.0:
            return 1
        return max(1, min(4, int(round(cfs_quota_cpus))))

    # 3. Only if no cgroups quota is configured, inspect CPU affinity
    if hasattr(os, "sched_getaffinity"):
        try:
            affinity = len(os.sched_getaffinity(0))
            if affinity > 0:
                return max(1, min(4, affinity))
        except Exception:
            pass

    # 4. Fallback: clamp host core count to up to 4 threads for fast parallel CPU convolutions
    return max(1, min(4, (os.cpu_count() or 1)))


is_render = os.environ.get("RENDER", "").lower() in ("true", "1")
detected_cpus = _detect_container_cpu_quota()

# On Render free tier (fractional 0.15-0.5 CPU) or fractional cgroups, use strictly 1 thread
# to prevent multi-threaded CFS context switching and kernel throttling.
# On multi-core hosts outside Render, use up to 4 parallel threads.
if is_render or (detected_cpus is not None and detected_cpus <= 1.0):
    num_threads = 1
else:
    num_threads = max(1, min(4, (detected_cpus or os.cpu_count() or 1)))

torch.set_num_threads(num_threads)
torch.set_num_interop_threads(1)

logger7 = logging.getLogger("uvicorn.error")

# LOAD YOLO MODEL (loaded ONCE at application startup, reused safely across all requests)
MODEL_PATH7 = Path(__file__).resolve().parent.parent / "best.pt"

if not MODEL_PATH7.is_file():
    raise FileNotFoundError(f"YOLO model not found: {MODEL_PATH7}")

model7 = YOLO(str(MODEL_PATH7))

# Fuse Conv2d + BatchNorm layers permanently to eliminate BatchNorm overhead on CPU
try:
    model7.fuse()
    logger7.info("YOLO layers fused successfully (Conv2d + BatchNorm).")
except Exception as e:
    logger7.warning("Model fusion skipped: %s", e)

try:
    if hasattr(model7, "model") and hasattr(model7.model, "eval"):
        model7.model.eval()
except Exception:
    pass

logger7.info("YOLO MODEL TYPE: %s", model7.model.__class__.__name__)
logger7.info("YOLO MODEL TASK: %s", model7.task)
logger7.info("MODEL CONFIG: %s", getattr(model7.model, "yaml", "custom"))
logger7.info("MODEL LAYERS: %s", len(getattr(model7.model, "model", [])))
logger7.info("MODEL FILE SIZE: %.2f MB", MODEL_PATH7.stat().st_size / (1024 * 1024))
logger7.info(
    "CPU THREADS CONFIGURED: %d (is_render: %s, detected quota: %s, host cpus: %s)",
    num_threads, is_render, detected_cpus, os.cpu_count()
)

# Concurrency control: serialize CPU inference so multiple simultaneous requests
# do not thrash the fractional CPU and cause timeouts / 5+ minute hangs.
_inference_lock = threading.Lock()

# DAMAGE CLASS MAPPING
# Maps citizen-facing damage types to model class names (0: crack, 1: water_leakage, 2: exposed_wire)
CLASS_MAP7 = {
    "structural crack": "crack",
    "wall crack": "crack",
    "crack": "crack",
    "water leakage": "water_leakage",
    "exposed wiring": "exposed_wire",
    "exposed wire": "exposed_wire"
}


def warmup_model():
    """
    Warms up the YOLO model with a lightweight synthetic image at application startup.
    This triggers PyTorch kernel compilation, graph tracing, and memory allocator
    setup at startup so the first real user submission does not suffer cold-init delay.
    """
    try:
        import numpy as np
        t0 = time.perf_counter()
        logger7.info("YOLO MODEL WARMUP INITIATING (imgsz=320, conf=0.20, threads=%d)...", num_threads)
        dummy = np.zeros((320, 320, 3), dtype=np.uint8)
        with torch.inference_mode():
            model7.predict(
                source=dummy,
                conf=0.20,
                imgsz=320,
                device="cpu",
                max_det=1,
                verbose=False
            )
        elapsed = time.perf_counter() - t0
        logger7.info("YOLO MODEL WARMUP COMPLETED IN %.2f SECONDS", elapsed)
    except Exception as e:
        logger7.warning("YOLO model warmup encountered issue: %s", e)


def _preprocess_image_source(image_path: Path) -> Union[str, Path, Image.Image]:
    """
    Ensures image is ready for YOLO inference. If the image exceeds 1024px,
    resizes it cleanly with bilinear interpolation. If already optimized,
    returns the file path directly for zero-copy C++ letterboxing.
    """
    try:
        if image_path.stat().st_size > 1.5 * 1024 * 1024:
            with Image.open(image_path) as img:
                w, h = img.size
                max_dim = max(w, h)
                if max_dim > 1024:
                    scale = 1024.0 / max_dim
                    new_size = (int(w * scale), int(h * scale))
                    resized = img.resize(new_size, Image.Resampling.BILINEAR)
                    return resized.convert("RGB")
    except Exception as e:
        logger7.warning("Pre-resizing skipped for %s: %s", image_path, e)
    return str(image_path)


def analyze_image(
    image_path: str | None,
    damage_type: str,
    description: str = "",
    lock_already_acquired: bool = False
):
    total_start = time.perf_counter()
    timings = {}
    logger7.info("========== YOLO DIAGNOSTICS ==========")
    logger7.info("Image path: %s", image_path)
    logger7.info("Model classes: %s", getattr(model7, "names", {}))
    logger7.info("Selected damage: %s", damage_type)

    if not image_path or not Path(image_path).is_file():
        logger7.error("IMAGE FILE NOT FOUND: %s", image_path)
        return {
            "damage_type": damage_type,
            "confidence": 0,
            "severity": "Inspection Required",
            "priority_score": 45,
            "recommendation": "Image unavailable. Professional inspection required.",
            "timings": {"total_ms": 0}
        }

    image_file = Path(image_path)
    logger7.info("Image size: %s bytes", image_file.stat().st_size)

    target_class = CLASS_MAP7.get(damage_type.strip().lower())
    logger7.info("Expected model class: %s", target_class)

    # If category is not in the trained YOLO classes, route directly to human inspection
    if target_class is None:
        logger7.warning("UNSUPPORTED DAMAGE TYPE: %s", damage_type)
        return {
            "damage_type": damage_type,
            "confidence": 0,
            "severity": "Inspection Required",
            "priority_score": 45,
            "recommendation": (
                "This damage category is not supported by the AI model. "
                "Professional inspection required."
            ),
            "timings": {"total_ms": 0}
        }

    # Verify model contains the expected target class
    target_id = next(
        (
            int(cid)
            for cid, cname in model7.names.items()
            if str(cname).strip().lower() == target_class
        ),
        None
    )

    if target_id is None:
        logger7.error("MODEL CLASS NOT FOUND: %s (names=%s)", target_class, model7.names)
        raise ValueError(f"YOLO model does not contain class: {target_class}")

    logger7.info("TARGET CLASS ID: %s (%s)", target_id, target_class)

    # 1. Preprocessing Stage (Measured)
    prep_start = time.perf_counter()
    image_source = _preprocess_image_source(image_file)
    prep_time = time.perf_counter() - prep_start
    timings["image_prep_ms"] = round(prep_time * 1000, 2)
    logger7.info("STAGE 1 [PREPROCESSING]: %.3f seconds (%.2fms)", prep_time, timings["image_prep_ms"])

    # 2. Concurrency Lock: Ensure only one inference runs on CPU at a time
    need_release = False
    if not lock_already_acquired:
        lock_start = time.perf_counter()
        acquired = _inference_lock.acquire(blocking=True, timeout=120)
        if not acquired:
            logger7.error("INFERENCE LOCK TIMEOUT: Previous request still holding CPU")
            raise TimeoutError("Inference engine is currently busy with another request.")
        need_release = True
        lock_wait = time.perf_counter() - lock_start
        timings["lock_wait_ms"] = round(lock_wait * 1000, 2)
        if lock_wait > 0.05:
            logger7.info("STAGE 2 [LOCK WAIT]: Waited %.3f seconds for CPU lock", lock_wait)

    try:
        # 3. YOLO Inference Stage (Measured)
        infer_start = time.perf_counter()
        logger7.info(
            "STAGE 3 [YOLO INFERENCE STARTED] (imgsz=320, conf=0.20, max_det=10, threads=%d)",
            num_threads
        )

        with torch.inference_mode():
            results = model7.predict(
                source=image_source,
                conf=0.20,         # Captures thin cracks and exposed wires reliably
                imgsz=320,         # 320x320 optimal lightweight resolution for CPU
                device="cpu",
                max_det=10,        # Sufficient for infrastructure defect inspection
                verbose=False
            )

        infer_time = time.perf_counter() - infer_start
        timings["yolo_infer_ms"] = round(infer_time * 1000, 2)
        logger7.info("STAGE 3 [YOLO INFERENCE COMPLETED] in %.3f seconds (%.2fms)", infer_time, timings["yolo_infer_ms"])

        # 4. Postprocessing Stage (Measured)
        post_start = time.perf_counter()
        detections = []

        for result in results:
            if result.boxes is None:
                continue
            for box in result.boxes:
                class_id = int(box.cls[0])
                class_name = str(result.names[class_id]).strip().lower()
                score = float(box.conf[0])

                detections.append({
                    "class": class_name,
                    "confidence": round(score * 100, 2)
                })

                logger7.info(
                    "DETECTION: class=%s confidence=%.2f%%",
                    class_name,
                    score * 100
                )

        logger7.info("ALL DETECTIONS: %s", detections)

        matching = [
            item for item in detections
            if item["class"] == target_class
        ]

        confidence = max(
            (item["confidence"] for item in matching),
            default=0
        )

        logger7.info("MATCHING DETECTIONS: %s", matching)
        logger7.info("FINAL CONFIDENCE: %.2f%%", confidence)

        post_time = time.perf_counter() - post_start
        timings["postprocess_ms"] = round(post_time * 1000, 2)
        logger7.info("STAGE 4 [POSTPROCESSING]: %.3f seconds (%.2fms)", post_time, timings["postprocess_ms"])

        # Classify severity and priority score
        if confidence >= 70:
            severity = "High"
        elif confidence >= 40:
            severity = "Medium"
        elif confidence > 0:
            severity = "Low"
        else:
            severity = "Inspection Required"

        base_scores = {
            "High": 82,
            "Medium": 58,
            "Low": 30,
            "Inspection Required": 45
        }
        base_priority = base_scores[severity]
        priority_score = min(100, base_priority + int(confidence // 10))

        recommendation = (
            "YOLO detected the reported damage. Professional inspection recommended."
            if confidence > 0
            else
            "No matching damage detected. Professional inspection required."
        )

        total_elapsed = time.perf_counter() - total_start
        timings["total_ms"] = round(total_elapsed * 1000, 2)
        logger7.info("STAGE 5 [TOTAL ANALYSIS PIPELINE]: %.3f seconds (%.2fms)", total_elapsed, timings["total_ms"])
        logger7.info("======================================")

        return {
            "damage_type": damage_type,
            "confidence": round(confidence),
            "severity": severity,
            "priority_score": priority_score,
            "recommendation": recommendation,
            "elapsed_seconds": round(total_elapsed, 2),
            "timings": timings
        }

    except Exception:
        logger7.exception("YOLO INFERENCE FAILED")
        raise
    finally:
        if need_release:
            _inference_lock.release()
