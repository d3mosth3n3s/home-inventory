import io
import zipfile
from pathlib import Path

from PIL import Image


def boxes_to_yolo(boxes: list[dict], img_w: int, img_h: int, class_id: int = 0) -> str:
    """Convert pixel boxes to YOLO label format."""
    lines = []
    for box in boxes:
        x_center = ((box["x1"] + box["x2"]) / 2) / img_w
        y_center = ((box["y1"] + box["y2"]) / 2) / img_h
        width = (box["x2"] - box["x1"]) / img_w
        height = (box["y2"] - box["y1"]) / img_h
        lines.append(f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")
    return "\n".join(lines)


def create_training_zip(image: Image.Image, image_name: str, boxes: list[dict], inventory_df) -> bytes:
    """Create a zip with the image, labels, and CSV inventory export."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        img_buf = io.BytesIO()
        image.save(img_buf, format="JPEG", quality=95)
        zf.writestr(f"images/{image_name}", img_buf.getvalue())

        label_name = Path(image_name).stem + ".txt"
        yolo_text = boxes_to_yolo(boxes, image.width, image.height)
        zf.writestr(f"labels/{label_name}", yolo_text)

        csv_buf = io.StringIO()
        inventory_df.to_csv(csv_buf, index=False)
        zf.writestr("inventory_list.csv", csv_buf.getvalue())

    buffer.seek(0)
    return buffer.getvalue()
