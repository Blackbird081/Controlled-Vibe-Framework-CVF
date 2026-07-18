"""
Focused tests for check_erh_safety_workflow_chain.py (ERH-SAF1).
"""

import sys
import importlib
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "governance/compat"))
checker = importlib.import_module("check_erh_safety_workflow_chain")


def _run(files: dict[str, str | None]) -> list[str]:
    """Patch file existence and content, return violations."""
    def exists_side_effect(self: Path) -> bool:
        key = str(self.relative_to(REPO_ROOT)).replace("\\", "/")
        return key in files and files[key] is not None

    def read_text_side_effect(self: Path, **kwargs: object) -> str:
        key = str(self.relative_to(REPO_ROOT)).replace("\\", "/")
        val = files.get(key)
        if val is None:
            raise FileNotFoundError(key)
        return val

    with patch.object(Path, "exists", exists_side_effect), \
         patch.object(Path, "read_text", read_text_side_effect):
        violations: list[str] = []
        checker.check(violations)
        return violations


WF_KEY = "docs/reference/CVF_ERH_SAF1_SAFETY_WORKFLOW_CHAIN_2026-06-04.md"
LEDGER_KEY = "docs/reference/CVF_ERH_SAF1_SAFETY_WORKFLOW_LEDGER_2026-06-04.md"
HELPER_KEY = "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/safety-workflow-chain.ts"
ROUTE_KEY = "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts"
STATUS_KEY = "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/safety-status.ts"

GOOD_WF = "ERH_SAF1_DECISION: ACTIVE\nSome content."
GOOD_LEDGER = "ERH_SAF1_LEDGER_VERSION: 2026-06-04\nSome content."
GOOD_HELPER = "ERH_SAF1_MARKER: SAFETY_WORKFLOW_CHAIN_ACTIVE\nexport function runSafetyWorkflowChain(){}"
GOOD_ROUTE = (
    "import { runSafetyWorkflowChain } from '@/lib/safety-workflow-chain';\n"
    "const dlp = applyDLPFilter(text);\n"
    "const r = runSafetyWorkflowChain(dlp.filteredText);\n"
    "const safety = applySafetyFilters(saf1Result.sanitized);\n"
    "const routed = routeWebProvider(provider);\n"
)
GOOD_STATUS = "'use client';\nexport function foo(){}"


def _all_good() -> dict[str, str | None]:
    return {
        WF_KEY: GOOD_WF,
        LEDGER_KEY: GOOD_LEDGER,
        HELPER_KEY: GOOD_HELPER,
        ROUTE_KEY: GOOD_ROUTE,
        STATUS_KEY: GOOD_STATUS,
    }


def test_all_good_no_violations() -> None:
    assert _run(_all_good()) == []


def test_missing_workflow_doc() -> None:
    files = _all_good()
    files[WF_KEY] = None
    v = _run(files)
    assert any("missing workflow-chain reference" in x for x in v)


def test_missing_workflow_marker() -> None:
    files = _all_good()
    files[WF_KEY] = "No marker here."
    v = _run(files)
    assert any("ERH_SAF1_DECISION marker" in x for x in v)


def test_missing_ledger() -> None:
    files = _all_good()
    files[LEDGER_KEY] = None
    v = _run(files)
    assert any("missing safety ledger" in x for x in v)


def test_missing_ledger_marker() -> None:
    files = _all_good()
    files[LEDGER_KEY] = "No marker here."
    v = _run(files)
    assert any("ERH_SAF1_LEDGER_VERSION marker" in x for x in v)


def test_missing_helper() -> None:
    files = _all_good()
    files[HELPER_KEY] = None
    v = _run(files)
    assert any("missing SAF1 helper" in x for x in v)


def test_helper_missing_marker() -> None:
    files = _all_good()
    files[HELPER_KEY] = "export function runSafetyWorkflowChain(){}"
    v = _run(files)
    assert any("ERH_SAF1_MARKER" in x for x in v)


def test_route_missing_import() -> None:
    files = _all_good()
    files[ROUTE_KEY] = "const r = runSafetyWorkflowChain(text);\n"
    v = _run(files)
    assert any("does not import safety-workflow-chain" in x for x in v)


def test_route_missing_call() -> None:
    files = _all_good()
    files[ROUTE_KEY] = (
        "import { runSafetyWorkflowChain } from '@/lib/safety-workflow-chain';\n"
        "const dlp = applyDLPFilter(text);\n"
        "const safety = applySafetyFilters(saf1Result.sanitized);\n"
        "const routed = routeWebProvider(provider);\n"
    )
    v = _run(files)
    assert any("does not call runSafetyWorkflowChain" in x for x in v)


def test_route_direct_import_safety_status_blocked() -> None:
    files = _all_good()
    files[ROUTE_KEY] = (
        GOOD_ROUTE
        + "import { sanitizePrompt } from '@/lib/safety-status';\n"
    )
    v = _run(files)
    assert any("directly imports client-only safety-status.ts" in x for x in v)


def test_route_order_blocks_provider_before_saf1() -> None:
    files = _all_good()
    files[ROUTE_KEY] = (
        "import { runSafetyWorkflowChain } from '@/lib/safety-workflow-chain';\n"
        "const dlp = applyDLPFilter(text);\n"
        "const routed = routeWebProvider(provider);\n"
        "const r = runSafetyWorkflowChain(dlp.filteredText);\n"
        "const safety = applySafetyFilters(saf1Result.sanitized);\n"
    )
    v = _run(files)
    assert any("SAF1 order is invalid" in x for x in v)


def test_route_order_blocks_legacy_safety_before_saf1() -> None:
    files = _all_good()
    files[ROUTE_KEY] = (
        "import { runSafetyWorkflowChain } from '@/lib/safety-workflow-chain';\n"
        "const dlp = applyDLPFilter(text);\n"
        "const safety = applySafetyFilters(saf1Result.sanitized);\n"
        "const r = runSafetyWorkflowChain(dlp.filteredText);\n"
        "const routed = routeWebProvider(provider);\n"
    )
    v = _run(files)
    assert any("SAF1 order is invalid" in x for x in v)


def test_safety_status_lost_use_client() -> None:
    files = _all_good()
    files[STATUS_KEY] = "export function foo(){}"
    v = _run(files)
    assert any("lost 'use client' directive" in x for x in v)
