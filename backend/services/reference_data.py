import io
import os
from pathlib import Path

import pandas as pd

from backend.config import SESSION_REF_PATH, SESSION_RESULTS


def ensure_session_dir():
    """Create the session results directory and copy bundled reference if needed."""
    SESSION_RESULTS.mkdir(parents=True, exist_ok=True)
    if not SESSION_REF_PATH.exists() and (Path(os.getenv("INVENTORY_BUNDLED_REF", "")) or Path("results") / "confirmed_reference.csv").exists():
        # Prefer the repo-local bundled copy if present.
        candidate = Path(os.getenv("INVENTORY_BUNDLED_REF", "results/confirmed_reference.csv"))
        if candidate.exists():
            SESSION_REF_PATH.write_text(candidate.read_text())


def load_confirmed_reference() -> pd.DataFrame:
    """Load confirmed_reference.csv from session storage if present."""
    ensure_session_dir()
    try:
        return pd.read_csv(SESSION_REF_PATH)
    except Exception:
        return pd.DataFrame(
            columns=[
                "category",
                "item_name",
                "brand",
                "model",
                "serial_number",
                "raw_text",
                "location",
                "notes",
            ]
        )


def save_corrections(corrections: pd.DataFrame):
    """Append user corrections to the session reference file."""
    ensure_session_dir()
    existing = load_confirmed_reference()

    for col in ["category", "item_name", "brand", "model", "serial_number", "location", "notes"]:
        if col in corrections.columns:
            corrections[col] = corrections[col].apply(
                lambda x: str(x).strip().upper() if pd.notna(x) else ""
            )

    updated = pd.concat([existing, corrections], ignore_index=True)
    updated = updated.drop_duplicates(subset=["raw_text"], keep="last")
    updated.to_csv(SESSION_REF_PATH, index=False)
