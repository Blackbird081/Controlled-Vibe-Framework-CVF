#!/usr/bin/env python3
"""Focused tests for the DARA-T3 WP-ARCH-003 historical replay helper (R1)."""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))

import dara_t3_historical_replay as replay  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_PATH = REPO_ROOT / "governance/compat/fixtures/dara_t3_wp_arch_003_historical_replay.json"


@pytest.fixture()
def fixture() -> dict:
    return replay.load_fixture(FIXTURE_PATH)


def _seeded(fixture_dict: dict, case_id: str) -> dict:
    return next(c for c in fixture_dict["seededCases"] if c["caseId"] == case_id)


def test_fixture_loads_and_has_required_keys(fixture: dict) -> None:
    assert fixture["schemaVersion"] == "cvf.dara.t3HistoricalReplayFixture.v2"
    assert len(fixture["sources"]) == 7
    assert len(fixture["rawCases"]) == 3
    assert len(fixture["seededCases"]) >= 11
    total = len(fixture["rawCases"]) + len(fixture["seededCases"])
    assert total >= 12


def test_every_seeded_case_has_structured_oracle_input(fixture: dict) -> None:
    for case in fixture["seededCases"]:
        assert "oracleInput" in case, case["caseId"]
        assert isinstance(case["oracleInput"], dict)


def test_source_hashes_all_match(fixture: dict) -> None:
    results = replay.verify_source_hashes(fixture)
    assert len(results) == 7
    for row in results:
        assert row["match"] is True, row


def test_source_drift_detected_on_hash_mismatch(fixture: dict) -> None:
    tampered = copy.deepcopy(fixture)
    tampered["sources"][0]["sha256"] = "0" * 64
    result = replay.run_replay(tampered)
    assert result["sourceDrift"] is True
    assert result["terminalVerdict"] == "BLOCKED_WITH_REASON"


def test_source_drift_detected_on_missing_source_path(fixture: dict) -> None:
    tampered = copy.deepcopy(fixture)
    tampered["sources"][0]["path"] = "docs/does/not/exist/nonexistent_source.md"
    result = replay.run_replay(tampered)
    assert result["sourceDrift"] is True
    assert result["terminalVerdict"] == "BLOCKED_WITH_REASON"


def test_raw_cases_earliest_stop_is_pre_invocation_unclassified(fixture: dict) -> None:
    result = replay.run_replay(fixture)
    assert len(result["rawCaseResults"]) == 3
    for row in result["rawCaseResults"]:
        assert row["matched"] is True, row
        assert row["actualViolationClass"] == "BLOCKED_ARCHITECTURE_APPLICABILITY_UNCLASSIFIED"
        assert row["avoidedInvocation"] is True


def test_raw_case_invocation_ordinals_are_sequential(fixture: dict) -> None:
    ordinals = sorted(case["invocationOrdinal"] for case in fixture["rawCases"])
    assert ordinals == [1, 2, 3]


def test_all_named_seeded_families_represented(fixture: dict) -> None:
    required = set(fixture["namedFamiliesRequired"])
    represented = {case["namedFamily"] for case in fixture["seededCases"]}
    missing = required - represented
    assert not missing, f"missing named families: {sorted(missing)}"


def test_clean_control_case_present_and_not_blocked(fixture: dict) -> None:
    case = _seeded(fixture, "SEEDED-CLEAN-CONTROL")
    result = replay.evaluate_seeded_case(case)
    assert result["actualViolationClass"] == "NOT_BLOCKED"
    assert result["observedIssueTokens"] == []


# --- R1-01: real seeded oracle evaluation (not tautological copying) ---


def test_duplicate_owner_stimulus_produces_real_observed_issue(fixture: dict) -> None:
    case = _seeded(fixture, "SEEDED-DUPLICATE-OWNER")
    result = replay.evaluate_seeded_case(case)
    assert result["caught"] is True
    assert any("duplicate `behaviorIdentity`" in tok for tok in result["observedIssueTokens"])


def test_missing_registration_stimulus_produces_real_observed_issue(fixture: dict) -> None:
    case = _seeded(fixture, "SEEDED-MISSING-REGISTRATION")
    result = replay.evaluate_seeded_case(case)
    assert result["caught"] is True
    assert any("registrationPath" in tok for tok in result["observedIssueTokens"])


def test_missing_runtime_consumer_stimulus_produces_real_observed_issue(fixture: dict) -> None:
    case = _seeded(fixture, "SEEDED-MISSING-RUNTIME-CONSUMER")
    result = replay.evaluate_seeded_case(case)
    assert result["caught"] is True
    assert any("runtimeConsumerPath" in tok or "runtime consumer" in tok for tok in result["observedIssueTokens"])


def test_incomplete_trust_link_stimulus_produces_real_observed_issue(fixture: dict) -> None:
    case = _seeded(fixture, "SEEDED-INCOMPLETE-PRODUCER-TRUST-LINK")
    result = replay.evaluate_seeded_case(case)
    assert result["caught"] is True
    assert any("trustSource" in tok for tok in result["observedIssueTokens"])


def test_placeholder_evidence_path_stimulus_produces_real_observed_issue(fixture: dict) -> None:
    case = _seeded(fixture, "SEEDED-PLACEHOLDER-EVIDENCE-PATH")
    result = replay.evaluate_seeded_case(case)
    assert result["caught"] is True
    assert any("placeholder" in tok for tok in result["observedIssueTokens"])


def test_rollback_outside_manifest_stimulus_produces_real_observed_issue(fixture: dict) -> None:
    case = _seeded(fixture, "SEEDED-ROLLBACK-OUTSIDE-MANIFEST")
    result = replay.evaluate_seeded_case(case)
    assert result["caught"] is True
    assert any("BLOCKED_ROLLBACK_OUTSIDE_WRITABLE_MANIFEST" in tok for tok in result["observedIssueTokens"])


def test_self_authored_semantic_acceptance_stimulus_produces_real_observed_issue(fixture: dict) -> None:
    case = _seeded(fixture, "SEEDED-SELF-AUTHORED-SEMANTIC-ACCEPTANCE")
    result = replay.evaluate_seeded_case(case)
    assert result["caught"] is True
    assert any("worker-authored as" in tok for tok in result["observedIssueTokens"])


def test_exhausted_quota_stimulus_produces_real_observed_issue(fixture: dict) -> None:
    case = _seeded(fixture, "SEEDED-EXHAUSTED-QUOTA")
    result = replay.evaluate_seeded_case(case)
    assert result["caught"] is True
    assert result["actualViolationClass"] == "BLOCKED_INVOCATION_CEILING_REACHED"
    assert any("BLOCKED_INVOCATION_CEILING_REACHED" in tok for tok in result["observedIssueTokens"])


def test_unclassified_machine_result_stimulus_produces_real_observed_issue(fixture: dict) -> None:
    case = _seeded(fixture, "SEEDED-UNCLASSIFIED-MACHINE-RESULT")
    result = replay.evaluate_seeded_case(case)
    assert result["caught"] is True
    assert any("is absent from this" in tok for tok in result["observedIssueTokens"])


def test_unknown_usage_stimulus_is_blocked_by_real_quota_admission_owner(fixture: dict) -> None:
    case = _seeded(fixture, "SEEDED-UNKNOWN-USAGE")
    result = replay.evaluate_seeded_case(case)
    assert result["caught"] is True
    assert result["actualViolationClass"] == "BLOCKED_USAGE_UNKNOWN"
    assert any("BLOCKED_USAGE_UNKNOWN" in tok for tok in result["observedIssueTokens"])


# --- R1-02: metamorphic / adversarial sensitivity (not tautological) ---


def test_removing_all_seeded_prose_does_not_change_observed_result(fixture: dict) -> None:
    """R1-A03: sourceFinding/note prose is never read by the renderer or the
    validator; only oracleInput drives the observed result."""
    case = copy.deepcopy(_seeded(fixture, "SEEDED-DUPLICATE-OWNER"))
    before = replay.evaluate_seeded_case(case)
    case["sourceFinding"] = "NO DEFECT DATA"
    case["namedFamily"] = case["namedFamily"]  # namedFamily is metadata, not oracle input
    after = replay.evaluate_seeded_case(case)
    assert before["actualViolationClass"] == after["actualViolationClass"]
    assert before["observedIssueTokens"] == after["observedIssueTokens"]


def test_neutralizing_duplicate_owner_stimulus_changes_observed_result(fixture: dict) -> None:
    """R1-A04: removing the actual defect-bearing stimulus must change the
    observed result, proving the oracle is not a tautology."""
    case = copy.deepcopy(_seeded(fixture, "SEEDED-DUPLICATE-OWNER"))
    before = replay.evaluate_seeded_case(case)
    assert before["caught"] is True
    case["oracleInput"]["matrixRows"][1]["canonicalOwnerPath"] = case["oracleInput"]["matrixRows"][0]["canonicalOwnerPath"]
    case["oracleInput"]["matrixRows"][1]["canonicalOwnerLocator"] = case["oracleInput"]["matrixRows"][0]["canonicalOwnerLocator"]
    case["oracleInput"]["matrixRows"][1]["criterionId"] = "C-DUP-2B"
    after = replay.evaluate_seeded_case(case)
    assert after["caught"] is False
    assert not any("duplicate `behaviorIdentity`" in tok for tok in after["observedIssueTokens"])


def test_neutralizing_missing_registration_stimulus_changes_observed_result(fixture: dict) -> None:
    case = copy.deepcopy(_seeded(fixture, "SEEDED-MISSING-REGISTRATION"))
    before = replay.evaluate_seeded_case(case)
    assert before["caught"] is True
    case["oracleInput"]["matrixRows"][0]["registrationPath"] = "EXTENSIONS/CVF_GUARD_CONTRACT/src/index.ts"
    after = replay.evaluate_seeded_case(case)
    assert not any("missing required field `registrationPath`" in tok for tok in after["observedIssueTokens"])


def test_inverting_expected_label_increases_mismatch_without_changing_actual(fixture: dict) -> None:
    """R1-A05: inverting only the expected label leaves the actual observed
    result fixed and causes a mismatch, proving actual is independently
    derived rather than copied from expected."""
    case = copy.deepcopy(_seeded(fixture, "SEEDED-DUPLICATE-OWNER"))
    real_actual = replay.evaluate_seeded_case(case)["actualViolationClass"]
    case["expectedViolationClass"] = "NOT_BLOCKED"
    inverted = replay.evaluate_seeded_case(case)
    assert inverted["actualViolationClass"] == real_actual
    assert inverted["matched"] is False


def test_zero_tolerance_recall_is_complete(fixture: dict) -> None:
    result = replay.run_replay(fixture)
    assert result["zeroToleranceMissCount"] == 0
    zt = result["zeroToleranceRecall"]
    assert zt["caughtCount"] == zt["requiredCount"]
    assert zt["requiredCount"] == 8


def test_zero_tolerance_miss_forces_return_to_design(fixture: dict) -> None:
    tampered = copy.deepcopy(fixture)
    for case in tampered["seededCases"]:
        if case["caseId"] == "SEEDED-DUPLICATE-OWNER":
            case["oracleInput"]["matrixRows"][1]["canonicalOwnerPath"] = case["oracleInput"]["matrixRows"][0]["canonicalOwnerPath"]
            case["oracleInput"]["matrixRows"][1]["canonicalOwnerLocator"] = case["oracleInput"]["matrixRows"][0]["canonicalOwnerLocator"]
            case["oracleInput"]["matrixRows"][1]["criterionId"] = "C-DUP-2B"
    result = replay.run_replay(tampered)
    assert result["zeroToleranceMissCount"] >= 1
    assert result["terminalVerdict"] == "RETURN_TO_DESIGN"


def test_missing_named_family_forces_return_to_design(fixture: dict) -> None:
    tampered = copy.deepcopy(fixture)
    tampered["seededCases"] = [
        case for case in tampered["seededCases"] if case["namedFamily"] != "unknown usage"
    ]
    result = replay.run_replay(tampered)
    assert "unknown usage" in result["missingNamedFamilies"]
    assert result["terminalVerdict"] == "RETURN_TO_DESIGN"


def test_false_positive_on_clean_control_forces_return_to_design(fixture: dict) -> None:
    """A clean-control case that the oracle wrongly blocks must be counted as
    a false positive and force RETURN_TO_DESIGN, not be silently accepted."""
    tampered = copy.deepcopy(fixture)
    for case in tampered["seededCases"]:
        if case["caseId"] == "SEEDED-CLEAN-CONTROL":
            case["oracleInput"]["architectureReadinessDeclaration"] = "BOGUS_TOKEN_NOT_ALLOWED"
    result = replay.run_replay(tampered)
    assert result["falsePositiveCount"] >= 1
    assert result["terminalVerdict"] == "RETURN_TO_DESIGN"


def test_metric_aggregation_reconciles_with_totals(fixture: dict) -> None:
    result = replay.run_replay(fixture)
    seeded = result["seededCaseResults"]
    defect_bearing = [row for row in seeded if row["expectedViolationClass"] != "NOT_BLOCKED"]
    clean = [row for row in seeded if row["expectedViolationClass"] == "NOT_BLOCKED"]
    recomputed_false_negatives = sum(1 for row in defect_bearing if not row["caught"])
    recomputed_false_positives = sum(1 for row in clean if row["caught"])
    assert recomputed_false_negatives == 0
    assert recomputed_false_positives == 0
    assert result["falsePositiveCount"] == recomputed_false_positives
    zt_rows = [row for row in seeded if row["zeroTolerance"]]
    assert result["zeroToleranceRecall"]["requiredCount"] == len(zt_rows)
    assert result["zeroToleranceRecall"]["caughtCount"] == sum(1 for row in zt_rows if row["caught"])
    assert result["seededMismatchCount"] == 0


def test_clean_fixture_terminal_verdict_blocks_avoidable_invocations(fixture: dict) -> None:
    result = replay.run_replay(fixture)
    assert result["falseNegativeCount"] == 0
    assert result["falsePositiveCount"] == 0
    assert result["terminalVerdict"] == "REPLAY_BLOCKS_AVOIDABLE_INVOCATIONS"
    assert result["avoidedInvocationCount"] == 3


def test_two_runs_are_byte_identical(fixture: dict) -> None:
    result_a = replay.run_replay(fixture)
    result_b = replay.run_replay(copy.deepcopy(fixture))
    normalized_a = replay._normalize_for_determinism(result_a)
    normalized_b = replay._normalize_for_determinism(result_b)
    assert normalized_a == normalized_b


def test_inverting_expected_earliest_stop_causes_mismatch_and_non_success(fixture: dict) -> None:
    """R2-03: changing only expectedEarliestStop leaves actual unchanged, matched=False,
    seededMismatchCount increases, and terminal verdict is non-success."""
    case = copy.deepcopy(_seeded(fixture, "SEEDED-DUPLICATE-OWNER"))
    real_result = replay.evaluate_seeded_case(case)
    real_actual_stop = real_result["actualEarliestStop"]
    real_actual_class = real_result["actualViolationClass"]

    case["expectedEarliestStop"] = "INTENTIONALLY_WRONG_STOP"
    inverted = replay.evaluate_seeded_case(case)

    assert inverted["actualEarliestStop"] == real_actual_stop
    assert inverted["actualViolationClass"] == real_actual_class
    assert inverted["matched"] is False

    tampered = copy.deepcopy(fixture)
    for c in tampered["seededCases"]:
        if c["caseId"] == "SEEDED-DUPLICATE-OWNER":
            c["expectedEarliestStop"] = "INTENTIONALLY_WRONG_STOP"
    result = replay.run_replay(tampered)
    assert result["seededMismatchCount"] >= 1
    assert result["terminalVerdict"] == "RETURN_TO_DESIGN"


def test_malformed_fixture_missing_required_key_raises() -> None:
    with pytest.raises(replay.FixtureError):
        replay.run_replay({"schemaVersion": "x", "sources": [], "rawCases": []})


def test_malformed_fixture_via_load_missing_key(tmp_path) -> None:
    bad_fixture = tmp_path / "bad_fixture.json"
    bad_fixture.write_text(json.dumps({"schemaVersion": "x"}), encoding="utf-8")
    with pytest.raises(replay.FixtureError):
        replay.load_fixture(bad_fixture)


def test_source_path_traversal_rejected() -> None:
    with pytest.raises(replay.FixtureError):
        replay._read_repo_relative("../outside_repo.txt")


def test_source_path_absolute_rejected() -> None:
    with pytest.raises(replay.FixtureError):
        replay._read_repo_relative("/etc/passwd")


# --- R1-04: command truth (meaningful nonzero exit codes) ---


def test_cli_main_returns_zero_only_for_replay_blocks_avoidable_invocations(capsys) -> None:
    exit_code = replay.main(["--fixture", str(FIXTURE_PATH), "--json"])
    assert exit_code == 0
    captured = capsys.readouterr()
    parsed = json.loads(captured.out)
    assert parsed["terminalVerdict"] == "REPLAY_BLOCKS_AVOIDABLE_INVOCATIONS"


def test_cli_main_nonzero_exit_on_malformed_fixture(tmp_path, capsys) -> None:
    bad_fixture = tmp_path / "bad.json"
    bad_fixture.write_text(json.dumps({"schemaVersion": "x"}), encoding="utf-8")
    exit_code = replay.main(["--fixture", str(bad_fixture), "--json"])
    assert exit_code != 0
    captured = capsys.readouterr()
    parsed = json.loads(captured.out)
    assert parsed["terminalVerdict"] == "BLOCKED_WITH_REASON"


def test_cli_main_nonzero_exit_on_source_drift(fixture: dict, tmp_path, capsys) -> None:
    tampered = copy.deepcopy(fixture)
    tampered["sources"][0]["sha256"] = "0" * 64
    drift_fixture = tmp_path / "drift.json"
    drift_fixture.write_text(json.dumps(tampered), encoding="utf-8")
    exit_code = replay.main(["--fixture", str(drift_fixture), "--json"])
    assert exit_code != 0
    captured = capsys.readouterr()
    parsed = json.loads(captured.out)
    assert parsed["terminalVerdict"] == "BLOCKED_WITH_REASON"


def test_cli_main_two_invocations_byte_identical_stdout(capsys) -> None:
    replay.main(["--fixture", str(FIXTURE_PATH), "--json"])
    first_out = capsys.readouterr().out
    replay.main(["--fixture", str(FIXTURE_PATH), "--json"])
    second_out = capsys.readouterr().out
    assert first_out == second_out


def test_source_hash_verification_reports_expected_and_actual(fixture: dict) -> None:
    results = replay.verify_source_hashes(fixture)
    for row, source in zip(results, fixture["sources"]):
        assert row["id"] == source["id"]
        assert row["expectedSha256"] == source["sha256"]
        assert row["actualSha256"] == source["sha256"]


def test_render_oracle_input_excludes_prose_fields() -> None:
    """The renderer must never read expected*/sourceFinding/note fields, only
    oracleInput, so the seeded evaluation cannot be a tautology."""
    oracle_input = {
        "architectureReadinessDeclaration": "REQUIRED",
        "matrixRows": [{"criterionId": "C-1"}],
    }
    rendered = replay.render_oracle_input(oracle_input)
    assert "sourceFinding" not in rendered
    assert "expectedViolationClass" not in rendered
    assert "NO DEFECT DATA" not in rendered
