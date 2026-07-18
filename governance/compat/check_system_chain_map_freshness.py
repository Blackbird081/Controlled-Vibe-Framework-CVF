#!/usr/bin/env python3
"""
CVF System Chain Map Freshness Checker

Validates that docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json, its
live-proof coverage ledger, and its docs/reference/system_chain/README.md
companion remain fresh: every
fingerprinted source still exists and matches its recorded SHA-256, the
Markdown and JSON lane records agree, and the map's last-verified date is
within its maximum review age.

This checker is strictly read-only. It detects drift and age expiry; it
never writes the map, its fingerprints, its verdicts, session state, or any
source file. Only a governed review may change a lane's semantic verdict.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]

MAP_PATH = "docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json"
README_PATH = "docs/reference/system_chain/README.md"
STANDARD_PATH = "docs/reference/system_chain/CVF_SYSTEM_CHAIN_FRESHNESS_STANDARD.md"
COVERAGE_PATH = "docs/reference/system_chain/CVF_SYSTEM_CHAIN_LIVE_PROOF_COVERAGE.json"

THIS_CHECKER_PATH = "governance/compat/check_system_chain_map_freshness.py"

REQUIRED_TOP_KEYS = (
    "schemaVersion",
    "mapId",
    "sourceAudit",
    "reviewerCompletion",
    "lastVerifiedDate",
    "maxAgeDays",
    "reminderPolicy",
    "auditManifestFingerprint",
    "auditEvidenceFingerprint",
    "reviewerCompletionFingerprint",
    "lanes",
)
REQUIRED_LANE_KEYS = (
    "laneId",
    "laneOrder",
    "planeRange",
    "currentPosture",
    "verdict",
    "implementedBy",
    "invokedBy",
    "testedBy",
    "evidenceOwner",
    "operatorSurface",
    "knownGaps",
    "nextReviewAction",
    "sourceFingerprints",
)
ALLOWED_POSTURES = ("CURRENT", "PARTIAL", "HISTORICAL", "FUTURE")
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
EXPECTED_LANE_COUNT = 5

CANONICAL_LANE_IDS = (
    "DOCTRINE_TO_CONTRACT",
    "CONTRACT_TO_RUNTIME",
    "RUNTIME_TO_ENFORCEMENT",
    "ENFORCEMENT_TO_EVIDENCE",
    "EVIDENCE_TO_OPERATOR_SURFACE",
)
CANONICAL_LANE_ORDERS = (1, 2, 3, 4, 5)

COVERAGE_REQUIRED_TOP_KEYS = (
    "schemaVersion",
    "ledgerId",
    "standard",
    "sourceMap",
    "lastReviewedDate",
    "claimBoundary",
    "useCases",
    "lanes",
)
COVERAGE_REQUIRED_LANE_KEYS = (
    "laneId",
    "semanticPosture",
    "semanticVerdict",
    "liveApplicability",
    "requiredProofClass",
    "observedProofClass",
    "operationalProofStatus",
    "reason",
    "nextUseCase",
    "nextAction",
)
ALLOWED_LIVE_APPLICABILITY = (
    "STATIC_RECOMPUTE_REQUIRED",
    "RUNTIME_LIVE_REQUIRED",
    "OPERATOR_SURFACE_LIVE_REQUIRED",
    "PROVIDER_LIVE_REQUIRED",
    "FIELD_VALIDATION_REQUIRED",
)
ALLOWED_PROOF_CLASSES = (
    "STATIC_SOURCE_VERIFIED",
    "LOCAL_DETERMINISTIC_EXECUTION",
    "MOCK_OR_SIMULATED_EXECUTION",
    "CURRENT_RUNTIME_INVOCATION",
    "REAL_PROVIDER_BOUNDED",
    "REAL_USER_OBSERVED",
)
ALLOWED_OPERATIONAL_STATUSES = (
    "PROVEN",
    "PARTIAL",
    "MISSING",
    "STALE",
    "NOT_APPLICABLE_STATIC_WITH_REASON",
)

TOP_LEVEL_FINGERPRINT_KEYS = (
    "auditManifestFingerprint",
    "auditEvidenceFingerprint",
    "reviewerCompletionFingerprint",
)

WIRING_TARGETS = (
    ("governance/compat/agent_autorun_command_catalog.py", "autorun common commands"),
    ("governance/compat/local_governance_hook_catalog_pre_commit.py", "pre-commit hook catalog"),
    ("governance/compat/local_governance_hook_catalog_pre_push.py", "pre-push hook catalog"),
    ("governance/compat/local_governance_hook_catalog_reviewer_fast.py", "reviewer-fast hook catalog"),
    (".github/workflows/documentation-testing.yml", "documentation CI workflow"),
    (".github/workflows/system-chain-map-freshness.yml", "weekly freshness reminder workflow"),
)


def _read_json(path: Path) -> tuple[dict[str, Any] | None, str | None]:
    if not path.exists():
        return None, f"missing file: {path}"
    try:
        text = path.read_text(encoding="utf-8", errors="strict")
    except UnicodeDecodeError as exc:
        return None, f"UTF-8 decode error reading {path}: {exc}"
    try:
        return json.loads(text), None
    except json.JSONDecodeError as exc:
        return None, f"invalid JSON in {path}: {exc}"


def _read_text(path: Path) -> tuple[str | None, str | None]:
    if not path.exists():
        return None, f"missing file: {path}"
    try:
        return path.read_text(encoding="utf-8", errors="strict"), None
    except UnicodeDecodeError as exc:
        return None, f"UTF-8 decode error reading {path}: {exc}"


def _sha256_of(path: Path) -> str | None:
    if not path.exists() or path.is_dir():
        return None
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _validate_fingerprint_entry(label: str, fp: Any, issues: list[str]) -> None:
    """Validate one path/sha256/evidenceRole fingerprint record, appending issues."""
    if not isinstance(fp, dict):
        issues.append(f"schema: {label} is not an object")
        return
    sha = fp.get("sha256", "")
    if not SHA256_RE.match(str(sha)):
        issues.append(
            f"schema: {label} fingerprint for `{fp.get('path')}` "
            f"has malformed sha256 `{sha}`"
        )
    if not fp.get("path"):
        issues.append(f"schema: {label} has a fingerprint with no path")
    if not fp.get("evidenceRole"):
        issues.append(f"schema: {label} has a fingerprint with no evidenceRole")


def validate_schema(doc: dict[str, Any]) -> list[str]:
    """Return schema-shape violations: missing keys, bad enums, malformed hashes."""
    issues: list[str] = []

    for key in REQUIRED_TOP_KEYS:
        if key not in doc:
            issues.append(f"schema: missing required top-level key `{key}`")

    for key in TOP_LEVEL_FINGERPRINT_KEYS:
        if key in doc:
            _validate_fingerprint_entry(f"top-level `{key}`", doc[key], issues)

    lanes = doc.get("lanes")
    if not isinstance(lanes, list):
        issues.append("schema: `lanes` must be a list")
        return issues

    if len(lanes) != EXPECTED_LANE_COUNT:
        issues.append(
            f"schema: expected exactly {EXPECTED_LANE_COUNT} lanes, found {len(lanes)}"
        )

    seen_ids: set[str] = set()
    actual_ids: list[str] = []
    actual_orders: list[Any] = []
    for idx, lane in enumerate(lanes):
        if not isinstance(lane, dict):
            issues.append(f"schema: lane at index {idx} is not an object")
            continue
        for key in REQUIRED_LANE_KEYS:
            if key not in lane:
                issues.append(f"schema: lane {idx} missing required key `{key}`")

        lane_id = lane.get("laneId")
        actual_ids.append(lane_id)
        actual_orders.append(lane.get("laneOrder"))
        if not lane_id:
            issues.append(f"schema: lane {idx} has empty laneId")
        elif lane_id in seen_ids:
            issues.append(f"schema: duplicate laneId `{lane_id}`")
        else:
            seen_ids.add(lane_id)

        if lane_id is not None and lane_id not in CANONICAL_LANE_IDS:
            issues.append(
                f"schema: lane {idx} has non-canonical laneId `{lane_id}` "
                f"(allowed: {', '.join(CANONICAL_LANE_IDS)})"
            )

        posture = lane.get("currentPosture")
        if posture not in ALLOWED_POSTURES:
            issues.append(
                f"schema: lane `{lane_id}` has invalid currentPosture `{posture}` "
                f"(allowed: {', '.join(ALLOWED_POSTURES)})"
            )

        fingerprints = lane.get("sourceFingerprints")
        if not isinstance(fingerprints, list) or not fingerprints:
            issues.append(f"schema: lane `{lane_id}` has no sourceFingerprints")
            continue
        for fp in fingerprints:
            _validate_fingerprint_entry(f"lane `{lane_id}`", fp, issues)

    if tuple(actual_ids) != CANONICAL_LANE_IDS:
        issues.append(
            f"schema: lane array order must be exactly {list(CANONICAL_LANE_IDS)}, "
            f"found {actual_ids}"
        )

    if tuple(actual_orders) != CANONICAL_LANE_ORDERS:
        issues.append(
            f"schema: laneOrder values must be exactly {list(CANONICAL_LANE_ORDERS)}, "
            f"found {actual_orders}"
        )

    return issues


def _check_fingerprint_drift(label: str, fp: Any, issues: list[str]) -> None:
    if not isinstance(fp, dict):
        return
    rel_path = fp.get("path")
    expected = fp.get("sha256")
    if not rel_path or not expected:
        return
    full = REPO_ROOT / rel_path
    actual = _sha256_of(full)
    if actual is None:
        issues.append(
            f"PATH_MISSING: {label} fingerprinted source `{rel_path}` does not exist"
        )
    elif actual != expected:
        issues.append(
            f"SOURCE_DRIFT: {label} fingerprinted source `{rel_path}` "
            f"hash mismatch (recorded {expected}, actual {actual})"
        )


def validate_source_drift(doc: dict[str, Any]) -> list[str]:
    """Recompute every fingerprinted source hash and flag drift or missing paths."""
    issues: list[str] = []
    for lane in doc.get("lanes", []):
        lane_id = lane.get("laneId", "<unknown>")
        for fp in lane.get("sourceFingerprints", []):
            _check_fingerprint_drift(f"lane `{lane_id}`", fp, issues)

    for key in TOP_LEVEL_FINGERPRINT_KEYS:
        if key in doc:
            _check_fingerprint_drift(f"top-level `{key}`", doc[key], issues)

    return issues


def validate_map_agreement(doc: dict[str, Any], readme_text: str) -> list[str]:
    """Compare README lane IDs and verdict tokens against the JSON lanes array."""
    issues: list[str] = []
    for lane in doc.get("lanes", []):
        lane_id = lane.get("laneId")
        verdict = lane.get("verdict")
        if lane_id and lane_id not in readme_text:
            issues.append(
                f"MAP_DRIFT: laneId `{lane_id}` from JSON not found anywhere in {README_PATH}"
            )
        if verdict and f"`{verdict}`" not in readme_text:
            issues.append(
                f"MAP_DRIFT: verdict `{verdict}` for lane `{lane_id}` not found "
                f"(as a backticked token) in {README_PATH}"
            )
    return issues


def validate_live_proof_coverage(
    map_doc: dict[str, Any], coverage_doc: dict[str, Any]
) -> list[str]:
    """Require one live-proof classification per canonical semantic lane."""
    issues: list[str] = []
    for key in COVERAGE_REQUIRED_TOP_KEYS:
        if key not in coverage_doc:
            issues.append(f"COVERAGE_DRIFT: missing required top-level key `{key}`")

    use_cases = coverage_doc.get("useCases")
    if not isinstance(use_cases, list):
        issues.append("COVERAGE_DRIFT: `useCases` must be a list")
        use_cases = []
    use_case_ids = {
        item.get("useCaseId")
        for item in use_cases
        if isinstance(item, dict) and item.get("useCaseId")
    }
    if "UC-01-SOT3-BOUNDED-ACTIVATION" not in use_case_ids:
        issues.append("COVERAGE_DRIFT: retained SOT3 UC-01 use case is missing")

    lanes = coverage_doc.get("lanes")
    if not isinstance(lanes, list):
        issues.append("COVERAGE_DRIFT: `lanes` must be a list")
        return issues
    coverage_ids = [lane.get("laneId") for lane in lanes if isinstance(lane, dict)]
    if tuple(coverage_ids) != CANONICAL_LANE_IDS:
        issues.append(
            "COVERAGE_DRIFT: live-proof lane order must match the five canonical "
            f"lane IDs, found {coverage_ids}"
        )

    map_by_id = {
        lane.get("laneId"): lane
        for lane in map_doc.get("lanes", [])
        if isinstance(lane, dict)
    }
    for index, lane in enumerate(lanes):
        if not isinstance(lane, dict):
            issues.append(f"COVERAGE_DRIFT: lane at index {index} is not an object")
            continue
        lane_id = lane.get("laneId")
        for key in COVERAGE_REQUIRED_LANE_KEYS:
            if key not in lane:
                issues.append(
                    f"COVERAGE_DRIFT: lane `{lane_id}` missing required key `{key}`"
                )
        source_lane = map_by_id.get(lane_id)
        if source_lane:
            if lane.get("semanticPosture") != source_lane.get("currentPosture"):
                issues.append(
                    f"COVERAGE_DRIFT: lane `{lane_id}` semanticPosture does not "
                    "match source map currentPosture"
                )
            if lane.get("semanticVerdict") != source_lane.get("verdict"):
                issues.append(
                    f"COVERAGE_DRIFT: lane `{lane_id}` semanticVerdict does not "
                    "match source map verdict"
                )
        if lane.get("liveApplicability") not in ALLOWED_LIVE_APPLICABILITY:
            issues.append(f"COVERAGE_DRIFT: lane `{lane_id}` has invalid liveApplicability")
        if lane.get("requiredProofClass") not in ALLOWED_PROOF_CLASSES:
            issues.append(f"COVERAGE_DRIFT: lane `{lane_id}` has invalid requiredProofClass")
        if lane.get("observedProofClass") not in ALLOWED_PROOF_CLASSES:
            issues.append(f"COVERAGE_DRIFT: lane `{lane_id}` has invalid observedProofClass")
        if lane.get("operationalProofStatus") not in ALLOWED_OPERATIONAL_STATUSES:
            issues.append(f"COVERAGE_DRIFT: lane `{lane_id}` has invalid operationalProofStatus")
        next_use_case = lane.get("nextUseCase")
        if next_use_case != "NONE" and next_use_case not in use_case_ids:
            issues.append(
                f"COVERAGE_DRIFT: lane `{lane_id}` references unknown nextUseCase "
                f"`{next_use_case}`"
            )
        if (
            lane.get("liveApplicability") != "STATIC_RECOMPUTE_REQUIRED"
            and lane.get("operationalProofStatus") != "PROVEN"
            and next_use_case == "NONE"
        ):
            issues.append(
                f"COVERAGE_DRIFT: unproven live-applicable lane `{lane_id}` has no next use case"
            )
    return issues


def validate_age(doc: dict[str, Any], as_of_date: dt.date) -> list[str]:
    """Fail when asOfDate - lastVerifiedDate exceeds maxAgeDays."""
    issues: list[str] = []
    last_verified_raw = doc.get("lastVerifiedDate")
    max_age = doc.get("maxAgeDays")
    if not last_verified_raw or not isinstance(max_age, int):
        issues.append("schema: cannot evaluate age without lastVerifiedDate and integer maxAgeDays")
        return issues
    try:
        last_verified = dt.date.fromisoformat(str(last_verified_raw))
    except ValueError:
        issues.append(f"schema: lastVerifiedDate `{last_verified_raw}` is not ISO date format")
        return issues

    age_days = (as_of_date - last_verified).days
    if age_days > max_age:
        issues.append(
            f"AGE_EXPIRED: map is {age_days} days old (lastVerifiedDate={last_verified.isoformat()}, "
            f"asOfDate={as_of_date.isoformat()}), exceeding maxAgeDays={max_age}"
        )
    return issues


def validate_wiring() -> list[str]:
    """Confirm this checker's own command appears exactly once in every required catalog/workflow."""
    issues: list[str] = []
    for rel_path, label in WIRING_TARGETS:
        full = REPO_ROOT / rel_path
        text, err = _read_text(full)
        if err:
            issues.append(f"wiring: {label} ({rel_path}) unreadable: {err}")
            continue
        count = text.count(THIS_CHECKER_PATH)
        if count == 0:
            issues.append(f"wiring: {label} ({rel_path}) does not reference {THIS_CHECKER_PATH}")
        elif count > 1:
            issues.append(
                f"wiring: {label} ({rel_path}) references {THIS_CHECKER_PATH} {count} times, expected exactly 1"
            )
    return issues


def run_all_validations(as_of_date: dt.date) -> tuple[list[str], dict[str, Any] | None]:
    map_full = REPO_ROOT / MAP_PATH
    doc, err = _read_json(map_full)
    if err:
        return [f"schema: {err}"], None
    assert doc is not None

    issues: list[str] = []
    issues.extend(validate_schema(doc))

    coverage_doc, coverage_err = _read_json(REPO_ROOT / COVERAGE_PATH)
    if coverage_err:
        issues.append(f"COVERAGE_DRIFT: {coverage_err}")
    else:
        assert coverage_doc is not None
        issues.extend(validate_live_proof_coverage(doc, coverage_doc))

    readme_full = REPO_ROOT / README_PATH
    readme_text, readme_err = _read_text(readme_full)
    if readme_err:
        issues.append(f"schema: {readme_err}")
        readme_text = ""

    issues.extend(validate_source_drift(doc))
    if readme_text:
        issues.extend(validate_map_agreement(doc, readme_text))
    issues.extend(validate_age(doc, as_of_date))
    issues.extend(validate_wiring())
    return issues, doc


def _classify(issues: list[str]) -> dict[str, int]:
    counts = {"PATH_MISSING": 0, "SOURCE_DRIFT": 0, "MAP_DRIFT": 0, "COVERAGE_DRIFT": 0, "AGE_EXPIRED": 0, "schema": 0, "wiring": 0}
    for issue in issues:
        for key in counts:
            if issue.startswith(f"{key}:"):
                counts[key] += 1
                break
    return counts


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--as-of-date", help="ISO date (YYYY-MM-DD) to evaluate age against; default is today")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    parser.add_argument("--enforce", action="store_true", help="Exit non-zero on violations")
    args = parser.parse_args(argv)

    if args.as_of_date:
        try:
            as_of_date = dt.date.fromisoformat(args.as_of_date)
        except ValueError:
            print(f"FAIL: --as-of-date `{args.as_of_date}` is not ISO date format (YYYY-MM-DD)")
            return 1
    else:
        as_of_date = dt.date.today()

    issues, _doc = run_all_validations(as_of_date)
    counts = _classify(issues)
    freshness_state = "CURRENT" if not issues else next(
        (k for k in ("PATH_MISSING", "SOURCE_DRIFT", "MAP_DRIFT", "COVERAGE_DRIFT", "AGE_EXPIRED", "schema", "wiring") if counts[k]),
        "CURRENT",
    )

    if args.json:
        report = {
            "checker": THIS_CHECKER_PATH,
            "asOfDate": as_of_date.isoformat(),
            "freshnessState": freshness_state,
            "violationCount": len(issues),
            "violations": issues,
            "counts": counts,
        }
        print(json.dumps(report, indent=2))
    else:
        print("=== CVF System Chain Map Freshness Gate ===")
        print(f"As-of date: {as_of_date.isoformat()}")
        print(f"Standard: {STANDARD_PATH}")
        print(f"Freshness state: {freshness_state}")
        print(f"Violations: {len(issues)}")
        for issue in issues:
            print(f"  - {issue}")
        if issues:
            print(
                "\nOperator readout: semantic verdicts are never auto-rewritten by this "
                "checker. Repair the named source, path, or agreement issue, or refresh "
                "lastVerifiedDate only after a governed review, then re-run this checker."
            )

    if issues:
        if args.enforce:
            print("\nNON-COMPLIANT - system chain map freshness violated." if not args.json else "", end="")
            return 1
        print("\nADVISORY - system chain map freshness violated." if not args.json else "", end="")
        return 0

    if not args.json:
        print("\nCOMPLIANT - system chain map is fresh.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
