import importlib.util
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_finding_to_governance_learning.py")
SPEC = importlib.util.spec_from_file_location("check_finding_to_governance_learning", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


VALID_DOC = """
# Review

## Quality Findings

| Finding | Evidence |
|---|---|
| Missing guard | log |

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action |
|---|---|---|---|---|
| Missing guard | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | Add guard |
"""


def _messages(issues: list[dict[str, str]]) -> list[str]:
    return [issue["message"] for issue in issues]


def test_valid_finding_doc_passes() -> None:
    assert MODULE._validate_finding_doc("docs/logs/CVF_TEST.md", VALID_DOC) == []


def test_finding_doc_without_disposition_fails() -> None:
    invalid = VALID_DOC.split("## Finding-To-Governance Learning Disposition")[0]
    issues = MODULE._validate_finding_doc("docs/reviews/CVF_TEST.md", invalid)
    assert any("Finding-To-Governance" in message for message in _messages(issues))


def test_worker_return_position_heading_alone_is_a_finding_marker() -> None:
    # NCR-R1/S07-R1 root correction: `## Findings / Position` is the standard
    # worker-return findings heading and must trigger the learning-disposition
    # requirement directly, not rely on an incidental `| Finding |` table row
    # as the only detection path (the prior bypass that let a worker return
    # ship a `Findings / Position` section with no learning disposition).
    doc = """
# Worker Return

## Findings / Position

The worker completed the assigned source inventory and returned evidence.
"""
    issues = MODULE._validate_finding_doc("docs/reviews/CVF_TEST.md", doc)
    assert any("Finding-To-Governance" in issue["message"] for issue in issues)


def test_worker_return_position_heading_with_disposition_passes() -> None:
    doc = """
# Worker Return

## Findings / Position

The worker completed the assigned source inventory and returned evidence.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action |
|---|---|---|---|---|
| No defect found | WORKER_EXECUTION_ERROR | GOVERNANCE_CONTROL_PLANE | N/A_WITH_REASON - clean return | N/A |
"""
    assert MODULE._validate_finding_doc("docs/reviews/CVF_TEST.md", doc) == []


def test_runtime_finding_requires_runtime_lane() -> None:
    invalid = VALID_DOC.replace("GOVERNANCE_CONTROL_PLANE", "DOCUMENTATION_ONLY_LEARNING")
    invalid = invalid.replace("Missing guard", "Runtime provider timeout")
    issues = MODULE._validate_finding_doc("docs/logs/CVF_TEST.md", invalid)
    assert any("runtime/provider/cost" in message for message in _messages(issues))


def test_doc_only_runtime_boundary_allows_explicit_na() -> None:
    valid = """
# Review

## Findings

Runtime modification is explicitly out of scope.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next action |
|---|---|---|---|---|
| Runtime/provider/cost learning | RUNTIME_SIGNAL_GAP | DOCUMENTATION_ONLY_LEARNING | N/A_WITH_REASON - doc-only; no runtime signal | N/A |
"""
    assert MODULE._validate_finding_doc("docs/reviews/CVF_TEST.md", valid) == []


def test_generalizable_finding_requires_promotion_disposition() -> None:
    invalid = """
# Review

## Findings

Future agents keep repeating this template gap.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next action |
|---|---|---|---|---|
| Future agents repeat template gap | ORCHESTRATOR_PACKET_GAP | GOVERNANCE_CONTROL_PLANE | DOCUMENTATION_ONLY_LEARNING | Mention in note |
"""
    issues = MODULE._validate_finding_doc("docs/reviews/CVF_TEST.md", invalid)
    assert any("generalizable/repeated" in message for message in _messages(issues))


def test_generalizable_finding_allows_standard_added() -> None:
    valid = VALID_DOC.replace("MACHINE_CHECK_CANDIDATE", "STANDARD_ADDED")
    valid = valid.replace("Missing guard", "Future agents repeat template gap")
    assert MODULE._validate_finding_doc("docs/reviews/CVF_TEST.md", valid) == []


def test_descriptive_defect_label_without_canonical_class_fails() -> None:
    doc = """
# Review

## Findings

The audit exposed a handoff seam interpretation problem.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action |
|---|---|---|---|---|
| Handoff seam interpretation gap | AGENT_HANDOFF_SEAM_INTERPRETATION_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | Map to canonical class |
"""
    issues = MODULE._validate_finding_doc("docs/reviews/CVF_TEST.md", doc)
    assert any("defect class" in message for message in _messages(issues))


def test_binding_check_requires_autorun_reference() -> None:
    # The real runner inherits its marker from the governed command catalog.
    # Patch the effective binding oracle so this remains a true negative-unit
    # test instead of accidentally consulting the live repository catalog.
    with patch.object(MODULE, "has_binding_marker", return_value=False):
        issues = MODULE._validate_binding(MODULE.AUTORUN_PATH, "no guard here")
    assert any(MODULE.THIS_SCRIPT_PATH in message for message in _messages(issues))


# --- FPRC-T1: Provider-memory-only learning escape guard tests ---

_PROVIDER_MEMORY_ESCAPE_DOC = """
# Review

## Findings

| Finding | Evidence |
|---|---|
| Missing guard | Stored in Claude memory for future reference |

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action |
|---|---|---|---|---|
| Missing guard | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | DOCUMENTATION_ONLY_LEARNING | stored in claude memory |
"""

_PROVIDER_MEMORY_WITH_GOVERNED_DISPOSITION = """
# Review

## Findings

| Finding | Evidence |
|---|---|
| Missing guard | stored in claude memory |

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action |
|---|---|---|---|---|
| Missing guard | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | STANDARD_ADDED | Added to FPRC standard |
"""

_PROVIDER_MEMORY_WITH_EXPLICIT_NA = """
# Review

## Findings

| Finding | Evidence |
|---|---|
| Session preference | recorded in claude memory |

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action |
|---|---|---|---|---|
| Session preference | OPERATOR_SCOPE_CLARITY_GAP | DOCUMENTATION_ONLY_LEARNING | N/A_WITH_REASON - session-local preference only | N/A |
"""


def test_provider_memory_only_learning_escape_fails() -> None:
    issues = MODULE._validate_path_with_text("docs/reviews/CVF_TEST.md", _PROVIDER_MEMORY_ESCAPE_DOC)
    assert any("provider_memory_only_learning_escape" == issue["type"] for issue in issues)


def test_provider_memory_only_with_governed_disposition_passes() -> None:
    issues = MODULE._validate_path_with_text("docs/reviews/CVF_TEST.md", _PROVIDER_MEMORY_WITH_GOVERNED_DISPOSITION)
    types = [issue["type"] for issue in issues]
    assert "provider_memory_only_learning_escape" not in types


def test_provider_memory_only_with_explicit_na_passes() -> None:
    issues = MODULE._validate_path_with_text("docs/reviews/CVF_TEST.md", _PROVIDER_MEMORY_WITH_EXPLICIT_NA)
    types = [issue["type"] for issue in issues]
    assert "provider_memory_only_learning_escape" not in types


def test_provider_memory_reusable_lesson_with_na_still_fails() -> None:
    doc = """
# Review

## Findings

Reusable gate lessons were recorded in Claude memory for future agents.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action |
|---|---|---|---|---|
| Memory-only lesson | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | N/A_WITH_REASON - recorded in provider memory | N/A |
"""
    issues = MODULE._validate_path_with_text("docs/reviews/CVF_TEST.md", doc)
    types = [issue["type"] for issue in issues]
    assert "provider_memory_only_learning_escape" in types


def test_memory_md_reusable_lesson_signal_fails() -> None:
    doc = """
# Worker Return

## Findings / Position

B7, B8, and B9 lessons were written to MEMORY.md. Future work orders of the
same kind will be faster because the lessons are stored there.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action |
|---|---|---|---|---|
| Memory-only lesson | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | DOCUMENTATION_ONLY_LEARNING | MEMORY.md updated |
"""
    issues = MODULE._validate_path_with_text("docs/reviews/CVF_TEST.md", doc)
    types = [issue["type"] for issue in issues]
    assert "provider_memory_only_learning_escape" in types


def test_memory_md_with_governed_disposition_passes() -> None:
    doc = """
# Worker Return

## Findings / Position

B7, B8, and B9 lessons were written to MEMORY.md, then promoted into a
governed checker.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action |
|---|---|---|---|---|
| Memory-only lesson | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_ADDED | Checker updated |
"""
    issues = MODULE._validate_path_with_text("docs/reviews/CVF_TEST.md", doc)
    types = [issue["type"] for issue in issues]
    assert "provider_memory_only_learning_escape" not in types


def test_provider_memory_session_local_na_still_passes() -> None:
    doc = """
# Review

## Findings

Session-local operator preference was recorded in Claude memory.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action |
|---|---|---|---|---|
| Session preference | OPERATOR_SCOPE_CLARITY_GAP | DOCUMENTATION_ONLY_LEARNING | N/A_WITH_REASON - session-local personal preference only | N/A |
"""
    issues = MODULE._validate_path_with_text("docs/reviews/CVF_TEST.md", doc)
    types = [issue["type"] for issue in issues]
    assert "provider_memory_only_learning_escape" not in types


def test_provider_memory_signal_in_claude_md_phrase_detected() -> None:
    doc = VALID_DOC.replace(
        "MACHINE_CHECK_CANDIDATE",
        "DOCUMENTATION_ONLY_LEARNING",
    ).replace("Missing guard", "Added to claude.md for future reference")
    issues = MODULE._validate_path_with_text("docs/reviews/CVF_TEST.md", doc)
    types = [issue["type"] for issue in issues]
    assert "provider_memory_only_learning_escape" in types


def test_doc_without_provider_memory_signal_unaffected() -> None:
    issues = MODULE._validate_finding_doc("docs/reviews/CVF_TEST.md", VALID_DOC)
    types = [issue["type"] for issue in issues]
    assert "provider_memory_only_learning_escape" not in types


def test_provider_memory_escape_guard_applies_to_work_orders() -> None:
    doc = """
# Work Order

Status: DISPATCHED_TO_WORKER

New gate lessons captured in memory (8 CCLV-T2 specifics beyond FPRC-T1 B1-B6).
"""
    issues = MODULE._validate_provider_memory_learning_escape(
        "docs/work_orders/CVF_TEST_FOR_CLAUDE_2026-06-16.md",
        doc,
    )
    types = [issue["type"] for issue in issues]
    assert "provider_memory_only_learning_escape" in types


# --- NCR-R1/S07-R1: recurring blocked-return escalation guard tests ---

_BLOCKED_RETURN_MISSING_RECURRENCE = """
# Worker Return

Status: BLOCKED_WITH_REASON
rootCauseClusterId: isolated-missing-recurrence-test

## Findings / Position

The worker hit a dependent generator defect outside authorized scope.
"""

_BLOCKED_RETURN_FIRST_OCCURRENCE_COMPLETE = """
# Worker Return

Status: BLOCKED_WITH_REASON

rootCauseClusterId: isolated-first-occurrence-test
recurrenceDisposition: FIRST_OCCURRENCE
priorRelatedFinding: NOT_APPLICABLE_WITH_REASON - no prior governed artifact records this defect class
operatorNoticeDisposition: NOT_APPLICABLE_WITH_REASON - first occurrence
successorFreezeDisposition: NOT_APPLICABLE_WITH_REASON - first occurrence

## Findings / Position

The worker hit a dependent generator defect outside authorized scope.
"""

_BLOCKED_RETURN_RECURRING_WITHOUT_ESCALATION = """
# Worker Return

Status: BLOCKED_WITH_REASON

rootCauseClusterId: p5-p6-phase-gate-placement-gap
recurrenceDisposition: RECURRING_CLUSTER_STOP
priorRelatedFinding: NOT_APPLICABLE_WITH_REASON - not tracked
operatorNoticeDisposition: NOT_APPLICABLE_WITH_REASON - not required
successorFreezeDisposition: NOT_APPLICABLE_WITH_REASON - not required

## Findings / Position

This is the same defect class as a prior blocked return.
"""

_BLOCKED_RETURN_RECURRING_COMPLETE = """
# Worker Return

Status: BLOCKED_WITH_REASON

rootCauseClusterId: p5-p6-phase-gate-placement-gap
recurrenceDisposition: RECURRING_CLUSTER_STOP
priorRelatedFinding: docs/reviews/CVF_CVF_NCR_R1_S06_R1_P5_PHASE_GATE_RECONCILIATION_WORKER_RETURN_2026-09-27.md
operatorNoticeDisposition: OPERATOR_NOTICE_REQUIRED
successorFreezeDisposition: FEATURE_SUCCESSORS_FROZEN

## Findings / Position

This is the same defect class as a prior blocked return.
"""


def test_blocked_return_missing_recurrence_fields_fails() -> None:
    issues = MODULE._validate_recurring_blocked_return(
        "docs/reviews/CVF_TEST_RETURN.md", _BLOCKED_RETURN_MISSING_RECURRENCE
    )
    types = [issue["type"] for issue in issues]
    assert "recurrence_disposition_missing" in types


def test_blocked_return_first_occurrence_complete_passes() -> None:
    issues = MODULE._validate_recurring_blocked_return(
        "docs/reviews/CVF_TEST_RETURN.md", _BLOCKED_RETURN_FIRST_OCCURRENCE_COMPLETE
    )
    assert issues == []


def test_blocked_return_first_occurrence_proactive_escalation_passes() -> None:
    doc = _BLOCKED_RETURN_FIRST_OCCURRENCE_COMPLETE.replace(
        "operatorNoticeDisposition: NOT_APPLICABLE_WITH_REASON - first occurrence",
        "operatorNoticeDisposition: OPERATOR_NOTICE_REQUIRED",
    ).replace(
        "successorFreezeDisposition: NOT_APPLICABLE_WITH_REASON - first occurrence",
        "successorFreezeDisposition: FEATURE_SUCCESSORS_FROZEN",
    )
    issues = MODULE._validate_recurring_blocked_return(
        "docs/reviews/CVF_TEST_RETURN.md", doc
    )
    assert issues == []


def test_blocked_return_first_occurrence_partial_escalation_fails() -> None:
    doc = _BLOCKED_RETURN_FIRST_OCCURRENCE_COMPLETE.replace(
        "operatorNoticeDisposition: NOT_APPLICABLE_WITH_REASON - first occurrence",
        "operatorNoticeDisposition: OPERATOR_NOTICE_REQUIRED",
    )
    issues = MODULE._validate_recurring_blocked_return(
        "docs/reviews/CVF_TEST_RETURN.md", doc
    )
    assert "first_occurrence_disposition_invalid" in [issue["type"] for issue in issues]


def test_blocked_return_recurring_without_escalation_fails() -> None:
    issues = MODULE._validate_recurring_blocked_return(
        "docs/reviews/CVF_TEST_RETURN.md", _BLOCKED_RETURN_RECURRING_WITHOUT_ESCALATION
    )
    types = [issue["type"] for issue in issues]
    assert "recurring_cluster_missing_prior_finding" in types
    assert "recurring_cluster_missing_operator_notice" in types
    assert "recurring_cluster_missing_successor_freeze" in types


def test_blocked_return_recurring_complete_passes() -> None:
    issues = MODULE._validate_recurring_blocked_return(
        "docs/reviews/CVF_TEST_RETURN.md", _BLOCKED_RETURN_RECURRING_COMPLETE
    )
    assert issues == []


def test_recurring_return_rejects_non_path_prior_finding() -> None:
    doc = _BLOCKED_RETURN_RECURRING_COMPLETE.replace(
        "docs/reviews/CVF_CVF_NCR_R1_S06_R1_P5_PHASE_GATE_RECONCILIATION_WORKER_RETURN_2026-09-27.md",
        "banana",
    )
    issues = MODULE._validate_recurring_blocked_return(
        "docs/reviews/CVF_TEST_RETURN.md", doc
    )
    assert "recurring_cluster_missing_prior_finding" in [issue["type"] for issue in issues]


def test_known_cluster_cannot_self_declare_first_occurrence() -> None:
    doc = _BLOCKED_RETURN_FIRST_OCCURRENCE_COMPLETE.replace(
        "isolated-first-occurrence-test", "p5-p6-phase-gate-placement-gap"
    )
    issues = MODULE._validate_recurring_blocked_return(
        "docs/reviews/CVF_TEST_RETURN.md", doc
    )
    assert "recurring_cluster_misclassified_as_first_occurrence" in [
        issue["type"] for issue in issues
    ]


def test_blocked_return_requires_non_placeholder_cluster_id() -> None:
    doc = _BLOCKED_RETURN_FIRST_OCCURRENCE_COMPLETE.replace(
        "isolated-first-occurrence-test", "NOT_APPLICABLE_INITIAL_DISPATCH"
    )
    issues = MODULE._validate_recurring_blocked_return(
        "docs/reviews/CVF_TEST_RETURN.md", doc
    )
    assert "root_cause_cluster_id_missing_or_placeholder" in [
        issue["type"] for issue in issues
    ]


def test_non_blocked_return_is_not_checked_for_recurrence() -> None:
    doc = """
# Worker Return

Status: COMPLETE_PENDING_REVIEW

## Findings / Position

All clear.
"""
    issues = MODULE._validate_recurring_blocked_return("docs/reviews/CVF_TEST_RETURN.md", doc)
    assert issues == []


def test_provider_memory_escape_work_order_allows_governed_disposition() -> None:
    doc = """
# Work Order

Status: DISPATCHED_TO_WORKER

New gate lessons captured in memory (8 CCLV-T2 specifics beyond FPRC-T1 B1-B6).

## Finding-To-Governance Learning Disposition

| Field | Disposition |
|---|---|
| Escalation state | MACHINE_CHECK_ADDED |
"""
    issues = MODULE._validate_provider_memory_learning_escape(
        "docs/work_orders/CVF_TEST_FOR_CLAUDE_2026-06-16.md",
        doc,
    )
    types = [issue["type"] for issue in issues]
    assert "provider_memory_only_learning_escape" not in types
