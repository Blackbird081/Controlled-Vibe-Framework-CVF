#!/usr/bin/env python3
"""
CVF Session Mode-Consistency Checker

Fails when the session mode marker disagrees across its canonical surfaces:

- front door CVF_SESSION_MEMORY.md: `Current mode marker:`, `Current mode:`,
  and the `## Next Allowed Move` `Mode:` line
- active handoff (resolved from ACTIVE_SESSION_STATE.json activeHandoff):
  the `## Current Mode` value and the startup acknowledgment `current mode=` field
- CVF_SESSION/state/ACTIVE_SESSION_STATE_CORE.json: `currentMode`

This closes the gap where check_active_session_state.py validates only that
`currentMode` is a non-empty string and never compares it against the
front-door or handoff marker text, letting the surfaces drift silently.

This checker is read-only: it never writes, stages, or commits any file.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

FRONT_DOOR_PATH = "CVF_SESSION_MEMORY.md"
STATE_PATH = "CVF_SESSION/ACTIVE_SESSION_STATE.json"
CORE_PATH = "CVF_SESSION/state/ACTIVE_SESSION_STATE_CORE.json"

FRONT_DOOR_MARKER_RE = re.compile(r"^Current mode marker:\s*`([^`]+)`", re.MULTILINE)
FRONT_DOOR_MODE_RE = re.compile(r"^Current mode:\s*`([^`]+)`", re.MULTILINE)
NEXT_ALLOWED_MOVE_MODE_RE = re.compile(r"^Mode:\s*`([^`]+)`", re.MULTILINE)
HANDOFF_STARTUP_RE = re.compile(r"current mode=`([^`]+)`")
HANDOFF_CURRENT_MODE_RE = re.compile(
    r"^##\s+Current Mode\s*\n+\s*`([^`]+)`", re.MULTILINE
)
CORE_MODE_KEY = "currentMode"


@dataclass(frozen=True)
class MarkerReading:
    surface: str
    value: str | None
    detail: str


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _read_text(rel_path: str) -> str | None:
    full = REPO_ROOT / rel_path
    if not full.exists() or full.is_dir():
        return None
    return full.read_text(encoding="utf-8", errors="replace")


def _normalize_mode(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    # Strip surrounding backticks and trailing periods regardless of order,
    # e.g. "`mode`.", "`mode`", or "mode." all normalize to "mode".
    previous = None
    while cleaned != previous:
        previous = cleaned
        cleaned = cleaned.strip().strip("`").rstrip(".").strip()
    return cleaned or None


def _first_group(pattern: re.Pattern[str], text: str | None) -> str | None:
    if text is None:
        return None
    match = pattern.search(text)
    return _normalize_mode(match.group(1)) if match else None


def _extract_markdown_section(text: str | None, heading: str) -> str | None:
    if text is None:
        return None
    lines = text.splitlines()
    section: list[str] = []
    capture = False
    for line in lines:
        if line.strip() == heading:
            capture = True
            section.append(line)
            continue
        if capture and line.startswith("## "):
            break
        if capture:
            section.append(line)
    return "\n".join(section) if section else None


def resolve_active_handoff() -> str | None:
    """Resolve the active handoff path from ACTIVE_SESSION_STATE.json."""
    text = _read_text(STATE_PATH)
    if text is None:
        return None
    try:
        state = json.loads(text)
    except json.JSONDecodeError:
        return None
    handoff = state.get("activeHandoff") if isinstance(state, dict) else None
    return handoff if isinstance(handoff, str) and handoff else None


def _core_mode() -> tuple[str | None, str]:
    text = _read_text(CORE_PATH)
    if text is None:
        return None, f"{CORE_PATH} not found"
    try:
        core = json.loads(text)
    except json.JSONDecodeError as exc:
        return None, f"{CORE_PATH} is not valid JSON: {exc}"
    if not isinstance(core, dict) or CORE_MODE_KEY not in core:
        return None, f"{CORE_PATH} missing {CORE_MODE_KEY}"
    value = _normalize_mode(str(core.get(CORE_MODE_KEY)))
    return value, f"{CORE_PATH} {CORE_MODE_KEY}"


def collect_markers() -> list[MarkerReading]:
    readings: list[MarkerReading] = []

    front_text = _read_text(FRONT_DOOR_PATH)
    readings.append(
        MarkerReading(
            "front-door Current mode marker",
            _first_group(FRONT_DOOR_MARKER_RE, front_text),
            f"{FRONT_DOOR_PATH} Current mode marker:",
        )
    )
    readings.append(
        MarkerReading(
            "front-door Current mode",
            _first_group(FRONT_DOOR_MODE_RE, front_text),
            f"{FRONT_DOOR_PATH} Current mode:",
        )
    )
    front_next_allowed = _extract_markdown_section(front_text, "## Next Allowed Move")
    readings.append(
        MarkerReading(
            "front-door Next Allowed Move Mode",
            _first_group(NEXT_ALLOWED_MOVE_MODE_RE, front_next_allowed),
            f"{FRONT_DOOR_PATH} ## Next Allowed Move Mode:",
        )
    )

    handoff_rel = resolve_active_handoff()
    handoff_text = _read_text(handoff_rel) if handoff_rel else None
    handoff_label = handoff_rel or "active handoff (unresolved)"
    readings.append(
        MarkerReading(
            "handoff startup acknowledgment",
            _first_group(HANDOFF_STARTUP_RE, handoff_text),
            f"{handoff_label} startup current mode=",
        )
    )
    readings.append(
        MarkerReading(
            "handoff Current Mode",
            _first_group(HANDOFF_CURRENT_MODE_RE, handoff_text),
            f"{handoff_label} ## Current Mode",
        )
    )

    core_value, core_detail = _core_mode()
    readings.append(MarkerReading("core currentMode", core_value, core_detail))

    return readings


def evaluate(readings: list[MarkerReading]) -> list[str]:
    violations: list[str] = []

    missing = [r for r in readings if r.value is None]
    for reading in missing:
        violations.append(
            f"mode marker not found on surface '{reading.surface}' ({reading.detail})"
        )

    present = [r for r in readings if r.value is not None]
    distinct = {r.value for r in present}
    if len(distinct) > 1:
        summary = "; ".join(f"{r.surface}=`{r.value}`" for r in present)
        violations.append(
            "session mode marker disagrees across surfaces: " + summary
        )

    return violations


def main() -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(
        description=(
            "Check that the session mode marker agrees across the front door, "
            "active handoff, and ACTIVE_SESSION_STATE_CORE.json (read-only)."
        )
    )
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Exit non-zero when a marker is missing or surfaces disagree.",
    )
    args = parser.parse_args()

    print("=== CVF Session Mode-Consistency Checker ===")
    readings = collect_markers()
    for reading in readings:
        shown = reading.value if reading.value is not None else "(not found)"
        print(f"  {reading.surface}: {shown}  [{reading.detail}]")

    violations = evaluate(readings)
    print(f"\nViolations: {len(violations)}")
    for violation in violations:
        print(f"  - {violation}")

    if violations:
        if args.enforce:
            print("\nVIOLATION - session mode marker is inconsistent or incomplete.")
            return 1
        print("\nADVISORY - session mode marker is inconsistent (use --enforce to fail).")
        return 0

    print("\nCOMPLIANT - session mode marker agrees across all surfaces.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
