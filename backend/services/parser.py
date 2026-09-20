import re

import pandas as pd
from rapidfuzz import fuzz, process

from backend.config import SESSION_REF_PATH
from backend.services.reference_data import ensure_session_dir, load_confirmed_reference

KNOWN_BRANDS = {
    "APPLE", "SAMSUNG", "LG", "SONY", "PANASONIC", "HP", "DELL", "LENOVO",
    "ASUS", "ACER", "TOSHIBA", "CANON", "EPSON", "BROTHER", "NEST", "PHILIPS",
    "WESTINGHOUSE", "WHIRLPOOL", "KITCHENAID", "GE", "SHARP", "VIZIO",
    "BOSE", "JBL", "LOGITECH", "MICROSOFT", "GOOGLE", "NINTENDO", "NETGEAR",
    "XBOX", "PLAYSTATION", "BOSCH", "DEWALT", "BLACK+DECKER", "RYOBI",
    "HUSQVARNA", "STAHLWERK", "IKEA", "IRIS", "FISKARS", "CISCO",
    "BATHROOM", "SIMPLEHOUSEHOLD", "OREN", "MELITTA",
}

GENERIC_CATEGORIES = {
    "appliance",
    "electronics",
    "furniture",
    "tool",
    "kitchenware",
    "clothing",
    "book",
    "toy",
    "sports_equipment",
    "office_item",
    "decoration",
    "storage",
    "other",
}

PATTERN_BRAND = re.compile(
    r"\b(" + "|".join(re.escape(b) for b in sorted(KNOWN_BRANDS, key=len, reverse=True)) + r")\b",
    re.IGNORECASE,
)
PATTERN_MODEL = re.compile(
    r"\b(?:[A-Z]{1,5}[0-9]{2,}[A-Z0-9-]*|[A-Z0-9]{2,}[\-/][A-Z0-9]{2,}[A-Z0-9\-/]*|[A-Z0-9]{3,}[A-Z-]{1,3}[0-9A-Z-]{2,})\b",
    re.IGNORECASE,
)
PATTERN_SERIAL = re.compile(
    r"(?:S(?:ERIA?L)?\s*(?:NO|NUM|#)?\s*[:#-]?\s*|SN\s*[:#-]?\s*|SER\s*[:#-]?\s*)([A-Z0-9]{4,})",
    re.IGNORECASE,
)
PATTERN_BARCODE_OR_ID = re.compile(
    r"\b(?:UPC|EAN|SKU|MODEL|ID)\s*[:#-]?\s*([A-Z0-9-]{4,})\b",
    re.IGNORECASE,
)


def normalize_text(text: str) -> str:
    """Standardize text used for comparison and persistence."""
    return text.strip().upper() if isinstance(text, str) else ""


def normalize_ocr_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = text.replace("\n", " ")
    return re.sub(r"\s+", " ", text).strip()


def safe_get(row, column: str) -> str:
    if column in row.index:
        value = str(row[column]).strip()
        return "" if value.upper() == "NAN" else value
    return ""


def extract_brand(text: str) -> str:
    if not text:
        return ""
    match = PATTERN_BRAND.search(text)
    return match.group(1).strip() if match else ""


def extract_model(text: str) -> str:
    if not text:
        return ""
    cleaned = normalize_ocr_text(text)
    candidates = []
    for pattern in [PATTERN_MODEL, PATTERN_BARCODE_OR_ID]:
        match = pattern.search(cleaned)
        if match:
            candidate = match.group(1) if match.lastindex else match.group(0)
            candidates.append(candidate.strip())

    for candidate in candidates:
        if candidate and not candidate.lower().startswith("serial"):
            return candidate.strip().upper()

    tokens = cleaned.split()
    for token in tokens:
        token_clean = re.sub(r"[^A-Z0-9/\-]", "", token.upper())
        if len(token_clean) >= 3 and re.search(r"\d", token_clean):
            return token_clean

    return ""


def extract_serial(text: str) -> str:
    if not text:
        return ""
    for pattern in [PATTERN_SERIAL, PATTERN_BARCODE_OR_ID]:
        match = pattern.search(text)
        if match:
            candidate = match.group(1) if match.lastindex else match.group(0)
            return re.sub(r"[^A-Z0-9]", "", candidate).upper()
    return ""


def infer_category_from_text(text: str) -> str:
    if not text:
        return "other"

    text_upper = text.upper()
    keywords = {
        "electronics": ["TV", "MONITOR", "LAPTOP", "NOTEBOOK", "PHONE", "TABLET", "MOUSE", "KEYBOARD", "PRINTER", "ROUTER", "MODEM", "HEADSET"],
        "appliance": ["MICROWAVE", "REFRIGERATOR", "WASHER", "DRYER", "VACUUM", "FAN", "HEATER", "OVEN", "DISHWASHER"],
        "tool": ["DRILL", "SAW", "SCREWDRIVER", "HAMMER", "WRENCH", "LEVEL", "CIRCULAR", "CHAINSAW"],
        "kitchenware": ["PAN", "POT", "BOWL", "PLATE", "GLASS", "MUG", "CUTLERY", "BLADE", "KNIFE"],
        "furniture": ["CHAIR", "TABLE", "BENCH", "CABINET", "SHELF", "SOFA", "DESK", "BED", "DRAWER"],
        "book": ["BOOK", "NOVEL", "TEXTBOOK", "MANUAL", "JOURNAL", "MAGAZINE"],
        "clothing": ["SHIRT", "PANTS", "JACKET", "SHOES", "SNEAKER", "HAT", "SOCKS", "DRESS"],
        "toy": ["TOY", "PLUSH", "PUZZLE", "BALL", "TRAIN", "GAME", "LEGO"],
        "sports_equipment": ["BALL", "BICYCLE", "BIKE", "SKATEBOARD", "RACKET", "TREADMILL", "DUMBBELL"],
        "office_item": ["PRINTER", "MONITOR", "LAMP", "DESK", "CHAIR", "NOTEBOOK", "FILE", "FOLDER"],
        "decoration": ["FRAME", "VASE", "LAMP", "CLOCK", "ORNAMENT", "CANDLE", "DECOR"],
        "storage": ["BOX", "BIN", "CONTAINER", "BASKET", "CASE", "TRUNK"],
    }

    for category, words in keywords.items():
        if any(word in text_upper for word in words):
            return category
    return "other"


def parse_inventory_record(ocr_text: str) -> dict:
    """Parse OCR text into a generic household inventory record."""
    if not ocr_text or not isinstance(ocr_text, str):
        return {
            "category": "other",
            "item_name": "",
            "brand": "",
            "model": "",
            "serial_number": "",
            "location": "",
            "notes": "",
            "match_type": "none",
        }

    text = normalize_ocr_text(ocr_text)
    brand = extract_brand(text)
    model = extract_model(text)
    serial = extract_serial(text)
    category = infer_category_from_text(text)

    confirmed = load_confirmed_reference()
    match_type = "ocr_raw"
    if not confirmed.empty:
        names = confirmed["item_name"].fillna("").astype(str).str.upper().tolist()
        if names:
            result = process.extractOne(text.upper(), names, scorer=fuzz.token_set_ratio)
            if result and result[1] >= 75:
                match_type = f"confirmed_fuzzy({result[1]})"

    return {
        "category": category,
        "item_name": "",
        "brand": brand,
        "model": model,
        "serial_number": serial,
        "location": "",
        "notes": "",
        "match_type": match_type,
    }
