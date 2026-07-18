#!/usr/bin/env python3
"""ASSF package lifecycle source-state decision helper.

This helper summarizes ASCP-T1 through ASCP-T3 evidence and returns the ASCP-T4
decision for whether package lifecycle source records should be moved to
``ACTIVE``. It is read-only and intentionally emits no source mutation plan.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    from run_assf_active_resolver import (
        INDEX_PATH,
        READY_DECISION,
        REPO_ROOT,
        TRUTH_INDEX_PATH,
        build_active_resolver_packet,
    )
    from run_assf_cli_mcp_adapter_projection import (
        EXTERNAL_BODY_READ_DISPOSITION,
        EXTERNAL_OUTPUT_USE_DISPOSITION,
        build_cli_mcp_adapter_projection,
    )
    from run_assf_runtime_package_loader import build_runtime_package_packet
except ModuleNotFoundError:
    from governance.compat.run_assf_active_resolver import (
        INDEX_PATH,
        READY_DECISION,
        REPO_ROOT,
        TRUTH_INDEX_PATH,
        build_active_resolver_packet,
    )
    from governance.compat.run_assf_cli_mcp_adapter_projection import (
        EXTERNAL_BODY_READ_DISPOSITION,
        EXTERNAL_OUTPUT_USE_DISPOSITION,
        build_cli_mcp_adapter_projection,
    )
    from governance.compat.run_assf_runtime_package_loader import (
        build_runtime_package_packet,
    )


DECISION_HOLD_NO_ACTIVE_SOURCE_MUTATION = "HOLD_NO_ACTIVE_SOURCE_MUTATION"
SOURCE_MUTATION_DISPOSITION = "NO_SOURCE_MUTATIONS_AUTHORIZED"

CLAIM_BOUNDARY = (
    "This packet is an ASCP-T4 package lifecycle source-state decision "
    "receipt. It summarizes runtime-loader eligibility, active-resolver "
    "readiness, and CLI/MCP projection posture. It does not mutate ASSF "
    "registry entries, generated indexes, truth packets, or package roots; it "
    "does not move any package to ACTIVE, open package instruction bodies, "
    "grant authority, call providers, implement package execution, commit, "
    "push, public-sync, or bypass governed work-order scope."
)

DECISION_REASONS = (
    "ACTIVATION_READY_IS_BODY_READ_GATE_ONLY",
    "RUNTIME_ELIGIBLE_IS_NOT_LIFECYCLE_ACTIVE",
    "EXTERNAL_PACKAGE_EXECUTION_ADAPTER_NOT_IMPLEMENTED",
    "ACTIVE_SOURCE_MUTATION_REQUIRES_SEPARATE_PROMOTION_AUTHORITY",
)


@dataclass(frozen=True)
class PackageLifecycleDecision:
    """Read-only decision packet for package lifecycle source state."""

    total_candidates: int
    runtime_eligible_skill_ids: tuple[str, ...]
    activation_ready_skill_ids: tuple[str, ...]
    external_projection_ready_skill_ids: tuple[str, ...]
    active_source_skill_ids: tuple[str, ...]
    truncated: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "activationReadySkillIds": list(self.activation_ready_skill_ids),
            "activeSourceSkillIds": list(self.active_source_skill_ids),
            "claimBoundary": CLAIM_BOUNDARY,
            "decisionReasons": list(DECISION_REASONS),
            "externalBodyReadDisposition": EXTERNAL_BODY_READ_DISPOSITION,
            "externalOutputUseDisposition": EXTERNAL_OUTPUT_USE_DISPOSITION,
            "externalProjectionReadySkillIds": list(
                self.external_projection_ready_skill_ids
            ),
            "lifecycleSourceMutationDecision": (
                DECISION_HOLD_NO_ACTIVE_SOURCE_MUTATION
            ),
            "lifecycleSourceMutations": [],
            "recommendedSourceMutations": [],
            "runtimeEligibleSkillIds": list(self.runtime_eligible_skill_ids),
            "sourceMutationDisposition": SOURCE_MUTATION_DISPOSITION,
            "sourcePaths": {
                "activeResolver": "governance/compat/run_assf_active_resolver.py",
                "cliMcpProjection": (
                    "governance/compat/run_assf_cli_mcp_adapter_projection.py"
                ),
                "runtimePackageLoader": (
                    "governance/compat/run_assf_runtime_package_loader.py"
                ),
                "skillIndex": INDEX_PATH.relative_to(REPO_ROOT).as_posix(),
                "truthIndex": TRUTH_INDEX_PATH.relative_to(REPO_ROOT).as_posix(),
            },
            "totalCandidates": self.total_candidates,
            "truncated": self.truncated,
        }

    def to_human_text(self) -> str:
        lines = [
            "ASSF package lifecycle decision",
            f"Decision: {DECISION_HOLD_NO_ACTIVE_SOURCE_MUTATION}",
            f"Source mutation disposition: {SOURCE_MUTATION_DISPOSITION}",
            f"Total candidates: {self.total_candidates}",
            f"Runtime eligible: {len(self.runtime_eligible_skill_ids)}",
            f"Activation ready: {len(self.activation_ready_skill_ids)}",
            f"External projection ready: {len(self.external_projection_ready_skill_ids)}",
            f"Currently ACTIVE source records: {len(self.active_source_skill_ids)}",
            f"Truncated: {str(self.truncated).lower()}",
            f"Claim boundary: {CLAIM_BOUNDARY}",
        ]
        return "\n".join(lines)


def _skill_id_from_item(item: Any) -> str:
    raw = item.to_dict() if hasattr(item, "to_dict") else item
    if not isinstance(raw, dict):
        return ""
    return str(raw.get("skillId", "")).strip()


def _status_from_item(item: Any, field: str) -> str:
    raw = item.to_dict() if hasattr(item, "to_dict") else item
    if not isinstance(raw, dict):
        return ""
    return str(raw.get(field, "")).strip().upper()


def build_package_lifecycle_decision(
    *,
    index_path: Path = INDEX_PATH,
    truth_index_path: Path = TRUTH_INDEX_PATH,
    repo_root: Path = REPO_ROOT,
    max_results: int = 100000,
) -> PackageLifecycleDecision:
    """Build the ASCP-T4 lifecycle source-state decision packet."""
    if max_results <= 0:
        raise ValueError("max_results must be a positive integer")

    runtime_packet = build_runtime_package_packet(
        index_path=index_path,
        repo_root=repo_root,
        max_results=max_results,
        include_instruction_bodies=False,
    )
    active_packet = build_active_resolver_packet(
        index_path=index_path,
        truth_index_path=truth_index_path,
        repo_root=repo_root,
        max_results=max_results,
    )
    projection_packet = build_cli_mcp_adapter_projection(
        index_path=index_path,
        truth_index_path=truth_index_path,
        repo_root=repo_root,
        max_results=max_results,
    )

    runtime_eligible = tuple(
        _skill_id_from_item(item)
        for item in runtime_packet.items
        if item.runtime_eligible and _skill_id_from_item(item)
    )
    activation_ready = tuple(
        _skill_id_from_item(item)
        for item in active_packet.items
        if item.activation_decision == READY_DECISION and _skill_id_from_item(item)
    )
    external_projection_ready = tuple(
        str(item.get("skillId", "")).strip()
        for item in projection_packet.items
        if item.get("activationReady") and str(item.get("skillId", "")).strip()
    )
    active_source = tuple(
        _skill_id_from_item(item)
        for item in runtime_packet.items
        if (
            _status_from_item(item, "status") == "ACTIVE"
            or _status_from_item(item, "candidateState") == "ACTIVE"
        )
        and _skill_id_from_item(item)
    )

    return PackageLifecycleDecision(
        total_candidates=runtime_packet.total_candidates,
        runtime_eligible_skill_ids=runtime_eligible,
        activation_ready_skill_ids=activation_ready,
        external_projection_ready_skill_ids=external_projection_ready,
        active_source_skill_ids=active_source,
        truncated=(
            runtime_packet.truncated
            or active_packet.truncated
            or projection_packet.truncated
        ),
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Emit the read-only ASCP-T4 package lifecycle source-state "
            "decision. This does not mutate ASSF sources or move packages to "
            "ACTIVE."
        )
    )
    parser.add_argument("--index-path", type=Path, default=INDEX_PATH)
    parser.add_argument("--truth-index-path", type=Path, default=TRUTH_INDEX_PATH)
    parser.add_argument("--repo-root", type=Path, default=REPO_ROOT)
    parser.add_argument("--max-results", type=int, default=100000)
    parser.add_argument("--json", action="store_true", help="Emit JSON output")
    args = parser.parse_args(argv)

    try:
        packet = build_package_lifecycle_decision(
            index_path=args.index_path,
            truth_index_path=args.truth_index_path,
            repo_root=args.repo_root,
            max_results=args.max_results,
        )
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(packet.to_dict(), ensure_ascii=False, indent=2))
    else:
        print(packet.to_human_text())
    return 0


if __name__ == "__main__":
    sys.exit(main())
