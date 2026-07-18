"""Deterministic, read-only ADIF task/role/phase defect packet resolver.

ADIF-T2: accepts caller-supplied task class, role, lifecycle phase, surface
selector, and an optional risk ceiling, then returns a bounded, ordered list
of matching defect entries loaded from
``docs/reference/agent_defect_intelligence/entries/``.

This module never mutates the filesystem, never selects or calls a
provider/model, never executes a prompt, and never reinjects agent memory.
Returning a packet from this resolver is not evidence that any caller read
or understood it; see the ADIF entry template's Claim Boundary section.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ENTRIES_DIR = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "agent_defect_intelligence"
    / "entries"
)

_FIELD_BLOCK_RE = re.compile(r"```text\n(.*?)\n```", re.DOTALL)

_LIST_FIELDS = {"taskClasses", "roles", "lifecyclePhases"}

_ELIGIBLE_LIFECYCLE_STATE = "ACTIVE"

_SEVERITY_RANK = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}

_DEFAULT_MAX_RESULTS = 10


@dataclass(frozen=True)
class DefectEntry:
    """One parsed ADIF entry, read-only and immutable after construction."""

    defect_id: str
    title: str
    defect_category: str
    defect_class: str
    defect_role: str
    severity: str
    lifecycle_state: str
    task_classes: tuple[str, ...]
    roles: tuple[str, ...]
    lifecycle_phases: tuple[str, ...]
    surface_selectors: str
    detection_signals: str
    enforcement_level: str
    checker_bindings: str
    promotion_state: str
    supersedes: str
    last_verified_commit: str
    roadmap_seed_id: str
    source_path: str


@dataclass(frozen=True)
class ResolvedDefectPacketItem:
    """One ranked result row returned by the resolver."""

    defect_id: str
    title: str
    defect_category: str
    defect_class: str
    severity: str
    enforcement_level: str
    checker_bindings: str
    source_path: str


@dataclass(frozen=True)
class DefectPacket:
    """Bounded, ordered resolver output. Read-only; not an action receipt."""

    items: tuple[ResolvedDefectPacketItem, ...] = field(default_factory=tuple)
    truncated: bool = False
    total_candidates: int = 0

    def to_dict(self) -> dict:
        return {
            "items": [
                {
                    "defectId": item.defect_id,
                    "title": item.title,
                    "defectCategory": item.defect_category,
                    "defectClass": item.defect_class,
                    "severity": item.severity,
                    "enforcementLevel": item.enforcement_level,
                    "checkerBindings": item.checker_bindings,
                    "sourcePath": item.source_path,
                }
                for item in self.items
            ],
            "truncated": self.truncated,
            "totalCandidates": self.total_candidates,
            "claimBoundary": (
                "Returning this packet is not evidence that any caller read "
                "or understood it."
            ),
        }


def _split_list_field(value: str) -> tuple[str, ...]:
    return tuple(part.strip() for part in value.split(";") if part.strip())


def _parse_field_block(text: str) -> dict[str, str]:
    match = _FIELD_BLOCK_RE.search(text)
    if not match:
        return {}
    fields: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        if not key:
            continue
        fields[key] = value.strip()
    return fields


def _load_entry(path: Path) -> DefectEntry | None:
    text = path.read_text(encoding="utf-8")
    fields = _parse_field_block(text)
    if not fields.get("defectId"):
        return None
    return DefectEntry(
        defect_id=fields.get("defectId", ""),
        title=fields.get("title", ""),
        defect_category=fields.get("defectCategory", ""),
        defect_class=fields.get("defectClass", ""),
        defect_role=fields.get("defectRole", ""),
        severity=fields.get("severity", ""),
        lifecycle_state=fields.get("lifecycleState", ""),
        task_classes=_split_list_field(fields.get("taskClasses", "")),
        roles=_split_list_field(fields.get("roles", "")),
        lifecycle_phases=_split_list_field(fields.get("lifecyclePhases", "")),
        surface_selectors=fields.get("surfaceSelectors", ""),
        detection_signals=fields.get("detectionSignals", ""),
        enforcement_level=fields.get("enforcementLevel", ""),
        checker_bindings=fields.get("checkerBindings", ""),
        promotion_state=fields.get("promotionState", ""),
        supersedes=fields.get("supersedes", ""),
        last_verified_commit=fields.get("lastVerifiedCommit", ""),
        roadmap_seed_id=fields.get("roadmapSeedId", ""),
        source_path=_source_citation(path),
    )


def _source_citation(path: Path) -> str:
    """Return a portable repo-relative citation when the source is governed."""
    resolved = path.resolve()
    try:
        return resolved.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return resolved.as_posix()


def load_entries(entries_dir: Path | None = None) -> tuple[DefectEntry, ...]:
    """Read-only load of every ``CVF_ADIF-*.md`` entry file. No mutation."""
    directory = entries_dir or ENTRIES_DIR
    if not directory.is_dir():
        return ()
    entries: list[DefectEntry] = []
    for path in sorted(directory.glob("CVF_ADIF-*.md")):
        entry = _load_entry(path)
        if entry is not None:
            entries.append(entry)
    return tuple(entries)


def _matches(
    entry: DefectEntry,
    task_class: str | None,
    role: str | None,
    lifecycle_phase: str | None,
    surface_selector: str | None,
    risk_ceiling: str | None,
) -> bool:
    if entry.lifecycle_state.upper() != _ELIGIBLE_LIFECYCLE_STATE:
        return False
    if task_class is not None and task_class not in entry.task_classes:
        return False
    if role is not None and role not in entry.roles:
        return False
    if lifecycle_phase is not None and lifecycle_phase not in entry.lifecycle_phases:
        return False
    if surface_selector is not None and surface_selector.lower() not in entry.surface_selectors.lower():
        return False
    if risk_ceiling is not None:
        ceiling_rank = _SEVERITY_RANK.get(risk_ceiling.upper())
        entry_rank = _SEVERITY_RANK.get(entry.severity.upper())
        if ceiling_rank is not None and entry_rank is not None and entry_rank > ceiling_rank:
            return False
    return True


def _sort_key(entry: DefectEntry) -> tuple[int, str]:
    severity_rank = _SEVERITY_RANK.get(entry.severity.upper(), -1)
    return (-severity_rank, entry.defect_id)


def resolve_defect_packet(
    *,
    task_class: str | None = None,
    role: str | None = None,
    lifecycle_phase: str | None = None,
    surface_selector: str | None = None,
    risk_ceiling: str | None = None,
    max_results: int = _DEFAULT_MAX_RESULTS,
    entries: tuple[DefectEntry, ...] | None = None,
) -> DefectPacket:
    """Deterministic, read-only resolution of a bounded defect packet.

    All inputs are caller-supplied or drawn from the repository-governed
    entry files under ``docs/reference/agent_defect_intelligence/entries/``.
    No filesystem write, provider call, or prompt execution occurs.
    """
    if max_results <= 0:
        raise ValueError("max_results must be a positive integer")
    if risk_ceiling is not None and risk_ceiling.upper() not in _SEVERITY_RANK:
        raise ValueError("risk_ceiling must be one of LOW, MEDIUM, or HIGH")

    candidates = entries if entries is not None else load_entries()
    matched = [
        entry
        for entry in candidates
        if _matches(entry, task_class, role, lifecycle_phase, surface_selector, risk_ceiling)
    ]
    matched.sort(key=_sort_key)

    total_candidates = len(matched)
    truncated = total_candidates > max_results
    bounded = matched[:max_results]

    items = tuple(
        ResolvedDefectPacketItem(
            defect_id=entry.defect_id,
            title=entry.title,
            defect_category=entry.defect_category,
            defect_class=entry.defect_class,
            severity=entry.severity,
            enforcement_level=entry.enforcement_level,
            checker_bindings=entry.checker_bindings,
            source_path=entry.source_path,
        )
        for entry in bounded
    )
    return DefectPacket(items=items, truncated=truncated, total_candidates=total_candidates)


def packet_to_human_text(packet: DefectPacket) -> str:
    """Format resolver output for direct agent/operator command use."""
    lines = [
        "ADIF defect resolver",
        f"Total candidates: {packet.total_candidates}",
        f"Returned defects: {len(packet.items)}",
        f"Truncated: {packet.truncated}",
    ]
    if not packet.items:
        lines.append("Returned defects: NONE_RETURNED")
    else:
        for item in packet.items:
            lines.append(
                f"- {item.defect_id} [{item.severity}/{item.enforcement_level}] "
                f"{item.title} (checker: {item.checker_bindings}; source: {item.source_path})"
            )
    lines.append(
        "Claim boundary: Returning this packet is not evidence that any caller "
        "read or understood it."
    )
    return "\n".join(lines)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Resolve a bounded read-only ADIF defect packet."
    )
    parser.add_argument("--task-class", default=None, help="Optional task class filter")
    parser.add_argument("--role", default=None, help="Optional role filter")
    parser.add_argument("--lifecycle-phase", default=None, help="Optional lifecycle phase filter")
    parser.add_argument("--surface-selector", default=None, help="Optional surface selector substring")
    parser.add_argument("--risk-ceiling", default=None, help="Optional LOW, MEDIUM, or HIGH ceiling")
    parser.add_argument("--max-results", type=int, default=_DEFAULT_MAX_RESULTS)
    parser.add_argument("--json", action="store_true", help="Print JSON output")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    try:
        packet = resolve_defect_packet(
            task_class=args.task_class,
            role=args.role,
            lifecycle_phase=args.lifecycle_phase,
            surface_selector=args.surface_selector,
            risk_ceiling=args.risk_ceiling,
            max_results=args.max_results,
        )
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(packet.to_dict(), indent=2, ensure_ascii=False))
    else:
        print(packet_to_human_text(packet))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
