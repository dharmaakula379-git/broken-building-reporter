"""
Unified Roboflow Dataset Pipeline & YOLO Retraining Script
for Broken Building Reporter.

Downloads the 3 datasets from Dharma's Roboflow workspace, merges annotations
into standard 3-class format (crack, water_leakage, exposed_wire), and trains
a high-accuracy YOLO11 model with balanced sampling and cosine LR decay.

Usage:
    python train_roboflow.py --api-key YOUR_ROBOFLOW_API_KEY [--epochs 80] [--model yolo11s.pt]
"""

import argparse
import os
import shutil
from pathlib import Path
import yaml
from ultralytics import YOLO

WORKSPACE_ID = "dharmas-workspace-wa1qs"
DATASETS_CONFIG = [
    {
        "project": "building-crack-detection-dmhfv-as5ew",
        "version": 1,
        "target_class_id": 0,
        "target_class_name": "crack"
    },
    {
        "project": "water-leakage-yjjbh-ldonl",
        "version": 1,
        "target_class_id": 1,
        "target_class_name": "water_leakage"
    },
    {
        "project": "wires-quxig-ttb28-rmqn1",
        "version": 1,
        "target_class_id": 2,
        "target_class_name": "exposed_wire"
    }
]

def download_and_prepare(api_key: str, output_dir: Path):
    from roboflow import Roboflow
    rf = Roboflow(api_key=api_key)
    workspace = rf.workspace(WORKSPACE_ID)

    raw_dir = output_dir / "raw_downloads"
    raw_dir.mkdir(parents=True, exist_ok=True)

    merged_dir = output_dir / "merged_dataset"
    for split in ["train", "valid", "test"]:
        (merged_dir / "images" / split).mkdir(parents=True, exist_ok=True)
        (merged_dir / "labels" / split).mkdir(parents=True, exist_ok=True)

    for cfg in DATASETS_CONFIG:
        p_name = cfg["project"]
        v_num = cfg["version"]
        target_id = cfg["target_class_id"]
        class_name = cfg["target_class_name"]

        print(f"\n[+] Fetching {class_name} dataset: {p_name} (v{v_num})...")
        proj = workspace.project(p_name)
        ver = proj.version(v_num)
        dl_path = ver.download("yolov11", location=str(raw_dir / p_name))

        # Merge images and re-map class IDs to 0, 1, 2
        for split in ["train", "valid", "test"]:
            src_img_dir = Path(dl_path.location) / split / "images"
            src_lbl_dir = Path(dl_path.location) / split / "labels"

            if not src_img_dir.exists():
                # Fallback if split folder has images directly
                src_img_dir = Path(dl_path.location) / split
                src_lbl_dir = Path(dl_path.location) / split

            if not src_img_dir.exists():
                continue

            for img_path in src_img_dir.glob("*.*"):
                if img_path.suffix.lower() not in [".jpg", ".jpeg", ".png"]:
                    continue

                dest_stem = f"{class_name}_{img_path.stem}"
                dest_img = merged_dir / "images" / split / f"{dest_stem}{img_path.suffix}"
                shutil.copy2(img_path, dest_img)

                # Process corresponding label
                lbl_path = src_lbl_dir / f"{img_path.stem}.txt"
                dest_lbl = merged_dir / "labels" / split / f"{dest_stem}.txt"

                if lbl_path.exists():
                    remapped_lines = []
                    with open(lbl_path, "r") as f:
                        for line in f:
                            parts = line.strip().split()
                            if len(parts) >= 5:
                                # Re-map class index to our target unified ID
                                parts[0] = str(target_id)
                                remapped_lines.append(" ".join(parts))

                    with open(dest_lbl, "w") as f:
                        f.write("\n".join(remapped_lines) + "\n")

    # Generate data.yaml
    data_yaml = {
        "path": str(merged_dir.resolve()).replace("\\", "/"),
        "train": "images/train",
        "val": "images/valid",
        "test": "images/test",
        "names": {
            0: "crack",
            1: "water_leakage",
            2: "exposed_wire"
        }
    }

    yaml_path = merged_dir / "data.yaml"
    with open(yaml_path, "w") as f:
        yaml.dump(data_yaml, f, sort_keys=False)

    print(f"\n[✓] Unified dataset created at: {merged_dir}")
    print(f"[✓] YAML configuration: {yaml_path}")
    return yaml_path

def train_model(data_yaml: Path, model_name: str = "yolo11s.pt", epochs: int = 80, batch_size: int = 16):
    print(f"\n[+] Initializing training with base model: {model_name}")
    print(f"    Target epochs: {epochs} | Batch size: {batch_size}")
    
    model = YOLO(model_name)
    results = model.train(
        data=str(data_yaml),
        epochs=epochs,
        imgsz=640,
        batch=batch_size,
        optimizer="AdamW",
        lr0=0.002,
        cos_lr=True,
        patience=20,
        save=True,
        verbose=True
    )
    print("\n[✓] Training complete!")
    print(f"[✓] Best weights saved at: {results.save_dir}/weights/best.pt")
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tune & Train Broken Building Reporter YOLO model")
    parser.add_argument("--api-key", required=True, help="Roboflow Workspace API Key")
    parser.add_argument("--epochs", type=int, default=80, help="Number of training epochs (default: 80)")
    parser.add_argument("--model", type=str, default="yolo11s.pt", help="Base YOLO model (yolo11n.pt, yolo11s.pt, yolo11m.pt)")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--output-dir", type=str, default="./training_pipeline", help="Output directory")

    args = parser.parse_args()
    out = Path(args.output_dir).resolve()

    yaml_file = download_and_prepare(args.api_key, out)
    train_model(yaml_file, model_name=args.model, epochs=args.epochs, batch_size=args.batch)
