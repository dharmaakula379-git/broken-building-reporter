
import logging
import time
from pathlib import Path

import torch
from ultralytics import YOLO

torch.set_num_threads(1)
torch.set_num_interop_threads(1)

logger7 = logging.getLogger("uvicorn.error")
# ==========================================
# LOAD YOLO MODEL
# ==========================================

MODEL_PATH7 = Path(__file__).resolve().parent.parent / "best.pt"

if not MODEL_PATH7.is_file():
    raise FileNotFoundError(
        f"YOLO model not found: {MODEL_PATH7}"
    )

model7 = YOLO(str(MODEL_PATH7))

# Model diagnostics
logger7.info(
    "YOLO MODEL TYPE: %s",
    model7.model.__class__.__name__
)

logger7.info("YOLO MODEL TASK: %s", model7.task)

logger7.info("MODEL CONFIG: %s", model7.model.yaml)

logger7.info(
    "MODEL LAYERS: %s",
    len(model7.model.model)
)

logger7.info(
    "MODEL FILE SIZE: %.2f MB",
    MODEL_PATH7.stat().st_size / (1024 * 1024)
)

# ==========================================
# DAMAGE CLASS MAPPING
# ==========================================

CLASS_MAP7 = {
    "structural crack": "crack",
    "wall crack": "crack",
    "crack": "crack",
    "water leakage": "water_leakage",
    "exposed wiring": "exposed_wire",
    "exposed wire": "exposed_wire"
}


# ==========================================
# AI IMAGE ANALYSIS
# ==========================================

def analyze_image(
    image_path: str | None,
    damage_type: str,
    description: str = ""
):

    logger7.info("========== YOLO DIAGNOSTICS ==========")
    logger7.info("Image path: %s", image_path)
    logger7.info("Model classes: %s", model7.names)
    logger7.info("Selected damage: %s", damage_type)

    # Check image availability
    if not image_path or not Path(image_path).is_file():

        logger7.error("IMAGE FILE NOT FOUND")

        return {
            "damage_type": damage_type,
            "confidence": 0,
            "severity": "Inspection Required",
            "priority_score": 45,
            "recommendation": (
                "Image unavailable. Professional inspection required."
            )
        }

    image7 = Path(image_path)

    logger7.info(
        "Image size: %s bytes",
        image7.stat().st_size
    )

    # Find corresponding YOLO class
    target7 = CLASS_MAP7.get(
        damage_type.strip().lower()
    )

    logger7.info(
        "Expected model class: %s",
        target7
    )

    if target7 is None:

        logger7.warning(
            "UNSUPPORTED DAMAGE TYPE: %s",
            damage_type
        )

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

    # Find YOLO class ID
    target_id7 = next(
        (
            int(class_id7)
            for class_id7, class_name7 in model7.names.items()
            if str(class_name7).strip().lower() == target7
        ),
        None
    )

    if target_id7 is None:

        logger7.error(
            "MODEL CLASS NOT FOUND: %s",
            target7
        )

        raise ValueError(
            f"YOLO model does not contain class: {target7}"
        )

    logger7.info(
        "TARGET CLASS ID: %s",
        target_id7
    )

      try:
        # Start inference timer
        start_time7 = time.perf_counter()

        logger7.info("YOLO INFERENCE STARTED")

        # Optimized diagnostic inference
        results7 = model7.predict(
            source=str(image7),
            conf=0.25,
            imgsz=320,
            device="cpu",
            max_det=20,
            verbose=False
        )

        elapsed7 = time.perf_counter() - start_time7

        logger7.info(
            "YOLO INFERENCE COMPLETED IN %.2f SECONDS",
            elapsed7
        )

        # Collect detections
        detections7 = []

        for result7 in results7:

            for box7 in result7.boxes:

                class_id7 = int(box7.cls[0])

                class_name7 = str(
                    result7.names[class_id7]
                ).strip().lower()

                score7 = float(box7.conf[0])

                detections7.append({
                    "class": class_name7,
                    "confidence": round(
                        score7 * 100,
                        2
                    )
                })

                logger7.info(
                    "DETECTION: class=%s confidence=%.2f%%",
                    class_name7,
                    score7 * 100
                )

        logger7.info(
            "ALL DETECTIONS: %s",
            detections7
        )

        # Match selected damage category
        matching7 = [
            item7
            for item7 in detections7
            if item7["class"] == target7
        ]

        confidence7 = max(
            (
                item7["confidence"]
                for item7 in matching7
            ),
            default=0
        )

        logger7.info(
            "MATCHING DETECTIONS: %s",
            matching7
        )

        logger7.info(
            "FINAL CONFIDENCE: %.2f%%",
            confidence7
        )

        logger7.info(
            "======================================"
        )

        # Determine severity
        if confidence7 >= 70:
            severity7 = "High"

        elif confidence7 >= 40:
            severity7 = "Medium"

        elif confidence7 > 0:
            severity7 = "Low"

        else:
            severity7 = "Inspection Required"

        # Calculate priority
        base7 = {
            "High": 82,
            "Medium": 58,
            "Low": 30,
            "Inspection Required": 45
        }[severity7]

        priority7 = min(
            100,
            base7 + int(confidence7 // 10)
        )

        # Generate recommendation
        recommendation7 = (
            "YOLO detected the reported damage. "
            "Professional inspection recommended."
            if confidence7 > 0
            else
            "No matching damage detected. "
            "Professional inspection required."
        )

        return {
            "damage_type": damage_type,
            "confidence": round(confidence7),
            "severity": severity7,
            "priority_score": priority7,
            "recommendation": recommendation7
        }

    except Exception:

        logger7.exception(
            "YOLO INFERENCE FAILED"
        )

        raise
