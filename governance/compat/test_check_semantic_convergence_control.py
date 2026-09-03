#!/usr/bin/env python3
"""Focused SCEC checker tests: chain state, escalation, evidence binding,
parser immunity, scaffolds, and gate wiring. File-state tests use temporary
directories and never mutate the real workspace."""
from __future__ import annotations
import hashlib
import json
import sys
import tempfile
import unittest
from unittest import mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_semantic_convergence_control as scec
REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_PATH = (
    REPO_ROOT
    / "governance"
    / "compat"
    / "fixtures"
    / "semantic_convergence_control"
    / "gc010_t1j_r1_r3_replay.json"
)
def _base_block(**overrides) -> dict:
    block = {
        "schemaVersion": scec.SCEC_SCHEMA_VERSION,
        "problemKey": "sample-problem",
        "chainMode": "INITIAL",
        "chainOrdinal": 0,
        "predecessor": None,
        "blockerDelta": {
            "prior": [],
            "resolved": [],
            "retained": [],
            "new": ["B1"],
            "reopened": [],
            "current": ["B1"],
        },
        "resolutionEvidence": {},
        "counters": {
            "partialReadyClosures": 0,
            "reviewerScopeExpansions": 0,
            "sameClaimCorrections": 0,
            "nonDecreasingBlockerTransitions": 0,
        },
        "claims": [
            {
                "claimId": "C1",
                "claimClass": "DOCUMENTATION_ONLY",
                "proofClass": "PROPOSAL_ONLY_NO_RUNTIME_READINESS",
                "evidenceRef": "docs/example.md",
            }
        ],
        "requiredDisposition": "CONTINUE_BOUNDED",
        "successorScope": "INITIAL_BOUNDED",
    }
    block.update(overrides)
    return block
class ValidInitialChainBlockTests(unittest.TestCase):
    """Family 1: valid initial-chain block."""
    def test_valid_initial_block_passes(self) -> None:
        result = scec.validate_block(_base_block())
        self.assertTrue(result.is_active)
        self.assertEqual(result.violations, ())
        self.assertTrue(result.is_valid)
    def test_initial_block_with_nonzero_ordinal_fails(self) -> None:
        result = scec.validate_block(_base_block(chainOrdinal=1))
        self.assertTrue(result.is_active)
        codes = {v.code for v in result.violations}
        self.assertIn("INITIAL_NONZERO_ORDINAL", codes)
    def test_initial_block_with_predecessor_fails(self) -> None:
        result = scec.validate_block(
            _base_block(predecessor={"path": "x.md", "sha256": "a" * 64})
        )
        codes = {v.code for v in result.violations}
        self.assertIn("INITIAL_HAS_PREDECESSOR", codes)
class MissingBlockOnChangedWorkOrderTests(unittest.TestCase):
    """Family 2: newly changed governed outputs fail without a block."""
    def test_no_block_in_text_is_not_active(self) -> None:
        text = "# Some Work Order\n\nNo SCEC content here.\n"
        self.assertEqual(scec.find_active_blocks(text), [])
    def test_changed_work_order_without_block_fails(self) -> None:
        diag = scec.diagnose_file(
            "docs/work_orders/sample.md", "# Sample\nplain text\n", require_block=True
        )
        self.assertEqual(diag.block_count, 0)
        self.assertFalse(diag.is_clean)
        self.assertEqual(diag.violations[0][1].code, "MISSING_REQUIRED_SCEC_BLOCK")
    def test_non_required_reference_without_block_remains_out_of_scope(self) -> None:
        diag = scec.diagnose_file("docs/reference/sample.md", "# Sample\nplain text\n")
        self.assertTrue(diag.is_clean)
    def test_run_fails_changed_work_order_without_block(self) -> None:
        path = "docs/work_orders/CVF_AGENT_WORK_ORDER_NEW.md"
        with (
            mock.patch.object(scec, "_changed_md_paths", return_value=(path,)),
            mock.patch.object(scec, "_working_tree_md_paths", return_value=(path,)),
            mock.patch.object(scec, "_read", return_value="# New Work Order\n"),
        ):
            diagnostics = scec.run("HEAD", "HEAD")
        self.assertEqual(len(diagnostics), 1)
        self.assertEqual(diagnostics[0].violations[0][1].code, "MISSING_REQUIRED_SCEC_BLOCK")
    def test_changed_work_order_with_multiple_blocks_fails(self) -> None:
        text = "# Work Order\n```json\n" + json.dumps(_base_block()) + "\n```\n"
        text += "```json\n" + json.dumps(_base_block(problemKey="second")) + "\n```\n"
        diag = scec.diagnose_file("docs/work_orders/sample.md", text, require_block=True)
        self.assertIn("ACTIVE_SCEC_BLOCK_COUNT_INVALID", {v.code for _, v in diag.violations})
class ProblemKeyMismatchTests(unittest.TestCase):
    """Family 3: stable problem-key mismatch across a successor chain."""
    def test_problem_key_must_be_non_empty_string(self) -> None:
        result = scec.validate_block(_base_block(problemKey=""))
        codes = {v.code for v in result.violations}
        self.assertIn("INVALID_PROBLEM_KEY", codes)
    def test_problem_key_mismatch_against_predecessor_fails(self) -> None:
        first = _base_block(problemKey="problem-a")
        second = _base_block(
            problemKey="problem-b",
            chainMode="SUCCESSOR",
            chainOrdinal=1,
            predecessor={"path": "docs/reviews/a.md", "sha256": "a" * 64},
            blockerDelta={
                "prior": ["B1"],
                "resolved": [],
                "retained": ["B1"],
                "new": [],
                "reopened": [],
                "current": ["B1"],
            },
            counters={
                "partialReadyClosures": 0,
                "reviewerScopeExpansions": 0,
                "sameClaimCorrections": 0,
                "nonDecreasingBlockerTransitions": 1,
            },
        )
        result = scec.validate_block(
            second,
            predecessor_hash_resolver=lambda path: "a" * 64,
            predecessor_block_resolver=lambda path: (first,),
        )
        self.assertIn(
            "PREDECESSOR_PROBLEM_KEY_MISMATCH", {v.code for v in result.violations}
        )
    def test_ordinal_must_equal_predecessor_plus_one(self) -> None:
        first = _base_block()
        second = _base_block(
            chainMode="SUCCESSOR",
            chainOrdinal=3,
            predecessor={"path": "docs/reviews/a.md", "sha256": "a" * 64},
            blockerDelta={
                "prior": ["B1"], "resolved": [], "retained": ["B1"],
                "new": [], "reopened": [], "current": ["B1"],
            },
            counters={
                "partialReadyClosures": 0, "reviewerScopeExpansions": 0,
                "sameClaimCorrections": 0, "nonDecreasingBlockerTransitions": 1,
            },
        )
        result = scec.validate_block(
            second,
            predecessor_hash_resolver=lambda path: "a" * 64,
            predecessor_block_resolver=lambda path: (first,),
        )
        self.assertIn(
            "PREDECESSOR_ORDINAL_DISCONTINUITY", {v.code for v in result.violations}
        )
    def test_successor_cannot_reset_blockers_or_counters(self) -> None:
        first = _base_block(
            counters={
                "partialReadyClosures": 1, "reviewerScopeExpansions": 1,
                "sameClaimCorrections": 1, "nonDecreasingBlockerTransitions": 0,
            },
            requiredDisposition="ROOT_CONTRACT_REQUIRED",
            successorScope="INTEGRATED_ROOT_CONTRACT",
        )
        second = _base_block(
            chainMode="SUCCESSOR", chainOrdinal=1,
            predecessor={"path": "docs/reviews/a.md", "sha256": "a" * 64},
            blockerDelta={
                "prior": [], "resolved": [], "retained": [],
                "new": ["B2"], "reopened": [], "current": ["B2"],
            },
        )
        result = scec.validate_block(
            second,
            predecessor_hash_resolver=lambda path: "a" * 64,
            predecessor_block_resolver=lambda path: (first,),
        )
        codes = {v.code for v in result.violations}
        self.assertIn("PREDECESSOR_BLOCKER_STATE_MISMATCH", codes)
        self.assertIn("PREDECESSOR_COUNTER_RESET", codes)
        self.assertIn("PREDECESSOR_ESCALATION_DROPPED", codes)
class PredecessorHashMismatchTests(unittest.TestCase):
    """Family 4: predecessor path/hash evidence."""
    def _successor_block(self, **overrides) -> dict:
        base = dict(
            chainMode="SUCCESSOR",
            chainOrdinal=1,
            predecessor={"path": "docs/reviews/predecessor.md", "sha256": "a" * 64},
        )
        base.update(overrides)
        return _base_block(**base)
    def test_hash_match_passes(self) -> None:
        content = "predecessor content"
        real_hash = scec.sha256_of_text(content)
        block = self._successor_block(predecessor={"path": "docs/reviews/predecessor.md", "sha256": real_hash})
        result = scec.validate_block(block, predecessor_hash_resolver=lambda path: real_hash)
        self.assertEqual(result.violations, ())
    def test_hash_mismatch_fails(self) -> None:
        block = self._successor_block()
        result = scec.validate_block(block, predecessor_hash_resolver=lambda path: "b" * 64)
        codes = {v.code for v in result.violations}
        self.assertIn("PREDECESSOR_HASH_MISMATCH", codes)
    def test_successor_revalidates_predecessor_resolution_evidence_hash(self) -> None:
        predecessor = _base_block(
            blockerDelta={
                "prior": ["OLD"], "resolved": ["OLD"], "retained": [],
                "new": [], "reopened": [], "current": [],
            },
            resolutionEvidence={
                "OLD": {
                    "evidenceClass": "ACCEPTED_REVIEW", "evidencePath": "docs/reviews/evidence.md",
                    "sha256": "a" * 64, "locator": "Independent Reviewer Correction",
                }
            },
        )
        successor = self._successor_block(
            blockerDelta={
                "prior": [], "resolved": [], "retained": [],
                "new": ["B1"], "reopened": [], "current": ["B1"],
            },
            counters={
                "partialReadyClosures": 0, "reviewerScopeExpansions": 0,
                "sameClaimCorrections": 0, "nonDecreasingBlockerTransitions": 1,
            },
        )
        result = scec.validate_block(
            successor, predecessor_hash_resolver=lambda path: "a" * 64,
            predecessor_block_resolver=lambda path: (predecessor,),
            evidence_bytes_resolver=lambda path: b"content")
        invalid = [v for v in result.violations if v.code == "PREDECESSOR_BLOCK_INVALID"]
        self.assertEqual(len(invalid), 1)
        self.assertIn("RESOLUTION_EVIDENCE_HASH_MISMATCH", invalid[0].message)
    def test_unreadable_predecessor_path_fails(self) -> None:
        block = self._successor_block()
        result = scec.validate_block(block, predecessor_hash_resolver=lambda path: None)
        codes = {v.code for v in result.violations}
        self.assertIn("PREDECESSOR_PATH_UNREADABLE", codes)
    def test_successor_missing_predecessor_fails(self) -> None:
        block = _base_block(chainMode="SUCCESSOR", chainOrdinal=1, predecessor=None)
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("SUCCESSOR_MISSING_PREDECESSOR", codes)
    def test_unresolved_sentinel_fails_predispatch(self) -> None:
        block = self._successor_block(
            predecessor={"path": scec.UNRESOLVED_PREDECESSOR_SENTINEL, "sha256": "a" * 64}
        )
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("PREDECESSOR_UNRESOLVED_SENTINEL", codes)
    def test_invalid_hash_shape_fails(self) -> None:
        block = self._successor_block(
            predecessor={"path": "docs/reviews/predecessor.md", "sha256": "not-a-hash"}
        )
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("PREDECESSOR_INVALID_HASH_SHAPE", codes)
    def test_predecessor_path_traversal_fails(self) -> None:
        block = self._successor_block(
            predecessor={"path": "../outside.md", "sha256": "a" * 64}
        )
        self.assertIn(
            "PREDECESSOR_PATH_OUTSIDE_REPOSITORY",
            {v.code for v in scec.validate_block(block).violations},
        )
    def test_real_file_predecessor_hash_via_git_layer(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            predecessor_file = tmp_path / "predecessor.md"
            predecessor_file.write_text("predecessor content", encoding="utf-8")
            original_root = scec.REPO_ROOT
            try:
                scec.REPO_ROOT = tmp_path
                resolved = scec._repo_predecessor_hash_resolver("predecessor.md")
            finally:
                scec.REPO_ROOT = original_root
            self.assertEqual(resolved, scec.sha256_of_text("predecessor content"))
class BlockerSetAlgebraTests(unittest.TestCase):
    """Family 5: blocker set-algebra mismatch and silent disappearance."""
    def test_prior_reconciliation_violation(self) -> None:
        block = _base_block(
            blockerDelta={
                "prior": ["B1"],
                "resolved": [],
                "retained": [],
                "new": ["B2"],
                "reopened": [],
                "current": ["B2"],
            }
        )
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("SET_RECONCILIATION_PRIOR", codes)
        self.assertIn("SILENT_BLOCKER_DISAPPEARANCE", codes)
    def test_current_reconciliation_violation(self) -> None:
        block = _base_block(
            blockerDelta={
                "prior": [],
                "resolved": [],
                "retained": [],
                "new": ["B1"],
                "reopened": [],
                "current": ["B1", "B2"],
            }
        )
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("SET_RECONCILIATION_CURRENT", codes)
    def test_disjointness_violation(self) -> None:
        block = _base_block(
            blockerDelta={
                "prior": ["B1"],
                "resolved": [],
                "retained": ["B1"],
                "new": ["B1"],
                "reopened": [],
                "current": ["B1"],
            }
        )
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("BLOCKER_SET_NOT_DISJOINT", codes)
    def test_silent_disappearance_detected_even_with_valid_looking_sets(self) -> None:
        block = _base_block(
            blockerDelta={
                "prior": ["B1", "B2"],
                "resolved": ["B1"],
                "retained": [],
                "new": [],
                "reopened": [],
                "current": [],
            }
        )
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("SILENT_BLOCKER_DISAPPEARANCE", codes)
    def test_valid_reconciliation_passes(self) -> None:
        block = _base_block(
            blockerDelta={
                "prior": ["B1", "B2"],
                "resolved": ["B1"],
                "retained": ["B2"],
                "new": ["B3"],
                "reopened": [],
                "current": ["B2", "B3"],
            },
            resolutionEvidence={
                "B1": {
                    "evidenceClass": "ACCEPTED_REVIEW",
                    "evidencePath": "docs/reviews/evidence.md",
                    "sha256": "a" * 64,
                    "locator": "Independent Reviewer Correction",
                }
            },
        )
        result = scec.validate_block(block)
        self.assertEqual(result.violations, ())
class ResolutionEvidenceBindingTests(unittest.TestCase):
    """Invariant 13 positive and adversarial resolution-evidence coverage."""
    def _resolved_block(self) -> dict:
        return _base_block(blockerDelta={"prior": ["B1"], "resolved": ["B1"],
            "retained": [], "new": [], "reopened": [], "current": []})
    @staticmethod
    def _accepted(**overrides) -> dict:
        binding = {"evidenceClass": "ACCEPTED_REVIEW",
            "evidencePath": "docs/reviews/evidence.md", "sha256": "a" * 64,
            "locator": "Independent Reviewer Correction"}
        binding.update(overrides)
        return binding
    def _locator_codes(self, content: bytes, locator: str) -> set[str]:
        return {v.code for v in scec.validate_block(self._with_binding(
            {"evidenceClass": "ACCEPTED_REVIEW", "evidencePath": "e.md",
             "sha256": hashlib.sha256(content).hexdigest(), "locator": locator}),
            evidence_bytes_resolver=lambda path: content).violations}
    def _with_binding(self, binding: object) -> dict:
        block = self._resolved_block(); block["resolutionEvidence"] = {"B1": binding}
        return block
    @staticmethod
    def _codes(block: dict, **kwargs) -> set[str]:
        return {v.code for v in scec.validate_block(block, **kwargs).violations}
    def test_resolved_blocker_without_binding_fails(self) -> None:
        self.assertIn("RESOLUTION_EVIDENCE_MISSING_BINDING", self._codes(self._resolved_block()))
    def test_wrong_blocker_id_and_extra_binding_fail(self) -> None:
        block = self._resolved_block(); block["resolutionEvidence"] = {"B2": self._accepted()}
        codes = self._codes(block)
        self.assertIn("RESOLUTION_EVIDENCE_MISSING_BINDING", codes)
        self.assertIn("RESOLUTION_EVIDENCE_EXTRA_BINDING", codes)
    def test_extra_binding_fails(self) -> None:
        block = self._with_binding(self._accepted()); block["resolutionEvidence"]["B2"] = self._accepted()
        self.assertIn("RESOLUTION_EVIDENCE_EXTRA_BINDING", self._codes(block))
    def test_missing_binding_field_fails(self) -> None:
        self.assertIn("RESOLUTION_EVIDENCE_MISSING_BINDING_FIELD",
            self._codes(self._with_binding({"evidenceClass": "ACCEPTED_REVIEW"})))
    def test_invalid_evidence_class_fails(self) -> None:
        self.assertIn("RESOLUTION_EVIDENCE_INVALID_EVIDENCE_CLASS",
            self._codes(self._with_binding(self._accepted(evidenceClass="MADE_UP"))))
    def test_unsafe_path_fails(self) -> None:
        self.assertIn("RESOLUTION_EVIDENCE_PATH_UNSAFE",
            self._codes(self._with_binding(self._accepted(evidencePath="../outside.md"))))
    def test_unreadable_path_fails(self) -> None:
        self.assertIn("RESOLUTION_EVIDENCE_PATH_UNREADABLE", self._codes(
            self._with_binding(self._accepted()), evidence_bytes_resolver=lambda path: None))
    def test_hash_mismatch_fails(self) -> None:
        self.assertIn("RESOLUTION_EVIDENCE_HASH_MISMATCH", self._codes(
            self._with_binding(self._accepted()), evidence_bytes_resolver=lambda path: b"content"))
    def test_invalid_hash_shape_fails(self) -> None:
        self.assertIn("RESOLUTION_EVIDENCE_INVALID_HASH_SHAPE",
            self._codes(self._with_binding(self._accepted(sha256="not-a-hash"))))
    def test_empty_locator_fails(self) -> None:
        self.assertIn("RESOLUTION_EVIDENCE_EMPTY_LOCATOR",
            self._codes(self._with_binding(self._accepted(locator="   "))))
    def test_invalid_claim_link_fails(self) -> None:
        self.assertIn("RESOLUTION_EVIDENCE_INVALID_CLAIM_LINK",
            self._codes(self._with_binding(self._accepted(claimId="NO_SUCH_CLAIM"))))
    def test_executable_without_claim_link_fails(self) -> None:
        binding = {"evidenceClass": "EXECUTABLE_PROOF",
            "evidencePath": "governance/compat/test_x.py", "sha256": "a" * 64, "locator": "a test"}
        self.assertIn("RESOLUTION_EVIDENCE_EXECUTABLE_MISSING_CLAIM_LINK",
            self._codes(self._with_binding(binding)))
    def test_executable_linking_doc_only_claim_fails(self) -> None:
        binding = {"evidenceClass": "EXECUTABLE_PROOF",
            "evidencePath": "governance/compat/test_x.py", "sha256": "a" * 64,
            "locator": "a test", "claimId": "C1"}
        self.assertIn("RESOLUTION_EVIDENCE_NON_EXECUTABLE_CLAIM_LINK",
            self._codes(self._with_binding(binding)))
    def test_accepted_review_binding_passes(self) -> None:
        self.assertEqual(scec.validate_block(self._with_binding(self._accepted())).violations, ())
    def test_executable_binding_passes(self) -> None:
        block = _base_block(
            blockerDelta={
                "prior": ["B1"], "resolved": ["B1"], "retained": [],
                "new": [], "reopened": [], "current": [],
            },
            claims=[{"claimId": "C1", "claimClass": "ORDERING",
                "proofClass": "EXECUTABLE_SEQUENCE_ASSERTION",
                "evidenceRef": "tests/test_ordering.py"}],
            resolutionEvidence={
                "B1": {"evidenceClass": "EXECUTABLE_PROOF",
                    "evidencePath": "tests/test_ordering.py", "sha256": "a" * 64,
                    "locator": "sequence assertion test", "claimId": "C1"}
            },
        )
        self.assertEqual(scec.validate_block(block).violations, ())
    def test_locator_content(self) -> None:
        self.assertEqual(self._locator_codes(b"Independent Reviewer Correction\n", "Independent Reviewer Correction"), set())
        self.assertEqual(self._locator_codes(b"x\n", "THIS_LOCATOR_DOES_NOT_EXIST_ANYWHERE_IN_THE_FILE"), {"RESOLUTION_EVIDENCE_LOCATOR_NOT_FOUND"})
        self.assertEqual(self._locator_codes(b"token token\n", "token"), {"RESOLUTION_EVIDENCE_LOCATOR_AMBIGUOUS"})
        self.assertEqual(self._locator_codes(b"y\n", "  padded  "), {"RESOLUTION_EVIDENCE_LOCATOR_NON_CANONICAL"})
        self.assertEqual(self._locator_codes(b"\xff\xfe\n", "anything"), {"RESOLUTION_EVIDENCE_CONTENT_DECODE_FAILED"})
    def test_exact_e2_absent_locator_replay(self) -> None:
        path = "docs/work_orders/CVF_AGENT_WORK_ORDER_SCEC_E2_EVIDENCE_BINDING_EFFECTIVENESS_VALIDATION_2026-08-31.md"
        content = (scec.REPO_ROOT / path).read_bytes(); digest = hashlib.sha256(content).hexdigest()
        self.assertEqual(digest, "93dc80a448472aa006c4bd9585d9e974224363dd34bf2202f22588708195f587")
        block = self._with_binding({"evidenceClass": "ACCEPTED_REVIEW", "evidencePath": path, "sha256": digest,
            "locator": "THIS_LOCATOR_DOES_NOT_EXIST_ANYWHERE_IN_THE_FILE"})
        codes = self._codes(block, evidence_bytes_resolver=scec._repo_evidence_bytes_resolver)
        self.assertEqual(codes, {"RESOLUTION_EVIDENCE_LOCATOR_NOT_FOUND"})
    def test_same_evidence_path_is_read_once_per_validation_tree(self) -> None:
        content = b"UNIQUE_A\nUNIQUE_B\n"; calls: list[str] = []
        binding = {"evidenceClass": "ACCEPTED_REVIEW", "evidencePath": "same.md", "sha256": hashlib.sha256(content).hexdigest()}
        block = _base_block(blockerDelta={"prior": ["B1", "B2"], "resolved": ["B1", "B2"],
            "retained": [], "new": [], "reopened": [], "current": []},
            resolutionEvidence={"B1": {**binding, "locator": "UNIQUE_A"}, "B2": {**binding, "locator": "UNIQUE_B"}})
        def resolver(path: str) -> bytes: calls.append(path); return content
        self.assertEqual(scec.validate_block(block, evidence_bytes_resolver=resolver).violations, ())
        self.assertEqual(calls, ["same.md"])
    def test_r2_symbol_locators_resolve_exactly_once(self) -> None:
        content = Path(__file__).resolve().read_bytes()
        for sym in ("ResolutionEvidenceBinding", "HistoricalT1JReplayRejection"):
            self.assertEqual(self._locator_codes(content, sym + "Tests"), set())
    def test_successor_consumes_invalid_predecessor_locator(self) -> None:
        content = b"no marker\n"
        pred = _base_block(chainMode="SUCCESSOR", chainOrdinal=1, predecessor={"path": "p.md", "sha256": "0" * 64},
            blockerDelta={"prior": ["O"], "resolved": ["O"], "retained": [], "new": [], "reopened": [], "current": []},
            resolutionEvidence={"O": {"evidenceClass": "ACCEPTED_REVIEW", "evidencePath": "e.md", "sha256": hashlib.sha256(content).hexdigest(), "locator": "MISSING"}})
        succ = _base_block(chainMode="SUCCESSOR", chainOrdinal=2, predecessor={"path": "p.md", "sha256": "1" * 64})
        result = scec.validate_block(succ, predecessor_hash_resolver=lambda path: "1" * 64,
            predecessor_block_resolver=lambda path: (pred,), evidence_bytes_resolver=lambda path: content)
        invalid = [v for v in result.violations if v.code == "PREDECESSOR_BLOCK_INVALID"]
        self.assertEqual(len(invalid), 1)
        self.assertIn("RESOLUTION_EVIDENCE_LOCATOR_NOT_FOUND", invalid[0].message)
    def test_empty_resolved_without_evidence_is_ok(self) -> None:
        block = _base_block()
        block.pop("resolutionEvidence", None)
        self.assertEqual(scec.validate_block(block).violations, ())
    def test_resolution_evidence_not_an_object_fails(self) -> None:
        block = self._resolved_block()
        block["resolutionEvidence"] = "not-an-object"
        codes = {v.code for v in scec.validate_block(block).violations}
        self.assertIn("RESOLUTION_EVIDENCE_INVALID_TYPE", codes)
class ReviewerScopeExpansionTests(unittest.TestCase):
    """Family 6: one reviewer scope expansion requires ROOT_CONTRACT_REQUIRED."""
    def test_scope_expansion_requires_root_contract(self) -> None:
        block = _base_block(
            counters={
                "partialReadyClosures": 0,
                "reviewerScopeExpansions": 1,
                "sameClaimCorrections": 0,
                "nonDecreasingBlockerTransitions": 0,
            },
            requiredDisposition="CONTINUE_BOUNDED",
            successorScope="INITIAL_BOUNDED",
        )
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("MISSING_ROOT_CONTRACT_ESCALATION", codes)
        self.assertIn("NARROW_SUCCESSOR_AFTER_ESCALATION", codes)
    def test_scope_expansion_with_correct_escalation_passes(self) -> None:
        block = _base_block(
            counters={
                "partialReadyClosures": 0,
                "reviewerScopeExpansions": 1,
                "sameClaimCorrections": 0,
                "nonDecreasingBlockerTransitions": 0,
            },
            requiredDisposition="ROOT_CONTRACT_REQUIRED",
            successorScope="INTEGRATED_ROOT_CONTRACT",
        )
        result = scec.validate_block(block)
        self.assertEqual(result.violations, ())
class PartialReadyClosureTests(unittest.TestCase):
    """Family 7: two partial-ready closures require an integrated root contract."""
    def test_two_partial_ready_closures_requires_root_contract(self) -> None:
        block = _base_block(
            counters={
                "partialReadyClosures": 2,
                "reviewerScopeExpansions": 0,
                "sameClaimCorrections": 0,
                "nonDecreasingBlockerTransitions": 0,
            },
            requiredDisposition="CONTINUE_BOUNDED",
            successorScope="INITIAL_BOUNDED",
        )
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("MISSING_ROOT_CONTRACT_ESCALATION", codes)
    def test_one_partial_ready_closure_does_not_require_escalation(self) -> None:
        block = _base_block(
            counters={
                "partialReadyClosures": 1,
                "reviewerScopeExpansions": 0,
                "sameClaimCorrections": 0,
                "nonDecreasingBlockerTransitions": 0,
            },
        )
        result = scec.validate_block(block)
        self.assertEqual(result.violations, ())
    def test_repeated_same_claim_correction_requires_root_contract(self) -> None:
        block = _base_block(
            counters={
                "partialReadyClosures": 0,
                "reviewerScopeExpansions": 0,
                "sameClaimCorrections": 2,
                "nonDecreasingBlockerTransitions": 0,
            },
            requiredDisposition="CONTINUE_BOUNDED",
            successorScope="INITIAL_BOUNDED",
        )
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("MISSING_ROOT_CONTRACT_ESCALATION", codes)
class NonDecreasingTransitionTests(unittest.TestCase):
    """Family 8: two non-decreasing transitions require stop/reassessment."""
    def test_two_non_decreasing_transitions_requires_stop_reassess(self) -> None:
        block = _base_block(
            counters={
                "partialReadyClosures": 0,
                "reviewerScopeExpansions": 0,
                "sameClaimCorrections": 0,
                "nonDecreasingBlockerTransitions": 2,
            },
            requiredDisposition="ROOT_CONTRACT_REQUIRED",
            successorScope="INTEGRATED_ROOT_CONTRACT",
        )
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("MISSING_STOP_REASSESS_ESCALATION", codes)
    def test_stop_reassess_with_correct_disposition_passes(self) -> None:
        block = _base_block(
            counters={
                "partialReadyClosures": 0,
                "reviewerScopeExpansions": 0,
                "sameClaimCorrections": 0,
                "nonDecreasingBlockerTransitions": 2,
            },
            requiredDisposition="STOP_REASSESS_ARCHITECTURE",
            successorScope="NO_SUCCESSOR",
        )
        result = scec.validate_block(block)
        self.assertEqual(result.violations, ())
    def test_one_non_decreasing_transition_does_not_require_stop(self) -> None:
        block = _base_block(
            counters={
                "partialReadyClosures": 0,
                "reviewerScopeExpansions": 0,
                "sameClaimCorrections": 0,
                "nonDecreasingBlockerTransitions": 1,
            },
        )
        result = scec.validate_block(block)
        self.assertEqual(result.violations, ())
    def test_stop_reassess_takes_precedence_over_root_contract_message(self) -> None:
        block = _base_block(
            counters={
                "partialReadyClosures": 2,
                "reviewerScopeExpansions": 1,
                "sameClaimCorrections": 2,
                "nonDecreasingBlockerTransitions": 2,
            },
            requiredDisposition="ROOT_CONTRACT_REQUIRED",
            successorScope="INTEGRATED_ROOT_CONTRACT",
        )
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("MISSING_STOP_REASSESS_ESCALATION", codes)
        self.assertNotIn("MISSING_ROOT_CONTRACT_ESCALATION", codes)
class HistoricalT1JReplayRejectionTests(unittest.TestCase):
    """Family 9: historical T1J R2-to-R3 narrow replay rejection, using the
    real committed fixture."""
    @classmethod
    def setUpClass(cls) -> None:
        cls.fixture = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    def _node(self, label_substring: str) -> dict:
        for node in self.fixture["chain"]:
            if label_substring in node["nodeLabel"]:
                return node
        raise AssertionError(f"no fixture node matched {label_substring!r}")
    def _validate_with_predecessor(self, node: dict, predecessor_node: dict):
        declared_hash = node["block"]["predecessor"]["sha256"]
        return scec.validate_block(
            node["block"],
            predecessor_hash_resolver=lambda path: declared_hash,
            predecessor_block_resolver=lambda path: (predecessor_node["block"],),
        )
    def test_fixture_file_exists_and_parses(self) -> None:
        self.assertTrue(FIXTURE_PATH.is_file())
        self.assertEqual(self.fixture["problemKey"], "gc010-scr-r2-t1j-pending-execution-route-integration")
        self.assertGreaterEqual(len(self.fixture["chain"]), 5)
    def test_r1_initial_node_passes(self) -> None:
        node = self._node("T1J-R1")
        result = scec.validate_block(node["block"])
        self.assertEqual(result.violations, ())
    def test_r2_reviewer_scope_expansion_node_escalates_correctly(self) -> None:
        node = self._node("T1J-R2 reviewer correction")
        predecessor = self._node("T1J-R1")
        block = node["block"]
        self.assertEqual(block["counters"]["reviewerScopeExpansions"], 1)
        self.assertEqual(block["requiredDisposition"], "ROOT_CONTRACT_REQUIRED")
        self.assertEqual(block["successorScope"], "INTEGRATED_ROOT_CONTRACT")
        result = self._validate_with_predecessor(node, predecessor)
        self.assertEqual(result.violations, ())
    def test_r3_worker_narrow_continuation_is_rejected(self) -> None:
        """This is the historical replay's central negative case: the R3
        worker's own narrow CONTINUE_BOUNDED/INITIAL_BOUNDED framing is
        invalid once R2's reviewer scope expansion already stands."""
        node = self._node("T1J-R3 worker")
        predecessor = self._node("T1J-R2 reviewer correction")
        block = dict(node["block"])
        block.pop("invalidBecauseEscalationAlreadyRequired", None)
        declared_hash = block["predecessor"]["sha256"]
        result = scec.validate_block(
            block,
            predecessor_hash_resolver=lambda path: declared_hash,
            predecessor_block_resolver=lambda path: (predecessor["block"],),
        )
        codes = {v.code for v in result.violations}
        self.assertIn("NARROW_SUCCESSOR_AFTER_ESCALATION", codes)
        self.assertIn("MISSING_ROOT_CONTRACT_ESCALATION", codes)
    def test_r3_worker_unsupported_resolution_requires_evidence(self) -> None:
        """The R3 worker node resolves the route-order/payload blocker with
        no resolution-evidence binding, which invariant 13 must reject as
        unsupported resolution laundering."""
        node = self._node("T1J-R3 worker")
        block = dict(node["block"])
        block.pop("invalidBecauseEscalationAlreadyRequired", None)
        result = scec.validate_block(block)
        self.assertIn(
            "RESOLUTION_EVIDENCE_MISSING_BINDING", {v.code for v in result.violations}
        )
    def test_r3_reviewer_correction_node_passes(self) -> None:
        node = self._node("T1J-R3 reviewer correction")
        predecessor = self._node("T1J-R2 reviewer correction")
        result = self._validate_with_predecessor(node, predecessor)
        self.assertEqual(result.violations, ())
        self.assertEqual(node["block"]["requiredDisposition"], "STOP_REASSESS_ARCHITECTURE")
        self.assertEqual(node["block"]["successorScope"], "NO_SUCCESSOR")
        self.assertEqual(node["block"]["blockerDelta"]["resolved"], [])
        self.assertEqual(len(node["block"]["blockerDelta"]["retained"]), 3)
        self.assertEqual(len(node["block"]["blockerDelta"]["current"]), 4)
    def test_same_problem_r4_successor_after_stop_is_rejected(self) -> None:
        node = self._node("Proposed T1J-R4")
        predecessor = self._node("T1J-R3 reviewer correction")
        block = node["block"]
        self.assertEqual(block["requiredDisposition"], "READY_WITH_EXECUTABLE_PROOF")
        self.assertEqual(block["successorScope"], "EXECUTABLE_IMPLEMENTATION")
        self.assertNotIn(
            "PROPOSAL_ONLY_NO_RUNTIME_READINESS",
            [c["proofClass"] for c in block["claims"]],
        )
        result = self._validate_with_predecessor(node, predecessor)
        self.assertIn("SUCCESSOR_AFTER_STOP_REASSESS", {v.code for v in result.violations})
class DocumentationOnlyRuntimeReadinessTests(unittest.TestCase):
    """Family 10: documentation-only proof barred from runtime readiness."""
    def test_doc_only_proof_with_ready_disposition_fails(self) -> None:
        block = _base_block(
            requiredDisposition="READY_WITH_EXECUTABLE_PROOF",
            successorScope="EXECUTABLE_IMPLEMENTATION",
            claims=[
                {
                    "claimId": "C1",
                    "claimClass": "DOCUMENTATION_ONLY",
                    "proofClass": "PROPOSAL_ONLY_NO_RUNTIME_READINESS",
                    "evidenceRef": "docs/example.md",
                }
            ],
        )
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("RUNTIME_READINESS_FROM_DOC_ONLY_PROOF", codes)
    def test_doc_only_proof_with_continue_bounded_disposition_is_fine(self) -> None:
        block = _base_block(requiredDisposition="CONTINUE_BOUNDED")
        result = scec.validate_block(block)
        self.assertEqual(result.violations, ())
    def test_executable_proof_with_ready_disposition_passes(self) -> None:
        block = _base_block(
            requiredDisposition="READY_WITH_EXECUTABLE_PROOF",
            successorScope="EXECUTABLE_IMPLEMENTATION",
            claims=[
                {
                    "claimId": "C1",
                    "claimClass": "ORDERING",
                    "proofClass": "EXECUTABLE_SEQUENCE_ASSERTION",
                    "evidenceRef": "tests/test_ordering.py",
                }
            ],
        )
        result = scec.validate_block(block)
        self.assertEqual(result.violations, ())
    def test_ready_without_claims_or_executable_scope_fails(self) -> None:
        block = _base_block(
            claims=[],
            requiredDisposition="READY_WITH_EXECUTABLE_PROOF",
            successorScope="INITIAL_BOUNDED",
        )
        codes = {v.code for v in scec.validate_block(block).violations}
        self.assertIn("READY_WITHOUT_CLAIMS", codes)
        self.assertIn("READY_SCOPE_MISMATCH", codes)
    def test_executable_scope_without_ready_disposition_fails(self) -> None:
        block = _base_block(successorScope="EXECUTABLE_IMPLEMENTATION")
        self.assertIn(
            "EXECUTABLE_SCOPE_WITHOUT_READY_DISPOSITION",
            {v.code for v in scec.validate_block(block).violations},
        )
class ClaimToProofMappingTests(unittest.TestCase):
    """Family 11: every claim-to-proof mapping."""
    def _claim_block(self, claim_class: str, proof_class: str) -> dict:
        return _base_block(
            claims=[
                {
                    "claimId": "C1",
                    "claimClass": claim_class,
                    "proofClass": proof_class,
                    "evidenceRef": "tests/example.py",
                }
            ]
        )
    def test_concurrency_exactly_once_correct_mapping_passes(self) -> None:
        result = scec.validate_block(
            self._claim_block("CONCURRENCY_EXACTLY_ONCE", "EXECUTABLE_ADVERSARIAL_CONCURRENCY_TEST")
        )
        self.assertEqual(result.violations, ())
    def test_concurrency_exactly_once_wrong_mapping_fails(self) -> None:
        result = scec.validate_block(
            self._claim_block("CONCURRENCY_EXACTLY_ONCE", "EXECUTABLE_SEQUENCE_ASSERTION")
        )
        codes = {v.code for v in result.violations}
        self.assertIn("CLAIM_TO_PROOF_MAPPING_VIOLATION", codes)
    def test_crash_recovery_correct_mapping_passes(self) -> None:
        result = scec.validate_block(
            self._claim_block("CRASH_RECOVERY", "EXECUTABLE_STATE_TRANSITION_CRASH_TEST")
        )
        self.assertEqual(result.violations, ())
    def test_crash_recovery_wrong_mapping_fails(self) -> None:
        result = scec.validate_block(
            self._claim_block("CRASH_RECOVERY", "PROPOSAL_ONLY_NO_RUNTIME_READINESS")
        )
        codes = {v.code for v in result.violations}
        self.assertIn("CLAIM_TO_PROOF_MAPPING_VIOLATION", codes)
    def test_ordering_correct_mapping_passes(self) -> None:
        result = scec.validate_block(self._claim_block("ORDERING", "EXECUTABLE_SEQUENCE_ASSERTION"))
        self.assertEqual(result.violations, ())
    def test_ordering_wrong_mapping_fails(self) -> None:
        result = scec.validate_block(
            self._claim_block("ORDERING", "EXECUTABLE_ADVERSARIAL_CONCURRENCY_TEST")
        )
        codes = {v.code for v in result.violations}
        self.assertIn("CLAIM_TO_PROOF_MAPPING_VIOLATION", codes)
    def test_schema_compatibility_correct_mapping_passes(self) -> None:
        result = scec.validate_block(
            self._claim_block("SCHEMA_COMPATIBILITY", "EXECUTABLE_BUILDER_VALIDATOR_CONTRACT_TEST")
        )
        self.assertEqual(result.violations, ())
    def test_schema_compatibility_wrong_mapping_fails(self) -> None:
        result = scec.validate_block(
            self._claim_block("SCHEMA_COMPATIBILITY", "EXECUTABLE_STATE_TRANSITION_CRASH_TEST")
        )
        codes = {v.code for v in result.violations}
        self.assertIn("CLAIM_TO_PROOF_MAPPING_VIOLATION", codes)
    def test_documentation_only_correct_mapping_passes(self) -> None:
        result = scec.validate_block(
            self._claim_block("DOCUMENTATION_ONLY", "PROPOSAL_ONLY_NO_RUNTIME_READINESS")
        )
        self.assertEqual(result.violations, ())
    def test_documentation_only_wrong_mapping_fails(self) -> None:
        result = scec.validate_block(
            self._claim_block("DOCUMENTATION_ONLY", "EXECUTABLE_SEQUENCE_ASSERTION")
        )
        codes = {v.code for v in result.violations}
        self.assertIn("CLAIM_TO_PROOF_MAPPING_VIOLATION", codes)
    def test_other_with_named_observable_proof_passes(self) -> None:
        result = scec.validate_block(self._claim_block("OTHER", "NAMED_OBSERVABLE_PROOF"))
        self.assertEqual(result.violations, ())
    def test_other_with_empty_proof_fails(self) -> None:
        result = scec.validate_block(self._claim_block("OTHER", ""))
        codes = {v.code for v in result.violations}
        self.assertIn("MISSING_CLAIM_FIELD", codes)
    def test_other_with_doc_only_proof_fails(self) -> None:
        result = scec.validate_block(
            self._claim_block("OTHER", "PROPOSAL_ONLY_NO_RUNTIME_READINESS")
        )
        codes = {v.code for v in result.violations}
        self.assertIn("CLAIM_TO_PROOF_MAPPING_VIOLATION", codes)
    def test_other_with_arbitrary_named_string_fails(self) -> None:
        result = scec.validate_block(self._claim_block("OTHER", "SOME_OTHER_PROOF"))
        self.assertIn(
            "CLAIM_TO_PROOF_MAPPING_VIOLATION", {v.code for v in result.violations}
        )
    def test_invalid_claim_class_fails(self) -> None:
        result = scec.validate_block(self._claim_block("NOT_A_REAL_CLASS", "ANYTHING"))
        codes = {v.code for v in result.violations}
        self.assertIn("INVALID_CLAIM_CLASS", codes)
class QuotedMarkerImmunityTests(unittest.TestCase):
    """Family 12: quoted/example markers ignored."""
    def test_backtick_quoted_schema_string_is_not_active(self) -> None:
        text = (
            "The checker looks for `\"schemaVersion\": \"cvf.semanticConvergenceControl.v1\"` "
            "as a literal token in prose, not real JSON.\n"
        )
        self.assertEqual(scec.find_active_blocks(text), [])
    def test_table_cell_mention_is_not_active(self) -> None:
        text = (
            "| Field | Example |\n"
            "| --- | --- |\n"
            "| schemaVersion | cvf.semanticConvergenceControl.v1 (example only) |\n"
        )
        self.assertEqual(scec.find_active_blocks(text), [])
    def test_non_json_code_fence_is_not_active(self) -> None:
        text = "```text\nschemaVersion: cvf.semanticConvergenceControl.v1\n```\n"
        self.assertEqual(scec.find_active_blocks(text), [])
    def test_malformed_json_in_fence_is_not_active(self) -> None:
        text = '```json\n{"schemaVersion": "cvf.semanticConvergenceControl.v1", INVALID\n```\n'
        self.assertEqual(scec.find_active_blocks(text), [])
    def test_real_fenced_json_block_is_active(self) -> None:
        block = _base_block()
        text = "```json\n" + json.dumps(block) + "\n```\n"
        found = scec.find_active_blocks(text)
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["problemKey"], "sample-problem")
    def test_is_active_block_rejects_non_dict_scalar(self) -> None:
        self.assertFalse(scec.is_active_block(scec.SCEC_SCHEMA_VERSION))
        self.assertFalse(scec.is_active_block(["schemaVersion", scec.SCEC_SCHEMA_VERSION]))
        self.assertFalse(scec.is_active_block(None))
class MixedFenceActiveBlockDiscoveryTests(unittest.TestCase):
    """SCEC-T1-R1: a non-JSON fenced block must never cause the structural
    fence scanner to skip or mis-pair a later or earlier valid active SCEC
    JSON block. Direct reproducer plus ordering variants."""
    def test_direct_reproducer_powershell_fence_before_active_block(self) -> None:
        """This is the exact reported defect: a `powershell` fence before one
        valid active SCEC JSON block previously made `find_active_blocks`
        return zero, which produced a false `MISSING_REQUIRED_SCEC_BLOCK`
        violation on a governed work order that actually carried a valid
        block."""
        block = _base_block()
        text = (
            "# Work Order\n\n"
            "```powershell\nGet-Process\n```\n\n"
            "```json\n" + json.dumps(block) + "\n```\n"
        )
        found = scec.find_active_blocks(text)
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["problemKey"], "sample-problem")
    def test_non_json_fence_after_active_block(self) -> None:
        block = _base_block()
        text = (
            "# Work Order\n\n"
            "```json\n" + json.dumps(block) + "\n```\n\n"
            "```powershell\nGet-Process\n```\n"
        )
        found = scec.find_active_blocks(text)
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["problemKey"], "sample-problem")
    def test_non_json_fence_on_both_sides_of_active_block(self) -> None:
        block = _base_block()
        text = (
            "# Work Order\n\n"
            "```bash\necho before\n```\n\n"
            "```json\n" + json.dumps(block) + "\n```\n\n"
            "```text\nafter\n```\n"
        )
        found = scec.find_active_blocks(text)
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["problemKey"], "sample-problem")
    def test_multiple_ordinary_fenced_blocks_around_active_block(self) -> None:
        block = _base_block()
        text = (
            "# Work Order\n\n"
            "```powershell\nGet-Process\n```\n\n"
            "```bash\necho hi\n```\n\n"
            "```json\n" + json.dumps(block) + "\n```\n\n"
            "```text\ntrailer one\n```\n\n"
            "```yaml\nkey: value\n```\n"
        )
        found = scec.find_active_blocks(text)
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["problemKey"], "sample-problem")
    def test_untagged_active_json_block_with_prior_non_json_fence(self) -> None:
        block = _base_block()
        text = (
            "# Work Order\n\n"
            "```powershell\nGet-Process\n```\n\n"
            "```\n" + json.dumps(block) + "\n```\n"
        )
        found = scec.find_active_blocks(text)
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["problemKey"], "sample-problem")
    def test_quoted_marker_immunity_preserved_with_prior_non_json_fence(self) -> None:
        text = (
            "```powershell\nGet-Process\n```\n\n"
            "The checker looks for `\"schemaVersion\": "
            "\"cvf.semanticConvergenceControl.v1\"` as a literal token in "
            "prose, not real JSON.\n"
        )
        self.assertEqual(scec.find_active_blocks(text), [])
    def test_malformed_active_candidate_after_non_json_fence_is_not_active(self) -> None:
        text = (
            "```powershell\nGet-Process\n```\n\n"
            '```json\n{"schemaVersion": "cvf.semanticConvergenceControl.v1", '
            'INVALID\n```\n'
        )
        self.assertEqual(scec.find_active_blocks(text), [])
    def test_fence_scanner_yields_correct_language_and_body_pairs(self) -> None:
        text = "```powershell\nGet-Process\n```\n```json\n{}\n```\n"
        pairs = scec._iter_fenced_blocks(text)
        self.assertEqual(pairs, [("powershell", "Get-Process"), ("json", "{}")])
    def test_diagnose_file_finds_required_block_past_leading_non_json_fence(self) -> None:
        block = _base_block()
        text = (
            "# Work Order\n\n"
            "```powershell\nGet-Process\n```\n\n"
            "```json\n" + json.dumps(block) + "\n```\n"
        )
        diag = scec.diagnose_file("docs/work_orders/sample.md", text, require_block=True)
        self.assertEqual(diag.block_count, 1)
        self.assertTrue(diag.is_clean)
    def test_indented_and_longer_fences_preserve_supported_discovery(self) -> None:
        block = _base_block()
        for indent, fence in ((" ", "```"), ("   ", "```"), ("", "````")):
            with self.subTest(indent=len(indent), width=len(fence)):
                text = f"{indent}{fence}json\n{json.dumps(block)}\n{indent}{fence}\n"
                self.assertEqual(len(scec.find_active_blocks(text)), 1)
class ForwardOnlyActivationTests(unittest.TestCase):
    """Family 13: unchanged historical files excluded from forward-only
    activation."""
    def test_run_only_inspects_changed_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            (tmp_path / "docs" / "reviews").mkdir(parents=True)
            unchanged = tmp_path / "docs" / "reviews" / "historical.md"
            block = _base_block(requiredDisposition="CONTINUE_BOUNDED")
            # Deliberately malformed (would fail if ever checked): silent
            # blocker disappearance, proving this file is never touched.
            block["blockerDelta"]["prior"] = ["B1"]
            unchanged.write_text(
                "# Historical\n```json\n" + json.dumps(block) + "\n```\n",
                encoding="utf-8",
            )
            original_root = scec.REPO_ROOT
            try:
                scec.REPO_ROOT = tmp_path
                # No git repo in tmp_path, so _changed_md_paths returns
                # empty (git commands fail closed to no paths), simulating
                # "this file was not part of the changed range."
                changed = scec._changed_md_paths("HEAD", "HEAD")
            finally:
                scec.REPO_ROOT = original_root
            self.assertEqual(changed, ())
    def test_diagnose_file_used_directly_still_validates_when_asked(self) -> None:
        """Direct diagnose_file calls (used by the changed-range scanner)
        validate whatever text is passed; the forward-only guarantee lives in
        `run`'s changed-path discovery, tested above."""
        block = _base_block()
        block["blockerDelta"]["prior"] = ["B1"]  # malformed on purpose
        text = "# Doc\n```json\n" + json.dumps(block) + "\n```\n"
        diag = scec.diagnose_file("docs/reviews/x.md", text)
        self.assertFalse(diag.is_clean)
class ScaffoldEmissionTests(unittest.TestCase):
    """Family 14: dispatch and worker-return scaffolds emitting required
    blocks."""
    def test_dispatch_scaffold_emits_valid_initial_scec_block(self) -> None:
        from build_dispatch_packet_scaffold import ScaffoldArgs, build_work_order, detect_triggers
        args = ScaffoldArgs(
            packet_kind="generic-worker-dispatch",
            batch_id="SCEC-SCAFFOLD-TEST",
            title="Scaffold Test Packet",
            date="2026-08-31",
            base="abc1234",
            commit_mode="WORKER_MUST_NOT_COMMIT",
        )
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        blocks = scec.find_active_blocks(work_order)
        self.assertEqual(len(blocks), 1)
        result = scec.validate_block(blocks[0])
        self.assertEqual(result.violations, ())
        self.assertEqual(blocks[0]["chainMode"], "INITIAL")
    def test_worker_return_skeleton_emits_fail_closed_successor(self) -> None:
        from build_dispatch_packet_scaffold import ScaffoldArgs
        from build_worker_return_skeleton_scaffold import build_worker_return_skeleton
        args = ScaffoldArgs(
            packet_kind="generic-worker-dispatch",
            batch_id="SCEC-SCAFFOLD-RETURN-TEST",
            title="Scaffold Return Test",
            date="2026-08-31",
            base="abc1234",
            commit_mode="WORKER_MUST_NOT_COMMIT",
        )
        skeleton = build_worker_return_skeleton(args)
        blocks = scec.find_active_blocks(skeleton)
        self.assertEqual(len(blocks), 1)
        result = scec.validate_block(blocks[0])
        self.assertEqual(blocks[0]["chainMode"], "SUCCESSOR")
        self.assertIn(
            "PREDECESSOR_UNRESOLVED_SENTINEL", {v.code for v in result.violations}
        )
    def test_run_worker_return_scaffold_emits_fail_closed_successor(self) -> None:
        import run_worker_return_scaffold as runner
        text = runner.build_scaffold("Example Worker Return")
        blocks = scec.find_active_blocks(text)
        self.assertEqual(len(blocks), 1)
        result = scec.validate_block(blocks[0])
        self.assertEqual(blocks[0]["chainMode"], "SUCCESSOR")
        self.assertIn(
            "PREDECESSOR_UNRESOLVED_SENTINEL", {v.code for v in result.violations}
        )
class GateBindingPresenceTests(unittest.TestCase):
    """Family 15: checker present exactly once in common autorun and all
    three hook catalogs."""
    def test_present_exactly_once_in_common_commands(self) -> None:
        import agent_autorun_command_catalog as catalog
        commands = catalog._common_commands("base", "head")
        matches = [c for c in commands if any("check_semantic_convergence_control.py" in part for part in c.command)]
        self.assertEqual(len(matches), 1, "checker must be bound exactly once in _common_commands")
    def test_present_exactly_once_in_reviewer_fast_catalog(self) -> None:
        import local_governance_hook_catalog_reviewer_fast as reviewer_fast
        matches = [
            entry
            for entry in reviewer_fast.REVIEWER_FAST_CHECKS
            if any("check_semantic_convergence_control.py" in part for part in entry[1])
        ]
        self.assertEqual(len(matches), 1)
    def test_present_exactly_once_in_pre_commit_catalog(self) -> None:
        import local_governance_hook_catalog_pre_commit as pre_commit
        matches = [
            entry
            for entry in pre_commit.PRE_COMMIT_CHECKS
            if any("check_semantic_convergence_control.py" in part for part in entry[1])
        ]
        self.assertEqual(len(matches), 1)
    def test_present_exactly_once_in_pre_push_catalog(self) -> None:
        import local_governance_hook_catalog_pre_push as pre_push
        matches = [
            entry
            for entry in pre_push.PRE_PUSH_CHECKS
            if any("check_semantic_convergence_control.py" in part for part in entry[1])
        ]
        self.assertEqual(len(matches), 1)
class NoGateSuppressionTests(unittest.TestCase):
    """Family 16: no existing gate selectively removed or suppressed."""
    def test_common_commands_still_include_prior_representative_gates(self) -> None:
        import agent_autorun_command_catalog as catalog
        commands = catalog._common_commands("base", "head")
        joined = [" ".join(c.command) for c in commands]
        for representative in (
            "check_core_guard_self_protection.py",
            "check_work_order_dispatch_quality.py",
            "check_review_cost_control.py",
            "check_dispatch_scaffold_provenance.py",
        ):
            self.assertTrue(
                any(representative in line for line in joined),
                f"expected pre-existing gate {representative} to remain present",
            )
    def test_reviewer_fast_catalog_still_includes_prior_representative_gates(self) -> None:
        import local_governance_hook_catalog_reviewer_fast as reviewer_fast
        joined = [" ".join(entry[1]) for entry in reviewer_fast.REVIEWER_FAST_CHECKS]
        for representative in (
            "check_core_guard_self_protection.py",
            "check_review_cost_control.py",
            "check_worker_return_quality_gate.py",
        ):
            self.assertTrue(any(representative in line for line in joined))
    def test_pre_commit_catalog_still_includes_prior_representative_gates(self) -> None:
        import local_governance_hook_catalog_pre_commit as pre_commit
        joined = [" ".join(entry[1]) for entry in pre_commit.PRE_COMMIT_CHECKS]
        for representative in (
            "check_core_guard_self_protection.py",
            "check_governed_file_size.py",
            "check_work_order_dispatch_quality.py",
        ):
            self.assertTrue(any(representative in line for line in joined))
    def test_pre_push_catalog_still_includes_prior_representative_gates(self) -> None:
        import local_governance_hook_catalog_pre_push as pre_push
        joined = [" ".join(entry[1]) for entry in pre_push.PRE_PUSH_CHECKS]
        for representative in (
            "check_core_guard_self_protection.py",
            "check_task_governance_route.py",
            "check_prepublic_p3_readiness.py",
        ):
            self.assertTrue(any(representative in line for line in joined))
class MalformedBlockFailClosedTests(unittest.TestCase):
    """Invariant 12 direct coverage: malformed/incomplete active blocks fail
    closed rather than silently passing."""
    def test_missing_required_field_fails(self) -> None:
        block = _base_block()
        del block["counters"]
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("MISSING_FIELD", codes)
    def test_invalid_disposition_token_fails(self) -> None:
        block = _base_block(requiredDisposition="MADE_UP_TOKEN")
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("INVALID_DISPOSITION", codes)
    def test_invalid_successor_scope_token_fails(self) -> None:
        block = _base_block(successorScope="MADE_UP_SCOPE")
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("INVALID_SUCCESSOR_SCOPE", codes)
    def test_wrong_type_ordinal_fails(self) -> None:
        block = _base_block(chainOrdinal="not-an-int")
        result = scec.validate_block(block)
        codes = {v.code for v in result.violations}
        self.assertIn("INVALID_ORDINAL", codes)
    def test_non_active_block_reports_no_violations_but_inactive(self) -> None:
        result = scec.validate_block({"not": "scec"})
        self.assertFalse(result.is_active)
        self.assertEqual(result.violations, ())
        self.assertFalse(result.is_valid)
class MainCliTests(unittest.TestCase):
    """Basic CLI smoke coverage for the git-integration layer."""
    def test_main_runs_and_exits_zero_with_no_active_blocks_changed(self) -> None:
        exit_code = scec.main(["--base", "HEAD", "--head", "HEAD"])
        self.assertEqual(exit_code, 0)
if __name__ == "__main__":
    unittest.main()
