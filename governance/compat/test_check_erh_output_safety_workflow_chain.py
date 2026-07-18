#!/usr/bin/env python3
"""
Focused tests for check_erh_output_safety_workflow_chain.py

Tests verify the checker correctly flags missing SAF2 markers, exports,
audit events, and document artifacts.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "governance/compat"))

from check_erh_output_safety_workflow_chain import (  # noqa: E402
    SAF2_MARKER,
    GOVERNANCE_PATTERNS_EXPORT,
    IS_GOVERNANCE_UNSAFE_EXPORT,
    OUTPUT_SAFETY_TRIGGERED,
    OUTPUT_VALIDATION_EXHAUSTED,
    OUTPUT_SAFETY_EMIT_HELPER,
    OUTPUT_SAFETY_EMIT_GUARD,
    OUTPUT_SAFETY_EMIT_CALL,
    REGRESSION_CORPUS_MARKER,
    SAF2_WORKFLOW_MARKER,
    SAF2_LEDGER_MARKER,
    _triggered_before_exhausted,
    check,
)


# ─── Pattern unit tests ────────────────────────────────────────────────────


def test_saf2_marker_matches_exact():
    text = "// ERH_SAF2_MARKER: GOVERNANCE_OUTPUT_SAFETY_ACTIVE"
    assert SAF2_MARKER.search(text) is not None


def test_saf2_marker_case_insensitive():
    text = "// erh_saf2_marker: governance_output_safety_active"
    assert SAF2_MARKER.search(text) is not None


def test_saf2_marker_not_partial():
    text = "// ERH_SAF2_MARKER: SOMETHING_ELSE"
    assert SAF2_MARKER.search(text) is None


def test_governance_patterns_export_matches():
    text = "export const GOVERNANCE_OUTPUT_PATTERNS: RegExp[] = ["
    assert GOVERNANCE_PATTERNS_EXPORT.search(text) is not None


def test_is_governance_unsafe_export_matches():
    text = "export function isGovernanceOutputUnsafe(output: string): boolean {"
    assert IS_GOVERNANCE_UNSAFE_EXPORT.search(text) is not None


def test_output_safety_triggered_matches():
    text = "eventType: 'OUTPUT_SAFETY_TRIGGERED',"
    assert OUTPUT_SAFETY_TRIGGERED.search(text) is not None


def test_output_safety_emit_helper_matches():
    text = "const emitOutputSafetyTriggered = async (validation, result) => {"
    assert OUTPUT_SAFETY_EMIT_HELPER.search(text) is not None


def test_output_safety_emit_guard_matches():
    text = "if (outputSafetyAuditEmitted || !validation.issues.includes('UNSAFE_CONTENT')) return;"
    assert OUTPUT_SAFETY_EMIT_GUARD.search(text) is not None


def test_output_safety_emit_call_matches():
    text = "await emitOutputSafetyTriggered(outputValidation, aiResult);"
    assert OUTPUT_SAFETY_EMIT_CALL.search(text) is not None


def test_regression_corpus_marker_matches():
    text = "// ERH_SAF2_REGRESSION_CORPUS_MARKER: ACTIVE"
    assert REGRESSION_CORPUS_MARKER.search(text) is not None


def test_saf2_workflow_marker_matches():
    text = "ERH_SAF2_DECISION: ACCEPT"
    assert SAF2_WORKFLOW_MARKER.search(text) is not None


def test_saf2_ledger_marker_matches():
    text = "ERH_SAF2_LEDGER_VERSION: 2026-06-05"
    assert SAF2_LEDGER_MARKER.search(text) is not None


# ─── _triggered_before_exhausted ──────────────────────────────────────────


def test_triggered_before_exhausted_pass():
    text = (
        "...OUTPUT_SAFETY_TRIGGERED audit event..."
        "...retry loop..."
        "...OUTPUT_VALIDATION_EXHAUSTED after retry..."
    )
    ok, msg = _triggered_before_exhausted(text)
    assert ok is True
    assert msg == ""


def test_triggered_after_exhausted_fail():
    text = (
        "...OUTPUT_VALIDATION_EXHAUSTED after retry..."
        "...OUTPUT_SAFETY_TRIGGERED audit event..."
    )
    ok, msg = _triggered_before_exhausted(text)
    assert ok is False
    assert "must fire before retry exhaustion" in msg


def test_triggered_missing_fail():
    text = "...OUTPUT_VALIDATION_EXHAUSTED..."
    ok, msg = _triggered_before_exhausted(text)
    assert ok is False
    assert "OUTPUT_SAFETY_TRIGGERED not found" in msg


def test_exhausted_missing_fail():
    text = "...OUTPUT_SAFETY_TRIGGERED..."
    ok, msg = _triggered_before_exhausted(text)
    assert ok is False
    assert "OUTPUT_VALIDATION_EXHAUSTED not found" in msg


# ─── Integration: live repo files ─────────────────────────────────────────


def test_live_check_returns_zero_violations():
    """
    With SAF2 fully implemented, the checker must report zero violations
    against the live repository files.
    """
    violations: list[str] = []
    check(violations)
    assert violations == [], f"Unexpected violations: {violations}"
