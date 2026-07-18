#!/usr/bin/env python3
"""Check ASSF package candidate anatomy for registry source entries.

This checker is read-only. It verifies that every ASSF registry source entry
keeps the compact field-family shape defined by the ASSF package contract, so
new CANDIDATE entries cannot silently omit lifecycle, risk, loader, or external
disposition metadata.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

_COMPAT_DIR = Path(__file__).resolve().parent
if str(_COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(_COMPAT_DIR))

from generate_assf_skill_index import (  # noqa: E402
    ENTRIES_DIR,
    INDEX_PATH,
    REPO_ROOT,
    load_source_entries,
    validate_index_matches_sources,
)


REQUIRED_FIELDS: tuple[str, ...] = (
    "skillId",
    "name",
    "version",
    "owner",
    "status",
    "canonicalRoot",
    "originLane",
    "sourceArtifacts",
    "legacyRows",
    "license",
    "reviewArtifacts",
    "purpose",
    "triggerPatterns",
    "taskClasses",
    "useWhen",
    "doNotUseWhen",
    "riskTriggers",
    "roles",
    "phases",
    "surfaces",
    "riskCeiling",
    "contextProfile",
    "inputs",
    "outputs",
    "executionConstraints",
    "acceptanceEvidence",
    "riskProfile",
    "authorityCeiling",
    "sideEffects",
    "permissions",
    "rollback",
    "safeStop",
    "candidateState",
    "approvalState",
    "uatState",
    "certificationState",
    "deprecation",
    "successor",
    "retirement",
    "dependencies",
    "conflicts",
    "compositionOrder",
    "capabilityBoundary",
    "internalAgentDisposition",
    "resolverBehavior",
    "loaderBoundary",
    "externalCliMcpDisposition",
    "adapterContract",
    "adapterEvidence",
    "externalMutationBoundary",
    "platformCompatibility",
    "shellAssumptions",
    "osConstraints",
)

LIST_FIELDS: frozenset[str] = frozenset(
    {
        "sourceArtifacts",
        "legacyRows",
        "reviewArtifacts",
        "triggerPatterns",
        "taskClasses",
        "riskTriggers",
        "roles",
        "phases",
        "surfaces",
        "inputs",
        "outputs",
        "dependencies",
        "conflicts",
    }
)

REQUIRED_NONEMPTY_LIST_FIELDS: frozenset[str] = frozenset(
    {
        "sourceArtifacts",
        "triggerPatterns",
        "taskClasses",
        "roles",
        "phases",
        "surfaces",
        "inputs",
        "outputs",
    }
)

TEXT_FIELDS: frozenset[str] = frozenset(
    field for field in REQUIRED_FIELDS if field not in LIST_FIELDS | {"compositionOrder"}
)

ALLOWED_STATUS: frozenset[str] = frozenset(
    {"CANDIDATE", "PROPOSED", "APPROVED", "ACTIVE", "DEPRECATED", "RETIRED", "REJECTED"}
)
ALLOWED_CANDIDATE_STATE: frozenset[str] = frozenset(
    {"CANDIDATE", "PROPOSED", "APPROVED", "ACTIVE", "DEPRECATED", "RETIRED", "REJECTED"}
)
ALLOWED_APPROVAL_STATE: frozenset[str] = frozenset(
    {"AWAITING_REVIEW", "APPROVED", "REJECTED", "N/A_WITH_REASON"}
)
ALLOWED_UAT_STATE: frozenset[str] = frozenset(
    {"NOT_STARTED", "IN_PROGRESS", "PASSED", "FAILED", "N/A_WITH_REASON"}
)
ALLOWED_CERTIFICATION_STATE: frozenset[str] = frozenset(
    {"NOT_STARTED", "CERTIFIED", "REJECTED", "EXPIRED", "N/A_WITH_REASON"}
)
ALLOWED_EXTERNAL_DISPOSITION: frozenset[str] = frozenset(
    {"CONTRACT_ONLY", "IMPLEMENTED", "DEFERRED_WITH_REASON", "N/A_WITH_REASON", "PROHIBITED"}
)
ALLOWED_INTERNAL_DISPOSITION: frozenset[str] = frozenset(
    {"CONTRACT_ONLY", "IMPLEMENTED", "DEFERRED_WITH_REASON", "N/A_WITH_REASON", "CANDIDATE"}
)
ALLOWED_RISK: frozenset[str] = frozenset({"R0", "R1", "R2", "R3"})


def _as_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _upper(value: Any) -> str:
    return _as_text(value).upper()


def _entry_id(entry: dict[str, Any]) -> str:
    return _as_text(entry.get("skillId")) or "<missing skillId>"


def _is_na_with_reason(value: Any) -> bool:
    return _as_text(value).lower().startswith("n/a with reason")


def _check_list_field(skill_id: str, entry: dict[str, Any], field: str) -> list[str]:
    value = entry.get(field)
    if not isinstance(value, list):
        return [f"{skill_id}: {field} must be a list"]
    if field in REQUIRED_NONEMPTY_LIST_FIELDS and not value:
        return [f"{skill_id}: {field} must not be empty"]
    return []


def _check_risk_triggers(skill_id: str, value: Any) -> list[str]:
    if not isinstance(value, list):
        return [f"{skill_id}: riskTriggers must be a list"]
    violations: list[str] = []
    for index, item in enumerate(value):
        if isinstance(item, str):
            if not item.strip():
                violations.append(f"{skill_id}: riskTriggers[{index}] is empty")
            continue
        if isinstance(item, dict):
            if not any(_as_text(item.get(key)) for key in ("trigger", "pattern", "condition")):
                violations.append(
                    f"{skill_id}: riskTriggers[{index}] must name trigger, pattern, or condition"
                )
            if not any(_as_text(item.get(key)) for key in ("escalatedRisk", "escalated_risk", "requiredApproval", "required_approval")):
                violations.append(
                    f"{skill_id}: riskTriggers[{index}] must name escalated risk or required approval"
                )
            continue
        violations.append(
            f"{skill_id}: riskTriggers[{index}] must be a string or object"
        )
    return violations


def _check_entry(entry: dict[str, Any]) -> list[str]:
    skill_id = _entry_id(entry)
    violations: list[str] = []

    for field in REQUIRED_FIELDS:
        if field not in entry:
            violations.append(f"{skill_id}: missing required field {field}")

    for field in LIST_FIELDS:
        if field in entry:
            violations.extend(_check_list_field(skill_id, entry, field))

    if "riskTriggers" in entry:
        violations.extend(_check_risk_triggers(skill_id, entry.get("riskTriggers")))

    for field in TEXT_FIELDS:
        if field in entry and not _as_text(entry.get(field)):
            violations.append(f"{skill_id}: {field} must not be empty")

    if "registryOrder" in entry and not isinstance(entry.get("registryOrder"), int):
        violations.append(f"{skill_id}: registryOrder must be an integer")
    if "compositionOrder" in entry and not isinstance(entry.get("compositionOrder"), int):
        violations.append(f"{skill_id}: compositionOrder must be an integer")

    status = _upper(entry.get("status"))
    if status and status not in ALLOWED_STATUS:
        violations.append(f"{skill_id}: status has unsupported value {status}")
    candidate_state = _upper(entry.get("candidateState"))
    if candidate_state and candidate_state not in ALLOWED_CANDIDATE_STATE:
        violations.append(
            f"{skill_id}: candidateState has unsupported value {candidate_state}"
        )
    if status == "CANDIDATE" and candidate_state != "CANDIDATE":
        violations.append(
            f"{skill_id}: status CANDIDATE requires candidateState CANDIDATE"
        )

    approval_state = _upper(entry.get("approvalState"))
    if approval_state and approval_state not in ALLOWED_APPROVAL_STATE:
        violations.append(
            f"{skill_id}: approvalState has unsupported value {approval_state}"
        )
    uat_state = _upper(entry.get("uatState"))
    if uat_state and uat_state not in ALLOWED_UAT_STATE:
        violations.append(f"{skill_id}: uatState has unsupported value {uat_state}")
    certification_state = _upper(entry.get("certificationState"))
    if certification_state and certification_state not in ALLOWED_CERTIFICATION_STATE:
        violations.append(
            f"{skill_id}: certificationState has unsupported value {certification_state}"
        )

    risk_profile = _upper(entry.get("riskProfile"))
    risk_ceiling = _upper(entry.get("riskCeiling"))
    if risk_profile and risk_profile not in ALLOWED_RISK:
        violations.append(f"{skill_id}: riskProfile must be one of R0, R1, R2, R3")
    if risk_ceiling and risk_ceiling not in ALLOWED_RISK:
        violations.append(f"{skill_id}: riskCeiling must be one of R0, R1, R2, R3")

    internal = _upper(entry.get("internalAgentDisposition"))
    if internal and internal not in ALLOWED_INTERNAL_DISPOSITION:
        violations.append(
            f"{skill_id}: internalAgentDisposition has unsupported value {internal}"
        )
    external = _upper(entry.get("externalCliMcpDisposition"))
    if external and external not in ALLOWED_EXTERNAL_DISPOSITION:
        violations.append(
            f"{skill_id}: externalCliMcpDisposition has unsupported value {external}"
        )

    resolver_behavior = _as_text(entry.get("resolverBehavior")).lower()
    if resolver_behavior and "metadata-only" not in resolver_behavior:
        violations.append(f"{skill_id}: resolverBehavior must say metadata-only")
    loader_boundary = _as_text(entry.get("loaderBoundary")).lower()
    if loader_boundary and "never grants" not in loader_boundary:
        violations.append(f"{skill_id}: loaderBoundary must state never grants")

    if external == "IMPLEMENTED":
        if _is_na_with_reason(entry.get("adapterContract")):
            violations.append(
                f"{skill_id}: IMPLEMENTED external adapter requires adapterContract"
            )
        if _is_na_with_reason(entry.get("adapterEvidence")):
            violations.append(
                f"{skill_id}: IMPLEMENTED external adapter requires adapterEvidence"
            )

    return violations


def check(
    index_path: Path = INDEX_PATH,
    entries_dir: Path = ENTRIES_DIR,
) -> list[str]:
    """Return package-candidate anatomy violations."""
    violations: list[str] = []
    violations.extend(validate_index_matches_sources(index_path, entries_dir))

    try:
        entries = load_source_entries(entries_dir)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return [f"ASSF registry source load failed: {exc}"]

    seen_ids: set[str] = set()
    seen_orders: set[int] = set()
    for entry in entries:
        skill_id = _entry_id(entry)
        if skill_id in seen_ids:
            violations.append(f"{skill_id}: duplicate skillId in ASSF registry")
        seen_ids.add(skill_id)

        order = entry.get("registryOrder")
        if isinstance(order, int):
            if order in seen_orders:
                violations.append(f"{skill_id}: duplicate registryOrder {order}")
            seen_orders.add(order)

        violations.extend(_check_entry(entry))

    return violations


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check ASSF package candidate anatomy for registry entries"
    )
    parser.add_argument("--index-path", type=Path, default=INDEX_PATH)
    parser.add_argument("--entries-dir", type=Path, default=ENTRIES_DIR)
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Return nonzero on violations. Kept for hook consistency.",
    )
    args = parser.parse_args()

    print("=== CVF ASSF Package Candidate Anatomy Check ===")
    violations = check(index_path=args.index_path, entries_dir=args.entries_dir)
    if violations:
        print("ANATOMY VIOLATIONS:")
        for violation in violations:
            print(f"  - {violation}")
        print("\nFAIL - ASSF package candidate anatomy is incomplete.")
        return 1

    print("PASS - ASSF package candidate anatomy is complete and bounded.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
