import os
from pathlib import Path

APP_DIR = Path(__file__).resolve().parents[1]

DETECTION_MODEL_PATH = Path(
    os.getenv("HOUSEHOLD_DETECT_MODEL", str(APP_DIR / "models" / "yolov8n.pt"))
)
DETECTION_CONFIDENCE = float(os.getenv("HOUSEHOLD_DETECT_CONF", "0.25"))
MAX_CANVAS_HEIGHT = 900
