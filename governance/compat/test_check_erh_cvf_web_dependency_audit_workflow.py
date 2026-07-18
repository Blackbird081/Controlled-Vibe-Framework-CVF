"""
Focused tests for check_erh_cvf_web_dependency_audit_workflow.py
"""

import json
import sys
import textwrap
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "governance/compat"))

import check_erh_cvf_web_dependency_audit_workflow as checker


VALID_WORKFLOW_CONTENT = textwrap.dedent("""
    # CVF ERH-AUD1 Dependency Audit Workflow Chain
    **Decision: `AUDIT_REDUCED_WITH_RESIDUALS`**
""")

VALID_LEDGER_CONTENT = textwrap.dedent("""
    # ERH-AUD1 Ledger
    ERH_AUD1_DECISION: AUDIT_REDUCED_WITH_RESIDUALS
    ERH_AUD1_LEDGER_VERSION: 2026-06-04
""")

VALID_PACKAGE_JSON = json.dumps({
    "dependencies": {"next-auth": "^5.0.0-beta.30", "next": "16.2.7"}
}, indent=2)


def make_mock_path(exists: bool, content: str = ""):
    m = MagicMock(spec=Path)
    m.exists.return_value = exists
    m.read_text.return_value = content
    m.relative_to.return_value = Path("mocked/path")
    return m


class TestWorkflowChain:
    def test_missing_workflow(self):
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(False)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, VALID_LEDGER_CONTENT)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, VALID_PACKAGE_JSON)),
        ):
            assert any("MISSING" in v for v in checker.check())

    def test_workflow_no_decision(self):
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, "# No decision")),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, VALID_LEDGER_CONTENT)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, VALID_PACKAGE_JSON)),
        ):
            assert any("NO_VALID_DECISION" in v for v in checker.check())

    def test_workflow_valid(self):
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, VALID_WORKFLOW_CONTENT)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, VALID_LEDGER_CONTENT)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, VALID_PACKAGE_JSON)),
        ):
            assert checker.check() == []


class TestLedger:
    def test_missing_ledger(self):
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, VALID_WORKFLOW_CONTENT)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(False)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, VALID_PACKAGE_JSON)),
        ):
            assert any("MISSING" in v for v in checker.check())

    def test_ledger_no_marker(self):
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, VALID_WORKFLOW_CONTENT)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, "# No marker")),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, VALID_PACKAGE_JSON)),
        ):
            assert any("NO_LEDGER_MARKER" in v for v in checker.check())


class TestNextAuthProtection:
    def test_next_auth_removed_triggers_violation(self):
        pkg = json.dumps({"dependencies": {"next": "16.2.7"}}, indent=2)
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, VALID_WORKFLOW_CONTENT)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, VALID_LEDGER_CONTENT)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, pkg)),
        ):
            assert any("NEXT_AUTH_BETA_MARKER_MISSING" in v for v in checker.check())

    def test_next_auth_stable_triggers_violation(self):
        pkg = json.dumps({"dependencies": {"next-auth": "^4.24.0"}}, indent=2)
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, VALID_WORKFLOW_CONTENT)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, VALID_LEDGER_CONTENT)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, pkg)),
        ):
            assert any("NEXT_AUTH_BETA_MARKER_MISSING" in v for v in checker.check())

    def test_next_auth_beta_present_ok(self):
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, VALID_WORKFLOW_CONTENT)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, VALID_LEDGER_CONTENT)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, VALID_PACKAGE_JSON)),
        ):
            assert checker.check() == []

    def test_package_json_absent_ok(self):
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, VALID_WORKFLOW_CONTENT)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, VALID_LEDGER_CONTENT)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(False)),
        ):
            assert checker.check() == []


class TestAllDecisionValues:
    @pytest.mark.parametrize("decision", [
        "AUDIT_CLEAN_PASS",
        "AUDIT_REDUCED_WITH_RESIDUALS",
        "AUDIT_BLOCKED_MAJOR_OR_RUNTIME",
        "AUDIT_BLOCKED_REGISTRY_OR_TESTS",
    ])
    def test_all_valid_decisions(self, decision):
        wf = f"**Decision: `{decision}`**"
        ld = f"ERH_AUD1_DECISION: {decision}"
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, wf)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, ld)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, VALID_PACKAGE_JSON)),
        ):
            assert checker.check() == []
