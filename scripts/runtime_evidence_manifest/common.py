"""Shared helpers for runtime evidence manifest export."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
RELEASE_MANIFEST = REPO_ROOT / "docs" / "reference" / "CVF_RELEASE_MANIFEST.md"
RELEASE_PACKET = (
    REPO_ROOT
    / "docs"
    / "reviews"
    / "cvf_phase_governance"
    / "CVF_RELEASE_APPROVAL_PACKET_LOCAL_BASELINE_2026-03-07.md"
)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def require_existing(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(f"Missing required canonical artifact: {rel(path)}")


def resolve_repo_path(raw_path: str) -> Path:
    candidate = Path(raw_path)
    if candidate.is_absolute():
        return candidate
    return (REPO_ROOT / candidate).resolve()
