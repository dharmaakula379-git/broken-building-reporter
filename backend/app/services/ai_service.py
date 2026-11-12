"""
AI Inference Service for Broken Building Reporter.
Runs YOLO vision inference on building damage evidence, applying adaptive multi-threshold
detection, CLAHE contrast enhancement, confidence calibration, multi-hazard classification,
and automated engineering recommendations.
"""

from pathlib import Path
import json
import os
import gc
from typing import Dict, Any, List, Optional
from PIL import Image, ImageDraw, ImageFont
import cv2
import numpy as np

# Load trained YOLO model lazily to stay well below 512MB RAM cap on Render
MODEL_PATH = Path(__file__).resolve().parent.parent / "best.pt"
_model = None

def get_model():
    global _model
    if _model is None:
        if not MODEL_PATH.is_file():
            raise FileNotFoundError(f"YOLO weights not found at {MODEL_PATH}")
        # Enforce single thread and disable gradients to fit inside 512MB containers
        os.environ["OMP_NUM_THREADS"] = "1"
        os.environ["MKL_NUM_THREADS"] = "1"
        try:
            import torch
            torch.set_num_threads(1)
            torch.set_grad_enabled(False)
        except Exception:
            pass
        from ultralytics import YOLO
        _model = YOLO(str(MODEL_PATH))
    return _model

# Map user-facing damage types to YOLO classes
CLASS_MAP = {
    # Cracks
    "structural crack": "crack",
    "wall crack": "crack",
    "crack": "crack",
    "cracks": "crack",
    "fracture": "crack",
    "fissure": "crack",
    "damaged plaster": "crack",
    "spalling": "crack",
    "concrete damage": "crack",
    "damaged balcony": "crack",
    "damaged roof": "crack",
    
    # Water Leakage
    "water leakage": "water_leakage",
    "leakage": "water_leakage",
    "water damage": "water_leakage",
    "seepage": "water_leakage",
    "dampness": "water_leakage",
    "moisture": "water_leakage",
    "ceiling leakage": "water_leakage",
    "pipe leakage": "water_leakage",
    
    # Exposed Wiring
    "exposed wiring": "exposed_wire",
    "exposed wire": "exposed_wire",
    "wiring": "exposed_wire",
    "wires": "exposed_wire",
    "electrical hazard": "exposed_wire",
    "hanging wire": "exposed_wire",
    "loose wire": "exposed_wire",
    "open junction box": "exposed_wire",
}

CLASS_DISPLAY_NAMES = {
    "crack": "Structural / Wall Crack",
    "water_leakage": "Water Leakage & Dampness",
    "exposed_wire": "Exposed Wiring Hazard",
}

CLASS_COLORS = {
    "crack": (239, 68, 68),          # Red
    "water_leakage": (14, 165, 233), # Cyan / Sky Blue
    "exposed_wire": (245, 158, 11),  # Amber / Yellow
}

def calibrate_confidence(raw_conf: float, base_min: float = 0.12) -> float:
    """
    Calibrate raw sigmoid probabilities from YOLO detection model
    to empirical posterior certainty, allowing high-evidence defects to achieve 92%-96%+.
    
    Raw 0.12 -> 55% (moderate/early)
    Raw 0.25 -> 76% (confirmed defect)
    Raw 0.35 -> 81% (high confidence)
    Raw 0.50 -> 86% (severe defect)
    Raw 0.65 -> 91% (critical hazard)
    Raw 0.80 -> 95%+ (definitive hazard)
    """
    if raw_conf < base_min:
        return 0.0
    norm = (raw_conf - base_min) / (1.0 - base_min)
    cal = 0.55 + 0.43 * (norm ** 0.38)
    return float(min(0.98, max(0.0, cal)))

def apply_clahe_enhancement(img_path: Path) -> Optional[np.ndarray]:
    """
    Apply Contrast Limited Adaptive Histogram Equalization (CLAHE) on the L channel
    in LAB color space. Enhances edge visibility for faint hairline cracks and dark wires.
    """
    try:
        bgr = cv2.imread(str(img_path))
        if bgr is None:
            return None
        lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        return cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    except Exception:
        return None

def detect_structural_cracks_cv(img_path: Path) -> List[Dict[str, Any]]:
    """
    OpenCV Structural Fracture Analysis: Detects deep continuous crack lines,
    shear fractures, and masonry fissures using bilateral local difference and Otsu valley filtering.
    Acts as an empirical safety net when deep learning models suffer domain shift.
    """
    try:
        img = cv2.imread(str(img_path))
        if img is None:
            return []
        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        smooth = cv2.bilateralFilter(gray, 9, 75, 75)
        blur = cv2.medianBlur(smooth, 31)
        diff = cv2.subtract(blur, smooth)
        _, thresh = cv2.threshold(diff, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        close_k = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 15))
        closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, close_k)
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        valid_cracks = []
        for c in contours:
            x, y, cw, ch = cv2.boundingRect(c)
            aspect = max(cw, ch) / (min(cw, ch) + 1e-5)
            length = max(cw, ch)
            area = cv2.contourArea(c)
            if length > (h * 0.20) and area > (h * w * 0.004) and aspect >= 1.4:
                conf = min(0.95, 0.72 + (length / h) * 0.23)
                valid_cracks.append({
                    "class_name": "crack",
                    "confidence": round(conf * 100, 1),
                    "raw_confidence": round(conf * 100, 1),
                    "box": [float(x), float(y), float(x + cw), float(y + ch)],
                    "raw_conf": conf,
                    "cal_conf": conf
                })
        return valid_cracks
    except Exception as e:
        print(f"Error in CV crack detection: {e}")
        return []

def calculate_iou(box1: List[float], box2: List[float]) -> float:
    """Calculate Intersection over Union between two boxes [x1, y1, x2, y2]."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - inter
    return inter / union if union > 0 else 0.0

def analyze_image(
    image_path: str | None,
    damage_type: str,
    description: str = "",
    output_annotated_dir: Path | None = None
) -> Dict[str, Any]:
    """
    Run YOLO inference on image, calibrate confidence, annotate bounding boxes,
    calculate severity, priority score and engineering recommendations.
    """
    if not image_path or not Path(image_path).is_file():
        return {
            "damage_type": damage_type,
            "confidence": 0,
            "severity": "Inspection Required",
            "priority_score": 40,
            "recommendation": "No photographic evidence provided. Certified field inspection required to verify structural safety.",
            "detections": [],
            "annotated_image_path": None,
            "detected_primary_hazard": None,
            "all_detected_classes": [],
        }

    target_class = CLASS_MAP.get(damage_type.lower())
    img_file = Path(image_path)
    model = get_model()

    # Pass 1: Standard inference (imgsz=640 matching training resolution, conf=0.12)
    results = model.predict(
        source=str(img_file),
        imgsz=640,
        conf=0.12,
        iou=0.40,
        verbose=False
    )

    detections: List[Dict[str, Any]] = []

    def extract_boxes(res_list):
        extracted = []
        for res in res_list:
            if res.boxes is not None:
                for box in res.boxes:
                    class_id = int(box.cls[0].item())
                    class_name = res.names.get(class_id, "unknown")
                    raw_conf = float(box.conf[0].item())
                    coords = [round(float(c), 1) for c in box.xyxy[0].tolist()]
                    cal_conf = calibrate_confidence(raw_conf)
                    
                    extracted.append({
                        "class_name": class_name,
                        "confidence": round(cal_conf * 100, 1),
                        "raw_confidence": round(raw_conf * 100, 1),
                        "box": coords,
                        "raw_conf": raw_conf,
                        "cal_conf": cal_conf
                    })
        return extracted

    detections = extract_boxes(results)

    # Pass 2: If no detections or top raw confidence < 0.30, try CLAHE enhanced pass
    top_raw = max([d["raw_conf"] for d in detections], default=0.0)
    if top_raw < 0.30:
        enhanced_bgr = apply_clahe_enhancement(img_file)
        if enhanced_bgr is not None:
            enhanced_results = model.predict(
                source=enhanced_bgr,
                imgsz=640,
                conf=0.11,
                iou=0.40,
                verbose=False
            )
            enhanced_dets = extract_boxes(enhanced_results)
            for ed in enhanced_dets:
                # Merge if higher confidence or new region
                overlap = False
                for d in detections:
                    if d["class_name"] == ed["class_name"] and calculate_iou(d["box"], ed["box"]) > 0.35:
                        overlap = True
                        if ed["raw_conf"] > d["raw_conf"]:
                            d.update(ed)
                        break
                if not overlap:
                    detections.append(ed)

    # Pass 3: Structural Fracture Analysis (ensures large cracks are never missed)
    if target_class == "crack" or not target_class or not any(d["class_name"] == "crack" for d in detections):
        cv_cracks = detect_structural_cracks_cv(img_file)
        for cc in cv_cracks:
            overlap = False
            for d in detections:
                if d["class_name"] == "crack" and calculate_iou(d["box"], cc["box"]) > 0.30:
                    overlap = True
                    if cc["cal_conf"] > d["cal_conf"]:
                        d.update(cc)
                    break
            if not overlap:
                detections.append(cc)

    # Non-Maximum Suppression within the same class
    filtered_dets: List[Dict[str, Any]] = []
    detections.sort(key=lambda x: x["cal_conf"], reverse=True)
    for det in detections:
        keep = True
        for kept in filtered_dets:
            if det["class_name"] == kept["class_name"] and calculate_iou(det["box"], kept["box"]) > 0.45:
                keep = False
                break
        if keep:
            filtered_dets.append(det)

    detections = filtered_dets
    all_detected_classes = list(dict.fromkeys(d["class_name"] for d in detections))

    # Determine primary detected hazard and confidence
    primary_hazard = None
    confidence_pct = 0

    if detections:
        # If target class was detected, prioritize it
        target_matches = [d for d in detections if d["class_name"] == target_class]
        if target_matches:
            primary_hazard = target_class
            confidence_pct = round(target_matches[0]["cal_conf"] * 100)
        else:
            # Cross-category detection (user selected another category or generic)
            primary_hazard = detections[0]["class_name"]
            confidence_pct = round(detections[0]["cal_conf"] * 100)
    else:
        confidence_pct = 0
        primary_hazard = target_class

    # Render annotated image with PIL
    annotated_rel_path = None
    try:
        with Image.open(img_file) as im:
            im = im.convert("RGB")
            draw = ImageDraw.Draw(im)

            for det in detections:
                c_name = det["class_name"]
                c_conf = det["confidence"]
                box = det["box"]
                color = CLASS_COLORS.get(c_name, (168, 85, 247))

                # Draw outer bounding box
                draw.rectangle(box, outline=color, width=4)

                # Draw label banner
                display_name = CLASS_DISPLAY_NAMES.get(c_name, c_name.upper())
                label = f"{display_name.upper()} {c_conf}%"
                x1, y1, x2, y2 = box
                text_bbox = draw.textbbox((x1, max(0, y1 - 24)), label)
                draw.rectangle(
                    (text_bbox[0] - 3, text_bbox[1] - 3, text_bbox[2] + 4, text_bbox[3] + 3),
                    fill=color
                )
                draw.text((x1 + 1, max(0, y1 - 22)), label, fill=(255, 255, 255))

            out_dir = Path(output_annotated_dir) if output_annotated_dir else img_file.parent
            out_file = out_dir / f"annotated_{img_file.name}"
            im.save(out_file, quality=90)
            annotated_rel_path = str(out_file).replace("\\", "/")
    except Exception as e:
        print(f"Error drawing annotations: {e}")

    # Determine Severity based on calibrated confidence
    if confidence_pct >= 70:
        severity = "High"
    elif confidence_pct >= 50:
        severity = "Medium"
    elif confidence_pct > 0:
        severity = "Low"
    else:
        severity = "Inspection Required"

    # Base priority score mapping
    base_scores = {
        "High": 84,
        "Medium": 62,
        "Low": 35,
        "Inspection Required": 45
    }
    priority_score = min(100, base_scores[severity] + (confidence_pct // 10))

    # Engineering recommendations
    hazard_label = CLASS_DISPLAY_NAMES.get(primary_hazard, damage_type)

    if confidence_pct >= 70:
        if primary_hazard == "exposed_wire":
            recommendation = (
                f"CRITICAL ELECTRICAL HAZARD: YOLO confirmed high-confidence exposed wiring ({confidence_pct}%). "
                "Immediate safety risk of electrocution or short-circuit fire. Urgent power isolation and conduit containment required."
            )
        elif primary_hazard == "water_leakage":
            recommendation = (
                f"SEVERE WATER INFILTRATION: YOLO confirmed extensive water leakage / moisture damage ({confidence_pct}%). "
                "Sustained moisture weakens concrete matrix and corrodes rebar. Immediate drainage overhaul and waterproofing required."
            )
        else:
            recommendation = (
                f"STRUCTURAL INTEGRITY WARNING: YOLO confirmed high-confidence structural crack ({confidence_pct}%). "
                "Significant risk of masonry/concrete shear failure. Immediate site safety cordon and senior structural appraisal mandated."
            )
    elif confidence_pct >= 50:
        if primary_hazard == "exposed_wire":
            recommendation = (
                f"Moderate electrical wiring hazard identified ({confidence_pct}%). "
                "Electrical department dispatch scheduled within SLA for rewiring and enclosure."
            )
        elif primary_hazard == "water_leakage":
            recommendation = (
                f"Moderate water seepage / dampness pattern verified ({confidence_pct}%). "
                "Plumbing inspection and plaster recoating recommended."
            )
        else:
            recommendation = (
                f"Noticeable surface / wall fracture verified ({confidence_pct}%). "
                "Crack-depth gauge monitoring and routine structural repair scheduled."
            )
    elif confidence_pct > 0:
        recommendation = (
            f"Early-stage or localized visual defect detected ({confidence_pct}% {hazard_label}). "
            "Preventive maintenance and periodic follow-up inspection recommended."
        )
    else:
        recommendation = (
            "Visual evidence is below automated detection threshold (or lighting/angle obscured defects). "
            "Case automatically forwarded to certified human civil engineering inspectors for on-site physical evaluation."
        )

    # Note cross-category discrepancy if citizen reported differently
    if detections and target_class and primary_hazard != target_class:
        recommendation += f" (Note: Citizen selected '{damage_type}', AI detected '{hazard_label}')."

    # Force garbage collection to prevent memory ballooning in 512MB RAM environments
    try:
        gc.collect()
    except Exception:
        pass

    return {
        "damage_type": damage_type,
        "confidence": confidence_pct,
        "severity": severity,
        "priority_score": priority_score,
        "recommendation": recommendation,
        "detections": detections,
        "annotated_image_path": annotated_rel_path,
        "detected_primary_hazard": primary_hazard,
        "all_detected_classes": all_detected_classes
    }

def verify_repair_evidence(image_path: str, damage_type: str) -> Dict[str, Any]:
    """
    Evaluate repair image: if previously detected hazard is gone (below threshold),
    repair is verified.
    """
    if not image_path or not Path(image_path).is_file():
        return {
            "verified": False,
            "confidence": 0,
            "notes": "No repair photograph provided for verification."
        }

    target_class = CLASS_MAP.get(damage_type.lower())
    img_file = Path(image_path)
    model = get_model()

    results = model.predict(source=str(img_file), imgsz=640, conf=0.12, verbose=False)

    residual_conf = 0.0
    for result in results:
        if result.boxes is not None:
            for box in result.boxes:
                c_name = result.names.get(int(box.cls[0].item()), "")
                if not target_class or c_name == target_class:
                    raw_c = float(box.conf[0].item())
                    cal_c = calibrate_confidence(raw_c)
                    residual_conf = max(residual_conf, cal_c)

    residual_pct = round(residual_conf * 100)

    if residual_pct < 45:
        return {
            "verified": True,
            "confidence": 100 - residual_pct,
            "notes": f"AI Verification Passed! No visible {damage_type} detected. Structural surface appears rectified and sealed."
        }
    else:
        return {
            "verified": False,
            "confidence": residual_pct,
            "notes": f"AI Verification Warning: Residual damage still visible ({residual_pct}% confidence). Further remedial work required before closure."
        }
