#!/usr/bin/env python3
"""Bounded ASSF CLI/MCP adapter projection.

This helper projects ASSF metadata and activation-policy state for an external
CLI/MCP consumer without implementing a provider adapter, opening package
instruction bodies, or granting package-use authority.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    from run_assf_activation_policy_resolver import (
        CONSUMER_INTERNAL,
        INDEX_PATH,
        REPO_ROOT,
        TRUTH_INDEX_PATH,
        build_activation_policy_packet,
    )
    from run_assf_external_agent_metadata_readout import (
        ADAPTER_POSTURE_FIELDS,
        ALLOWED_SKILL_FIELDS,
        AUTHORITY_FIELDS,
        IDENTITY_FIELDS,
        LIFECYCLE_FIELDS,
        PROVENANCE_FIELDS,
        build_metadata_readout,
    )
except ModuleNotFoundError:
    from governance.compat.run_assf_activation_policy_resolver import (
        CONSUMER_INTERNAL,
        INDEX_PATH,
        REPO_ROOT,
        TRUTH_INDEX_PATH,
        build_activation_policy_packet,
    )
    from governance.compat.run_assf_external_agent_metadata_readout import (
        ADAPTER_POSTURE_FIELDS,
        ALLOWED_SKILL_FIELDS,
        AUTHORITY_FIELDS,
        IDENTITY_FIELDS,
        LIFECYCLE_FIELDS,
        PROVENANCE_FIELDS,
        build_metadata_readout,
    )


CONSUMER_EXTERNAL = "EXTERNAL_AGENT_CLI_MCP"
PROJECTION_IMPLEMENTATION = "IMPLEMENTED_BOUNDED_PROJECTION"
PROJECTION_MODE = "METADATA_POLICY_READOUT_ONLY"
EXTERNAL_BODY_READ_DISPOSITION = "DENIED_EXTERNAL_BODY_READ_NOT_IMPLEMENTED"
EXTERNAL_OUTPUT_USE_DISPOSITION = "DENIED_EXTERNAL_OUTPUT_USE_NOT_IMPLEMENTED"

ACTIVATION_PROJECTION_FIELDS = (
    "activationPolicyState",
    "activationReady",
    "externalBodyReadDisposition",
    "externalOutputUseDisposition",
    "policyReasons",
    "projectionBoundary",
)

CLAIM_BOUNDARY = (
    "This packet is a bounded ASSF CLI/MCP adapter projection for external "
    "readout only. It projects allowlisted package metadata and activation "
    "policy state. It does not implement MCP server behavior, call providers, "
    "open package instruction bodies, emit or consume skill usage receipts, "
    "grant external-agent authority, mutate ASSF registry/index/truth sources, "
    "activate package lifecycle state, commit, push, or public-sync."
)

ITEM_PROJECTION_BOUNDARY = (
    "Metadata and policy state are visible for planning only; external body "
    "reads and output use remain denied until a separate adapter/runtime "
    "tranche implements receipt-backed execution."
)


@dataclass(frozen=True)
class CliMcpAdapterProjection:
    """External-facing projection packet."""

    items: tuple[dict[str, Any], ...]
    total_candidates: int
    truncated: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "adapterProjectionImplementation": PROJECTION_IMPLEMENTATION,
            "allowedFieldFamilies": {
                "identity": list(IDENTITY_FIELDS),
                "lifecycleDisplay": list(LIFECYCLE_FIELDS),
                "authorityDisplay": list(AUTHORITY_FIELDS),
                "adapterPosture": list(ADAPTER_POSTURE_FIELDS),
                "provenance": list(PROVENANCE_FIELDS),
                "activationPolicyProjection": list(ACTIVATION_PROJECTION_FIELDS),
            },
            "claimBoundary": CLAIM_BOUNDARY,
            "consumer": CONSUMER_EXTERNAL,
            "items": list(self.items),
            "projectionMode": PROJECTION_MODE,
            "sourcePaths": {
                "activationPolicyResolver": (
                    "governance/compat/run_assf_activation_policy_resolver.py"
                ),
                "externalMetadataReadout": (
                    "governance/compat/run_assf_external_agent_metadata_readout.py"
                ),
                "skillIndex": INDEX_PATH.relative_to(REPO_ROOT).as_posix(),
                "truthIndex": TRUTH_INDEX_PATH.relative_to(REPO_ROOT).as_posix(),
            },
            "totalCandidates": self.total_candidates,
            "truncated": self.truncated,
        }

    def to_human_text(self) -> str:
        lines = [
            "ASSF CLI/MCP adapter projection",
            f"Consumer: {CONSUMER_EXTERNAL}",
            f"Projection implementation: {PROJECTION_IMPLEMENTATION}",
            f"Projection mode: {PROJECTION_MODE}",
            f"Total candidates: {self.total_candidates}",
            f"Returned items: {len(self.items)}",
            f"Truncated: {str(self.truncated).lower()}",
            f"Claim boundary: {CLAIM_BOUNDARY}",
        ]
        if not self.items:
            lines.append("No matching projected records.")
            return "\n".join(lines)
        lines.append("Items:")
        for item in self.items:
            lines.append(
                "- "
                f"{item.get('skillId', '<missing skillId>')} | "
                f"policy={item.get('activationPolicyState', '')} | "
                f"externalBodyRead={item.get('externalBodyReadDisposition', '')}"
            )
        return "\n".join(lines)


def _project_policy_item(
    item: Any,
    *,
    metadata_by_skill_id: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    raw = item.to_dict()
    skill_id = str(raw.get("skillId", "")).strip()
    metadata = metadata_by_skill_id.get(skill_id, raw)
    projected = {field: metadata[field] for field in ALLOWED_SKILL_FIELDS if field in metadata}
    projected["activationPolicyState"] = raw.get("activationPolicyState")
    projected["activationReady"] = bool(raw.get("activationReady"))
    projected["externalBodyReadDisposition"] = EXTERNAL_BODY_READ_DISPOSITION
    projected["externalOutputUseDisposition"] = EXTERNAL_OUTPUT_USE_DISPOSITION
    projected["policyReasons"] = list(raw.get("policyReasons", []))
    projected["projectionBoundary"] = ITEM_PROJECTION_BOUNDARY
    return projected


def build_cli_mcp_adapter_projection(
    *,
    index_path: Path = INDEX_PATH,
    truth_index_path: Path = TRUTH_INDEX_PATH,
    repo_root: Path = REPO_ROOT,
    skill_id: str | None = None,
    task_class: str | None = None,
    role: str | None = None,
    phase: str | None = None,
    surface: str | None = None,
    risk_ceiling: str | None = None,
    max_results: int = 20,
) -> CliMcpAdapterProjection:
    """Build an external readout projection without package execution."""
    if max_results <= 0:
        raise ValueError("max_results must be a positive integer")

    metadata_readout = build_metadata_readout(
        index_path=index_path,
        skill_id=None,
        max_results=100000,
    )
    metadata_by_skill_id = {
        str(item.get("skillId", "")).strip(): item
        for item in metadata_readout.items
        if str(item.get("skillId", "")).strip()
    }
    policy_packet = build_activation_policy_packet(
        index_path=index_path,
        truth_index_path=truth_index_path,
        repo_root=repo_root,
        consumer=CONSUMER_INTERNAL,
        skill_id=skill_id,
        task_class=task_class,
        role=role,
        phase=phase,
        surface=surface,
        risk_ceiling=risk_ceiling,
        max_results=max_results,
        body_read_requested=False,
        output_consumed=False,
        usage_receipts=(),
    )
    return CliMcpAdapterProjection(
        items=tuple(
            _project_policy_item(item, metadata_by_skill_id=metadata_by_skill_id)
            for item in policy_packet.items
        ),
        total_candidates=policy_packet.total_candidates,
        truncated=policy_packet.truncated,
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Emit a bounded ASSF CLI/MCP adapter projection. This is an "
            "external metadata/policy readout only, not package execution."
        )
    )
    parser.add_argument("--index-path", type=Path, default=INDEX_PATH)
    parser.add_argument("--truth-index-path", type=Path, default=TRUTH_INDEX_PATH)
    parser.add_argument("--repo-root", type=Path, default=REPO_ROOT)
    parser.add_argument("--skill-id", default=None)
    parser.add_argument("--task-class", default=None)
    parser.add_argument("--role", default=None)
    parser.add_argument("--phase", default=None)
    parser.add_argument("--surface", default=None)
    parser.add_argument("--risk-ceiling", default=None)
    parser.add_argument("--max-results", type=int, default=20)
    parser.add_argument("--json", action="store_true", help="Emit JSON output")
    args = parser.parse_args(argv)

    try:
        projection = build_cli_mcp_adapter_projection(
            index_path=args.index_path,
            truth_index_path=args.truth_index_path,
            repo_root=args.repo_root,
            skill_id=args.skill_id,
            task_class=args.task_class,
            role=args.role,
            phase=args.phase,
            surface=args.surface,
            risk_ceiling=args.risk_ceiling,
            max_results=args.max_results,
        )
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(projection.to_dict(), ensure_ascii=False, indent=2))
    else:
        print(projection.to_human_text())
    return 0


if __name__ == "__main__":
    sys.exit(main())
