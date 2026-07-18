"""
Focused tests for check_erh_dependency_risk_workflow.py

Tests verify that the checker correctly identifies:
- present/absent workflow chain reference
- present/absent decision marker in reference
- present/absent ledger
- present/absent ledger machine marker
- next-auth beta marker presence/absence in package.json
"""

import sys
import json
import textwrap
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "governance/compat"))

import check_erh_dependency_risk_workflow as checker


VALID_DECISION_CONTENT = textwrap.dedent("""
    # CVF ERH-DEP1 Dependency Risk Workflow Chain
    Status: REVIEW_READY

    **Decision: `ACCEPT_WITH_CAVEAT`**

    Some other content.
""")

VALID_LEDGER_CONTENT = textwrap.dedent("""
    # CVF ERH-DEP1 Dependency Risk Ledger

    ERH_DEP1_DECISION: ACCEPT_WITH_CAVEAT
    ERH_DEP1_LEDGER_VERSION: 2026-06-04
""")

VALID_PACKAGE_JSON = json.dumps({
    "dependencies": {
        "next-auth": "^5.0.0-beta.30"
    }
}, indent=2)


def make_mock_path(exists: bool, content: str = ""):
    m = MagicMock(spec=Path)
    m.exists.return_value = exists
    m.read_text.return_value = content
    m.relative_to.return_value = Path("mocked/path")
    return m


class TestWorkflowChainReference:
    def test_missing_workflow_chain(self):
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(False)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, VALID_LEDGER_CONTENT)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, VALID_PACKAGE_JSON)),
        ):
            violations = checker.check(enforce=False)
        assert any("MISSING" in v for v in violations)

    def test_workflow_chain_no_decision(self):
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, "# No decision here")),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, VALID_LEDGER_CONTENT)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, VALID_PACKAGE_JSON)),
        ):
            violations = checker.check(enforce=False)
        assert any("NO_VALID_DECISION" in v for v in violations)

    def test_workflow_chain_valid_decision(self):
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, VALID_DECISION_CONTENT)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, VALID_LEDGER_CONTENT)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, VALID_PACKAGE_JSON)),
        ):
            violations = checker.check(enforce=False)
        assert violations == []


class TestLedger:
    def test_missing_ledger(self):
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, VALID_DECISION_CONTENT)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(False)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, VALID_PACKAGE_JSON)),
        ):
            violations = checker.check(enforce=False)
        assert any("MISSING" in v for v in violations)

    def test_ledger_no_marker(self):
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, VALID_DECISION_CONTENT)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, "# Ledger without marker")),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, VALID_PACKAGE_JSON)),
        ):
            violations = checker.check(enforce=False)
        assert any("NO_LEDGER_MARKER" in v for v in violations)


class TestPackageJsonMarker:
    def test_beta_marker_removed(self):
        pkg_no_beta = json.dumps({"dependencies": {"next-auth": "^4.24.0"}}, indent=2)
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, VALID_DECISION_CONTENT)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, VALID_LEDGER_CONTENT)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, pkg_no_beta)),
        ):
            violations = checker.check(enforce=False)
        assert any("NEXT_AUTH_BETA_MARKER_MISSING" in v for v in violations)

    def test_beta_marker_present(self):
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, VALID_DECISION_CONTENT)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, VALID_LEDGER_CONTENT)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, VALID_PACKAGE_JSON)),
        ):
            violations = checker.check(enforce=False)
        assert violations == []

    def test_package_json_missing_is_not_violation(self):
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, VALID_DECISION_CONTENT)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, VALID_LEDGER_CONTENT)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(False)),
        ):
            violations = checker.check(enforce=False)
        assert violations == []


class TestAllDecisionValues:
    @pytest.mark.parametrize("decision", [
        "ACCEPT_WITH_CAVEAT",
        "PUBLIC_CAVEAT_ONLY",
        "MIGRATION_REQUIRED_DEP2",
        "BLOCKED_NEEDS_OPERATOR",
    ])
    def test_all_valid_decisions_accepted(self, decision):
        content = f"**Decision: `{decision}`**"
        ledger = f"ERH_DEP1_DECISION: {decision}"
        with (
            patch.object(checker, "WORKFLOW_CHAIN_PATH", make_mock_path(True, content)),
            patch.object(checker, "LEDGER_PATH", make_mock_path(True, ledger)),
            patch.object(checker, "PACKAGE_JSON_PATH", make_mock_path(True, VALID_PACKAGE_JSON)),
        ):
            violations = checker.check(enforce=False)
        assert violations == []
