import csv
import io
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import closing
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

from backend.config import APP_DIR
from backend.services.analysis import analyze_image

load_dotenv()

DATA_DIR = APP_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR = Path(os.getenv("INVENTORY_UPLOAD_DIR", str(DATA_DIR / "uploads")))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Home Inventory API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ItemCreate(BaseModel):
    name: str = Field(min_length=1)
    category: Optional[str] = None
    purchase_price: Optional[float] = None
    current_value: Optional[float] = None
    serial_number: Optional[str] = None
    condition: Optional[str] = "good"
    room_location: Optional[str] = None
    quantity: int = Field(default=1, ge=1)
    brand: Optional[str] = None
    model: Optional[str] = None
    notes: Optional[str] = None


class ItemUpdate(ItemCreate):
    pass


def connection():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError("DATABASE_URL is not set")

    return psycopg2.connect(
        database_url,
        cursor_factory=RealDictCursor
    )


def row_to_item(row) -> dict:
    return dict(row)


def get_item_or_404(item_id: int) -> dict:
    with closing(connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM items WHERE id = %s",
                (item_id,)
            )
            row = cursor.fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Item not found")

    return row_to_item(row)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/items")
def list_items() -> list[dict]:
    with closing(connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM items ORDER BY id DESC")
            rows = cursor.fetchall()

    return [row_to_item(row) for row in rows]


@app.post("/api/items", status_code=201)
def create_item(item: ItemCreate) -> dict:
    data = item.model_dump()

    with closing(connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO items
                (name, category, purchase_price, current_value, serial_number,
                 condition, room_location, quantity, brand, model, notes)
                VALUES (%(name)s, %(category)s, %(purchase_price)s,
                        %(current_value)s, %(serial_number)s, %(condition)s,
                        %(room_location)s, %(quantity)s, %(brand)s,
                        %(model)s, %(notes)s)
                RETURNING id
                """,
                data,
            )

            item_id = cursor.fetchone()["id"]
            conn.commit()

    return get_item_or_404(item_id)


@app.get("/api/items/summary")
def item_summary() -> dict:
    with closing(connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT COUNT(*) AS total_items,
                       COALESCE(SUM(quantity), 0) AS total_quantity,
                       COALESCE(
                           SUM(COALESCE(current_value, purchase_price, 0) * quantity),
                           0
                       ) AS total_value
                FROM items
                """
            )
            row = cursor.fetchone()

    return {
        "total_items": row["total_quantity"],
        "total_value": row["total_value"],
    }


@app.get("/api/items/{item_id}")
def get_item(item_id: int) -> dict:
    return get_item_or_404(item_id)


@app.put("/api/items/{item_id}")
def update_item(item_id: int, item: ItemUpdate) -> dict:
    get_item_or_404(item_id)

    data = item.model_dump()
    data["id"] = item_id

    with closing(connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE items
                SET name=%(name)s,
                    category=%(category)s,
                    purchase_price=%(purchase_price)s,
                    current_value=%(current_value)s,
                    serial_number=%(serial_number)s,
                    condition=%(condition)s,
                    room_location=%(room_location)s,
                    quantity=%(quantity)s,
                    brand=%(brand)s,
                    model=%(model)s,
                    notes=%(notes)s,
                    updated_at=NOW()
                WHERE id=%(id)s
                """,
                data,
            )
            conn.commit()

    return get_item_or_404(item_id)


@app.delete("/api/items/{item_id}", status_code=204)
def delete_item(item_id: int) -> None:
    get_item_or_404(item_id)

    with closing(connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM items WHERE id = %s",
                (item_id,)
            )
            conn.commit()


@app.post("/api/items/{item_id}/photo")
async def upload_photo(item_id: int, photo: UploadFile = File(...)) -> dict:
    get_item_or_404(item_id)
    suffix = Path(photo.filename or "photo.jpg").suffix.lower() or ".jpg"
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    destination = UPLOAD_DIR / f"item-{item_id}{suffix}"
    destination.write_bytes(await photo.read())
    photo_url = f"/uploads/{destination.name}"
    with closing(connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE items
                SET photo_url = %s,
                    updated_at = NOW()
                WHERE id = %s
                """,
                (photo_url, item_id),
            )
            conn.commit()

    return get_item_or_404(item_id)


@app.get("/uploads/{filename}")
def serve_upload(filename: str):
    path = (UPLOAD_DIR / filename).resolve()
    if path.parent != UPLOAD_DIR.resolve() or not path.is_file():
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(path)


@app.get("/api/items/export")
def export_items():
    items = list_items()
    if not items:
        fields = ["id", "name", "category", "purchase_price", "current_value"]
    else:
        fields = list(items[0].keys())
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(items)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory.csv"},
    )


@app.post("/api/analyze-image")
async def analyze_uploaded_image(image: UploadFile = File(...)) -> dict:
    contents = await image.read()
    try:
        from PIL import Image
        analyzed = analyze_image(Image.open(io.BytesIO(contents)).convert("RGB"))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to analyze image: {exc}") from exc
    return analyzed
