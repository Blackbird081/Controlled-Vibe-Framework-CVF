#!/usr/bin/env python3
"""Worker-return skeleton text generator for the WOAS scaffold helper."""

from __future__ import annotations

import json
from typing import Any

SCEC_SCHEMA_VERSION = "cvf.semanticConvergenceControl.v1"
SCEC_UNRESOLVED_PREDECESSOR_SENTINEL = "SCEC_PREDECESSOR_HASH_UNRESOLVED"


def render_scec_outcome_block(
    *,
    problem_key: str,
    chain_mode: str,
    chain_ordinal: int,
    predecessor_path: str | None,
    predecessor_sha256: str | None,
    required_disposition: str,
    successor_scope: str,
    reminder: str,
) -> str:
    predecessor = None if chain_mode == "INITIAL" else {
        "path": predecessor_path or SCEC_UNRESOLVED_PREDECESSOR_SENTINEL,
        "sha256": predecessor_sha256 or SCEC_UNRESOLVED_PREDECESSOR_SENTINEL,
    }
    block = {
        "schemaVersion": SCEC_SCHEMA_VERSION,
        "problemKey": problem_key,
        "chainMode": chain_mode,
        "chainOrdinal": chain_ordinal,
        "predecessor": predecessor,
        "blockerDelta": {name: [] for name in ("prior", "resolved", "retained", "new", "reopened", "current")},
        "resolutionEvidence": {},
        "counters": {
            "partialReadyClosures": 0, "reviewerScopeExpansions": 0,
            "sameClaimCorrections": 0, "nonDecreasingBlockerTransitions": 0,
        },
        "claims": [],
        "requiredDisposition": required_disposition,
        "successorScope": successor_scope,
    }
    return (
        "## Semantic Convergence Outcome\n\n"
        "Standard: `docs/reference/semantic_convergence_control/"
        "CVF_SEMANTIC_CONVERGENCE_AND_ESCALATION_CONTROL_STANDARD.md`\n\n"
        f"```json\n{json.dumps(block, indent=2)}\n```\n\n{reminder}"
    )


def render_p4_observation_block() -> str:
    """Render the optional P4-C1 automatic evidence observation block.

    Must stay byte-identical (as its own standalone rendered text) to
    ``run_worker_return_scaffold``'s equivalent section. Default ``NO``
    eligibility prevents ordinary worker returns from accidentally
    enrolling; this block carries no trusted-disposition field of its own --
    the reviewer/closer-owned disposition elsewhere in the return remains
    the sole trusted-disposition source.
    """
    return (
        "## P4 Automatic Evidence Observation Block\n\n"
        f"{FIELD_ELIGIBILITY}: NO\n"
        f"{FIELD_PHASE}: N/A with reason: not a natural P4 observation candidate\n"
        f"{FIELD_HARD_OBLIGATION_LOCATOR}: N/A with reason: not a natural P4 observation candidate\n"
        f"{FIELD_HARD_OBLIGATION_PATTERN}: N/A with reason: not a natural P4 observation candidate\n"
        f"{FIELD_SOURCE_AUTHORITY_LOCATOR}: N/A with reason: not a natural P4 observation candidate\n"
    )


def p4_observation_block_fields() -> str:
    """The field-only body (no heading), for cross-generator byte-equality
    comparison against ``run_worker_return_scaffold``'s section body."""
    return (
        f"{FIELD_ELIGIBILITY}: NO\n"
        f"{FIELD_PHASE}: N/A with reason: not a natural P4 observation candidate\n"
        f"{FIELD_HARD_OBLIGATION_LOCATOR}: N/A with reason: not a natural P4 observation candidate\n"
        f"{FIELD_HARD_OBLIGATION_PATTERN}: N/A with reason: not a natural P4 observation candidate\n"
        f"{FIELD_SOURCE_AUTHORITY_LOCATOR}: N/A with reason: not a natural P4 observation candidate\n"
    )


FIELD_ELIGIBILITY = "p4ObservationEligibility"
FIELD_PHASE = "p4ObservationPhase"
FIELD_HARD_OBLIGATION_LOCATOR = "p4HardObligationLocator"
FIELD_HARD_OBLIGATION_PATTERN = "p4HardObligationPattern"
FIELD_SOURCE_AUTHORITY_LOCATOR = "p4SourceAuthorityLocator"


def build_scec_outcome_block(args: Any) -> str:
    """Emit an outcome-shaped SCEC block for a worker-return skeleton.

    Mirrors `build_dispatch_packet_scaffold._scec_block`'s no-fabrication
    rule: a SUCCESSOR outcome without an explicit predecessor hash emits the
    explicit unresolved sentinel rather than inventing readiness evidence.
    """
    problem_key = getattr(args, "scec_problem_key", None) or f"{args.batch_id.lower()}-problem"
    # A worker return is always the successor outcome of its dispatch packet.
    # Emit an unresolved predecessor rather than a fresh valid INITIAL block;
    # the author must bind the real work-order path/hash before return.
    chain_mode = "SUCCESSOR"
    return render_scec_outcome_block(
        problem_key=problem_key,
        chain_mode=chain_mode,
        chain_ordinal=getattr(args, "scec_chain_ordinal", 0) + 1,
        predecessor_path=None,
        predecessor_sha256=None,
        required_disposition=getattr(args, "scec_required_disposition", "CONTINUE_BOUNDED"),
        successor_scope=getattr(args, "scec_successor_scope", "INITIAL_BOUNDED"),
        reminder="Author reminder: fill `blockerDelta`, `counters`, and `claims` with real "
        "declared outcome evidence before returning for review; never replace an unresolved "
        f"`{SCEC_UNRESOLVED_PREDECESSOR_SENTINEL}` with a fabricated path or hash.",
    )


def build_worker_return_skeleton(args: Any) -> str:
    """Generate a fillable worker-return markdown skeleton."""
    work_order_path = (
        f"docs/work_orders/CVF_AGENT_WORK_ORDER_{args.batch_id}_{args.date}.md"
    )
    invocation_id = f"{args.batch_id.lower()}-{args.date}"
    profile = getattr(args, "worker_return_profile", "WORKER_RETURN_FULL_GATE_V1")
    fast_doc = profile == "WORKER_RETURN_FAST_DOC_V1"
    conditional_controls = """## Conditional Controls Disposition
conditionalControlsDisposition: EKI_NA; RIH_NA; CCRI_NA
""" if fast_doc else """## External Knowledge Intake Routing
| Field | Value |
| --- | --- |
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | N/A with reason: fill if external knowledge intake applies |
| Matching local-view guard | TO_FILL or N/A with reason |
| Owner surface | TO_FILL |
| Disposition | NOT_APPLICABLE_WITH_REASON: fill if external knowledge intake applies |
| Claim boundary | TO_FILL |
## Rescan Intelligence Hardening
- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON
Reason: N/A with reason: this worker return is not a rescan, intake-refresh, or source-backed reassessment output.
## Corpus Completeness And Report Integrity
- Corpus verdict: NOT_APPLICABLE_WITH_REASON - N/A with reason: no corpus completeness claim in this worker return.
"""
    return f"""# CVF {args.batch_id} Worker Return Skeleton
Memory class: FULL_RECORD
Status: COMPLETE_PENDING_REVIEW
Date: {args.date}
docType: review
Batch ID: {args.batch_id}
Self-declared worker-return artifact: yes
Responds to work order: `{work_order_path}`
dispatchWorkOrder: `{work_order_path}`
executionBaseHead: TO_FILL_capture with `git rev-parse --short HEAD` before edits
rawMemoryReleased=false
contractProfile: {profile}
## Rework Convergence Self-Proof
rootCauseClusterId: {args.root_cause_cluster_id if getattr(args, "dispatch_kind", "INITIAL") == "REWORK" else f"INITIAL_SCOPE_{args.batch_id}"}
reworkGeneration: {getattr(args, "review_round_count", 0)}
consolidatedDefectClassSweep: PENDING_BEFORE_READY
productionBindingEvidence: PENDING_BEFORE_READY
adversarialRegressionDisposition: PENDING_BEFORE_READY
successorTrancheOpened: NO
implementationAutonomyDisposition: CONTRACT_AUTHORITY_EVIDENCE_OUTCOME_ONLY
internalAgentInvocationCount: 0
externalAgentInvocationCount: {getattr(args, "cumulative_external_invocation_count", 0)}
providerCallCount: 0
tokenOrQuotaUsage: NOT_AVAILABLE_WITH_REASON: provider-neutral scaffold has no usage meter
terminalReadinessVerdict: BLOCKED_WITH_REASON: generated scaffold pending worker evidence
## Purpose
TO_FILL: state the mission prompt for this worker return.
## Scope / Methodology
TO_FILL: state the scope and methodology of this worker execution.
## Findings / Position
TO_FILL: state findings and position with evidence.
## Risk / Corrective Action
TO_FILL: state risks and corrective actions if any.
{render_p4_observation_block()}
{build_scec_outcome_block(args)}
## Checker Source Read-Ahead Block
| Field | Value |
| --- | --- |
| applicableCheckersRead | TO_FILL: list `governance/compat/check_*.py` paths actually read |
| literalTokensReviewed | TO_FILL: exact headings, table labels, enum tokens, or regex-sensitive words reviewed |
| gateRunPurpose | TO_FILL: state confirmation/evidence after reading checker source ahead of writing |
| claimBoundary | TO_FILL: bound what this read-ahead block does and does not cover |
## Agent Operation Trace Block
| Field | Evidence |
| --- | --- |
| Actor | TO_FILL |
| Provider or surface | TO_FILL |
| Session or invocation | {args.batch_id} {args.title}, {args.date} |
| Working directory | TO_FILL |
| Command or tool surface | TO_FILL |
| Target paths | TO_FILL |
| Allowed scope source | TO_FILL |
| Before status evidence | TO_FILL |
| After status evidence | TO_FILL |
| Diff evidence | `git diff --name-status` |
| Approval boundary | TO_FILL |
| Claim boundary | TO_FILL |
| Agent type | TO_FILL |
| Invocation ID | `{invocation_id}` |
| Expected manifest | TO_FILL |
| Actual changed set | TO_FILL |
| Manifest delta | TO_FILL |
| Deletion or rename disposition | TO_FILL or N/A with reason |
## Delta Execution Claim Boundary Control Block
| Field | Value |
| --- | --- |
| claimScope | TO_FILL: worker-return scope; keep bounded to the dispatched tranche |
| claimDisposition | CLAIM_REJECTED: no execution-control, runtime-enforcement, direct-interception, or mandatory-wrapper behavior is claimed unless replaced with real evidence. |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT: no runtime receipt is created or consumed unless replaced with real evidence. |
| actionEvidence | CLAIM_REJECTED_NO_ACTION: no runtime action is executed or observed unless replaced with real evidence. |
| invocationBoundary | Manual local helper/test/workspace invocation only unless replaced with real evidence. |
| interceptionBoundary | No direct interception, wrapper/proxy enforcement, runtime gate, or agent coding control is authorized unless replaced with real evidence. |
| claimLanguage | Worker-return evidence and helper/test coverage only unless replaced with real evidence. |
| forbiddenExpansion | Do not expand into runtime/provider/live/public/package/Web/MCP/model-router behavior without a fresh source-verified authorization. |
## Public Export Disposition
DEFERRED_PRIVATE_ONLY
Reason: TO_FILL: default private-only worker return; override with real EXPORTED or BLOCKED_MISSING_PUBLIC_ARTIFACTS evidence only if this return genuinely changes public-sync scope.
{conditional_controls.rstrip()}
## Finding-To-Governance Learning Disposition
| Field | Value |
| --- | --- |
| Defect class | N/A_WITH_REASON: fill if a defect class applies |
| Learning lane | N/A_WITH_REASON: fill if a learning lane applies |
| Finding | TO_FILL |
| Disposition | N/A_WITH_REASON - fill if a governance learning disposition applies |
| Runtime/provider/cost lane | N/A_WITH_REASON: fill if runtime or provider lane affected |
| Next control action | TO_FILL or none |
## Epistemic Process Block
- Epistemic Process Applicability: TO_FILL (BOUNDED_GOVERNANCE_IMPLEMENTATION / OTHER)
- Expected result / prediction: TO_FILL
- Evidence Comparison: TO_FILL
- Contradiction or gap disposition: TO_FILL
- Claim update: TO_FILL
## Machine Closure Package
NOT_APPLICABLE_WITH_REASON: this is a `COMPLETE_PENDING_REVIEW` worker return,
not a closed-equivalent artifact. Machine closure packaging is owned by the
reviewer/closer after material commit.
## Claim Boundary
TO_FILL: state exactly what this worker return authorizes and what it does not.
## git status --short
```
TO_FILL: paste `git status --short` output here
```
## Changed Files
TO_FILL: list changed files with `git diff --name-status` evidence.
## Worker Experience Retrospective
WORKER_EXPERIENCE_RETRO_NA_WITH_REASON - no blocker in the generated skeleton; replace with concise retrospective if execution reveals worker friction.
## Command Evidence
- `python governance/compat/run_worker_return_fast_gate.py` - BLOCKED: generated skeleton pending worker execution evidence.
- TO_FILL: paste focused test or smoke command evidence when applicable.
## No-Commit Statement
WORKER_MUST_NOT_COMMIT honored: HEAD unchanged; no git commit performed by worker. Reviewer/closer owns material commit.
"""
