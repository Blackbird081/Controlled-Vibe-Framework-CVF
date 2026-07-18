#!/usr/bin/env python3
"""Validate the FPC-SCG-T7 foundation system-chain acceptance ledger."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
LEDGER_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "CVF_FPC_SCG_T7_FOUNDATION_SYSTEM_CHAIN_ACCEPTANCE_LEDGER_2026-06-27.json"
)
REGISTRY_PATH = REPO_ROOT / "docs" / "reference" / "CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json"
MANIFEST_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "CVF_FPC_T3_C03_INTERLOCK_EXPECTED_CHAIN_MANIFEST_2026-06-27.json"
)

REQUIRED_TOP_FIELDS = (
    "schemaVersion",
    "ledgerId",
    "status",
    "acceptedClosureChain",
    "expectedRegistryIds",
    "downstreamReopenGates",
    "acceptanceVerdict",
    "claimBoundary",
)
REQUIRED_CLOSURE_FIELDS = (
    "trancheId",
    "gapId",
    "acceptanceLevel",
    "materialCommit",
    "closureArtifact",
    "evidenceSurface",
    "reopenCondition",
)
REQUIRED_GATE_FIELDS = (
    "laneId",
    "gateStatus",
    "requiredConditions",
    "forbiddenUntilGatePasses",
)
REQUIRED_TRANCHE_IDS = {
    "FPC-SCG-T0",
    "FPC-SCG-T1",
    "FPC-SCG-T2",
    "FPC-SCG-T3",
    "FPC-SCG-T4",
    "FPC-SCG-T5",
    "FPC-SCG-T6",
}
REQUIRED_DOWNSTREAM_LANES = {
    "runtime-provider-live",
    "use-case-adapter-public",
    "MPI-T6-runtime",
}
EXPECTED_MATERIAL_COMMITS = {
    "FPC-SCG-T0": "be253923",
    "FPC-SCG-T1": "75fcad20",
    "FPC-SCG-T2": "be253923",
    "FPC-SCG-T3": "be253923",
    "FPC-SCG-T4": "be253923",
    "FPC-SCG-T5": "be253923",
    "FPC-SCG-T6": "be253923",
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
        return None, [f"missing {label}: {path.relative_to(REPO_ROOT).as_posix()}"]
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        rel = path.relative_to(REPO_ROOT).as_posix()
        return None, [f"invalid {label} JSON: {rel}: {exc}"]
    if not isinstance(data, dict):
        return None, [f"{label} must be a JSON object"]
    return data, []


def _artifact_exists(path_value: str) -> bool:
    path = path_value.split("#", 1)[0].strip().strip("`")
    return bool(path) and (REPO_ROOT / path).exists()


def _artifact_contains_closed_status(path_value: str) -> bool:
    path = path_value.split("#", 1)[0].strip().strip("`")
    full = REPO_ROOT / path
    if not full.exists() or not full.is_file():
        return False
    text = full.read_text(encoding="utf-8", errors="replace")
    return "Status: CLOSED_PASS_BOUNDED" in text or "CLOSED_PASS_BOUNDED" in text[:1000]


def _eligible_manifest_ids(manifest: dict[str, Any]) -> list[str]:
    expected: list[str] = []
    for item in manifest.get("expectedChains", []):
        if not isinstance(item, dict):
            continue
        if item.get("futureCheckerDisposition") != "ELIGIBLE_FOR_EXPECTED_CHAIN_CHECK":
            continue
        expected_id = str(item.get("expectedRegistryId") or "").strip()
        if expected_id:
            expected.append(expected_id)
    return expected


def validate_ledger(
    ledger_path: Path = LEDGER_PATH,
    registry_path: Path = REGISTRY_PATH,
    manifest_path: Path = MANIFEST_PATH,
) -> list[str]:
    violations: list[str] = []
    ledger, load_violations = _load_json(ledger_path, "acceptance ledger")
    violations.extend(load_violations)
    registry, registry_violations = _load_json(registry_path, "system-loop registry")
    violations.extend(registry_violations)
    manifest, manifest_violations = _load_json(manifest_path, "expected-chain manifest")
    violations.extend(manifest_violations)
    if ledger is None or registry is None or manifest is None:
        return violations

    for field in REQUIRED_TOP_FIELDS:
        if field not in ledger:
            violations.append(f"ledger missing top-level field `{field}`")

    if ledger.get("acceptanceVerdict") != "FOUNDATION_SYSTEM_CHAIN_ACCEPTED_BOUNDED":
        violations.append("ledger acceptanceVerdict must be FOUNDATION_SYSTEM_CHAIN_ACCEPTED_BOUNDED")

    closures = ledger.get("acceptedClosureChain")
    if not isinstance(closures, list) or not closures:
        violations.append("acceptedClosureChain must be a non-empty list")
    else:
        seen_tranches: set[str] = set()
        for idx, closure in enumerate(closures):
            if not isinstance(closure, dict):
                violations.append(f"acceptedClosureChain[{idx}] must be an object")
                continue
            tranche_id = str(closure.get("trancheId") or f"acceptedClosureChain[{idx}]")
            seen_tranches.add(tranche_id)
            for field in REQUIRED_CLOSURE_FIELDS:
                if field not in closure:
                    violations.append(f"{tranche_id}: missing required field `{field}`")
            for field in ("closureArtifact", "evidenceSurface"):
                value = str(closure.get(field) or "")
                if not _artifact_exists(value):
                    violations.append(f"{tranche_id}: `{field}` does not exist: {value}")
            closure_artifact = str(closure.get("closureArtifact") or "")
            if closure_artifact and not _artifact_contains_closed_status(closure_artifact):
                violations.append(f"{tranche_id}: closureArtifact lacks CLOSED_PASS_BOUNDED evidence")
            if not str(closure.get("reopenCondition") or "").strip():
                violations.append(f"{tranche_id}: reopenCondition must not be empty")
            if not str(closure.get("materialCommit") or "").strip():
                violations.append(f"{tranche_id}: materialCommit must not be empty")
            expected_commit = EXPECTED_MATERIAL_COMMITS.get(tranche_id)
            observed_commit = str(closure.get("materialCommit") or "").strip()
            if expected_commit is not None and observed_commit != expected_commit:
                violations.append(
                    f"{tranche_id}: materialCommit must be current provenance carrier "
                    f"{expected_commit}; observed {observed_commit}"
                )
        missing = sorted(REQUIRED_TRANCHE_IDS - seen_tranches)
        if missing:
            violations.append("acceptedClosureChain missing required tranche ids: " + ", ".join(missing))

    ledger_ids = ledger.get("expectedRegistryIds")
    if not isinstance(ledger_ids, list) or not ledger_ids:
        violations.append("expectedRegistryIds must be a non-empty list")
        ledger_ids = []
    ledger_id_set = {str(item).strip() for item in ledger_ids if str(item).strip()}

    manifest_id_set = set(_eligible_manifest_ids(manifest))
    if ledger_id_set != manifest_id_set:
        violations.append(
            "expectedRegistryIds must match eligible manifest ids; "
            f"ledger={sorted(ledger_id_set)} manifest={sorted(manifest_id_set)}"
        )

    registry_connections = registry.get("connections")
    if not isinstance(registry_connections, list):
        violations.append("registry connections must be a list")
    else:
        by_id = {
            str(item.get("id")): item
            for item in registry_connections
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        }
        for expected_id in sorted(ledger_id_set):
            conn = by_id.get(expected_id)
            if conn is None:
                violations.append(f"expected registry id missing from registry: {expected_id}")
                continue
            if conn.get("status") != "ACTIVE":
                violations.append(f"{expected_id}: registry status must be ACTIVE")
            if conn.get("automationLevel") != "STRUCTURAL_GUARDED":
                violations.append(f"{expected_id}: registry automationLevel must be STRUCTURAL_GUARDED")

    gates = ledger.get("downstreamReopenGates")
    if not isinstance(gates, list) or not gates:
        violations.append("downstreamReopenGates must be a non-empty list")
    else:
        seen_lanes: set[str] = set()
        for idx, gate in enumerate(gates):
            if not isinstance(gate, dict):
                violations.append(f"downstreamReopenGates[{idx}] must be an object")
                continue
            lane_id = str(gate.get("laneId") or f"downstreamReopenGates[{idx}]")
            seen_lanes.add(lane_id)
            for field in REQUIRED_GATE_FIELDS:
                if field not in gate:
                    violations.append(f"{lane_id}: missing required field `{field}`")
            if gate.get("gateStatus") != "PARKED":
                violations.append(f"{lane_id}: gateStatus must remain PARKED")
            for field in ("requiredConditions", "forbiddenUntilGatePasses"):
                values = gate.get(field)
                if not isinstance(values, list) or not values or not all(str(item).strip() for item in values):
                    violations.append(f"{lane_id}: `{field}` must be a non-empty list of strings")
        missing_lanes = sorted(REQUIRED_DOWNSTREAM_LANES - seen_lanes)
        if missing_lanes:
            violations.append("downstreamReopenGates missing required lanes: " + ", ".join(missing_lanes))

    return violations


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate FPC-SCG-T7 acceptance ledger")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    changed = _changed_files(args.base, args.head)
    violations = validate_ledger()

    print("=== CVF FPC System-Chain Acceptance Ledger Gate ===")
    print(f"Ledger: {LEDGER_PATH.relative_to(REPO_ROOT)}")
    if args.base or args.head:
        print(f"Range: {args.base or '<auto>'}..{args.head or '<auto>'}")
    print(f"Changed paths observed: {len(changed)}")
    print(f"Violations: {len(violations)}")

    if violations:
        print("\nViolations:")
        for violation in violations:
            print(f"  - {violation}")
        if args.enforce:
            print("\nVIOLATION - FPC acceptance ledger is not valid.")
            return 1
        print("\nADVISORY - FPC acceptance ledger has issues.")
        return 0

    print("\nCOMPLIANT - FPC acceptance ledger is valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
