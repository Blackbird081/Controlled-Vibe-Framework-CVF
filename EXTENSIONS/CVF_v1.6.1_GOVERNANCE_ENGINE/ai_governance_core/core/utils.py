"""
utils.py

Core Utilities — Thread-Safe JSON I/O + Hashing
-------------------------------------------------

All file I/O goes through these helpers so that concurrent
governance pipeline runs (e.g. in a FastAPI server) do not
corrupt shared JSON files.

Author: Governance Engine
"""

import json
import hashlib
import threading
from pathlib import Path

# Module-level lock for all JSON file operations.
# For cross-process safety, consider `filelock` (pip install filelock).
_file_lock = threading.Lock()


def load_json(path: str):
    """Thread-safe JSON file read."""
    with _file_lock:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)


def save_json(path: str, data):
    """Thread-safe JSON file write with atomic semantics."""
    with _file_lock:
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = target.with_suffix(".tmp")
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        tmp_path.replace(target)


def generate_hash(data: dict) -> str:
    """Deterministic SHA-256 hash of a dict."""
    encoded = json.dumps(data, sort_keys=True).encode()
    return hashlib.sha256(encoded).hexdigest()