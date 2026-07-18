"""
Unit tests for check_erh_external_storage_adapter.py (ERH-DUR2).

ERH_DUR2_CHECKER_VERSION: 2026-06-05
"""

from __future__ import annotations

import sys
import types
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_erh_external_storage_adapter as checker


def _make_stub(tmp_path: Path) -> types.SimpleNamespace:
    """Create a minimal directory tree that satisfies the checker."""
    sa_ts = tmp_path / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.ts"
    cp_ts = tmp_path / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/control-plane-events.ts"
    ps_ts = tmp_path / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/policy-snapshot-registry.ts"
    test_ts = tmp_path / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.test.ts"
    wf_doc = tmp_path / "docs/reference/CVF_ERH_DUR2_EXTERNAL_STORAGE_AND_DISTRIBUTED_DURABILITY_WORKFLOW_CHAIN_2026-06-05.md"
    ledger_doc = tmp_path / "docs/reference/CVF_ERH_DUR2_EXTERNAL_STORAGE_AND_DISTRIBUTED_DURABILITY_LEDGER_2026-06-05.md"

    for f in [sa_ts, cp_ts, ps_ts, test_ts, wf_doc, ledger_doc]:
        f.parent.mkdir(parents=True, exist_ok=True)

    sa_ts.write_text(
        "// ERH_DUR2_MARKER: EXTERNAL_STORAGE_ADAPTER_ACTIVE\n"
        "// CVF_STORAGE_ADAPTER_VERSION: 2026-06-05\n"
        "export interface EventListAdapter<T> {}\n"
        "export interface KeyValueAdapter<T> {}\n"
        "class FileEventListAdapter<T> implements EventListAdapter<T> {}\n"
        "class FileKeyValueAdapter<T> implements KeyValueAdapter<T> {}\n"
        "class SQLiteEventListAdapter<T> implements EventListAdapter<T> {}\n"
        "class SQLiteKeyValueAdapter<T> implements KeyValueAdapter<T> {}\n"
        "class RedisEventListAdapter<T> implements EventListAdapter<T> { CVF_NOT_IMPLEMENTED = 1; }\n"
        "class RedisKeyValueAdapter<T> implements KeyValueAdapter<T> { CVF_NOT_IMPLEMENTED = 1; }\n"
        "export function buildEventListAdapter<T>(type?: string) {}\n"
        "export function buildKeyValueAdapter<T>(type?: string) {}\n"
        "if (resolved === 'sqlite') return new SQLiteEventListAdapter<T>();\n"
        "process.env.CVF_STORAGE_ADAPTER_TYPE\n",
        encoding="utf-8",
    )
    cp_ts.write_text(
        "// ERH_DUR2_MARKER: EXTERNAL_STORAGE_ADAPTER_ACTIVE\n"
        "import { buildEventListAdapter } from '@/lib/storage-adapter';\n",
        encoding="utf-8",
    )
    ps_ts.write_text(
        "// ERH_DUR2_MARKER: EXTERNAL_STORAGE_ADAPTER_ACTIVE\n"
        "import { buildKeyValueAdapter } from '@/lib/storage-adapter';\n",
        encoding="utf-8",
    )
    test_ts.write_text(
        "// ERH_DUR2_MARKER: EXTERNAL_STORAGE_ADAPTER_ACTIVE\n"
        "// tests here\n",
        encoding="utf-8",
    )
    wf_doc.write_text("## Decision\nERH_DUR2_DECISION: DUR3_NOT_NEEDED_NOW\n", encoding="utf-8")
    ledger_doc.write_text("ERH_DUR2_LEDGER_VERSION: 2026-06-05\n", encoding="utf-8")

    return types.SimpleNamespace(
        sa_ts=sa_ts, cp_ts=cp_ts, ps_ts=ps_ts, test_ts=test_ts,
        wf_doc=wf_doc, ledger_doc=ledger_doc,
    )


def _run(tmp_path: Path) -> list[str]:
    violations: list[str] = []
    with patch.multiple(
        checker,
        REPO_ROOT=tmp_path,
        STORAGE_ADAPTER_TS=tmp_path / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.ts",
        CONTROL_PLANE_TS=tmp_path / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/control-plane-events.ts",
        POLICY_SNAPSHOT_TS=tmp_path / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/policy-snapshot-registry.ts",
        STORAGE_ADAPTER_TEST_TS=tmp_path / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.test.ts",
        WORKFLOW_CHAIN_DOC=tmp_path / "docs/reference/CVF_ERH_DUR2_EXTERNAL_STORAGE_AND_DISTRIBUTED_DURABILITY_WORKFLOW_CHAIN_2026-06-05.md",
        LEDGER_DOC=tmp_path / "docs/reference/CVF_ERH_DUR2_EXTERNAL_STORAGE_AND_DISTRIBUTED_DURABILITY_LEDGER_2026-06-05.md",
    ):
        checker.check(violations)
    return violations


class TestCompliant:
    def test_fully_compliant_stub_passes(self, tmp_path: Path) -> None:
        _make_stub(tmp_path)
        assert _run(tmp_path) == []


class TestStorageAdapterTs:
    def test_missing_file_is_violation(self, tmp_path: Path) -> None:
        _make_stub(tmp_path)
        (tmp_path / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.ts").unlink()
        violations = _run(tmp_path)
        assert any("missing storage-adapter.ts" in v for v in violations)

    def test_missing_dur2_marker_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        content = stub.sa_ts.read_text()
        stub.sa_ts.write_text(content.replace("ERH_DUR2_MARKER: EXTERNAL_STORAGE_ADAPTER_ACTIVE", ""), encoding="utf-8")
        violations = _run(tmp_path)
        assert any("ERH_DUR2_MARKER" in v and "storage-adapter.ts" in v for v in violations)

    def test_missing_version_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        content = stub.sa_ts.read_text()
        stub.sa_ts.write_text(content.replace("CVF_STORAGE_ADAPTER_VERSION: 2026-06-05", ""), encoding="utf-8")
        violations = _run(tmp_path)
        assert any("CVF_STORAGE_ADAPTER_VERSION" in v for v in violations)

    def test_missing_event_list_adapter_interface_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        content = stub.sa_ts.read_text()
        stub.sa_ts.write_text(content.replace("export interface EventListAdapter<T> {}", ""), encoding="utf-8")
        violations = _run(tmp_path)
        assert any("EventListAdapter" in v for v in violations)

    def test_missing_key_value_adapter_interface_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        content = stub.sa_ts.read_text()
        stub.sa_ts.write_text(content.replace("export interface KeyValueAdapter<T> {}", ""), encoding="utf-8")
        violations = _run(tmp_path)
        assert any("KeyValueAdapter" in v and "interface" in v.lower() for v in violations)

    def test_missing_redis_not_implemented_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        content = stub.sa_ts.read_text()
        stub.sa_ts.write_text(content.replace("CVF_NOT_IMPLEMENTED", "OTHER_ERROR"), encoding="utf-8")
        violations = _run(tmp_path)
        assert any("CVF_NOT_IMPLEMENTED" in v for v in violations)

    def test_missing_sqlite_event_list_adapter_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        content = stub.sa_ts.read_text()
        stub.sa_ts.write_text(content.replace("class SQLiteEventListAdapter<T> implements EventListAdapter<T> {}\n", ""), encoding="utf-8")
        violations = _run(tmp_path)
        assert any("SQLiteEventListAdapter" in v for v in violations)

    def test_missing_sqlite_selector_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        content = stub.sa_ts.read_text()
        stub.sa_ts.write_text(content.replace("if (resolved === 'sqlite') return new SQLiteEventListAdapter<T>();\n", ""), encoding="utf-8")
        violations = _run(tmp_path)
        assert any("sqlite CVF_STORAGE_ADAPTER_TYPE selector" in v for v in violations)

    def test_missing_build_event_list_adapter_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        content = stub.sa_ts.read_text()
        stub.sa_ts.write_text(content.replace("export function buildEventListAdapter<T>", ""), encoding="utf-8")
        violations = _run(tmp_path)
        assert any("buildEventListAdapter" in v for v in violations)

    def test_missing_storage_adapter_type_env_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        content = stub.sa_ts.read_text()
        stub.sa_ts.write_text(content.replace("CVF_STORAGE_ADAPTER_TYPE", "OTHER_ENV"), encoding="utf-8")
        violations = _run(tmp_path)
        assert any("CVF_STORAGE_ADAPTER_TYPE" in v for v in violations)


class TestControlPlaneTs:
    def test_missing_dur2_marker_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        stub.cp_ts.write_text(
            "import { buildEventListAdapter } from '@/lib/storage-adapter';\n",
            encoding="utf-8",
        )
        violations = _run(tmp_path)
        assert any("ERH_DUR2_MARKER" in v and "control-plane-events" in v for v in violations)

    def test_missing_storage_adapter_import_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        stub.cp_ts.write_text(
            "// ERH_DUR2_MARKER: EXTERNAL_STORAGE_ADAPTER_ACTIVE\n",
            encoding="utf-8",
        )
        violations = _run(tmp_path)
        assert any("storage-adapter" in v and "control-plane-events" in v for v in violations)


class TestPolicySnapshotTs:
    def test_missing_dur2_marker_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        stub.ps_ts.write_text(
            "import { buildKeyValueAdapter } from '@/lib/storage-adapter';\n",
            encoding="utf-8",
        )
        violations = _run(tmp_path)
        assert any("ERH_DUR2_MARKER" in v and "policy-snapshot-registry" in v for v in violations)

    def test_missing_storage_adapter_import_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        stub.ps_ts.write_text(
            "// ERH_DUR2_MARKER: EXTERNAL_STORAGE_ADAPTER_ACTIVE\n",
            encoding="utf-8",
        )
        violations = _run(tmp_path)
        assert any("storage-adapter" in v and "policy-snapshot-registry" in v for v in violations)


class TestDocs:
    def test_missing_workflow_chain_doc_is_violation(self, tmp_path: Path) -> None:
        _make_stub(tmp_path)
        (tmp_path / "docs/reference/CVF_ERH_DUR2_EXTERNAL_STORAGE_AND_DISTRIBUTED_DURABILITY_WORKFLOW_CHAIN_2026-06-05.md").unlink()
        violations = _run(tmp_path)
        assert any("workflow-chain reference" in v for v in violations)

    def test_missing_dur2_decision_marker_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        stub.wf_doc.write_text("No decision here\n", encoding="utf-8")
        violations = _run(tmp_path)
        assert any("ERH_DUR2_DECISION" in v for v in violations)

    def test_missing_ledger_doc_is_violation(self, tmp_path: Path) -> None:
        _make_stub(tmp_path)
        (tmp_path / "docs/reference/CVF_ERH_DUR2_EXTERNAL_STORAGE_AND_DISTRIBUTED_DURABILITY_LEDGER_2026-06-05.md").unlink()
        violations = _run(tmp_path)
        assert any("ledger" in v for v in violations)

    def test_missing_ledger_version_marker_is_violation(self, tmp_path: Path) -> None:
        stub = _make_stub(tmp_path)
        stub.ledger_doc.write_text("No version here\n", encoding="utf-8")
        violations = _run(tmp_path)
        assert any("ERH_DUR2_LEDGER_VERSION" in v for v in violations)
