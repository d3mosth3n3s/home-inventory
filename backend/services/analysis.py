from backend.services.detection import detect_inventory_objects
from backend.services.ocr import extract_text_from_boxes
from backend.services.parser import parse_inventory_record


def analyze_image(image, boxes=None) -> dict:
    """Run the core household inventory analysis pipeline on an image."""
    detected_boxes = boxes or detect_inventory_objects(image)
    ocr_texts = extract_text_from_boxes(image, detected_boxes)

    items = []
    for index, text in enumerate(ocr_texts):
        parsed = parse_inventory_record(text)
        items.append(
            {
                "slot_order": index + 1,
                "box": detected_boxes[index],
                "raw_text": text,
                **parsed,
            }
        )

    return {
        "boxes": detected_boxes,
        "items": items,
    }
