#!/usr/bin/env python3
"""
CVF ERH-DUR1 Durable Evidence And Policy Snapshot Workflow Chain Checker

Verifies that the DUR1 durable evidence and policy snapshot workflow chain
is correctly wired:
  1. control-plane-events.ts contains ERH_DUR1_MARKER.
  2. control-plane-events.ts contains CVF_DURABLE_EVIDENCE_VERSION.
  3. control-plane-events.ts default store path does NOT use os.tmpdir().
  4. control-plane-events.ts default store uses .cvf/runtime style path.
  5. CVF_CONTROL_PLANE_EVENTS_PATH env override still present.
  6. policy-snapshot-registry.ts exists with CVF_POLICY_SNAPSHOT_REGISTRY_VERSION.
  7. policy-snapshot-registry.ts exports generatePolicySnapshotId.
  8. policy-snapshot-registry.ts exports buildPolicySnapshot.
  9. policy-snapshot-registry.ts exports readPolicySnapshot.
  10. web-governance-envelope.ts no longer contains process-local counter (_policyCounter).
  11. web-governance-envelope.ts re-exports generatePolicySnapshotId from registry.
  12. Durable event test file exists with ERH_DUR1_MARKER.
  13. Policy snapshot test file exists.
  14. Workflow-chain reference doc exists with DUR1 decision marker.
  15. Ledger doc exists with ERH_DUR1_LEDGER_VERSION marker.

ERH_DUR1_CHECKER_VERSION: 2026-06-05
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

CONTROL_PLANE_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/control-plane-events.ts"
POLICY_SNAPSHOT_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/policy-snapshot-registry.ts"
ENVELOPE_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/web-governance-envelope.ts"
DURABLE_TEST_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/control-plane-events.durable.test.ts"
SNAPSHOT_TEST_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/policy-snapshot-registry.test.ts"
WORKFLOW_CHAIN_DOC = REPO_ROOT / "docs/reference/CVF_ERH_DUR1_DURABLE_EVIDENCE_AND_POLICY_SNAPSHOT_WORKFLOW_CHAIN_2026-06-05.md"
LEDGER_DOC = REPO_ROOT / "docs/reference/CVF_ERH_DUR1_DURABLE_EVIDENCE_AND_POLICY_SNAPSHOT_LEDGER_2026-06-05.md"

DUR1_MARKER = re.compile(r"ERH_DUR1_MARKER\s*:\s*DURABLE_EVIDENCE_STORE_ACTIVE", re.IGNORECASE)
DURABLE_EVIDENCE_VERSION = re.compile(r"CVF_DURABLE_EVIDENCE_VERSION\s*:\s*\d{4}-\d{2}-\d{2}", re.IGNORECASE)
OS_TMPDIR_DEFAULT = re.compile(r"os\.tmpdir\(\)", re.MULTILINE)
DOTCVF_RUNTIME_PATH = re.compile(r"'\.cvf',\s*'runtime'|\.cvf[/\\]runtime", re.IGNORECASE | re.MULTILINE)
CVF_EVENTS_ENV_OVERRIDE = re.compile(r"CVF_CONTROL_PLANE_EVENTS_PATH", re.MULTILINE)
SNAPSHOT_REGISTRY_VERSION = re.compile(r"CVF_POLICY_SNAPSHOT_REGISTRY_VERSION\s*:\s*\d{4}-\d{2}-\d{2}", re.IGNORECASE)
GENERATE_ID_EXPORT = re.compile(r"export\s+function\s+generatePolicySnapshotId\s*\(", re.MULTILINE)
BUILD_SNAPSHOT_EXPORT = re.compile(r"export\s+function\s+buildPolicySnapshot\s*\(", re.MULTILINE)
READ_SNAPSHOT_EXPORT = re.compile(r"export\s+async\s+function\s+readPolicySnapshot\s*\(", re.MULTILINE)
POLICY_COUNTER_LOCAL = re.compile(r"let\s+_policyCounter\s*=", re.MULTILINE)
ENVELOPE_REEXPORT = re.compile(r"export\s+\{[^}]*generatePolicySnapshotId[^}]*\}\s+from\s+['\"]@/lib/policy-snapshot-registry['\"]", re.MULTILINE)
DURABLE_TEST_MARKER = re.compile(r"ERH_DUR1_MARKER\s*:\s*DURABLE_EVIDENCE_STORE_ACTIVE", re.IGNORECASE)
DUR1_WORKFLOW_DECISION = re.compile(r"ERH_DUR1_DECISION\s*:", re.IGNORECASE)
DUR1_LEDGER_VERSION = re.compile(r"ERH_DUR1_LEDGER_VERSION\s*:", re.IGNORECASE)


def _check_control_plane(violations: list[str]) -> None:
    if not CONTROL_PLANE_TS.exists():
        violations.append(f"missing control-plane-events: {CONTROL_PLANE_TS.relative_to(REPO_ROOT)}")
        return

    cp_text = CONTROL_PLANE_TS.read_text(encoding="utf-8")

    if not DUR1_MARKER.search(cp_text):
        violations.append(
            f"control-plane-events missing ERH_DUR1_MARKER: {CONTROL_PLANE_TS.relative_to(REPO_ROOT)}"
        )

    if not DURABLE_EVIDENCE_VERSION.search(cp_text):
        violations.append(
            f"control-plane-events missing CVF_DURABLE_EVIDENCE_VERSION: {CONTROL_PLANE_TS.relative_to(REPO_ROOT)}"
        )

    if OS_TMPDIR_DEFAULT.search(cp_text):
        violations.append(
            f"control-plane-events still uses os.tmpdir() as default (must use .cvf/runtime): {CONTROL_PLANE_TS.relative_to(REPO_ROOT)}"
        )

    if not DOTCVF_RUNTIME_PATH.search(cp_text):
        violations.append(
            f"control-plane-events default store does not use .cvf/runtime path: {CONTROL_PLANE_TS.relative_to(REPO_ROOT)}"
        )

    if not CVF_EVENTS_ENV_OVERRIDE.search(cp_text):
        violations.append(
            f"control-plane-events missing CVF_CONTROL_PLANE_EVENTS_PATH env override: {CONTROL_PLANE_TS.relative_to(REPO_ROOT)}"
        )


def _check_policy_snapshot_registry(violations: list[str]) -> None:
    if not POLICY_SNAPSHOT_TS.exists():
        violations.append(
            f"missing policy-snapshot-registry: {POLICY_SNAPSHOT_TS.relative_to(REPO_ROOT)}"
        )
        return

    ps_text = POLICY_SNAPSHOT_TS.read_text(encoding="utf-8")

    if not SNAPSHOT_REGISTRY_VERSION.search(ps_text):
        violations.append(
            f"policy-snapshot-registry missing CVF_POLICY_SNAPSHOT_REGISTRY_VERSION: {POLICY_SNAPSHOT_TS.relative_to(REPO_ROOT)}"
        )

    if not GENERATE_ID_EXPORT.search(ps_text):
        violations.append(
            f"policy-snapshot-registry missing export generatePolicySnapshotId: {POLICY_SNAPSHOT_TS.relative_to(REPO_ROOT)}"
        )

    if not BUILD_SNAPSHOT_EXPORT.search(ps_text):
        violations.append(
            f"policy-snapshot-registry missing export buildPolicySnapshot: {POLICY_SNAPSHOT_TS.relative_to(REPO_ROOT)}"
        )

    if not READ_SNAPSHOT_EXPORT.search(ps_text):
        violations.append(
            f"policy-snapshot-registry missing export readPolicySnapshot: {POLICY_SNAPSHOT_TS.relative_to(REPO_ROOT)}"
        )


def _check_envelope(violations: list[str]) -> None:
    if not ENVELOPE_TS.exists():
        violations.append(f"missing web-governance-envelope: {ENVELOPE_TS.relative_to(REPO_ROOT)}")
        return

    env_text = ENVELOPE_TS.read_text(encoding="utf-8")

    if POLICY_COUNTER_LOCAL.search(env_text):
        violations.append(
            f"web-governance-envelope still defines process-local _policyCounter (must delegate to registry): {ENVELOPE_TS.relative_to(REPO_ROOT)}"
        )

    if not ENVELOPE_REEXPORT.search(env_text):
        violations.append(
            f"web-governance-envelope does not re-export generatePolicySnapshotId from registry: {ENVELOPE_TS.relative_to(REPO_ROOT)}"
        )


def _check_tests(violations: list[str]) -> None:
    if not DURABLE_TEST_TS.exists():
        violations.append(
            f"missing durable event test: {DURABLE_TEST_TS.relative_to(REPO_ROOT)}"
        )
    else:
        dt_text = DURABLE_TEST_TS.read_text(encoding="utf-8")
        if not DURABLE_TEST_MARKER.search(dt_text):
            violations.append(
                f"durable event test missing ERH_DUR1_MARKER: {DURABLE_TEST_TS.relative_to(REPO_ROOT)}"
            )

    if not SNAPSHOT_TEST_TS.exists():
        violations.append(
            f"missing policy snapshot test: {SNAPSHOT_TEST_TS.relative_to(REPO_ROOT)}"
        )


def _check_docs(violations: list[str]) -> None:
    if not WORKFLOW_CHAIN_DOC.exists():
        violations.append(
            f"missing DUR1 workflow-chain reference: {WORKFLOW_CHAIN_DOC.relative_to(REPO_ROOT)}"
        )
    else:
        wf_text = WORKFLOW_CHAIN_DOC.read_text(encoding="utf-8")
        if not DUR1_WORKFLOW_DECISION.search(wf_text):
            violations.append(
                f"DUR1 workflow-chain reference missing ERH_DUR1_DECISION marker: {WORKFLOW_CHAIN_DOC.relative_to(REPO_ROOT)}"
            )

    if not LEDGER_DOC.exists():
        violations.append(f"missing DUR1 ledger: {LEDGER_DOC.relative_to(REPO_ROOT)}")
    else:
        ledger_text = LEDGER_DOC.read_text(encoding="utf-8")
        if not DUR1_LEDGER_VERSION.search(ledger_text):
            violations.append(
                f"DUR1 ledger missing ERH_DUR1_LEDGER_VERSION marker: {LEDGER_DOC.relative_to(REPO_ROOT)}"
            )


def check(violations: list[str]) -> None:
    _check_control_plane(violations)
    _check_policy_snapshot_registry(violations)
    _check_envelope(violations)
    _check_tests(violations)
    _check_docs(violations)


def main() -> int:
    parser = argparse.ArgumentParser(description="CVF ERH-DUR1 Durable Evidence Policy Snapshot Checker")
    parser.add_argument("--enforce", action="store_true", help="Exit 1 on violations")
    args = parser.parse_args()

    violations: list[str] = []
    check(violations)

    print("=== CVF ERH-DUR1 Durable Evidence Policy Snapshot Checker ===")
    print(f"Violations: {len(violations)}")

    if violations:
        print("\nViolations:")
        for v in violations:
            print(f"  - {v}")
        if args.enforce:
            print("\nVIOLATION - DUR1 durable evidence policy snapshot workflow chain is not correctly wired.")
            return 1
        print("\nWARNING - DUR1 has issues (not enforced).")
        return 0

    print("\nCOMPLIANT - DUR1 durable evidence policy snapshot workflow chain is correctly wired.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
