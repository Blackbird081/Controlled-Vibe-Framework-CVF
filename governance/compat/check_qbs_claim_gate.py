#!/usr/bin/env python3
"""
CVF QBS Claim Gate Checker

Enforces the QBS methodology claim boundaries before any QBS result artifact
is published or any public quality claim is made:

1. Reviewer agreement gate: aggregate kappa/alpha must be >=0.60 for a public
   L4/L5 claim. Runs with kappa 0.40-0.59 are DIRECTIONAL_NOT_BOUNDED only.
   Runs with kappa <0.40 are INVALID.
2. Corpus power boundary: 48-task corpus supports aggregate claims only.
   Per-family rows must be labeled DIAGNOSTIC_ONLY unless a POWERED_FAMILY
   run exists for that family.
3. No-parity stop rule: result artifacts must not contain parity-claiming
   language without a new scored run meeting L4 thresholds.
4. Calibration anchor requirement: scored run artifacts must reference a
   calibration anchor packet recorded before scoring began.

Source authority:
  docs/benchmark/quality-benchmark-suite-methodology.md (public-sync)
  docs/benchmark/quality-benchmark-suite-claim-ladder.md (public-sync)
  docs/work_orders/CVF_WO_QBS_METHOD_RELIABILITY_REMEDIATION_2026-06-06.md
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

KAPPA_PASS_GATE = 0.60
KAPPA_DIRECTIONAL_GATE = 0.40

PARITY_CLAIM_PATTERNS: list[str] = [
    r"(CVF\s+(has|achieves?|proves?|demonstrates?)\s+output.quality parity)",
    r"(output.quality\s+(is\s+)?(at\s+)?parity\s+with\s+direct)",
    r"(parity\s+(is\s+)?proven\s+(for|with|against))",
    r"(proven.{0,20}parity\s+(for|with|against))",
    r"(CVF\s+.{0,40}(as good as|equivalent to)\s+direct\s+provider)",
    r"(F-1\s+(output.quality\s+parity\s+)?is\s+met)",
    r"(no\s+quality\s+(loss|tax|penalty|degradation)\s+(from|in|with)\s+CVF)",
]

FAMILY_CLAIM_PATTERNS: list[str] = [
    r"(per.family\s+(L4|L5)\s+(claim|quality claim|quality uplift))",
    r"(family.level\s+(L4|L5)\s+(claim|quality uplift|proven))",
    r"(L4|L5)\s+claim\s+(for|from|per)\s+(a\s+)?family",
]

# Filenames to skip for text-pattern checks (these describe boundaries, not make claims).
BOUNDARY_DOC_NAME_TOKENS = (
    "methodology", "claim-ladder", "claim-boundaries", "standard",
    "reviewer-plan", "reviewer-rubric", "scoring-rubric",
)

# ISO date on/after which every scored run and run-manifest must carry calibration_anchor_ref.
# Pre-standard exemption is date-based only; there is no filename-token fallback.
PRE_STANDARD_CUTOFF_DATE = "2026-06-07"

REQUIRED_AGGREGATE_LABEL = "DIAGNOSTIC_ONLY"

PARITY_RE = [re.compile(p, re.IGNORECASE) for p in PARITY_CLAIM_PATTERNS]
FAMILY_RE = [re.compile(p, re.IGNORECASE) for p in FAMILY_CLAIM_PATTERNS]

_DATE_PATTERN = re.compile(r"(\d{4})[-_]?(\d{2})[-_]?(\d{2})")


def _extract_run_date(data: dict) -> str | None:
    """Extract an ISO date (yyyy-mm-dd) from known QBS date and id fields.

    Checks explicit date fields first (run_date, started_at, completed_at,
    scored_at, produced_at — both snake_case and camelCase), then falls back
    to date patterns embedded in run_id / scored_run_id values.

    Returns None if no parseable date is found.  Callers must treat None as
    an unknown date and fail closed — not silently exempt the artifact.
    """
    date_keys = (
        "run_date", "runDate",
        "started_at", "startedAt",
        "completed_at", "completedAt",
        "scored_at", "scoredAt",
        "produced_at", "producedAt",
    )
    id_keys = ("run_id", "runId", "scored_run_id", "scoredRunId")

    for key in (*date_keys, *id_keys):
        val = data.get(key)
        if val:
            m = _DATE_PATTERN.search(str(val))
            if m:
                return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    return None


def _check_result_file(path: Path) -> list[str]:
    """Return list of violations found in a QBS result artifact."""
    violations: list[str] = []
    # Skip boundary-definition and plan documents — they describe the rules, not make claims.
    name_lower = path.name.lower()
    if any(tok in name_lower for tok in BOUNDARY_DOC_NAME_TOKENS):
        return violations

    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        return [f"UNREADABLE {path}: {exc}"]

    for pattern in PARITY_RE:
        m = pattern.search(text)
        if m:
            violations.append(
                f"PARITY_CLAIM in {path.name}: matched '{m.group()}' — "
                f"parity is not allowed without a new L4 scored run"
            )

    for pattern in FAMILY_RE:
        m = pattern.search(text)
        if m:
            violations.append(
                f"FAMILY_CLAIM in {path.name}: matched '{m.group()}' — "
                f"per-family quality claims require POWERED_FAMILY run (>=30 tasks/family)"
            )

    return violations


SCORED_RUN_RESULT_KEYS = frozenset({
    "aggregate_kappa", "aggregateKappa",
    "claim_level", "claimLevel",
    "scored_run_id", "scoredRunId",
    "verdict",
    "gate_results", "gateResults",
})

# Files whose name contains these tokens are configuration/plan artifacts, not results.
# NOTE: "manifest" is intentionally absent — it is too broad and would incorrectly
# exclude run-manifest.json (a scored-run output that must carry calibration_anchor_ref).
MANIFEST_NAME_TOKENS = (
    "preregistration", "provider-model", "config-prompt",
    "adjudicator", "anchor", "corpus", "rubric", "reviewer-plan",
    "calibration-reference", "calibration-anchors",
)


def _is_scored_run_result(path: Path, data: dict) -> bool:
    """Return True only if the JSON looks like a scored-run result (not a config/provider manifest)."""
    name_lower = path.name.lower()
    if any(tok in name_lower for tok in MANIFEST_NAME_TOKENS):
        return False
    return bool(SCORED_RUN_RESULT_KEYS & set(data.keys()))


def _check_json_result(path: Path) -> list[str]:
    """Validate kappa gate and aggregate label in a QBS JSON result."""
    violations: list[str] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"JSON_ERROR {path}: {exc}"]

    if not isinstance(data, dict):
        return []

    # Only apply scored-run checks to actual result artifacts, not manifests.
    is_result = _is_scored_run_result(path, data)

    kappa = data.get("aggregate_kappa") or data.get("aggregateKappa")
    rho = data.get("aggregate_rho") or data.get("aggregateRho")
    run_class = data.get("run_class") or data.get("runClass", "")
    claim_level = data.get("claim_level") or data.get("claimLevel", "")
    calibration_anchor_ref = (
        data.get("calibration_anchor_ref")
        or data.get("calibrationAnchorRef")
        or data.get("calibration_anchor_packet")
    )

    if kappa is not None and is_result:
        try:
            kappa_val = float(kappa)
        except (ValueError, TypeError):
            violations.append(f"KAPPA_PARSE_ERROR in {path.name}: cannot parse kappa={kappa!r}")
            kappa_val = None

        if kappa_val is not None:
            if kappa_val < KAPPA_DIRECTIONAL_GATE:
                violations.append(
                    f"KAPPA_INVALID in {path.name}: aggregate_kappa={kappa_val:.4f} < "
                    f"{KAPPA_DIRECTIONAL_GATE} — run is INVALID, no public claim allowed"
                )
            elif kappa_val < KAPPA_PASS_GATE:
                public_claim_levels = {"L4", "L5", "L6", "PASS_STRONG"}
                if any(lvl in str(claim_level).upper() for lvl in public_claim_levels):
                    violations.append(
                        f"KAPPA_BELOW_GATE in {path.name}: aggregate_kappa={kappa_val:.4f} < "
                        f"{KAPPA_PASS_GATE} but claim_level={claim_level!r} asserts L4/L5/L6 — "
                        f"only DIRECTIONAL_NOT_BOUNDED allowed at this agreement level"
                    )

    if is_result and run_class in ("POWERED_SINGLE_PROVIDER", "CALIBRATION_PILOT"):
        family_results = data.get("family_results") or data.get("familyResults") or {}
        for family_name, family_data in (family_results.items() if isinstance(family_results, dict) else []):
            label = ""
            if isinstance(family_data, dict):
                label = (
                    family_data.get("claim_label")
                    or family_data.get("claimLabel")
                    or ""
                )
            if label.upper() not in ("DIAGNOSTIC_ONLY", "DIAGNOSTIC", "EXPLORATORY_ONLY"):
                violations.append(
                    f"FAMILY_LABEL_MISSING in {path.name}: family '{family_name}' lacks "
                    f"DIAGNOSTIC_ONLY label — per-family rows in a POWERED_SINGLE_PROVIDER run "
                    f"must be labeled DIAGNOSTIC_ONLY"
                )

    # Calibration anchor check: applies to scored-run results AND to run-manifest files
    # (the standard requires run-manifest to carry calibration_anchor_ref).
    # Three outcomes — fail closed when date is indeterminate; no filename-token fallback.
    is_run_manifest = "run-manifest" in path.name.lower()
    if is_result or is_run_manifest:
        if calibration_anchor_ref:
            pass  # anchor present — no violation
        else:
            run_date = _extract_run_date(data)
            if run_date is None:
                violations.append(
                    f"CALIBRATION_ANCHOR_MISSING_OR_DATE_UNKNOWN in {path.name}: "
                    f"no calibration_anchor_ref and no parseable run date "
                    f"(checked run_date, started_at, completed_at, scored_at, "
                    f"produced_at, run_id) — add calibration_anchor_ref or a "
                    f"recognised date field"
                )
            elif run_date >= PRE_STANDARD_CUTOFF_DATE:
                violations.append(
                    f"CALIBRATION_ANCHOR_MISSING in {path.name}: no calibration_anchor_ref — "
                    f"scored runs on/after {PRE_STANDARD_CUTOFF_DATE} must reference "
                    f"a pre-run calibration anchor packet"
                )
            # else: run_date < PRE_STANDARD_CUTOFF_DATE — pre-standard legacy file, exempt

    return violations


def _scan_directory(target_dir: Path) -> tuple[list[str], int]:
    """Scan a directory for QBS result artifacts and return violations + file count."""
    violations: list[str] = []
    scanned = 0

    result_patterns = ["*.json", "*.md"]
    for pattern in result_patterns:
        for f in sorted(target_dir.rglob(pattern)):
            name_lower = f.name.lower()
            if not any(
                kw in name_lower
                for kw in ("qbs", "benchmark", "scored", "result", "run-manifest", "claim")
            ):
                continue
            scanned += 1
            if f.suffix == ".json":
                violations.extend(_check_json_result(f))
            else:
                violations.extend(_check_result_file(f))

    return violations, scanned


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="CVF QBS Claim Gate — enforces reviewer agreement, aggregate-only power boundary, and no-parity stop rule"
    )
    parser.add_argument(
        "--result-file",
        action="append",
        dest="result_files",
        default=[],
        metavar="PATH",
        help="Explicit QBS result file to check (JSON or Markdown). May be repeated.",
    )
    parser.add_argument(
        "--scan-dir",
        default=None,
        metavar="DIR",
        help="Directory to scan recursively for QBS result artifacts. Defaults to docs/benchmark/runs/ if it exists.",
    )
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Exit non-zero on any violation (default: report only).",
    )
    parser.add_argument(
        "--kappa",
        type=float,
        default=None,
        metavar="VALUE",
        help="Check a standalone kappa value against the claim gate without a file.",
    )
    parser.add_argument(
        "--claim-level",
        default=None,
        metavar="LEVEL",
        help="Claim level asserted with --kappa (e.g. L4, L5, DIRECTIONAL_NOT_BOUNDED).",
    )
    args = parser.parse_args(argv)

    violations: list[str] = []
    scanned = 0

    if args.kappa is not None:
        kappa_val = args.kappa
        claim_level = (args.claim_level or "").upper()
        if kappa_val < KAPPA_DIRECTIONAL_GATE:
            violations.append(
                f"KAPPA_INVALID: kappa={kappa_val:.4f} < {KAPPA_DIRECTIONAL_GATE} — INVALID, no public claim allowed"
            )
        elif kappa_val < KAPPA_PASS_GATE:
            public_claim_levels = {"L4", "L5", "L6", "PASS_STRONG"}
            if any(lvl in claim_level for lvl in public_claim_levels):
                violations.append(
                    f"KAPPA_BELOW_GATE: kappa={kappa_val:.4f} < {KAPPA_PASS_GATE} — "
                    f"claim_level={args.claim_level!r} is not allowed; use DIRECTIONAL_NOT_BOUNDED"
                )
            else:
                print(f"INFO: kappa={kappa_val:.4f} — allowed as DIRECTIONAL_NOT_BOUNDED only", flush=True)
        else:
            print(f"INFO: kappa={kappa_val:.4f} — passes public claim gate (>={KAPPA_PASS_GATE})", flush=True)
        scanned += 1

    for raw in args.result_files:
        f = Path(raw)
        if not f.is_absolute():
            f = REPO_ROOT / f
        if not f.exists():
            violations.append(f"FILE_NOT_FOUND: {f}")
            continue
        scanned += 1
        if f.suffix == ".json":
            violations.extend(_check_json_result(f))
        else:
            violations.extend(_check_result_file(f))

    if args.scan_dir:
        scan_path = Path(args.scan_dir)
        if not scan_path.is_absolute():
            scan_path = REPO_ROOT / scan_path
        v, n = _scan_directory(scan_path)
        violations.extend(v)
        scanned += n
    elif not args.result_files and args.kappa is None:
        default_runs = REPO_ROOT / "docs" / "benchmark" / "runs"
        if default_runs.exists():
            v, n = _scan_directory(default_runs)
            violations.extend(v)
            scanned += n

    if violations:
        print(f"FAIL: {len(violations)} QBS claim gate violation(s) across {scanned} artifact(s):", flush=True)
        for v in violations:
            print(f"  - {v}", flush=True)
        if args.enforce:
            return 1
        print("(reporting only — pass --enforce to fail on violations)", flush=True)
        return 0

    print(
        f"PASS: QBS claim gate check passed — {scanned} artifact(s) checked, "
        f"0 violations",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
