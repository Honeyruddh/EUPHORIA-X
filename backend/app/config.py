import json
import os
from pathlib import Path
from typing import Any, Dict

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_FILE = BASE_DIR / "config" / "settings.json"
DATA_DIR = BASE_DIR.parent / "data"
DATABASE_URL = f"sqlite:///{BASE_DIR}/campuspulse.db"


def load_settings() -> Dict[str, Any]:
    if not CONFIG_FILE.exists():
        raise FileNotFoundError(f"Settings file not found at {CONFIG_FILE}")
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_settings(new_settings: Dict[str, Any]) -> None:
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(new_settings, f, indent=2)
