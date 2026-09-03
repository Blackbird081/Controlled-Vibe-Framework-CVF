#!/usr/bin/env python3
"""
CVF Review Cost And Diminishing Return Control Checker (SOT3-RCS-T1).

Enforces the forward-only evidence-shape contract defined by
docs/reference/review_cost_control/CVF_REVIEW_COST_AND_DIMINISHING_RETURN_CONTROL_STANDARD.md
on every changed docs/reviews/*.md artifact declaring
`docType: completion_review`; that artifact must also carry the exact
standalone declaration `Review-Cost Telemetry: REQUIRED`. It also enforces a
pre-dispatch convergence and cumulative-invocation interlock on every changed
docs/work_orders/*.md artifact declaring `docType: work_order`, plus the
bounded convergence/self-proof envelope of changed self-declared worker
returns.

This checker is intentionally narrow. It validates field presence, value
shape, controlled tokens, the round-three escalation rule, and the multi-commit
exception reason.
It never scores semantic review quality, root-cause independence, or value
delta; those remain reviewer judgment. Applicability is artifact-shape based,
not bare-substring based. Standards, tests, archived artifacts, and unchanged
historical artifacts do not trigger the gate. Implementation mechanics and
reasoning traces remain outside its jurisdiction.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
THIS_CHECKER_PATH = "governance/compat/check_review_cost_control.py"

ELIGIBLE_PREFIX = "docs/reviews/"
WORK_ORDER_PREFIX = "docs/work_orders/"
DECLARATION_LINE_RE = re.compile(r"(?m)^Review-Cost Telemetry:\s*REQUIRED\s*$")
COMPLETION_REVIEW_RE = re.compile(r"(?mi)^docType:\s*completion_review\s*$")
WORK_ORDER_RE = re.compile(r"(?mi)^docType:\s*work_order\s*$")
WORKER_RETURN_RE = re.compile(
    r"(?mi)^Self-declared worker-return artifact:\s*yes\s*$"
)
DISPATCH_DECLARATION_LINE_RE = re.compile(
    r"(?m)^Review-Dispatch Convergence Control:\s*REQUIRED\s*$"
)

REQUIRED_INTEGER_FIELDS = (
    "reviewRoundCount",
    "workerRepairTurnCount",
    "newRootCauseCountThisRound",
    "dependentFindingCountThisRound",
    "providerCallCount",
    "materialCommitCount",
    "continuityCommitCount",
)
UNAVAILABLE_ALLOWED_FIELDS = (
    "elapsedReviewMinutes",
    "tokenOrQuotaUsage",
)
NARRATIVE_FIELD = "valueDelta"
STOP_FIELD = "stopDisposition"
AUDIT_FIELD = "preRepairAuditDisposition"
COMMIT_PLAN_FIELD = "commitPlanDisposition"
LATENCY_FIELD = "latencyDisposition"
DELAY_FIELD = "avoidableDelayClass"

WORK_ORDER_FIELDS = (
    "dispatchKind",
    "dispatchSurface",
    "parentAssignmentId",
    "reviewRoundCount",
    "priorFindingSetDigest",
    "dependencyAuditDisposition",
    "reworkFindingDisposition",
    "newIndependentCriticalEvidence",
    "regressionGuardDisposition",
    "cumulativeExternalInvocationCount",
    "externalInvocationCeiling",
    "usageAvailability",
    "quotaAdmissionDisposition",
    "nextDispatchDisposition",
    "rootCauseClusterId",
    "reworkGeneration",
    "consolidatedDefectClassSweep",
    "successorTrancheOpened",
    "implementationAutonomyDisposition",
    "preExecutionReviewAdmission",
    "preExecutionReviewTrigger",
    "nextRoutineReviewBoundary",
    "reviewerWorkBoundary",
)

WORKER_RETURN_FIELDS = (
    "rootCauseClusterId",
    "reworkGeneration",
    "consolidatedDefectClassSweep",
    "productionBindingEvidence",
    "adversarialRegressionDisposition",
    "successorTrancheOpened",
    "implementationAutonomyDisposition",
    "internalAgentInvocationCount",
    "externalAgentInvocationCount",
    "providerCallCount",
    "tokenOrQuotaUsage",
    "terminalReadinessVerdict",
)

ALL_FIELDS = REQUIRED_INTEGER_FIELDS + UNAVAILABLE_ALLOWED_FIELDS + (
    NARRATIVE_FIELD,
    STOP_FIELD,
    AUDIT_FIELD,
    COMMIT_PLAN_FIELD,
    LATENCY_FIELD,
    DELAY_FIELD,
)

ALLOWED_STOP_TOKENS = (
    "CONTINUE_NEW_CRITICAL_EVIDENCE",
    "CONSOLIDATE_SINGLE_REPAIR",
    "PARK_LOW_INCREMENTAL_VALUE",
    "COMPLETE_REVIEW",
    "REVIEW_COST_ESCALATION_REQUIRED",
)
ROUND_THREE_ALLOWED_TOKENS = (
    "REVIEW_COST_ESCALATION_REQUIRED",
    "CONTINUE_NEW_CRITICAL_EVIDENCE",
)
UNAVAILABLE_PREFIX = "NOT_AVAILABLE_WITH_REASON"

ALLOWED_AUDIT_TOKENS = (
    "COMPLETE_BEFORE_FIRST_REPAIR",
    "NO_REPAIR_REQUIRED",
    "BLOCKED_REVIEW_MATRIX_INCOMPLETE",
)
ALLOWED_COMMIT_PLAN_TOKENS = (
    "DEFAULT_ONE_MATERIAL_ONE_CONTINUITY",
    "MATERIAL_ONLY",
    "NO_COMMIT_REVIEW",
    "CONTINUITY_ONLY",
)
COMMIT_EXCEPTION_PREFIX = "EXCEPTION_WITH_REASON"
ALLOWED_LATENCY_TOKENS = (
    "WITHIN_FAST_PATH_TARGET",
    "EXPECTED_LONG_RUNNING_PROOF",
    "EXTERNAL_WAIT",
)
LATENCY_REASON_PREFIXES = (
    "NOT_MEASURED_WITH_REASON",
    "LATENCY_BUDGET_EXCEEDED_WITH_REASON",
)
ALLOWED_DELAY_TOKENS = (
    "NONE",
    "SEQUENTIAL_FINDING_CASCADE",
    "PREMATURE_COMMIT",
    "RANGE_RECOMPUTATION",
    "GATE_DISCOVERY_LOOP",
    "WORKTREE_CHURN",
    "MULTIPLE_AVOIDABLE_DELAYS",
)

ALLOWED_PRE_EXECUTION_REVIEW_ADMISSIONS = (
    "NOT_REQUIRED_BEFORE_EXECUTION",
    "REQUIRED_TRIGGERED",
)
ALLOWED_PRE_EXECUTION_REVIEW_TRIGGERS = (
    "NONE",
    "FROZEN_IDENTITY_MISMATCH",
    "SOURCE_AUTHORITY_CONTRADICTION",
    "NEW_INDEPENDENT_CRITICAL_RISK",
    "AUTHORITY_SCOPE_EXPANSION",
    "MATERIAL_UNCLASSIFIED",
    "OPERATOR_EXPLICIT_REQUEST",
)
ALLOWED_NEXT_ROUTINE_REVIEW_BOUNDARIES = (
    "WORKER_RETURN",
    "TERMINAL_RESULT",
    "PRE_EXECUTION_REVIEW",
)
REVIEWER_WORK_BOUNDARY = "EVALUATE_RETURNED_EVIDENCE_NOT_RECREATE_IMPLEMENTATION"
PRE_EXECUTION_REVIEW_LANGUAGE_RE = re.compile(
    r"(?i)(?:pending(?:[ _]+)independent(?:[ _]+)review|independent (?:packet )?review[^\n]{0,100}"
    r"required before (?:worker )?execution|independent acceptance[^\n]{0,100}"
    r"required before (?:worker )?execution)"
)

FIELD_VALUE_RE_TEMPLATE = r"(?m)^[ \t]*(?:[-*][ \t]+)?`?{field}`?:[ \t]*(.+)$"


@dataclass(frozen=True)
class Diagnostic:
    path: str
    applicable: bool
    issues: tuple[str, ...] = field(default_factory=tuple)

    @property
    def is_clean(self) -> bool:
        return not self.applicable or not self.issues


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _normalize(path: str) -> str:
    return path.replace("\\", "/").strip()


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _changed_md_paths(base: str, head: str) -> tuple[str, ...]:
    paths: set[str] = set()
    if base and head:
        code, out, _ = _run_git(["diff", "--name-only", f"{base}..{head}"])
        if code == 0 and out:
            paths.update(_normalize(p) for p in out.splitlines() if p.strip())
    code, out, _ = _run_git(["diff", "--name-only"])
    if code == 0 and out:
        paths.update(_normalize(p) for p in out.splitlines() if p.strip())
    code, out, _ = _run_git(["diff", "--name-only", "--cached"])
    if code == 0 and out:
        paths.update(_normalize(p) for p in out.splitlines() if p.strip())
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        paths.update(_normalize(p) for p in out.splitlines() if p.strip())
    return tuple(sorted(p for p in paths if p.endswith(".md")))


def _read(path: str) -> str:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _strip_code_fences(text: str) -> str:
    return re.sub(r"```.*?```", "", text, flags=re.S)


def _has_real_declaration(text: str) -> bool:
    """A real declaration is an exact standalone line outside a code fence
    and not wrapped in backticks. A backtick-wrapped mention (as used in
    standards/work orders to cite the token) never counts."""
    stripped = _strip_code_fences(text)
    for line in stripped.splitlines():
        if DECLARATION_LINE_RE.match(line.strip()) and "`" not in line:
            return True
    return False


def _has_dispatch_declaration(text: str) -> bool:
    stripped = _strip_code_fences(text)
    return any(
        DISPATCH_DECLARATION_LINE_RE.match(line.strip()) and "`" not in line
        for line in stripped.splitlines()
    )


def is_applicable(path: str, text: str) -> bool:
    normalized = _normalize(path)
    if not normalized.startswith(ELIGIBLE_PREFIX) or not normalized.endswith(".md"):
        return False
    if "/archive/" in normalized:
        return False
    if normalized == THIS_CHECKER_PATH:
        return False
    return bool(COMPLETION_REVIEW_RE.search(_strip_code_fences(text)))


def is_work_order_applicable(path: str, text: str) -> bool:
    normalized = _normalize(path)
    if not normalized.startswith(WORK_ORDER_PREFIX) or not normalized.endswith(".md"):
        return False
    if "/archive/" in normalized:
        return False
    return bool(WORK_ORDER_RE.search(_strip_code_fences(text)))


def is_worker_return_applicable(path: str, text: str) -> bool:
    normalized = _normalize(path)
    if not normalized.startswith(ELIGIBLE_PREFIX) or not normalized.endswith(".md"):
        return False
    if "/archive/" in normalized:
        return False
    return bool(WORKER_RETURN_RE.search(_strip_code_fences(text)))


def _field_value(text: str, field_name: str) -> str | None:
    pattern = re.compile(FIELD_VALUE_RE_TEMPLATE.format(field=re.escape(field_name)))
    match = pattern.search(text)
    if not match:
        return None
    return match.group(1).strip().rstrip("|").strip(" `")


def _is_non_negative_integer(value: str) -> bool:
    return bool(re.fullmatch(r"\d+", value))


def _has_reason(value: str, prefix: str) -> bool:
    return bool(re.fullmatch(rf"{re.escape(prefix)}:\s*\S.*", value))


def diagnose(path: str, text: str) -> Diagnostic:
    if is_work_order_applicable(path, text):
        return diagnose_work_order(path, text)
    if is_worker_return_applicable(path, text):
        return diagnose_worker_return(path, text)
    if not is_applicable(path, text):
        return Diagnostic(path=path, applicable=False)

    issues: list[str] = []
    if not _has_real_declaration(text):
        issues.append("missing exact standalone declaration `Review-Cost Telemetry: REQUIRED`")
    values: dict[str, str] = {}
    for field_name in ALL_FIELDS:
        value = _field_value(text, field_name)
        if value is None or value == "":
            issues.append(f"missing required field `{field_name}`")
            continue
        values[field_name] = value

    for field_name in REQUIRED_INTEGER_FIELDS:
        value = values.get(field_name)
        if value is not None and not _is_non_negative_integer(value):
            issues.append(
                f"field `{field_name}` must be a non-negative integer, got `{value}`"
            )

    for field_name in UNAVAILABLE_ALLOWED_FIELDS:
        value = values.get(field_name)
        if value is not None and not _is_non_negative_integer(value):
            if not re.fullmatch(rf"{UNAVAILABLE_PREFIX}:\s*\S.*", value):
                issues.append(
                    f"field `{field_name}` must be a non-negative integer or "
                    f"`{UNAVAILABLE_PREFIX}` followed by a reason, got `{value}`"
                )

    narrative_value = values.get(NARRATIVE_FIELD)
    if narrative_value is not None:
        if _is_non_negative_integer(narrative_value):
            issues.append(
                f"field `{NARRATIVE_FIELD}` must be a non-empty reviewer statement, "
                "not a bare number"
            )

    stop_value = values.get(STOP_FIELD)
    review_round_value = values.get("reviewRoundCount")
    if stop_value is not None:
        if stop_value not in ALLOWED_STOP_TOKENS:
            issues.append(
                f"field `{STOP_FIELD}` must be one of {ALLOWED_STOP_TOKENS}, got `{stop_value}`"
            )
        elif (
            review_round_value is not None
            and _is_non_negative_integer(review_round_value)
            and int(review_round_value) >= 3
            and stop_value not in ROUND_THREE_ALLOWED_TOKENS
        ):
            issues.append(
                f"reviewRoundCount >= 3 requires `{STOP_FIELD}` to be one of "
                f"{ROUND_THREE_ALLOWED_TOKENS}, got `{stop_value}`"
            )
        elif stop_value == "CONTINUE_NEW_CRITICAL_EVIDENCE":
            root_count = values.get("newRootCauseCountThisRound")
            if root_count is not None and _is_non_negative_integer(root_count) and int(root_count) == 0:
                issues.append(
                    "`CONTINUE_NEW_CRITICAL_EVIDENCE` requires "
                    "`newRootCauseCountThisRound` > 0"
                )
        elif (
            stop_value == "CONSOLIDATE_SINGLE_REPAIR"
            and review_round_value is not None
            and _is_non_negative_integer(review_round_value)
            and int(review_round_value) >= 2
        ):
            root_count = values.get("newRootCauseCountThisRound")
            if root_count is not None and _is_non_negative_integer(root_count) and int(root_count) == 0:
                issues.append(
                    "reviewRoundCount >= 2 cannot open another consolidated repair "
                    "without a new independent root cause"
                )

    audit_value = values.get(AUDIT_FIELD)
    if audit_value is not None and audit_value not in ALLOWED_AUDIT_TOKENS:
        issues.append(
            f"field `{AUDIT_FIELD}` must be one of {ALLOWED_AUDIT_TOKENS}, got `{audit_value}`"
        )

    commit_plan_value = values.get(COMMIT_PLAN_FIELD)
    commit_plan_valid = commit_plan_value in ALLOWED_COMMIT_PLAN_TOKENS
    if commit_plan_value is not None and not commit_plan_valid:
        commit_plan_valid = _has_reason(commit_plan_value, COMMIT_EXCEPTION_PREFIX)
        if not commit_plan_valid:
            issues.append(
                f"field `{COMMIT_PLAN_FIELD}` must be one of {ALLOWED_COMMIT_PLAN_TOKENS} "
                f"or `{COMMIT_EXCEPTION_PREFIX}` followed by a reason, got `{commit_plan_value}`"
            )

    latency_value = values.get(LATENCY_FIELD)
    if latency_value is not None and latency_value not in ALLOWED_LATENCY_TOKENS:
        if not any(_has_reason(latency_value, prefix) for prefix in LATENCY_REASON_PREFIXES):
            issues.append(
                f"field `{LATENCY_FIELD}` must be one of {ALLOWED_LATENCY_TOKENS} or a "
                f"reason-bearing token from {LATENCY_REASON_PREFIXES}, got `{latency_value}`"
            )

    delay_value = values.get(DELAY_FIELD)
    if delay_value is not None and delay_value not in ALLOWED_DELAY_TOKENS:
        issues.append(
            f"field `{DELAY_FIELD}` must be one of {ALLOWED_DELAY_TOKENS}, got `{delay_value}`"
        )

    material_count = values.get("materialCommitCount")
    continuity_count = values.get("continuityCommitCount")
    excessive_commits = any(
        value is not None and _is_non_negative_integer(value) and int(value) > 1
        for value in (material_count, continuity_count)
    )
    if excessive_commits and (
        commit_plan_value is None
        or not _has_reason(commit_plan_value, COMMIT_EXCEPTION_PREFIX)
    ):
        issues.append(
            "materialCommitCount or continuityCommitCount > 1 requires "
            f"`{COMMIT_PLAN_FIELD}` to use `{COMMIT_EXCEPTION_PREFIX}: <reason>`"
        )

    return Diagnostic(path=path, applicable=True, issues=tuple(issues))


def diagnose_work_order(path: str, text: str) -> Diagnostic:
    issues: list[str] = []
    if not _has_dispatch_declaration(text):
        issues.append(
            "missing exact standalone declaration "
            "`Review-Dispatch Convergence Control: REQUIRED`"
        )
    values: dict[str, str] = {}
    for field_name in WORK_ORDER_FIELDS:
        value = _field_value(text, field_name)
        if value is None or value == "":
            issues.append(f"missing required review-dispatch field `{field_name}`")
        else:
            values[field_name] = value

    integer_fields = (
        "reviewRoundCount",
        "reworkGeneration",
        "cumulativeExternalInvocationCount",
        "externalInvocationCeiling",
    )
    for field_name in integer_fields:
        value = values.get(field_name)
        if value is not None and not _is_non_negative_integer(value):
            issues.append(f"field `{field_name}` must be a non-negative integer, got `{value}`")

    dispatch_kind = values.get("dispatchKind")
    dispatch_surface = values.get("dispatchSurface")
    review_round = values.get("reviewRoundCount")
    round_number = int(review_round) if review_round and _is_non_negative_integer(review_round) else None
    rework_generation = values.get("reworkGeneration")
    generation_number = int(rework_generation) if rework_generation and _is_non_negative_integer(rework_generation) else None

    if values.get("successorTrancheOpened") != "NO":
        issues.append("pre-dispatch packets require `successorTrancheOpened: NO`")
    if values.get("implementationAutonomyDisposition") != "CONTRACT_AUTHORITY_EVIDENCE_OUTCOME_ONLY":
        issues.append(
            "`implementationAutonomyDisposition` must be "
            "`CONTRACT_AUTHORITY_EVIDENCE_OUTCOME_ONLY`"
        )

    review_admission = values.get("preExecutionReviewAdmission")
    review_trigger = values.get("preExecutionReviewTrigger")
    next_review_boundary = values.get("nextRoutineReviewBoundary")
    reviewer_work_boundary = values.get("reviewerWorkBoundary")
    if review_admission not in ALLOWED_PRE_EXECUTION_REVIEW_ADMISSIONS:
        issues.append(
            "`preExecutionReviewAdmission` must be one of "
            f"{ALLOWED_PRE_EXECUTION_REVIEW_ADMISSIONS}"
        )
    if review_trigger not in ALLOWED_PRE_EXECUTION_REVIEW_TRIGGERS:
        issues.append(
            "`preExecutionReviewTrigger` must be one of "
            f"{ALLOWED_PRE_EXECUTION_REVIEW_TRIGGERS}"
        )
    if next_review_boundary not in ALLOWED_NEXT_ROUTINE_REVIEW_BOUNDARIES:
        issues.append(
            "`nextRoutineReviewBoundary` must be one of "
            f"{ALLOWED_NEXT_ROUTINE_REVIEW_BOUNDARIES}"
        )
    if reviewer_work_boundary != REVIEWER_WORK_BOUNDARY:
        issues.append(
            f"`reviewerWorkBoundary` must be `{REVIEWER_WORK_BOUNDARY}`"
        )
    if review_admission == "NOT_REQUIRED_BEFORE_EXECUTION":
        if review_trigger != "NONE":
            issues.append(
                "`NOT_REQUIRED_BEFORE_EXECUTION` requires "
                "`preExecutionReviewTrigger: NONE`"
            )
        if next_review_boundary == "PRE_EXECUTION_REVIEW":
            issues.append(
                "`NOT_REQUIRED_BEFORE_EXECUTION` cannot route the next routine "
                "review boundary to `PRE_EXECUTION_REVIEW`"
            )
        if PRE_EXECUTION_REVIEW_LANGUAGE_RE.search(text):
            issues.append(
                "packet language requires pre-execution independent review but "
                "`preExecutionReviewAdmission` says it is not required"
            )
    elif review_admission == "REQUIRED_TRIGGERED":
        if review_trigger in (None, "NONE"):
            issues.append(
                "`REQUIRED_TRIGGERED` requires a non-`NONE` "
                "`preExecutionReviewTrigger`"
            )
        if next_review_boundary != "PRE_EXECUTION_REVIEW":
            issues.append(
                "`REQUIRED_TRIGGERED` requires "
                "`nextRoutineReviewBoundary: PRE_EXECUTION_REVIEW`"
            )

    if dispatch_kind not in ("INITIAL", "REWORK"):
        issues.append("field `dispatchKind` must be `INITIAL` or `REWORK`")
    if dispatch_surface not in ("INTERNAL_AGENT", "EXTERNAL_AGENT_CLI_MCP"):
        issues.append(
            "field `dispatchSurface` must be `INTERNAL_AGENT` or `EXTERNAL_AGENT_CLI_MCP`"
        )
    if dispatch_kind == "INITIAL":
        expected = {
            "priorFindingSetDigest": "NOT_APPLICABLE_INITIAL_DISPATCH",
            "dependencyAuditDisposition": "COMPLETE_INITIAL_ACCEPTANCE_MATRIX",
            "reworkFindingDisposition": "NOT_APPLICABLE_INITIAL_DISPATCH",
            "newIndependentCriticalEvidence": "NONE",
            "regressionGuardDisposition": "BASELINE_NEGATIVE_TESTS_PLANNED",
            "nextDispatchDisposition": "INITIAL_DISPATCH",
        }
        if round_number is not None and round_number != 0:
            issues.append("`INITIAL` dispatch requires `reviewRoundCount: 0`")
        if generation_number is not None and generation_number != 0:
            issues.append("`INITIAL` dispatch requires `reworkGeneration: 0`")
        if values.get("rootCauseClusterId") != "NOT_APPLICABLE_INITIAL_DISPATCH":
            issues.append(
                "`INITIAL` dispatch requires `rootCauseClusterId: "
                "NOT_APPLICABLE_INITIAL_DISPATCH`"
            )
        if values.get("consolidatedDefectClassSweep") != "COMPLETE_INITIAL_ACCEPTANCE_MATRIX":
            issues.append(
                "`INITIAL` dispatch requires `consolidatedDefectClassSweep: "
                "COMPLETE_INITIAL_ACCEPTANCE_MATRIX`"
            )
        for field_name, expected_value in expected.items():
            if values.get(field_name) != expected_value:
                issues.append(f"`INITIAL` dispatch requires `{field_name}: {expected_value}`")
    elif dispatch_kind == "REWORK":
        if round_number is not None and round_number < 1:
            issues.append("`REWORK` dispatch requires `reviewRoundCount` >= 1")
        if round_number is not None and generation_number is not None and generation_number != round_number:
            issues.append("`REWORK` requires `reworkGeneration` == `reviewRoundCount`")
        root_cluster = values.get("rootCauseClusterId", "")
        if not root_cluster or root_cluster.startswith("NOT_APPLICABLE"):
            issues.append("`REWORK` dispatch requires a stable non-placeholder `rootCauseClusterId`")
        if values.get("consolidatedDefectClassSweep") != "COMPLETE_BEFORE_REWORK_DISPATCH":
            issues.append(
                "`REWORK` dispatch requires `consolidatedDefectClassSweep: "
                "COMPLETE_BEFORE_REWORK_DISPATCH`"
            )
        if round_number is not None and round_number >= 3:
            issues.append(
                "reviewRoundCount >= 3 is not eligible for automatic re-dispatch; "
                "operator escalation is required"
            )
        digest = values.get("priorFindingSetDigest", "")
        if not re.fullmatch(r"[0-9a-f]{64}", digest):
            issues.append("`REWORK` dispatch requires a lowercase SHA-256 `priorFindingSetDigest`")
        required_values = {
            "dependencyAuditDisposition": "COMPLETE_BEFORE_FIRST_REPAIR",
            "reworkFindingDisposition": "CONSOLIDATED_ALL_DEPENDENT_FINDINGS",
            "regressionGuardDisposition": "REQUIRED_AND_PLANNED_FOR_EACH_TARGETED_DEFECT",
            "nextDispatchDisposition": "ONE_CONSOLIDATED_REWORK",
        }
        for field_name, expected_value in required_values.items():
            if values.get(field_name) != expected_value:
                issues.append(f"`REWORK` dispatch requires `{field_name}: {expected_value}`")
        critical_evidence = values.get("newIndependentCriticalEvidence", "")
        if round_number is not None and round_number >= 2 and (
            critical_evidence in ("", "NONE")
            or re.search(r"(?i)(?:TODO|TO_FILL|FILL_ME)", critical_evidence)
        ):
            issues.append(
                "reviewRoundCount >= 2 requires exact new independent critical evidence IDs"
            )

    cumulative = values.get("cumulativeExternalInvocationCount")
    ceiling = values.get("externalInvocationCeiling")
    cumulative_number = int(cumulative) if cumulative and _is_non_negative_integer(cumulative) else None
    ceiling_number = int(ceiling) if ceiling and _is_non_negative_integer(ceiling) else None
    if dispatch_surface == "INTERNAL_AGENT":
        expected = {
            "usageAvailability": "NOT_APPLICABLE_INTERNAL_AGENT",
            "quotaAdmissionDisposition": "NOT_APPLICABLE_INTERNAL_AGENT",
        }
        for field_name, expected_value in expected.items():
            if values.get(field_name) != expected_value:
                issues.append(f"internal dispatch requires `{field_name}: {expected_value}`")
    elif dispatch_surface == "EXTERNAL_AGENT_CLI_MCP":
        if values.get("usageAvailability") != "KNOWN_FOR_ADMISSION":
            issues.append(
                "automatic external dispatch requires `usageAvailability: KNOWN_FOR_ADMISSION`"
            )
        if values.get("quotaAdmissionDisposition") != "ADMITTED_WITHIN_CUMULATIVE_CEILING":
            issues.append(
                "automatic external dispatch requires "
                "`quotaAdmissionDisposition: ADMITTED_WITHIN_CUMULATIVE_CEILING`"
            )
        if cumulative_number is not None and ceiling_number is not None and cumulative_number >= ceiling_number:
            issues.append(
                "external dispatch requires cumulativeExternalInvocationCount < "
                "externalInvocationCeiling before the next invocation"
            )

    return Diagnostic(path=path, applicable=True, issues=tuple(issues))


def diagnose_worker_return(path: str, text: str) -> Diagnostic:
    """Validate observable convergence evidence, never worker internals."""
    issues: list[str] = []
    values: dict[str, str] = {}
    for field_name in WORKER_RETURN_FIELDS:
        value = _field_value(text, field_name)
        if value is None or value == "":
            issues.append(f"missing required worker-return convergence field `{field_name}`")
        else:
            values[field_name] = value

    for field_name in (
        "reworkGeneration",
        "internalAgentInvocationCount",
        "externalAgentInvocationCount",
        "providerCallCount",
    ):
        value = values.get(field_name)
        if value is not None and not _is_non_negative_integer(value):
            issues.append(f"field `{field_name}` must be a non-negative integer, got `{value}`")

    usage = values.get("tokenOrQuotaUsage")
    if usage is not None and not _is_non_negative_integer(usage) and not _has_reason(
        usage, UNAVAILABLE_PREFIX
    ):
        issues.append(
            "field `tokenOrQuotaUsage` must be a non-negative integer or a "
            "reason-bearing `NOT_AVAILABLE_WITH_REASON: ...` value"
        )

    exact_values = {
        "successorTrancheOpened": "NO",
        "implementationAutonomyDisposition": "CONTRACT_AUTHORITY_EVIDENCE_OUTCOME_ONLY",
    }
    for field_name, expected in exact_values.items():
        if values.get(field_name) != expected:
            issues.append(f"worker return requires `{field_name}: {expected}`")

    for field_name in ("rootCauseClusterId", "productionBindingEvidence"):
        value = values.get(field_name, "")
        if not value or re.search(r"(?i)(?:TODO|TO_FILL|FILL_ME)", value):
            issues.append(f"worker return requires non-placeholder `{field_name}`")

    verdict = values.get("terminalReadinessVerdict", "")
    is_blocked = _has_reason(verdict, "BLOCKED_WITH_REASON")
    if verdict != "READY_FOR_REVIEW" and not is_blocked:
        issues.append(
            "`terminalReadinessVerdict` must be `READY_FOR_REVIEW` or "
            "`BLOCKED_WITH_REASON: <reason>`"
        )
    if verdict == "READY_FOR_REVIEW":
        ready_values = {
            "consolidatedDefectClassSweep": "COMPLETE_ALL_KNOWN_DEPENDENCIES",
            "adversarialRegressionDisposition": "PASS_TARGETED_DEFECT_CLASS",
        }
        for field_name, expected in ready_values.items():
            if values.get(field_name) != expected:
                issues.append(f"ready worker return requires `{field_name}: {expected}`")
        if values.get("productionBindingEvidence") == "PENDING_BEFORE_READY":
            issues.append("ready worker return cannot use pending production-binding evidence")
    elif is_blocked:
        for field_name in (
            "consolidatedDefectClassSweep",
            "adversarialRegressionDisposition",
            "productionBindingEvidence",
        ):
            if values.get(field_name) != "PENDING_BEFORE_READY":
                issues.append(
                    f"blocked scaffold/return requires `{field_name}: PENDING_BEFORE_READY`"
                )

    return Diagnostic(path=path, applicable=True, issues=tuple(issues))


def run(base: str, head: str) -> list[Diagnostic]:
    results: list[Diagnostic] = []
    for path in _changed_md_paths(base, head):
        diagnostic = diagnose(path, _read(path))
        if diagnostic.applicable:
            results.append(diagnostic)
    return results


def main(argv: list[str] | None = None) -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(
        description="CVF review-cost and diminishing-return evidence-shape checker."
    )
    parser.add_argument("--base", default="HEAD")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)

    print("=== CVF Review Cost And Diminishing Return Control Gate ===")
    diagnostics = run(args.base, args.head)
    violations = [d for d in diagnostics if not d.is_clean]

    print(f"Applicable completion reviews/work orders/worker returns checked: {len(diagnostics)}")
    if not violations:
        print("PASS: all applicable completion reviews, work orders, and worker returns carry valid review-cost/convergence control.")
        return 0

    print(f"Violations: {len(violations)}")
    for diagnostic in violations:
        for issue in diagnostic.issues:
            print(f"  - {diagnostic.path}: {issue}")
    print(
        "VIOLATION - repair the review-cost telemetry section per "
        "docs/reference/review_cost_control/CVF_REVIEW_COST_AND_DIMINISHING_RETURN_CONTROL_STANDARD.md."
    )
    return 1 if args.enforce else 0


if __name__ == "__main__":
    raise SystemExit(main())
