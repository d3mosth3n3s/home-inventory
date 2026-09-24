import os
from functools import lru_cache

import numpy as np
from PIL import Image

from backend.config import DETECTION_CONFIDENCE, DETECTION_MODEL_PATH


@lru_cache(maxsize=1)
def load_detection_model():
    """Load the configured YOLOv8 detection model."""
    if not DETECTION_MODEL_PATH.exists():
        raise FileNotFoundError(
            f"YOLOv8 model not found at: {DETECTION_MODEL_PATH}\n"
            "Set HOUSEHOLD_DETECT_MODEL to a valid YOLOv8 .pt file, "
            "or place the model at: " + str(DETECTION_MODEL_PATH)
        )

    from ultralytics import YOLO

    return YOLO(str(DETECTION_MODEL_PATH))


def detect_inventory_objects(image: Image.Image) -> list[dict]:
    """Run YOLO on the image and return detected inventory objects sorted top-to-bottom."""
    model = load_detection_model()
    results = model.predict(
        source=np.array(image),
        conf=DETECTION_CONFIDENCE,
        verbose=False,
    )

    detections = []
    for box in results[0].boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        detections.append(
            {
                "x1": int(x1),
                "y1": int(y1),
                "x2": int(x2),
                "y2": int(y2),
                "confidence": float(box.conf[0]),
                "class_name": results[0].names[int(box.cls[0])],
            }
        )

    detections.sort(key=lambda d: (d["y1"] + d["y2"]) / 2)
    return detections
