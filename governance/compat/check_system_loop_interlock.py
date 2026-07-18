#!/usr/bin/env python3
"""
CVF System Loop Interlock Checker (GC-052)

Validates the interloop registry so loop outputs are declared as downstream
inputs instead of living as disconnected architecture prose.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

try:
    from guard_binding_catalog import has_binding_marker
except ModuleNotFoundError:
    from governance.compat.guard_binding_catalog import has_binding_marker


REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = REPO_ROOT / "docs" / "reference" / "CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json"
STANDARD_PATH = REPO_ROOT / "docs" / "reference" / "CVF_SYSTEM_LOOP_INTERLOCK_STANDARD_2026-06-02.md"
EXPECTED_CHAIN_MANIFEST_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "CVF_FPC_T3_C03_INTERLOCK_EXPECTED_CHAIN_MANIFEST_2026-06-27.json"
)
AUTORUN_PATH = REPO_ROOT / "governance" / "compat" / "run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = REPO_ROOT / "governance" / "compat" / "run_local_governance_hook_chain.py"

REQUIRED_TOP_FIELDS = ("schemaVersion", "standard", "checker", "lastUpdated", "connections")
REQUIRED_CONNECTION_FIELDS = (
    "id",
    "status",
    "upstreamLoop",
    "upstreamPlane",
    "outputArtifact",
    "outputSignal",
    "signalContract",
    "downstreamLoop",
    "downstreamPlane",
    "inputArtifact",
    "routingRule",
    "evidenceRefs",
    "automationLevel",
    "claimBoundary",
)
ALLOWED_STATUSES = {"ACTIVE", "PARKED", "PROPOSED", "DEPRECATED"}
ALLOWED_AUTOMATION_LEVELS = {
    "MACHINE_CHECKED",
    "STRUCTURAL_GUARDED",
    "HUMAN_ROUTED",
    "PARKED",
}
MACHINE_LEVELS = {"MACHINE_CHECKED", "STRUCTURAL_GUARDED"}


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
    code, out, _ = _run_git(["diff", "--name-only", "--cached"])
    if code == 0 and out:
        paths.extend(out.splitlines())
    code, out, _ = _run_git(["diff", "--name-only"])
    if code == 0 and out:
        paths.extend(out.splitlines())
    return sorted({p.strip().replace("\\", "/") for p in paths if p.strip()})


def _artifact_exists(path_value: str) -> bool:
    path = path_value.split("#", 1)[0].strip().strip("`")
    return bool(path) and (REPO_ROOT / path).exists()


def _read_text(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def _validate_connection(conn: dict[str, Any], index: int) -> list[str]:
    violations: list[str] = []
    cid = str(conn.get("id") or f"connections[{index}]")

    for field in REQUIRED_CONNECTION_FIELDS:
        if field not in conn:
            violations.append(f"{cid}: missing required field `{field}`")

    status = conn.get("status")
    if status and status not in ALLOWED_STATUSES:
        violations.append(f"{cid}: invalid status `{status}`")

    automation = conn.get("automationLevel")
    if automation and automation not in ALLOWED_AUTOMATION_LEVELS:
        violations.append(f"{cid}: invalid automationLevel `{automation}`")

    for field in ("outputArtifact", "signalContract", "inputArtifact"):
        value = str(conn.get(field) or "")
        if not _artifact_exists(value):
            violations.append(f"{cid}: `{field}` does not point to an existing artifact: {value}")

    evidence = conn.get("evidenceRefs")
    if not isinstance(evidence, list) or not evidence:
        violations.append(f"{cid}: `evidenceRefs` must be a non-empty list")
    else:
        for ref in evidence:
            if not isinstance(ref, str) or not ref.strip():
                violations.append(f"{cid}: evidenceRefs contains an empty/non-string ref")
            elif not _artifact_exists(ref):
                violations.append(f"{cid}: evidenceRef does not exist: {ref}")

    for field in ("outputSignal", "routingRule", "claimBoundary"):
        if not str(conn.get(field) or "").strip():
            violations.append(f"{cid}: `{field}` must not be empty")

    if status == "ACTIVE" and automation in MACHINE_LEVELS:
        autorun_path = str(AUTORUN_PATH.relative_to(REPO_ROOT)).replace("\\", "/")
        hook_path = str(HOOK_CHAIN_PATH.relative_to(REPO_ROOT)).replace("\\", "/")
        autorun_text = _read_text(AUTORUN_PATH)
        hook_text = _read_text(HOOK_CHAIN_PATH)
        if not has_binding_marker(autorun_path, "check_system_loop_interlock.py", autorun_text):
            violations.append(f"{cid}: machine interlock is ACTIVE but autorun gate is not wired")
        if not has_binding_marker(hook_path, "check_system_loop_interlock.py", hook_text):
            violations.append(f"{cid}: machine interlock is ACTIVE but local hook chain is not wired")

    return violations


def _validate_expected_chain_manifest(registry: dict[str, Any]) -> list[str]:
    violations: list[str] = []
    if not EXPECTED_CHAIN_MANIFEST_PATH.exists():
        rel = EXPECTED_CHAIN_MANIFEST_PATH.relative_to(REPO_ROOT)
        return [f"missing expected-chain manifest: {rel}"]

    try:
        manifest = json.loads(EXPECTED_CHAIN_MANIFEST_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        rel = EXPECTED_CHAIN_MANIFEST_PATH.relative_to(REPO_ROOT)
        return [f"invalid expected-chain manifest JSON: {rel}: {exc}"]

    expected_chains = manifest.get("expectedChains")
    if not isinstance(expected_chains, list) or not expected_chains:
        return ["expected-chain manifest `expectedChains` must be a non-empty list"]

    connections = registry.get("connections")
    if not isinstance(connections, list):
        return violations
    by_id = {
        str(conn.get("id")): conn
        for conn in connections
        if isinstance(conn, dict) and str(conn.get("id") or "").strip()
    }

    seen_expected_ids: set[str] = set()
    for idx, chain in enumerate(expected_chains):
        if not isinstance(chain, dict):
            violations.append(f"expectedChains[{idx}] must be an object")
            continue
        disposition = str(chain.get("futureCheckerDisposition") or "")
        if disposition != "ELIGIBLE_FOR_EXPECTED_CHAIN_CHECK":
            continue

        expected_id = str(chain.get("expectedRegistryId") or "").strip()
        candidate_id = str(chain.get("candidateId") or f"expectedChains[{idx}]")
        if not expected_id:
            violations.append(f"{candidate_id}: missing `expectedRegistryId`")
            continue
        if expected_id in seen_expected_ids:
            violations.append(f"{candidate_id}: duplicate expectedRegistryId `{expected_id}`")
        seen_expected_ids.add(expected_id)

        conn = by_id.get(expected_id)
        if conn is None:
            violations.append(f"{candidate_id}: expected registry id is missing: {expected_id}")
            continue

        expected_status = str(chain.get("expectedStatus") or "").strip()
        if expected_status and conn.get("status") != expected_status:
            violations.append(
                f"{candidate_id}: expected `{expected_id}` status `{expected_status}` "
                f"but found `{conn.get('status')}`"
            )

        expected_automation = str(chain.get("expectedAutomationLevel") or "").strip()
        if expected_automation and conn.get("automationLevel") != expected_automation:
            violations.append(
                f"{candidate_id}: expected `{expected_id}` automationLevel "
                f"`{expected_automation}` but found `{conn.get('automationLevel')}`"
            )

    return violations


def validate_registry() -> list[str]:
    violations: list[str] = []
    if not REGISTRY_PATH.exists():
        return [f"missing registry: {REGISTRY_PATH.relative_to(REPO_ROOT)}"]
    if not STANDARD_PATH.exists():
        violations.append(f"missing standard: {STANDARD_PATH.relative_to(REPO_ROOT)}")

    try:
        registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [f"invalid registry JSON: {exc}"]

    for field in REQUIRED_TOP_FIELDS:
        if field not in registry:
            violations.append(f"registry missing top-level field `{field}`")

    connections = registry.get("connections")
    if not isinstance(connections, list) or not connections:
        violations.append("registry `connections` must be a non-empty list")
        return violations

    seen: set[str] = set()
    for idx, conn in enumerate(connections):
        if not isinstance(conn, dict):
            violations.append(f"connections[{idx}] must be an object")
            continue
        cid = str(conn.get("id") or "")
        if cid in seen:
            violations.append(f"duplicate connection id `{cid}`")
        if cid:
            seen.add(cid)
        violations.extend(_validate_connection(conn, idx))

    violations.extend(_validate_expected_chain_manifest(registry))

    return violations


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate CVF system loop interlock registry")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    changed = _changed_files(args.base, args.head)
    violations = validate_registry()

    print("=== CVF System Loop Interlock Gate (GC-052) ===")
    print(f"Registry: {REGISTRY_PATH.relative_to(REPO_ROOT)}")
    if args.base or args.head:
        print(f"Range: {args.base or '<auto>'}..{args.head or '<auto>'}")
    print(f"Changed paths observed: {len(changed)}")
    print(f"Violations: {len(violations)}")

    if violations:
        print("\nViolations:")
        for violation in violations:
            print(f"  - {violation}")
        if args.enforce:
            print("\nVIOLATION - system loop interlock registry is not valid.")
            return 1
        print("\nADVISORY - system loop interlock registry has issues.")
        return 0

    print("\nCOMPLIANT - system loop interlock registry is valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
