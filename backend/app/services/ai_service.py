from pathlib import Path
import hashlib

def analyze_image(image_path: str|None, damage_type: str, description: str=""):
    # Demo inference layer. Replace this function with a trained YOLO/OpenCV model.
    seed = hashlib.md5((str(image_path)+damage_type+description).encode()).hexdigest()
    value = int(seed[:2], 16)
    confidence = 62 + (value % 35)  # 62-96
    if damage_type in {"Structural Crack","Damaged Balcony","Damaged Roof"}:
        severity = "High"
    elif damage_type in {"Wall Crack","Water Leakage","Exposed Wiring"}:
        severity = "Medium"
    else:
        severity = "Low"
    if confidence < 70:
        severity = "Inspection Required"
    base = {"High":82,"Medium":58,"Low":30,"Inspection Required":45}[severity]
    priority = min(100, base + (confidence//10))
    return {
        "damage_type": damage_type,
        "confidence": confidence,
        "severity": severity,
        "priority_score": priority,
        "recommendation": (
            "Low-confidence image. Professional inspection required."
            if confidence < 70 else
            "Professional inspection recommended for final structural assessment."
        )
    }
