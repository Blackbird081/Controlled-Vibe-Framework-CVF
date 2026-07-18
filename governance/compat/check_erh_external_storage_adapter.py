#!/usr/bin/env python3
"""
CVF ERH-DUR2 External Storage Adapter Workflow Chain Checker

Verifies that the DUR2 pluggable storage adapter workflow chain is correctly wired:
  1. storage-adapter.ts exists with ERH_DUR2_MARKER.
  2. storage-adapter.ts contains CVF_STORAGE_ADAPTER_VERSION.
  3. storage-adapter.ts exports EventListAdapter interface.
  4. storage-adapter.ts exports KeyValueAdapter interface.
  5. storage-adapter.ts contains FileEventListAdapter class.
  6. storage-adapter.ts contains FileKeyValueAdapter class.
  7. storage-adapter.ts contains SQLiteEventListAdapter class.
  8. storage-adapter.ts contains SQLiteKeyValueAdapter class.
  9. storage-adapter.ts contains RedisEventListAdapter stub with CVF_NOT_IMPLEMENTED.
  10. storage-adapter.ts contains RedisKeyValueAdapter stub with CVF_NOT_IMPLEMENTED.
  11. storage-adapter.ts exports buildEventListAdapter factory.
  12. storage-adapter.ts exports buildKeyValueAdapter factory.
  13. storage-adapter.ts references CVF_STORAGE_ADAPTER_TYPE env variable.
  14. storage-adapter.ts supports the sqlite selector.
  15. control-plane-events.ts imports from storage-adapter.
  16. control-plane-events.ts retains ERH_DUR2_MARKER.
  17. policy-snapshot-registry.ts imports from storage-adapter.
  18. policy-snapshot-registry.ts retains ERH_DUR2_MARKER.
  19. storage-adapter.test.ts exists with ERH_DUR2_MARKER.
  20. DUR2 workflow-chain reference doc exists with ERH_DUR2_DECISION marker.
  21. DUR2 ledger doc exists with ERH_DUR2_LEDGER_VERSION marker.

ERH_DUR2_CHECKER_VERSION: 2026-06-05
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

STORAGE_ADAPTER_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.ts"
CONTROL_PLANE_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/control-plane-events.ts"
POLICY_SNAPSHOT_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/policy-snapshot-registry.ts"
STORAGE_ADAPTER_TEST_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.test.ts"
WORKFLOW_CHAIN_DOC = REPO_ROOT / "docs/reference/CVF_ERH_DUR2_EXTERNAL_STORAGE_AND_DISTRIBUTED_DURABILITY_WORKFLOW_CHAIN_2026-06-05.md"
LEDGER_DOC = REPO_ROOT / "docs/reference/CVF_ERH_DUR2_EXTERNAL_STORAGE_AND_DISTRIBUTED_DURABILITY_LEDGER_2026-06-05.md"

DUR2_MARKER = re.compile(r"ERH_DUR2_MARKER\s*:\s*EXTERNAL_STORAGE_ADAPTER_ACTIVE", re.IGNORECASE)
STORAGE_ADAPTER_VERSION = re.compile(r"CVF_STORAGE_ADAPTER_VERSION\s*:\s*\d{4}-\d{2}-\d{2}", re.IGNORECASE)
EVENT_LIST_ADAPTER_IFACE = re.compile(r"export\s+interface\s+EventListAdapter\b", re.MULTILINE)
KEY_VALUE_ADAPTER_IFACE = re.compile(r"export\s+interface\s+KeyValueAdapter\b", re.MULTILINE)
FILE_EVENT_LIST_CLASS = re.compile(r"class\s+FileEventListAdapter\b", re.MULTILINE)
FILE_KEY_VALUE_CLASS = re.compile(r"class\s+FileKeyValueAdapter\b", re.MULTILINE)
SQLITE_EVENT_LIST_CLASS = re.compile(r"class\s+SQLiteEventListAdapter\b", re.MULTILINE)
SQLITE_KEY_VALUE_CLASS = re.compile(r"class\s+SQLiteKeyValueAdapter\b", re.MULTILINE)
REDIS_EVENT_LIST_CLASS = re.compile(r"class\s+RedisEventListAdapter\b", re.MULTILINE)
REDIS_KEY_VALUE_CLASS = re.compile(r"class\s+RedisKeyValueAdapter\b", re.MULTILINE)
CVF_NOT_IMPLEMENTED_REF = re.compile(r"CVF_NOT_IMPLEMENTED", re.MULTILINE)
BUILD_EVENT_LIST_ADAPTER = re.compile(r"export\s+function\s+buildEventListAdapter\s*[<(]", re.MULTILINE)
BUILD_KEY_VALUE_ADAPTER = re.compile(r"export\s+function\s+buildKeyValueAdapter\s*[<(]", re.MULTILINE)
STORAGE_ADAPTER_TYPE_ENV = re.compile(r"CVF_STORAGE_ADAPTER_TYPE", re.MULTILINE)
SQLITE_SELECTOR = re.compile(r"resolved\s*===\s*['\"]sqlite['\"]", re.MULTILINE)
IMPORT_STORAGE_ADAPTER = re.compile(r"from\s+['\"]@/lib/storage-adapter['\"]", re.MULTILINE)
DUR2_WORKFLOW_DECISION = re.compile(r"ERH_DUR2_DECISION\s*:", re.IGNORECASE)
DUR2_LEDGER_VERSION = re.compile(r"ERH_DUR2_LEDGER_VERSION\s*:", re.IGNORECASE)


def _check_storage_adapter(violations: list[str]) -> None:
    if not STORAGE_ADAPTER_TS.exists():
        violations.append(
            f"missing storage-adapter.ts: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )
        return

    sa_text = STORAGE_ADAPTER_TS.read_text(encoding="utf-8")

    if not DUR2_MARKER.search(sa_text):
        violations.append(
            f"storage-adapter.ts missing ERH_DUR2_MARKER: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )

    if not STORAGE_ADAPTER_VERSION.search(sa_text):
        violations.append(
            f"storage-adapter.ts missing CVF_STORAGE_ADAPTER_VERSION: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )

    if not EVENT_LIST_ADAPTER_IFACE.search(sa_text):
        violations.append(
            f"storage-adapter.ts missing export interface EventListAdapter: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )

    if not KEY_VALUE_ADAPTER_IFACE.search(sa_text):
        violations.append(
            f"storage-adapter.ts missing export interface KeyValueAdapter: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )

    if not FILE_EVENT_LIST_CLASS.search(sa_text):
        violations.append(
            f"storage-adapter.ts missing FileEventListAdapter class: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )

    if not FILE_KEY_VALUE_CLASS.search(sa_text):
        violations.append(
            f"storage-adapter.ts missing FileKeyValueAdapter class: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )

    if not SQLITE_EVENT_LIST_CLASS.search(sa_text):
        violations.append(
            f"storage-adapter.ts missing SQLiteEventListAdapter class: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )

    if not SQLITE_KEY_VALUE_CLASS.search(sa_text):
        violations.append(
            f"storage-adapter.ts missing SQLiteKeyValueAdapter class: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )

    if not REDIS_EVENT_LIST_CLASS.search(sa_text):
        violations.append(
            f"storage-adapter.ts missing RedisEventListAdapter stub: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )

    if not REDIS_KEY_VALUE_CLASS.search(sa_text):
        violations.append(
            f"storage-adapter.ts missing RedisKeyValueAdapter stub: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )

    if not CVF_NOT_IMPLEMENTED_REF.search(sa_text):
        violations.append(
            f"storage-adapter.ts Redis stub missing CVF_NOT_IMPLEMENTED: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )

    if not BUILD_EVENT_LIST_ADAPTER.search(sa_text):
        violations.append(
            f"storage-adapter.ts missing export buildEventListAdapter factory: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )

    if not BUILD_KEY_VALUE_ADAPTER.search(sa_text):
        violations.append(
            f"storage-adapter.ts missing export buildKeyValueAdapter factory: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )

    if not STORAGE_ADAPTER_TYPE_ENV.search(sa_text):
        violations.append(
            f"storage-adapter.ts missing CVF_STORAGE_ADAPTER_TYPE env reference: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )

    if not SQLITE_SELECTOR.search(sa_text):
        violations.append(
            f"storage-adapter.ts missing sqlite CVF_STORAGE_ADAPTER_TYPE selector: {STORAGE_ADAPTER_TS.relative_to(REPO_ROOT)}"
        )


def _check_control_plane(violations: list[str]) -> None:
    if not CONTROL_PLANE_TS.exists():
        violations.append(
            f"missing control-plane-events.ts: {CONTROL_PLANE_TS.relative_to(REPO_ROOT)}"
        )
        return

    cp_text = CONTROL_PLANE_TS.read_text(encoding="utf-8")

    if not DUR2_MARKER.search(cp_text):
        violations.append(
            f"control-plane-events.ts missing ERH_DUR2_MARKER: {CONTROL_PLANE_TS.relative_to(REPO_ROOT)}"
        )

    if not IMPORT_STORAGE_ADAPTER.search(cp_text):
        violations.append(
            f"control-plane-events.ts does not import from storage-adapter: {CONTROL_PLANE_TS.relative_to(REPO_ROOT)}"
        )


def _check_policy_snapshot_registry(violations: list[str]) -> None:
    if not POLICY_SNAPSHOT_TS.exists():
        violations.append(
            f"missing policy-snapshot-registry.ts: {POLICY_SNAPSHOT_TS.relative_to(REPO_ROOT)}"
        )
        return

    ps_text = POLICY_SNAPSHOT_TS.read_text(encoding="utf-8")

    if not DUR2_MARKER.search(ps_text):
        violations.append(
            f"policy-snapshot-registry.ts missing ERH_DUR2_MARKER: {POLICY_SNAPSHOT_TS.relative_to(REPO_ROOT)}"
        )

    if not IMPORT_STORAGE_ADAPTER.search(ps_text):
        violations.append(
            f"policy-snapshot-registry.ts does not import from storage-adapter: {POLICY_SNAPSHOT_TS.relative_to(REPO_ROOT)}"
        )


def _check_tests(violations: list[str]) -> None:
    if not STORAGE_ADAPTER_TEST_TS.exists():
        violations.append(
            f"missing storage-adapter.test.ts: {STORAGE_ADAPTER_TEST_TS.relative_to(REPO_ROOT)}"
        )
        return

    test_text = STORAGE_ADAPTER_TEST_TS.read_text(encoding="utf-8")

    if not DUR2_MARKER.search(test_text):
        violations.append(
            f"storage-adapter.test.ts missing ERH_DUR2_MARKER: {STORAGE_ADAPTER_TEST_TS.relative_to(REPO_ROOT)}"
        )


def _check_docs(violations: list[str]) -> None:
    if not WORKFLOW_CHAIN_DOC.exists():
        violations.append(
            f"missing DUR2 workflow-chain reference: {WORKFLOW_CHAIN_DOC.relative_to(REPO_ROOT)}"
        )
    else:
        wf_text = WORKFLOW_CHAIN_DOC.read_text(encoding="utf-8")
        if not DUR2_WORKFLOW_DECISION.search(wf_text):
            violations.append(
                f"DUR2 workflow-chain reference missing ERH_DUR2_DECISION marker: {WORKFLOW_CHAIN_DOC.relative_to(REPO_ROOT)}"
            )

    if not LEDGER_DOC.exists():
        violations.append(
            f"missing DUR2 ledger: {LEDGER_DOC.relative_to(REPO_ROOT)}"
        )
    else:
        ledger_text = LEDGER_DOC.read_text(encoding="utf-8")
        if not DUR2_LEDGER_VERSION.search(ledger_text):
            violations.append(
                f"DUR2 ledger missing ERH_DUR2_LEDGER_VERSION marker: {LEDGER_DOC.relative_to(REPO_ROOT)}"
            )


def check(violations: list[str]) -> None:
    _check_storage_adapter(violations)
    _check_control_plane(violations)
    _check_policy_snapshot_registry(violations)
    _check_tests(violations)
    _check_docs(violations)


def main() -> int:
    parser = argparse.ArgumentParser(description="CVF ERH-DUR2 External Storage Adapter Checker")
    parser.add_argument("--enforce", action="store_true", help="Exit 1 on violations")
    args = parser.parse_args()

    violations: list[str] = []
    check(violations)

    print("=== CVF ERH-DUR2 External Storage Adapter Checker ===")
    print(f"Violations: {len(violations)}")

    if violations:
        print("\nViolations:")
        for v in violations:
            print(f"  - {v}")
        if args.enforce:
            print("\nVIOLATION - DUR2 external storage adapter workflow chain is not correctly wired.")
            return 1
        print("\nWARNING - DUR2 has issues (not enforced).")
        return 0

    print("\nCOMPLIANT - DUR2 external storage adapter workflow chain is correctly wired.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
