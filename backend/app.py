import csv
import io
import sqlite3
from contextlib import closing
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

from backend.config import APP_DIR
from backend.services.analysis import analyze_image


DATA_DIR = APP_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_PATH = Path(__import__("os").getenv("INVENTORY_DATABASE", str(DATA_DIR / "inventory.db")))
UPLOAD_DIR = Path(__import__("os").getenv("INVENTORY_UPLOAD_DIR", str(DATA_DIR / "uploads")))
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


def connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_database() -> None:
    with closing(connection()) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT,
                purchase_price REAL,
                current_value REAL,
                serial_number TEXT,
                condition TEXT,
                room_location TEXT,
                quantity INTEGER NOT NULL DEFAULT 1,
                brand TEXT,
                model TEXT,
                notes TEXT,
                photo_url TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


initialize_database()


def row_to_item(row: sqlite3.Row) -> dict:
    return dict(row)


def get_item_or_404(item_id: int) -> dict:
    with closing(connection()) as conn:
        row = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return row_to_item(row)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/items")
def list_items() -> list[dict]:
    with closing(connection()) as conn:
        rows = conn.execute("SELECT * FROM items ORDER BY id DESC").fetchall()
    return [row_to_item(row) for row in rows]


@app.post("/api/items", status_code=201)
def create_item(item: ItemCreate) -> dict:
    data = item.model_dump()
    with closing(connection()) as conn:
        cursor = conn.execute(
            """
            INSERT INTO items
            (name, category, purchase_price, current_value, serial_number,
             condition, room_location, quantity, brand, model, notes)
            VALUES (:name, :category, :purchase_price, :current_value,
                    :serial_number, :condition, :room_location, :quantity,
                    :brand, :model, :notes)
            """,
            data,
        )
        conn.commit()
        item_id = cursor.lastrowid
    return get_item_or_404(item_id)


@app.get("/api/items/summary")
def item_summary() -> dict:
    with closing(connection()) as conn:
        row = conn.execute(
            """
            SELECT COUNT(*) AS total_items,
                   COALESCE(SUM(quantity), 0) AS total_quantity,
                   COALESCE(SUM(COALESCE(current_value, purchase_price, 0) * quantity), 0)
                     AS total_value
            FROM items
            """
        ).fetchone()
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
        conn.execute(
            """
            UPDATE items SET name=:name, category=:category,
              purchase_price=:purchase_price, current_value=:current_value,
              serial_number=:serial_number, condition=:condition,
              room_location=:room_location, quantity=:quantity,
              brand=:brand, model=:model, notes=:notes,
              updated_at=CURRENT_TIMESTAMP
            WHERE id=:id
            """,
            data,
        )
        conn.commit()
    return get_item_or_404(item_id)


@app.delete("/api/items/{item_id}", status_code=204)
def delete_item(item_id: int) -> None:
    get_item_or_404(item_id)
    with closing(connection()) as conn:
        conn.execute("DELETE FROM items WHERE id = ?", (item_id,))
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
        conn.execute("UPDATE items SET photo_url=? WHERE id=?", (photo_url, item_id))
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
