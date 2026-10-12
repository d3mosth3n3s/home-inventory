import io

from backend.services.detection import detect_inventory_objects
from backend.services.google_vision import detect_objects_with_google
from backend.services.gemini import identify_inventory_item
from backend.services.ocr import extract_text_from_boxes
from backend.services.parser import parse_inventory_record


def detect_with_google(image):
    """Convert Google's normalized bounding boxes to pixel coordinates."""

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
    """Analyze inventory images using Google Vision, Gemini, and OCR."""

    # Step 1: Detect objects using Google Vision, with YOLO fallback.
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

    # Step 2: Extract text from detected objects.
    ocr_texts = extract_text_from_boxes(image, detected_boxes)

    items = []
    width, height = image.size

    # Step 3: Analyze each detected object.
    for index, box in enumerate(detected_boxes):
        text = ocr_texts[index] if index < len(ocr_texts) else ""
        parsed = parse_inventory_record(text)

        # Crop the individual object for Gemini.
        x1 = max(0, min(width, int(box["x1"])))
        y1 = max(0, min(height, int(box["y1"])))
        x2 = max(0, min(width, int(box["x2"])))
        y2 = max(0, min(height, int(box["y2"])))

        gemini_result = {}

        if x2 > x1 and y2 > y1:
            try:
                cropped_image = image.crop((x1, y1, x2, y2))
                gemini_result = identify_inventory_item(
                    cropped_image.convert("RGB")
                )

                if not isinstance(gemini_result, dict):
                    raise ValueError("Gemini returned an invalid result")

                print("Gemini identification:", gemini_result)

            except Exception as exc:
                print(f"Gemini identification unavailable: {exc}")

        # Step 4: Combine Gemini, OCR, and object detection.
        # Gemini takes priority when it provides a non-empty value.
        for field in ("item_name", "category", "brand", "model"):
            value = gemini_result.get(field)

            if isinstance(value, str) and value.strip():
                parsed[field] = value.strip()

        # Preserve a useful object name if Gemini/OCR cannot identify it.
        if not parsed.get("item_name"):
            parsed["item_name"] = box["class_name"]

        description = gemini_result.get("description", "")

        if isinstance(description, str) and description.strip():
            existing_notes = parsed.get("notes") or ""
            parsed["notes"] = (
                f"{existing_notes}\n{description.strip()}".strip()
            )

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