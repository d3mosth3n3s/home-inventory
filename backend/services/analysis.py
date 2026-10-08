import io

from PIL import Image

from backend.services.detection import detect_inventory_objects
from backend.services.google_vision import detect_objects_with_google
from backend.services.ocr import extract_text_from_boxes
from backend.services.parser import parse_inventory_record


def detect_with_google(image):
    """Convert Google's normalized bounding boxes to YOLO-style pixel boxes."""

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

    return sorted(detected_boxes, key=lambda box: (box["y1"], box["x1"]))


def analyze_image(image, boxes=None) -> dict:
    """Analyze household inventory images using Google Vision with YOLO fallback."""

    if boxes is not None:
        detected_boxes = boxes
    else:
        try:
            detected_boxes = detect_with_google(image)
            print("Object detection provider: Google Cloud Vision")

        except Exception as exc:
            print(f"Google Vision unavailable, falling back to YOLO: {exc}")
            detected_boxes = detect_inventory_objects(image)
            print("Object detection provider: YOLO")

    ocr_texts = extract_text_from_boxes(image, detected_boxes)

    items = []

    for index, box in enumerate(detected_boxes):
        text = ocr_texts[index] if index < len(ocr_texts) else ""

        parsed = parse_inventory_record(text)

        # Use the detected object label when OCR cannot identify the item.
        if not parsed.get("item_name"):
            parsed["item_name"] = box["class_name"]

        items.append(
            {
                "slot_order": index + 1,
                "box": box,
                "raw_text": text,
                **parsed,
            }
        )

    return {
        "boxes": detected_boxes,
        "items": items,
    }