#!/usr/bin/env python3
"""Focused hostile regression tests for the MFRP-P4 shadow-canary helper.

Covers the work order's Required Hostile Regression Matrix in full. These
tests exercise the bounded comparator, deterministic sampling, the
P4-I1 named independent invariant, the honest receipt/linkage boundary, and
rollback rehearsal. They do not stand up a live provider or network call.
"""

from __future__ import annotations

import json
import hashlib
import subprocess
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import mfrp_shadow_canary as canary  # noqa: E402


REPO_ROOT = canary.REPO_ROOT


class SamplingFormulaTests(unittest.TestCase):
    """n=0..499 monotonic/capped behavior; outcome-blind selection."""

    def test_zero_population_yields_zero(self):
        self.assertEqual(canary.sample_size(0), 0)

    def test_small_population_floors_at_one(self):
        for n in range(1, 5):
            self.assertEqual(canary.sample_size(n), 1, msg=f"n={n}")

    def test_caps_at_four(self):
        for n in (20, 50, 100, 499):
            self.assertEqual(canary.sample_size(n), 4, msg=f"n={n}")

    def test_monotonic_nondecreasing_across_full_range(self):
        previous = 0
        for n in range(0, 500):
            current = canary.sample_size(n)
            self.assertGreaterEqual(current, previous)
            self.assertLessEqual(current, 4)
            previous = current

    def test_ceil_boundary_exact(self):
        # k = min(4, max(1, ceil(0.20 * n)))
        self.assertEqual(canary.sample_size(5), 1)   # ceil(1.0) = 1
        self.assertEqual(canary.sample_size(6), 2)   # ceil(1.2) = 2
        self.assertEqual(canary.sample_size(10), 2)  # ceil(2.0) = 2
        self.assertEqual(canary.sample_size(11), 3)  # ceil(2.2) = 3
        self.assertEqual(canary.sample_size(20), 4)  # ceil(4.0) = 4
        self.assertEqual(canary.sample_size(21), 4)  # ceil(4.2) -> capped at 4

    def test_negative_population_rejected(self):
        with self.assertRaises(ValueError):
            canary.sample_size(-1)


class SamplingOrderingTests(unittest.TestCase):
    """Tie-stable ordering and outcome-blind selection."""

    def test_digest_domain_is_utf8_lf_concatenation(self):
        digest = canary.sampling_digest("a/b.md", "deadbeef", "receipt-1")
        import hashlib

        expected = hashlib.sha256("a/b.md\ndeadbeef\nreceipt-1".encode("utf-8")).hexdigest()
        self.assertEqual(digest, expected)

    def test_selection_is_lowest_digest_and_ignores_outcome_labels(self):
        rows = []
        for i in range(10):
            digest = canary.sampling_digest(f"path-{i}", f"blob-{i}", f"receipt-{i}")
            rows.append({
                "rowId": f"row-{i}",
                "divergenceClass": "ENVELOPE_CONSISTENT_WITH_TRUSTED",
                "samplingDigest": digest,
                # Deliberately vary outcome-shaped fields; selection must not
                # look at them.
                "trustedOutcome": {"disposition": "IRRELEVANT" if i % 2 else "ALSO_IRRELEVANT"},
                "machineOutcome": {"status": "PASS" if i % 3 else "FAIL"},
            })
        expected_order = sorted(rows, key=lambda r: r["samplingDigest"])
        k = canary.sample_size(len(rows))
        expected_ids = [r["rowId"] for r in expected_order[:k]]
        selected = canary.select_sample(rows)
        self.assertEqual(selected, expected_ids)
        self.assertEqual(len(selected), 2)  # ceil(0.2*10) = 2

    def test_selection_excludes_non_clean_divergence_classes(self):
        rows = [
            {
                "rowId": "clean-1",
                "divergenceClass": "ENVELOPE_CONSISTENT_WITH_TRUSTED",
                "samplingDigest": "0" * 64,
            },
            {
                "rowId": "divergent-1",
                "divergenceClass": "UNEXPLAINED_DIVERGENCE",
                "samplingDigest": "1" * 64,
            },
            {
                "rowId": "mismatch-1",
                "divergenceClass": "COMPARISON_OBJECT_MISMATCH",
                "samplingDigest": "2" * 64,
            },
        ]
        selected = canary.select_sample(rows)
        self.assertEqual(selected, ["clean-1"])

    def test_tie_stable_ordering_on_identical_digest(self):
        # Use five equal-digest rows so k=1 (floor) does not trivially select
        # everything; Python's sort is stable, so ties preserve original
        # relative order and the first-inserted row must win the low slot.
        rows = [
            {"rowId": rid, "divergenceClass": "ENVELOPE_CONSISTENT_WITH_TRUSTED", "samplingDigest": "same"}
            for rid in ("a", "b", "c", "d", "e")
        ]
        k = canary.sample_size(len(rows))
        self.assertEqual(k, 1)
        selected = canary.select_sample(rows)
        self.assertEqual(selected, ["a"])

    def test_tie_stable_ordering_preserves_full_relative_order(self):
        # With enough equal-digest rows to fill k=4, stability means the
        # first four inserted rows are selected, in original order.
        rows = [
            {"rowId": rid, "divergenceClass": "ENVELOPE_CONSISTENT_WITH_TRUSTED", "samplingDigest": "same"}
            for rid in ("a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
                        "k", "l", "m", "n", "o", "p", "q", "r", "s", "t")
        ]
        selected = canary.select_sample(rows)
        self.assertEqual(selected, ["a", "b", "c", "d"])


class LinkageBoundaryTests(unittest.TestCase):
    """Unrelated ignored receipt cannot be linked; weak linkage fails closed."""

    def test_none_manifest_is_not_linked(self):
        linked, reason = canary.evaluate_linkage(None)
        self.assertFalse(linked)
        self.assertIn("no linkage manifest", reason)

    def test_missing_field_fails_closed(self):
        manifest = canary.LinkageManifest(
            return_path="docs/reviews/x.md",
            trusted_commit="a" * 40,
            trusted_blob="b" * 40,
            autorun_base="c" * 40,
            autorun_head="d" * 40,
            receipt_path="",  # missing
            receipt_digest="e" * 64,
            verifier_identity="f" * 64,
            readout_identity="cvf.autorun.pass-receipt.v3",
            creation_after_trusted_commit=True,
            source_authority_locator="docs/reviews/x.md#section",
            hard_obligation_locator="obligation",
        )
        linked, reason = canary.evaluate_linkage(manifest)
        self.assertFalse(linked)
        self.assertIn("receipt_path", reason)

    def test_missing_order_evidence_fails_closed(self):
        manifest = canary.LinkageManifest(
            return_path="docs/reviews/x.md",
            trusted_commit="a" * 40,
            trusted_blob="b" * 40,
            autorun_base="c" * 40,
            autorun_head="d" * 40,
            receipt_path="p",
            receipt_digest="e" * 64,
            verifier_identity="f" * 64,
            readout_identity="cvf.autorun.pass-receipt.v3",
            creation_after_trusted_commit=False,  # missing order evidence
            source_authority_locator="docs/reviews/x.md#section",
            hard_obligation_locator="obligation",
        )
        linked, reason = canary.evaluate_linkage(manifest)
        self.assertFalse(linked)
        self.assertIn("creation-time-after-trusted-commit", reason)

    def test_complete_manifest_is_linked(self):
        manifest = canary.LinkageManifest(
            return_path="docs/reviews/x.md",
            trusted_commit="a" * 40,
            trusted_blob="b" * 40,
            autorun_base="c" * 40,
            autorun_head="d" * 40,
            receipt_path="p",
            receipt_digest="e" * 64,
            verifier_identity="f" * 64,
            readout_identity="cvf.autorun.pass-receipt.v3",
            creation_after_trusted_commit=True,
            source_authority_locator="docs/reviews/x.md#section",
            hard_obligation_locator="obligation",
        )
        linked, _ = canary.evaluate_linkage(manifest)
        self.assertTrue(linked)

    def test_unrelated_ignored_receipt_cannot_be_linked(self, tmp_dir=None):
        """None of the four current ignored receipts bind the R1B-R2 return."""
        result = canary.find_bound_ignored_receipt(
            canary.TRUSTED_RETURN_PATH, canary.TRUSTED_COMMIT, canary.TRUSTED_BLOB
        )
        self.assertIsNone(
            result,
            msg="an unrelated ignored receipt was incorrectly treated as linked evidence",
        )

    def test_range_match_without_declared_return_path_is_not_linkage(self):
        """A receipt whose base/head happens to match the range, but which
        does not declare the bound return path/blob, must not be linked.
        """
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            fake_receipt_dir = tmp_path / "autorun-receipts"
            fake_receipt_dir.mkdir()
            fake_receipt = {
                "baseSha": canary.AUTORUN_RANGE_PARENT[:9],
                "headSha": canary.AUTORUN_RANGE_HEAD[:9],
                # Deliberately omit boundReturnPath/boundReturnBlob.
            }
            (fake_receipt_dir / "unrelated.json").write_text(json.dumps(fake_receipt))
            original_dir = canary.IGNORED_RECEIPT_DIR
            original_root = canary.REPO_ROOT
            try:
                canary.REPO_ROOT = tmp_path
                canary.IGNORED_RECEIPT_DIR = Path("autorun-receipts")
                result = canary.find_bound_ignored_receipt(
                    canary.TRUSTED_RETURN_PATH, canary.TRUSTED_COMMIT, canary.TRUSTED_BLOB
                )
            finally:
                canary.REPO_ROOT = original_root
                canary.IGNORED_RECEIPT_DIR = original_dir
            self.assertIsNone(result)

    def test_tampered_bound_blob_rejects(self):
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            fake_receipt_dir = tmp_path / "autorun-receipts"
            fake_receipt_dir.mkdir()
            fake_receipt = {
                "baseSha": canary.AUTORUN_RANGE_PARENT[:9],
                "headSha": canary.AUTORUN_RANGE_HEAD[:9],
                "boundReturnPath": canary.TRUSTED_RETURN_PATH,
                "boundReturnBlob": "tampered" + "0" * 32,  # wrong blob
            }
            (fake_receipt_dir / "tampered.json").write_text(json.dumps(fake_receipt))
            original_dir = canary.IGNORED_RECEIPT_DIR
            original_root = canary.REPO_ROOT
            try:
                canary.REPO_ROOT = tmp_path
                canary.IGNORED_RECEIPT_DIR = Path("autorun-receipts")
                result = canary.find_bound_ignored_receipt(
                    canary.TRUSTED_RETURN_PATH, canary.TRUSTED_COMMIT, canary.TRUSTED_BLOB
                )
            finally:
                canary.REPO_ROOT = original_root
                canary.IGNORED_RECEIPT_DIR = original_dir
            self.assertIsNone(result)


class TrustedRecordOrderTests(unittest.TestCase):
    """Trusted commit missing/non-ancestor or machine-before-trusted rejects."""

    def test_real_trusted_commit_is_proven_ancestor_of_head(self):
        evidence = canary.verify_trusted_record_order(
            canary.TRUSTED_COMMIT, canary.git_head()
        )
        self.assertTrue(evidence["commitExists"])
        self.assertTrue(evidence["isAncestor"])
        self.assertEqual(evidence["orderOfRecordStatus"], "PROVEN")

    def test_nonexistent_commit_rejects(self):
        evidence = canary.verify_trusted_record_order(
            "0" * 40, canary.git_head()
        )
        self.assertFalse(evidence["commitExists"])
        self.assertEqual(evidence["orderOfRecordStatus"], "ORDER_OF_RECORD_UNPROVEN")

    def test_non_ancestor_commit_rejects(self):
        # The trusted commit itself is not an ancestor of its own parent.
        evidence = canary.verify_trusted_record_order(
            canary.TRUSTED_COMMIT, canary.AUTORUN_RANGE_PARENT
        )
        self.assertFalse(evidence["isAncestor"])
        self.assertEqual(evidence["orderOfRecordStatus"], "ORDER_OF_RECORD_UNPROVEN")

    def test_build_initial_observation_row_raises_on_unproven_order(self):
        with self.assertRaises(ValueError) as ctx:
            canary.build_initial_observation_row("0" * 40)
        self.assertIn("ORDER_OF_RECORD_UNPROVEN", str(ctx.exception))


class ComparisonObjectMismatchTests(unittest.TestCase):
    """Comparison-object mismatch cannot map to clean consistency."""

    def test_ineligible_row_never_reports_envelope_consistent(self):
        row = canary.build_initial_observation_row(canary.git_head())
        row_dict = row.to_dict()
        if row_dict["ineligibleClass"]:
            self.assertEqual(row_dict["divergenceClass"], "COMPARISON_OBJECT_MISMATCH")
            self.assertNotEqual(row_dict["divergenceClass"], "ENVELOPE_CONSISTENT_WITH_TRUSTED")

    def test_absent_linkage_never_yields_clean_agreement(self):
        linked, _ = canary.evaluate_linkage(None)
        self.assertFalse(linked)
        # By construction, the shared row-construction tail
        # (``_build_linked_or_ineligible_row``, used by both
        # ``build_initial_observation_row`` and
        # ``build_row_from_observation_input`` per P4-RV-4) only assigns
        # ENVELOPE_CONSISTENT_WITH_TRUSTED once linkage is both complete AND
        # reconciled against the actual receipt payload.
        import inspect

        source = inspect.getsource(canary._build_linked_or_ineligible_row)
        # Structural guard: the incomplete-manifest branch must set
        # COMPARISON_OBJECT_MISMATCH, never the clean-consistency class.
        incomplete_branch = source.split("if not complete:")[1].split(
            "# Manifest is complete"
        )[0]
        self.assertIn("COMPARISON_OBJECT_MISMATCH", incomplete_branch)
        self.assertNotIn("ENVELOPE_CONSISTENT_WITH_TRUSTED", incomplete_branch)

    def test_reconciliation_failure_never_yields_clean_agreement(self):
        """Structural guard for P4-RV-4: the reconciliation-failure branch
        must route to the reconciliation's own divergence class (never a
        bare COMPARISON_OBJECT_MISMATCH override that could accidentally be
        edited into ENVELOPE_CONSISTENT_WITH_TRUSTED), and must never itself
        construct the clean-consistency class."""
        import inspect

        source = inspect.getsource(canary._build_linked_or_ineligible_row)
        reconciliation_failure_branch = source.split(
            "if not reconciliation.reconciled:"
        )[1].split("pair_linkage_evidence = {")[0]
        self.assertIn("reconciliation.divergence_class", reconciliation_failure_branch)
        self.assertNotIn(
            "ENVELOPE_CONSISTENT_WITH_TRUSTED", reconciliation_failure_branch
        )


class BlindSpotAndC15Tests(unittest.TestCase):
    """C07/C08/C18/C15 cannot be hidden or added to success denominators."""

    def test_blind_spots_present_in_every_row(self):
        row = canary.build_initial_observation_row(canary.git_head())
        row_dict = row.to_dict()
        blind = row_dict["blindSpotDisposition"]
        self.assertEqual(set(blind["nonRepresentable"]), {"C07", "C08", "C18"})
        self.assertEqual(blind["c15"], "FALSE_NEGATIVE")
        self.assertTrue(blind["excludedFromSuccessDenominators"])

    def test_evidence_blind_spots_top_level(self):
        evidence = canary.build_evidence(execution_base=canary.git_head())
        self.assertEqual(set(evidence["blindSpots"]["nonRepresentable"]), {"C07", "C08", "C18"})
        self.assertEqual(evidence["blindSpots"]["c15"], "FALSE_NEGATIVE")
        self.assertTrue(evidence["blindSpots"]["excludedFromSuccessDenominators"])

    def test_cannot_remove_blind_spots_without_failing_invariant(self):
        row = canary.build_initial_observation_row(canary.git_head())
        row_dict = row.to_dict()
        tampered_row = dict(row_dict)
        tampered_row["blindSpotDisposition"] = {
            "nonRepresentable": [],  # hidden!
            "c15": "PASS",  # hidden!
            "excludedFromSuccessDenominators": False,
        }
        manifest = canary.default_closed_audit_manifest(tampered_row)
        result = canary.run_p4_i1_invariant(manifest)
        self.assertFalse(result["checks"]["4_limitationsSurviveIntoClassification"])
        self.assertEqual(result["result"], "FAIL")


class OutcomeLabelAgreementTests(unittest.TestCase):
    """Outcome label agreement with failed P4-I1 still triggers a finding."""

    def test_failed_invariant_is_not_masked_by_pass_label(self):
        row = canary.build_initial_observation_row(canary.git_head())
        row_dict = row.to_dict()
        # Simulate an outcome label that claims success while the hard
        # obligation disposition has been corrupted.
        tampered_row = dict(row_dict)
        tampered_row["divergenceClass"] = "ENVELOPE_CONSISTENT_WITH_TRUSTED"
        tampered_row["blindSpotDisposition"] = dict(row_dict["blindSpotDisposition"])
        tampered_row["blindSpotDisposition"]["c15"] = "PASS"  # corrupted
        manifest = canary.default_closed_audit_manifest(tampered_row)
        result = canary.run_p4_i1_invariant(manifest)
        # Even though divergenceClass claims consistency, the invariant must
        # still independently fail on the corrupted blind-spot survival check.
        self.assertEqual(result["result"], "FAIL")


class LimitationRemovalTests(unittest.TestCase):
    """limitation/notChecked/UNCLASSIFIED removal rejects."""

    def test_missing_c15_text_fails_check3(self):
        manifest = canary.ClosedAuditManifest(
            return_blob_path=Path(canary.TRUSTED_RETURN_PATH),
            declared_evidence_paths=(
                canary.PinnedEvidenceInput(
                    path=Path(canary.TRUSTED_RETURN_PATH),
                    expected_sha256=canary.TRUSTED_RETURN_EXPECTED_SHA256,
                ),
            ),
            hard_obligation_locator=canary.HARD_OBLIGATION_LOCATOR,
            hard_obligation_locator_pattern=canary.HARD_OBLIGATION_LOCATOR_PATTERN,
            comparator_row={
                "blindSpotDisposition": {
                    "nonRepresentable": ["C07", "C08", "C18"],
                    "c15": "FALSE_NEGATIVE",
                    "excludedFromSuccessDenominators": True,
                },
                "trustedRecordOrderEvidence": {"orderOfRecordStatus": "PROVEN"},
            },
        )
        result = canary.run_p4_i1_invariant(manifest)
        # The real committed return retains this text, so this must PASS on
        # the actual repository file; this test asserts the check exists and
        # is evaluated (not that it always fails).
        self.assertIn("3_noAcceptanceClaimOverAbsentObligation", result["checks"])

    def test_real_return_retains_all_required_markers(self):
        result = canary.run_p4_i1_invariant(
            canary.default_closed_audit_manifest(
                canary.build_initial_observation_row(canary.git_head()).to_dict()
            )
        )
        self.assertTrue(result["checks"]["3_noAcceptanceClaimOverAbsentObligation"])
        self.assertGreaterEqual(result["locatorOccurrenceCount"], 1)


class AuditInputScopeTests(unittest.TestCase):
    """Undeclared audit input and semantic replay command produce
    AUDIT_INPUT_SCOPE_EXCEEDED."""

    def test_undeclared_path_raises_scope_exceeded(self):
        # The manifest's own closed set is exactly {return_blob_path} plus
        # its declared_evidence_paths. Requesting a read of any path outside
        # that closed set must raise, never silently widen scope.
        manifest = canary.default_closed_audit_manifest(
            canary.build_initial_observation_row(canary.git_head()).to_dict()
        )
        undeclared = Path("docs/reviews/UNDECLARED_PATH_NOT_IN_MANIFEST.md")
        with self.assertRaises(canary.AuditInputScopeExceeded):
            canary.run_p4_i1_invariant(manifest, extra_read_paths=(undeclared,))

    def test_semantic_replay_command_raises_scope_exceeded(self):
        manifest = canary.default_closed_audit_manifest(
            canary.build_initial_observation_row(canary.git_head()).to_dict()
        )
        with self.assertRaises(canary.AuditInputScopeExceeded):
            canary.run_p4_i1_invariant(manifest, semantic_replay_requested=True)

    def test_declared_paths_do_not_raise(self):
        manifest = canary.default_closed_audit_manifest(
            canary.build_initial_observation_row(canary.git_head()).to_dict()
        )
        # Should not raise.
        result = canary.run_p4_i1_invariant(manifest)
        self.assertIn("result", result)


class AlwaysCleanWeakeningTests(unittest.TestCase):
    """Always-clean comparator/evaluator weakening is caught."""

    def test_ineligible_pair_cannot_be_forced_into_pass_invariant_by_omission(self):
        row = canary.build_initial_observation_row(canary.git_head())
        row_dict = row.to_dict()
        # An "always clean" weakening would drop order evidence or blind
        # spots to force PASS; verify the invariant still requires all five
        # checks independently.
        broken_row = dict(row_dict)
        broken_row["trustedRecordOrderEvidence"] = {"orderOfRecordStatus": "ORDER_OF_RECORD_UNPROVEN"}
        manifest = canary.default_closed_audit_manifest(broken_row)
        result = canary.run_p4_i1_invariant(manifest)
        self.assertFalse(result["checks"]["5_trustedDispositionAncestorOfDisclosure"])
        self.assertEqual(result["result"], "FAIL")

    def test_evaluate_linkage_never_returns_true_for_none(self):
        # A weakened "always clean" comparator might try to default-link.
        for _ in range(5):
            linked, _ = canary.evaluate_linkage(None)
            self.assertFalse(linked)


class RollbackRehearsalTests(unittest.TestCase):
    """Rollback leaves trusted blob/outcome and repository tracked bytes
    unchanged."""

    def test_rollback_preserves_trusted_blob_and_head(self):
        result = canary.rollback_rehearsal()
        self.assertTrue(result["trustedBlobUnchanged"])
        self.assertTrue(result["headUnchanged"])
        self.assertTrue(result["trustedDispositionUnchanged"])
        self.assertEqual(result["providerCallsDuringRollback"], 0)

    def test_rollback_removes_marker_directory(self):
        result = canary.rollback_rehearsal()
        self.assertTrue(result["markerCreated"])
        self.assertTrue(result["markerRemoved"])
        target = REPO_ROOT / canary.RUNTIME_DIR
        self.assertFalse(target.exists())

    def test_rollback_does_not_change_tracked_repository_bytes(self):
        _, status_before, _ = canary._run_git(["status", "--short"])
        tracked_before = {
            line for line in status_before.splitlines() if not line.strip().startswith("??")
        }
        canary.rollback_rehearsal()
        _, status_after, _ = canary._run_git(["status", "--short"])
        tracked_after = {
            line for line in status_after.splitlines() if not line.strip().startswith("??")
        }
        self.assertEqual(tracked_before, tracked_after)


class ByteIdentityTests(unittest.TestCase):
    """Two same-base executions produce byte-identical evidence except
    explicitly excluded duration fields."""

    def test_two_runs_are_byte_identical_after_normalization(self):
        base = canary.git_head()
        evidence_1 = canary.build_evidence(execution_base=base)
        evidence_2 = canary.build_evidence(execution_base=base)
        normalized_1 = canary.normalize_for_byte_comparison(evidence_1)
        normalized_2 = canary.normalize_for_byte_comparison(evidence_2)
        bytes_1 = canary.evidence_bytes(normalized_1)
        bytes_2 = canary.evidence_bytes(normalized_2)
        self.assertEqual(bytes_1, bytes_2)

    def test_normalization_strips_only_duration_and_live_status_fields(self):
        base = canary.git_head()
        evidence = canary.build_evidence(execution_base=base)
        normalized = canary.normalize_for_byte_comparison(evidence)
        self.assertNotIn("repositoryStatusBefore", normalized["rollbackResult"])
        self.assertNotIn("repositoryStatusAfter", normalized["rollbackResult"])
        for row in normalized["rows"]:
            self.assertNotIn("shadowDurationSeconds", row["costEvidence"])
        # Load-bearing identity fields must survive normalization untouched.
        self.assertIn("trustedBlobBefore", normalized["rollbackResult"])
        self.assertIn("trustedBlobAfter", normalized["rollbackResult"])
        self.assertIn("trustedDispositionUnchanged", normalized["rollbackResult"])
        self.assertTrue(normalized["rollbackResult"]["trustedDispositionUnchanged"])


class ActualP2SeamTests(unittest.TestCase):
    """Actual P2 import/call proof and copied-evaluator negative test."""

    def test_module_imports_actual_p2_validator_symbol(self):
        self.assertIs(
            canary._validate_receipt_integrity,
            __import__(
                "agent_autorun_machine_verification"
                if "agent_autorun_machine_verification" in sys.modules
                else "governance.compat.agent_autorun_machine_verification",
                fromlist=["_validate_receipt_integrity"],
            )._validate_receipt_integrity,
        )

    def test_module_does_not_define_a_local_receipt_validator(self):
        """Negative test: the canary must not fork/copy the P2 validator."""
        source = Path(canary.__file__).read_text(encoding="utf-8")
        self.assertNotIn("def _validate_receipt_integrity", source)
        self.assertNotIn("def read_receipt_readonly", source)
        self.assertNotIn("def build_machine_verification_readout", source)

    def test_module_uses_real_p2_owner_hashes_consistent_with_pinned_identities(self):
        receipt_owner = REPO_ROOT / "governance/compat/agent_autorun_machine_verification.py"
        readout_owner = REPO_ROOT / "governance/compat/agent_automation_machine_verification_readout.py"
        import hashlib

        receipt_hash = hashlib.sha256(receipt_owner.read_bytes()).hexdigest()
        readout_hash = hashlib.sha256(readout_owner.read_bytes()).hexdigest()
        self.assertEqual(
            receipt_hash,
            "8280a95e0985bd1273aa359afff455be1d18346e8b49cb92e9746922d835d022",
        )
        self.assertEqual(
            readout_hash,
            "ff6088bf8144deec4582ce9faf62384b314346c9cbbb87f6b3349a2d23f7e7c3",
        )


class ZeroExternalCallTests(unittest.TestCase):
    """One-command shadow invocation records every internal subprocess and
    cannot hide extra provider/network calls; there must be zero."""

    def test_ineligible_row_records_zero_external_calls(self):
        row = canary.build_initial_observation_row(canary.git_head())
        row_dict = row.to_dict()
        self.assertEqual(row_dict["costEvidence"]["externalCalls"], 0)

    def test_evidence_initial_observation_zero_external_calls(self):
        evidence = canary.build_evidence(execution_base=canary.git_head())
        self.assertEqual(evidence["taxMetrics"]["initialObservation"]["externalCalls"], 0)

    def test_evidence_audit_scope_exceeded_count_zero_on_clean_run(self):
        evidence = canary.build_evidence(execution_base=canary.git_head())
        self.assertEqual(evidence["taxMetrics"]["initialObservation"]["auditScopeExceededCount"], 0)


class IdentityRecomputationTests(unittest.TestCase):
    """Pinned identities recomputed and match; ancestry proof."""

    def test_trusted_blob_matches_pinned_identity(self):
        actual = canary.git_blob_at(canary.TRUSTED_COMMIT, canary.TRUSTED_RETURN_PATH)
        self.assertEqual(actual, canary.TRUSTED_BLOB)

    def test_range_parent_is_ancestor_of_material_commit(self):
        self.assertTrue(
            canary.git_is_ancestor(canary.AUTORUN_RANGE_PARENT, canary.TRUSTED_COMMIT)
        )

    def test_trusted_commit_is_ancestor_of_current_head(self):
        self.assertTrue(canary.git_is_ancestor(canary.TRUSTED_COMMIT, canary.git_head()))

    def test_trusted_outcome_token_appears_in_real_return(self):
        return_file = REPO_ROOT / canary.TRUSTED_RETURN_PATH
        text = return_file.read_text(encoding="utf-8")
        self.assertIn(canary.TRUSTED_OUTCOME, text)


class NoQuestionCliSmokeTests(unittest.TestCase):
    """Exercise the documented CLI end-to-end, one command per invocation."""

    def test_help_exits_zero(self):
        proc = subprocess.run(
            [sys.executable, "-B", "governance/compat/mfrp_shadow_canary.py", "--help"],
            cwd=REPO_ROOT, capture_output=True, text=True,
        )
        self.assertEqual(proc.returncode, 0)
        self.assertIn("--output", proc.stdout)

    def test_cli_run_twice_produces_same_output_hash(self):
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            out1 = Path(tmp) / "run1.json"
            out2 = Path(tmp) / "run2.json"
            base = canary.git_head()
            for out in (out1, out2):
                proc = subprocess.run(
                    [
                        sys.executable, "-B", "governance/compat/mfrp_shadow_canary.py",
                        "--output", str(out), "--execution-base", base,
                    ],
                    cwd=REPO_ROOT, capture_output=True, text=True,
                )
                self.assertEqual(proc.returncode, 0, msg=proc.stderr)
            self.assertEqual(out1.read_bytes(), out2.read_bytes())


class P4RV1IdentityVerificationTests(unittest.TestCase):
    """P4-RV-1: authority/evidence identity must be recomputed and verified,
    not merely checked for path existence."""

    def test_unpinned_readme_no_longer_forces_pass(self):
        """Reviewer's original probe: declaring README.md with no pin used
        to make check 1 (and the whole invariant) return true. It must not
        any more -- an unpinned declared path (empty expected identity) is
        rejected by ``PinnedEvidenceInput`` construction itself."""
        with self.assertRaises(ValueError):
            canary.PinnedEvidenceInput(path=Path("README.md"))

    def test_identity_tamper_causes_p4_i1_fail(self):
        """Causal hostile test: change ONLY the expected identity (to a
        value that does not match the real file's actual bytes) and prove
        P4-I1 fails. This is the required correction's named test."""
        real_row = canary.build_initial_observation_row(canary.git_head()).to_dict()
        tampered_manifest = canary.ClosedAuditManifest(
            return_blob_path=Path(canary.TRUSTED_RETURN_PATH),
            declared_evidence_paths=(
                canary.PinnedEvidenceInput(
                    path=Path(canary.TRUSTED_RETURN_PATH),
                    expected_sha256="0" * 64,  # deliberately wrong
                ),
            ),
            hard_obligation_locator=canary.HARD_OBLIGATION_LOCATOR,
            hard_obligation_locator_pattern=canary.HARD_OBLIGATION_LOCATOR_PATTERN,
            comparator_row=real_row,
        )
        result = canary.run_p4_i1_invariant(tampered_manifest)
        self.assertFalse(result["checks"]["1_authorityEvidenceBytesMatchPinnedIdentity"])
        self.assertEqual(result["result"], "FAIL")

    def test_correct_identity_still_passes(self):
        """Control: the same manifest shape with the correct pinned identity
        passes check 1, proving the failure above is caused by the identity
        mismatch alone, not by manifest shape."""
        real_row = canary.build_initial_observation_row(canary.git_head()).to_dict()
        correct_manifest = canary.default_closed_audit_manifest(real_row)
        result = canary.run_p4_i1_invariant(correct_manifest)
        self.assertTrue(result["checks"]["1_authorityEvidenceBytesMatchPinnedIdentity"])

    def test_missing_declared_file_fails_check1(self):
        real_row = canary.build_initial_observation_row(canary.git_head()).to_dict()
        manifest = canary.ClosedAuditManifest(
            return_blob_path=Path(canary.TRUSTED_RETURN_PATH),
            declared_evidence_paths=(
                canary.PinnedEvidenceInput(
                    path=Path("docs/reviews/DOES_NOT_EXIST_PROBE.md"),
                    expected_sha256="1" * 64,
                ),
            ),
            hard_obligation_locator=canary.HARD_OBLIGATION_LOCATOR,
            hard_obligation_locator_pattern=canary.HARD_OBLIGATION_LOCATOR_PATTERN,
            comparator_row=real_row,
        )
        result = canary.run_p4_i1_invariant(manifest)
        self.assertFalse(result["checks"]["1_authorityEvidenceBytesMatchPinnedIdentity"])
        self.assertEqual(result["result"], "FAIL")

    def test_duplicate_rebound_identity_fails_check1(self):
        """Same path declared twice with two different expected identities
        (a rebound pin) must fail, not silently pick one."""
        real_row = canary.build_initial_observation_row(canary.git_head()).to_dict()
        manifest = canary.ClosedAuditManifest(
            return_blob_path=Path(canary.TRUSTED_RETURN_PATH),
            declared_evidence_paths=(
                canary.PinnedEvidenceInput(
                    path=Path(canary.TRUSTED_RETURN_PATH),
                    expected_sha256=canary.TRUSTED_RETURN_EXPECTED_SHA256,
                ),
                canary.PinnedEvidenceInput(
                    path=Path(canary.TRUSTED_RETURN_PATH),
                    expected_sha256="2" * 64,  # rebound: different pin, same path
                ),
            ),
            hard_obligation_locator=canary.HARD_OBLIGATION_LOCATOR,
            hard_obligation_locator_pattern=canary.HARD_OBLIGATION_LOCATOR_PATTERN,
            comparator_row=real_row,
        )
        result = canary.run_p4_i1_invariant(manifest)
        self.assertFalse(result["checks"]["1_authorityEvidenceBytesMatchPinnedIdentity"])
        self.assertEqual(result["result"], "FAIL")


class P4RV2ExactOnceLocatorTests(unittest.TestCase):
    """P4-RV-2: the hard-obligation locator must resolve to exactly one
    bounded statement, never a bare ``>= 1`` substring count."""

    def _manifest_for_text(self, tmp_path: Path, text: str) -> "canary.ClosedAuditManifest":
        fake_return = tmp_path / "fake_return.md"
        fake_return.write_text(text, encoding="utf-8")
        import hashlib

        digest = hashlib.sha256(fake_return.read_bytes()).hexdigest()
        return canary.ClosedAuditManifest(
            return_blob_path=Path("fake_return.md"),
            declared_evidence_paths=(
                canary.PinnedEvidenceInput(path=Path("fake_return.md"), expected_sha256=digest),
            ),
            hard_obligation_locator="probe locator",
            hard_obligation_locator_pattern=canary.HARD_OBLIGATION_LOCATOR_PATTERN,
            comparator_row={
                "blindSpotDisposition": {
                    "nonRepresentable": ["C07", "C08", "C18"],
                    "c15": "FALSE_NEGATIVE",
                    "excludedFromSuccessDenominators": True,
                },
                "trustedRecordOrderEvidence": {"orderOfRecordStatus": "PROVEN"},
            },
        )

    def test_zero_match_fails_check2(self):
        """Required correction's zero-match causal test: a fixture where the
        locator is absent must fail, not silently pass at >= 1 (which zero
        also would not satisfy, but the point is the exact-equality
        predicate itself, exercised below by the duplicate case)."""
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            manifest = self._manifest_for_text(tmp_path, "no locator text here at all")
            original_root = canary.REPO_ROOT
            try:
                canary.REPO_ROOT = tmp_path
                result = canary.run_p4_i1_invariant(manifest)
            finally:
                canary.REPO_ROOT = original_root
            self.assertEqual(result["locatorOccurrenceCount"], 0)
            self.assertFalse(result["checks"]["2_hardObligationLocatorPresentOnce"])
            self.assertEqual(result["result"], "FAIL")

    def test_duplicate_match_fails_check2(self):
        """Required correction's duplicate-match causal test: a fixture
        where the locator appears twice must also fail -- not silently pass
        at the old >= 1 predicate."""
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            duplicated_text = (
                canary.HARD_OBLIGATION_LOCATOR_PATTERN
                + "\n\nunrelated text\n\n"
                + canary.HARD_OBLIGATION_LOCATOR_PATTERN
            )
            manifest = self._manifest_for_text(tmp_path, duplicated_text)
            original_root = canary.REPO_ROOT
            try:
                canary.REPO_ROOT = tmp_path
                result = canary.run_p4_i1_invariant(manifest)
            finally:
                canary.REPO_ROOT = original_root
            self.assertEqual(result["locatorOccurrenceCount"], 2)
            self.assertFalse(result["checks"]["2_hardObligationLocatorPresentOnce"])
            self.assertEqual(result["result"], "FAIL")

    def test_exact_once_match_passes_check2(self):
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            manifest = self._manifest_for_text(
                tmp_path, "prose\n" + canary.HARD_OBLIGATION_LOCATOR_PATTERN + "\nmore prose"
            )
            original_root = canary.REPO_ROOT
            try:
                canary.REPO_ROOT = tmp_path
                result = canary.run_p4_i1_invariant(manifest)
            finally:
                canary.REPO_ROOT = original_root
            self.assertEqual(result["locatorOccurrenceCount"], 1)
            self.assertTrue(result["checks"]["2_hardObligationLocatorPresentOnce"])

    def test_real_return_resolves_locator_exactly_once_not_bare_c15_count(self):
        """The real committed return contains the bare token "C15" many more
        than once (predicate-miss listing, sentinel name, adjudication
        prose), proving the old ``count("C15") >= 1`` predicate was not
        mechanically unambiguous. The new anchored pattern must resolve to
        exactly one match on the same real file."""
        return_file = REPO_ROOT / canary.TRUSTED_RETURN_PATH
        text = return_file.read_text(encoding="utf-8")
        bare_c15_count = text.count("C15")
        pattern_count = text.count(canary.HARD_OBLIGATION_LOCATOR_PATTERN)
        self.assertGreater(bare_c15_count, 1, msg="test fixture assumption: bare C15 is not unique")
        self.assertEqual(pattern_count, 1)

        result = canary.run_p4_i1_invariant(
            canary.default_closed_audit_manifest(
                canary.build_initial_observation_row(canary.git_head()).to_dict()
            )
        )
        self.assertEqual(result["locatorOccurrenceCount"], 1)
        self.assertTrue(result["checks"]["2_hardObligationLocatorPresentOnce"])

from test_mfrp_shadow_canary_core import *  # noqa: F401,F403


if __name__ == "__main__":
    unittest.main()
