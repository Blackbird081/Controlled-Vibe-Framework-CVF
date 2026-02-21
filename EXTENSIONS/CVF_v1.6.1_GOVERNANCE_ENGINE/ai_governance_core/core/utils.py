import json
import hashlib
from pathlib import Path


def load_json(path: str):
    with open(path, "r") as f:
        return json.load(f)


def save_json(path: str, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def generate_hash(data: dict) -> str:
    encoded = json.dumps(data, sort_keys=True).encode()
    return hashlib.sha256(encoded).hexdigest()