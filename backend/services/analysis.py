import io
import time
from concurrent.futures import ThreadPoolExecutor

from backend.services.detection import detect_inventory_objects
from backend.services.google_vision import detect_objects_with_google
from backend.services.gemini import identify_inventory_item
from backend.services.ocr import extract_text_from_boxes
from backend.services.parser import parse_inventory_record

ANALYSIS_SETTINGS = {
    "single": {
        "min_confidence": 0.50,
        "min_area_ratio": 0.03,
        "iou_threshold": 0.40,
        "max_objects": 1,
    },
    "multiple": {
        "min_confidence": 0.50,
        "min_area_ratio": 0.01,
        "iou_threshold": 0.55,
        "max_objects": 8,
    },
}

MAX_WORKERS = 3

IGNORED_CLASSES = {
    "person",
    "human",
    "hand",
    "human face",
    "human body",
    "sky",
    "grass",
}


def detect_with_google(image):
    """Convert normalized bounding boxes to pixel coordinates."""

    image_bytes = io.BytesIO()
    image.save(image_bytes, format="PNG")

    google_objects = detect_objects_with_google(image_bytes.getvalue())

    width, height = image.size
    detected_boxes = []

    for obj in google_objects:
        vertices = obj["bounding_box"]

        if not vertices:
            continue

        x_values = [vertex["x"] * width for vertex in vertices]
        y_values = [vertex["y"] * height for vertex in vertices]

        detected_boxes.append(
            {
                "x1": max(0, int(min(x_values))),
                "y1": max(0, int(min(y_values))),
                "x2": min(width, int(max(x_values))),
                "y2": min(height, int(max(y_values))),
                "confidence": obj["confidence"],
                "class_name": obj["name"].lower(),
            }
        )

    return detected_boxes


def box_area(box):
    return max(0, box["x2"] - box["x1"]) * max(0, box["y2"] - box["y1"])


def intersection_area(a, b):
    x1 = max(a["x1"], b["x1"])
    y1 = max(a["y1"], b["y1"])
    x2 = min(a["x2"], b["x2"])
    y2 = min(a["y2"], b["y2"])

    return max(0, x2 - x1) * max(0, y2 - y1)


def intersection_over_union(a, b):
    """Measure overlap between two bounding boxes."""

    intersection = intersection_area(a, b)
    union = box_area(a) + box_area(b) - intersection

    return intersection / union if union > 0 else 0


def is_duplicate(a, b, iou_threshold):
    if intersection_over_union(a, b) >= iou_threshold:
        return True

    smallest_area = min(box_area(a), box_area(b))

    if smallest_area <= 0:
        return False

    containment = intersection_area(a, b) / smallest_area

    return a["class_name"] == b["class_name"] and containment >= 0.85


def filter_boxes(boxes, image_size, mode="single"):
    settings = ANALYSIS_SETTINGS[mode]

    width, height = image_size
    image_area = width * height

    candidates = [
        box
        for box in boxes
        if box.get("confidence", 0) >= settings["min_confidence"]
        and box.get("class_name", "").lower() not in IGNORED_CLASSES
        and box_area(box) >= image_area * settings["min_area_ratio"]
    ]

    def prominence(box):
        area_ratio = box_area(box) / image_area

        center_x = (box["x1"] + box["x2"]) / 2
        center_y = (box["y1"] + box["y2"]) / 2

        distance = (
            ((center_x - width / 2) / width) ** 2
            + ((center_y - height / 2) / height) ** 2
        ) ** 0.5

        center_score = 1 / (1 + distance)

        return box["confidence"] * area_ratio**0.5 * center_score

    candidates.sort(key=prominence, reverse=True)

    kept = []

    for box in candidates:
        if any(
            is_duplicate(box, existing, settings["iou_threshold"]) for existing in kept
        ):
            continue

        kept.append(box)

        if len(kept) >= settings["max_objects"]:
            break

    return sorted(
        kept,
        key=lambda box: (box["y1"], box["x1"]),
    )


def analyze_object(index, box, text, cropped_image):
    """Analyze an individual detected object."""

    parsed = parse_inventory_record(text)
    gemini_result = {}

    if cropped_image is not None:
        try:
            gemini_result = identify_inventory_item(cropped_image)

            if not isinstance(gemini_result, dict):
                gemini_result = {}

        except Exception as exc:
            print(f"Gemini identification unavailable: {exc}")

    # Combine Gemini and OCR results.
    limits = {
        "item_name": 100,
        "category": 50,
        "brand": 100,
        "model": 100,
    }

    for field, limit in limits.items():
        value = gemini_result.get(field)

        if isinstance(value, str) and value.strip():
            parsed[field] = value.strip()[:limit]

    if not parsed.get("item_name"):
        parsed["item_name"] = box["class_name"]

    description = gemini_result.get("description")

    if isinstance(description, str) and description.strip():
        parsed["notes"] = description.strip()[:1000]

    # Ensure OCR results also respect the form limits.
    for field, limit in {
        **limits,
        "serial_number": 100,
        "notes": 1000,
    }.items():
        value = parsed.get(field)

        if isinstance(value, str):
            parsed[field] = value[:limit]

    return {
        "slot_order": index + 1,
        "box": box,
        "raw_text": text,
        **parsed,
    }


def analyze_image(image, boxes=None, mode="single") -> dict:
    """Analyze inventory images using detection, OCR, and Gemini."""

    start = time.perf_counter()

    # STEP 1: OBJECT DETECTION

    if boxes is not None:
        detected_boxes = boxes
    else:
        try:
            detected_boxes = detect_with_google(image)
            print("Object detection provider: Google Cloud Vision")

        except Exception as exc:
            print(f"Google Vision unavailable: {exc}")
            detected_boxes = detect_inventory_objects(image)
            print("Object detection provider: YOLO")

    original_count = len(detected_boxes)

    # STEP 2: REMOVE DUPLICATES

    detected_boxes = filter_boxes(
        detected_boxes,
        image.size,
        mode,
    )

    print(
        f"Object detections: {original_count} raw, "
        f"{len(detected_boxes)} after filtering"
    )

    if not detected_boxes:
        return {
            "boxes": [],
            "items": [],
        }

    # STEP 3: OCR

    ocr_start = time.perf_counter()

    ocr_texts = extract_text_from_boxes(
        image,
        detected_boxes,
    )

    print(f"OCR completed in " f"{time.perf_counter() - ocr_start:.2f}s")

    # STEP 4: PREPARE CROPS

    width, height = image.size
    jobs = []

    for index, box in enumerate(detected_boxes):
        text = ocr_texts[index] if index < len(ocr_texts) else ""

        x1 = max(0, min(width, int(box["x1"])))
        y1 = max(0, min(height, int(box["y1"])))
        x2 = max(0, min(width, int(box["x2"])))
        y2 = max(0, min(height, int(box["y2"])))

        cropped_image = None

        if x2 > x1 and y2 > y1:
            cropped_image = image.crop((x1, y1, x2, y2)).convert("RGB")

        jobs.append((index, box, text, cropped_image))

    # STEP 5: CONCURRENT GEMINI ANALYSIS

    gemini_start = time.perf_counter()

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:

        items = list(
            executor.map(
                lambda args: analyze_object(*args),
                jobs,
            )
        )

    print(f"Gemini completed in " f"{time.perf_counter() - gemini_start:.2f}s")

    print(f"Total analysis time: " f"{time.perf_counter() - start:.2f}s")

    return {
        "boxes": detected_boxes,
        "items": items,
        "image_width": width,
        "image_height": height,
    }
