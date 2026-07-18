#!/usr/bin/env python3
"""Summarize ASSF runtime package eligibility.

This helper consumes the bounded runtime package loader and produces an audit
summary over generated ASSF metadata. It never requests instruction bodies and
never activates a package.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

HELPER_DIR = Path(__file__).resolve().parent
if str(HELPER_DIR) not in sys.path:
    sys.path.insert(0, str(HELPER_DIR))

from run_assf_runtime_package_loader import (  # noqa: E402
    INDEX_PATH,
    REPO_ROOT,
    build_runtime_package_packet,
)

CLAIM_BOUNDARY = (
    "This packet is a bounded ASSF runtime eligibility audit. It summarizes "
    "metadata and denial reasons only. It does not request instruction bodies, "
    "activate packages, certify packages, mutate lifecycle state, grant "
    "authority, implement CLI/MCP adapter behavior, call providers, commit, "
    "push, public-sync, or bypass governed work-order scope."
)


@dataclass(frozen=True)
class RuntimeEligibilityAudit:
    """Machine-readable audit over runtime package loader output."""

    source_path: str
    total_records: int
    returned_records: int
    truncated: bool
    package_roots_only: bool
    runtime_eligible_count: int
    runtime_ineligible_count: int
    ineligibility_reason_counts: dict[str, int]
    status_counts: dict[str, int]
    uat_state_counts: dict[str, int]
    certification_state_counts: dict[str, int]
    internal_agent_disposition_counts: dict[str, int]
    package_root_counts: dict[str, int]
    ready_for_body_load: tuple[str, ...]
    blocked_package_roots: tuple[dict[str, Any], ...]

    def to_dict(self, *, include_items: bool = False) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "blockedPackageRoots": list(self.blocked_package_roots),
            "certificationStateCounts": self.certification_state_counts,
            "claimBoundary": CLAIM_BOUNDARY,
            "ineligibilityReasonCounts": self.ineligibility_reason_counts,
            "instructionBodiesRequested": False,
            "internalAgentDispositionCounts": self.internal_agent_disposition_counts,
            "packageRootCounts": self.package_root_counts,
            "packageRootsOnly": self.package_roots_only,
            "readyForBodyLoad": list(self.ready_for_body_load),
            "returnedRecords": self.returned_records,
            "runtimeEligibleCount": self.runtime_eligible_count,
            "runtimeIneligibleCount": self.runtime_ineligible_count,
            "sourcePath": self.source_path,
            "statusCounts": self.status_counts,
            "totalRecords": self.total_records,
            "truncated": self.truncated,
            "uatStateCounts": self.uat_state_counts,
        }
        if include_items:
            payload["items"] = list(self.blocked_package_roots)
        return payload

    def to_human_text(self) -> str:
        lines = [
            "ASSF runtime eligibility audit",
            f"Source: {self.source_path}",
            f"Package roots only: {str(self.package_roots_only).lower()}",
            f"Total records: {self.total_records}",
            f"Returned records: {self.returned_records}",
            f"Runtime eligible: {self.runtime_eligible_count}",
            f"Runtime ineligible: {self.runtime_ineligible_count}",
            f"Truncated: {str(self.truncated).lower()}",
            f"Claim boundary: {CLAIM_BOUNDARY}",
            "Ineligibility reasons:",
        ]
        if self.ineligibility_reason_counts:
            for reason, count in self.ineligibility_reason_counts.items():
                lines.append(f"- {reason}: {count}")
        else:
            lines.append("- none: 0")
        lines.append("Blocked package roots:")
        if self.blocked_package_roots:
            for item in self.blocked_package_roots:
                reasons = ",".join(item.get("ineligibilityReasons", [])) or "none"
                lines.append(f"- {item.get('skillId', '<missing skillId>')}: {reasons}")
        else:
            lines.append("- none")
        return "\n".join(lines)


def _counter_to_dict(counter: Counter[str]) -> dict[str, int]:
    return {key: counter[key] for key in sorted(counter)}


def _text(value: Any) -> str:
    if value is None:
        return "<missing>"
    text = str(value).strip()
    return text or "<empty>"


def _is_package_root(item: dict[str, Any]) -> bool:
    root = _text(item.get("canonicalRoot")).replace("\\", "/")
    return root.startswith("docs/reference/agent_system_skills/packages/") and root.endswith(
        "/SKILL.md"
    )


def build_runtime_eligibility_audit(
    *,
    index_path: Path = INDEX_PATH,
    repo_root: Path = REPO_ROOT,
    skill_id: str | None = None,
    task_class: str | None = None,
    role: str | None = None,
    phase: str | None = None,
    surface: str | None = None,
    risk_ceiling: str | None = None,
    max_results: int = 1000,
    package_roots_only: bool = False,
) -> RuntimeEligibilityAudit:
    """Build a no-body eligibility audit over ASSF runtime package metadata."""
    packet = build_runtime_package_packet(
        index_path=index_path,
        repo_root=repo_root,
        skill_id=skill_id,
        task_class=task_class,
        role=role,
        phase=phase,
        surface=surface,
        risk_ceiling=risk_ceiling,
        max_results=max_results,
        include_instruction_bodies=False,
    ).to_dict()

    items = [item for item in packet["items"] if isinstance(item, dict)]
    if package_roots_only:
        items = [item for item in items if _is_package_root(item)]

    reason_counts: Counter[str] = Counter()
    status_counts: Counter[str] = Counter()
    uat_counts: Counter[str] = Counter()
    certification_counts: Counter[str] = Counter()
    internal_counts: Counter[str] = Counter()
    package_root_counts: Counter[str] = Counter()
    ready: list[str] = []
    blocked_roots: list[dict[str, Any]] = []

    for item in items:
        status_counts[_text(item.get("status"))] += 1
        uat_counts[_text(item.get("uatState"))] += 1
        certification_counts[_text(item.get("certificationState"))] += 1
        internal_counts[_text(item.get("internalAgentDisposition"))] += 1
        if _is_package_root(item):
            package_root_counts["PACKAGE_ROOT"] += 1
        else:
            package_root_counts["NON_PACKAGE_ROOT"] += 1

        reasons = [str(reason) for reason in item.get("ineligibilityReasons", [])]
        reason_counts.update(reasons)
        if item.get("runtimeEligible") is True:
            ready.append(_text(item.get("skillId")))
        elif _is_package_root(item):
            blocked_roots.append(
                {
                    "canonicalRoot": item.get("canonicalRoot"),
                    "certificationState": item.get("certificationState"),
                    "ineligibilityReasons": reasons,
                    "internalAgentDisposition": item.get("internalAgentDisposition"),
                    "packageBodyDisposition": item.get("packageBodyDisposition"),
                    "runtimeEligible": item.get("runtimeEligible"),
                    "skillId": item.get("skillId"),
                    "status": item.get("status"),
                    "uatState": item.get("uatState"),
                }
            )

    runtime_eligible = sum(1 for item in items if item.get("runtimeEligible") is True)
    runtime_ineligible = len(items) - runtime_eligible

    return RuntimeEligibilityAudit(
        source_path=str(packet["sourcePath"]),
        total_records=int(packet["totalCandidates"]),
        returned_records=len(items),
        truncated=bool(packet["truncated"]),
        package_roots_only=package_roots_only,
        runtime_eligible_count=runtime_eligible,
        runtime_ineligible_count=runtime_ineligible,
        ineligibility_reason_counts=_counter_to_dict(reason_counts),
        status_counts=_counter_to_dict(status_counts),
        uat_state_counts=_counter_to_dict(uat_counts),
        certification_state_counts=_counter_to_dict(certification_counts),
        internal_agent_disposition_counts=_counter_to_dict(internal_counts),
        package_root_counts=_counter_to_dict(package_root_counts),
        ready_for_body_load=tuple(sorted(ready)),
        blocked_package_roots=tuple(blocked_roots),
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Summarize ASSF runtime package eligibility from generated "
            "metadata without opening package instruction bodies."
        )
    )
    parser.add_argument("--index-path", type=Path, default=INDEX_PATH)
    parser.add_argument("--skill-id", default=None)
    parser.add_argument("--task-class", default=None)
    parser.add_argument("--role", default=None)
    parser.add_argument("--phase", default=None)
    parser.add_argument("--surface", default=None)
    parser.add_argument("--risk-ceiling", default=None)
    parser.add_argument("--max-results", type=int, default=1000)
    parser.add_argument("--package-roots-only", action="store_true")
    parser.add_argument("--include-items", action="store_true")
    parser.add_argument("--json", action="store_true", help="Emit JSON output")
    args = parser.parse_args(argv)

    try:
        audit = build_runtime_eligibility_audit(
            index_path=args.index_path,
            skill_id=args.skill_id,
            task_class=args.task_class,
            role=args.role,
            phase=args.phase,
            surface=args.surface,
            risk_ceiling=args.risk_ceiling,
            max_results=args.max_results,
            package_roots_only=args.package_roots_only,
        )
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(audit.to_dict(include_items=args.include_items), indent=2))
    else:
        print(audit.to_human_text())
    return 0


if __name__ == "__main__":
    sys.exit(main())
