"""Deterministic, read-only CVF ASSF skill metadata resolver.

ASSF-T2: accepts caller-supplied task class, role, lifecycle phase,
surface selector, and an optional risk ceiling, then returns a bounded,
ordered list of matching skill metadata items loaded from the generated
``docs/reference/agent_system_skills/generated/skill-index.json``.

This module never mutates the filesystem, never selects or calls a
provider or model, never executes a prompt, never opens a package
instruction body (SKILL.md), and never reinjects agent memory.
Returning a packet from this resolver is not evidence that any caller
read or understood it.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

INDEX_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "agent_system_skills"
    / "generated"
    / "skill-index.json"
)

_EXCLUDED_STATUSES: frozenset[str] = frozenset({"RETIRED", "REJECTED"})

_RISK_RANK: dict[str, int] = {"R0": 0, "R1": 1, "R2": 2, "R3": 3}

_DEFAULT_MAX_RESULTS = 10


@dataclass(frozen=True)
class SkillEntry:
    """One parsed ASSF skill entry, read-only and immutable after construction."""

    skill_id: str
    name: str
    version: str
    status: str
    risk_profile: str
    task_classes: tuple[str, ...]
    roles: tuple[str, ...]
    phases: tuple[str, ...]
    surfaces: tuple[str, ...]
    use_when: str
    do_not_use_when: str
    internal_agent_disposition: str
    external_cli_mcp_disposition: str
    source_path: str


@dataclass(frozen=True)
class ResolvedSkillPacketItem:
    """One ranked result row returned by the resolver."""

    skill_id: str
    name: str
    version: str
    status: str
    risk_profile: str
    use_when: str
    do_not_use_when: str
    internal_agent_disposition: str
    external_cli_mcp_disposition: str
    source_path: str


@dataclass(frozen=True)
class SkillPacket:
    """Bounded, ordered resolver output. Read-only; not an action receipt."""

    items: tuple[ResolvedSkillPacketItem, ...] = field(default_factory=tuple)
    truncated: bool = False
    total_candidates: int = 0

    def to_dict(self) -> dict:
        return {
            "claimBoundary": (
                "Returning this packet is not evidence that any caller read "
                "or understood it. Loading metadata does not activate any skill, "
                "authorize any CLI/MCP adapter, or expand external-agent scope."
            ),
            "items": [
                {
                    "doNotUseWhen": item.do_not_use_when,
                    "externalCliMcpDisposition": item.external_cli_mcp_disposition,
                    "internalAgentDisposition": item.internal_agent_disposition,
                    "name": item.name,
                    "riskProfile": item.risk_profile,
                    "skillId": item.skill_id,
                    "sourcePath": item.source_path,
                    "status": item.status,
                    "useWhen": item.use_when,
                    "version": item.version,
                }
                for item in self.items
            ],
            "totalCandidates": self.total_candidates,
            "truncated": self.truncated,
        }


def _to_str_tuple(value: object) -> tuple[str, ...]:
    """Normalize a JSON list or semicolon-separated string into a tuple of strings."""
    if isinstance(value, list):
        return tuple(str(v).strip() for v in value if str(v).strip())
    if isinstance(value, str):
        return tuple(p.strip() for p in value.split(";") if p.strip())
    return ()


def _source_citation(skill_id: str) -> str:
    return (
        "docs/reference/agent_system_skills/generated/skill-index.json"
        f"#skills/{skill_id}"
    )


def _parse_skill(entry: dict) -> SkillEntry | None:
    skill_id = str(entry.get("skillId", "")).strip()
    if not skill_id:
        return None
    return SkillEntry(
        skill_id=skill_id,
        name=str(entry.get("name", "")),
        version=str(entry.get("version", "")),
        status=str(entry.get("status", "")),
        risk_profile=str(entry.get("riskProfile", "")),
        task_classes=_to_str_tuple(entry.get("taskClasses", [])),
        roles=_to_str_tuple(entry.get("roles", [])),
        phases=_to_str_tuple(entry.get("phases", [])),
        surfaces=_to_str_tuple(entry.get("surfaces", [])),
        use_when=str(entry.get("useWhen", "")),
        do_not_use_when=str(entry.get("doNotUseWhen", "")),
        internal_agent_disposition=str(entry.get("internalAgentDisposition", "")),
        external_cli_mcp_disposition=str(entry.get("externalCliMcpDisposition", "")),
        source_path=_source_citation(skill_id),
    )


def load_entries(index_path: Path | None = None) -> tuple[SkillEntry, ...]:
    """Read-only load of skill entries from the generated index. No mutation."""
    path = index_path or INDEX_PATH
    if not path.is_file():
        return ()
    raw = json.loads(path.read_text(encoding="utf-8"))
    skills_raw = raw.get("skills", [])
    if not isinstance(skills_raw, list):
        return ()
    entries: list[SkillEntry] = []
    for item in skills_raw:
        if isinstance(item, dict):
            entry = _parse_skill(item)
            if entry is not None:
                entries.append(entry)
    return tuple(entries)


def _matches(
    entry: SkillEntry,
    task_class: str | None,
    role: str | None,
    phase: str | None,
    surface_selector: str | None,
    risk_ceiling: str | None,
    include_excluded: bool,
) -> bool:
    if not include_excluded and entry.status.upper() in _EXCLUDED_STATUSES:
        return False
    if task_class is not None and task_class not in entry.task_classes:
        return False
    if role is not None and role not in entry.roles:
        return False
    if phase is not None and phase not in entry.phases:
        return False
    if surface_selector is not None:
        if not any(surface_selector.lower() in s.lower() for s in entry.surfaces):
            return False
    if risk_ceiling is not None:
        ceiling_rank = _RISK_RANK.get(risk_ceiling.upper())
        entry_rank = _RISK_RANK.get(entry.risk_profile.upper())
        if ceiling_rank is not None and entry_rank is not None:
            if entry_rank > ceiling_rank:
                return False
    return True


def _sort_key(entry: SkillEntry) -> tuple[int, str]:
    risk_rank = _RISK_RANK.get(entry.risk_profile.upper(), -1)
    return (risk_rank, entry.skill_id)


def resolve_skill_packet(
    *,
    task_class: str | None = None,
    role: str | None = None,
    phase: str | None = None,
    surface_selector: str | None = None,
    risk_ceiling: str | None = None,
    max_results: int = _DEFAULT_MAX_RESULTS,
    include_excluded: bool = False,
    entries: tuple[SkillEntry, ...] | None = None,
) -> SkillPacket:
    """Deterministic, read-only resolution of a bounded skill metadata packet.

    All inputs are caller-supplied or drawn from the generated index at
    ``docs/reference/agent_system_skills/generated/skill-index.json``.
    No filesystem write, provider call, prompt execution, or SKILL.md open
    occurs during resolution when entries are pre-supplied.
    """
    if max_results <= 0:
        raise ValueError("max_results must be a positive integer")
    if risk_ceiling is not None and risk_ceiling.upper() not in _RISK_RANK:
        raise ValueError("risk_ceiling must be one of R0, R1, R2, or R3")

    candidates = entries if entries is not None else load_entries()
    matched = [
        e
        for e in candidates
        if _matches(
            e,
            task_class,
            role,
            phase,
            surface_selector,
            risk_ceiling,
            include_excluded,
        )
    ]
    matched.sort(key=_sort_key)

    total_candidates = len(matched)
    truncated = total_candidates > max_results
    bounded = matched[:max_results]

    items = tuple(
        ResolvedSkillPacketItem(
            skill_id=e.skill_id,
            name=e.name,
            version=e.version,
            status=e.status,
            risk_profile=e.risk_profile,
            use_when=e.use_when,
            do_not_use_when=e.do_not_use_when,
            internal_agent_disposition=e.internal_agent_disposition,
            external_cli_mcp_disposition=e.external_cli_mcp_disposition,
            source_path=e.source_path,
        )
        for e in bounded
    )
    return SkillPacket(
        items=items,
        truncated=truncated,
        total_candidates=total_candidates,
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "CVF ASSF read-only skill metadata resolver. "
            "Returns bounded skill metadata from the generated index. "
            "Never opens a package instruction body."
        )
    )
    parser.add_argument("--task-class", default=None)
    parser.add_argument("--role", default=None)
    parser.add_argument("--phase", default=None)
    parser.add_argument("--surface", default=None)
    parser.add_argument("--risk-ceiling", default=None)
    parser.add_argument("--max-results", type=int, default=_DEFAULT_MAX_RESULTS)
    parser.add_argument(
        "--include-excluded",
        action="store_true",
        help="Include RETIRED and REJECTED skills in results",
    )
    args = parser.parse_args()

    try:
        packet = resolve_skill_packet(
            task_class=args.task_class,
            role=args.role,
            phase=args.phase,
            surface_selector=args.surface,
            risk_ceiling=args.risk_ceiling,
            max_results=args.max_results,
            include_excluded=args.include_excluded,
        )
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(packet.to_dict(), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
