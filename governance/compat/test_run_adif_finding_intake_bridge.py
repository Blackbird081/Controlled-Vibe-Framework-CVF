"""Focused tests for the ADIF-T4 bounded, non-auto-promoting finding-intake bridge."""

from __future__ import annotations

import importlib.util
import io
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().with_name("run_adif_finding_intake_bridge.py")
SPEC = importlib.util.spec_from_file_location("run_adif_finding_intake_bridge", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class FindingIntakeBridgeTests(unittest.TestCase):
    def test_session_local_finding_is_rejected_with_reason(self) -> None:
        request = MODULE.FindingIntakeRequest(summary="one-off local glitch", is_session_local=True)
        outcome = MODULE.classify_finding(request)
        self.assertEqual(outcome.outcome, MODULE.REJECT_AS_NON_REUSABLE)
        self.assertTrue(outcome.reason)

    def test_matching_existing_entry_without_checker_binding_links(self) -> None:
        request = MODULE.FindingIntakeRequest(
            summary="repeat of known exhaustive-claim pattern",
            matching_defect_id="ADIF-0001",
        )
        outcome = MODULE.classify_finding(request)
        self.assertEqual(outcome.outcome, MODULE.LINK_TO_EXISTING_ENTRY)
        self.assertEqual(outcome.matched_defect_id, "ADIF-0001")

    def test_matching_existing_entry_with_new_checker_binding_proposes_update(self) -> None:
        request = MODULE.FindingIntakeRequest(
            summary="new checker evidence for known pattern",
            matching_defect_id="ADIF-0001",
            checker_binding="governance/compat/check_machine_closure_package.py",
        )
        outcome = MODULE.classify_finding(request)
        self.assertEqual(outcome.outcome, MODULE.PROPOSE_UPDATE_TO_EXISTING_ENTRY)
        self.assertEqual(outcome.matched_defect_id, "ADIF-0001")

    def test_unknown_defect_id_is_rejected_pending_source_verification(self) -> None:
        request = MODULE.FindingIntakeRequest(
            summary="claims a match that does not exist",
            matching_defect_id="ADIF-9999",
        )
        outcome = MODULE.classify_finding(request)
        self.assertEqual(outcome.outcome, MODULE.REJECT_AS_NON_REUSABLE)
        self.assertIsNone(outcome.matched_defect_id)

    def test_new_finding_with_checker_binding_proposes_machine_check_candidate(self) -> None:
        request = MODULE.FindingIntakeRequest(
            summary="new pattern with an existing checker that already covers it",
            checker_binding="governance/compat/check_machine_closure_package.py",
        )
        outcome = MODULE.classify_finding(request)
        self.assertEqual(outcome.outcome, MODULE.PROPOSE_MACHINE_CHECK_CANDIDATE)

    def test_new_finding_without_checker_binding_proposes_guidance_only_candidate(self) -> None:
        request = MODULE.FindingIntakeRequest(summary="brand new pattern, no checker yet")
        outcome = MODULE.classify_finding(request)
        self.assertEqual(outcome.outcome, MODULE.PROPOSE_NEW_GUIDANCE_ONLY_CANDIDATE)

    def test_empty_summary_raises(self) -> None:
        with self.assertRaises(ValueError):
            MODULE.classify_finding(MODULE.FindingIntakeRequest(summary="   "))

    def test_invalid_canonical_defect_class_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            MODULE.classify_finding(
                MODULE.FindingIntakeRequest(summary="x", defect_class="INVENTED_CLASS")
            )

    def test_invalid_canonical_defect_role_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            MODULE.classify_finding(
                MODULE.FindingIntakeRequest(summary="x", defect_role="INVENTED_ROLE")
            )

    def test_missing_checker_binding_path_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            MODULE.classify_finding(
                MODULE.FindingIntakeRequest(
                    summary="x",
                    checker_binding="governance/compat/check_missing_adif_fixture.py",
                )
            )

    def test_classification_never_mutates_entries_directory(self) -> None:
        entries_dir = MODULE.resolver.ENTRIES_DIR
        before_listing = sorted(p.name for p in entries_dir.glob("*"))
        for request in (
            MODULE.FindingIntakeRequest(summary="a", is_session_local=True),
            MODULE.FindingIntakeRequest(summary="b", matching_defect_id="ADIF-0001"),
            MODULE.FindingIntakeRequest(
                summary="c",
                checker_binding="governance/compat/check_machine_closure_package.py",
            ),
            MODULE.FindingIntakeRequest(summary="d"),
        ):
            MODULE.classify_finding(request)
        after_listing = sorted(p.name for p in entries_dir.glob("*"))
        self.assertEqual(before_listing, after_listing)

    def test_to_dict_states_no_mutation_claim_boundary(self) -> None:
        outcome = MODULE.classify_finding(MODULE.FindingIntakeRequest(summary="x"))
        payload = outcome.to_dict()
        self.assertIn("does not create, modify, or promote", payload["claimBoundary"])

    def test_all_five_outcomes_are_distinct_and_in_valid_set(self) -> None:
        outcomes = {
            MODULE.LINK_TO_EXISTING_ENTRY,
            MODULE.PROPOSE_UPDATE_TO_EXISTING_ENTRY,
            MODULE.PROPOSE_NEW_GUIDANCE_ONLY_CANDIDATE,
            MODULE.PROPOSE_MACHINE_CHECK_CANDIDATE,
            MODULE.REJECT_AS_NON_REUSABLE,
        }
        self.assertEqual(len(outcomes), 5)
        self.assertEqual(outcomes, MODULE._VALID_OUTCOMES)

    def test_human_text_names_outcome_and_claim_boundary(self) -> None:
        outcome = MODULE.classify_finding(MODULE.FindingIntakeRequest(summary="new pattern"))
        text = outcome.to_human_text()
        self.assertIn("Outcome: PROPOSE_NEW_GUIDANCE_ONLY_CANDIDATE", text)
        self.assertIn("does not create, modify, or promote", text)

    def test_cli_json_output_uses_outcome_shape(self) -> None:
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = MODULE.main(["--summary", "known", "--matching-defect-id", "ADIF-0001", "--json"])
        self.assertEqual(exit_code, 0)
        self.assertIn('"outcome": "LINK_TO_EXISTING_ENTRY"', buffer.getvalue())

    def test_cli_human_output_names_session_local_rejection(self) -> None:
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = MODULE.main(["--summary", "local", "--session-local"])
        self.assertEqual(exit_code, 0)
        self.assertIn("Outcome: REJECT_AS_NON_REUSABLE", buffer.getvalue())


if __name__ == "__main__":
    unittest.main()
