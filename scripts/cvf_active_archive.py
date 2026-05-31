#!/usr/bin/env python3
"""Public-safe active archive helpers used by compatibility gates."""

from __future__ import annotations

import datetime as dt
import json
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ACTIVE_WINDOW_REGISTRY_PATH = PROJECT_ROOT / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"
AUDIT_RETENTION_REGISTRY_PATH = PROJECT_ROOT / "governance" / "compat" / "CVF_AUDIT_RETENTION_REGISTRY.json"
REVIEW_RETENTION_REGISTRY_PATH = PROJECT_ROOT / "governance" / "compat" / "CVF_REVIEW_RETENTION_REGISTRY.json"
AGE_THRESHOLD_DAYS = 30


@dataclass(frozen=True)
class ArchiveScan:
    active: list[str]
    archive_candidates: list[str]


@dataclass(frozen=True)
class ArchiveRisk:
    blocked: bool
    reason: str = ""


def _rel(path: Path) -> str:
    return path.relative_to(PROJECT_ROOT).as_posix()


def extract_date_from_filename(name: str) -> dt.datetime | None:
    match = re.search(r"(\d{4}-\d{2}-\d{2})", name)
    if not match:
        return None
    return dt.datetime.strptime(match.group(1), "%Y-%m-%d")


@lru_cache(maxsize=1)
def load_active_window_paths() -> set[str]:
    if not ACTIVE_WINDOW_REGISTRY_PATH.exists():
        return set()
    payload = json.loads(ACTIVE_WINDOW_REGISTRY_PATH.read_text(encoding="utf-8"))
    return {
        entry["activePath"]
        for entry in payload.get("windows", [])
        if isinstance(entry, dict) and entry.get("activePath")
    }


@lru_cache(maxsize=1)
def load_audit_retain_evidence_paths() -> set[str]:
    if not AUDIT_RETENTION_REGISTRY_PATH.exists():
        return set()
    payload = json.loads(AUDIT_RETENTION_REGISTRY_PATH.read_text(encoding="utf-8"))
    return {
        path
        for path in payload.get("retainEvidencePaths", [])
        if isinstance(path, str) and path
    }


@lru_cache(maxsize=1)
def load_review_retain_evidence_paths() -> set[str]:
    if not REVIEW_RETENTION_REGISTRY_PATH.exists():
        return set()
    payload = json.loads(REVIEW_RETENTION_REGISTRY_PATH.read_text(encoding="utf-8"))
    return {
        path
        for path in payload.get("retainEvidencePaths", [])
        if isinstance(path, str) and path
    }


def scan_root(root: Path, cutoff: dt.datetime) -> ArchiveScan:
    active: list[str] = []
    archive_candidates: list[str] = []
    if not root.exists():
        return ArchiveScan(active=active, archive_candidates=archive_candidates)

    for path in sorted(root.rglob("*.md")):
        rel_path = _rel(path)
        file_date = extract_date_from_filename(path.name)
        if file_date is None or file_date > cutoff:
            active.append(rel_path)
        else:
            archive_candidates.append(rel_path)
    return ArchiveScan(active=active, archive_candidates=archive_candidates)


def build_full_plan(
    cutoff: dt.datetime,
    scans: dict[str, ArchiveScan],
    candidates: list[str],
) -> tuple[dict[str, ArchiveRisk], dict[str, int]]:
    retain_paths = load_audit_retain_evidence_paths() | load_review_retain_evidence_paths()
    active_windows = load_active_window_paths()
    risks: dict[str, ArchiveRisk] = {}
    for candidate in candidates:
        blocked = candidate in retain_paths or candidate in active_windows
        risks[candidate] = ArchiveRisk(blocked=blocked, reason="retain_or_active_window" if blocked else "")
    return risks, {"candidateCount": len(candidates), "scanCount": len(scans), "cutoffOrdinal": cutoff.toordinal()}
