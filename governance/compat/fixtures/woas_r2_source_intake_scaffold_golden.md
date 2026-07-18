# CVF Agent Work Order - Source Intake Scaffold Golden Fixture

Memory class: governed-worker-dispatch

Status: HOLD_PENDING_OPERATOR_DECISION

Batch ID: WOAS-R2-GOLDEN

Dispatch base head: GOLDENFIXTUREBASEHEAD

Commit mode: WORKER_MUST_NOT_COMMIT

Worker: delegated worker

Reviewer/closer: FILL_ME

Worker return path: `docs/reviews/CVF_WOAS-R2-GOLDEN_WORKER_RETURN_2026-07-01.md`

## Dispatch Prompt Envelope

Role: delegated worker for WOAS-R2-GOLDEN.

Canonical packet: `docs/work_orders/CVF_AGENT_WORK_ORDER_WOAS-R2-GOLDEN_2026-07-01.md`

Commit mode: WORKER_MUST_NOT_COMMIT.

executionBaseHead: WORKER_MUST_CAPTURE_AT_START.

Current-time notes: FILL_ME (artifact date is 2026-07-01).

Do-not-misread notes: FILL_ME (state what this packet does not authorize).

Required first actions: read required startup files, guard orientation, literal gotchas, this packet, the paired GC-018 baseline, and all checker source listed in the Checker Source Read-Ahead Block before writing any artifact.

Return contract: create the worker return artifact, run required gates, leave changes uncommitted (if WORKER_MUST_NOT_COMMIT), and return `COMPLETE_PENDING_REVIEW` or `BLOCKED_WITH_REASON`.

## Purpose

FILL_ME: state the mission prompt for this work order.

## Scaffold Provenance Block

| Field | Value |
| --- | --- |
| scaffoldHelperCommand | `python governance/compat/build_dispatch_packet_scaffold.py --packet-kind source-intake --batch-id WOAS-R2-GOLDEN --title "Source Intake Scaffold Golden Fixture" --date 2026-07-01 --base GOLDENFIXTUREBASEHEAD --commit-mode WORKER_MUST_NOT_COMMIT --stdout` |
| generatedProfile | source-intake plus WORKER_MUST_NOT_COMMIT no-commit worker profile |
| generatedSkeletonStatus | USED_AS_STARTING_POINT |
| manualEditsAfterScaffold | FILL_ME (describe manual edits made after scaffold generation) |
| checkerReadAheadConfirmation | FILL_ME (list `governance/compat/check_*.py` paths read before authoring) |
| docOnlyNewFields | FILL_ME (list new doc-only field names introduced by this dispatch) |
| claimBoundary | Dispatch authoring provenance only; no runtime/provider/live/public/Web/MCP/model-router behavior claim. |


## Worker Autonomy / No-Question Rule

Worker must repair allowed-scope checker failures directly by reading the failing checker source and matching the literal required shape. Worker should return to orchestrator only for a source contradiction, forbidden-scope need, or missing authority that makes completion impossible.

## ADIF Defect Registry Disclosure

Resolver query: taskClass=`FILL_ME`, role=`FILL_ME`, lifecyclePhase=`FILL_ME`

Returned defects: FILL_ME_AFTER_RUNNING_RESOLVER

| Field | Value |
| --- | --- |
| Resolver command | `python governance/compat/run_adif_defect_resolver.py --task-class "FILL_ME" --role FILL_ME --lifecycle-phase FILL_ME` |
| Returned defect count | FILL_ME |
| Returned defects | FILL_ME |
| Disclosed defectIds | FILL_ME |
| Dispatch impact | FILL_ME |

Author reminder: run the resolver command above for real before dispatch; list every defectId it actually returns.

## Checker Source Read-Ahead Block

| Field | Value |
| --- | --- |
| applicableCheckersRead | FILL_ME (list `governance/compat/check_*.py` paths actually read) |
| literalTokensReviewed | FILL_ME (exact headings, table labels, enum tokens, or regex-sensitive words reviewed) |
| gateRunPurpose | FILL_ME (state confirmation/evidence, not first discovery) |
| claimBoundary | FILL_ME (bound what this read-ahead block does and does not cover) |

Author reminder: read every applicable checker source before writing the first governed line, then fill this block as confirmation evidence.

## Source Verification Block

| Claimed item | Claim type | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| FILL_ME | FILL_ME | FILL_ME | FILL_ME | FILL_ME | FILL_ME | ACCEPT/REJECT/BLOCKED_SOURCE_NOT_FOUND |

Author reminder: every claimed item needs a real source file and line/section; do not leave placeholder rows in the dispatched artifact.

## Negative Search And Collision Discipline

| Check | Evidence | Disposition |
| --- | --- | --- |
| Path existence for "Source Intake Scaffold Golden Fixture" artifacts | `Test-Path` result before authoring | FILL_ME |
| Token search for "Source Intake Scaffold Golden Fixture" (2026-07-01) | search roots: governed artifact roots plus session state; exact search command: `rg -n "FILL_ME" docs CVF_SESSION`; query used FILL_ME; result: FILL_ME | FILL_ME |
| Collision decision | FILL_ME | FILL_ME |

Author reminder: run the searches for real before dispatch; do not leave placeholder rows.

## Agent Handoff Contract Control Block

Contract source archive-qualified exception: `docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md`

| Field | Value |
| --- | --- |
| route | FILL_ME (SINGLE_AGENT_SINGLE_ROLE / SINGLE_AGENT_MULTI_ROLE / MULTI_AGENT_SINGLE_ROLE / MULTI_AGENT_MULTI_ROLE) |
| rolePattern | FILL_ME |
| phase | FILL_ME |
| baseHeadFor(phase) | dispatchBaseHead=GOLDENFIXTUREBASEHEAD; executionBaseHead=WORKER_MUST_CAPTURE_AT_START; closureBaseHead=REVIEWER_TO_SET |
| changedSetScope(phase) | FILL_ME |
| traceScope(phase, actor) | FILL_ME |
| commitOwner(phase) | WORKER_MUST_NOT_COMMIT |
| crossBatchIsolation | FILL_ME |
| nextMoveSurfaces | FILL_ME |


## Reviewer Closure Conversion

| Field | Value |
| --- | --- |
| completionReviewPath | `docs/reviews/CVF_WOAS-R2-GOLDEN_COMPLETION_2026-07-01.md` (optional; prefer repairing evidence in the worker return per gotcha 30) |
| reviewerOwnedClosurePaths | FILL_ME |
| closureOwner | FILL_ME |
| workerCommitPermission | FORBIDDEN |


## Worker Output Checker Read-Ahead Mandate

Before writing each worker-owned output artifact, read checker source for that file's docType, path family, and conditional content class.

| Output artifact | Required read-ahead result |
| --- | --- |
| worker return under `docs/reviews/` | derive exact review headings, worker-return quality terms, trace labels, delta boundary labels, corpus/value/rescan tokens, and no-commit evidence shape before writing |
| companion reference under `docs/reference/` | derive exact reference headings such as Scope / Applies To, Target / Source, source verification, corpus/value/rescan, trace, and claim-boundary labels before writing |

Literal-shape reminders: do not list required headings as backticked `## ...` strings before the real section; write source-not-found disposition spelling instead of the exact blocked enum in literalTokensReviewed; avoid `after ... closure` wording unless a dependency-release row cites the accepted artifact path and commit.

## Work-Order Fulfillment Manifest

| Artifact | Required worker action |
| --- | --- |
| FILL_ME | FILL_ME |


## Worker Return Packet Shape Contract

workerReturnPath: `docs/reviews/CVF_WOAS-R2-GOLDEN_WORKER_RETURN_2026-07-01.md`
contractProfile: WORKER_RETURN_FULL_GATE_V1
requiredGate: `python governance/compat/run_worker_return_fast_gate.py`
individualCheckerSubstitution: FORBIDDEN
workerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED

Shape-list rule: when listing required worker-output sections, write section names without the `##` prefix. Reserve actual heading syntax for real sections so structural checkers do not treat this checklist as the artifact section body.


## Verification Commands

```powershell
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-implementation --base GOLDENFIXTUREBASEHEAD --head HEAD
python governance/compat/run_worker_return_fast_gate.py
git status --short
```

## Source-Intake Decision Packet Fields (trigger stub)

| Field | Value |
| --- | --- |
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | FILL_ME (must be a canonical chain-map input type) |
| Negative search performed | FILL_ME |
| Disposition | FILL_ME (ABSORB/ADAPT/DEFER/REJECT/BLOCK/PACKAGE_CANDIDATE/RUNTIME_CANDIDATE/CHECKER_CANDIDATE/NO_PACKAGE_OR_RUNTIME_VALUE) |


## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | FILL_ME |
| Provider or surface | FILL_ME |
| Session or invocation | WOAS-R2-GOLDEN Source Intake Scaffold Golden Fixture, 2026-07-01 |
| Working directory | FILL_ME |
| Command or tool surface | FILL_ME |
| Target paths | FILL_ME |
| Allowed scope source | FILL_ME |
| Before status evidence | FILL_ME |
| After status evidence | FILL_ME |
| Diff evidence | `git diff --name-status` |
| Approval boundary | FILL_ME |
| Claim boundary | FILL_ME |
| Agent type | FILL_ME |
| Invocation ID | `woas-r2-golden-2026-07-01` |
| Expected manifest | FILL_ME |
| Actual changed set | FILL_ME |
| Manifest delta | FILL_ME |


## Delta Execution Claim Boundary Control Block

| Field | Value |
| --- | --- |
| claimScope | FILL_ME |
| claimDisposition | CLAIM_REJECTED: no execution-control, runtime-enforcement, direct-interception, or mandatory-wrapper behavior is claimed unless replaced with real evidence. |
| receiptEvidence | FILL_ME |
| actionEvidence | FILL_ME |
| invocationBoundary | FILL_ME |
| interceptionBoundary | No direct interception, wrapper/proxy enforcement, runtime gate, or agent coding control is authorized unless replaced with real evidence. |
| claimLanguage | FILL_ME |
| forbiddenExpansion | Do not expand into runtime/provider/live/public/package/Web/MCP/model-router behavior without a fresh source-verified authorization. |


## Claim Boundary

FILL_ME: state exactly what this work order authorizes and what it does not.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: FILL_ME (default private-only scaffold value; override with real EXPORTED or BLOCKED_MISSING_PUBLIC_ARTIFACTS evidence only if this packet genuinely changes public-sync scope).
