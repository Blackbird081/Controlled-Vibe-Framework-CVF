#!/usr/bin/env python3
"""Regression tests for worker-return scaffold friction repair (WRS-FR1-R1)."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

REPO_ROOT = Path(__file__).resolve().parents[2]
COMPAT_DIR = Path(__file__).resolve().parent
if str(COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(COMPAT_DIR))

import build_worker_return_skeleton_scaffold as bws
import check_review_cost_control as crcc
import check_work_order_acceptance_ledger as cwoal
import check_worker_experience_retrospective as cwer
import run_worker_return_scaffold as rws

SYNTHETIC_WORK_ORDER = """# Work Order
docType: work_order

## Work-Order Acceptance Requirement Ledger

```acceptance-ledger-json
{
  "schemaVersion": "cvf.workOrderAcceptanceLedger@1.0.0",
  "requirements": [
    {
      "requirementId": "REQ-1",
      "mandatory": true,
      "expectedArtifacts": ["docs/reviews/sample_return.md"],
      "requiredProofIds": ["PROOF-1"]
    }
  ],
  "proofCatalog": [
    {"proofId": "PROOF-1", "kind": "COMMAND", "locator": "python -m unittest"}
  ]
}
```
"""


def _make_scaffold_args(batch_id: str = "CVF-TEST-FR1", profile: str = rws.FULL_PROFILE) -> SimpleNamespace:
    return SimpleNamespace(
        batch_id=batch_id,
        title="Test Friction Repair",
        date="2026-10-04",
        base="438ee56b093b732b6b5ea01a8e27c1fa0c084d96",
        commit_mode="WORKER_MUST_NOT_COMMIT",
        worker_return_profile=profile,
        include_p4_observation_block=True,
        include_architecture_readiness_echo=True,
        evidence_readiness_applicable=False,
    )


def _get_four_way_scaffolds() -> list[tuple[str, str]]:
    return [
        ("run_full", rws.build_scaffold("Sample Return", rws.FULL_PROFILE)),
        ("run_fast", rws.build_scaffold("Sample Return", rws.FAST_DOC_PROFILE)),
        ("build_full", bws.build_worker_return_skeleton(_make_scaffold_args(profile=rws.FULL_PROFILE))),
        ("build_fast", bws.build_worker_return_skeleton(_make_scaffold_args(profile=rws.FAST_DOC_PROFILE))),
    ]


def _complete_scaffold(
    base_text: str,
    retro_mode: str = "STRUCTURED",
) -> str:
    text = (
        base_text.replace("Status: TODO_WORKER_STATUS", "Status: COMPLETE_PENDING_REVIEW")
        .replace(
            '{"schemaVersion":"cvf.workOrderAcceptanceEvidence@1.0.0","executionBaseHead":"TO_FILL","results":[]}',
            '{"schemaVersion":"cvf.workOrderAcceptanceEvidence@1.0.0","executionBaseHead":"438ee56b093b732b",'
            '"results":[{"requirementId":"REQ-1","actualArtifacts":["docs/reviews/sample_return.md"],'
            '"proofRefs":["PROOF-1"],"status":"PASS"}]}',
        )
        .replace("rootCauseClusterId: INITIAL_SCOPE_PENDING_WORK_ORDER_BINDING", "rootCauseClusterId: CVF-TEST-FR1")
        .replace("consolidatedDefectClassSweep: PENDING_BEFORE_READY", "consolidatedDefectClassSweep: COMPLETE_ALL_KNOWN_DEPENDENCIES")
        .replace("productionBindingEvidence: PENDING_BEFORE_READY", "productionBindingEvidence: VERIFIED_SOURCE_TEST_EVIDENCE")
        .replace("adversarialRegressionDisposition: PENDING_BEFORE_READY", "adversarialRegressionDisposition: PASS_TARGETED_DEFECT_CLASS")
        .replace("terminalReadinessVerdict: BLOCKED_WITH_REASON: generated scaffold pending worker evidence", "terminalReadinessVerdict: READY_FOR_REVIEW")
    )
    if retro_mode == "STRUCTURED":
        text = (
            text.replace("frictionLevel: TO_FILL_FROM_ACTUAL_EXECUTION", "frictionLevel: LOW")
            .replace("frictionType: TO_FILL_FROM_ACTUAL_EXECUTION", "frictionType: KEYWORD_TRAP")
            .replace("observedStep: TO_FILL_FROM_ACTUAL_EXECUTION", "observedStep: scaffold guidance verification")
            .replace("preventiveControlCandidate: TO_FILL_FROM_ACTUAL_EXECUTION", "preventiveControlCandidate: WORK_ORDER_TEMPLATE")
        )
    elif retro_mode == "TRUTHFUL_NA":
        start_idx = text.find("WORKER_EXPERIENCE_RETRO:")
        end_idx = text.find("## Command Evidence")
        if start_idx != -1 and end_idx != -1:
            na_line = f"WORKER_EXPERIENCE_RETRO_NA_WITH_REASON: {cwer.RETRO_NA_REQUIRED_REASON}\n\n"
            text = text[:start_idx] + na_line + text[end_idx:]
    return text


class WorkerReturnScaffoldFrictionTests(unittest.TestCase):
    def test_preparation_fields_reach_actual_consumers_four_way(self):
        import check_gate_to_role_closeability as closeability
        import check_external_knowledge_intake_routing as routing
        import check_independent_review_probe_admission as probe
        for name, text in _get_four_way_scaffolds():
            with self.subTest(generator=name):
                self.assertIn('independentProbeDisposition: PENDING_REVIEWER_EXECUTION', text)
                self.assertEqual(bws.preparation_shape_issues(text), [])
                self.assertEqual(text.count('## Core Guard Self-Protection Authorization'), 1)
                binding = routing._json_section(text, routing.BINDING_HEADING)
                self.assertEqual(binding['invariants'], routing.EXPECTED_CONTRACT['invariants'])
                completed = text.replace('Status: TODO_WORKER_STATUS', 'Status: COMPLETE_PENDING_REVIEW')
                completed = completed.replace('closeabilityDisposition: TO_FILL_FROM_ACTUAL_RECHECK', 'closeabilityDisposition: CLOSEABLE')
                completed = completed.replace('outsideAuthorityBlockers: TO_FILL_FROM_ACTUAL_RECHECK', 'outsideAuthorityBlockers: NONE')
                completed = completed.replace('nextRepairRoute: TO_FILL_FROM_ACTUAL_RECHECK', 'nextRepairRoute: NO_REPAIR_REQUIRED')
                self.assertEqual(closeability.check_recheck('docs/reviews/example.md', completed), [])
                # A missing section must fail early; the real return consumer also refuses it.
                missing = completed.replace('## Return-Time Closeability Recheck', '## Removed Recheck')
                self.assertTrue(bws.preparation_shape_issues(missing))
                self.assertTrue(closeability.check_recheck('docs/reviews/example.md', missing))
                # A nonterminal pending disposition remains pending, not a fabricated pass.
                self.assertIn(probe.DISPOSITION_PENDING, completed)
                linked = completed.replace('TODO_WORK_ORDER_PATH', 'docs/work_orders/CVF_AGENT_WORK_ORDER_SYMBOL_LINE_ANCHOR_FIX_2026-10-11.md')
                linked = linked.replace('docs/work_orders/CVF_AGENT_WORK_ORDER_CVF-TEST-FR1_2026-10-04.md', 'docs/work_orders/CVF_AGENT_WORK_ORDER_SYMBOL_LINE_ANCHOR_FIX_2026-10-11.md')
                diagnostic = probe.diagnose_closure('docs/reviews/example.md', linked)
                self.assertTrue(diagnostic.applicable)
                self.assertEqual(diagnostic.issues, ())
                omitted = linked.replace('independentProbeDisposition: PENDING_REVIEWER_EXECUTION', '')
                self.assertTrue(probe.diagnose_closure('docs/reviews/example.md', omitted).issues)

    def test_raw_scaffold_guidance_present_in_both_generators(self) -> None:
        for name, text in _get_four_way_scaffolds():
            with self.subTest(generator=name):
                self.assertIn("Evidence completion guidance:", text)
                self.assertIn("Readiness completion guidance:", text)
                self.assertIn("requirementId", text)
                self.assertIn("actualArtifacts", text)
                self.assertIn("proofRefs", text)
                self.assertIn("status (PASS or BLOCKED)", text)
                self.assertIn("WORKER_EXPERIENCE_RETRO:", text)
                self.assertIn("frictionLevel: TO_FILL_FROM_ACTUAL_EXECUTION", text)
                self.assertIn("frictionType: TO_FILL_FROM_ACTUAL_EXECUTION", text)
                self.assertIn("observedStep: TO_FILL_FROM_ACTUAL_EXECUTION", text)
                self.assertIn("preventiveControlCandidate: TO_FILL_FROM_ACTUAL_EXECUTION", text)

    def test_raw_scaffolds_remain_fail_closed_before_completion(self) -> None:
        for name, text in _get_four_way_scaffolds():
            with self.subTest(generator=name):
                ledger_issues = cwoal.validate_return(SYNTHETIC_WORK_ORDER, text)
                self.assertTrue(any("missing evidence row" in i or "results" in i for i in ledger_issues))
                retro_diag = cwer.diagnose("docs/reviews/sample_return.md", text)
                self.assertTrue(retro_diag.eligible)
                self.assertFalse(retro_diag.is_clean)
                self.assertTrue(any("invalid frictionLevel" in i for i in retro_diag.issues))

    def test_completed_acceptance_rows_and_ready_for_review_four_way(self) -> None:
        for name, base_text in _get_four_way_scaffolds():
            for retro_mode in ("STRUCTURED", "TRUTHFUL_NA"):
                with self.subTest(generator=name, retro=retro_mode):
                    return_text = _complete_scaffold(base_text, retro_mode=retro_mode)
                    ledger_issues = cwoal.validate_return(SYNTHETIC_WORK_ORDER, return_text, {"docs/reviews/sample_return.md"})
                    self.assertEqual(ledger_issues, [])
                    cost_diag = crcc.diagnose_worker_return("docs/reviews/sample_return.md", return_text)
                    self.assertTrue(cost_diag.is_clean, cost_diag.issues)
                    retro_diag = cwer.diagnose("docs/reviews/sample_return.md", return_text)
                    self.assertTrue(retro_diag.is_clean, retro_diag.issues)

    def test_negative_acceptance_and_readiness_mutations_four_way(self) -> None:
        for name, base_text in _get_four_way_scaffolds():
            with self.subTest(generator=name, check="wrong_row_keys"):
                wrong_keys_text = base_text.replace(
                    '"results":[]',
                    '"results":[{"requirementId":"REQ-1","artifacts":["docs/reviews/sample_return.md"],'
                    '"proofs":["PROOF-1"],"status":"PASS"}]',
                )
                ledger_issues = cwoal.validate_return(SYNTHETIC_WORK_ORDER, wrong_keys_text)
                self.assertTrue(any("each evidence row must contain exactly" in i for i in ledger_issues))

            with self.subTest(generator=name, check="bad_readiness_token"):
                bad_ready_text = base_text.replace(
                    "terminalReadinessVerdict: BLOCKED_WITH_REASON: generated scaffold pending worker evidence",
                    "terminalReadinessVerdict: READY",
                )
                cost_diag = crcc.diagnose_worker_return("docs/reviews/sample_return.md", bad_ready_text)
                self.assertTrue(any("terminalReadinessVerdict" in i for i in cost_diag.issues))

            with self.subTest(generator=name, check="incomplete_ready"):
                incomplete_ready = (
                    base_text.replace("rootCauseClusterId: INITIAL_SCOPE_PENDING_WORK_ORDER_BINDING", "rootCauseClusterId: CVF-TEST-FR1")
                    .replace("consolidatedDefectClassSweep: PENDING_BEFORE_READY", "consolidatedDefectClassSweep: COMPLETE_ALL_KNOWN_DEPENDENCIES")
                    .replace("adversarialRegressionDisposition: PENDING_BEFORE_READY", "adversarialRegressionDisposition: PASS_TARGETED_DEFECT_CLASS")
                    .replace("terminalReadinessVerdict: BLOCKED_WITH_REASON: generated scaffold pending worker evidence", "terminalReadinessVerdict: READY_FOR_REVIEW")
                )
                cost_diag_incomplete = crcc.diagnose_worker_return("docs/reviews/sample_return.md", incomplete_ready)
                self.assertTrue(any("pending production-binding evidence" in i for i in cost_diag_incomplete.issues))

    def test_negative_retro_mutations_on_actual_scaffolds_four_way(self) -> None:
        for name, base_text in _get_four_way_scaffolds():
            completed_text = _complete_scaffold(base_text, retro_mode="STRUCTURED")

            with self.subTest(generator=name, check="wrong_na_reason"):
                wrong_na = completed_text.replace(
                    "WORKER_EXPERIENCE_RETRO:\nfrictionLevel: LOW\nfrictionType: KEYWORD_TRAP\nobservedStep: scaffold guidance verification\npreventiveControlCandidate: WORK_ORDER_TEMPLATE",
                    "WORKER_EXPERIENCE_RETRO_NA_WITH_REASON: no friction observed",
                )
                d_wrong = cwer.diagnose("docs/reviews/sample_return.md", wrong_na)
                self.assertFalse(d_wrong.is_clean)
                self.assertTrue(any("exact asserting reason" in i for i in d_wrong.issues))

            with self.subTest(generator=name, check="duplicate_retro"):
                dup_text = completed_text.replace(
                    "WORKER_EXPERIENCE_RETRO:\n",
                    f"WORKER_EXPERIENCE_RETRO_NA_WITH_REASON: {cwer.RETRO_NA_REQUIRED_REASON}\n\nWORKER_EXPERIENCE_RETRO:\n",
                )
                d_dup = cwer.diagnose("docs/reviews/sample_return.md", dup_text)
                self.assertFalse(d_dup.is_clean)
                self.assertTrue(any("multiple worker-experience tokens" in i for i in d_dup.issues))

    def test_batch_id_invariance_in_skeleton_scaffold(self) -> None:
        """WRS-FR1-F1/F2: verify batch_id changes do not alter guidance or structure."""
        for profile in (rws.FULL_PROFILE, rws.FAST_DOC_PROFILE):
            args_a = _make_scaffold_args(batch_id="WOAS-R3-GOLDEN", profile=profile)
            args_b = _make_scaffold_args(batch_id="CVF-ARBITRARY-99", profile=profile)
            out_a = bws.build_worker_return_skeleton(args_a)
            out_b = bws.build_worker_return_skeleton(args_b)
            norm_a = out_a.replace("WOAS-R3-GOLDEN", "NORMALIZED_ID").replace("woas-r3-golden", "normalized_id")
            norm_b = out_b.replace("CVF-ARBITRARY-99", "NORMALIZED_ID").replace("cvf-arbitrary-99", "normalized_id")
            self.assertEqual(norm_a, norm_b, f"batch-ID drift detected for profile {profile}")


if __name__ == "__main__":
    unittest.main()
