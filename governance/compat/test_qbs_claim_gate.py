#!/usr/bin/env python3
"""
QBS Claim Gate — fixture self-tests (QBS-GATE1)

Five required fixture cases per the work order acceptance criteria:

  F1  future run-manifest with started_at >= 2026-06-07 and no
      calibration_anchor_ref  →  FAIL (CALIBRATION_ANCHOR_MISSING)

  F2  future aggregate-results with run_id embedding date >= 2026-06-07 and no
      calibration_anchor_ref  →  FAIL (CALIBRATION_ANCHOR_MISSING)

  F3  date-unknown scored result (no parseable date anywhere) and no
      calibration_anchor_ref  →  FAIL (CALIBRATION_ANCHOR_MISSING_OR_DATE_UNKNOWN)

  F4  pre-standard dated legacy result (date < 2026-06-07) and no
      calibration_anchor_ref  →  PASS (exempt)

  F5  future result with calibration_anchor_ref present  →  PASS

All tests run inline — no external dependencies, no network calls.
"""

from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

# Allow importing the checker from the same compat directory.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from check_qbs_claim_gate import _check_json_result  # noqa: E402


def _write_tmp(data: dict) -> Path:
    """Write dict to a temp JSON file and return its Path."""
    tmp = tempfile.NamedTemporaryFile(
        suffix=".json", delete=False, mode="w", encoding="utf-8"
    )
    json.dump(data, tmp)
    tmp.flush()
    tmp.close()
    return Path(tmp.name)


# ---------------------------------------------------------------------------
# Fixture helpers
# ---------------------------------------------------------------------------

def _future_run_manifest() -> dict:
    """F1 — run-manifest with started_at on the cutoff date, no anchor."""
    return {
        "run_id": "qbs-test-future-run",
        "started_at": "2026-06-07T10:00:00+00:00",
        "verdict": "PASS",
        "aggregate_kappa": 0.72,
        "claim_level": "DIRECTIONAL_NOT_BOUNDED",
    }


def _future_aggregate_run_id() -> dict:
    """F2 — aggregate-results whose run_id embeds date >= cutoff, no anchor."""
    return {
        "run_id": "qbs1-powered-single-provider-20260608-test",
        "aggregate_kappa": 0.72,
        "claim_level": "DIRECTIONAL_NOT_BOUNDED",
        "verdict": "PASS",
        "scored_run_id": "qbs1-powered-single-provider-20260608-test",
    }


def _date_unknown_scored() -> dict:
    """F3 — scored result with no parseable date anywhere, no anchor."""
    return {
        "aggregate_kappa": 0.72,
        "claim_level": "DIRECTIONAL_NOT_BOUNDED",
        "verdict": "PASS",
        "scored_run_id": "no-date-in-this-id",
    }


def _legacy_pre_standard() -> dict:
    """F4 — pre-standard scored result (date 2026-05-10), no anchor."""
    return {
        "run_id": "qbs1-powered-single-provider-20260510-alibaba-r5",
        "started_at": "2026-05-10T06:47:39.217604+00:00",
        "aggregate_kappa": 0.72,
        "claim_level": "DIRECTIONAL_NOT_BOUNDED",
        "verdict": "PASS",
        "scored_run_id": "qbs1-powered-single-provider-20260510-alibaba-r5",
    }


def _future_with_anchor() -> dict:
    """F5 — future scored result with calibration_anchor_ref present."""
    return {
        "run_id": "qbs1-powered-single-provider-20260608-alibaba-r8",
        "started_at": "2026-06-08T08:00:00+00:00",
        "aggregate_kappa": 0.72,
        "claim_level": "DIRECTIONAL_NOT_BOUNDED",
        "verdict": "PASS",
        "scored_run_id": "qbs1-powered-single-provider-20260608-alibaba-r8",
        "calibration_anchor_ref": "docs/benchmark/qbs-1/calibration-anchors-standard.md",
    }


# ---------------------------------------------------------------------------
# Test runner
# ---------------------------------------------------------------------------

def _assert_violation_contains(violations: list[str], token: str, label: str) -> None:
    matches = [v for v in violations if token in v]
    if not matches:
        print(f"  FAIL  {label}: expected violation containing '{token}', got: {violations!r}")
        raise AssertionError(label)
    print(f"  PASS  {label}")


def _assert_no_violations(violations: list[str], label: str) -> None:
    if violations:
        print(f"  FAIL  {label}: expected 0 violations, got: {violations!r}")
        raise AssertionError(label)
    print(f"  PASS  {label}")


def run_fixtures() -> int:
    failures = 0

    # F1 — future run-manifest missing anchor → CALIBRATION_ANCHOR_MISSING
    print("F1: future run-manifest, no anchor, date >= cutoff")
    p = _write_tmp(_future_run_manifest())
    # Rename to match run-manifest pattern expected by the checker.
    target = p.parent / "run-manifest.json"
    p.rename(target)
    try:
        v = _check_json_result(target)
        try:
            _assert_violation_contains(v, "CALIBRATION_ANCHOR_MISSING", "F1")
        except AssertionError:
            failures += 1
    finally:
        target.unlink(missing_ok=True)

    # F2 — future aggregate-results via run_id date, no anchor
    print("F2: future aggregate-results (run_id date >= cutoff), no anchor")
    p = _write_tmp(_future_aggregate_run_id())
    target = p.parent / "aggregate-results.json"
    p.rename(target)
    try:
        v = _check_json_result(target)
        try:
            _assert_violation_contains(v, "CALIBRATION_ANCHOR_MISSING", "F2")
        except AssertionError:
            failures += 1
    finally:
        target.unlink(missing_ok=True)

    # F3 — date-unknown scored result → CALIBRATION_ANCHOR_MISSING_OR_DATE_UNKNOWN
    print("F3: date-unknown scored result, no anchor")
    p = _write_tmp(_date_unknown_scored())
    target = p.parent / "scored-results.json"
    p.rename(target)
    try:
        v = _check_json_result(target)
        try:
            _assert_violation_contains(v, "CALIBRATION_ANCHOR_MISSING_OR_DATE_UNKNOWN", "F3")
        except AssertionError:
            failures += 1
    finally:
        target.unlink(missing_ok=True)

    # F4 — pre-standard legacy result → no violation (exempt)
    print("F4: pre-standard legacy result (2026-05-10), no anchor -- should pass")
    p = _write_tmp(_legacy_pre_standard())
    target = p.parent / "aggregate-results.json"
    p.rename(target)
    try:
        v = _check_json_result(target)
        try:
            _assert_no_violations(v, "F4")
        except AssertionError:
            failures += 1
    finally:
        target.unlink(missing_ok=True)

    # F5 — future result with anchor → no violation
    print("F5: future result with calibration_anchor_ref -- should pass")
    p = _write_tmp(_future_with_anchor())
    target = p.parent / "aggregate-results.json"
    p.rename(target)
    try:
        v = _check_json_result(target)
        try:
            _assert_no_violations(v, "F5")
        except AssertionError:
            failures += 1
    finally:
        target.unlink(missing_ok=True)

    print()
    if failures:
        print(f"FAIL: {failures}/5 fixture(s) failed")
        return 1
    print("PASS: 5/5 QBS claim gate fixtures passed")
    return 0


if __name__ == "__main__":
    sys.exit(run_fixtures())
