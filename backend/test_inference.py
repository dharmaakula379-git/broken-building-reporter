import urllib.request
from pathlib import Path
import sys
sys.path.insert(0, '.')
from app.services.ai_service import analyze_image

test_dir = Path('test_samples')
test_dir.mkdir(exist_ok=True)

urls = [
    ('wires_1.jpg', 'https://source.roboflow.com/Mu9PXba269fPTvxPI79rVGJQOHz2/0RkIsQTzt3zlI9exEiYj/original.jpg', 'Exposed Wiring'),
    ('wires_2.jpg', 'https://source.roboflow.com/Mu9PXba269fPTvxPI79rVGJQOHz2/0aWoKet20CMku4o9ayD9/original.jpg', 'Exposed Wiring'),
    ('leak_1.jpg', 'https://source.roboflow.com/Mu9PXba269fPTvxPI79rVGJQOHz2/01GAG9aayXg1G9g4kK70/original.jpg', 'Water Leakage'),
    ('leak_2.jpg', 'https://source.roboflow.com/Mu9PXba269fPTvxPI79rVGJQOHz2/01RVYzTWbcCmkjtATeGO/original.jpg', 'Water Leakage'),
    ('crack_1.jpg', 'https://source.roboflow.com/Mu9PXba269fPTvxPI79rVGJQOHz2/02P2QgE78kHD0C47X1vw/original.jpg', 'Wall Crack'),
    ('crack_2.jpg', 'https://source.roboflow.com/Mu9PXba269fPTvxPI79rVGJQOHz2/02pcEfOF3ynD7ou4SfoR/original.jpg', 'Wall Crack'),
]

for name, url, category in urls:
    p = test_dir / name
    try:
        if not p.is_file():
            urllib.request.urlretrieve(url, p)
            print(f'Downloaded {name} ({p.stat().st_size} bytes)')
        else:
            print(f'Using existing {name}')
        res = analyze_image(str(p), category)
        dets_str = ', '.join([f"{d['class_name']}: {d['confidence']}%" for d in res['detections']])
        print(f"[{name}] -> {res['confidence']}% ({res['severity']}) | Dets: {dets_str or 'None'}")
    except Exception as e:
        print(f'Failed {name}: {e}')
