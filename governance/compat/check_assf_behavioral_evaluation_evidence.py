#!/usr/bin/env python3
"""CVF ASSF behavioral evaluation evidence admission checker.

Read-only checker for the ACEL G3 T2 behavioral evaluation contract
(docs/reference/agent_system_skills/CVF_ASSF_BEHAVIORAL_EVALUATION_CONTRACT.md),
reworked per the consolidated R1 rework work order
(ACEL-G3-T2-R1-CONSOLIDATED-SEMANTIC-REWORK).

Given an explicit package document and an explicit evidence-result document
(both supplied as file paths, or test-injected as parsed dicts), this checker
fails closed when the package declares ``uatState: PASSED`` under this
contract but the cited evidence document does not carry the exact,
consistent, non-stale, non-malformed evidence this contract's
cross-language schema requires. Every required field is validated
explicitly; no field's absence is treated as a silent pass, and no field is
tested only by truthiness (an explicit ``False`` or ``0`` is distinguished
from an absent field throughout).

This checker does not require every existing package to adopt this contract:
a package whose ``acceptanceEvidence`` does not cite this contract is simply
skipped (not evaluated). It never mutates a package entry, the generated
skill index, or any certification/UAT state; it only reads and reports.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

CONTRACT_MARKER = "CVF_ASSF_BEHAVIORAL_EVALUATION_CONTRACT"

PASS_RESULT = "PASS_WITH_EVIDENCE"
VALID_RESULTS = {
    "PASS_WITH_EVIDENCE",
    "FAIL_WITH_DEFECTS",
    "INCOMPLETE_TRACE",
    "UNDECLARED_TOOL_USE",
    "STALE_REPLAY_PROVENANCE",
    "NONEQUIVALENT_BASELINE_PAIR",
    "INSUFFICIENT_REPEAT_EVIDENCE",
}

# R1-01: exact work-order vocabulary. LIVE is not an authorized capture mode
# in this offline tranche; none of these three modes may ever be cited as
# proof of a real live provider execution.
VALID_CAPTURE_MODES = {"OFFLINE_SYNTHETIC", "MOCK_REPLAY", "LIVE_REFERENCE_ONLY"}
LIVE_OVERCLAIM_MODES = VALID_CAPTURE_MODES

VALID_REPEAT_POLICIES = {"DETERMINISTIC", "STOCHASTIC"}
REQUIRED_REPEATS_BY_POLICY = {"DETERMINISTIC": 1, "STOCHASTIC": 3}
VALID_BASELINE_ROLES = {"WITH", "WITHOUT", "NONE"}
VALID_CANDIDATE_SPACE_MODES = {"COMPLETE", "INCOMPLETE_WITH_ESCAPE"}

_HASH_PATTERN = re.compile(r"^[0-9a-f]{64}$")

# Strict ISO-8601 date-time: full calendar date, literal "T" separator,
# full time-of-day with seconds, optional fractional seconds, and an
# explicit UTC "Z" or numeric offset. Mirrors the TypeScript grader's
# `ISO_8601_STRICT_PATTERN` exactly so both languages accept and reject the
# same set of date-time strings.
_ISO_8601_STRICT_PATTERN = re.compile(
    r"^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$"
)


class _Missing:
    """Sentinel distinguishing an absent field from an explicit ``None``."""

    def __repr__(self) -> str:  # pragma: no cover - debug aid only
        return "<MISSING>"


_MISSING = _Missing()


def _get(document: dict[str, Any], field: str) -> Any:
    """Fetch ``field`` from ``document``, returning the ``_MISSING`` sentinel
    when the key is entirely absent. Never uses truthiness: a present but
    falsy value (``False``, ``0``, ``""``) is returned as-is, not treated as
    missing.
    """
    return document.get(field, _MISSING)


def _is_canonical_hash(value: Any) -> bool:
    return isinstance(value, str) and bool(_HASH_PATTERN.match(value))


def _parse_iso_strict(value: Any) -> datetime | None:
    """Strictly parse an ISO-8601 date-time string. Returns ``None`` for any
    non-string, empty, malformed, or calendar-invalid input (e.g. a
    February 30th) rather than silently accepting it. Mirrors the
    TypeScript grader's `parseIsoDateStrict` reconciliation behavior:
    `datetime.fromisoformat` is not used alone because it accepts some
    non-canonical variants this contract rejects (and does not, by itself,
    catch every calendar-invalid rollover on all Python versions), so the
    regex prefilter plus explicit field-range checks below are both
    required.
    """
    if not isinstance(value, str) or len(value) == 0:
        return None
    match = _ISO_8601_STRICT_PATTERN.match(value)
    if not match:
        return None

    year, month, day, hour, minute, second = (int(match.group(i)) for i in range(1, 7))
    if not (1 <= month <= 12):
        return None
    if not (1 <= day <= 31):
        return None
    if hour > 23 or minute > 59 or second > 59:
        return None

    offset = match.group(8)
    normalized = value if offset == "Z" else value
    iso_candidate = normalized.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(iso_candidate)
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return None
    parsed_utc = parsed.astimezone(timezone.utc)
    if (parsed_utc.year, parsed_utc.month, parsed_utc.day) != (year, month, day) and offset == "Z":
        return None

    return parsed


def _load_json_object(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path}: expected JSON object")
    return value


def _declares_behavioral_contract(package: dict[str, Any]) -> bool:
    acceptance_evidence = package.get("acceptanceEvidence")
    if not isinstance(acceptance_evidence, str):
        return False
    return CONTRACT_MARKER in acceptance_evidence


def check_evidence_admission(
    package: dict[str, Any],
    evidence: dict[str, Any] | None,
    *,
    package_label: str = "<package>",
) -> list[str]:
    """Return admission violations for one package/evidence pair.

    ``package`` is a parsed package/registry-entry-shaped dict. ``evidence``
    is the parsed behavioral evaluation result this package's
    ``acceptanceEvidence`` cites, or ``None`` when no evidence document was
    supplied at all. Pure function: never mutates either argument. Every
    required field is checked for presence, type, and value explicitly; a
    field's absence, malformation, or internal inconsistency with another
    field always fails closed rather than being silently skipped.
    """
    violations: list[str] = []

    if not isinstance(package, dict) or not _declares_behavioral_contract(package):
        return violations

    skill_id_value = package.get("skillId")
    skill_id = skill_id_value if isinstance(skill_id_value, str) and skill_id_value else package_label

    uat_state = package.get("uatState")
    if not isinstance(uat_state, str) or uat_state.upper() != "PASSED":
        return violations

    if evidence is None or not isinstance(evidence, dict):
        violations.append(
            f"{skill_id}: uatState PASSED under the behavioral evaluation "
            "contract but no evidence document was supplied"
        )
        return violations

    # --- result ---
    result_value = _get(evidence, "result")
    if result_value is _MISSING or not isinstance(result_value, str) or result_value not in VALID_RESULTS:
        violations.append(
            f"{skill_id}: evidence result is missing, malformed, or unknown: {result_value!r}"
        )
        return violations
    if result_value != PASS_RESULT:
        violations.append(
            f"{skill_id}: uatState PASSED requires evidence result "
            f"{PASS_RESULT}, found {result_value}"
        )

    # --- package source hash (R1-04: missing package source hash must fail) ---
    package_source_hash = _get(package, "sourceContentHash")
    if package_source_hash is _MISSING or not _is_canonical_hash(package_source_hash):
        violations.append(f"{skill_id}: package sourceContentHash is missing or malformed")
    else:
        evidence_source_hash = _get(evidence, "sourceContentHash")
        if evidence_source_hash is _MISSING or not _is_canonical_hash(evidence_source_hash):
            violations.append(f"{skill_id}: evidence sourceContentHash is missing or malformed")
        elif evidence_source_hash != package_source_hash:
            violations.append(
                f"{skill_id}: evidence sourceContentHash ({evidence_source_hash}) "
                f"does not match package sourceContentHash ({package_source_hash}); "
                "prior evidence is stale"
            )

    # --- fixture hash (R1-04: missing fixture hash must fail) ---
    fixture_hash = _get(evidence, "fixtureContentHash")
    if fixture_hash is _MISSING or not _is_canonical_hash(fixture_hash):
        violations.append(f"{skill_id}: evidence fixtureContentHash is missing or malformed")

    # --- fixture identity ---
    fixture_id = _get(evidence, "fixtureId")
    if fixture_id is _MISSING or not isinstance(fixture_id, str) or not fixture_id:
        violations.append(f"{skill_id}: evidence fixtureId is missing or malformed")

    # --- decision evidence boundary (post-G7 Jev absorption) ---
    decision_context_hash = _get(evidence, "decisionContextHash")
    if decision_context_hash is _MISSING or not _is_canonical_hash(decision_context_hash):
        violations.append(f"{skill_id}: evidence decisionContextHash is missing or malformed")

    candidate_space_mode = _get(evidence, "candidateSpaceMode")
    no_match_outcome = _get(evidence, "noMatchOutcome")
    if candidate_space_mode is _MISSING:
        violations.append(f"{skill_id}: evidence candidateSpaceMode is missing")
    elif (
        not isinstance(candidate_space_mode, str)
        or candidate_space_mode not in VALID_CANDIDATE_SPACE_MODES
    ):
        violations.append(
            f"{skill_id}: evidence candidateSpaceMode is unknown: {candidate_space_mode!r}"
        )
    elif candidate_space_mode == "COMPLETE":
        if no_match_outcome is _MISSING or no_match_outcome is not None:
            violations.append(
                f"{skill_id}: COMPLETE candidateSpaceMode requires explicit null noMatchOutcome"
            )
    elif (
        no_match_outcome is _MISSING
        or not isinstance(no_match_outcome, str)
        or not no_match_outcome.strip()
    ):
        violations.append(
            f"{skill_id}: INCOMPLETE_WITH_ESCAPE candidateSpaceMode requires a non-empty noMatchOutcome"
        )

    judgment_authority = _get(evidence, "judgmentAuthority")
    if judgment_authority != "EVIDENCE_ONLY":
        violations.append(
            f"{skill_id}: evidence judgmentAuthority must be EVIDENCE_ONLY; "
            "probability or confidence never grants action authority"
        )

    # --- repeat policy and counts ---
    repeat_policy = _get(evidence, "repeatPolicy")
    if repeat_policy is _MISSING:
        violations.append(f"{skill_id}: evidence repeatPolicy is missing")
    elif not isinstance(repeat_policy, str) or repeat_policy not in VALID_REPEAT_POLICIES:
        violations.append(f"{skill_id}: evidence repeatPolicy is unknown: {repeat_policy!r}")
    else:
        required = REQUIRED_REPEATS_BY_POLICY[repeat_policy]
        observed = _get(evidence, "repeatsObserved")
        required_declared = _get(evidence, "repeatsRequired")
        if observed is _MISSING:
            violations.append(f"{skill_id}: evidence repeatsObserved is missing")
        elif not isinstance(observed, int) or isinstance(observed, bool):
            violations.append(f"{skill_id}: evidence repeatsObserved must be an integer, found {observed!r}")
        if required_declared is _MISSING:
            violations.append(f"{skill_id}: evidence repeatsRequired is missing")
        elif not isinstance(required_declared, int) or isinstance(required_declared, bool):
            violations.append(
                f"{skill_id}: evidence repeatsRequired must be an integer, found {required_declared!r}"
            )
        elif required_declared != required:
            violations.append(
                f"{skill_id}: evidence repeatsRequired ({required_declared}) is inconsistent "
                f"with repeatPolicy {repeat_policy} (requires exactly {required})"
            )
        if (
            isinstance(observed, int)
            and not isinstance(observed, bool)
            and observed != required
            and result_value == PASS_RESULT
        ):
            violations.append(
                f"{skill_id}: {repeat_policy} evidence requires exactly {required} "
                f"consecutive passing repeat(s) for {PASS_RESULT}, found {observed}"
            )

    # --- capture mode (R1-01, R1-04: missing/unknown captureMode must fail) ---
    capture_mode = _get(evidence, "captureMode")
    if capture_mode is _MISSING:
        violations.append(f"{skill_id}: evidence captureMode is missing")
    elif not isinstance(capture_mode, str) or capture_mode not in VALID_CAPTURE_MODES:
        violations.append(f"{skill_id}: evidence captureMode is unknown: {capture_mode!r}")
    else:
        if capture_mode == "MOCK_REPLAY":
            provenance = _get(evidence, "provenanceSourceCommit")
            expiry_raw = _get(evidence, "provenanceExpiry")
            clock_raw = _get(evidence, "evaluationClockIso")

            if provenance is _MISSING or not isinstance(provenance, str) or not provenance:
                violations.append(f"{skill_id}: MOCK_REPLAY evidence requires a non-empty provenanceSourceCommit")

            if clock_raw is _MISSING:
                violations.append(f"{skill_id}: MOCK_REPLAY evidence requires evaluationClockIso")
                clock_parsed = None
            else:
                clock_parsed = _parse_iso_strict(clock_raw)
                if clock_parsed is None:
                    violations.append(f"{skill_id}: evidence evaluationClockIso is malformed: {clock_raw!r}")

            if expiry_raw is _MISSING:
                violations.append(f"{skill_id}: MOCK_REPLAY evidence requires provenanceExpiry")
            else:
                expiry_parsed = _parse_iso_strict(expiry_raw)
                if expiry_parsed is None:
                    violations.append(f"{skill_id}: evidence provenanceExpiry is malformed: {expiry_raw!r}")
                elif clock_parsed is not None and expiry_parsed <= clock_parsed:
                    violations.append(
                        f"{skill_id}: evidence provenanceExpiry ({expiry_raw}) is not strictly "
                        f"after evaluationClockIso ({clock_raw}); replay is stale or expiry is "
                        "non-future"
                    )

        if capture_mode in LIVE_OVERCLAIM_MODES:
            cited_as_live = _get(evidence, "citedAsLiveProof")
            if cited_as_live is True or (isinstance(cited_as_live, str) and cited_as_live.strip().lower() == "true"):
                violations.append(
                    f"{skill_id}: {capture_mode} evidence must never be cited as LIVE proof"
                )

    # --- baseline equivalence (R1-04: missing baselineEquivalent must not be treated as success) ---
    baseline_role = _get(evidence, "baselineRole")
    if baseline_role is not _MISSING and isinstance(baseline_role, str) and baseline_role not in VALID_BASELINE_ROLES:
        violations.append(f"{skill_id}: evidence baselineRole is unknown: {baseline_role!r}")
    elif baseline_role in ("WITH", "WITHOUT"):
        baseline_equivalent = _get(evidence, "baselineEquivalent")
        if baseline_equivalent is _MISSING:
            violations.append(
                f"{skill_id}: {baseline_role} evidence requires an explicit baselineEquivalent "
                "field; a missing field is never treated as equivalence proof"
            )
        elif baseline_equivalent is not True:
            violations.append(
                f"{skill_id}: WITH/WITHOUT baseline pair is not proven equivalent "
                f"(baselineEquivalent={baseline_equivalent!r}, NONEQUIVALENT_BASELINE_PAIR)"
            )

    # --- governed review artifact ---
    review_artifact = _get(evidence, "reviewArtifactPath")
    if review_artifact is _MISSING or not isinstance(review_artifact, str) or not review_artifact:
        violations.append(f"{skill_id}: evidence must cite a non-empty governed reviewArtifactPath")

    # --- claim boundary ---
    claim_boundary = _get(evidence, "claimBoundary")
    if claim_boundary is _MISSING or not isinstance(claim_boundary, str) or not claim_boundary:
        violations.append(f"{skill_id}: evidence must carry a non-empty claimBoundary")

    return violations


def check(
    package_path: Path,
    evidence_path: Path | None = None,
) -> list[str]:
    """Read-only entry point: load explicit package/evidence paths and check.

    ``evidence_path`` may be ``None`` when the package declares
    ``uatState: PASSED`` under this contract with no evidence file at all;
    that case is itself a violation, detected by
    :func:`check_evidence_admission`. Never writes to either path.
    """
    try:
        package = _load_json_object(package_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return [f"package document load failed: {exc}"]

    evidence: dict[str, Any] | None = None
    if evidence_path is not None:
        if not evidence_path.exists():
            return [f"evidence document does not exist: {evidence_path}"]
        try:
            evidence = _load_json_object(evidence_path)
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            return [f"evidence document load failed: {exc}"]

    return check_evidence_admission(package, evidence, package_label=str(package_path))


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Check read-only admission of ASSF behavioral evaluation evidence "
            "before a package's uatState: PASSED claim is accepted"
        )
    )
    parser.add_argument(
        "--package",
        type=Path,
        required=True,
        help="path to the package/registry-entry JSON document",
    )
    parser.add_argument(
        "--evidence",
        type=Path,
        default=None,
        help="path to the behavioral evaluation evidence JSON document",
    )
    args = parser.parse_args()

    print("=== CVF ASSF Behavioral Evaluation Evidence Admission Check ===")
    violations = check(args.package, args.evidence)
    if violations:
        print("ADMISSION VIOLATIONS:")
        for violation in violations:
            print(f"  - {violation}")
        print("\nFAIL - behavioral evaluation evidence admission is not bounded.")
        return 1

    print("PASS - behavioral evaluation evidence admission is bounded and consistent.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
