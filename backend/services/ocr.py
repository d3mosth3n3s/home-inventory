from functools import lru_cache

import numpy as np


@lru_cache(maxsize=1)
def load_ocr_reader():
    """Initialize the shared EasyOCR reader once."""
    try:
        import easyocr

        return easyocr.Reader(["en"], gpu=False)
    except Exception:
        return None


def extract_text_from_boxes(image, boxes: list[dict]) -> list[str]:
    """Run OCR for each detected box and return a list of OCR texts."""
    reader = load_ocr_reader()
    image_array = np.array(image)
    ocr_texts = []

    if reader is None:
        return ["" for _ in boxes]

    for box in boxes:
        crop = image_array[box["y1"]:box["y2"], box["x1"]:box["x2"]]
        try:
            result = reader.readtext(crop, detail=0)
            ocr_texts.append(" ".join(result))
        except Exception:
            ocr_texts.append("")

    return ocr_texts
