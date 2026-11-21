import csv
import io
import os
from uuid import uuid4
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import closing
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from fastapi import Depends
from backend.auth import get_current_user
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from backend.services.analysis import analyze_image

load_dotenv()
app = FastAPI(title="Home Inventory API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)


def row_to_item(row) -> dict:
    item = dict(row)
    if item.get("photo_url"):
        item["photo_url"] = signed_photo_url(item["photo_url"], str(item["user_id"]))
    return item


def get_item_or_404(item_id: int, user_id: str) -> dict:
    with closing(connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT * FROM items
                WHERE id = %s AND user_id = %s
                """,
                (item_id, user_id),
            )
            row = cursor.fetchone()
    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found",
        )
    return row_to_item(row)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/items")
def list_items(
    user_id: str = Depends(get_current_user),
) -> list[dict]:
    with closing(connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT * FROM items
                WHERE user_id = %s
                ORDER BY id DESC
                """,
                (user_id,),
            )
            rows = cursor.fetchall()
    return [row_to_item(row) for row in rows]


@app.post("/api/items", status_code=201)
def create_item(
    item: ItemCreate,
    user_id: str = Depends(get_current_user),
) -> dict:
    data = item.model_dump()
    data["user_id"] = user_id
    with closing(connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO items
                (user_id, name, category, purchase_price,
                 current_value, serial_number, condition,
                 room_location, quantity, brand, model, notes)
                VALUES
                (%(user_id)s, %(name)s, %(category)s,
                 %(purchase_price)s, %(current_value)s,
                 %(serial_number)s, %(condition)s,
                 %(room_location)s, %(quantity)s,
                 %(brand)s, %(model)s, %(notes)s)
                RETURNING id
                """,
                data,
            )
            item_id = cursor.fetchone()["id"]
            conn.commit()
    return get_item_or_404(item_id, user_id)


@app.get("/api/items/summary")
def item_summary(
    user_id: str = Depends(get_current_user),
) -> dict:
    with closing(connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT COUNT(*) AS total_items,
                       COALESCE(SUM(quantity), 0) AS total_quantity,
                       COALESCE(
                           SUM(COALESCE(current_value, purchase_price, 0)
                               * quantity), 0
                       ) AS total_value
                FROM items
                WHERE user_id = %s
                """,
                (user_id,),
            )
            row = cursor.fetchone()
    return {
        "total_items": row["total_quantity"],
        "total_value": row["total_value"],
    }


@app.get("/api/items/export")
def export_items(user_id: str = Depends(get_current_user)):
    with closing(connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM items WHERE user_id = %s ORDER BY id DESC", (user_id,)
            )
            items = cursor.fetchall()
    fields = [
        "id",
        "name",
        "category",
        "purchase_price",
        "current_value",
        "serial_number",
        "condition",
        "room_location",
        "quantity",
        "brand",
        "model",
        "notes",
        "created_at",
        "updated_at",
    ]
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for row in items:
        writer.writerow(
            {
                k: (
                    "'" + v
                    if isinstance(v, str)
                    and v.lstrip().startswith(("=", "+", "-", "@"))
                    else v
                )
                for k, v in row.items()
            }
        )
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=inventory.csv",
            "Cache-Control": "no-store",
        },
    )


@app.get("/api/items/{item_id}")
def get_item(item_id: int, user_id: str = Depends(get_current_user)) -> dict:
    return get_item_or_404(item_id, user_id)


@app.put("/api/items/{item_id}")
def update_item(
    item_id: int, item: ItemUpdate, user_id: str = Depends(get_current_user)
) -> dict:
    data = item.model_dump()
    data["id"] = item_id
    data["user_id"] = user_id
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
                WHERE id=%(id)s AND user_id=%(user_id)s
                """,
                data,
            )
            if cursor.rowcount == 0:
                raise HTTPException(404, "Item not found")
            conn.commit()
    return get_item_or_404(item_id, user_id)


@app.delete("/api/items/{item_id}", status_code=204)
def delete_item(item_id: int, user_id: str = Depends(get_current_user)) -> None:
    with closing(connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM items WHERE id = %s AND user_id = %s", (item_id, user_id)
            )
            if cursor.rowcount == 0:
                raise HTTPException(404, "Item not found")
            conn.commit()


SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "item-photos")
CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def save_photo(filename: str, data: bytes, suffix: str) -> str:
    """Store a private object and return its path, not a public URL."""
    if SUPABASE_URL and SUPABASE_SERVICE_KEY:
        response = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{filename}",
            data=data,
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "apikey": SUPABASE_SERVICE_KEY,
                "Content-Type": CONTENT_TYPES[suffix],
                "x-upsert": "false",
            },
            timeout=30,
        )
        if not response.ok:
            raise HTTPException(status_code=502, detail="Photo upload failed")
        return filename
    raise HTTPException(503, "Private photo storage is not configured")


def signed_photo_url(path: str, user_id: str) -> Optional[str]:
    if not path.startswith(f"{user_id}/"):
        return None
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    try:
        response = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/sign/{SUPABASE_BUCKET}/{path}",
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "apikey": SUPABASE_SERVICE_KEY,
            },
            json={"expiresIn": 3600},
            timeout=10,
        )
        response.raise_for_status()
        signed = response.json()["signedURL"]
        return f"{SUPABASE_URL}/storage/v1{signed}"
    except (requests.RequestException, KeyError, ValueError):
        return None


@app.post("/api/items/{item_id}/photo")
def upload_photo(
    item_id: int,
    photo: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
) -> dict:
    get_item_or_404(item_id, user_id)
    suffix = Path(photo.filename or "photo.jpg").suffix.lower() or ".jpg"
    if suffix not in CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type")
    contents = photo.file.read(10 * 1024 * 1024 + 1)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(413, "Image exceeds 10 MB")
    photo_url = save_photo(
        f"{user_id}/item-{item_id}-{uuid4().hex}{suffix}", contents, suffix
    )
    with closing(connection()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE items
                SET photo_url = %s,
                    updated_at = NOW()
                WHERE id = %s AND user_id = %s
                """,
                (photo_url, item_id, user_id),
            )
            if cursor.rowcount == 0:
                raise HTTPException(404, "Item not found")
            conn.commit()
    return get_item_or_404(item_id, user_id)


@app.post("/api/analyze-image")
def analyze_uploaded_image(
    image: UploadFile = File(...), user_id: str = Depends(get_current_user)
) -> dict:
    contents = image.file.read(10 * 1024 * 1024 + 1)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(413, "Image exceeds 10 MB")
    try:
        from PIL import Image

        analyzed = analyze_image(Image.open(io.BytesIO(contents)).convert("RGB"))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"Unable to analyze image: {exc}"
        ) from exc
    return analyzed
