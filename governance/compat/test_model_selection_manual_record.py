"""Focused offline tests for the S2-R1 declared-record validator."""

from __future__ import annotations

import copy
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from governance.compat.model_selection_manual_record import PROFILE_VERSION, validate_record


ROOT = Path(__file__).resolve().parents[2]
MODULE = ROOT / "governance" / "compat" / "model_selection_manual_record.py"
PIN = "a" * 64


def ref(locator: str = "docs/reviews/source.md") -> dict[str, str]:
    return {"locator": locator, "sha256": PIN}


def identity(model: str = "gpt-6-luna", role: str | None = "WORKER") -> dict[str, object]:
    return {
        "providerProduct": "openai",
        "model": model,
        "snapshot": "snapshot-1",
        "channel": "native",
        "effort": "xhigh",
        "harnessVersion": "harness-1",
        "toolProfile": "standard",
        "role": role,
        "unknownReason": None,
    }


def unknown_identity(reason: str = "runtime identity was not exposed") -> dict[str, object]:
    return {
        "providerProduct": None,
        "model": None,
        "snapshot": None,
        "channel": None,
        "effort": None,
        "harnessVersion": None,
        "toolProfile": None,
        "role": None,
        "unknownReason": reason,
    }


def evidence_row(candidate_id: str = "candidate-1", evidence_id: str = "evidence-1") -> dict[str, object]:
    return {
        "evidenceId": evidence_id,
        "candidateId": candidate_id,
        "evidenceClass": "LOCAL_REVIEWED_OUTCOME",
        "claimKind": "POSITIVE_QUALITY",
        "source": ref("docs/reviews/evidence/source.json"),
        "retrievedAt": "2026-10-11T00:00:00Z",
        "configurationMatch": "EXACT",
        "taskApplicability": "RELEVANT",
        "freshness": "CURRENT_FOR_DECISION",
        "testedConfiguration": identity(),
        "limitations": "one declared local task; no comparative claim",
    }


def valid_record() -> dict[str, object]:
    record: dict[str, object] = {
        "profileVersion": PROFILE_VERSION,
        "recordId": "record-1",
        "task": {
            "taskId": "task-1",
            "artifact": ref("docs/work_orders/task.md"),
            "surface": "AGENT_SEAT",
            "role": "WORKER",
            "outcome": "offline record consistency",
            "acceptanceFloor": ref("docs/work_orders/task.md#acceptance"),
            "choiceAuthority": ref("docs/work_orders/task.md#assignment"),
            "choiceKind": "EXPLICIT_ASSIGNMENT",
            "assignedCandidateId": "candidate-1",
            "provisionalAllowed": True,
        },
        "candidates": [{
            "candidateId": "candidate-1",
            "requested": identity(),
            "requestedBasis": "OPERATOR_REPORTED",
            "observed": unknown_identity(),
            "observedBasis": "UNRESOLVED",
            "runtimeEvidence": None,
            "eligible": True,
            "contextDisposition": "PENDING",
            "availability": "UNKNOWN",
        }],
        "evidence": [],
        "selection": {
            "decisionId": "decision-1",
            "owner": "LOCAL",
            "decidedAt": "2026-10-11T00:10:00+00:00",
            "disposition": "SELECT",
            "selectedCandidateId": "candidate-1",
            "operatorAssignmentDisposition": "HONORED_WITH_EVIDENCE_GAP",
            "qualityDisposition": "INSUFFICIENT",
            "evidenceIds": [],
            "rationale": "explicit assignment retained; predictive quality history is insufficient",
            "executionAuthorized": False,
            "frozenDigests": {"task": PIN, "candidates": PIN, "evidence": PIN},
        },
        "admission": {
            "disposition": "PENDING",
            "authorityDisposition": "PENDING",
            "methodDisposition": "PENDING",
            "contextDisposition": "PENDING",
            "budgetDisposition": "PENDING",
            "availabilityDisposition": "PENDING",
            "refs": [ref("docs/work_orders/task.md#admission")],
            "reason": "separate admission evidence is still pending",
        },
        "cost": {
            "stages": [{
                "stage": "EXECUTION",
                "unit": "MONEY",
                "amount": None,
                "currency": None,
                "window": "this task",
                "unknownReason": "no exposed bill",
            }],
            "hardCaps": [],
        },
        "learningLinks": [],
    }
    freeze(record)
    return record


def freeze(record: dict[str, object]) -> None:
    selection = record["selection"]
    assert isinstance(selection, dict)
    selection["frozenDigests"] = {
        key: hashlib.sha256(json.dumps(record[key], ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")).hexdigest()
        for key in ("task", "candidates", "evidence")
    }


def add_learning(record: dict[str, object], *, use: str = "CITED", disposition: str = "ACTIVE", branch: str = "LOCAL_OBSERVATION") -> None:
    record["learningLinks"] = [{
        "linkId": "learning-1",
        "laterDecisionId": "decision-1",
        "branch": branch,
        "source": ref("docs/reviews/prior.md"),
        "presentSourceDisposition": disposition,
        "currentCheckAt": "2026-10-11T00:05:00Z",
        "applicability": "PARTIAL",
        "applicabilityReason": "mechanism-level packet completeness only",
        "evidenceUse": use,
        "actionOrReason": "worker checked the declared behavior" if use != "CITED" else None,
        "verification": ref("docs/reviews/verification.md") if use != "CITED" else None,
    }]
    freeze(record)


def diagnostic_codes(record: object) -> set[str]:
    return {item["code"] for item in validate_record(record)}


def diagnostic_pairs(record: object) -> set[tuple[str, str]]:
    return {(item["code"], item["pointer"]) for item in validate_record(record)}


class ManualRecordValidatorTests(unittest.TestCase):
    def test_explicit_assignment_quality_gap_and_pending_admission_are_valid(self) -> None:
        record = valid_record()
        original = copy.deepcopy(record)
        self.assertEqual(validate_record(record), [])
        self.assertEqual(record, original)

    def test_delegated_supported_and_provisional_records_require_relevant_evidence(self) -> None:
        for quality in ("SUPPORTED", "PROVISIONAL"):
            with self.subTest(quality=quality):
                record = valid_record()
                record["task"]["choiceKind"] = "DELEGATED"
                record["task"]["assignedCandidateId"] = None
                record["evidence"] = [evidence_row()]
                selection = record["selection"]
                selection["operatorAssignmentDisposition"] = "NOT_APPLICABLE"
                selection["qualityDisposition"] = quality
                selection["evidenceIds"] = ["evidence-1"]
                freeze(record)
                self.assertEqual(validate_record(record), [])

    def test_hold_with_null_selection_and_no_eligible_candidate_is_valid(self) -> None:
        record = valid_record()
        record["candidates"][0]["eligible"] = False
        selection = record["selection"]
        selection["disposition"] = "HOLD_NO_ELIGIBLE_CANDIDATE"
        selection["selectedCandidateId"] = None
        selection["operatorAssignmentDisposition"] = "BLOCKED"
        freeze(record)
        self.assertEqual(validate_record(record), [])

    def test_actual_noncanonical_learning_enum_is_rejected_at_exact_pointer(self) -> None:
        record = valid_record()
        add_learning(record, use="CITED_PENDING_LOCAL_REVIEW")
        self.assertIn(("ENUM", "/learningLinks/0/evidenceUse"), diagnostic_pairs(record))

    def test_closed_shape_rejects_missing_and_extra_fields(self) -> None:
        record = valid_record()
        del record["task"]["surface"]
        record["task"]["extra"] = "not in this profile"
        self.assertIn(("SHAPE", "/task"), diagnostic_pairs(record))
        record = valid_record()
        record["unowned"] = True
        self.assertIn(("SHAPE", ""), diagnostic_pairs(record))

    def test_duplicate_ids_and_dangling_evidence_join_are_reported(self) -> None:
        record = valid_record()
        record["candidates"].append(copy.deepcopy(record["candidates"][0]))
        self.assertIn("DUPLICATE_ID", diagnostic_codes(record))
        record = valid_record()
        record["evidence"] = [evidence_row(candidate_id="missing")]
        freeze(record)
        self.assertIn(("DANGLING_REF", "/evidence/0/candidateId"), diagnostic_pairs(record))

    def test_selection_and_hold_invariants_are_enforced(self) -> None:
        record = valid_record()
        record["selection"]["disposition"] = "HOLD_EVIDENCE"
        self.assertIn("SELECTION_INVARIANT", diagnostic_codes(record))
        record = valid_record()
        record["selection"]["operatorAssignmentDisposition"] = "HONORED"
        self.assertIn("SELECTION_INVARIANT", diagnostic_codes(record))

    def test_delegated_insufficient_quality_cannot_select(self) -> None:
        record = valid_record()
        record["task"]["choiceKind"] = "DELEGATED"
        record["task"]["assignedCandidateId"] = None
        record["selection"]["operatorAssignmentDisposition"] = "NOT_APPLICABLE"
        freeze(record)
        self.assertIn("DELEGATED_EVIDENCE", diagnostic_codes(record))

    def test_unresolved_identity_cannot_be_promoted_to_verified_runtime(self) -> None:
        record = valid_record()
        record["candidates"][0]["observedBasis"] = "VERIFIED_RUNTIME"
        freeze(record)
        self.assertIn("IDENTITY_BASIS", diagnostic_codes(record))

    def test_exact_evidence_cannot_match_an_unknown_identity_dimension(self) -> None:
        record = valid_record()
        record["task"]["choiceKind"] = "DELEGATED"
        record["task"]["assignedCandidateId"] = None
        record["candidates"][0]["requested"]["snapshot"] = None
        record["candidates"][0]["requested"]["unknownReason"] = "snapshot was not exposed"
        evidence = evidence_row()
        evidence["testedConfiguration"]["snapshot"] = None
        evidence["testedConfiguration"]["unknownReason"] = "snapshot was not exposed"
        record["evidence"] = [evidence]
        record["selection"]["operatorAssignmentDisposition"] = "NOT_APPLICABLE"
        record["selection"]["qualityDisposition"] = "SUPPORTED"
        record["selection"]["evidenceIds"] = ["evidence-1"]
        freeze(record)
        self.assertIn(("EXACT_MATCH", "/evidence/0/configurationMatch"), diagnostic_pairs(record))

    def test_freeze_digest_drift_is_not_silently_repaired(self) -> None:
        record = valid_record()
        record["task"]["outcome"] = "changed after freeze"
        self.assertIn(("FREEZE_DRIFT", "/selection/frozenDigests/task"), diagnostic_pairs(record))

    def test_cost_units_unknown_to_zero_and_over_limit_bound_fail_closed(self) -> None:
        record = valid_record()
        record["cost"]["stages"][0]["amount"] = 0
        self.assertIn("COST_UNITS", diagnostic_codes(record))
        record = valid_record()
        record["cost"]["stages"][0]["currency"] = "USD"
        record["cost"]["hardCaps"] = [{
            "unit": "MONEY", "limit": 1, "currency": "USD", "window": "this task",
            "bound": 2, "boundReason": "source-backed upper bound",
        }]
        freeze(record)
        self.assertIn("COST_BOUND", diagnostic_codes(record))

    def test_retracted_source_and_parent_control_branch_cannot_claim_local_action(self) -> None:
        record = valid_record()
        add_learning(record, use="ACTION_VERIFIED", disposition="RETRACTED")
        self.assertIn("LEARNING_INVARIANT", diagnostic_codes(record))
        record = valid_record()
        add_learning(record, branch="PARENT_CONTROL")
        self.assertIn("LEARNING_INVARIANT", diagnostic_codes(record))

    def test_cycles_and_depth_are_controlled_before_digesting(self) -> None:
        cyclic = valid_record()
        cyclic["cycle"] = cyclic
        self.assertEqual(diagnostic_codes(cyclic), {"SHAPE"})
        deep = valid_record()
        nested: object = "leaf"
        for _ in range(33):
            nested = [nested]
        deep["task"]["outcome"] = nested
        self.assertIn("SHAPE", diagnostic_codes(deep))

    def test_iso_timestamp_rejects_arbitrary_separator(self) -> None:
        record = valid_record()
        record["selection"]["decidedAt"] = "2026-10-11X00:10:00+00:00"
        self.assertIn(("FORMAT", "/selection/decidedAt"), diagnostic_pairs(record))

    def test_budget_hold_can_record_owner_failure_or_overrun(self) -> None:
        record = valid_record()
        record["selection"].update(disposition="HOLD_OPERATOR_CONSTRAINT", selectedCandidateId=None, operatorAssignmentDisposition="BLOCKED")
        record["admission"].update(disposition="HOLD", budgetDisposition="HOLD", reason="budget owner declined allocation")
        self.assertEqual(validate_record(record), [])
        record["cost"]["stages"] = [{"stage": "EXECUTION", "unit": "TOKENS", "amount": 11, "currency": None, "window": "this task", "unknownReason": None}]
        record["cost"]["hardCaps"] = [{"unit": "TOKENS", "limit": 10, "currency": None, "window": "this task", "bound": 11, "boundReason": "known excess"}]
        self.assertEqual(validate_record(record), [])
        record["admission"]["budgetDisposition"] = "PASS"
        self.assertIn("COST_BOUND", diagnostic_codes(record))

    def test_malformed_join_keys_retain_field_and_sibling_errors(self) -> None:
        cases = [
            (lambda r: r["candidates"][0].update(requested=42), "/candidates/0/requested"),
            (lambda r: r["evidence"][0].update(candidateId=[]), "/evidence/0/candidateId"),
            (lambda r: r["selection"].update(evidenceIds=[{}]), "/selection/evidenceIds/0"),
            (lambda r: r["cost"].update(hardCaps=[{"unit": [], "limit": 10, "currency": None, "window": "this task", "bound": 1, "boundReason": "declared"}]), "/cost/hardCaps/0/unit"),
        ]
        for mutate, pointer in cases:
            with self.subTest(pointer=pointer):
                record = valid_record()
                record["evidence"] = [evidence_row()]
                mutate(record)
                record["profileVersion"] = "invalid sibling"
                freeze(record)
                pairs = diagnostic_pairs(record)
                self.assertIn(("TYPE", pointer), pairs)
                self.assertIn(("ENUM", "/profileVersion"), pairs)

    def test_nested_role_and_later_learning_pointers_keep_original_indices(self) -> None:
        record = valid_record()
        record["candidates"][0]["requested"]["role"] = "REVIEWER"
        add_learning(record)
        record["learningLinks"][0]["laterDecisionId"] = "missing"
        record["learningLinks"].insert(0, 42)
        freeze(record)
        pairs = diagnostic_pairs(record)
        self.assertIn(("IDENTITY_BASIS", "/candidates/0/requested/role"), pairs)
        self.assertIn(("DANGLING_REF", "/learningLinks/1/laterDecisionId"), pairs)

    def _cli(self, payload: bytes) -> tuple[subprocess.CompletedProcess[str], dict[str, object]]:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "record.json"
            path.write_bytes(payload)
            proc = subprocess.run(
                [sys.executable, str(MODULE), "--input", str(path)],
                cwd=ROOT,
                text=True,
                encoding="utf-8",
                errors="replace",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=False,
            )
        result = json.loads(proc.stdout)
        return proc, result

    def test_cli_valid_record_has_closed_result_and_exit_zero(self) -> None:
        proc, result = self._cli(json.dumps(valid_record()).encode("utf-8"))
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(set(result), {"profileVersion", "disposition", "executionAuthorized", "errors"})
        self.assertEqual(result["disposition"], "VALID_RECORD_ONLY")
        self.assertIs(result["executionAuthorized"], False)

    def test_cli_rejects_the_actual_noncanonical_learning_enum(self) -> None:
        record = valid_record()
        add_learning(record, use="CITED_PENDING_LOCAL_REVIEW")
        proc, result = self._cli(json.dumps(record).encode("utf-8"))
        self.assertEqual(proc.returncode, 1)
        self.assertEqual(result["disposition"], "INVALID_RECORD")
        self.assertIn(
            {"code": "ENUM", "pointer": "/learningLinks/0/evidenceUse", "message": "value is not in the closed enum"},
            result["errors"],
        )

    def test_cli_duplicate_keys_and_nonfinite_numbers_are_input_errors(self) -> None:
        proc, result = self._cli(b'{"recordId":"a","recordId":"b"}')
        self.assertEqual((proc.returncode, result["errors"][0]["code"]), (2, "DUPLICATE_KEY"))
        proc, result = self._cli(b'{"amount":NaN}')
        self.assertEqual((proc.returncode, result["errors"][0]["code"]), (2, "NONFINITE_NUMBER"))
        proc, result = self._cli(b'{"amount":1e100000}')
        self.assertEqual((proc.returncode, result["errors"][0]["code"]), (2, "NONFINITE_NUMBER"))
        self.assertNotIn("Traceback", proc.stderr)

    def test_cli_excessive_nesting_is_a_controlled_result_without_traceback(self) -> None:
        nested = "0"
        for _ in range(33):
            nested = "[" + nested + "]"
        proc, result = self._cli(nested.encode("ascii"))
        self.assertEqual(proc.returncode, 1)
        self.assertEqual(result["errors"][0]["code"], "SHAPE")
        self.assertNotIn("Traceback", proc.stderr)

    def test_cli_encoding_size_and_malformed_json_errors_are_controlled(self) -> None:
        proc, result = self._cli(b"\xff")
        self.assertEqual((proc.returncode, result["errors"][0]["code"]), (2, "INPUT_ENCODING"))
        proc, result = self._cli(b"{" + b" " * (1024 * 1024))
        self.assertEqual((proc.returncode, result["errors"][0]["code"]), (2, "INPUT_SIZE"))
        proc, result = self._cli(b"{")
        self.assertEqual((proc.returncode, result["errors"][0]["code"]), (2, "INPUT_JSON"))

    def test_cli_invalid_record_is_exit_one_and_never_echoes_input_value(self) -> None:
        record = valid_record()
        record["recordId"] = "DO_NOT_ECHO_THIS"
        record["unowned"] = True
        proc, result = self._cli(json.dumps(record).encode("utf-8"))
        self.assertEqual(proc.returncode, 1)
        self.assertEqual(result["disposition"], "INVALID_RECORD")
        self.assertNotIn("DO_NOT_ECHO_THIS", proc.stdout)
        self.assertIs(result["executionAuthorized"], False)


if __name__ == "__main__":
    unittest.main()
