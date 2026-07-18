#!/usr/bin/env python3
"""Read-only ASSF external-agent metadata readout.

This helper reads the generated ASSF skill index and emits only the metadata
field families authorized by the external-agent readout boundary contract. It
does not implement CLI/MCP adapter behavior, open package instruction bodies,
mutate registry/index/resolver files, or call any provider.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
INDEX_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "agent_system_skills"
    / "generated"
    / "skill-index.json"
)

CLAIM_BOUNDARY = (
    "This packet is a read-only ASSF metadata readout. It does not implement "
    "CLI/MCP adapter behavior, activate packages, execute package instruction "
    "bodies, mutate ASSF registry or generated-index sources, mutate resolver "
    "source, call providers, public-sync, push, or grant external-agent "
    "authority."
)
ADAPTER_IMPLEMENTATION = "NOT_IMPLEMENTED"

IDENTITY_FIELDS = ("skillId", "name", "version", "canonicalRoot")
LIFECYCLE_FIELDS = (
    "candidateState",
    "uatState",
    "certificationState",
    "reviewArtifacts",
)
AUTHORITY_FIELDS = (
    "authorityCeiling",
    "riskCeiling",
    "riskProfile",
    "capabilityBoundary",
)
ADAPTER_POSTURE_FIELDS = (
    "externalCliMcpDisposition",
    "adapterContract",
    "adapterEvidence",
    "externalMutationBoundary",
)
PROVENANCE_FIELDS = ("sourceArtifacts", "originLane", "license")

ALLOWED_SKILL_FIELDS = (
    IDENTITY_FIELDS
    + LIFECYCLE_FIELDS
    + AUTHORITY_FIELDS
    + ADAPTER_POSTURE_FIELDS
    + PROVENANCE_FIELDS
)


@dataclass(frozen=True)
class MetadataReadout:
    """External-agent-facing metadata readout packet."""

    items: tuple[dict[str, Any], ...]
    total_candidates: int
    truncated: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "adapterImplementation": ADAPTER_IMPLEMENTATION,
            "allowedFieldFamilies": {
                "identity": list(IDENTITY_FIELDS),
                "lifecycleDisplay": list(LIFECYCLE_FIELDS),
                "authorityDisplay": list(AUTHORITY_FIELDS),
                "adapterPosture": list(ADAPTER_POSTURE_FIELDS),
                "provenance": list(PROVENANCE_FIELDS),
            },
            "claimBoundary": CLAIM_BOUNDARY,
            "items": list(self.items),
            "sourcePath": INDEX_PATH.relative_to(REPO_ROOT).as_posix(),
            "totalCandidates": self.total_candidates,
            "truncated": self.truncated,
        }

    def to_human_text(self) -> str:
        lines = [
            "ASSF external-agent metadata readout",
            f"Adapter implementation: {ADAPTER_IMPLEMENTATION}",
            f"Total candidates: {self.total_candidates}",
            f"Returned items: {len(self.items)}",
            f"Truncated: {str(self.truncated).lower()}",
            f"Claim boundary: {CLAIM_BOUNDARY}",
        ]
        if not self.items:
            lines.append("No matching metadata records.")
            return "\n".join(lines)
        lines.append("Items:")
        for item in self.items:
            lines.append(
                "- "
                f"{item.get('skillId', '<missing skillId>')} | "
                f"{item.get('name', '')} | "
                f"externalCliMcpDisposition="
                f"{item.get('externalCliMcpDisposition', '')}"
            )
        return "\n".join(lines)


def _load_index(index_path: Path = INDEX_PATH) -> dict[str, Any]:
    raw = json.loads(index_path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("ASSF generated index must be a JSON object")
    skills = raw.get("skills", [])
    if not isinstance(skills, list):
        raise ValueError("ASSF generated index `skills` must be a list")
    return raw


def _allowlisted_item(entry: dict[str, Any]) -> dict[str, Any]:
    return {field: entry[field] for field in ALLOWED_SKILL_FIELDS if field in entry}


def build_metadata_readout(
    *,
    index_path: Path = INDEX_PATH,
    skill_id: str | None = None,
    max_results: int = 20,
) -> MetadataReadout:
    """Build a bounded, allowlisted readout from the generated ASSF index."""
    if max_results <= 0:
        raise ValueError("max_results must be a positive integer")

    raw = _load_index(index_path)
    skills = [item for item in raw.get("skills", []) if isinstance(item, dict)]
    if skill_id is not None:
        skills = [item for item in skills if str(item.get("skillId", "")) == skill_id]
    skills.sort(key=lambda item: str(item.get("skillId", "")))

    total_candidates = len(skills)
    bounded = skills[:max_results]
    return MetadataReadout(
        items=tuple(_allowlisted_item(item) for item in bounded),
        total_candidates=total_candidates,
        truncated=total_candidates > max_results,
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Emit a read-only ASSF external-agent metadata readout from the "
            "generated skill index. This is not a CLI/MCP adapter."
        )
    )
    parser.add_argument("--index-path", type=Path, default=INDEX_PATH)
    parser.add_argument("--skill-id", default=None)
    parser.add_argument("--max-results", type=int, default=20)
    parser.add_argument("--json", action="store_true", help="Emit JSON output")
    args = parser.parse_args(argv)

    try:
        readout = build_metadata_readout(
            index_path=args.index_path,
            skill_id=args.skill_id,
            max_results=args.max_results,
        )
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(readout.to_dict(), ensure_ascii=False, indent=2))
    else:
        print(readout.to_human_text())
    return 0


if __name__ == "__main__":
    sys.exit(main())
