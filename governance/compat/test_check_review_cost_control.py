#!/usr/bin/env python3
"""Focused tests for the SOT3-RCS-T1 review-cost control checker."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

_COMPAT_DIR = Path(__file__).resolve().parent
if str(_COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(_COMPAT_DIR))

_MODULE_PATH = _COMPAT_DIR / "check_review_cost_control.py"
_SPEC = importlib.util.spec_from_file_location("check_review_cost_control", _MODULE_PATH)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {_MODULE_PATH}")
chk = importlib.util.module_from_spec(_SPEC)
sys.modules[_SPEC.name] = chk
_SPEC.loader.exec_module(chk)


_HEADER = (
    "# CVF Example Completion Review\n\n"
    "Status: REVIEWER_ACCEPTED_BOUNDED\n\n"
    "docType: completion_review\n\n"
    "Review-Cost Telemetry: REQUIRED\n\n"
)


def _telemetry_block(
    *,
    reviewRoundCount="1",
    workerRepairTurnCount="1",
    newRootCauseCountThisRound="0",
    dependentFindingCountThisRound="0",
    elapsedReviewMinutes="15",
    providerCallCount="0",
    tokenOrQuotaUsage="NOT_AVAILABLE_WITH_REASON: not exposed",
    valueDelta="Closed one receipt-binding integrity gap.",
    stopDisposition="COMPLETE_REVIEW",
    preRepairAuditDisposition="COMPLETE_BEFORE_FIRST_REPAIR",
    materialCommitCount="1",
    continuityCommitCount="1",
    commitPlanDisposition="DEFAULT_ONE_MATERIAL_ONE_CONTINUITY",
    latencyDisposition="WITHIN_FAST_PATH_TARGET",
    avoidableDelayClass="NONE",
):
    return (
        "## Review Cost Telemetry And Stop Disposition\n\n"
        f"reviewRoundCount: {reviewRoundCount}\n"
        f"workerRepairTurnCount: {workerRepairTurnCount}\n"
        f"newRootCauseCountThisRound: {newRootCauseCountThisRound}\n"
        f"dependentFindingCountThisRound: {dependentFindingCountThisRound}\n"
        f"elapsedReviewMinutes: {elapsedReviewMinutes}\n"
        f"providerCallCount: {providerCallCount}\n"
        f"tokenOrQuotaUsage: {tokenOrQuotaUsage}\n"
        f"valueDelta: {valueDelta}\n"
        f"stopDisposition: {stopDisposition}\n"
        f"preRepairAuditDisposition: {preRepairAuditDisposition}\n"
        f"materialCommitCount: {materialCommitCount}\n"
        f"continuityCommitCount: {continuityCommitCount}\n"
        f"commitPlanDisposition: {commitPlanDisposition}\n"
        f"latencyDisposition: {latencyDisposition}\n"
        f"avoidableDelayClass: {avoidableDelayClass}\n"
    )


_VALID = _HEADER + _telemetry_block()


def _work_order_block(
    *, dispatchKind="INITIAL", dispatchSurface="INTERNAL_AGENT",
    reviewRoundCount="0", priorFindingSetDigest="NOT_APPLICABLE_INITIAL_DISPATCH",
    dependencyAuditDisposition="COMPLETE_INITIAL_ACCEPTANCE_MATRIX",
    reworkFindingDisposition="NOT_APPLICABLE_INITIAL_DISPATCH",
    newIndependentCriticalEvidence="NONE",
    regressionGuardDisposition="BASELINE_NEGATIVE_TESTS_PLANNED",
    cumulativeExternalInvocationCount="0", externalInvocationCeiling="0",
    usageAvailability="NOT_APPLICABLE_INTERNAL_AGENT",
    quotaAdmissionDisposition="NOT_APPLICABLE_INTERNAL_AGENT",
    nextDispatchDisposition="INITIAL_DISPATCH",
    rootCauseClusterId="NOT_APPLICABLE_INITIAL_DISPATCH", reworkGeneration="0",
    consolidatedDefectClassSweep="COMPLETE_INITIAL_ACCEPTANCE_MATRIX",
):
    return (
        "# Example Work Order\n\ndocType: work_order\n\n"
        "Review-Dispatch Convergence Control: REQUIRED\n\n"
        f"dispatchKind: {dispatchKind}\n"
        f"dispatchSurface: {dispatchSurface}\n"
        "parentAssignmentId: parent-1\n"
        f"reviewRoundCount: {reviewRoundCount}\n"
        f"priorFindingSetDigest: {priorFindingSetDigest}\n"
        f"dependencyAuditDisposition: {dependencyAuditDisposition}\n"
        f"reworkFindingDisposition: {reworkFindingDisposition}\n"
        f"newIndependentCriticalEvidence: {newIndependentCriticalEvidence}\n"
        f"regressionGuardDisposition: {regressionGuardDisposition}\n"
        f"cumulativeExternalInvocationCount: {cumulativeExternalInvocationCount}\n"
        f"externalInvocationCeiling: {externalInvocationCeiling}\n"
        f"usageAvailability: {usageAvailability}\n"
        f"quotaAdmissionDisposition: {quotaAdmissionDisposition}\n"
        f"nextDispatchDisposition: {nextDispatchDisposition}\n"
        f"rootCauseClusterId: {rootCauseClusterId}\n"
        f"reworkGeneration: {reworkGeneration}\n"
        f"consolidatedDefectClassSweep: {consolidatedDefectClassSweep}\n"
        "successorTrancheOpened: NO\n"
        "implementationAutonomyDisposition: CONTRACT_AUTHORITY_EVIDENCE_OUTCOME_ONLY\n"
    )


_VALID_INITIAL_WORK_ORDER = _work_order_block()
_VALID_REWORK = _work_order_block(
    dispatchKind="REWORK", dispatchSurface="EXTERNAL_AGENT_CLI_MCP",
    reviewRoundCount="1", priorFindingSetDigest="a" * 64,
    dependencyAuditDisposition="COMPLETE_BEFORE_FIRST_REPAIR",
    reworkFindingDisposition="CONSOLIDATED_ALL_DEPENDENT_FINDINGS",
    regressionGuardDisposition="REQUIRED_AND_PLANNED_FOR_EACH_TARGETED_DEFECT",
    cumulativeExternalInvocationCount="1", externalInvocationCeiling="2",
    usageAvailability="KNOWN_FOR_ADMISSION",
    quotaAdmissionDisposition="ADMITTED_WITHIN_CUMULATIVE_CEILING",
    nextDispatchDisposition="ONE_CONSOLIDATED_REWORK",
    rootCauseClusterId="cluster-lock-identity", reworkGeneration="1",
    consolidatedDefectClassSweep="COMPLETE_BEFORE_REWORK_DISPATCH",
)

_VALID_WORKER_RETURN = (
    "# Worker Return\n\ndocType: review\n\n"
    "Self-declared worker-return artifact: yes\n\n"
    "rootCauseClusterId: cluster-lock-identity\n"
    "reworkGeneration: 1\n"
    "consolidatedDefectClassSweep: COMPLETE_ALL_KNOWN_DEPENDENCIES\n"
    "productionBindingEvidence: test_lock_race + launcher receipt\n"
    "adversarialRegressionDisposition: PASS_TARGETED_DEFECT_CLASS\n"
    "successorTrancheOpened: NO\n"
    "implementationAutonomyDisposition: CONTRACT_AUTHORITY_EVIDENCE_OUTCOME_ONLY\n"
    "internalAgentInvocationCount: 0\n"
    "externalAgentInvocationCount: 1\n"
    "providerCallCount: 0\n"
    "tokenOrQuotaUsage: NOT_AVAILABLE_WITH_REASON: external surface did not expose usage\n"
    "terminalReadinessVerdict: READY_FOR_REVIEW\n"
)

_MISSING_FIELDS = _HEADER + (
    "## Review Cost Telemetry And Stop Disposition\n\n"
    "reviewRoundCount: 1\n"
    "stopDisposition: COMPLETE_REVIEW\n"
)

_INVALID_INTEGER = _HEADER + _telemetry_block(workerRepairTurnCount="two")

_INVALID_UNAVAILABLE_FIELD = _HEADER + _telemetry_block(
    elapsedReviewMinutes="unknown"
)

_BARE_UNAVAILABLE_FIELD = _HEADER + _telemetry_block(
    elapsedReviewMinutes="NOT_AVAILABLE_WITH_REASON"
)

_VALUE_DELTA_BARE_NUMBER = _HEADER + _telemetry_block(valueDelta="5")

_INVALID_STOP_TOKEN = _HEADER + _telemetry_block(stopDisposition="MAYBE_LATER")

_ROUND_THREE_VALID_ESCALATION = _HEADER + _telemetry_block(
    reviewRoundCount="3", stopDisposition="REVIEW_COST_ESCALATION_REQUIRED"
)

_ROUND_THREE_VALID_CONTINUE = _HEADER + _telemetry_block(
    reviewRoundCount="4", newRootCauseCountThisRound="1",
    stopDisposition="CONTINUE_NEW_CRITICAL_EVIDENCE"
)

_ROUND_THREE_INVALID_COMPLETE = _HEADER + _telemetry_block(
    reviewRoundCount="3", stopDisposition="COMPLETE_REVIEW"
)

_ROUND_THREE_INVALID_PARK = _HEADER + _telemetry_block(
    reviewRoundCount="5", stopDisposition="PARK_LOW_INCREMENTAL_VALUE"
)

_MULTI_COMMIT_WITH_REASON = _HEADER + _telemetry_block(
    materialCommitCount="2",
    commitPlanDisposition="EXCEPTION_WITH_REASON: required split for protected guard repair",
)

_MULTI_COMMIT_WITHOUT_REASON = _HEADER + _telemetry_block(materialCommitCount="2")

_NO_DECLARATION = (
    "# Historical Completion Review\n\n"
    "Status: REVIEWER_ACCEPTED_BOUNDED\n\n"
    "docType: completion_review\n\n"
    "This changed completion review omitted mandatory telemetry.\n"
)

_QUOTED_MARKER_STANDARD = (
    "# Some Standard\n\n"
    "docType: reference\n\n"
    "A completion review opts in via the exact line "
    "`Review-Cost Telemetry: REQUIRED`.\n"
)

_QUOTED_MARKER_FENCED = (
    "# Some Work Order\n\n"
    "```text\n"
    "Review-Cost Telemetry: REQUIRED\n"
    "```\n"
)

_ARCHIVE_PATH = "docs/reviews/archive/CVF_OLD_2026-01-01.md"


class ApplicabilityTests(unittest.TestCase):
    def test_declared_review_is_applicable(self):
        self.assertTrue(chk.is_applicable("docs/reviews/x.md", _VALID))

    def test_no_declaration_completion_review_is_applicable(self):
        self.assertTrue(chk.is_applicable("docs/reviews/x.md", _NO_DECLARATION))

    def test_backtick_quoted_marker_in_standard_not_applicable(self):
        self.assertFalse(
            chk.is_applicable(
                "docs/reference/review_cost_control/CVF_REVIEW_COST_AND_DIMINISHING_RETURN_CONTROL_STANDARD.md",
                _QUOTED_MARKER_STANDARD,
            )
        )

    def test_fenced_marker_in_work_order_not_applicable(self):
        self.assertFalse(
            chk.is_applicable("docs/work_orders/x.md", _QUOTED_MARKER_FENCED)
        )

    def test_non_reviews_path_not_applicable(self):
        self.assertFalse(chk.is_applicable("docs/baselines/x.md", _VALID))

    def test_archive_path_excluded(self):
        self.assertFalse(chk.is_applicable(_ARCHIVE_PATH, _VALID))

    def test_own_source_excluded(self):
        self.assertFalse(
            chk.is_applicable(chk.THIS_CHECKER_PATH, "Review-Cost Telemetry: REQUIRED\n")
        )

    def test_non_markdown_excluded(self):
        self.assertFalse(chk.is_applicable("docs/reviews/x.py", _VALID))


class DiagnoseTests(unittest.TestCase):
    def test_valid_declaration_is_clean(self):
        d = chk.diagnose("docs/reviews/x.md", _VALID)
        self.assertTrue(d.applicable)
        self.assertTrue(d.is_clean)
        self.assertEqual(d.issues, ())

    def test_missing_fields_flagged(self):
        d = chk.diagnose("docs/reviews/x.md", _MISSING_FIELDS)
        self.assertTrue(d.applicable)
        self.assertFalse(d.is_clean)
        missing = [i for i in d.issues if "missing required field" in i]
        self.assertEqual(len(missing), len(chk.ALL_FIELDS) - 2)

    def test_invalid_integer_flagged(self):
        d = chk.diagnose("docs/reviews/x.md", _INVALID_INTEGER)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("workerRepairTurnCount" in i for i in d.issues))

    def test_invalid_unavailable_field_flagged(self):
        d = chk.diagnose("docs/reviews/x.md", _INVALID_UNAVAILABLE_FIELD)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("elapsedReviewMinutes" in i for i in d.issues))

    def test_unavailable_field_with_reason_is_clean(self):
        d = chk.diagnose("docs/reviews/x.md", _VALID)
        self.assertTrue(d.is_clean)

    def test_bare_unavailable_reason_is_rejected(self):
        d = chk.diagnose("docs/reviews/x.md", _BARE_UNAVAILABLE_FIELD)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("elapsedReviewMinutes" in i for i in d.issues))

    def test_value_delta_bare_number_flagged(self):
        d = chk.diagnose("docs/reviews/x.md", _VALUE_DELTA_BARE_NUMBER)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("valueDelta" in i for i in d.issues))

    def test_invalid_stop_token_flagged(self):
        d = chk.diagnose("docs/reviews/x.md", _INVALID_STOP_TOKEN)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("stopDisposition" in i for i in d.issues))


class RoundThreeEscalationTests(unittest.TestCase):
    def test_round_three_escalation_token_is_clean(self):
        d = chk.diagnose("docs/reviews/x.md", _ROUND_THREE_VALID_ESCALATION)
        self.assertTrue(d.is_clean)


class SinglePassSopTests(unittest.TestCase):
    def test_multi_commit_with_reason_is_clean(self):
        d = chk.diagnose("docs/reviews/x.md", _MULTI_COMMIT_WITH_REASON)
        self.assertTrue(d.is_clean)

    def test_multi_commit_without_reason_is_rejected(self):
        d = chk.diagnose("docs/reviews/x.md", _MULTI_COMMIT_WITHOUT_REASON)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("requires" in issue for issue in d.issues))

    def test_invalid_audit_token_is_rejected(self):
        text = _HEADER + _telemetry_block(preRepairAuditDisposition="PARTIAL")
        d = chk.diagnose("docs/reviews/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("preRepairAuditDisposition" in issue for issue in d.issues))

    def test_latency_exceeded_requires_reason(self):
        text = _HEADER + _telemetry_block(
            latencyDisposition="LATENCY_BUDGET_EXCEEDED_WITH_REASON"
        )
        d = chk.diagnose("docs/reviews/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("latencyDisposition" in issue for issue in d.issues))

    def test_latency_exceeded_with_reason_is_clean(self):
        text = _HEADER + _telemetry_block(
            latencyDisposition="LATENCY_BUDGET_EXCEEDED_WITH_REASON: sequential review loop",
            avoidableDelayClass="MULTIPLE_AVOIDABLE_DELAYS",
        )
        d = chk.diagnose("docs/reviews/x.md", text)
        self.assertTrue(d.is_clean)

    def test_round_four_continue_token_is_clean(self):
        d = chk.diagnose("docs/reviews/x.md", _ROUND_THREE_VALID_CONTINUE)
        self.assertTrue(d.is_clean)

    def test_round_three_complete_review_rejected(self):
        d = chk.diagnose("docs/reviews/x.md", _ROUND_THREE_INVALID_COMPLETE)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("reviewRoundCount >= 3" in i for i in d.issues))

    def test_round_five_park_rejected(self):
        d = chk.diagnose("docs/reviews/x.md", _ROUND_THREE_INVALID_PARK)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("reviewRoundCount >= 3" in i for i in d.issues))

    def test_round_two_allows_any_valid_token(self):
        text = _HEADER + _telemetry_block(
            reviewRoundCount="2", stopDisposition="PARK_LOW_INCREMENTAL_VALUE"
        )
        d = chk.diagnose("docs/reviews/x.md", text)
        self.assertTrue(d.is_clean)

    def test_continue_new_critical_requires_new_root_cause(self):
        text = _HEADER + _telemetry_block(
            reviewRoundCount="2", newRootCauseCountThisRound="0",
            stopDisposition="CONTINUE_NEW_CRITICAL_EVIDENCE",
        )
        d = chk.diagnose("docs/reviews/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("requires" in issue for issue in d.issues))

    def test_round_two_rejects_dependent_only_repair_loop(self):
        text = _HEADER + _telemetry_block(
            reviewRoundCount="2", newRootCauseCountThisRound="0",
            dependentFindingCountThisRound="1",
            stopDisposition="CONSOLIDATE_SINGLE_REPAIR",
        )
        d = chk.diagnose("docs/reviews/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("independent root cause" in issue for issue in d.issues))


class ReworkDispatchControlTests(unittest.TestCase):
    def test_valid_initial_work_order_is_clean(self):
        d = chk.diagnose("docs/work_orders/x.md", _VALID_INITIAL_WORK_ORDER)
        self.assertTrue(d.applicable)
        self.assertTrue(d.is_clean)

    def test_valid_first_consolidated_rework_is_clean(self):
        self.assertTrue(chk.diagnose("docs/work_orders/x.md", _VALID_REWORK).is_clean)

    def test_rework_generation_must_match_round(self):
        text = _VALID_REWORK.replace("reworkGeneration: 1", "reworkGeneration: 2")
        self.assertFalse(chk.diagnose("docs/work_orders/x.md", text).is_clean)

    def test_successor_tranche_must_remain_closed(self):
        text = _VALID_REWORK.replace("successorTrancheOpened: NO", "successorTrancheOpened: YES")
        self.assertFalse(chk.diagnose("docs/work_orders/x.md", text).is_clean)


class WorkerReturnConvergenceTests(unittest.TestCase):
    def test_valid_worker_return_is_clean(self):
        self.assertTrue(chk.diagnose("docs/reviews/worker.md", _VALID_WORKER_RETURN).is_clean)

    def test_worker_return_requires_production_binding(self):
        text = _VALID_WORKER_RETURN.replace(
            "productionBindingEvidence: test_lock_race + launcher receipt",
            "productionBindingEvidence: TODO",
        )
        self.assertFalse(chk.diagnose("docs/reviews/worker.md", text).is_clean)

    def test_worker_return_cannot_open_successor_tranche(self):
        text = _VALID_WORKER_RETURN.replace("successorTrancheOpened: NO", "successorTrancheOpened: YES")
        self.assertFalse(chk.diagnose("docs/reviews/worker.md", text).is_clean)

    def test_blocked_scaffold_can_remain_machine_clean_without_false_pass(self):
        text = (
            _VALID_WORKER_RETURN
            .replace("consolidatedDefectClassSweep: COMPLETE_ALL_KNOWN_DEPENDENCIES", "consolidatedDefectClassSweep: PENDING_BEFORE_READY")
            .replace("productionBindingEvidence: test_lock_race + launcher receipt", "productionBindingEvidence: PENDING_BEFORE_READY")
            .replace("adversarialRegressionDisposition: PASS_TARGETED_DEFECT_CLASS", "adversarialRegressionDisposition: PENDING_BEFORE_READY")
            .replace("terminalReadinessVerdict: READY_FOR_REVIEW", "terminalReadinessVerdict: BLOCKED_WITH_REASON: pending worker evidence")
        )
        self.assertTrue(chk.diagnose("docs/reviews/worker.md", text).is_clean)

    def test_round_two_requires_new_independent_critical_evidence(self):
        text = _VALID_REWORK.replace("reviewRoundCount: 1", "reviewRoundCount: 2")
        d = chk.diagnose("docs/work_orders/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("critical evidence IDs" in issue for issue in d.issues))

    def test_round_three_is_not_automatic_dispatch_eligible(self):
        text = _VALID_REWORK.replace("reviewRoundCount: 1", "reviewRoundCount: 3").replace(
            "newIndependentCriticalEvidence: NONE", "newIndependentCriticalEvidence: RC-NEW-3"
        )
        d = chk.diagnose("docs/work_orders/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("operator escalation" in issue for issue in d.issues))

    def test_external_invocation_ceiling_is_fail_closed(self):
        text = _VALID_REWORK.replace(
            "cumulativeExternalInvocationCount: 1", "cumulativeExternalInvocationCount: 2"
        )
        d = chk.diagnose("docs/work_orders/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("cumulativeExternalInvocationCount <" in issue for issue in d.issues))

    def test_unknown_external_usage_is_fail_closed(self):
        text = _VALID_REWORK.replace("usageAvailability: KNOWN_FOR_ADMISSION", "usageAvailability: UNKNOWN")
        d = chk.diagnose("docs/work_orders/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("KNOWN_FOR_ADMISSION" in issue for issue in d.issues))


class HistoricalExclusionTests(unittest.TestCase):
    def test_changed_completion_review_without_declaration_is_flagged(self):
        d = chk.diagnose("docs/reviews/CVF_CHANGED_REVIEW.md", _NO_DECLARATION)
        self.assertTrue(d.applicable)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("missing exact standalone declaration" in i for i in d.issues))

    def test_archived_completion_review_is_excluded(self):
        d = chk.diagnose(_ARCHIVE_PATH, _NO_DECLARATION)
        self.assertFalse(d.applicable)
        self.assertTrue(d.is_clean)


class RunIntegrationTests(unittest.TestCase):
    def test_run_returns_only_applicable_diagnostics(self):
        # run() drives off changed-path discovery; here we exercise diagnose()
        # directly per path to keep the test hermetic (no git dependency).
        paths_and_texts = {
            "docs/reviews/a.md": _VALID,
            "docs/reviews/b.md": _NO_DECLARATION,
            "docs/work_orders/c.md": _QUOTED_MARKER_FENCED,
        }
        applicable = [
            p for p, t in paths_and_texts.items() if chk.is_applicable(p, t)
        ]
        self.assertEqual(applicable, ["docs/reviews/a.md", "docs/reviews/b.md"])


if __name__ == "__main__":
    unittest.main()
