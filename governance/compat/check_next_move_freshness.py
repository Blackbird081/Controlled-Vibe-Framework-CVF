#!/usr/bin/env python3
"""
CVF Next-Move Freshness Checker

Fails when the active next-move surfaces point to a target that the active
session state already records as CLOSED_PASS or CLOSED_PASS_BOUNDED.

The checker is intentionally narrow. It scans only the current next-move
surfaces:

- ACTIVE_SESSION_STATE.json top-level nextAllowedMove
- CVF_SESSION_MEMORY.md ## Next Allowed Move
- the active handoff ## Next Allowed Move and startup acknowledgment

It does not scan historical state-entry nextAllowedMove values because those
entries are retained provenance, not the active instruction surface.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


REPO_ROOT = Path(__file__).resolve().parents[2]

FRONT_DOOR_PATH = "CVF_SESSION_MEMORY.md"
STATE_PATH = "CVF_SESSION/ACTIVE_SESSION_STATE.json"

CLOSED_RE = re.compile(r"\bCLOSED_PASS(?:_BOUNDED)?\b", re.IGNORECASE)

LABEL_PATTERNS = (
    re.compile(r"\bRSF-T\d+[A-Z]?\b", re.IGNORECASE),
    re.compile(r"\bFPRC-T\d+[A-Z]?\b", re.IGNORECASE),
    re.compile(r"\bCCLV-T\d+[A-Z]?\b", re.IGNORECASE),
    re.compile(r"\bLHW\d+\b", re.IGNORECASE),
    re.compile(
        r"\b(?:MODEL\s+GATEWAY\s+)?C[-\s]?0?2\s+P\d+(?:[A-Z](?![A-Z0-9]))?(?:[-\s][A-Z](?![A-Z0-9]))?\b",
        re.IGNORECASE,
    ),
)

ACTION_RE = re.compile(
    r"\b("
    r"next\s+allowed\s+move|next\s+move|dispatch(?:ed|ing)?|redispatch|"
    r"dispatch_ready|ready|worker|execute|may\s+open|open\s+only\s+through|"
    r"may\s+proceed|allowed\s+to\s+open|active"
    r")\b",
    re.IGNORECASE,
)

SAFE_CLOSED_CONTEXT_RE = re.compile(
    r"\b("
    r"closed_pass(?:_bounded)?|already\s+closed|is\s+closed|closed\s+at|"
    r"do\s+not|must\s+not|not\s+authorized|blocked|parked"
    r")\b",
    re.IGNORECASE,
)

STARTUP_ACK_RE = re.compile(r"^Startup acknowledged:.*$", re.IGNORECASE | re.MULTILINE)


@dataclass(frozen=True)
class ClosedTarget:
    label: str
    aliases: tuple[str, ...]
    evidence: str


@dataclass(frozen=True)
class NextMoveSurface:
    name: str
    path: str
    text: str


@dataclass(frozen=True)
class Violation:
    surface: str
    target: str
    line: str
    evidence: str


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


def _load_state() -> tuple[dict[str, Any] | None, str | None]:
    text = _read_text(STATE_PATH)
    if text is None:
        return None, f"{STATE_PATH} not found"
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        return None, f"{STATE_PATH} is not valid JSON: {exc}"
    if not isinstance(data, dict):
        return None, f"{STATE_PATH} is not a JSON object"
    return data, None


def _normalize_for_matching(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("_", " ").replace("/", " ")).strip()


def _canonical_label(raw: str) -> str:
    text = _normalize_for_matching(raw).upper()
    mg = re.search(r"(?:MODEL\s+GATEWAY\s+)?C[-\s]?0?2\s+(P\d+[A-Z]?(?:[-\s][A-Z])?)", text)
    if mg:
        phase = mg.group(1).replace(" ", "-")
        return f"Model Gateway C-02 {phase}"
    for prefix in ("RSF", "FPRC", "CCLV"):
        match = re.search(rf"\b{prefix}-T\d+[A-Z]?\b", text)
        if match:
            return match.group(0)
    match = re.search(r"\bLHW\d+\b", text)
    if match:
        return match.group(0)
    return raw.strip()


def _aliases_for(label: str) -> tuple[str, ...]:
    aliases = {label}
    upper = label.upper()
    if upper.startswith("MODEL GATEWAY C-02 "):
        short = label.replace("Model Gateway ", "")
        aliases.add(short)
        aliases.add(short.replace("C-02", "C02"))
        aliases.add(label.replace("C-02", "C02"))
    return tuple(sorted(aliases, key=len, reverse=True))


def _labels_from_text(text: str) -> set[str]:
    normalized = _normalize_for_matching(text)
    labels: set[str] = set()
    for pattern in LABEL_PATTERNS:
        for match in pattern.finditer(normalized):
            labels.add(_canonical_label(match.group(0)))
    return labels


def _iter_closed_target_records(value: Any, path: str = "$") -> Iterable[tuple[str, str]]:
    if isinstance(value, dict):
        status = value.get("status")
        status_is_closed = isinstance(status, str) and CLOSED_RE.search(status)
        if status_is_closed:
            evidence_parts = [path]
            for key, nested in value.items():
                if isinstance(nested, str) and key in {
                    "roadmap",
                    "gc018",
                    "workOrder",
                    "workerReturn",
                    "reviewerOwnedClosurePath",
                    "completionReviewPath",
                    "completion",
                    "review",
                }:
                    evidence_parts.append(key)
                    evidence_parts.append(nested)
            yield " ".join(evidence_parts), f"{path}.status={status}"
        for key, nested in value.items():
            yield from _iter_closed_target_records(nested, f"{path}.{key}")
    elif isinstance(value, list):
        for index, nested in enumerate(value):
            yield from _iter_closed_target_records(nested, f"{path}[{index}]")
    elif isinstance(value, str) and CLOSED_RE.search(value):
        yield value, path


def collect_closed_targets(state: dict[str, Any]) -> list[ClosedTarget]:
    by_label: dict[str, ClosedTarget] = {}
    for text, evidence in _iter_closed_target_records(state):
        for label in _labels_from_text(text):
            by_label.setdefault(
                label,
                ClosedTarget(label=label, aliases=_aliases_for(label), evidence=evidence),
            )
    return sorted(by_label.values(), key=lambda item: item.label)


def _extract_heading_section(text: str | None, heading: str) -> str | None:
    if text is None:
        return None
    lines = text.splitlines()
    start: int | None = None
    heading_lower = heading.lower()
    for index, line in enumerate(lines):
        if line.strip().lower() == heading_lower:
            start = index + 1
            break
    if start is None:
        return None
    end = len(lines)
    for index in range(start, len(lines)):
        if lines[index].startswith("## "):
            end = index
            break
    return "\n".join(lines[start:end]).strip()


def _extract_startup_ack(text: str | None) -> str:
    if text is None:
        return ""
    match = STARTUP_ACK_RE.search(text)
    return match.group(0).strip() if match else ""


def collect_next_move_surfaces(state: dict[str, Any]) -> tuple[list[NextMoveSurface], list[str]]:
    surfaces: list[NextMoveSurface] = []
    diagnostics: list[str] = []

    next_allowed = state.get("nextAllowedMove")
    if isinstance(next_allowed, str) and next_allowed.strip():
        surfaces.append(NextMoveSurface("active state nextAllowedMove", STATE_PATH, next_allowed))
    else:
        diagnostics.append(f"{STATE_PATH} missing top-level nextAllowedMove string")

    front_text = _read_text(FRONT_DOOR_PATH)
    front_next = _extract_heading_section(front_text, "## Next Allowed Move")
    if front_next:
        surfaces.append(NextMoveSurface("front-door Next Allowed Move", FRONT_DOOR_PATH, front_next))
    else:
        diagnostics.append(f"{FRONT_DOOR_PATH} missing ## Next Allowed Move section")

    handoff = state.get("activeHandoff")
    handoff_path = handoff if isinstance(handoff, str) and handoff else None
    handoff_text = _read_text(handoff_path) if handoff_path else None
    if not handoff_path:
        diagnostics.append(f"{STATE_PATH} missing activeHandoff string")
    elif handoff_text is None:
        diagnostics.append(f"active handoff not found: {handoff_path}")
    else:
        handoff_next = _extract_heading_section(handoff_text, "## Next Allowed Move")
        if handoff_next:
            surfaces.append(NextMoveSurface("active handoff Next Allowed Move", handoff_path, handoff_next))
        else:
            diagnostics.append(f"{handoff_path} missing ## Next Allowed Move section")
        startup_ack = _extract_startup_ack(handoff_text)
        if startup_ack:
            surfaces.append(NextMoveSurface("active handoff startup acknowledgment", handoff_path, startup_ack))
        else:
            diagnostics.append(f"{handoff_path} missing startup acknowledgment")

    return surfaces, diagnostics


def _line_contains_alias(line: str, target: ClosedTarget) -> bool:
    line_lower = _normalize_for_matching(line).lower()
    return any(_normalize_for_matching(alias).lower() in line_lower for alias in target.aliases)


def _iter_fragments(text: str) -> Iterable[str]:
    paragraph: list[str] = []
    for raw_line in [*text.splitlines(), ""]:
        stripped = raw_line.strip()
        if stripped:
            paragraph.append(stripped)
            continue
        if not paragraph:
            continue
        logical_line = " ".join(paragraph)
        paragraph = []
        for fragment in re.split(r"(?<=[.;])\s+|\s+-\s+", logical_line):
            cleaned = fragment.strip()
            if cleaned:
                yield cleaned


def evaluate(
    closed_targets: list[ClosedTarget],
    surfaces: list[NextMoveSurface],
    diagnostics: list[str],
) -> list[Violation]:
    violations = [
        Violation(
            surface="configuration",
            target="next-move surface",
            line=diagnostic,
            evidence="required current next-move surface missing",
        )
        for diagnostic in diagnostics
    ]

    for surface in surfaces:
        for line in _iter_fragments(surface.text):
            for target in closed_targets:
                if not _line_contains_alias(line, target):
                    continue
                if not ACTION_RE.search(line):
                    continue
                if SAFE_CLOSED_CONTEXT_RE.search(line):
                    continue
                violations.append(
                    Violation(
                        surface=f"{surface.name} ({surface.path})",
                        target=target.label,
                        line=line,
                        evidence=target.evidence,
                    )
                )
    return violations


def main() -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(
        description=(
            "Check current CVF next-move surfaces for stale references to "
            "targets already CLOSED_PASS or CLOSED_PASS_BOUNDED."
        )
    )
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Exit non-zero when stale closed-target next-move text is found.",
    )
    args = parser.parse_args()

    print("=== CVF Next-Move Freshness Checker ===")
    state, error = _load_state()
    if error:
        print(f"VIOLATION: {error}")
        return 1 if args.enforce else 0
    assert state is not None

    closed_targets = collect_closed_targets(state)
    surfaces, diagnostics = collect_next_move_surfaces(state)

    print(f"Closed targets discovered: {len(closed_targets)}")
    for target in closed_targets:
        print(f"  - {target.label} [{target.evidence}]")

    print(f"\nNext-move surfaces checked: {len(surfaces)}")
    for surface in surfaces:
        print(f"  - {surface.name}: {surface.path}")

    violations = evaluate(closed_targets, surfaces, diagnostics)
    print(f"\nViolations: {len(violations)}")
    for violation in violations:
        print(f"  - {violation.surface}: {violation.target}")
        print(f"    line: {violation.line}")
        print(f"    closed evidence: {violation.evidence}")

    if violations:
        if args.enforce:
            print("\nVIOLATION - current next-move text points at closed work.")
            return 1
        print("\nADVISORY - current next-move text may point at closed work.")
        return 0

    print("\nCOMPLIANT - current next-move surfaces do not dispatch closed targets.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
