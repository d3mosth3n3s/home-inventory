import os
from pathlib import Path

APP_DIR = Path(__file__).resolve().parents[1]

SESSION_RESULTS = Path(os.getenv("INVENTORY_SESSION_ROOT", "/tmp/household_inventory"))
SESSION_REF_PATH = SESSION_RESULTS / "confirmed_reference.csv"

BUNDLED_REF_PATH = APP_DIR / "results" / "confirmed_reference.csv"
if not BUNDLED_REF_PATH.exists():
    BUNDLED_REF_PATH = APP_DIR / "data" / "confirmed_reference.csv"

DETECTION_MODEL_PATH = Path(
    os.getenv("HOUSEHOLD_DETECT_MODEL", str(APP_DIR / "models" / "yolov8n.pt"))
)
DETECTION_CONFIDENCE = float(os.getenv("HOUSEHOLD_DETECT_CONF", "0.25"))
MAX_CANVAS_HEIGHT = 900
