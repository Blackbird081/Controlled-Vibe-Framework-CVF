"""
Focused unit tests for check_erh_durable_evidence_policy_snapshot.py

Tests verify regex patterns and integration (live file presence).
ERH_DUR1_CHECKER_VERSION: 2026-06-05
"""

from __future__ import annotations

import sys
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "governance" / "compat"))

import check_erh_durable_evidence_policy_snapshot as checker


class TestControlPlanePatterns:
    def test_dur1_marker_matches(self) -> None:
        text = "# ERH_DUR1_MARKER: DURABLE_EVIDENCE_STORE_ACTIVE"
        assert checker.DUR1_MARKER.search(text) is not None

    def test_dur1_marker_no_match(self) -> None:
        text = "# some other comment"
        assert checker.DUR1_MARKER.search(text) is None

    def test_durable_evidence_version_matches(self) -> None:
        text = "* CVF_DURABLE_EVIDENCE_VERSION: 2026-06-05"
        assert checker.DURABLE_EVIDENCE_VERSION.search(text) is not None

    def test_os_tmpdir_detected(self) -> None:
        text = "path.join(os.tmpdir(), '.cvf-data', 'events.json')"
        assert checker.OS_TMPDIR_DEFAULT.search(text) is not None

    def test_os_tmpdir_not_present(self) -> None:
        text = "path.join(process.cwd(), '.cvf', 'runtime', 'events.json')"
        assert checker.OS_TMPDIR_DEFAULT.search(text) is None

    def test_dotcvf_runtime_path_matches_join_form(self) -> None:
        text = "path.join(process.cwd(), '.cvf', 'runtime', 'control-plane-events.json')"
        assert checker.DOTCVF_RUNTIME_PATH.search(text) is not None

    def test_dotcvf_runtime_path_matches_slash_form(self) -> None:
        text = "path.resolve('/app/.cvf/runtime/events.json')"
        assert checker.DOTCVF_RUNTIME_PATH.search(text) is not None

    def test_env_override_present(self) -> None:
        text = "process.env.CVF_CONTROL_PLANE_EVENTS_PATH"
        assert checker.CVF_EVENTS_ENV_OVERRIDE.search(text) is not None


class TestPolicySnapshotPatterns:
    def test_snapshot_registry_version_matches(self) -> None:
        text = "* CVF_POLICY_SNAPSHOT_REGISTRY_VERSION: 2026-06-05"
        assert checker.SNAPSHOT_REGISTRY_VERSION.search(text) is not None

    def test_generate_id_export_matches(self) -> None:
        text = "export function generatePolicySnapshotId(): string {"
        assert checker.GENERATE_ID_EXPORT.search(text) is not None

    def test_build_snapshot_export_matches(self) -> None:
        text = "export function buildPolicySnapshot(input: BuildPolicySnapshotInput): PolicySnapshotRecord {"
        assert checker.BUILD_SNAPSHOT_EXPORT.search(text) is not None

    def test_read_snapshot_export_matches(self) -> None:
        text = "export async function readPolicySnapshot(id: string): Promise<PolicySnapshotRecord | null> {"
        assert checker.READ_SNAPSHOT_EXPORT.search(text) is not None


class TestEnvelopePatterns:
    def test_policy_counter_detected(self) -> None:
        text = "let _policyCounter = 0;"
        assert checker.POLICY_COUNTER_LOCAL.search(text) is not None

    def test_policy_counter_absent(self) -> None:
        text = "export { generatePolicySnapshotId } from '@/lib/policy-snapshot-registry';"
        assert checker.POLICY_COUNTER_LOCAL.search(text) is None

    def test_envelope_reexport_matches(self) -> None:
        text = "export { generatePolicySnapshotId } from '@/lib/policy-snapshot-registry';"
        assert checker.ENVELOPE_REEXPORT.search(text) is not None


class TestDocPatterns:
    def test_dur1_workflow_decision_matches(self) -> None:
        text = "ERH_DUR1_DECISION: DUR2_NOT_NEEDED_NOW"
        assert checker.DUR1_WORKFLOW_DECISION.search(text) is not None

    def test_dur1_ledger_version_matches(self) -> None:
        text = "ERH_DUR1_LEDGER_VERSION: 2026-06-05"
        assert checker.DUR1_LEDGER_VERSION.search(text) is not None


class TestLiveIntegration:
    def test_live_checker_passes(self) -> None:
        violations: list[str] = []
        checker.check(violations)
        assert violations == [], f"Live check found violations: {violations}"
