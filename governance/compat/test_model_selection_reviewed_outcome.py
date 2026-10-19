"""Focused offline tests for the declared ReviewedOutcomeLink consistency API."""

from __future__ import annotations

import copy
import json
import math
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from governance.compat.model_selection_reviewed_outcome import (
    PROFILE_VERSION,
    validate_outcome_record,
)


ROOT = Path(__file__).resolve().parents[2]
EXAMPLE = ROOT / "docs/reviews/evidence/model-selection-s2-r2-outcome-example-20261011.json"
MODULE = ROOT / "governance/compat/model_selection_reviewed_outcome.py"
RUNTIME_TEMP = ROOT / ".cvf/runtime/model-selection-s2-r2-20261011/test-inputs"


def sample() -> dict:
    return json.loads(EXAMPLE.read_text(encoding="utf-8"))


def codes(record: dict) -> set[str]:
    return {item["code"] for item in validate_outcome_record(record)}


class OutcomeApiTests(unittest.TestCase):
    def test_retrospective_repaired_example_is_valid(self):
        record = sample()
        self.assertEqual(record["basis"], "RETROSPECTIVE_PROJECTION")
        self.assertEqual(record["decision"]["candidates"][0]["requested"]["effort"], "xhigh")
        self.assertIsNone(record["outcome"]["attempts"][0]["observed"]["model"])
        self.assertEqual(validate_outcome_record(record), [])

    def test_valid_accepted_unrepaired_projection(self):
        record = sample()
        out = record["outcome"]
        out["repairs"] = []
        out["initialReturn"]["firstDisposition"] = "ACCEPTED_UNREPAIRED"
        out["initialReturn"]["ref"] = copy.deepcopy(out["finalReturn"])
        out["initialReturn"]["artifacts"] = copy.deepcopy(out["acceptedArtifacts"])
        out["acceptedArtifacts"] = copy.deepcopy(out["initialReturn"]["artifacts"])
        self.assertEqual(validate_outcome_record(record), [])

    def test_valid_pending_return_and_review(self):
        record = sample()
        out = record["outcome"]
        out["initialReturn"]["firstDisposition"] = "PENDING_REVIEW"
        out["finalReturn"] = None
        out["repairs"] = []
        out["review"] = {
            "disposition": "PENDING",
            "actor": None,
            "invocationId": None,
            "ref": None,
            "reviewedAt": None,
            "unknownReason": "No terminal review has been recorded in this synthetic pending case.",
        }
        out["technicalDisposition"] = "PENDING_REVIEW"
        out["acceptedArtifacts"] = []
        self.assertEqual(validate_outcome_record(record), [])

    def test_declared_failed_history_is_exactly_listed(self):
        record = sample()
        out = record["outcome"]
        attempt = copy.deepcopy(out["attempts"][0])
        attempt.update({
            "attemptId": "secondary-failed-attempt",
            "workerActor": "ANOTHER_INTERNAL_WORKER",
            "workerInvocationId": "another-invocation",
            "status": "FAILED",
            "startedAt": "2026-10-11T03:35:00Z",
            "endedAt": "2026-10-11T03:35:02Z",
        })
        out["attempts"].append(attempt)
        out["failedOrAbandonedAttemptIds"] = [attempt["attemptId"]]
        self.assertEqual(validate_outcome_record(record), [])
        out["failedOrAbandonedAttemptIds"] = []
        self.assertIn("ATTEMPT_HISTORY", codes(record))

    def test_embedded_decision_digest_drift_is_rejected(self):
        record = sample()
        record["decision"]["selection"]["rationale"] += " Changed after digest."
        self.assertIn("DECISION_DRIFT", codes(record))

    def test_wrong_decision_join_is_rejected(self):
        record = sample()
        record["outcome"]["decisionId"] = "another-decision"
        self.assertIn("DECISION_JOIN", codes(record))

    def test_wrong_attempt_candidate_join_is_rejected(self):
        record = sample()
        record["outcome"]["attempts"][0]["candidateId"] = "other-candidate"
        self.assertIn("ATTEMPT_JOIN", codes(record))

    def test_duplicate_attempt_and_repair_ids_are_rejected(self):
        record = sample()
        out = record["outcome"]
        duplicate = copy.deepcopy(out["attempts"][0])
        out["attempts"].append(duplicate)
        self.assertIn("DUPLICATE_ID", codes(record))
        out["attempts"].pop()
        out["repairs"][1]["repairId"] = out["repairs"][0]["repairId"]
        self.assertIn("DUPLICATE_ID", codes(record))

    def test_normalized_reviewer_actor_and_invocation_must_be_independent(self):
        record = sample()
        record["outcome"]["review"]["actor"] = "internalAgentS2Worker"
        record["outcome"]["review"]["invocationId"] = "/root/s2_luna_worker"
        self.assertIn("REVIEW_INDEPENDENCE", codes(record))

    def test_hidden_known_identity_mismatch_cannot_be_unknown(self):
        record = sample()
        attempt = record["outcome"]["attempts"][0]
        attempt["observed"]["model"] = "different-model"
        attempt["observed"]["unknownReason"] = "Other identity dimensions remain unknown."
        attempt["observedBasis"] = "VERIFIED_RUNTIME"
        attempt["runtimeEvidence"] = {"locator": "runtime-evidence", "sha256": "a" * 64}
        self.assertIn("CONFIGURATION_DISPOSITION", codes(record))
        attempt["configurationDisposition"] = "DEVIATION"
        self.assertIn("CONFIGURATION_DISPOSITION", codes(record))
        record["outcome"]["deviations"] = [{
            "attemptId": attempt["attemptId"],
            "kind": "CONFIGURATION",
            "reason": "Observed model differs from the requested model.",
            "evidence": None,
        }]
        self.assertEqual(validate_outcome_record(record), [])

    def test_unresolved_identity_cannot_claim_match(self):
        record = sample()
        record["outcome"]["attempts"][0]["configurationDisposition"] = "MATCH"
        self.assertIn("CONFIGURATION_DISPOSITION", codes(record))

    def test_changed_accepted_artifact_requires_matching_repair_attribution(self):
        record = sample()
        record["outcome"]["acceptedArtifacts"][0]["sha256"] = "a" * 64
        self.assertIn("REPAIR_ATTRIBUTION", codes(record))

    def test_changed_final_return_requires_matching_primary_local_repair(self):
        record = sample()
        record["outcome"]["finalReturn"]["sha256"] = "b" * 64
        self.assertIn("REPAIR_ATTRIBUTION", codes(record))

    def test_duplicate_artifact_locator_is_rejected(self):
        record = sample()
        duplicate = copy.deepcopy(record["outcome"]["initialReturn"]["artifacts"][0])
        record["outcome"]["initialReturn"]["artifacts"].append(duplicate)
        self.assertIn("DUPLICATE_ID", codes(record))

    def test_timestamp_comparison_uses_timezone_aware_instants(self):
        record = sample()
        attempt = record["outcome"]["attempts"][0]
        attempt["startedAt"] = "2026-10-11T04:00:00+01:00"
        attempt["endedAt"] = "2026-10-11T03:30:00Z"
        self.assertEqual(validate_outcome_record(record), [])
        attempt["endedAt"] = "2026-10-11T02:59:00Z"
        self.assertIn("CHRONOLOGY", codes(record))

    def test_capture_before_primary_start_is_rejected(self):
        record = sample()
        initial = record["outcome"]["initialReturn"]
        initial["capturedAt"] = "2026-10-11T03:34:46Z"
        initial["unknownReason"] = None
        self.assertIn("CHRONOLOGY", codes(record))

    def test_nonliteral_timestamp_separator_is_rejected(self):
        record = sample()
        record["outcome"]["attempts"][0]["startedAt"] = "2026-10-11_03:34:47Z"
        self.assertIn("FORMAT", codes(record))

    def test_unknown_money_is_not_zero_and_cost_units_are_checked(self):
        record = sample()
        stage = {
            "stage": "EXECUTION",
            "unit": "MONEY",
            "amount": None,
            "currency": None,
            "window": "historical worker task",
            "unknownReason": "Billing was not exposed.",
            "actor": "INTERNAL_AGENT_S2_WORKER",
            "basis": "UNKNOWN",
        }
        record["outcome"]["telemetry"] = [stage]
        self.assertEqual(validate_outcome_record(record), [])
        record["outcome"]["telemetry"].append(copy.deepcopy(stage))
        self.assertIn("COST_UNITS", codes(record))
        record["outcome"]["telemetry"] = [dict(stage, amount=True)]
        self.assertIn("TYPE", codes(record))

    def test_nonfinite_api_number_is_rejected_without_exception(self):
        record = sample()
        record["outcome"]["telemetry"] = [{
            "stage": "EXECUTION", "unit": "TOKENS", "amount": math.inf,
            "currency": None, "window": "worker", "unknownReason": None,
            "actor": "worker", "basis": "MEASURED",
        }]
        errors = validate_outcome_record(record)
        self.assertEqual(errors[0]["code"], "NONFINITE_NUMBER")

    def test_embedded_malformed_decision_does_not_hide_safe_outcome_sibling(self):
        record = sample()
        record["decision"]["task"] = "malformed"
        record["outcome"]["decisionId"] = "sibling-mismatch"
        errors = validate_outcome_record(record)
        self.assertTrue(any(item["pointer"].startswith("/decision") for item in errors))
        self.assertTrue(any(item["code"] == "DECISION_JOIN" for item in errors))

    def test_api_cycle_and_container_depth_fail_safely(self):
        record = sample()
        record["cycle"] = record
        self.assertTrue(validate_outcome_record(record))
        deep = sample()
        cursor = deep
        for _ in range(33):
            cursor["next"] = {}
            cursor = cursor["next"]
        self.assertEqual(validate_outcome_record(deep)[0]["code"], "SHAPE")


    def test_pending_reviewer_cannot_alias_any_worker(self):
        record = sample()
        out = record["outcome"]
        out["technicalDisposition"] = "PENDING_REVIEW"
        out["acceptedArtifacts"] = []
        out["review"].update(disposition="PENDING", ref=None, reviewedAt=None, unknownReason="Review pending.")
        out["review"]["actor"] = "internalAgentS2Worker"
        self.assertIn("REVIEW_INDEPENDENCE", codes(record))

    def test_malformed_worker_identity_preserves_type_and_sibling_errors(self):
        for field in ("workerActor", "workerInvocationId"):
            for phase in ("LOCAL_REVIEW", "WORKER_PRE_RETURN"):
                with self.subTest(field=field, phase=phase):
                    record = sample()
                    record["outcome"]["attempts"][0][field] = {}
                    record["outcome"]["repairs"][0]["phase"] = phase
                    record["outcome"]["procedureReason"] = []
                    errors = validate_outcome_record(record)
                    self.assertTrue(any(e["code"] == "TYPE" and e["pointer"] == "/outcome/attempts/0/" + field for e in errors))
                    self.assertTrue(any(e["code"] == "TYPE" and e["pointer"] == "/outcome/procedureReason" for e in errors))

    def test_unrepaired_first_disposition_still_forbids_pending_local_repairs(self):
        record = sample()
        out = record["outcome"]
        out["initialReturn"]["firstDisposition"] = "ACCEPTED_UNREPAIRED"
        out["technicalDisposition"] = "PENDING_REVIEW"
        out["acceptedArtifacts"] = []
        out["review"].update(disposition="PENDING", ref=None, reviewedAt=None, unknownReason="Later review pending.")
        self.assertIn("REPAIR_ATTRIBUTION", codes(record))

    def test_invalid_time_offsets_and_naive_cross_clocks_keep_safe_siblings(self):
        record = sample()
        record["outcome"]["attempts"][0]["startedAt"] = "2026-10-11T03:00:00+00:99"
        self.assertIn("FORMAT", codes(record))
        for location in ("review", "decision"):
            with self.subTest(location=location):
                record = sample()
                record["outcome"]["repairs"][0].update(at="2026-10-11T04:08:00Z", clockUnknownReason=None)
                record["outcome"]["procedureReason"] = {}
                if location == "review":
                    record["outcome"]["review"]["reviewedAt"] = "2026-10-11T04:10:00"
                else:
                    record["basis"] = "ORIGINAL_RECORD"
                    record["decision"]["selection"]["decidedAt"] = "2026-10-11T02:00:00"
                errors = validate_outcome_record(record)
                self.assertTrue(any(e["code"] == "FORMAT" for e in errors))
                self.assertTrue(any(e["code"] == "TYPE" and e["pointer"] == "/outcome/procedureReason" for e in errors))


class OutcomeCliTests(unittest.TestCase):
    def invoke(self, raw: bytes):
        RUNTIME_TEMP.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=RUNTIME_TEMP) as temp:
            path = Path(temp) / "input.json"
            path.write_bytes(raw)
            result = subprocess.run(
                [sys.executable, str(MODULE), "--input", str(path)],
                cwd=ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
        self.assertEqual(result.stderr, "")
        body = json.loads(result.stdout)
        self.assertEqual(set(body), {"profileVersion", "disposition", "executionAuthorized", "errors"})
        self.assertEqual(body["profileVersion"], PROFILE_VERSION)
        self.assertIs(body["executionAuthorized"], False)
        return result.returncode, body

    def test_cli_valid_example_exact_result(self):
        code, body = self.invoke(EXAMPLE.read_bytes())
        self.assertEqual(code, 0)
        self.assertEqual(body, {
            "profileVersion": PROFILE_VERSION,
            "disposition": "VALID_OUTCOME_RECORD_ONLY",
            "executionAuthorized": False,
            "errors": [],
        })

    def test_cli_invalid_record_exit_and_envelope(self):
        record = sample()
        record["outcome"]["decisionId"] = "wrong"
        code, body = self.invoke(json.dumps(record).encode("utf-8"))
        self.assertEqual(code, 1)
        self.assertEqual(body["disposition"], "INVALID_OUTCOME_RECORD")
        self.assertTrue(any(e["code"] == "DECISION_JOIN" for e in body["errors"]))

    def test_cli_malformed_worker_actor_has_controlled_diagnostic(self):
        record = sample()
        record["outcome"]["attempts"][0]["workerActor"] = {}
        code, body = self.invoke(json.dumps(record).encode("utf-8"))
        self.assertEqual(code, 1)
        self.assertTrue(any(e["code"] == "TYPE" and e["pointer"] == "/outcome/attempts/0/workerActor" for e in body["errors"]))

    def test_cli_duplicate_keys_and_nonfinite_constant_are_input_errors(self):
        for raw, expected in ((b'{"a":1,"a":2}', "DUPLICATE_KEY"), (b'{"a":NaN}', "NONFINITE_NUMBER")):
            with self.subTest(expected=expected):
                code, body = self.invoke(raw)
                self.assertEqual(code, 2)
                self.assertEqual(body["disposition"], "INPUT_ERROR")
                self.assertEqual(body["errors"][0]["code"], expected)

    def test_cli_encoding_size_and_depth_boundaries(self):
        cases = [
            (b"\xff", "INPUT_ENCODING"),
            (b" " * (1024 * 1024 + 1), "INPUT_SIZE"),
            ((b"[" * 34) + b"0" + (b"]" * 34), "INPUT_DEPTH"),
        ]
        for raw, expected in cases:
            with self.subTest(expected=expected):
                code, body = self.invoke(raw)
                self.assertEqual(code, 2)
                self.assertEqual(body["disposition"], "INPUT_ERROR")
                self.assertEqual(body["errors"][0]["code"], expected)


if __name__ == "__main__":
    unittest.main()
