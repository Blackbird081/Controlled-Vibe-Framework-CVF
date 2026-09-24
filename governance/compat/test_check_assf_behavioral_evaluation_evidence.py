"""Tests for check_assf_behavioral_evaluation_evidence.py.

All fixtures are hermetic: every test writes its package/evidence documents
into a fresh ``tempfile.TemporaryDirectory`` and never touches repository
data. No network, credential, or provider access occurs anywhere in this
file. Rewritten per the consolidated R1 rework work order
(ACEL-G3-T2-R1-CONSOLIDATED-SEMANTIC-REWORK).
"""

import json
import sys
import tempfile
import unittest
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from check_assf_behavioral_evaluation_evidence import (  # noqa: E402
    check,
    check_evidence_admission,
)

CONTRACT_CITATION = (
    "docs/reference/agent_system_skills/CVF_ASSF_BEHAVIORAL_EVALUATION_CONTRACT.md"
)
SOURCE_HASH = "a" * 64
FIXTURE_HASH = "c" * 64


def _package(**overrides) -> dict:
    base = {
        "skillId": "skill-under-evaluation",
        "uatState": "PASSED",
        "acceptanceEvidence": f"see {CONTRACT_CITATION}",
        "sourceContentHash": SOURCE_HASH,
    }
    base.update(overrides)
    return base


def _passing_evidence(**overrides) -> dict:
    base = {
        "result": "PASS_WITH_EVIDENCE",
        "sourceContentHash": SOURCE_HASH,
        "fixtureContentHash": FIXTURE_HASH,
        "fixtureId": "fx-1",
        "repeatPolicy": "DETERMINISTIC",
        "repeatsObserved": 1,
        "repeatsRequired": 1,
        "captureMode": "OFFLINE_SYNTHETIC",
        "reviewArtifactPath": "docs/reviews/CVF_TEST_BEHAVIORAL_EVIDENCE_REVIEW.md",
        "claimBoundary": "pure offline evidence admission check",
    }
    base.update(overrides)
    return base


def _write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


class BehavioralEvaluationEvidenceAdmissionTests(unittest.TestCase):
    def test_passing_case_admits_with_no_violations(self) -> None:
        violations = check_evidence_admission(_package(), _passing_evidence())
        self.assertEqual(violations, [])

    def test_offline_synthetic_passing_case_admits_with_no_violations(self) -> None:
        violations = check_evidence_admission(
            _package(), _passing_evidence(captureMode="OFFLINE_SYNTHETIC")
        )
        self.assertEqual(violations, [])

    def test_package_not_declaring_contract_is_skipped(self) -> None:
        package = _package(acceptanceEvidence="unrelated evidence string")
        violations = check_evidence_admission(package, None)
        self.assertEqual(violations, [])

    def test_uat_not_passed_is_skipped(self) -> None:
        package = _package(uatState="IN_PROGRESS")
        violations = check_evidence_admission(package, None)
        self.assertEqual(violations, [])

    def test_missing_evidence_document_fails(self) -> None:
        violations = check_evidence_admission(_package(), None)
        self.assertTrue(any("no evidence document was supplied" in v for v in violations))

    def test_malformed_unknown_result_fails_closed(self) -> None:
        evidence = _passing_evidence(result="MAYBE_PASSED")
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("missing, malformed, or unknown" in v for v in violations))

    def test_missing_result_field_fails_closed(self) -> None:
        evidence = _passing_evidence()
        del evidence["result"]
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("missing, malformed, or unknown" in v for v in violations))

    def test_non_pass_result_fails(self) -> None:
        evidence = _passing_evidence(result="FAIL_WITH_DEFECTS")
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("requires evidence result" in v for v in violations))

    # --- R1: missing package source hash must fail ---
    def test_missing_package_source_hash_fails(self) -> None:
        package = _package()
        del package["sourceContentHash"]
        violations = check_evidence_admission(package, _passing_evidence())
        self.assertTrue(any("package sourceContentHash is missing or malformed" in v for v in violations))

    # --- R1: missing evidence source hash must fail ---
    def test_missing_evidence_source_hash_fails(self) -> None:
        evidence = _passing_evidence()
        del evidence["sourceContentHash"]
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("evidence sourceContentHash is missing or malformed" in v for v in violations))

    # --- R1: missing fixture hash must fail ---
    def test_missing_fixture_hash_fails(self) -> None:
        evidence = _passing_evidence()
        del evidence["fixtureContentHash"]
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("fixtureContentHash is missing or malformed" in v for v in violations))

    # --- R1: malformed hashes must fail ---
    def test_malformed_package_source_hash_fails(self) -> None:
        package = _package(sourceContentHash="not-a-hash")
        violations = check_evidence_admission(package, _passing_evidence())
        self.assertTrue(any("package sourceContentHash is missing or malformed" in v for v in violations))

    def test_malformed_evidence_source_hash_fails(self) -> None:
        evidence = _passing_evidence(sourceContentHash="zz" * 32)
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("evidence sourceContentHash is missing or malformed" in v for v in violations))

    def test_malformed_fixture_hash_fails(self) -> None:
        evidence = _passing_evidence(fixtureContentHash="short")
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("fixtureContentHash is missing or malformed" in v for v in violations))

    def test_stale_source_hash_fails(self) -> None:
        evidence = _passing_evidence(sourceContentHash="b" * 64)
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("is stale" in v for v in violations))

    # --- R1: missing repeat policy must fail ---
    def test_missing_repeat_policy_fails(self) -> None:
        evidence = _passing_evidence()
        del evidence["repeatPolicy"]
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("repeatPolicy is missing" in v for v in violations))

    def test_unknown_repeat_policy_fails_closed(self) -> None:
        evidence = _passing_evidence(repeatPolicy="OCCASIONAL")
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("repeatPolicy is unknown" in v for v in violations))

    # --- R1: missing repeat counts must fail ---
    def test_missing_repeats_observed_fails(self) -> None:
        evidence = _passing_evidence()
        del evidence["repeatsObserved"]
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("repeatsObserved is missing" in v for v in violations))

    def test_missing_repeats_required_fails(self) -> None:
        evidence = _passing_evidence()
        del evidence["repeatsRequired"]
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("repeatsRequired is missing" in v for v in violations))

    # --- R1: inconsistent repeat counts must fail ---
    def test_inconsistent_repeats_required_fails(self) -> None:
        evidence = _passing_evidence(repeatPolicy="DETERMINISTIC", repeatsRequired=3)
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("is inconsistent with repeatPolicy" in v for v in violations))

    def test_insufficient_stochastic_repeat_evidence_fails(self) -> None:
        evidence = _passing_evidence(repeatPolicy="STOCHASTIC", repeatsObserved=2, repeatsRequired=3)
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("requires exactly 3 consecutive" in v for v in violations))

    def test_sufficient_stochastic_repeat_evidence_passes(self) -> None:
        evidence = _passing_evidence(repeatPolicy="STOCHASTIC", repeatsObserved=3, repeatsRequired=3)
        violations = check_evidence_admission(_package(), evidence)
        self.assertEqual(violations, [])

    def test_deterministic_more_than_one_repeat_fails(self) -> None:
        evidence = _passing_evidence(repeatPolicy="DETERMINISTIC", repeatsObserved=2, repeatsRequired=1)
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("requires exactly 1 consecutive" in v for v in violations))

    def test_repeats_observed_wrong_type_fails(self) -> None:
        evidence = _passing_evidence(repeatsObserved="one")
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("repeatsObserved must be an integer" in v for v in violations))

    def test_repeats_observed_boolean_fails(self) -> None:
        evidence = _passing_evidence(repeatsObserved=True)
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("repeatsObserved must be an integer" in v for v in violations))

    # --- R1: missing/unknown capture mode must fail ---
    def test_missing_capture_mode_fails(self) -> None:
        evidence = _passing_evidence()
        del evidence["captureMode"]
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("captureMode is missing" in v for v in violations))

    def test_unknown_capture_mode_fails_closed(self) -> None:
        evidence = _passing_evidence(captureMode="SIMULATED")
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("captureMode is unknown" in v for v in violations))

    def test_unauthorized_live_capture_mode_fails_closed(self) -> None:
        evidence = _passing_evidence(captureMode="LIVE")
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("captureMode is unknown" in v for v in violations))

    # --- MOCK_REPLAY provenance / evaluation clock ---
    def test_mock_replay_without_provenance_fails(self) -> None:
        evidence = _passing_evidence(
            captureMode="MOCK_REPLAY",
            evaluationClockIso="2026-09-16T00:00:00Z",
            provenanceExpiry="2099-01-01T00:00:00Z",
        )
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("requires a non-empty provenanceSourceCommit" in v for v in violations))

    def test_mock_replay_missing_evaluation_clock_fails(self) -> None:
        evidence = _passing_evidence(
            captureMode="MOCK_REPLAY",
            provenanceSourceCommit="abc123",
            provenanceExpiry="2099-01-01T00:00:00Z",
        )
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("requires evaluationClockIso" in v for v in violations))

    def test_mock_replay_with_provenance_passes(self) -> None:
        evidence = _passing_evidence(
            captureMode="MOCK_REPLAY",
            provenanceSourceCommit="abc123",
            evaluationClockIso="2026-09-16T00:00:00Z",
            provenanceExpiry="2099-01-01T00:00:00Z",
        )
        violations = check_evidence_admission(_package(), evidence)
        self.assertEqual(violations, [])

    def test_mock_replay_malformed_expiry_date_fails(self) -> None:
        evidence = _passing_evidence(
            captureMode="MOCK_REPLAY",
            provenanceSourceCommit="abc123",
            evaluationClockIso="2026-09-16T00:00:00Z",
            provenanceExpiry="not-a-date",
        )
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("provenanceExpiry is malformed" in v for v in violations))

    def test_mock_replay_non_iso8601_expiry_fails(self) -> None:
        evidence = _passing_evidence(
            captureMode="MOCK_REPLAY",
            provenanceSourceCommit="abc123",
            evaluationClockIso="2026-09-16T00:00:00Z",
            provenanceExpiry="January 1, 2099",
        )
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("provenanceExpiry is malformed" in v for v in violations))

    def test_mock_replay_expired_fails(self) -> None:
        evidence = _passing_evidence(
            captureMode="MOCK_REPLAY",
            provenanceSourceCommit="abc123",
            evaluationClockIso="2026-09-16T00:00:00Z",
            provenanceExpiry="2026-01-01T00:00:00Z",
        )
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("is not strictly after evaluationClockIso" in v for v in violations))

    def test_mock_replay_expiry_equal_to_clock_fails(self) -> None:
        evidence = _passing_evidence(
            captureMode="MOCK_REPLAY",
            provenanceSourceCommit="abc123",
            evaluationClockIso="2026-09-16T00:00:00Z",
            provenanceExpiry="2026-09-16T00:00:00Z",
        )
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("is not strictly after evaluationClockIso" in v for v in violations))

    def test_mock_replay_missing_replay_evaluation_clock_fails(self) -> None:
        evidence = _passing_evidence(
            captureMode="MOCK_REPLAY",
            provenanceSourceCommit="abc123",
            provenanceExpiry="2099-01-01T00:00:00Z",
        )
        evidence.pop("evaluationClockIso", None)
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("requires evaluationClockIso" in v for v in violations))

    # --- live overclaim rejection ---
    def test_offline_synthetic_cited_as_live_proof_fails(self) -> None:
        evidence = _passing_evidence(captureMode="OFFLINE_SYNTHETIC", citedAsLiveProof=True)
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("must never be cited as LIVE proof" in v for v in violations))

    def test_mock_replay_cited_as_live_proof_fails(self) -> None:
        evidence = _passing_evidence(
            captureMode="MOCK_REPLAY",
            provenanceSourceCommit="abc123",
            evaluationClockIso="2026-09-16T00:00:00Z",
            provenanceExpiry="2099-01-01T00:00:00Z",
            citedAsLiveProof="true",
        )
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("must never be cited as LIVE proof" in v for v in violations))

    def test_mock_replay_cited_as_live_proof_boolean_fails(self) -> None:
        evidence = _passing_evidence(
            captureMode="MOCK_REPLAY",
            provenanceSourceCommit="abc123",
            evaluationClockIso="2026-09-16T00:00:00Z",
            provenanceExpiry="2099-01-01T00:00:00Z",
            citedAsLiveProof=True,
        )
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("must never be cited as LIVE proof" in v for v in violations))

    def test_live_reference_only_cited_as_live_proof_fails(self) -> None:
        evidence = _passing_evidence(captureMode="LIVE_REFERENCE_ONLY", citedAsLiveProof=True)
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("must never be cited as LIVE proof" in v for v in violations))

    # --- baseline equivalence ---
    def test_nonequivalent_baseline_pair_fails(self) -> None:
        evidence = _passing_evidence(baselineRole="WITH", baselineEquivalent=False)
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("not proven equivalent" in v for v in violations))

    def test_missing_baseline_equivalent_fails(self) -> None:
        evidence = _passing_evidence(baselineRole="WITH")
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(
            any("requires an explicit baselineEquivalent" in v for v in violations)
        )

    def test_without_role_missing_baseline_equivalent_fails(self) -> None:
        evidence = _passing_evidence(baselineRole="WITHOUT")
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(
            any("requires an explicit baselineEquivalent" in v for v in violations)
        )

    def test_baseline_equivalent_true_passes(self) -> None:
        evidence = _passing_evidence(baselineRole="WITH", baselineEquivalent=True)
        violations = check_evidence_admission(_package(), evidence)
        self.assertEqual(violations, [])

    def test_baseline_role_none_does_not_require_equivalence(self) -> None:
        evidence = _passing_evidence(baselineRole="NONE")
        violations = check_evidence_admission(_package(), evidence)
        self.assertEqual(violations, [])

    def test_unknown_baseline_role_fails(self) -> None:
        evidence = _passing_evidence(baselineRole="SIDEWAYS")
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("baselineRole is unknown" in v for v in violations))

    # --- review artifact / claim boundary ---
    def test_missing_review_artifact_path_fails(self) -> None:
        evidence = _passing_evidence(reviewArtifactPath="")
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("must cite a non-empty governed reviewArtifactPath" in v for v in violations))

    def test_absent_review_artifact_path_field_fails(self) -> None:
        evidence = _passing_evidence()
        del evidence["reviewArtifactPath"]
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("must cite a non-empty governed reviewArtifactPath" in v for v in violations))

    def test_missing_claim_boundary_fails(self) -> None:
        evidence = _passing_evidence()
        del evidence["claimBoundary"]
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("must carry a non-empty claimBoundary" in v for v in violations))

    # --- fixture identity ---
    def test_missing_fixture_id_fails(self) -> None:
        evidence = _passing_evidence()
        del evidence["fixtureId"]
        violations = check_evidence_admission(_package(), evidence)
        self.assertTrue(any("fixtureId is missing or malformed" in v for v in violations))

    # --- non-mutation ---
    def test_never_mutates_inputs(self) -> None:
        package = _package()
        evidence = _passing_evidence()
        package_snapshot = json.loads(json.dumps(package))
        evidence_snapshot = json.loads(json.dumps(evidence))
        check_evidence_admission(package, evidence)
        self.assertEqual(package, package_snapshot)
        self.assertEqual(evidence, evidence_snapshot)


class BehavioralEvaluationEvidenceFileCheckTests(unittest.TestCase):
    def test_check_reads_hermetic_temp_files_and_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            package_path = root / "package.json"
            evidence_path = root / "evidence.json"
            _write_json(package_path, _package())
            _write_json(evidence_path, _passing_evidence())

            violations = check(package_path, evidence_path)

            self.assertEqual(violations, [])

    def test_check_fails_when_evidence_path_does_not_exist(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            package_path = root / "package.json"
            missing_evidence_path = root / "missing-evidence.json"
            _write_json(package_path, _package())

            violations = check(package_path, missing_evidence_path)

            self.assertTrue(any("does not exist" in v for v in violations))

    def test_check_fails_on_malformed_package_json(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            package_path = root / "package.json"
            package_path.write_text("{not valid json", encoding="utf-8")

            violations = check(package_path)

            self.assertTrue(any("package document load failed" in v for v in violations))

    def test_check_does_not_mutate_temp_files_on_disk(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            package_path = root / "package.json"
            evidence_path = root / "evidence.json"
            _write_json(package_path, _package())
            _write_json(evidence_path, _passing_evidence())
            package_bytes_before = package_path.read_bytes()
            evidence_bytes_before = evidence_path.read_bytes()

            check(package_path, evidence_path)

            self.assertEqual(package_path.read_bytes(), package_bytes_before)
            self.assertEqual(evidence_path.read_bytes(), evidence_bytes_before)


if __name__ == "__main__":
    unittest.main()
