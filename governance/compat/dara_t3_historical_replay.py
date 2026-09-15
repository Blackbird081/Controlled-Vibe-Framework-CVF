#!/usr/bin/env python3
"""
DARA-T3 WP-ARCH-003 historical replay helper (R1 repair).

Deterministic, read-only, provider-free replay of the frozen fixture at
governance/compat/fixtures/dara_t3_wp_arch_003_historical_replay.json. Proves
whether current DARA architecture-readiness admission would stop the recorded
Initial/R1/R2 WP-ARCH-003 dispatch chain, and evaluates named seeded
counterfactual defect-class cases against the real accepted DARA validator
(`_validate_architecture_readiness_admission` in
`check_work_order_dispatch_quality`, reached through its public re-export
module `check_work_order_dispatch_quality_range`), before any avoidable
external invocation.

Each seeded case's `oracleInput` (a structured architecture-readiness
declaration plus, where applicable, an Architecture Binding Matrix and a
Planned Worker Fulfillment Manifest) is rendered to synthetic markdown text
containing no `expected*`/label/`sourceFinding`/`note` field, then passed to
the real validator. The observed issue strings are mapped to the frozen
earliest-stop/violation taxonomy by one explicit, tested adapter
(`_map_observed_issues`). This module does not duplicate architecture-
validation semantics; it renders input and interprets real validator output.

This module evaluates strings and the structured fixture only. It does not
execute shell commands, import the historical work orders as code, access
network/provider/credentials, or mutate any source file.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
_COMPAT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_COMPAT_DIR))

from check_work_order_dispatch_quality_architecture_schema import (  # noqa: E402
    ARCHITECTURE_MATRIX_ROW_COLUMNS,
    ARCHITECTURE_READINESS_ALLOWED_DECLARATIONS,
    ARCHITECTURE_READINESS_BLOCKED_UNCLASSIFIED,
    ARCHITECTURE_READINESS_MARKER,
    ARCHITECTURE_READINESS_REQUIRED,
    _architecture_readiness_declaration,
)

import check_work_order_dispatch_quality as _dispatch_quality  # noqa: E402

_validate_architecture_readiness_admission = (
    _dispatch_quality._validate_architecture_readiness_admission
)

SCHEMA_VERSION = "cvf.dara.t3HistoricalReplayResult.v2"

MATRIX_HEADING = "## Architecture Binding Matrix"
MANIFEST_HEADING = "## Planned Worker Fulfillment Manifest"

# Zero-tolerance violation classes that must always be caught (100% recall
# required by the paired baseline and work order T3-A05/R1-A05).
ZERO_TOLERANCE_VIOLATION_CLASSES = frozenset(
    {
        "BLOCKED_ARCHITECTURE_MATRIX_INCOMPLETE",
        "BLOCKED_SEMANTIC_REVIEW_MISSING_OR_STALE",
        "BLOCKED_INVOCATION_CEILING_REACHED",
        "BLOCKED_ARCHITECTURE_APPLICABILITY_UNCLASSIFIED",
    }
)

# One explicit, tested adapter mapping a real observed issue-string substring
# to the frozen (earliestStop, violationClass) taxonomy. Order matters: the
# first matching pattern wins. This is interpretation of real validator
# output, not a second semantic validator.
_ISSUE_TOKEN_ADAPTER: tuple[tuple[str, tuple[str, str]], ...] = (
    (
        "is absent from this",
        ("PRE_INVOCATION_ARCHITECTURE_DECLARATION_MISSING", ARCHITECTURE_READINESS_BLOCKED_UNCLASSIFIED),
    ),
    (
        "unrecognized value",
        ("PRE_INVOCATION_UNPROVABLE_EQUIVALENCE", ARCHITECTURE_READINESS_BLOCKED_UNCLASSIFIED),
    ),
    (
        "declares `BLOCKED_ARCHITECTURE_APPLICABILITY_UNCLASSIFIED`",
        ("PRE_INVOCATION_UNPROVABLE_EQUIVALENCE", ARCHITECTURE_READINESS_BLOCKED_UNCLASSIFIED),
    ),
    (
        "duplicate `behaviorIdentity`",
        ("PRE_INVOCATION_DUPLICATE_BEHAVIOR_IDENTITY", "BLOCKED_ARCHITECTURE_MATRIX_INCOMPLETE"),
    ),
    (
        "missing required field `registrationPath`",
        ("PRE_INVOCATION_REGISTRATION_MISSING", "BLOCKED_ARCHITECTURE_MATRIX_INCOMPLETE"),
    ),
    (
        "not a non-test runtime consumer",
        ("PRE_INVOCATION_RUNTIME_CONSUMER_MISSING", "BLOCKED_ARCHITECTURE_MATRIX_INCOMPLETE"),
    ),
    (
        "field `runtimeConsumerPath` cites a nonexistent path",
        ("PRE_INVOCATION_RUNTIME_CONSUMER_MISSING", "BLOCKED_ARCHITECTURE_MATRIX_INCOMPLETE"),
    ),
    (
        "is not found in the cited authority bytes",
        ("PRE_INVOCATION_TRUST_SOURCE_UNRESOLVED", "BLOCKED_ARCHITECTURE_MATRIX_INCOMPLETE"),
    ),
    (
        "uses placeholder/worker-selection language",
        ("PRE_INVOCATION_PLACEHOLDER_DETECTED", "BLOCKED_ARCHITECTURE_MATRIX_INCOMPLETE"),
    ),
    (
        "BLOCKED_ROLLBACK_OUTSIDE_WRITABLE_MANIFEST",
        ("PRE_INVOCATION_ROLLBACK_OUT_OF_SCOPE", "BLOCKED_ARCHITECTURE_MATRIX_INCOMPLETE"),
    ),
    (
        "field `machineDisposition` is worker-authored as",
        ("PRE_INVOCATION_SEMANTIC_ACCEPTANCE_NOT_REVIEWER_OWNED", "BLOCKED_ARCHITECTURE_MATRIX_INCOMPLETE"),
    ),
    (
        "BLOCKED_USAGE_UNKNOWN",
        ("PRE_INVOCATION_USAGE_UNKNOWN", "BLOCKED_USAGE_UNKNOWN"),
    ),
    (
        "BLOCKED_INVOCATION_CEILING_REACHED",
        ("PRE_INVOCATION_INVOCATION_CEILING_REACHED", "BLOCKED_INVOCATION_CEILING_REACHED"),
    ),
)


class FixtureError(ValueError):
    """Raised when the fixture is malformed or fails a structural invariant."""


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _read_repo_relative(rel_path: str) -> bytes:
    normalized = rel_path.replace("\\", "/")
    if ".." in normalized.split("/") or normalized.startswith("/") or (
        len(normalized) > 1 and normalized[1] == ":"
    ):
        raise FixtureError(f"rejected traversal or absolute source path: {rel_path!r}")
    resolved = (REPO_ROOT / normalized).resolve()
    if REPO_ROOT not in resolved.parents and resolved != REPO_ROOT:
        raise FixtureError(f"resolved path escapes repository root: {rel_path!r}")
    return resolved.read_bytes()


def load_fixture(fixture_path: Path) -> dict:
    resolved = fixture_path.resolve()
    if REPO_ROOT not in resolved.parents and resolved != REPO_ROOT:
        raise FixtureError("fixture path must resolve inside the repository")
    with resolved.open("r", encoding="utf-8") as handle:
        fixture = json.load(handle)
    for required_key in ("schemaVersion", "sources", "rawCases", "seededCases"):
        if required_key not in fixture:
            raise FixtureError(f"fixture missing required key: {required_key}")
    return fixture


def verify_source_hashes(fixture: dict) -> list[dict]:
    """Recompute SHA-256 for every frozen source. Source drift is fail closed."""
    results = []
    for source in fixture["sources"]:
        try:
            data = _read_repo_relative(source["path"])
            actual = _sha256_bytes(data)
        except (OSError, FixtureError) as exc:
            results.append(
                {
                    "id": source["id"],
                    "path": source["path"],
                    "expectedSha256": source["sha256"],
                    "actualSha256": None,
                    "match": False,
                    "error": str(exc),
                }
            )
            continue
        results.append(
            {
                "id": source["id"],
                "path": source["path"],
                "expectedSha256": source["sha256"],
                "actualSha256": actual,
                "match": actual == source["sha256"],
                "error": None,
            }
        )
    return results


def _classify_declaration(declaration_text: str | None) -> tuple[str, str]:
    """Return (earliestStop, violationClass) for a raw historical source's
    architecture-readiness declaration line, per the accepted oracle."""
    if declaration_text is None:
        return (
            "PRE_INVOCATION_ARCHITECTURE_DECLARATION_MISSING",
            ARCHITECTURE_READINESS_BLOCKED_UNCLASSIFIED,
        )
    token = declaration_text.split(":", 1)[0].strip()
    if token == ARCHITECTURE_READINESS_REQUIRED:
        return ("PRE_INVOCATION_MATRIX_EVALUATION_REQUIRED", "REQUIRES_FULL_MATRIX")
    if declaration_text.strip() in ARCHITECTURE_READINESS_ALLOWED_DECLARATIONS:
        return ("PRE_INVOCATION_DECLARATION_ACCEPTED", "NOT_BLOCKED")
    if declaration_text.strip().startswith("NOT_APPLICABLE_EXTERNAL_LOW_RISK_WITH_REASON:"):
        return ("PRE_INVOCATION_DECLARATION_ACCEPTED", "NOT_BLOCKED")
    return (
        "PRE_INVOCATION_UNPROVABLE_EQUIVALENCE",
        ARCHITECTURE_READINESS_BLOCKED_UNCLASSIFIED,
    )


def evaluate_raw_case(case: dict, sources_by_id: dict[str, dict]) -> dict:
    source = sources_by_id[case["sourceId"]]
    try:
        raw_bytes = _read_repo_relative(source["path"])
        text = raw_bytes.decode("utf-8", errors="replace")
        declaration = _architecture_readiness_declaration(text)
        actual_earliest_stop, actual_violation_class = _classify_declaration(declaration)
    except (OSError, FixtureError) as exc:
        actual_earliest_stop, actual_violation_class = (
            "PRE_INVOCATION_SOURCE_UNREADABLE",
            f"BLOCKED_WITH_REASON:{exc}",
        )
    expected_earliest_stop = case["expectedEarliestStop"]
    expected_violation_class = case["expectedViolationClass"]
    matched = (
        actual_earliest_stop == expected_earliest_stop
        and actual_violation_class == expected_violation_class
    )
    return {
        "caseId": case["caseId"],
        "derivationClass": case["derivationClass"],
        "sourceId": case["sourceId"],
        "invocationOrdinal": case["invocationOrdinal"],
        "expectedEarliestStop": expected_earliest_stop,
        "expectedViolationClass": expected_violation_class,
        "actualEarliestStop": actual_earliest_stop,
        "actualViolationClass": actual_violation_class,
        "matched": matched,
        "avoidedInvocation": matched and actual_violation_class != "NOT_BLOCKED",
    }


def render_oracle_input(oracle_input: dict) -> str:
    """Render a structured oracleInput to synthetic work-order markdown text
    containing only the fields the real validator reads: the architecture-
    readiness declaration line, an optional Architecture Binding Matrix
    table, and an optional Planned Worker Fulfillment Manifest table. No
    `expected*`, case-label, `sourceFinding`, or `note` field is read or
    rendered here."""
    lines: list[str] = ["dispatchSurface: EXTERNAL_AGENT_CLI_MCP"]
    declaration = oracle_input.get("architectureReadinessDeclaration")
    if declaration is not None:
        lines.append(f"{ARCHITECTURE_READINESS_MARKER} {declaration}")

    rows = oracle_input.get("matrixRows") or []
    if rows:
        lines.append("")
        lines.append(MATRIX_HEADING)
        lines.append("")
        lines.append("| " + " | ".join(ARCHITECTURE_MATRIX_ROW_COLUMNS) + " |")
        lines.append("|" + "|".join(["---"] * len(ARCHITECTURE_MATRIX_ROW_COLUMNS)) + "|")
        for row in rows:
            cells = [str(row.get(column, "")).replace("|", "/").replace("\n", " ") for column in ARCHITECTURE_MATRIX_ROW_COLUMNS]
            lines.append("| " + " | ".join(cells) + " |")

    usage_count = oracle_input.get("cumulativeExternalInvocationCount")
    if usage_count is not None:
        lines.append(f"cumulativeExternalInvocationCount: {usage_count}")
    ceiling = oracle_input.get("externalInvocationCeiling")
    if ceiling is not None:
        lines.append(f"externalInvocationCeiling: {ceiling}")

    manifest = oracle_input.get("writableManifest") or []
    if manifest:
        lines.append("")
        lines.append(MANIFEST_HEADING)
        lines.append("")
        lines.append("| Path | Action |")
        lines.append("|---|---|")
        for path in manifest:
            lines.append(f"| {path} | MODIFY |")

    return "\n".join(lines) + "\n"


def _map_observed_issues(issues: list[str]) -> tuple[str, str]:
    """Map real observed validator issue strings to (earliestStop,
    violationClass) using the frozen, tested substring adapter. Returns
    ("NONE", "NOT_BLOCKED") when no issue matches any known pattern (a truly
    clean packet, or an issue class outside this replay's taxonomy)."""
    for issue in issues:
        for pattern, mapped in _ISSUE_TOKEN_ADAPTER:
            if pattern in issue:
                return mapped
    return ("PRE_INVOCATION_DECLARATION_ACCEPTED", "NOT_BLOCKED")


def evaluate_seeded_case(case: dict) -> dict:
    """Render this case's oracleInput to synthetic work-order text and pass
    it through the real accepted DARA validator
    (`_validate_architecture_readiness_admission`). The actual result is
    derived only from the validator's observed issue strings; it never reads
    `expected*`, `sourceFinding`, or `note`."""
    oracle_input = case["oracleInput"]
    rendered_text = render_oracle_input(oracle_input)
    observed_issues = _validate_architecture_readiness_admission(
        "synthetic-dara-t3-r1-replay.md", rendered_text
    )
    actual_earliest_stop, actual_violation_class = _map_observed_issues(observed_issues)

    expected_violation_class = case["expectedViolationClass"]
    expected_earliest_stop = case["expectedEarliestStop"]
    matched = (
        actual_violation_class == expected_violation_class
        and actual_earliest_stop == expected_earliest_stop
    )

    zero_tolerance_declared = bool(case.get("zeroTolerance", False))
    caught = actual_violation_class != "NOT_BLOCKED"
    zero_tolerance_ok = (not zero_tolerance_declared) or caught

    return {
        "caseId": case["caseId"],
        "namedFamily": case["namedFamily"],
        "invocationOrdinal": 1,
        "zeroTolerance": zero_tolerance_declared,
        "expectedEarliestStop": expected_earliest_stop,
        "expectedViolationClass": expected_violation_class,
        "actualEarliestStop": actual_earliest_stop,
        "actualViolationClass": actual_violation_class,
        "observedIssueTokens": observed_issues,
        "matched": matched,
        "caught": caught,
        "zeroToleranceRecallOk": zero_tolerance_ok,
    }


def run_replay(fixture: dict) -> dict:
    for required_key in ("schemaVersion", "sources", "rawCases", "seededCases"):
        if required_key not in fixture:
            raise FixtureError(f"fixture missing required key: {required_key}")
    sources_by_id = {source["id"]: source for source in fixture["sources"]}
    hash_results = verify_source_hashes(fixture)
    source_drift = any(not row["match"] for row in hash_results)

    raw_results = [evaluate_raw_case(case, sources_by_id) for case in fixture["rawCases"]]
    seeded_results = [evaluate_seeded_case(case) for case in fixture["seededCases"]]

    # R1-02: false positives are clean-control (non-zero-tolerance, expected
    # NOT_BLOCKED) cases that the oracle nonetheless blocked; false negatives
    # are defect-bearing (expected-blocked) cases the oracle failed to block.
    false_positive_count = sum(
        1
        for row in seeded_results
        if row["expectedViolationClass"] == "NOT_BLOCKED" and row["caught"]
    )
    false_negative_count = sum(1 for row in raw_results if not row["matched"])
    false_negative_count += sum(
        1
        for row in seeded_results
        if row["expectedViolationClass"] != "NOT_BLOCKED" and not row["caught"]
    )

    zero_tolerance_required_count = sum(1 for row in seeded_results if row["zeroTolerance"])
    zero_tolerance_caught_count = sum(
        1 for row in seeded_results if row["zeroTolerance"] and row["caught"]
    )
    zero_tolerance_miss_count = sum(
        1 for row in seeded_results if row["zeroTolerance"] and not row["zeroToleranceRecallOk"]
    )

    avoided_invocation_count = sum(1 for row in raw_results if row["avoidedInvocation"])

    seeded_mismatch_count = sum(1 for row in seeded_results if not row["matched"])

    all_named_families = set(fixture.get("namedFamiliesRequired", []))
    represented_families = {row["namedFamily"] for row in seeded_results}
    missing_named_families = sorted(all_named_families - represented_families)

    total_cases = len(raw_results) + len(seeded_results)

    if source_drift:
        terminal_verdict = "BLOCKED_WITH_REASON"
    elif zero_tolerance_miss_count > 0 or missing_named_families:
        terminal_verdict = "RETURN_TO_DESIGN"
    elif false_negative_count > 0 or false_positive_count > 0 or seeded_mismatch_count > 0:
        terminal_verdict = "RETURN_TO_DESIGN"
    else:
        terminal_verdict = "REPLAY_BLOCKS_AVOIDABLE_INVOCATIONS"

    return {
        "schemaVersion": SCHEMA_VERSION,
        "batchId": fixture.get("batchId"),
        "sourceHashVerification": hash_results,
        "sourceDrift": source_drift,
        "rawCaseResults": raw_results,
        "seededCaseResults": seeded_results,
        "caseTotals": {
            "rawCaseCount": len(raw_results),
            "seededCaseCount": len(seeded_results),
            "totalCaseCount": total_cases,
        },
        "falsePositiveCount": false_positive_count,
        "falseNegativeCount": false_negative_count,
        "zeroToleranceRecall": {
            "caughtCount": zero_tolerance_caught_count,
            "requiredCount": zero_tolerance_required_count,
        },
        "zeroToleranceMissCount": zero_tolerance_miss_count,
        "missingNamedFamilies": missing_named_families,
        "avoidedInvocationCount": avoided_invocation_count,
        "seededMismatchCount": seeded_mismatch_count,
        "terminalVerdict": terminal_verdict,
    }


def _normalize_for_determinism(result: dict) -> str:
    return json.dumps(result, sort_keys=True, ensure_ascii=True, separators=(",", ":"))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fixture", required=True, help="repo-relative path to the frozen fixture JSON")
    parser.add_argument("--json", action="store_true", help="emit normalized JSON to stdout")
    args = parser.parse_args(argv)

    try:
        fixture = load_fixture(Path(args.fixture))
    except (FixtureError, OSError, json.JSONDecodeError) as exc:
        error_result = {
            "schemaVersion": SCHEMA_VERSION,
            "terminalVerdict": "BLOCKED_WITH_REASON",
            "error": str(exc),
        }
        if args.json:
            print(_normalize_for_determinism(error_result))
        return 2

    try:
        result = run_replay(fixture)
    except FixtureError as exc:
        error_result = {
            "schemaVersion": SCHEMA_VERSION,
            "terminalVerdict": "BLOCKED_WITH_REASON",
            "error": str(exc),
        }
        if args.json:
            print(_normalize_for_determinism(error_result))
        return 2

    if args.json:
        print(_normalize_for_determinism(result))

    if result["terminalVerdict"] == "REPLAY_BLOCKS_AVOIDABLE_INVOCATIONS":
        return 0
    if result["terminalVerdict"] == "RETURN_TO_DESIGN":
        return 3
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
