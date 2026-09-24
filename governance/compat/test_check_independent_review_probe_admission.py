#!/usr/bin/env python3
"""Focused tests for the independent review probe admission checker."""

from __future__ import annotations

import hashlib
import importlib.util
import io
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

_COMPAT_DIR = Path(__file__).resolve().parent
if str(_COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(_COMPAT_DIR))

_MODULE_PATH = _COMPAT_DIR / "check_independent_review_probe_admission.py"
_SPEC = importlib.util.spec_from_file_location(
    "check_independent_review_probe_admission", _MODULE_PATH
)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {_MODULE_PATH}")
chk = importlib.util.module_from_spec(_SPEC)
sys.modules[_SPEC.name] = chk
_SPEC.loader.exec_module(chk)


def _doc(*field_lines: str) -> str:
    """Join document-fragment lines with the blank-line separator this
    repository's governed templates use between metadata fields/sections."""
    return "\n\n".join(field_lines) + "\n"


class _TempRepoTestCase(unittest.TestCase):
    """Base class providing a real temporary repository root, so link
    resolution and evidence-binding fixtures exercise real filesystem reads
    and real byte-level SHA-256 recomputation, not only direct function
    strings or hardcoded digests."""

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self._orig_repo_root = chk.REPO_ROOT
        chk.REPO_ROOT = Path(self._tmp.name)
        self.addCleanup(self._restore_repo_root)
        (chk.REPO_ROOT / "docs" / "work_orders" / "archive").mkdir(parents=True)
        (chk.REPO_ROOT / "docs" / "reviews").mkdir(parents=True)
        (chk.REPO_ROOT / "governance" / "compat").mkdir(parents=True)

    def _restore_repo_root(self):
        chk.REPO_ROOT = self._orig_repo_root

    def _write(self, relative_path: str, content: str) -> str:
        full = chk.REPO_ROOT / relative_path
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_text(content, encoding="utf-8")
        return relative_path

    def _write_evidence(self, relative_path: str, content: str) -> tuple[str, str]:
        """Write a fixture evidence file and return `(path, sha256)` computed
        from the exact bytes written (read back from disk, since text-mode
        writes may translate line endings on some platforms), so
        `bind_evidence` always succeeds against genuinely matching content.
        """
        self._write(relative_path, content)
        full = chk.REPO_ROOT / relative_path
        digest = hashlib.sha256(full.read_bytes()).hexdigest()
        return relative_path, digest


# --- Dispatch-time fixtures ---------------------------------------------------

_WORK_ORDER_HEADER = "# Work Order\n\ndocType: work_order\n\n"

_VALID_CONTRACT_FIELDS = (
    "## Independent Review Probe Admission Contract",
    "independentProbeRiskClass: HIGH",
    "independentProbeDispositionAtDispatch: PLAN_ADMITTED_PENDING_REVIEWER_EXECUTION",
    "probeExecutorRole: LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER",
    "implementationOracleSeparation: REQUIRED_DIFFERENT_EXECUTION_AND_ASSERTION_PATH",
    "positiveControl: one known-valid packet remains admissible",
    "negativeMutationClasses: worker-self-attestation",
    "expectedInformationGain: distinguish independent evidence from corroboration",
    "rerunCostReason: focused fixtures beat broad duplicate reruns",
    "reviewerDecisionOwner: LOCAL",
)

_VALID_DISPATCH_PLAN = _doc("# Work Order", "docType: work_order", "independentProbeRequired: YES", *_VALID_CONTRACT_FIELDS)
_NA_DISPATCH_PLAN = _doc("# Work Order", "docType: work_order", "independentProbeRequired: NOT_APPLICABLE_WITH_REASON: low-risk documentation edit")
_YES_WITHOUT_BLOCK = _WORK_ORDER_HEADER + "independentProbeRequired: YES\n"
_YES_WITH_INCOMPLETE_BLOCK = _doc(
    "# Work Order", "docType: work_order", "independentProbeRequired: YES",
    "## Independent Review Probe Admission Contract", "independentProbeRiskClass: HIGH",
    "probeExecutorRole: LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER", "reviewerDecisionOwner: LOCAL",
)
_YES_WITH_WORKER_AS_PROBE_ROLE = _doc(
    "# Work Order", "docType: work_order", "independentProbeRequired: YES",
    *[f.replace("LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER", "IMPLEMENTATION_WORKER_ONLY") for f in _VALID_CONTRACT_FIELDS],
)
_LOW_RISK_NO_TOKEN = "# Work Order\n\ndocType: work_order\n\nordinary doc edit.\n"
_BACKTICK_QUOTED_MENTION = _doc(
    "# Reference", "docType: reference", "This standard requires `independentProbeRequired` on high-risk work."
)
_OMITTED_FIELD_HIGH_RISK = _doc(
    "# Work Order", "docType: work_order",
    "## Core Guard Self-Protection Authorization", "Protected path: governance/compat/check_something.py",
)
_NA_WITH_CORE_GUARD_MARKER_REJECTED = _doc(
    "# Work Order", "docType: work_order",
    "independentProbeRequired: NOT_APPLICABLE_WITH_REASON: routine change",
    "## Core Guard Self-Protection Authorization", "Protected path: governance/compat/check_something.py",
)
_NA_WITH_PROVIDER_GRANTED_REJECTED = _doc(
    "# Work Order", "docType: work_order",
    "independentProbeRequired: NOT_APPLICABLE_WITH_REASON: routine change", "providerExecutionAuthority: GRANTED",
)
_NA_WITH_PROVIDER_FORBIDDEN_ACCEPTED = _doc(
    "# Work Order", "docType: work_order",
    "independentProbeRequired: NOT_APPLICABLE_WITH_REASON: routine change", "providerExecutionAuthority: FORBIDDEN",
)
_NA_WITH_CANONICALIZATION_MARKER_REJECTED = _doc(
    "# Work Order", "docType: work_order",
    "independentProbeRequired: NOT_APPLICABLE_WITH_REASON: routine change",
    "This touches the canonicalization preimage builder.",
)
_NA_WITH_PARTY_A_MARKER_REJECTED = _doc(
    "# Work Order", "docType: work_order",
    "independentProbeRequired: NOT_APPLICABLE_WITH_REASON: routine change",
    "Party A key ceremony metadata is referenced.",
)
_NA_BARE_REASON_REJECTED = _doc("# Work Order", "docType: work_order", "independentProbeRequired: NOT_APPLICABLE_WITH_REASON")
_DUPLICATE_FIELD_YES_HIDDEN = _doc(
    "# Work Order", "docType: work_order",
    "independentProbeRequired: NOT_APPLICABLE_WITH_REASON: initial framing", "independentProbeRequired: YES",
    *_VALID_CONTRACT_FIELDS,
)
_DUPLICATE_SAME_VALUE_DISPATCH_FIELD = _VALID_DISPATCH_PLAN + "\nindependentProbeRiskClass: HIGH\n"


class DispatchEligibilityTests(unittest.TestCase):
    def test_any_active_work_order_is_applicable(self):
        self.assertTrue(chk.is_work_order_applicable("docs/work_orders/x.md", _LOW_RISK_NO_TOKEN))

    def test_yes_plan_is_applicable(self):
        self.assertTrue(chk.is_work_order_applicable("docs/work_orders/x.md", _VALID_DISPATCH_PLAN))

    def test_non_work_order_path_not_applicable(self):
        self.assertFalse(chk.is_work_order_applicable("docs/reviews/x.md", _VALID_DISPATCH_PLAN))

    def test_archive_path_not_applicable(self):
        self.assertFalse(chk.is_work_order_applicable("docs/work_orders/archive/x.md", _VALID_DISPATCH_PLAN))

    def test_backtick_quoted_mention_in_reference_not_applicable(self):
        self.assertFalse(chk.is_work_order_applicable("docs/reference/x.md", _BACKTICK_QUOTED_MENTION))

    def test_non_work_order_doctype_not_applicable(self):
        self.assertFalse(chk.is_work_order_applicable("docs/work_orders/x.md", "# X\n\ndocType: reference\n"))


class DispatchDiagnoseTests(unittest.TestCase):
    def test_valid_plan_is_clean(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _VALID_DISPATCH_PLAN)
        self.assertTrue(d.applicable)
        self.assertTrue(d.is_clean, d.issues)

    def test_na_reason_is_clean(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _NA_DISPATCH_PLAN)
        self.assertTrue(d.is_clean, d.issues)

    def test_yes_without_block_flagged(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _YES_WITHOUT_BLOCK)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("missing" in i and "Contract" in i for i in d.issues))

    def test_yes_with_incomplete_block_flagged(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _YES_WITH_INCOMPLETE_BLOCK)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("dispatch plan field" in i for i in d.issues))

    def test_worker_as_probe_role_rejected(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _YES_WITH_WORKER_AS_PROBE_ROLE)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("probeExecutorRole" in i and "non-worker" in i for i in d.issues))

    def test_bad_required_token_rejected(self):
        text = _WORK_ORDER_HEADER + "independentProbeRequired: MAYBE\n"
        d = chk.diagnose_dispatch("docs/work_orders/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("independentProbeRequired" in i for i in d.issues))

    def test_omitted_field_on_high_risk_packet_rejected(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _OMITTED_FIELD_HIGH_RISK)
        self.assertTrue(d.applicable)
        self.assertFalse(d.is_clean)

    def test_na_with_core_guard_marker_rejected(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _NA_WITH_CORE_GUARD_MARKER_REJECTED)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("high-risk marker" in i for i in d.issues))

    def test_na_with_provider_execution_granted_rejected(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _NA_WITH_PROVIDER_GRANTED_REJECTED)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("high-risk marker" in i for i in d.issues))

    def test_na_with_provider_execution_forbidden_accepted(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _NA_WITH_PROVIDER_FORBIDDEN_ACCEPTED)
        self.assertTrue(d.is_clean, d.issues)

    def test_na_with_canonicalization_marker_rejected(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _NA_WITH_CANONICALIZATION_MARKER_REJECTED)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("high-risk marker" in i for i in d.issues))

    def test_na_with_party_a_marker_rejected(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _NA_WITH_PARTY_A_MARKER_REJECTED)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("high-risk marker" in i for i in d.issues))

    def test_na_without_marker_still_accepted(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _NA_DISPATCH_PLAN)
        self.assertTrue(d.is_clean, d.issues)

    def test_na_bare_reason_rejected(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _NA_BARE_REASON_REJECTED)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("non-empty reason" in i for i in d.issues))

    def test_duplicate_field_hiding_yes_rejected(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _DUPLICATE_FIELD_YES_HIDDEN)
        self.assertFalse(d.is_clean)

    def test_duplicate_dispatch_field_rejected(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _DUPLICATE_SAME_VALUE_DISPATCH_FIELD)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("independentProbeRiskClass" in i for i in d.issues))


# --- Closure-time fixtures -----------------------------------------------------

_PASS_ROLE_ACTOR_FIELDS = (
    "probeExecutorRole: LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER",
    "implementationWorkerActor: shared-workspace INTERNAL_AGENT worker",
)

_PENDING_NON_TERMINAL = _doc("# Worker Return", "Status: COMPLETE_PENDING_REVIEW", "independentProbeDisposition: PENDING_REVIEWER_EXECUTION")
_PENDING_AT_CLOSURE_REJECTED = _doc("# Review", "Status: CLOSED_PASS_BOUNDED", "independentProbeDisposition: PENDING_REVIEWER_EXECUTION")
_PASS_WORKER_SELF_ATTESTATION = _doc(
    "# Review", "Status: CLOSED_PASS_BOUNDED", "independentProbeDisposition: PASS_INDEPENDENT_PROBE",
    "probeExecutorRole: IMPLEMENTATION_WORKER_ONLY", "implementationWorkerActor: shared-workspace INTERNAL_AGENT worker",
    "probeExecutorActor: IMPLEMENTATION_WORKER_ONLY", "probeCommandOrMethod: python -m pytest tests/",
    "probeObservedResult: all tests passed", "oracleSeparationBasis: the worker's own suite already covers this case",
    "workerInvocationId: worker-run-001", "probeInvocationId: reviewer-probe-002",
)
_PASS_SAME_ORACLE_CORROBORATION = _doc(
    "# Review", "Status: CLOSED_PASS_BOUNDED", "independentProbeDisposition: PASS_INDEPENDENT_PROBE",
    *_PASS_ROLE_ACTOR_FIELDS, "probeExecutorActor: Local reviewer/closer",
    "probeCommandOrMethod: python -m pytest tests/test_writer.py", "workerTestCommand: python -m pytest tests/test_writer.py",
    "probeObservedResult: all tests passed", "oracleSeparationBasis: reproduced the worker's own suite",
    "workerInvocationId: worker-run-001", "probeInvocationId: reviewer-probe-002",
)
_PASS_SAME_ORACLE_NORMALIZED_MATCH = _doc(
    "# Review", "Status: CLOSED_PASS_BOUNDED", "independentProbeDisposition: PASS_INDEPENDENT_PROBE",
    *_PASS_ROLE_ACTOR_FIELDS, "probeExecutorActor: Local reviewer/closer",
    "probeCommandOrMethod:   PYTHON   -m   PYTEST   tests\\test_writer.py",
    "workerTestCommand: python -m pytest tests/test_writer.py", "probeObservedResult: all tests passed",
    "oracleSeparationBasis: an independently authored adversarial check",
    "workerInvocationId: worker-run-001", "probeInvocationId: reviewer-probe-002",
)
_PASS_IDENTICAL_INVOCATION_IDS = _doc(
    "# Review", "Status: CLOSED_PASS_BOUNDED", "independentProbeDisposition: PASS_INDEPENDENT_PROBE",
    *_PASS_ROLE_ACTOR_FIELDS, "probeExecutorActor: Claude", "probeCommandOrMethod: manual adversarial probe",
    "probeObservedResult: rejected as expected", "oracleSeparationBasis: an independently authored adversarial check",
    "workerInvocationId: same-session-001", "probeInvocationId: same-session-001",
)
_BAD_TOKEN_DISPOSITION = _doc("# Review", "Status: COMPLETE_PENDING_REVIEW", "independentProbeDisposition: LOOKS_GOOD_TO_ME")
_BLOCKED_WITH_REASON_NON_TERMINAL = _doc("# Worker Return", "Status: BLOCKED_WITH_REASON", "independentProbeDisposition: BLOCKED_INDEPENDENT_PROBE_WITH_REASON: reviewer unavailable")
_BLOCKED_BARE_REASON_REJECTED = _doc("# Worker Return", "Status: BLOCKED_WITH_REASON", "independentProbeDisposition: BLOCKED_INDEPENDENT_PROBE_WITH_REASON")
_BLOCKED_AT_CLOSURE_REJECTED = _doc("# Review", "Status: CLOSED_PASS_BOUNDED", "independentProbeDisposition: BLOCKED_INDEPENDENT_PROBE_WITH_REASON: reviewer unavailable")
_NO_DISPOSITION_FIELD = "# Review\n\nStatus: CLOSED_PASS_BOUNDED\n\nordinary content.\n"
_DUPLICATE_DISPOSITION_FIELD = _doc("# Review", "Status: CLOSED_PASS_BOUNDED", "independentProbeDisposition: PENDING_REVIEWER_EXECUTION", "independentProbeDisposition: PASS_INDEPENDENT_PROBE")
_STATUS_SHADOWED_BY_HISTORICAL_SECTION = _doc(
    "# Review", "Status: CLOSED_PASS_BOUNDED", "independentProbeDisposition: PENDING_REVIEWER_EXECUTION",
    "## Historical R1 Return Content (Superseded)",
    "The prior submission recorded Status: COMPLETE_PENDING_REVIEW before this document was finalized.",
)


class ClosureEligibilityTests(unittest.TestCase):
    def test_disposition_field_present_is_applicable(self):
        self.assertTrue(chk.is_review_applicable("docs/reviews/x.md", _PENDING_NON_TERMINAL))

    def test_no_disposition_field_not_applicable(self):
        self.assertFalse(chk.is_review_applicable("docs/reviews/x.md", _NO_DISPOSITION_FIELD))

    def test_archive_path_not_applicable(self):
        self.assertFalse(chk.is_review_applicable("docs/reviews/archive/x.md", _PENDING_NON_TERMINAL))


class ClosureDiagnoseTests(unittest.TestCase):
    def test_pending_on_non_terminal_status_is_clean(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _PENDING_NON_TERMINAL)
        self.assertTrue(d.applicable)
        self.assertTrue(d.is_clean, d.issues)

    def test_pending_at_closure_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _PENDING_AT_CLOSURE_REJECTED)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("cannot accompany a terminal" in i for i in d.issues))

    def test_blocked_on_non_terminal_status_is_clean(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _BLOCKED_WITH_REASON_NON_TERMINAL)
        self.assertTrue(d.is_clean, d.issues)

    def test_blocked_bare_reason_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _BLOCKED_BARE_REASON_REJECTED)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("non-empty reason" in i for i in d.issues))

    def test_blocked_at_closure_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _BLOCKED_AT_CLOSURE_REJECTED)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("cannot accompany a terminal" in i for i in d.issues))

    def test_pass_worker_self_attestation_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _PASS_WORKER_SELF_ATTESTATION)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("probeExecutorRole" in i and "exact controlled token" in i for i in d.issues))

    def test_pass_same_oracle_corroboration_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _PASS_SAME_ORACLE_CORROBORATION)
        self.assertFalse(d.is_clean)

    def test_bad_token_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _BAD_TOKEN_DISPOSITION)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("must be one of" in i for i in d.issues))

    def test_backtick_wrapped_instructional_mention_not_read_as_declaration(self):
        text = (
            "# Work Order\n\nStatus: COMPLETE_PENDING_REVIEW\n\n"
            "Conditional blocks must use `N/A with reason` when truly "
            "inapplicable. Record `independentProbeDisposition: "
            "PENDING_REVIEWER_EXECUTION`; the worker must not forge or "
            "pre-fill a reviewer PASS.\n"
        )
        self.assertFalse(chk.is_review_applicable("docs/work_orders/x.md", text))

    def test_work_order_with_disposition_field_also_eligible(self):
        text = "# Work Order\n\nStatus: CLOSED_PASS_BOUNDED\n\n" + (
            "independentProbeDisposition: PENDING_REVIEWER_EXECUTION\n"
        )
        d = chk.diagnose_closure("docs/work_orders/x.md", text)
        self.assertTrue(d.applicable)
        self.assertFalse(d.is_clean)

    def test_status_not_shadowed_by_historical_section(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _STATUS_SHADOWED_BY_HISTORICAL_SECTION)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("cannot accompany a terminal" in i for i in d.issues))

    def test_pass_same_oracle_normalized_fingerprint_match_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _PASS_SAME_ORACLE_NORMALIZED_MATCH)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("normalizes to the same fingerprint" in i for i in d.issues))

    def test_pass_identical_invocation_ids_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _PASS_IDENTICAL_INVOCATION_IDS)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("must be distinct" in i for i in d.issues))

    def test_provider_name_alone_does_not_satisfy_or_defeat_separation(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _PASS_IDENTICAL_INVOCATION_IDS)
        self.assertFalse(any("probeExecutorActor" in i and "non-worker" in i for i in d.issues))

    def test_duplicate_disposition_field_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _DUPLICATE_DISPOSITION_FIELD)
        self.assertFalse(d.is_clean)


class NonApplicableUnaffectedTests(unittest.TestCase):
    def test_unrelated_reference_doc_not_flagged(self):
        d = chk.diagnose_dispatch("docs/reference/x.md", _BACKTICK_QUOTED_MENTION)
        self.assertFalse(d.applicable)
        d2 = chk.diagnose_closure("docs/reference/x.md", _BACKTICK_QUOTED_MENTION)
        self.assertFalse(d2.applicable)


# =============================================================================
# Link resolution and evidence-binding tests (real temp-repository fixtures)
# =============================================================================

_HIGH_RISK_YES_WORK_ORDER = _doc("# Work Order", "docType: work_order", "independentProbeRequired: YES", *_VALID_CONTRACT_FIELDS)
_NA_LOW_RISK_WORK_ORDER = _doc("# Work Order", "docType: work_order", "independentProbeRequired: NOT_APPLICABLE_WITH_REASON: routine documentation edit")


class LinkedClosureApplicabilityTests(_TempRepoTestCase):
    def test_linked_terminal_review_omitting_disposition_rejected(self):
        self._write("docs/work_orders/wo.md", _HIGH_RISK_YES_WORK_ORDER)
        review_text = _doc(
            "# Review", "Status: CLOSED_PASS_BOUNDED",
            "Responds to work order: `docs/work_orders/wo.md`",
            "ordinary closure content with no disposition field.",
        )
        d = chk.diagnose_closure("docs/reviews/r.md", review_text)
        self.assertTrue(d.applicable)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("omits required field" in i for i in d.issues))

    def test_linked_review_to_na_work_order_not_forced_applicable_by_reference_alone(self):
        self._write("docs/work_orders/wo.md", _NA_LOW_RISK_WORK_ORDER)
        review_text = _doc(
            "# Review", "Status: CLOSED_PASS_BOUNDED",
            "Responds to work order: `docs/work_orders/wo.md`",
            "ordinary closure content with no disposition field.",
        )
        d = chk.diagnose_closure("docs/reviews/r.md", review_text)
        self.assertTrue(d.applicable)
        self.assertFalse(any("omits required field" in i for i in d.issues))

    def test_missing_referenced_work_order_fails_closed(self):
        review_text = _doc(
            "# Review", "Status: CLOSED_PASS_BOUNDED",
            "Responds to work order: `docs/work_orders/does_not_exist.md`",
            "independentProbeDisposition: PASS_INDEPENDENT_PROBE",
        )
        d = chk.diagnose_closure("docs/reviews/r.md", review_text)
        self.assertTrue(d.applicable)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("does not exist" in i for i in d.issues))

    def test_archived_referenced_work_order_fails_closed(self):
        self._write("docs/work_orders/archive/wo.md", _HIGH_RISK_YES_WORK_ORDER)
        review_text = _doc(
            "# Review", "Status: CLOSED_PASS_BOUNDED",
            "Responds to work order: `docs/work_orders/archive/wo.md`",
            "independentProbeDisposition: PASS_INDEPENDENT_PROBE",
        )
        d = chk.diagnose_closure("docs/reviews/r.md", review_text)
        self.assertTrue(d.applicable)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("archived path" in i for i in d.issues))

    def test_traversal_referenced_work_order_fails_closed(self):
        review_text = _doc(
            "# Review", "Status: CLOSED_PASS_BOUNDED",
            "Responds to work order: `docs/work_orders/../../secrets/x.md`",
            "independentProbeDisposition: PASS_INDEPENDENT_PROBE",
        )
        d = chk.diagnose_closure("docs/reviews/r.md", review_text)
        self.assertTrue(d.applicable)
        self.assertFalse(d.is_clean)

    def test_ambiguous_referenced_work_order_fails_closed(self):
        self._write("docs/work_orders/wo1.md", _HIGH_RISK_YES_WORK_ORDER)
        self._write("docs/work_orders/wo2.md", _HIGH_RISK_YES_WORK_ORDER)
        review_text = _doc(
            "# Review", "Status: CLOSED_PASS_BOUNDED",
            "dispatchWorkOrder: `docs/work_orders/wo1.md`",
            "Responds to work order: `docs/work_orders/wo2.md`",
            "independentProbeDisposition: PASS_INDEPENDENT_PROBE",
        )
        d = chk.diagnose_closure("docs/reviews/r.md", review_text)
        self.assertTrue(d.applicable)
        self.assertFalse(d.is_clean)

    def test_valid_linked_terminal_pass_with_distinct_bindings_accepted(self):
        self._write("docs/work_orders/wo.md", _HIGH_RISK_YES_WORK_ORDER)
        pending_return = _doc(
            "# Worker Return", "Status: COMPLETE_PENDING_REVIEW",
            "Responds to work order: `docs/work_orders/wo.md`",
            "independentProbeDisposition: PENDING_REVIEWER_EXECUTION",
        )
        d_pending = chk.diagnose_closure("docs/reviews/return.md", pending_return)
        self.assertTrue(d_pending.is_clean, d_pending.issues)

        worker_ref, worker_digest = self._write_evidence("governance/compat/worker_evidence.py", "worker evidence bytes\n")
        probe_ref, probe_digest = self._write_evidence("docs/reviews/probe_evidence.md", "probe evidence bytes\n")
        terminal_pass = _doc(
            "# Review", "Status: CLOSED_PASS_BOUNDED",
            "Responds to work order: `docs/work_orders/wo.md`",
            "independentProbeDisposition: PASS_INDEPENDENT_PROBE",
            "probeExecutorRole: LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER",
            "implementationWorkerActor: shared-workspace INTERNAL_AGENT worker",
            "probeExecutorActor: Local reviewer/closer",
            "probeCommandOrMethod: manual adversarial probe",
            "probeObservedResult: rejected as expected",
            "oracleSeparationBasis: an independently authored adversarial check",
            "workerInvocationId: worker-001", "probeInvocationId: reviewer-002",
            f"workerOracleSha256: {worker_digest}", f"probeOracleSha256: {probe_digest}",
            f"workerEvidenceRef: {worker_ref}", f"probeEvidenceRef: {probe_ref}",
        )
        d_pass = chk.diagnose_closure("docs/reviews/pass.md", terminal_pass)
        self.assertTrue(d_pass.is_clean, d_pass.issues)


# --- Status authority and evidence-binding tests ----------------------------

class StatusDispositionSymmetryTests(_TempRepoTestCase):
    def _pass_fields(self, status: str | None) -> list[str]:
        worker_ref, worker_digest = self._write_evidence("governance/compat/worker_evidence.py", "w\n")
        probe_ref, probe_digest = self._write_evidence("docs/reviews/probe_evidence.md", "p\n")
        lines = ["# Review"]
        if status is not None:
            lines.append(f"Status: {status}")
        lines += [
            "independentProbeDisposition: PASS_INDEPENDENT_PROBE",
            "probeExecutorRole: LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER",
            "implementationWorkerActor: shared-workspace INTERNAL_AGENT worker",
            "probeExecutorActor: Local reviewer/closer",
            "probeCommandOrMethod: manual probe",
            "probeObservedResult: rejected as expected",
            "oracleSeparationBasis: an independently authored adversarial check",
            "workerInvocationId: worker-001", "probeInvocationId: reviewer-002",
            f"workerOracleSha256: {worker_digest}", f"probeOracleSha256: {probe_digest}",
            f"workerEvidenceRef: {worker_ref}", f"probeEvidenceRef: {probe_ref}",
        ]
        return lines

    def test_pass_on_complete_pending_review_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _doc(*self._pass_fields("COMPLETE_PENDING_REVIEW")))
        self.assertFalse(d.is_clean)
        self.assertTrue(any("requires a terminal" in i for i in d.issues))

    def test_pass_with_no_status_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _doc(*self._pass_fields(None)))
        self.assertFalse(d.is_clean)
        self.assertTrue(any("metadata-preamble" in i for i in d.issues))

    def test_duplicate_identical_preamble_status_rejected(self):
        lines = self._pass_fields("CLOSED_PASS_BOUNDED")
        lines.insert(1, "Status: CLOSED_PASS_BOUNDED")
        d = chk.diagnose_closure("docs/reviews/x.md", _doc(*lines))
        self.assertFalse(d.is_clean)
        self.assertTrue(any("metadata-preamble" in i for i in d.issues))

    def test_valid_pass_at_closure_is_clean(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _doc(*self._pass_fields("CLOSED_PASS_BOUNDED")))
        self.assertTrue(d.is_clean, d.issues)


class OracleEvidenceBindingTests(_TempRepoTestCase):
    def _base_fields(self) -> list[str]:
        return [
            "# Review", "Status: CLOSED_PASS_BOUNDED",
            "independentProbeDisposition: PASS_INDEPENDENT_PROBE",
            "probeExecutorRole: LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER",
            "implementationWorkerActor: shared-workspace INTERNAL_AGENT worker",
            "probeExecutorActor: Local reviewer/closer",
            "probeCommandOrMethod: manual probe",
            "probeObservedResult: rejected as expected",
            "oracleSeparationBasis: an independently authored adversarial check",
            "workerInvocationId: worker-001", "probeInvocationId: reviewer-002",
        ]

    def test_pass_missing_oracle_and_evidence_fields_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _doc(*self._base_fields()))
        self.assertFalse(d.is_clean)
        for field_name in ("workerOracleSha256", "probeOracleSha256", "workerEvidenceRef", "probeEvidenceRef"):
            self.assertTrue(any(field_name in i for i in d.issues), f"{field_name} missing from {d.issues}")

    def test_hostile_oracle_evidence_bindings_each_rejected(self):
        worker_same_ref, same_digest = self._write_evidence("governance/compat/e1.py", "same\n")
        probe_same_ref, _ = self._write_evidence("docs/reviews/e2.md", "same\n")
        worker_ref, worker_digest = self._write_evidence("governance/compat/w.py", "w\n")
        probe_ref, probe_digest = self._write_evidence("docs/reviews/p.md", "p\n")
        cases = {
            "equal_digests": (
                [f"workerOracleSha256: {same_digest}", f"probeOracleSha256: {same_digest}",
                 f"workerEvidenceRef: {worker_same_ref}", f"probeEvidenceRef: {probe_same_ref}"],
                "must be distinct",
            ),
            "equal_evidence_refs": (
                [f"workerOracleSha256: {worker_digest}", f"probeOracleSha256: {worker_digest[::-1].zfill(64)[:64]}",
                 f"workerEvidenceRef: {worker_ref}", f"probeEvidenceRef: {worker_ref}"],
                "must be distinct",
            ),
            "uppercase_digest": (
                [f"workerOracleSha256: {worker_digest.upper()}", f"probeOracleSha256: {probe_digest}",
                 f"workerEvidenceRef: {worker_ref}", f"probeEvidenceRef: {probe_ref}"],
                "canonical lowercase 64-hex",
            ),
            "short_digest": (
                ["workerOracleSha256: abc123", f"probeOracleSha256: {probe_digest}",
                 f"workerEvidenceRef: {worker_ref}", f"probeEvidenceRef: {probe_ref}"],
                "canonical lowercase 64-hex",
            ),
            "traversal_ref": (
                ["workerOracleSha256: " + ("5" * 64), f"probeOracleSha256: {probe_digest}",
                 "workerEvidenceRef: ../../etc/passwd", f"probeEvidenceRef: {probe_ref}"],
                "traversal",
            ),
            "digest_mismatch": (
                ["workerOracleSha256: " + ("5" * 64), f"probeOracleSha256: {probe_digest}",
                 f"workerEvidenceRef: {worker_ref}", f"probeEvidenceRef: {probe_ref}"],
                "does not match recomputed digest",
            ),
            "missing_file": (
                ["workerOracleSha256: " + ("5" * 64), f"probeOracleSha256: {probe_digest}",
                 "workerEvidenceRef: governance/compat/does_not_exist.py", f"probeEvidenceRef: {probe_ref}"],
                "does not exist",
            ),
        }
        for name, (extra_lines, expected_substring) in cases.items():
            with self.subTest(case=name):
                d = chk.diagnose_closure("docs/reviews/x.md", _doc(*self._base_fields(), *extra_lines))
                self.assertFalse(d.is_clean)
                self.assertTrue(any(expected_substring in i for i in d.issues), d.issues)


# --- Section scope, cardinality and token grammar ----------------------------

_NA_SUFFIX_TOKEN_REJECTED = _doc(
    "# Work Order", "docType: work_order", "independentProbeRequired: NOT_APPLICABLE_WITH_REASONX",
)
_BLOCKED_SUFFIX_TOKEN_REJECTED = _doc(
    "# Review", "Status: BLOCKED_WITH_REASON",
    "independentProbeDisposition: BLOCKED_INDEPENDENT_PROBE_WITH_REASONX",
)
_EMPTY_DUPLICATE_PROBE_REQUIRED = _doc(
    "# Work Order", "docType: work_order", "independentProbeRequired:", "independentProbeRequired: YES",
    *_VALID_CONTRACT_FIELDS,
)
_SECOND_CONTRACT_SECTION_REJECTED = (
    _VALID_DISPATCH_PLAN + "\n## Independent Review Probe Admission Contract\n\n" + "independentProbeRiskClass: LOW\n"
)
_DISPATCH_FIELD_FROM_OUTSIDE_SECTION = _doc(
    "# Work Order", "docType: work_order", "independentProbeRequired: YES", "independentProbeRiskClass: HIGH",
    *_VALID_CONTRACT_FIELDS[:1], *_VALID_CONTRACT_FIELDS[2:],
)
_MALICIOUS_COMPOSITE_ROLE_REJECTED = _VALID_DISPATCH_PLAN.replace(
    "probeExecutorRole: LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER",
    "probeExecutorRole: IMPLEMENTATION_WORKER_ALSO_NOT_IMPLEMENTATION_WORKER",
)
_MALICIOUS_OWNER_TOKEN_REJECTED = _VALID_DISPATCH_PLAN.replace(
    "reviewerDecisionOwner: LOCAL", "reviewerDecisionOwner: LOCAL_OR_ANYONE_AVAILABLE",
)


class SectionScopeAndGrammarTests(unittest.TestCase):
    def test_na_suffix_token_rejected(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _NA_SUFFIX_TOKEN_REJECTED)
        self.assertFalse(d.is_clean)

    def test_blocked_suffix_token_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", _BLOCKED_SUFFIX_TOKEN_REJECTED)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("must be one of" in i for i in d.issues))

    def test_empty_duplicate_probe_required_rejected(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _EMPTY_DUPLICATE_PROBE_REQUIRED)
        self.assertFalse(d.is_clean)

    def test_second_contract_section_rejected(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _SECOND_CONTRACT_SECTION_REJECTED)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("heading" in i and "exactly once" in i for i in d.issues))

    def test_dispatch_field_outside_contract_section_not_read(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _DISPATCH_FIELD_FROM_OUTSIDE_SECTION)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("independentProbeRiskClass" in i for i in d.issues))

    def test_malicious_composite_role_string_rejected(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _MALICIOUS_COMPOSITE_ROLE_REJECTED)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("probeExecutorRole" in i and "exact controlled token" in i for i in d.issues))

    def test_malicious_owner_token_rejected(self):
        d = chk.diagnose_dispatch("docs/work_orders/x.md", _MALICIOUS_OWNER_TOKEN_REJECTED)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("reviewerDecisionOwner" in i and "exact controlled token" in i for i in d.issues))


# =============================================================================
# RIPA-ROOT-01..05: Local's five independent counterexamples, plus their
# parameterized equivalence classes (delimiter length/char, case, whitespace,
# duplicate order, empty duplicate, URI/path forms, actor aliases, missing
# files, digest mismatch, and positive controls).
# =============================================================================


class RootFenceDelimiterTests(unittest.TestCase):
    """RIPA-ROOT-01: a terminal Status must never be read out of a fenced
    block, regardless of the fence's delimiter character, run length, or
    closing-length variant."""

    def _fenced_status_only(self, open_delim: str, close_delim: str) -> str:
        return (
            f"# Review\n\n{open_delim}\nStatus: CLOSED_PASS_BOUNDED\n{close_delim}\n\n"
            "independentProbeDisposition: PENDING_REVIEWER_EXECUTION\n"
        )

    def test_tilde_fence_status_not_authoritative(self):
        d = chk.diagnose_closure("docs/reviews/x.md", self._fenced_status_only("~~~", "~~~"))
        self.assertFalse(d.is_clean)
        self.assertTrue(any("metadata-preamble" in i for i in d.issues))

    def test_backtick_fence_status_not_authoritative(self):
        d = chk.diagnose_closure("docs/reviews/x.md", self._fenced_status_only("```", "```"))
        self.assertFalse(d.is_clean)

    def test_longer_delimiter_run_fence_status_not_authoritative(self):
        d = chk.diagnose_closure("docs/reviews/x.md", self._fenced_status_only("~~~~~", "~~~~~"))
        self.assertFalse(d.is_clean)

    def test_longer_closing_run_still_masked(self):
        d = chk.diagnose_closure("docs/reviews/x.md", self._fenced_status_only("```", "``````"))
        self.assertFalse(d.is_clean)

    def test_four_backtick_fence_with_inner_triple_backtick_content(self):
        text = (
            "# Review\n\n````\nStatus: CLOSED_PASS_BOUNDED\n```\nmore fenced content\n````\n\n"
            "independentProbeDisposition: PENDING_REVIEWER_EXECUTION\n"
        )
        d = chk.diagnose_closure("docs/reviews/x.md", text)
        self.assertFalse(d.is_clean)

    def test_real_preamble_status_outside_fence_still_authoritative(self):
        text = (
            "# Review\n\nStatus: COMPLETE_PENDING_REVIEW\n\n"
            "independentProbeDisposition: PENDING_REVIEWER_EXECUTION\n\n"
            "~~~\nStatus: CLOSED_PASS_BOUNDED\n~~~\n"
        )
        d = chk.diagnose_closure("docs/reviews/x.md", text)
        self.assertTrue(d.is_clean, d.issues)


class RootMultilineInlineCodeSpanTests(unittest.TestCase):
    """RIPA-ROOT-R1-04: a CommonMark inline code span never creates a real
    declaration when it spans multiple lines, regardless of delimiter-run
    length, while a legitimate single-line backtick-wrapped field value
    still survives masking."""

    def test_multiline_backtick_status_leak_rejected(self):
        text = (
            "# Review\n\n`Status: CLOSED_PASS_BOUNDED\nmore text`\n\n"
            "independentProbeDisposition: PENDING_REVIEWER_EXECUTION\n"
        )
        d = chk.diagnose_closure("docs/reviews/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("metadata-preamble" in i for i in d.issues))

    def test_multiline_disposition_control_field_leak_not_read_as_declaration(self):
        # A disposition token sitting only inside a multi-line inline code
        # span must not be read as a real declaration at all: the artifact
        # correctly resolves as not applicable (no genuine disposition
        # field exists), not as a masked-clean PASS.
        text = (
            "# Review\n\nStatus: COMPLETE_PENDING_REVIEW\n\n"
            "`independentProbeDisposition: PASS_INDEPENDENT_PROBE\nmore`\n"
        )
        self.assertFalse(chk.is_review_applicable("docs/reviews/x.md", text))

    def test_multiline_double_backtick_span_leak_rejected(self):
        text = (
            "# Review\n\n``Status: CLOSED_PASS_BOUNDED\nmore text``\n\n"
            "independentProbeDisposition: PENDING_REVIEWER_EXECUTION\n"
        )
        d = chk.diagnose_closure("docs/reviews/x.md", text)
        self.assertFalse(d.is_clean)

    def test_single_backtick_span_inside_double_backtick_span_masked(self):
        text = (
            "# Review\n\n``value with ` inside\nand Status: CLOSED_PASS_BOUNDED``\n\n"
            "independentProbeDisposition: PENDING_REVIEWER_EXECUTION\n"
        )
        d = chk.diagnose_closure("docs/reviews/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("metadata-preamble" in i for i in d.issues))

    def test_legitimate_single_line_backtick_value_survives_masking(self):
        text = (
            "# Review\n\nResponds to work order: `docs/work_orders/x.md`\n\n"
            "independentProbeDisposition: PENDING_REVIEWER_EXECUTION\n"
        )
        scanner = chk.DeclarationScanner(text)
        self.assertEqual(scanner.occurrences("Responds to work order"), ("docs/work_orders/x.md",))

    def test_legitimate_status_value_line_still_authoritative(self):
        text = (
            "# Review\n\nStatus: CLOSED_PASS_BOUNDED\n\n"
            "independentProbeDisposition: PASS_INDEPENDENT_PROBE\n\n"
            "probeExecutorRole: LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER\n\n"
            "implementationWorkerActor: shared-workspace INTERNAL_AGENT worker\n\n"
            "probeExecutorActor: Local reviewer/closer\n\n"
            "probeCommandOrMethod: manual probe\n\n"
            "probeObservedResult: rejected as expected\n\n"
            "oracleSeparationBasis: an independently authored adversarial check\n\n"
            "workerInvocationId: worker-001\n\n"
            "probeInvocationId: reviewer-002\n"
        )
        scanner = chk.DeclarationScanner(text)
        self.assertEqual(scanner.preamble().count("CLOSED_PASS_BOUNDED"), 1)


class RootEvidenceRefValidationTests(_TempRepoTestCase):
    """RIPA-ROOT-02/06: evidence references must be canonical repo-relative
    paths to existing files whose recomputed bytes match the declared
    digest; URI schemes, UNC/absolute/drive paths, and self-citation are all
    rejected before any digest comparison."""

    def _lines(self, probe_ref: str, probe_digest: str) -> list[str]:
        worker_ref, worker_digest = self._write_evidence("governance/compat/e1.py", "w\n")
        return [
            "# Review", "Status: CLOSED_PASS_BOUNDED",
            "independentProbeDisposition: PASS_INDEPENDENT_PROBE",
            "probeExecutorRole: LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER",
            "implementationWorkerActor: shared-workspace INTERNAL_AGENT worker",
            "probeExecutorActor: Local reviewer/closer",
            "probeCommandOrMethod: manual probe",
            "probeObservedResult: rejected as expected",
            "oracleSeparationBasis: an independently authored adversarial check",
            "workerInvocationId: worker-001", "probeInvocationId: reviewer-002",
            f"workerOracleSha256: {worker_digest}", f"probeOracleSha256: {probe_digest}",
            f"workerEvidenceRef: {worker_ref}", f"probeEvidenceRef: {probe_ref}",
        ]

    def test_hostile_evidence_ref_forms_all_rejected(self):
        cases = (
            "https://example.invalid/probe.json",
            "file:///etc/passwd",
            "C:/secrets/probe.json",
            "//server/share/probe.json",
            "docs//reviews/probe.md",
        )
        for ref in cases:
            with self.subTest(ref=ref):
                d = chk.diagnose_closure("docs/reviews/x.md", _doc(*self._lines(ref, "6" * 64)))
                self.assertFalse(d.is_clean)

    def test_https_uri_scheme_rejected_with_specific_message(self):
        d = chk.diagnose_closure(
            "docs/reviews/x.md", _doc(*self._lines("https://example.invalid/probe.json", "6" * 64))
        )
        self.assertTrue(any("URI scheme" in i for i in d.issues))

    def test_self_citation_rejected(self):
        _, worker_digest = self._write_evidence("governance/compat/e1.py", "w\n")
        d = chk.diagnose_closure(
            "docs/reviews/x.md", _doc(*self._lines("docs/reviews/x.md", worker_digest))
        )
        self.assertFalse(d.is_clean)
        self.assertTrue(any("not cite this document itself" in i for i in d.issues))

    def test_valid_evidence_ref_accepted(self):
        probe_ref, probe_digest = self._write_evidence("docs/reviews/probe.md", "p\n")
        d = chk.diagnose_closure("docs/reviews/x.md", _doc(*self._lines(probe_ref, probe_digest)))
        self.assertTrue(d.is_clean, d.issues)


class RootLinkCardinalityTests(_TempRepoTestCase):
    """RIPA-ROOT-03: duplicate cardinality is enforced per field name before
    value comparison. Declaring both `dispatchWorkOrder` and `Responds to
    work order` once each, as this repository's own templates routinely do,
    is a valid redundant-alias pair, not a duplicate -- but they must agree,
    and true per-field duplication (the same field name twice) still fails
    closed."""

    def test_two_identical_responds_to_work_order_rejected(self):
        self._write("docs/work_orders/wo.md", _HIGH_RISK_YES_WORK_ORDER)
        text = _doc(
            "# Worker Return", "Status: COMPLETE_PENDING_REVIEW",
            "Responds to work order: `docs/work_orders/wo.md`",
            "Responds to work order: `docs/work_orders/wo.md`",
            "independentProbeDisposition: PENDING_REVIEWER_EXECUTION",
        )
        d = chk.diagnose_closure("docs/reviews/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("must occur at most once" in i for i in d.issues))

    def test_dispatch_and_responds_both_declared_same_target_accepted(self):
        # This repository's own governed templates routinely declare BOTH
        # link field names, each once, as redundant aliases for one logical
        # reference -- that is the normal case, not a duplicate.
        self._write("docs/work_orders/wo.md", _HIGH_RISK_YES_WORK_ORDER)
        text = _doc(
            "# Worker Return", "Status: COMPLETE_PENDING_REVIEW",
            "dispatchWorkOrder: `docs/work_orders/wo.md`",
            "Responds to work order: `docs/work_orders/wo.md`",
            "independentProbeDisposition: PENDING_REVIEWER_EXECUTION",
        )
        d = chk.diagnose_closure("docs/reviews/x.md", text)
        self.assertTrue(d.is_clean, d.issues)

    def test_dispatch_and_responds_declared_with_disagreeing_targets_rejected(self):
        self._write("docs/work_orders/wo1.md", _HIGH_RISK_YES_WORK_ORDER)
        self._write("docs/work_orders/wo2.md", _HIGH_RISK_YES_WORK_ORDER)
        text = _doc(
            "# Worker Return", "Status: COMPLETE_PENDING_REVIEW",
            "dispatchWorkOrder: `docs/work_orders/wo1.md`",
            "Responds to work order: `docs/work_orders/wo2.md`",
            "independentProbeDisposition: PENDING_REVIEWER_EXECUTION",
        )
        d = chk.diagnose_closure("docs/reviews/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("disagree" in i for i in d.issues))

    def test_exactly_one_link_declaration_accepted(self):
        self._write("docs/work_orders/wo.md", _HIGH_RISK_YES_WORK_ORDER)
        text = _doc(
            "# Worker Return", "Status: COMPLETE_PENDING_REVIEW",
            "Responds to work order: `docs/work_orders/wo.md`",
            "independentProbeDisposition: PENDING_REVIEWER_EXECUTION",
        )
        d = chk.diagnose_closure("docs/reviews/x.md", text)
        self.assertTrue(d.is_clean, d.issues)


class RootReferencedWorkOrderCardinalityTests(_TempRepoTestCase):
    """RIPA-ROOT-04: the referenced work order's own probe-requirement
    declaration must itself satisfy exactly-one non-empty cardinality; an
    empty duplicate alongside a valid YES still fails closed."""

    def test_empty_duplicate_plus_yes_in_referenced_work_order_fails_closed(self):
        self._write("docs/work_orders/wo.md", _EMPTY_DUPLICATE_PROBE_REQUIRED)
        review_text = _doc(
            "# Review", "Status: CLOSED_PASS_BOUNDED",
            "Responds to work order: `docs/work_orders/wo.md`",
            "ordinary content with no disposition field.",
        )
        d = chk.diagnose_closure("docs/reviews/r.md", review_text)
        self.assertTrue(d.applicable)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("does not declare exactly one" in i for i in d.issues))

    def test_clean_single_yes_in_referenced_work_order_forces_applicability(self):
        self._write("docs/work_orders/wo.md", _HIGH_RISK_YES_WORK_ORDER)
        review_text = _doc(
            "# Review", "Status: CLOSED_PASS_BOUNDED",
            "Responds to work order: `docs/work_orders/wo.md`",
            "no disposition field here.",
        )
        d = chk.diagnose_closure("docs/reviews/r.md", review_text)
        self.assertTrue(d.applicable)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("omits required field" in i for i in d.issues))


class RootActorIdentityTests(_TempRepoTestCase):
    """RIPA-ROOT-05/R1-02: role separation is judged from a controlled role
    token plus unequal canonical actor IDs, never a worker-identity keyword
    scan. `Claude internal agent worker` (Local's R1 counterexample) has no
    `IMPLEMENTATION_WORKER` substring and must still be rejected as BOTH
    actors (equal after normalization)."""

    def _pass_with_actors(self, implementation_actor: str, probe_actor: str, role: str = chk.PROBE_EXECUTOR_ROLE_TOKEN) -> str:
        worker_ref, worker_digest = self._write_evidence("governance/compat/e1.py", "w\n")
        probe_ref, probe_digest = self._write_evidence("docs/reviews/e2.md", "p\n")
        return _doc(
            "# Review", "Status: CLOSED_PASS_BOUNDED", "independentProbeDisposition: PASS_INDEPENDENT_PROBE",
            f"probeExecutorRole: {role}", f"implementationWorkerActor: {implementation_actor}",
            f"probeExecutorActor: {probe_actor}", "probeCommandOrMethod: manual probe",
            "probeObservedResult: rejected as expected", "oracleSeparationBasis: an independently authored adversarial check",
            "workerInvocationId: worker-001", "probeInvocationId: reviewer-002",
            f"workerOracleSha256: {worker_digest}", f"probeOracleSha256: {probe_digest}",
            f"workerEvidenceRef: {worker_ref}", f"probeEvidenceRef: {probe_ref}",
        )

    def test_missing_controlled_role_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", self._pass_with_actors("worker", "Local reviewer/closer", role=""))
        self.assertFalse(d.is_clean)

    def test_invalid_role_token_rejected(self):
        d = chk.diagnose_closure("docs/reviews/x.md", self._pass_with_actors("worker", "Local reviewer/closer", role="SOME_OTHER_TOKEN"))
        self.assertFalse(d.is_clean)
        self.assertTrue(any("probeExecutorRole" in i and "exact controlled token" in i for i in d.issues))

    def test_claude_internal_agent_worker_as_both_actors_rejected(self):
        # Local's exact RIPA-ROOT-R1-02 counterexample: no IMPLEMENTATION_
        # WORKER substring, declared as both actors, equal after normalization.
        d = chk.diagnose_closure("docs/reviews/x.md", self._pass_with_actors("Claude internal agent worker", "Claude internal agent worker"))
        self.assertFalse(d.is_clean)
        self.assertTrue(any("implementationWorkerActor" in i and "distinct" in i for i in d.issues))

    def test_equal_actors_under_case_and_separator_variants_rejected(self):
        variants = (
            ("worker-actor-alpha", "worker-actor-alpha"),
            ("Worker_Actor_Alpha", "WORKER ACTOR ALPHA"),
            ("WorkerActorAlpha", "worker actor alpha"),
        )
        for implementation_actor, probe_actor in variants:
            with self.subTest(implementation_actor=implementation_actor, probe_actor=probe_actor):
                d = chk.diagnose_closure("docs/reviews/x.md", self._pass_with_actors(implementation_actor, probe_actor))
                self.assertFalse(d.is_clean)

    def test_distinct_actors_accepted_regardless_of_wording(self):
        d = chk.diagnose_closure("docs/reviews/x.md", self._pass_with_actors("Claude internal agent worker", "Local reviewer/closer"))
        self.assertTrue(d.is_clean, d.issues)

    def test_bare_provider_name_actor_not_rejected_by_keyword_scan(self):
        d = chk.diagnose_closure("docs/reviews/x.md", self._pass_with_actors("shared-workspace INTERNAL_AGENT worker", "Claude"))
        self.assertTrue(d.is_clean, d.issues)


class DeclarationScannerUnitTests(unittest.TestCase):
    def test_mask_non_declarative_masks_html_comment(self):
        text = "<!-- Status: CLOSED_PASS_BOUNDED -->\nStatus: COMPLETE_PENDING_REVIEW\n"
        result = chk.DeclarationScanner(text).scalar("Status", cardinality="EXACTLY_ONE"); self.assertTrue(result.ok); self.assertEqual(result.value, "COMPLETE_PENDING_REVIEW")
        text = "Status: COMPLETE_PENDING_REVIEW\n<!--\nindependentProbeDisposition: PASS_INDEPENDENT_PROBE\n"
        result = chk.DeclarationScanner(text).scalar("independentProbeDisposition", cardinality="ZERO_OR_ONE")
        self.assertTrue(result.ok); self.assertIsNone(result.value)

    def test_scalar_zero_or_one_rejects_empty_declaration(self):
        result = chk.DeclarationScanner("independentProbeDisposition:\n").scalar("independentProbeDisposition", cardinality="ZERO_OR_ONE")
        self.assertFalse(result.ok)

    def test_scalar_zero_or_one_accepts_absence(self):
        scanner = chk.DeclarationScanner("no field here\n")
        result = scanner.scalar("independentProbeDisposition", cardinality="ZERO_OR_ONE")
        self.assertTrue(result.ok)
        self.assertIsNone(result.value)


class PathValidatorUnitTests(unittest.TestCase):
    def test_dot_segment_rejected(self):
        result = chk.validate_repo_relative_path("docs/./reviews/x.md")
        self.assertFalse(result.ok)

    def test_dotdot_segment_rejected(self):
        result = chk.validate_repo_relative_path("docs/../reviews/x.md")
        self.assertFalse(result.ok)

    def test_clean_relative_path_accepted(self):
        result = chk.validate_repo_relative_path("docs/reviews/x.md")
        self.assertTrue(result.ok)
        self.assertEqual(result.normalized, "docs/reviews/x.md")

    def test_empty_path_rejected(self):
        result = chk.validate_repo_relative_path("")
        self.assertFalse(result.ok)


_NO_PROBE_FIELD_WORK_ORDER = "# Work Order\n\ndocType: work_order\n\nno probe field.\n"


class ChangedLaneOnlyTests(unittest.TestCase):
    """RIPA-ROOT-09: a pre-existing untracked artifact outside the current
    diff is diagnosed but must not fail `main()` under
    `--changed-lane-only`; one actually inside the lane must still fail."""

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self._orig_repo_root = chk.REPO_ROOT
        self.addCleanup(self._restore_repo_root)
        repo_root = Path(self._tmp.name)
        chk.REPO_ROOT = repo_root

        def _git(*args: str) -> None:
            subprocess.run(["git", *args], cwd=repo_root, check=True, capture_output=True, text=True)

        self._git = _git
        for args in (
            ("init", "-q"), ("config", "user.email", "test@example.invalid"), ("config", "user.name", "Test"),
        ):
            _git(*args)
        (repo_root / "docs" / "work_orders").mkdir(parents=True)
        (repo_root / "docs" / "reviews").mkdir(parents=True)
        (repo_root / "README.md").write_text("seed\n", encoding="utf-8")
        _git("add", "-A")
        _git("commit", "-q", "-m", "seed")

    def _restore_repo_root(self):
        chk.REPO_ROOT = self._orig_repo_root

    def _write(self, relative_path: str, content: str) -> None:
        full = chk.REPO_ROOT / relative_path
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_text(content, encoding="utf-8")

    def _run_main(self, *extra_args: str) -> int:
        buf = io.StringIO()
        with redirect_stdout(buf):
            code = chk.main(["--enforce", *extra_args])
        self._last_output = buf.getvalue()
        return code

    def test_out_of_lane_untracked_violation_does_not_fail_gate(self):
        # A parked, already-untracked violating artifact untouched this
        # session must not block an unrelated commit under --changed-lane-only.
        self._write("docs/work_orders/parked.md", _NO_PROBE_FIELD_WORK_ORDER)
        self._write(
            "docs/reviews/parked_return.md",
            _doc(
                "# Review", "Status: CLOSED_PASS_BOUNDED",
                "Responds to work order: `docs/work_orders/parked.md`",
                "no disposition field.",
            ),
        )
        code = self._run_main("--changed-lane-only")
        self.assertEqual(code, 0, self._last_output)
        self.assertIn("Known findings outside the current changed lane", self._last_output)

    def test_in_lane_untracked_violation_fails_gate(self):
        # The SAME violating shape, but staged into the live diff, must
        # still fail the gate -- the lane boundary narrows scope, it does
        # not grant blanket amnesty to violations inside the active lane.
        self._write("docs/work_orders/active.md", _NO_PROBE_FIELD_WORK_ORDER)
        self._git("add", "docs/work_orders/active.md")
        self.assertEqual(self._run_main("--changed-lane-only"), 1, self._last_output)

    def test_without_flag_out_of_lane_violation_still_fails_gate(self):
        self._write("docs/work_orders/parked.md", _NO_PROBE_FIELD_WORK_ORDER)
        self.assertEqual(self._run_main(), 1, self._last_output)

    def test_active_untracked_return_fails_via_active_work_order_binding(self):
        # RIPA-ROOT-R1-01, mandatory floor items 1-2: the CURRENT dispatch's
        # own work order is committed, but the worker return it names stays
        # untracked under WORKER_MUST_NOT_COMMIT. A violation there must
        # still fail the gate via --active-work-order, while a separately
        # pre-existing parked artifact stays non-blocking, without staging
        # either file.
        self._write(
            "docs/work_orders/active_dispatch.md",
            _doc(
                "# Work Order", "docType: work_order", "Worker return path: `docs/reviews/active_return.md`",
                "independentProbeRequired: YES", *_VALID_CONTRACT_FIELDS,
            ),
        )
        self._git("add", "docs/work_orders/active_dispatch.md")
        self._git("commit", "-q", "-m", "dispatch active work order")

        # Untracked, with a real violation: a duplicate disposition declaration.
        self._write(
            "docs/reviews/active_return.md",
            _doc(
                "# Review", "Status: CLOSED_PASS_BOUNDED",
                "Responds to work order: `docs/work_orders/active_dispatch.md`",
                "independentProbeDisposition: PENDING_REVIEWER_EXECUTION",
                "independentProbeDisposition: PENDING_REVIEWER_EXECUTION",
            ),
        )
        self._write("docs/work_orders/parked.md", _NO_PROBE_FIELD_WORK_ORDER)
        self._write(
            "docs/reviews/parked_return.md",
            _doc(
                "# Review", "Status: CLOSED_PASS_BOUNDED", "Responds to work order: `docs/work_orders/parked.md`",
                "no disposition field.",
            ),
        )

        code = self._run_main("--changed-lane-only", "--active-work-order", "docs/work_orders/active_dispatch.md")
        self.assertEqual(code, 1, self._last_output)
        self.assertIn("docs/reviews/active_return.md", self._last_output)
        self.assertIn("Known findings outside the current changed lane", self._last_output)

    def test_active_work_order_binding_does_not_mask_findings_without_flag(self):
        self._write(
            "docs/work_orders/active_dispatch.md",
            _doc(
                "# Work Order", "docType: work_order",
                "Worker return path: `docs/reviews/active_return.md`",
                "independentProbeRequired: NOT_APPLICABLE_WITH_REASON: routine",
            ),
        )
        self._git("add", "docs/work_orders/active_dispatch.md")
        self._git("commit", "-q", "-m", "dispatch active work order")
        self._write(
            "docs/reviews/active_return.md",
            _doc("# Review", "Status: CLOSED_PASS_BOUNDED", "independentProbeDisposition: LOOKS_GOOD_TO_ME"),
        )
        code = self._run_main("--active-work-order", "docs/work_orders/active_dispatch.md")
        self.assertEqual(code, 1, self._last_output)

        code = self._run_main("--changed-lane-only", "--active-work-order", "docs/work_orders/does_not_exist.md")
        self.assertEqual(code, 1, self._last_output); self.assertIn("binding could not resolve", self._last_output)


if __name__ == "__main__":
    unittest.main()
