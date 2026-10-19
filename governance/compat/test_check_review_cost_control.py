#!/usr/bin/env python3
"""Focused tests for the SOT3-RCS-T1 review-cost control checker."""

from __future__ import annotations

import contextlib
import copy
import hashlib
import importlib.util
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timezone
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
    preExecutionReviewAdmission="NOT_REQUIRED_BEFORE_EXECUTION",
    preExecutionReviewTrigger="NONE",
    nextRoutineReviewBoundary="WORKER_RETURN",
    reviewerLocalRepairBoundary=None,
    reviewerLocalRepairBasis=None,
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
        f"preExecutionReviewAdmission: {preExecutionReviewAdmission}\n"
        f"preExecutionReviewTrigger: {preExecutionReviewTrigger}\n"
        f"nextRoutineReviewBoundary: {nextRoutineReviewBoundary}\n"
        "reviewerWorkBoundary: EVALUATE_RETURNED_EVIDENCE_NOT_RECREATE_IMPLEMENTATION\n"
        + (f"reviewerLocalRepairBoundary: {reviewerLocalRepairBoundary}\n" if reviewerLocalRepairBoundary else "")
        + (f"reviewerLocalRepairBasis: {reviewerLocalRepairBasis}\n" if reviewerLocalRepairBasis else "")
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
    reviewerLocalRepairBoundary="NEW_EVIDENCE_REQUIRED",
    reviewerLocalRepairBasis="Finding F1 requires new source evidence unavailable to the reviewer.",
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

    def test_no_pre_execution_review_routes_to_worker_return(self):
        self.assertTrue(chk.diagnose("docs/work_orders/x.md", _VALID_INITIAL_WORK_ORDER).is_clean)

    def test_triggered_review_requires_named_trigger(self):
        text = _work_order_block(
            preExecutionReviewAdmission="REQUIRED_TRIGGERED",
            preExecutionReviewTrigger="NONE",
            nextRoutineReviewBoundary="PRE_EXECUTION_REVIEW",
        )
        d = chk.diagnose("docs/work_orders/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("non-`NONE`" in issue for issue in d.issues))

    def test_triggered_review_with_operator_request_is_clean(self):
        text = _work_order_block(
            preExecutionReviewAdmission="REQUIRED_TRIGGERED",
            preExecutionReviewTrigger="OPERATOR_EXPLICIT_REQUEST",
            nextRoutineReviewBoundary="PRE_EXECUTION_REVIEW",
        )
        self.assertTrue(chk.diagnose("docs/work_orders/x.md", text).is_clean)

    def test_no_review_admission_rejects_pending_review_status(self):
        text = _VALID_INITIAL_WORK_ORDER.replace(
            "# Example Work Order", "# Example Work Order\n\nStatus: DISPATCH_READY_PENDING_INDEPENDENT_REVIEW"
        )
        d = chk.diagnose("docs/work_orders/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("packet language requires" in issue for issue in d.issues))

    def test_no_review_admission_rejects_prose_micro_checkpoint(self):
        text = _VALID_INITIAL_WORK_ORDER + (
            "\nIndependent packet review is required before worker execution.\n"
        )
        d = chk.diagnose("docs/work_orders/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("packet language requires" in issue for issue in d.issues))

    def test_reviewer_must_not_recreate_implementation(self):
        text = _VALID_INITIAL_WORK_ORDER.replace(
            "reviewerWorkBoundary: EVALUATE_RETURNED_EVIDENCE_NOT_RECREATE_IMPLEMENTATION",
            "reviewerWorkBoundary: REBUILD_WORKER_IMPLEMENTATION",
        )
        d = chk.diagnose("docs/work_orders/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("reviewerWorkBoundary" in issue for issue in d.issues))


class WorkerReturnConvergenceTests(unittest.TestCase):
    def test_rework_without_reviewer_local_route_is_blocked(self):
        text = _VALID_REWORK.replace(
            "reviewerLocalRepairBoundary: NEW_EVIDENCE_REQUIRED\n", ""
        ).replace(
            "reviewerLocalRepairBasis: Finding F1 requires new source evidence unavailable to the reviewer.\n", ""
        )
        d = chk.diagnose("docs/work_orders/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("reviewerLocalRepairBoundary" in issue for issue in d.issues))
        self.assertTrue(any("reviewerLocalRepairBasis" in issue for issue in d.issues))

    def test_rework_cannot_claim_local_repair_is_ineligible_with_placeholder_basis(self):
        text = _VALID_REWORK.replace(
            "reviewerLocalRepairBasis: Finding F1 requires new source evidence unavailable to the reviewer.",
            "reviewerLocalRepairBasis: FILL_ME",
        )
        d = chk.diagnose("docs/work_orders/x.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("reviewerLocalRepairBasis" in issue for issue in d.issues))

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


# ---- NCR_REVIEW_CONTINUATION_V1: operator-cleared same-scope continuation (synthetic fixtures) ----
_NOW = datetime(2026, 10, 15, 6, 0, tzinfo=timezone.utc)
_DIGEST = "b" * 64
_GRANT_PATH = "docs/reviews/CVF_EXAMPLE_OPERATOR_GRANT_2026-10-15.md"
_ARTIFACTS = [
    "governance/compat/example_owner.py",
    "docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-10-15.md",
    "docs/reviews/evidence/example-worker.json",
]
_EFFECTS = ("providerCalls", "networkCalls", "publicWrites", "deployments", "realDataMutations", "destructiveActions", "productRuntimeStarts")
_DROP = object()
_CLEARED = dict(
    dispatchKind="REWORK", reviewRoundCount="3", reworkGeneration="3", priorFindingSetDigest=_DIGEST,
    dependencyAuditDisposition="COMPLETE_BEFORE_FIRST_REPAIR", reworkFindingDisposition="CONSOLIDATED_ALL_DEPENDENT_FINDINGS",
    regressionGuardDisposition="REQUIRED_AND_PLANNED_FOR_EACH_TARGETED_DEFECT", nextDispatchDisposition="ONE_CONSOLIDATED_REWORK",
    rootCauseClusterId="cluster-lock-identity", consolidatedDefectClassSweep="COMPLETE_BEFORE_REWORK_DISPATCH",
    reviewerLocalRepairBoundary="NEW_EVIDENCE_REQUIRED",
    reviewerLocalRepairBasis="Finding F1 requires new source evidence unavailable to the reviewer.",
)
_EXTERNAL = dict(
    dispatchSurface="EXTERNAL_AGENT_CLI_MCP", usageAvailability="KNOWN_FOR_ADMISSION",
    quotaAdmissionDisposition="ADMITTED_WITHIN_CUMULATIVE_CEILING", cumulativeExternalInvocationCount="1", externalInvocationCeiling="2",
)


def _scope():
    return {
        "objectiveId": "OBJ-EXAMPLE", "acceptanceItems": ["AC-1", "AC-2"], "allowedArtifacts": list(_ARTIFACTS),
        "riskCeiling": "SAME_AS_AUTHORIZED_PARENT", "effectCeilings": {key: 0 for key in _EFFECTS},
        "numericalCeilings": {"workerMinutes": 120, "reviewerMinutes": 40}, "commitOwner": "reviewer-closer",
    }


def _grant(**binding):
    return {
        "schemaVersion": "cvf.reviewDispatchContinuationAuthorization@1.0.0", "decisionOwner": "OPERATOR",
        "operatorInstructionEvidence": "Operator instruction 2026-10-15: continue this same scope.",
        "status": "ACTIVE", "expiresAtUtc": None, "validityDisposition": "UNTIL_REVOKED_OR_SCOPE_CHANGE",
        "binding": {
            "parentAssignmentId": "parent-1", "rootCauseClusterId": "cluster-lock-identity", "reviewRoundCount": 3,
            "reworkGeneration": 3, "priorFindingSetDigest": _DIGEST, "dispatchSurface": "INTERNAL_AGENT",
            "commitMode": "WORKER_MUST_NOT_COMMIT", **binding,
        },
        "scope": _scope(),
    }


def _with(grant, keys, value):
    out = copy.deepcopy(grant)
    node = out
    for key in keys[:-1]:
        node = node[key]
    if value is _DROP:
        del node[keys[-1]]
    else:
        node[keys[-1]] = value
    return out


def _grant_md(grant):
    return "# Example operator grant\n\n```operator-continuation-authorization-json\n" + json.dumps(grant, indent=2) + "\n```\n"


def _ledger(artifacts=_ARTIFACTS):
    ledger = {
        "schemaVersion": "cvf.workOrderAcceptanceLedger@1.0.0",
        "requirements": [{"requirementId": "REQ-1", "mandatory": True, "expectedArtifacts": list(artifacts), "requiredProofIds": ["P-1"]}],
        "proofCatalog": [{"proofId": "P-1", "kind": "ARTIFACT", "locator": "example#1"}],
    }
    return "\n```acceptance-ledger-json\n" + json.dumps(ledger) + "\n```\n"


def _cleared_work_order(path, sha, scope=None, ledger=None, **over):
    return (
        _work_order_block(**{**_CLEARED, **over}) + "Commit mode: WORKER_MUST_NOT_COMMIT\n"
        f"operatorContinuationEvidencePath: {path}\noperatorContinuationEvidenceSha256: {sha}\n\n"
        "```continuation-scope-json\n" + json.dumps(scope or _scope(), indent=2) + "\n```\n"
        + (_ledger() if ledger is None else ledger)
    )


class OperatorClearedContinuationTests(unittest.TestCase):
    """Production diagnostics against isolated synthetic grants; never live consent or effects."""

    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.failures = []
        self.addCleanup(lambda: self.assertEqual(self.failures, []))

    @contextlib.contextmanager
    def sub(self, *label, **labels):
        """Collect per-case failures so plain pytest (no subtests plugin) cannot swallow them."""
        try:
            yield
        except AssertionError as exc:
            self.failures.append(f"{label}{labels}: {exc}")

    def put(self, rel, data):
        target = self.root / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)

    def case(self, grant=None, *, raw=None, claimed=_GRANT_PATH, sha=None, now=_NOW, edit=None, write=True, **work_order):
        data = raw if raw is not None else _grant_md(grant or _grant()).encode("utf-8")
        self.put(_GRANT_PATH, data)
        if write and not re.search(r"\.\.|^/|:", claimed):
            self.put(claimed.replace("\\", "/"), data)
        text = _cleared_work_order(claimed, sha or hashlib.sha256(data).hexdigest(), **work_order)
        return chk.diagnose("docs/work_orders/x.md", edit(text) if edit else text, root=self.root, now=now)

    def assertRejected(self, diagnostic, expected):
        self.assertFalse(diagnostic.is_clean, expected)
        self.assertTrue(any(expected in issue for issue in diagnostic.issues), diagnostic.issues)
        return diagnostic

    def test_valid_cleared_round_three_with_honest_none_is_clean(self):
        d = self.case()
        self.assertTrue(d.applicable and d.is_clean, d.issues)
        self.assertTrue(self.case(_grant(reviewRoundCount=2, reworkGeneration=2), reviewRoundCount="2", reworkGeneration="2").is_clean)

    def test_numeric_text_binding_scalars_remain_strings(self):
        cases = [
            (_grant(priorFindingSetDigest="1" * 64), dict(priorFindingSetDigest="1" * 64)),
            (_grant(rootCauseClusterId="00456"), dict(rootCauseClusterId="00456")),
            (_grant(parentAssignmentId="00123"), dict(edit=lambda text: text.replace("parentAssignmentId: parent-1", "parentAssignmentId: 00123"))),
        ]
        for grant, fields in cases:
            diagnostic = self.case(grant, **fields)
            self.assertTrue(diagnostic.is_clean, diagnostic.issues)

    def test_valid_timed_and_external_variants_are_clean(self):
        timed = _with(_with(_grant(), ("validityDisposition",), "UNTIL_UTC_EXPIRY"), ("expiresAtUtc",), "2026-10-16T00:00:00Z")
        self.assertTrue(self.case(timed).is_clean)
        external = _grant(dispatchSurface="EXTERNAL_AGENT_CLI_MCP")
        external["scope"]["numericalCeilings"]["externalInvocationCeiling"] = 2
        self.assertTrue(self.case(external, scope=external["scope"], **_EXTERNAL).is_clean)

    def test_default_stops_are_unchanged_without_a_declaration(self):
        def legacy(text):
            return re.sub(r"(?m)^operatorContinuation.*\n", "", text).replace("continuation-scope-json", "json")

        self.assertRejected(self.case(edit=legacy), "operator escalation")
        self.assertRejected(self.case(_grant(reviewRoundCount=2, reworkGeneration=2), reviewRoundCount="2", reworkGeneration="2", edit=legacy), "critical evidence IDs")

    def test_hostile_grant_sources_are_rejected_without_ordinary_fallback(self):
        good = _grant_md(_grant())
        cases = {
            "missing source": dict(claimed="docs/reviews/CVF_MISSING_2026-10-15.md", write=False, expected="source rejected"),
            "hash mismatch": dict(sha="0" * 64, expected="sha256 mismatch"),
            "uppercase hash": dict(sha="A" * 64, expected="lowercase 64-hex"),
            "not utf8": dict(raw=b"\xff\xfe\x00bad", expected="invalid"),
            "no fence": dict(raw=b"# no grant here\n", expected="exactly one"),
            "two fences": dict(raw=(good + good).encode(), expected="exactly one"),
            "bad json": dict(raw=good.replace('"status": "ACTIVE"', '"status": ').encode(), expected="invalid"),
            "duplicate top key": dict(raw=good.replace('"status": "ACTIVE",', '"status": "ACTIVE", "status": "ACTIVE",').encode(), expected="duplicate JSON key"),
            "duplicate nested key": dict(raw=good.replace('"reviewRoundCount": 3,', '"reviewRoundCount": 3, "reviewRoundCount": 3,').encode(), expected="duplicate JSON key"),
            "non finite": dict(raw=good.replace('"expiresAtUtc": null', '"expiresAtUtc": NaN').encode(), expected="non-finite"),
            "oversize": dict(raw=(good + "x" * 70000).encode(), expected="exceeds"),
            "tilde grant fence": dict(raw=good.replace("```operator-continuation-authorization-json", "~~~operator-continuation-authorization-json").encode(), expected="exactly one"),
            "four backtick fence": dict(raw=good.replace("```operator-continuation-authorization-json", "````operator-continuation-authorization-json").encode(), expected="exactly one"),
            "archive path": dict(claimed="docs/reviews/archive/grant.md", expected="safe non-archive"),
            "wrong prefix": dict(claimed="docs/work_orders/grant.md", expected="safe non-archive"),
            "not markdown": dict(claimed="docs/reviews/grant.txt", expected="safe non-archive"),
            "backslash": dict(claimed="docs\\reviews\\grant.md", expected="safe non-archive"),
            "absolute": dict(claimed="/docs/reviews/grant.md", expected="safe non-archive"),
            "drive": dict(claimed="C:/docs/reviews/grant.md", expected="safe non-archive"),
            "dot segment": dict(claimed="./docs/reviews/grant.md", expected="safe non-archive"),
            "traversal": dict(claimed="docs/reviews/../reviews/grant.md", expected="safe non-archive"),
            "empty segment": dict(claimed="docs/reviews//grant.md", expected="safe non-archive"),
            "whitespace": dict(claimed="docs/reviews/grant x.md", expected="safe non-archive"),
            "worker writable return": dict(claimed=_ARTIFACTS[1], expected="self-referenced"),
        }
        for name, spec in cases.items():
            with self.sub(name):
                spec = dict(spec)
                expected = spec.pop("expected")
                d = self.assertRejected(self.case(**spec), expected)
                self.assertTrue(any("operator escalation" in issue for issue in d.issues), "invalid grant must not fall back to ordinary automatic mode")

    def test_linked_directory_grant_source_is_rejected(self):
        data = _grant_md(_grant()).encode("utf-8")
        self.put("docs/reviews/real/grant.md", data)
        link, real = self.root / "docs/reviews/linked", self.root / "docs/reviews/real"
        try:
            link.symlink_to(real, target_is_directory=True)
        except (OSError, NotImplementedError):
            junction = ["cmd", "/c", "mklink", "/J", str(link), str(real)]
            if os.name != "nt" or subprocess.run(junction, capture_output=True).returncode != 0:
                self.skipTest("neither a symlink nor a junction can be created here")
        text = _cleared_work_order("docs/reviews/linked/grant.md", hashlib.sha256(data).hexdigest())
        d = chk.diagnose("docs/work_orders/x.md", text, root=self.root, now=_NOW)
        self.assertRejected(d, "operator continuation source rejected")

    def test_hostile_grant_members_and_type_substitutions_are_rejected(self):
        timed = _with(_grant(), ("validityDisposition",), "UNTIL_UTC_EXPIRY")
        cases = [
            (("schemaVersion",), "cvf.other@1.0.0", "schemaVersion"), (("decisionOwner",), "AGENT", "decisionOwner"),
            (("status",), "REVOKED", "status"), (("operatorInstructionEvidence",), "too short", "operatorInstructionEvidence"),
            (("operatorInstructionEvidence",), {"ref": "nested authorization substitute"}, "operatorInstructionEvidence"),
            (("operatorInstructionEvidence",), "TODO fill the operator instruction reference", "operatorInstructionEvidence"),
            (("validityDisposition",), "FOREVER", "validityDisposition"), (("expiresAtUtc",), "2099-01-01T00:00:00Z", "requires expiresAtUtc null"),
            (("extra",), 1, "exactly"), (("scope",), _DROP, "exactly"),
            (("binding", "reviewRoundCount"), "3", "binding.reviewRoundCount"), (("binding", "reviewRoundCount"), True, "binding.reviewRoundCount"),
            (("binding", "reworkGeneration"), 3.0, "binding.reworkGeneration"), (("binding", "priorFindingSetDigest"), "B" * 64, "SHA-256"),
            (("binding", "commitMode"), "WORKER_MAY_COMMIT", "binding.commitMode"), (("binding", "dispatchSurface"), "OTHER", "dispatchSurface"),
            (("binding", "parentAssignmentId"), "other-parent", "does not equal"), (("binding", "rootCauseClusterId"), "other-cluster", "does not equal"),
            (("binding", "reviewRoundCount"), 2, "does not equal"), (("binding", "priorFindingSetDigest"), "c" * 64, "does not equal"),
            (("binding", "dispatchSurface"), "EXTERNAL_AGENT_CLI_MCP", "does not equal"),
            (("scope", "objectiveId"), "TODO", "objectiveId"), (("scope", "acceptanceItems"), [], "acceptanceItems"),
            (("scope", "acceptanceItems"), ["AC-1", "AC-1"], "acceptanceItems"), (("scope", "allowedArtifacts"), [_ARTIFACTS[0], _ARTIFACTS[0]], "allowedArtifacts"),
            (("scope", "allowedArtifacts"), ["../escape.py"], "allowedArtifacts"), (("scope", "riskCeiling"), "HIGHER", "riskCeiling"),
            (("scope", "commitOwner"), "worker", "commitOwner"), (("scope", "effectCeilings", "providerCalls"), True, "effectCeilings"),
            (("scope", "effectCeilings", "networkCalls"), -1, "effectCeilings"), (("scope", "effectCeilings", "extra"), 0, "effectCeilings"),
            (("scope", "numericalCeilings"), {}, "numericalCeilings"), (("scope", "numericalCeilings", "workerMinutes"), 0, "workerMinutes"),
            (("scope", "numericalCeilings", "reviewerMinutes"), _DROP, "reviewerMinutes"), (("scope", "numericalCeilings", "workerMinutes"), 1.5, "numericalCeilings"),
        ]
        for keys, value, expected in cases:
            with self.sub(keys=keys, value=value):
                self.assertRejected(self.case(_with(_grant(), keys, value)), expected)
        for value, expected in (
            (None, "timezone-aware UTC"), ("2026-10-16T00:00:00", "timezone-aware UTC"), ("2026-10-16T07:00:00+07:00", "timezone-aware UTC"),
            ("2026-10-14T00:00:00Z", "expired"), ("2026-10-15T06:00:00Z", "expired"),
        ):
            with self.sub(expires=value):
                self.assertRejected(self.case(_with(timed, ("expiresAtUtc",), value)), expected)

    def test_declaration_cardinality_and_route_restrictions_fail_closed(self):
        cases = {
            "path only": dict(edit=lambda t: re.sub(r"(?m)^operatorContinuationEvidenceSha256.*\n", "", t), expected="exactly one"),
            "sha only": dict(edit=lambda t: re.sub(r"(?m)^operatorContinuationEvidencePath.*\n", "", t), expected="exactly one"),
            "scope only": dict(edit=lambda t: re.sub(r"(?m)^operatorContinuationEvidence.*\n", "", t), expected="exactly one"),
            "no scope": dict(edit=lambda t: t.replace("continuation-scope-json", "json"), expected="exactly one"),
            "tilde scope fence": dict(edit=lambda t: t.replace("```continuation-scope-json", "~~~continuation-scope-json"), expected="exactly one"),
            "empty path": dict(edit=lambda t: re.sub(r"(?m)^(operatorContinuationEvidencePath:).*$", r"\1", t), expected="exactly one"),
            "duplicate path": dict(edit=lambda t: t + f"operatorContinuationEvidencePath: {_GRANT_PATH}\n", expected="exactly one"),
            "duplicate scope": dict(edit=lambda t: t + "\n```continuation-scope-json\n{}\n```\n", expected="exactly one"),
            "initial dispatch": dict(dispatchKind="INITIAL", reviewRoundCount="0", reworkGeneration="0", expected="applies only to REWORK"),
            "rework round one": dict(reviewRoundCount="1", reworkGeneration="1", expected="applies only to REWORK"),
            "generation mismatch": dict(reworkGeneration="2", expected="applies only to REWORK"),
            "ambiguous scalar": dict(edit=lambda t: t + "reviewRoundCount: 3\n", expected="exactly one reviewRoundCount"),
            "conflicting commit mode": dict(edit=lambda t: t + "Commit mode: WORKER_MAY_COMMIT\n", expected="unambiguous Commit mode"),
            "placeholder critical evidence": dict(newIndependentCriticalEvidence="FILL_ME", expected="critical evidence IDs"),
            "no ledger": dict(ledger="\n", expected="valid acceptance ledger"),
            "ledger extra artifact": dict(ledger=_ledger([*_ARTIFACTS, "docs/reviews/extra.md"]), expected="acceptance-ledger"),
            "ledger missing artifact": dict(ledger=_ledger(_ARTIFACTS[:2]), expected="acceptance-ledger"),
            "scope extra artifact": dict(scope={**_scope(), "allowedArtifacts": [*_ARTIFACTS, "docs/reviews/extra.md"]}, expected="type-identical"),
            "scope type substitution": dict(scope={**_scope(), "numericalCeilings": {"workerMinutes": 120.0, "reviewerMinutes": 40}}, expected="type-identical"),
        }
        for name, spec in cases.items():
            with self.sub(name):
                spec = dict(spec)
                expected = spec.pop("expected")
                self.assertRejected(self.case(**spec), expected)

    def test_external_ceiling_and_usage_controls_survive_clearance(self):
        external = _grant(dispatchSurface="EXTERNAL_AGENT_CLI_MCP")
        self.assertRejected(self.case(external, **_EXTERNAL), "externalInvocationCeiling is required")
        external["scope"]["numericalCeilings"]["externalInvocationCeiling"] = 3
        self.assertRejected(self.case(external, scope=external["scope"], **_EXTERNAL), "must equal the work-order ceiling")
        external["scope"]["numericalCeilings"]["externalInvocationCeiling"] = 2
        for over, expected in (
            (dict(cumulativeExternalInvocationCount="2"), "cumulativeExternalInvocationCount <"),
            (dict(usageAvailability="UNKNOWN"), "KNOWN_FOR_ADMISSION"),
        ):
            with self.sub(over=over):
                self.assertRejected(self.case(external, scope=external["scope"], **{**_EXTERNAL, **over}), expected)

    def _completion(self, *, round_="3", stop="COMPLETE_REVIEW", roots="0", wo_round="3", wo_rel="docs/work_orders/CVF_EXAMPLE_ORDER_2026-10-15.md",
                    claimed=None, sha=None, link="both", legacy=False, expires=None, now=_NOW, path="docs/reviews/CVF_EXAMPLE_COMPLETION_2026-10-15.md"):
        grant = _grant(reviewRoundCount=int(wo_round), reworkGeneration=int(wo_round))
        if expires:
            grant = _with(_with(grant, ("validityDisposition",), "UNTIL_UTC_EXPIRY"), ("expiresAtUtc",), expires)
        data = _grant_md(grant).encode("utf-8")
        self.put(_GRANT_PATH, data)
        order = _work_order_block() if legacy else _cleared_work_order(_GRANT_PATH, hashlib.sha256(data).hexdigest(), reviewRoundCount=wo_round, reworkGeneration=wo_round)
        self.put(wo_rel, order.encode("utf-8"))
        fields = {
            "both": f"continuationWorkOrderPath: {claimed or wo_rel}\ncontinuationWorkOrderSha256: {sha or hashlib.sha256(order.encode()).hexdigest()}\n",
            "path only": f"continuationWorkOrderPath: {wo_rel}\n", "none": "",
        }[link]
        text = _HEADER + _telemetry_block(reviewRoundCount=round_, newRootCauseCountThisRound=roots, stopDisposition=stop) + fields
        return chk.diagnose(path, text, root=self.root, now=now)

    def test_linked_completion_permits_only_existing_tokens_at_cleared_boundary(self):
        for kwargs in (dict(), dict(stop="CONSOLIDATE_SINGLE_REPAIR"), dict(round_="2", wo_round="2", stop="CONSOLIDATE_SINGLE_REPAIR"),
                       dict(round_="4", wo_round="4"), dict(stop="REVIEW_COST_ESCALATION_REQUIRED")):
            with self.sub(kwargs):
                d = self._completion(**kwargs)
                self.assertTrue(d.is_clean, d.issues)
        self.assertRejected(self._completion(stop="PARK_LOW_INCREMENTAL_VALUE"), "reviewRoundCount >= 3")
        self.assertRejected(self._completion(stop="CONTINUE_NEW_CRITICAL_EVIDENCE"), "`CONTINUE_NEW_CRITICAL_EVIDENCE` requires")
        self.assertTrue(self._completion(stop="CONTINUE_NEW_CRITICAL_EVIDENCE", roots="1").is_clean)

    def test_completion_without_valid_link_keeps_round_and_root_restrictions(self):
        cases = {
            "no link": (dict(link="none"), None), "one sided": (dict(link="path only"), "invalid continuation work-order binding"),
            "wrong sha": (dict(sha="0" * 64), "sha256 mismatch"), "uppercase sha": (dict(sha="A" * 64), "sha256 mismatch"),
            "round mismatch": (dict(round_="4"), "must equal the referenced work order round"),
            "legacy order": (dict(legacy=True), "not a valid operator-cleared dispatch"),
            "outside work orders": (dict(claimed=_GRANT_PATH), "docs/work_orders"),
            "traversal": (dict(claimed="docs/work_orders/../reviews/x.md"), "docs/work_orders"),
            "archive": (dict(claimed="docs/work_orders/archive/x.md"), "docs/work_orders"),
            "missing order": (dict(claimed="docs/work_orders/CVF_MISSING_2026-10-15.md"), "invalid continuation"),
            "expired grant": (dict(expires="2026-10-16T00:00:00Z", now=datetime(2026, 10, 17, tzinfo=timezone.utc)), "not a valid operator-cleared dispatch"),
            "authorization cycle": (dict(path=_GRANT_PATH), "authorization cycle"),
        }
        for name, (kwargs, expected) in cases.items():
            with self.sub(name):
                d = self.assertRejected(self._completion(**kwargs), expected or "reviewRoundCount >= 3")
                self.assertTrue(any("reviewRoundCount >= 3" in issue for issue in d.issues), "round restriction must be retained")
        self.assertRejected(self._completion(round_="2", wo_round="2", stop="CONSOLIDATE_SINGLE_REPAIR", link="none"), "independent root cause")


if __name__ == "__main__":
    unittest.main()
