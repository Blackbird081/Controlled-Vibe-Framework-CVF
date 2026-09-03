#!/usr/bin/env python3
"""Local-only convergence envelope support for dispatch packet scaffolds."""

from __future__ import annotations

import argparse
import re
from typing import Any


def add_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--dispatch-kind", choices=("INITIAL", "REWORK"), default="INITIAL")
    parser.add_argument(
        "--dispatch-surface",
        choices=("INTERNAL_AGENT", "EXTERNAL_AGENT_CLI_MCP"),
        default="INTERNAL_AGENT",
    )
    parser.add_argument("--review-round-count", type=int, default=0)
    parser.add_argument("--root-cause-cluster-id", default="NOT_APPLICABLE_INITIAL_DISPATCH")
    parser.add_argument("--prior-finding-set-digest", default="NOT_APPLICABLE_INITIAL_DISPATCH")
    parser.add_argument("--cumulative-external-invocation-count", type=int, default=0)
    parser.add_argument("--external-invocation-ceiling", type=int, default=0)
    parser.add_argument("--new-independent-critical-evidence", default="NONE")


def validate(args: Any) -> str | None:
    if args.dispatch_kind == "INITIAL" and (
        args.review_round_count != 0
        or args.root_cause_cluster_id != "NOT_APPLICABLE_INITIAL_DISPATCH"
        or args.prior_finding_set_digest != "NOT_APPLICABLE_INITIAL_DISPATCH"
    ):
        return "INITIAL dispatch requires round zero and initial sentinel values."
    if args.dispatch_kind == "REWORK" and (
        args.review_round_count < 1
        or args.review_round_count >= 3
        or args.root_cause_cluster_id == "NOT_APPLICABLE_INITIAL_DISPATCH"
        or not re.fullmatch(r"[0-9a-f]{64}", args.prior_finding_set_digest)
    ):
        return "REWORK requires round 1-2, a root-cause cluster ID, and a lowercase SHA-256 digest."
    if (
        args.dispatch_kind == "REWORK"
        and args.review_round_count >= 2
        and args.new_independent_critical_evidence == "NONE"
    ):
        return "round-two REWORK requires exact new critical evidence IDs."
    if (
        args.dispatch_surface == "EXTERNAL_AGENT_CLI_MCP"
        and args.cumulative_external_invocation_count >= args.external_invocation_ceiling
    ):
        return "external dispatch requires cumulative invocation count below ceiling."
    return None


def kwargs(args: Any) -> dict[str, Any]:
    return {
        "dispatch_kind": args.dispatch_kind,
        "dispatch_surface": args.dispatch_surface,
        "review_round_count": args.review_round_count,
        "root_cause_cluster_id": args.root_cause_cluster_id,
        "prior_finding_set_digest": args.prior_finding_set_digest,
        "cumulative_external_invocation_count": args.cumulative_external_invocation_count,
        "external_invocation_ceiling": args.external_invocation_ceiling,
        "new_independent_critical_evidence": args.new_independent_critical_evidence,
    }


def provenance_flags(args: Any) -> str:
    parts: list[str] = []
    if args.dispatch_kind != "INITIAL":
        parts.extend((f" --dispatch-kind {args.dispatch_kind}", f" --review-round-count {args.review_round_count}"))
        parts.extend((f" --root-cause-cluster-id {args.root_cause_cluster_id}", f" --prior-finding-set-digest {args.prior_finding_set_digest}"))
    if args.dispatch_surface != "INTERNAL_AGENT":
        parts.extend((f" --dispatch-surface {args.dispatch_surface}", f" --cumulative-external-invocation-count {args.cumulative_external_invocation_count}"))
        parts.append(f" --external-invocation-ceiling {args.external_invocation_ceiling}")
    if args.new_independent_critical_evidence != "NONE":
        parts.append(f" --new-independent-critical-evidence {args.new_independent_critical_evidence}")
    return "".join(parts)


def build_provenance_block(args: Any) -> str:
    command = (
        "python governance/compat/build_dispatch_packet_scaffold.py"
        f" --packet-kind {args.packet_kind} --batch-id {args.batch_id}"
        f' --title "{args.title}" --date {args.date} --base {args.base}'
        f" --commit-mode {args.commit_mode}"
    )
    if args.include_worker_return_skeleton:
        command += " --include-worker-return-skeleton"
    command += provenance_flags(args) + " --stdout"
    return (
        "## Scaffold Provenance Block\n\n| Field | Value |\n| --- | --- |\n"
        f"| scaffoldHelperCommand | `{command}` |\n"
        f"| generatedProfile | {args.packet_kind} plus {args.commit_mode} no-commit worker profile |\n"
        "| generatedSkeletonStatus | USED_AS_STARTING_POINT |\n"
        "| manualEditsAfterScaffold | FILL_ME (describe manual edits made after scaffold generation) |\n"
        "| checkerReadAheadConfirmation | FILL_ME (list `governance/compat/check_*.py` paths read before authoring) |\n"
        "| docOnlyNewFields | FILL_ME (list new doc-only field names introduced by this dispatch) |\n"
        "| claimBoundary | Dispatch authoring provenance only; no runtime/provider/live/public/Web/MCP/model-router behavior claim. |\n"
    )


def build_block(args: Any) -> str:
    initial = args.dispatch_kind == "INITIAL"
    dependency = "COMPLETE_INITIAL_ACCEPTANCE_MATRIX" if initial else "COMPLETE_BEFORE_FIRST_REPAIR"
    rework = "NOT_APPLICABLE_INITIAL_DISPATCH" if initial else "CONSOLIDATED_ALL_DEPENDENT_FINDINGS"
    regression = "BASELINE_NEGATIVE_TESTS_PLANNED" if initial else "REQUIRED_AND_PLANNED_FOR_EACH_TARGETED_DEFECT"
    next_dispatch = "INITIAL_DISPATCH" if initial else "ONE_CONSOLIDATED_REWORK"
    sweep = "COMPLETE_INITIAL_ACCEPTANCE_MATRIX" if initial else "COMPLETE_BEFORE_REWORK_DISPATCH"
    internal = args.dispatch_surface == "INTERNAL_AGENT"
    usage = "NOT_APPLICABLE_INTERNAL_AGENT" if internal else "KNOWN_FOR_ADMISSION"
    quota = "NOT_APPLICABLE_INTERNAL_AGENT" if internal else "ADMITTED_WITHIN_CUMULATIVE_CEILING"
    fields = (
        ("dispatchKind", args.dispatch_kind), ("dispatchSurface", args.dispatch_surface),
        ("parentAssignmentId", args.batch_id), ("reviewRoundCount", args.review_round_count),
        ("priorFindingSetDigest", args.prior_finding_set_digest),
        ("dependencyAuditDisposition", dependency), ("reworkFindingDisposition", rework),
        ("newIndependentCriticalEvidence", args.new_independent_critical_evidence),
        ("regressionGuardDisposition", regression),
        ("cumulativeExternalInvocationCount", args.cumulative_external_invocation_count),
        ("externalInvocationCeiling", args.external_invocation_ceiling),
        ("usageAvailability", usage), ("quotaAdmissionDisposition", quota),
        ("nextDispatchDisposition", next_dispatch), ("rootCauseClusterId", args.root_cause_cluster_id),
        ("reworkGeneration", args.review_round_count), ("consolidatedDefectClassSweep", sweep),
        ("successorTrancheOpened", "NO"),
        ("implementationAutonomyDisposition", "CONTRACT_AUTHORITY_EVIDENCE_OUTCOME_ONLY"),
        ("preExecutionReviewAdmission", "NOT_REQUIRED_BEFORE_EXECUTION"),
        ("preExecutionReviewTrigger", "NONE"),
        ("nextRoutineReviewBoundary", "WORKER_RETURN"),
        ("reviewerWorkBoundary", "EVALUATE_RETURNED_EVIDENCE_NOT_RECREATE_IMPLEMENTATION"),
    )
    body = "\n".join(f"{name}: {value}" for name, value in fields)
    return "## Review Dispatch Convergence And Invocation Budget Control\n\nReview-Dispatch Convergence Control: REQUIRED\n\n" + body + "\n"
