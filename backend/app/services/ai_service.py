
from pathlib import Path
from ultralytics import YOLO

# Load trained YOLO model
MODEL_PATH7 = Path(__file__).resolve().parent.parent / "best.pt"
model7 = YOLO(str(MODEL_PATH7))

# Supported damage categories
CLASS_MAP7 = {
    "structural crack": "crack",
    "wall crack": "crack",
    "crack": "crack",
    "water leakage": "water_leakage",
    "exposed wiring": "exposed_wire",
    "exposed wire": "exposed_wire"
}

def analyze_image(image_path: str | None, damage_type: str, description: str = ""):

    if not image_path or not Path(image_path).is_file():
        return {
            "damage_type": damage_type,
            "confidence": 0,
            "severity": "Inspection Required",
            "priority_score": 45,
            "recommendation": "Image unavailable. Professional inspection required."
        }

    target7 = CLASS_MAP7.get(damage_type.lower())

    if target7 is None:
        return {
            "damage_type": damage_type,
            "confidence": 0,
            "severity": "Inspection Required",
            "priority_score": 45,
            "recommendation": "Unsupported damage category. Professional inspection required."
        }

    results7 = model7.predict(
        source=image_path,
        conf=0.25,
        verbose=False
    )

    confidence7 = 0

    for result7 in results7:
        for box7 in result7.boxes:
            class_id7 = int(box7.cls[0])
            class_name7 = result7.names[class_id7]
            score7 = float(box7.conf[0])

            if class_name7 == target7:
                confidence7 = max(confidence7, score7)

    confidence7 = round(confidence7 * 100)

    if confidence7 >= 70:
        severity7 = "High"
    elif confidence7 >= 40:
        severity7 = "Medium"
    elif confidence7 > 0:
        severity7 = "Low"
    else:
        severity7 = "Inspection Required"

    base7 = {
        "High": 82,
        "Medium": 58,
        "Low": 30,
        "Inspection Required": 45
    }[severity7]

    priority7 = min(100, base7 + confidence7 // 10)

    recommendation7 = (
        "YOLO detected the reported damage. Professional inspection recommended."
        if confidence7 > 0 else
        "No matching damage detected. Professional inspection required."
    )

    return {
        "damage_type": damage_type,
        "confidence": confidence7,
        "severity": severity7,
        "priority_score": priority7,
        "recommendation": recommendation7
    }
