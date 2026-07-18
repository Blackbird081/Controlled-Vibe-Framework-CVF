#!/usr/bin/env python3
"""Validate the FPC-PRG parked reopen condition source inventory."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
INVENTORY_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "CVF_FPC_PRG_T1_PARKED_REOPEN_CONDITION_SOURCE_INVENTORY_2026-06-28.json"
)
LEDGER_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "CVF_FPC_SCG_T7_FOUNDATION_SYSTEM_CHAIN_ACCEPTANCE_LEDGER_2026-06-27.json"
)
DSD_BASELINE_PATH = (
    REPO_ROOT
    / "docs"
    / "baselines"
    / "CVF_GC018_FPC_DSD_T1_FOUNDATION_DOWNSTREAM_POST_PUBLIC_EXPORT_LANE_SELECTION_DECISION_2026-06-28.md"
)

REQUIRED_TOP_FIELDS = (
    "schemaVersion",
    "inventoryId",
    "status",
    "sourceAuthority",
    "inventoryBoundary",
    "requiredLaneIds",
    "laneInventories",
    "checkerCandidate",
    "claimBoundary",
)
REQUIRED_BOUNDARY_FALSE_FIELDS = (
    "enforcementChangeAuthorized",
    "runtimeWorkAuthorized",
    "providerLiveProofAuthorized",
    "publicSyncAuthorized",
    "downstreamImplementationAuthorized",
    "checkerImplementationAuthorized",
)
REQUIRED_LANE_FIELDS = (
    "laneId",
    "gateStatus",
    "conditionText",
    "owningArtifacts",
    "evidenceFields",
    "requiredConditions",
    "forbiddenUntilGatePasses",
    "reproposalRule",
)
REQUIRED_LANE_IDS = {
    "MPI-T6-runtime",
    "runtime-provider-live",
    "use-case-adapter-public",
}


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _changed_files(base: str | None, head: str | None) -> list[str]:
    paths: list[str] = []
    if base and head and base != head:
        code, out, _ = _run_git(["diff", "--name-only", f"{base}..{head}"])
        if code == 0 and out:
            paths.extend(out.splitlines())
    for args in (["diff", "--name-only", "--cached"], ["diff", "--name-only"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            paths.extend(out.splitlines())
    return sorted({path.strip().replace("\\", "/") for path in paths if path.strip()})


def _load_json(path: Path, label: str) -> tuple[dict[str, Any] | None, list[str]]:
    if not path.exists():
        return None, [f"missing {label}: {_display_path(path)}"]
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return None, [f"invalid {label} JSON: {_display_path(path)}: {exc}"]
    if not isinstance(data, dict):
        return None, [f"{label} must be a JSON object"]
    return data, []


def _display_path(path: Path) -> str:
    try:
        return path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def _resolve_artifact(path_value: str) -> Path:
    clean = path_value.split("#", 1)[0].strip().strip("`")
    path = Path(clean)
    if path.is_absolute():
        return path
    return REPO_ROOT / clean


def _artifact_exists(path_value: str) -> bool:
    return _resolve_artifact(path_value).exists()


def _parse_dsd_reopen_conditions(path: Path) -> tuple[dict[str, str], list[str]]:
    if not path.exists():
        return {}, [f"missing DSD baseline: {_display_path(path)}"]
    text = path.read_text(encoding="utf-8", errors="replace")
    marker = "## Reopen Conditions"
    start = text.find(marker)
    if start < 0:
        return {}, [f"DSD baseline missing section `{marker}`"]
    section = text[start + len(marker) :]
    next_heading = section.find("\n## ")
    if next_heading >= 0:
        section = section[:next_heading]
    conditions: dict[str, str] = {}
    for line in section.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|") or "---" in stripped:
            continue
        cells = [cell.strip().strip("`") for cell in stripped.strip("|").split("|")]
        if len(cells) < 2 or cells[0] == "Lane":
            continue
        lane_id, condition = cells[0], cells[1]
        if lane_id:
            conditions[lane_id] = condition
    if not conditions:
        return {}, ["DSD baseline Reopen Conditions table has no lane rows"]
    return conditions, []


def _ledger_gates(ledger: dict[str, Any]) -> tuple[dict[str, dict[str, Any]], list[str]]:
    gates = ledger.get("downstreamReopenGates")
    if not isinstance(gates, list):
        return {}, ["T7 ledger downstreamReopenGates must be a list"]
    by_lane: dict[str, dict[str, Any]] = {}
    for idx, gate in enumerate(gates):
        if not isinstance(gate, dict):
            return {}, [f"T7 ledger downstreamReopenGates[{idx}] must be an object"]
        lane_id = str(gate.get("laneId") or "").strip()
        if not lane_id:
            return {}, [f"T7 ledger downstreamReopenGates[{idx}] missing laneId"]
        by_lane[lane_id] = gate
    return by_lane, []


def _as_nonempty_str_list(value: Any) -> list[str] | None:
    if not isinstance(value, list) or not value:
        return None
    result = [str(item).strip() for item in value]
    if any(not item for item in result):
        return None
    return result


def validate_inventory(
    inventory_path: Path = INVENTORY_PATH,
    ledger_path: Path = LEDGER_PATH,
    dsd_baseline_path: Path = DSD_BASELINE_PATH,
) -> list[str]:
    violations: list[str] = []
    inventory, inventory_violations = _load_json(inventory_path, "PRG-T1 inventory")
    ledger, ledger_violations = _load_json(ledger_path, "T7 acceptance ledger")
    dsd_conditions, dsd_violations = _parse_dsd_reopen_conditions(dsd_baseline_path)
    violations.extend(inventory_violations)
    violations.extend(ledger_violations)
    violations.extend(dsd_violations)
    if inventory is None or ledger is None:
        return violations

    for field in REQUIRED_TOP_FIELDS:
        if field not in inventory:
            violations.append(f"inventory missing top-level field `{field}`")

    if inventory.get("status") != "ACTIVE_REFERENCE":
        violations.append("inventory status must be ACTIVE_REFERENCE")

    boundary = inventory.get("inventoryBoundary")
    if not isinstance(boundary, dict):
        violations.append("inventoryBoundary must be an object")
    else:
        for field in REQUIRED_BOUNDARY_FALSE_FIELDS:
            if boundary.get(field) is not False:
                violations.append(f"inventoryBoundary.{field} must be false")

    for path_value in _as_nonempty_str_list(inventory.get("sourceAuthority")) or []:
        if not _artifact_exists(path_value):
            violations.append(f"sourceAuthority artifact does not exist: {path_value}")

    required_lane_ids = set(_as_nonempty_str_list(inventory.get("requiredLaneIds")) or [])
    if required_lane_ids != REQUIRED_LANE_IDS:
        violations.append(
            "requiredLaneIds must match parked lane ids; "
            f"observed={sorted(required_lane_ids)} expected={sorted(REQUIRED_LANE_IDS)}"
        )

    ledger_by_lane, gate_violations = _ledger_gates(ledger)
    violations.extend(gate_violations)
    ledger_lane_ids = set(ledger_by_lane)
    if ledger_lane_ids != REQUIRED_LANE_IDS:
        violations.append(
            "T7 ledger lane ids must match parked lane ids; "
            f"observed={sorted(ledger_lane_ids)} expected={sorted(REQUIRED_LANE_IDS)}"
        )

    lanes = inventory.get("laneInventories")
    if not isinstance(lanes, list) or not lanes:
        violations.append("laneInventories must be a non-empty list")
        return violations

    inventory_by_lane: dict[str, dict[str, Any]] = {}
    for idx, lane in enumerate(lanes):
        if not isinstance(lane, dict):
            violations.append(f"laneInventories[{idx}] must be an object")
            continue
        lane_id = str(lane.get("laneId") or "").strip()
        if not lane_id:
            violations.append(f"laneInventories[{idx}] missing laneId")
            continue
        if lane_id in inventory_by_lane:
            violations.append(f"{lane_id}: duplicate lane inventory")
        inventory_by_lane[lane_id] = lane
        for field in REQUIRED_LANE_FIELDS:
            if field not in lane:
                violations.append(f"{lane_id}: missing required field `{field}`")

    if set(inventory_by_lane) != REQUIRED_LANE_IDS:
        violations.append(
            "laneInventories must contain exactly parked lane ids; "
            f"observed={sorted(inventory_by_lane)} expected={sorted(REQUIRED_LANE_IDS)}"
        )

    for lane_id, lane in sorted(inventory_by_lane.items()):
        gate = ledger_by_lane.get(lane_id)
        if gate is None:
            violations.append(f"{lane_id}: no matching T7 downstreamReopenGates record")
            continue
        if lane.get("gateStatus") != "PARKED":
            violations.append(f"{lane_id}: gateStatus must be PARKED")
        if gate.get("gateStatus") != "PARKED":
            violations.append(f"{lane_id}: T7 gateStatus must be PARKED")

        expected_condition = dsd_conditions.get(lane_id)
        if expected_condition is None:
            violations.append(f"{lane_id}: DSD baseline lacks reopen condition")
        elif str(lane.get("conditionText") or "").strip() != expected_condition:
            violations.append(f"{lane_id}: conditionText drifted from DSD-T1")

        for field in ("owningArtifacts", "evidenceFields", "requiredConditions", "forbiddenUntilGatePasses"):
            values = _as_nonempty_str_list(lane.get(field))
            if values is None:
                violations.append(f"{lane_id}: `{field}` must be a non-empty list of strings")
                continue
            if field == "owningArtifacts":
                for path_value in values:
                    if not _artifact_exists(path_value):
                        violations.append(f"{lane_id}: owning artifact does not exist: {path_value}")

        if _as_nonempty_str_list(lane.get("requiredConditions")) != _as_nonempty_str_list(
            gate.get("requiredConditions")
        ):
            violations.append(f"{lane_id}: requiredConditions drifted from T7 ledger")
        if _as_nonempty_str_list(lane.get("forbiddenUntilGatePasses")) != _as_nonempty_str_list(
            gate.get("forbiddenUntilGatePasses")
        ):
            violations.append(f"{lane_id}: forbiddenUntilGatePasses drifted from T7 ledger")

        reproposal_rule = str(lane.get("reproposalRule") or "")
        if "source-backed" not in reproposal_rule and "source-backed" not in reproposal_rule.lower():
            violations.append(f"{lane_id}: reproposalRule must require source-backed evidence")

    checker_candidate = inventory.get("checkerCandidate")
    if isinstance(checker_candidate, dict):
        if checker_candidate.get("nextTranche") != "FPC-PRG-T2":
            violations.append("checkerCandidate.nextTranche must be FPC-PRG-T2")
    else:
        violations.append("checkerCandidate must be an object")

    return violations


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate FPC-PRG parked reopen inventory")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    changed = _changed_files(args.base, args.head)
    violations = validate_inventory()

    print("=== CVF FPC Parked Reopen Inventory Gate ===")
    print(f"Inventory: {INVENTORY_PATH.relative_to(REPO_ROOT)}")
    if args.base or args.head:
        print(f"Range: {args.base or '<auto>'}..{args.head or '<auto>'}")
    print(f"Changed paths observed: {len(changed)}")
    print(f"Violations: {len(violations)}")

    if violations:
        print("\nViolations:")
        for violation in violations:
            print(f"  - {violation}")
        if args.enforce:
            print("\nVIOLATION - FPC parked reopen inventory is not valid.")
            return 1
        print("\nADVISORY - FPC parked reopen inventory has issues.")
        return 0

    print("\nCOMPLIANT - FPC parked reopen inventory is valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
