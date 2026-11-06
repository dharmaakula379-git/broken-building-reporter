import logging
import os
import time
import threading
from pathlib import Path
from typing import Optional, Union

import torch
from ultralytics import YOLO
from PIL import Image

# Optimize PyTorch CPU threading for cloud container environments.
# Avoid forcing single-threaded execution (torch.set_num_threads(1)), which artificially
# crippled CPU matrix operations and caused 80s inference times.
cpu_count = os.cpu_count() or 2
num_threads = max(1, min(4, cpu_count))
torch.set_num_threads(num_threads)
torch.set_num_interop_threads(max(1, min(2, cpu_count // 2)))

logger7 = logging.getLogger("uvicorn.error")

# LOAD YOLO MODEL (loaded once at application startup)
MODEL_PATH7 = Path(__file__).resolve().parent.parent / "best.pt"

if not MODEL_PATH7.is_file():
    raise FileNotFoundError(f"YOLO model not found: {MODEL_PATH7}")

model7 = YOLO(str(MODEL_PATH7))

logger7.info("YOLO MODEL TYPE: %s", model7.model.__class__.__name__)
logger7.info("YOLO MODEL TASK: %s", model7.task)
logger7.info("MODEL CONFIG: %s", getattr(model7.model, "yaml", "custom"))
logger7.info("MODEL LAYERS: %s", len(getattr(model7.model, "model", [])))
logger7.info("MODEL FILE SIZE: %.2f MB", MODEL_PATH7.stat().st_size / (1024 * 1024))
logger7.info("CPU THREADS CONFIGURED: %d (interop: %d, host cpus: %d)",
             num_threads, max(1, min(2, cpu_count // 2)), cpu_count)

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
    Warms up the YOLO model with a lightweight synthetic image.
    This triggers PyTorch kernel compilation, graph tracing, and memory allocator
    setup at startup so the first real user submission does not suffer cold-init delay.
    """
    try:
        import numpy as np
        t0 = time.perf_counter()
        logger7.info("YOLO MODEL WARMUP INITIATING...")
        dummy = np.zeros((320, 320, 3), dtype=np.uint8)
        with torch.inference_mode():
            model7.predict(
                source=dummy,
                conf=0.25,
                imgsz=320,
                device="cpu",
                max_det=1,
                verbose=False
            )
        elapsed = time.perf_counter() - t0
        logger7.info("YOLO MODEL WARMUP COMPLETED IN %.2f SECONDS", elapsed)
    except Exception as e:
        logger7.warning("YOLO model warmup encountered issue: %s", e)


def _preprocess_image_source(image_path: Path) -> Union[Path, Image.Image]:
    """
    If the image is larger than 1280px on its longest dimension, downscale it cleanly
    using PIL before inference. This drastically reduces CPU memory bandwidth and
    decoding time without sacrificing thin crack or wire detail.
    """
    try:
        with Image.open(image_path) as img:
            w, h = img.size
            max_dim = max(w, h)
            if max_dim > 1280:
                scale = 1280.0 / max_dim
                new_size = (int(w * scale), int(h * scale))
                resized = img.resize(new_size, Image.Resampling.LANCZOS)
                return resized.convert("RGB")
    except Exception as e:
        logger7.warning("Optional pre-resizing skipped for %s: %s", image_path, e)
    return image_path


def analyze_image(
    image_path: str | None,
    damage_type: str,
    description: str = ""
):
    total_start = time.perf_counter()
    logger7.info("========== YOLO DIAGNOSTICS ==========")
    logger7.info("Image path: %s", image_path)
    logger7.info("Model classes: %s", model7.names)
    logger7.info("Selected damage: %s", damage_type)

    if not image_path or not Path(image_path).is_file():
        logger7.error("IMAGE FILE NOT FOUND: %s", image_path)
        return {
            "damage_type": damage_type,
            "confidence": 0,
            "severity": "Inspection Required",
            "priority_score": 45,
            "recommendation": "Image unavailable. Professional inspection required."
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
            )
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

    # 1. Preprocessing Stage
    prep_start = time.perf_counter()
    image_source = _preprocess_image_source(image_file)
    prep_time = time.perf_counter() - prep_start
    logger7.info("STAGE 1 [PREPROCESSING]: %.3f seconds", prep_time)

    # 2. Concurrency Lock: Ensure only one inference runs on CPU at a time
    lock_start = time.perf_counter()
    acquired = _inference_lock.acquire(blocking=True, timeout=120)
    if not acquired:
        logger7.error("INFERENCE LOCK TIMEOUT: Previous request still holding CPU")
        raise TimeoutError("Inference engine is currently busy with another request.")
    lock_wait = time.perf_counter() - lock_start
    if lock_wait > 0.05:
        logger7.info("STAGE 2 [LOCK WAIT]: Waited %.3f seconds for CPU lock", lock_wait)

    try:
        # 3. YOLO Inference Stage
        # imgsz=320 is maintained: 256 degrades fine line features for cracks and exposed wires,
        # while 320 with multi-threading achieves 30-45s CPU inference on Render.
        infer_start = time.perf_counter()
        logger7.info("STAGE 3 [YOLO INFERENCE STARTED] (imgsz=320, conf=0.25, threads=%d)", num_threads)

        with torch.inference_mode():
            results = model7.predict(
                source=image_source,
                conf=0.25,
                imgsz=320,
                device="cpu",
                max_det=20,
                verbose=False
            )

        infer_time = time.perf_counter() - infer_start
        logger7.info("STAGE 3 [YOLO INFERENCE COMPLETED] in %.2f seconds", infer_time)

        # 4. Postprocessing Stage: Parse bounding boxes & detections
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
        logger7.info("STAGE 4 [POSTPROCESSING]: %.3f seconds", post_time)

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
        logger7.info("STAGE 5 [TOTAL ANALYSIS PIPELINE]: %.2f seconds", total_elapsed)
        logger7.info("======================================")

        return {
            "damage_type": damage_type,
            "confidence": round(confidence),
            "severity": severity,
            "priority_score": priority_score,
            "recommendation": recommendation,
            "elapsed_seconds": round(total_elapsed, 2)
        }

    except Exception:
        logger7.exception("YOLO INFERENCE FAILED")
        raise
    finally:
        _inference_lock.release()
