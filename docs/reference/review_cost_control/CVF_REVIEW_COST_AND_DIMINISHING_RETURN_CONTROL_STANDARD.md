# CVF Review Cost And Diminishing Return Control Standard

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD

docType: reference

Date: 2026-08-29

Batch ID: SOT3-RCS-T1

## Purpose

Convert the machine-safe part of ADIF-0026 (sequential reviewer finding
cascade) into a provider-neutral, forward-only evidence-shape contract for
review-cost telemetry, without automating semantic value judgment. This
standard defines what every changed completion review must record and what
every changed work order must prove before dispatch. It does not decide
whether a review's findings are correct or whether a root cause is truly
independent.

## Scope / Applies To

Applies to every changed `docs/reviews/*.md` artifact declaring
`docType: completion_review`. Such an artifact must carry the exact standalone
declaration line `Review-Cost Telemetry: REQUIRED`. Unchanged historical
reviews and archived reviews are not reopened.

The completion-review telemetry declaration does not apply to work orders,
baselines, roadmaps, standards, tests, or this checker's own source file. The
separate dispatch control below applies forward-only to every changed,
non-archived work order declaring `docType: work_order`.

## Review Dispatch Convergence And Invocation Budget Control

Every changed work order must carry the exact standalone declaration
`Review-Dispatch Convergence Control: REQUIRED` and these scalar fields:

- `dispatchKind`, `dispatchSurface`, and `parentAssignmentId`;
- `reviewRoundCount` and `priorFindingSetDigest`;
- `dependencyAuditDisposition`, `reworkFindingDisposition`,
  `newIndependentCriticalEvidence`, and `regressionGuardDisposition`;
- `cumulativeExternalInvocationCount`, `externalInvocationCeiling`,
  `usageAvailability`, and `quotaAdmissionDisposition`;
- `nextDispatchDisposition`.
- `rootCauseClusterId`, `reworkGeneration`, and
  `consolidatedDefectClassSweep`;
- `successorTrancheOpened` and `implementationAutonomyDisposition`.
- `preExecutionReviewAdmission`, `preExecutionReviewTrigger`,
  `nextRoutineReviewBoundary`, and `reviewerWorkBoundary`.

An `INITIAL` dispatch uses round zero, a complete initial acceptance matrix,
baseline negative-test planning, and no prior finding digest. A `REWORK`
dispatch requires a SHA-256 binding to one consolidated finding set, a full
dependency audit completed before the first repair, and a regression guard for
every targeted defect. Round two additionally requires exact evidence IDs for
a genuinely new independent critical root cause. Round three and later are not
eligible for automatic re-dispatch.

For `EXTERNAL_AGENT_CLI_MCP`, the parent-assignment cumulative invocation count
must be strictly below its ceiling before the next invocation, and admission
usage must be known. Unknown usage, a reached ceiling, or a missing cumulative
envelope fails closed. `INTERNAL_AGENT` uses the explicit not-applicable
posture because provider-native helpers inside one already-authorized parent
session are outside this separately-dispatched invocation count.

This is a pre-dispatch evidence and admission interlock. It does not intercept
an out-of-band shell, IDE, MCP server, or provider call that bypasses CVF's
governed work-order/autorun path.

`successorTrancheOpened` is always `NO` at dispatch and worker return. A
dependent repair remains inside the current root-cause cluster; only the
reviewer/orchestrator may authorize a successor after identifying independent
critical evidence or a changed authority boundary. `reworkGeneration` equals
the review round for rework and is zero for initial dispatch.

## Worker Return Convergence Self-Proof

Every changed self-declared worker return must record one compact, observable
self-proof envelope before claiming readiness:

- stable `rootCauseClusterId`, non-negative `reworkGeneration`, and
  `consolidatedDefectClassSweep: COMPLETE_ALL_KNOWN_DEPENDENCIES`;
- non-placeholder `productionBindingEvidence` and
  `adversarialRegressionDisposition: PASS_TARGETED_DEFECT_CLASS`;
- `successorTrancheOpened: NO` and
  `implementationAutonomyDisposition: CONTRACT_AUTHORITY_EVIDENCE_OUTCOME_ONLY`;
- non-negative internal-agent, external-agent, and provider invocation counts,
  plus numeric quota usage or an explicit unavailable reason;
- `terminalReadinessVerdict: READY_FOR_REVIEW` or a reason-bearing blocked
  verdict.

This is not a reasoning trace and does not prescribe algorithms, prompts,
tool order, code structure, or provider-specific working style. CVF governs
authority, observable contracts, invariants, evidence, budgets, and outcomes.
The worker retains implementation autonomy inside those boundaries. The
reviewer remains the independent safety net, not the first party expected to
discover predictable dependent cases.

The canonical local helper is
`governance/compat/build_dispatch_packet_scaffold.py`. It emits checker-ready
INITIAL or REWORK envelopes and can include the paired worker-return skeleton.
It is deterministic, local-only, has zero provider/network calls, and rejects
round-three rework, malformed finding digests, or external invocation counts
at/above their ceiling before emitting a packet. The separate
`run_worker_return_scaffold.py` emits the same self-proof envelope so the two
worker-return generators cannot silently drift on this contract.

## Declaration

A changed completion review must include this exact standalone line
(its own paragraph, not inside a code fence or backtick span):

```text
Review-Cost Telemetry: REQUIRED
```

Once present, the review must include a `## Review Cost Telemetry And Stop
Disposition` section (or equivalently named telemetry section containing all
required fields below).

## Required Fields

An applicable review must declare all fields below:

| Field | Shape |
|---|---|
| `reviewRoundCount` | non-negative integer |
| `workerRepairTurnCount` | non-negative integer |
| `newRootCauseCountThisRound` | non-negative integer |
| `dependentFindingCountThisRound` | non-negative integer |
| `elapsedReviewMinutes` | non-negative integer, or `NOT_AVAILABLE_WITH_REASON` followed by a reason |
| `providerCallCount` | non-negative integer |
| `tokenOrQuotaUsage` | non-negative integer, or `NOT_AVAILABLE_WITH_REASON` followed by a reason |
| `valueDelta` | non-empty reviewer statement (free text); never a bare number and never auto-scored |
| `stopDisposition` | one of the five allowed tokens below |
| `preRepairAuditDisposition` | one of the three audit tokens below |
| `materialCommitCount` | non-negative integer |
| `continuityCommitCount` | non-negative integer |
| `commitPlanDisposition` | one of the four normal tokens below, or `EXCEPTION_WITH_REASON` followed by a reason |
| `latencyDisposition` | one of the four normal tokens below, or `LATENCY_BUDGET_EXCEEDED_WITH_REASON` followed by a reason |
| `avoidableDelayClass` | one of the seven allowed delay tokens below |

`elapsedReviewMinutes` and `tokenOrQuotaUsage` are the only two fields where
ADIF-0026 permits an explicit unavailable reason instead of a number, because
cross-agent wall-clock and provider-neutral token accounting are not always
exposed in the governed workspace. Every other numeric field must be a
concrete non-negative integer; a worker or reviewer that cannot produce one
must not fabricate a number, and must instead route the review as
`BLOCKED_WITH_REASON` upstream of this telemetry section, not answer with
`NOT_AVAILABLE_WITH_REASON` on a field this standard does not exempt.

## Single-Pass Review Latency SOP

This is the default CVF reviewer and closer SOP for every agent and provider.
Before the first repair, the reviewer must inspect the entire bounded change as
one dependency graph and record a matrix covering contract/schema fields,
authority and source claims, path and repository boundaries, negative cases,
test adequacy, closure range, and commit choreography. Predictable dependent
findings return together. If that audit cannot be completed, the review stops
as `BLOCKED_REVIEW_MATRIX_INCOMPLETE`; it does not start a repair loop.

The fast-path target is at most 10 elapsed minutes for a bounded local review
when each focused command completes within 60 seconds and the work requires no
live provider, browser, corpus-scale scan, external service, operator wait, or
public-sync action. This target is operational telemetry, not a waiver of a
critical defect. An eligible review that exceeds it records
`LATENCY_BUDGET_EXCEEDED_WITH_REASON` and classifies the avoidable delay.

The default closure choreography is one material commit followed by at most
one continuity commit. Semantic inspection and bounded repairs finish before
the material commit. Committing early, discovering the committed-range split
afterward, or using repeated broad gates to discover literal requirements are
review-process defects. More than one commit in either lane requires
`EXCEPTION_WITH_REASON`; a hook-created retry does not by itself justify an
extra material commit.

Use this order:

1. Capture the review base and exact worker manifest.
2. Read the controlling packet, applicable checker sources, and the full
   changed set once.
3. Build the single-pass dependency-closure matrix and commit/range plan.
4. Return or apply one consolidated repair set.
5. Run focused tests and narrow checkers, then the phase gate once.
6. Create one material commit; run committed-range closure on its exact range.
7. Create one continuity commit only when mode or next-move state changed.

## Same-Scope Authority Continuity And Micro-Checkpoint Prevention

An operator instruction to continue, handle, or finish a bounded task after an
escalation remains effective for dependent corrections within that same task.
An agent must not silently reinterpret it as authority for exactly one repair
turn unless the operator or controlling packet explicitly states that limit.

Continue without another operator checkpoint only while all of these remain
unchanged:

- objective and acceptance item;
- allowed path and artifact classes;
- risk and authority ceiling;
- external-effect class, including provider, network, public, destructive,
  secrets, and quota posture; and
- role routing and commit ownership.

A reviewer finding that narrows an already-open acceptance item to another
source-backed dependent detail is not by itself a new scope event. Consolidate
and repair the full dependency once, then perform one independent re-review.

Return to the operator only when at least one boundary above changes, an
operator-set budget is actually exhausted, or the evidence reveals a new
independent critical authority, fail-open, integrity, or irreversible-action
root cause. Without such a change, another confirmation request is
`AVOIDABLE_OPERATOR_WAIT`; it adds latency without adding governance value.

This rule preserves fail-closed behavior. It does not let an agent widen scope,
ignore an explicit numerical cap, perform a forbidden action, or self-authorize
live/provider/public/destructive work. The current checker does not infer these
semantic facts; reviewers and closers must apply them from evidence.

## Trigger-Based Review Admission Boundary

Review is admitted by a control event, not by the number of artifacts, roles,
steps, commits, or handoffs in a workflow. A routine independent review belongs
at the returned-result boundary where the reviewer owns a disposition such as
accept, return to design, freeze, or closure. Pre-execution review is admitted
only when at least one of these triggers is present:

- a frozen identity mismatch or unresolved source/authority contradiction;
- a new independent critical integrity, fail-open, secret, irreversible, live,
  provider, public, destructive, or production-risk boundary;
- a requested scope or authority expansion beyond the accepted design;
- machine evidence is incomplete or materially `UNCLASSIFIED` for the decision
  being requested; or
- the operator explicitly requests that specific review.

The following events do not independently admit another review:

- authoring a work order from an already accepted design;
- changing agent, provider, role label, or single/multi-agent topology;
- a worker handoff, material commit, continuity sync, or session resume;
- passing deterministic machine gates; or
- correcting dependent findings inside the same accepted objective, path
  classes, risk ceiling, external-effect class, role route, and commit owner.

When no admission trigger exists, successful mechanical preflight moves the
packet directly to dispatch readiness. Do not add a just-in-case reviewer and
do not split one authority transition into packet review plus a second operator
micro-checkpoint. If an unplanned review has already occurred, consume its
valid evidence without converting that historical event into a mandatory stage
for the current or future workflow.

Reviewers inspect and challenge returned evidence; they do not recreate the
worker's implementation or repeat every upstream role's work. A later terminal
review may verify that earlier mechanical corrections were applied as part of
its bounded evidence sample, without opening a separate review cycle.

Review-admission trigger classification remains reviewer/orchestrator judgment.
Machine checks may enforce declared evidence shape and objective trigger facts,
but must not manufacture semantic criticality or require review merely because
a new artifact or role boundary exists.

The forward-only machine contract uses these exact values:

- `preExecutionReviewAdmission` is either
  `NOT_REQUIRED_BEFORE_EXECUTION` or `REQUIRED_TRIGGERED`;
- `preExecutionReviewTrigger` is `NONE`,
  `FROZEN_IDENTITY_MISMATCH`, `SOURCE_AUTHORITY_CONTRADICTION`,
  `NEW_INDEPENDENT_CRITICAL_RISK`, `AUTHORITY_SCOPE_EXPANSION`,
  `MATERIAL_UNCLASSIFIED`, or `OPERATOR_EXPLICIT_REQUEST`;
- `nextRoutineReviewBoundary` is `WORKER_RETURN`, `TERMINAL_RESULT`, or
  `PRE_EXECUTION_REVIEW`; and
- `reviewerWorkBoundary` is
  `EVALUATE_RETURNED_EVIDENCE_NOT_RECREATE_IMPLEMENTATION`.

`NOT_REQUIRED_BEFORE_EXECUTION` requires trigger `NONE` and cannot route to
`PRE_EXECUTION_REVIEW`. `REQUIRED_TRIGGERED` requires a non-`NONE` trigger and
routes to `PRE_EXECUTION_REVIEW`. The checker also rejects the obvious
contradiction where a packet declares review unnecessary but its status or
prose still requires independent review before worker execution. This is a
closed contradiction check, not semantic inference over arbitrary prose.

## Reviewer-Local Repair Versus Worker Return Routing

A reviewer does not return every defect to the worker merely because the
worker authored the implementation. Agent or role purity is not a control
objective. Once the result and its evidence are at the ordinary review
boundary, the default is one consolidated reviewer-local correction when all
of these conditions hold:

- the objective, accepted design, allowed path set, authority ceiling,
  external-effect class and commit owner remain unchanged;
- the correction is localized and fully determined by evidence already read
  during review;
- the correction does not redesign the algorithm, recreate the deliverable,
  acquire new source evidence or require hidden worker context;
- focused tests or existing deterministic evidence can verify it; and
- applying the correction is cheaper than making another agent reload the
  controlling authority, sources, changed set and finding context.

Return the finding set to a worker only when at least one of these boundaries
is crossed:

- algorithm, architecture, design, source-of-truth interpretation or semantic
  implementation must materially change;
- allowed paths, risk, authority or external effects must expand;
- new evidence must be acquired or the reviewer cannot determine the repair
  from the closed review input set;
- the correction is broad enough that reviewer implementation would recreate
  the worker's work rather than repair its returned evidence; or
- a controlling work order expressly forbids reviewer repair.

Context reload is governance tax. Its cost includes the additional agent
invocation and the repeated reading needed to reconstruct authority, source
identity, changed-set intent and prior findings. Do not incur that tax solely
to preserve role labels. In multi-agent or multi-role work, changing the actor
does not itself increase independence; independence comes from source-bound
evidence, deterministic checks and reviewer-owned disposition.

The reviewer must still consolidate connected findings before the first
repair and must not silently widen scope. A reviewer-local correction remains
disclosed in the existing return or completion evidence and is verified with
the narrowest sufficient tests. This rule adds no mandatory packet, field,
checker invocation or separate review round. Machine checks do not attempt to
infer whether a semantic repair is small; the reviewer applies this routing
boundary from the evidence and the operator may override it explicitly.

## Audit, Commit, Latency, And Delay Vocabularies

`preRepairAuditDisposition` must be exactly one of:

- `COMPLETE_BEFORE_FIRST_REPAIR`
- `NO_REPAIR_REQUIRED`
- `BLOCKED_REVIEW_MATRIX_INCOMPLETE`

`commitPlanDisposition` must be exactly one of:

- `DEFAULT_ONE_MATERIAL_ONE_CONTINUITY`
- `MATERIAL_ONLY`
- `NO_COMMIT_REVIEW`
- `CONTINUITY_ONLY`
- `EXCEPTION_WITH_REASON: <reason>`

`latencyDisposition` must be exactly one of:

- `WITHIN_FAST_PATH_TARGET`
- `EXPECTED_LONG_RUNNING_PROOF`
- `EXTERNAL_WAIT`
- `NOT_MEASURED_WITH_REASON: <reason>`
- `LATENCY_BUDGET_EXCEEDED_WITH_REASON: <reason>`

`avoidableDelayClass` must be exactly one of:

- `NONE`
- `SEQUENTIAL_FINDING_CASCADE`
- `PREMATURE_COMMIT`
- `RANGE_RECOMPUTATION`
- `GATE_DISCOVERY_LOOP`
- `WORKTREE_CHURN`
- `MULTIPLE_AVOIDABLE_DELAYS`

If `materialCommitCount > 1` or `continuityCommitCount > 1`,
`commitPlanDisposition` must start with `EXCEPTION_WITH_REASON:`.

## Stop-Disposition Vocabulary

`stopDisposition` must be exactly one of:

- `CONTINUE_NEW_CRITICAL_EVIDENCE`
- `CONSOLIDATE_SINGLE_REPAIR`
- `PARK_LOW_INCREMENTAL_VALUE`
- `COMPLETE_REVIEW`
- `REVIEW_COST_ESCALATION_REQUIRED`

No other token, synonym, or free-text substitute is accepted. Choosing which
token is semantically correct for a given round remains reviewer judgment;
this standard and its checker enforce only that the declared token is one of
the five, not that it is the right one for the evidence.

## Round-Three Escalation Rule

If `reviewRoundCount >= 3`, `stopDisposition` must be exactly
`REVIEW_COST_ESCALATION_REQUIRED` or `CONTINUE_NEW_CRITICAL_EVIDENCE`; the
other three tokens are rejected at round three and beyond. This mirrors
ADIF-0026's Mandatory Stop Control item 2. Whether the round-three evidence
is truly a new critical contradiction remains reviewer judgment; this
standard only fixes the two allowed exit tokens once the round threshold is
crossed.

`CONTINUE_NEW_CRITICAL_EVIDENCE` additionally requires
`newRootCauseCountThisRound > 0`. At round two or later,
`CONSOLIDATE_SINGLE_REPAIR` also requires a new independent root cause; a
dependent-only finding at that point is review-by-drip and cannot open another
automatic repair dispatch.

## Machine-Enforceable Boundary

| Control | Machine disposition |
|---|---|
| completion-review docType applicability and exact declaration | ENFORCE |
| presence of all required fields | ENFORCE |
| integer-or-explicit-unavailable value shape per field | ENFORCE |
| `stopDisposition` is one of the five allowed tokens | ENFORCE |
| round-three escalation token restriction | ENFORCE |
| audit, commit-plan, latency, and delay vocabularies | ENFORCE |
| multi-commit exception-reason requirement | ENFORCE |
| changed work-order dispatch kind, convergence fields, and cross-field rules | ENFORCE |
| parent-assignment invocation-count ceiling before external dispatch | ENFORCE |
| round-two new-critical-evidence requirement and round-three dispatch stop | ENFORCE |
| worker-return consolidated sweep, production binding, adversarial regression, cost ledger, and terminal verdict | ENFORCE |
| implementation-autonomy boundary and closed successor-tranche flag | ENFORCE |
| review-admission field shape, cross-field consistency, and obvious pre-execution-review contradiction | ENFORCE |
| eligibility for the 10-minute fast path | REVIEWER_JUDGMENT |
| whether a root cause is truly independent | REVIEWER_JUDGMENT |
| whether `valueDelta` is substantively high or low | REVIEWER_JUDGMENT |
| whether a critical contradiction justifies continuation past round three | REVIEWER_JUDGMENT |
| whether the chosen `stopDisposition` token is the semantically correct one | REVIEWER_JUDGMENT |
| whether a review-admission trigger is semantically present | REVIEWER_ORCHESTRATOR_JUDGMENT |

## Epistemic Process Block

### Expected Result / Prediction

Artifact-shaped applicability plus deterministic field and round rules should
make review cost visible without pretending to judge finding value.

### Evidence Comparison

The checker validates the full telemetry field set, controlled vocabularies,
the round-three route, multi-commit exception reason, and the declaration for
every changed completion review. Focused tests cover valid, missing, invalid,
escalation, commit-exception, archive, and non-review cases.

### Contradiction Or Gap Disposition

Marker-only opt-in was insufficient because omission evaded enforcement. The
reviewer repaired applicability to use completion-review docType while keeping
unchanged and archived history outside the forward-only gate.

### Claim Update

The standard machine-enforces review evidence shape plus forward-only work-order
dispatch convergence and cumulative invocation admission. Root-cause
independence, criticality, and incremental value remain reviewer judgment.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer and governance maintainer |
| Provider or surface | local private provenance workspace |
| Session or invocation | shared single-pass review latency SOP hardening, 2026-07-20 |
| Working directory | repository root |
| Command or tool surface | governed reads, rg, apply_patch, focused unit tests, structural checks, autorun gates |
| Target paths | this standard; review-cost checker/tests; ADIF-0026; guard orientation; commit steward standard; completion review |
| Allowed scope source | operator instruction to raise the lesson into the common CVF SOP for all future agents |
| Before status evidence | telemetry exposed review cost but did not require a pre-repair audit, latency disposition, avoidable-delay class, or commit plan |
| After status evidence | single-pass review SOP and forward-only evidence-shape enforcement implemented |
| Diff evidence | exact eight-path git status and diff before reviewer commit |
| Approval boundary | review-cost evidence-shape governance only |
| Claim boundary | no semantic scoring, runtime, provider/live, or public claim |
| Agent type | reviewer/closer and governance maintainer |
| Invocation ID | `cvf-single-pass-review-latency-sop-2026-07-20` |
| Expected manifest | seven SOP owner, checker, test, orientation, ADIF, commit-steward, and completion-review paths |
| Actual changed set | same seven paths |
| Manifest delta | MATCH |

## Non-Goals

- This standard does not implement token-level live provider accounting. It
  enforces a provider-neutral cumulative external-invocation ceiling and fails
  closed when admission usage is unavailable.
- This standard does not implement semantic scoring, automatic review
  closure, or automatic criticality judgment.
- This standard does not reopen unchanged or archived historical reviews.
- This standard does not modify Continuous Projection runtime, provider/live,
  public-sync, or production surfaces.

## Related Surfaces

- `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0026.md` - source
  guidance this standard machine-enforces the shape of.
- `governance/compat/check_review_cost_control.py` - the forward-only checker
  implementing this standard.
- `governance/compat/check_worker_experience_retrospective.py` - narrow
  forward-only declaration-shape precedent this checker follows.
- `docs/reference/guard_orientation/README.md` - task-first guard routing.

## Core Guard Self-Protection Authorization

Authorized guard-maintenance scope: promote the observed 30-minute bounded T1
review into the provider-neutral single-pass review latency SOP, extend the
existing evidence-shape checker, and bind the new fields to future changed
completion reviews.

Protected paths:

- `docs/reference/review_cost_control/CVF_REVIEW_COST_AND_DIMINISHING_RETURN_CONTROL_STANDARD.md`
- `governance/compat/check_review_cost_control.py`
- `governance/compat/test_check_review_cost_control.py`
- `governance/compat/agent_autorun_command_catalog.py`
- `governance/compat/test_run_agent_autorun_workflow_gate.py`
- `governance/compat/build_dispatch_packet_scaffold.py`
- `governance/compat/test_build_dispatch_packet_scaffold.py`
- `governance/compat/fixtures/woas_r2_source_intake_scaffold_golden.md`
- `governance/compat/build_worker_return_skeleton_scaffold.py`
- `governance/compat/run_worker_return_scaffold.py`
- `governance/compat/test_run_worker_return_scaffold.py`
- `governance/compat/review_convergence_scaffold.py`

Operator authorization: the operator explicitly requested that this become the
common CVF foundation and SOP for all future agents using CVF, later required
the same control to prevent review-by-drip and unbounded external MCP/CLI
re-dispatch cost, on 2026-09-02 rejected step-by-step review admission after an
R1B authoring checkpoint recreated the governance tax being removed, and then
directed reviewer-local repair for bounded findings because returning work to
another agent forces a fresh authority/source/changed-set context reload.

Rollback boundary: revert only the trigger-based review-admission addendum if
it conflicts with higher authority; preserve earlier SOP, checker/test, ADIF,
orientation, commit-steward, completion-review, R1B review, and packet evidence.

## Single-Pass SOP Epistemic Process Block - 2026-07-20

### Expected Result / Prediction

A mandatory pre-repair audit plus explicit commit and latency telemetry should
prevent a bounded semantic review from becoming a sequence of predictable
repairs, premature commits, range recomputation, and worktree churn.

### Evidence Comparison

Continuous Projection T1 reached the correct accepted result, but the review
took about 30 minutes and required avoidable sequential discovery, an early
implementation commit, extra continuity handling, closure-range correction,
and worktree recovery. The earlier telemetry shape exposed cost but did not
require the pre-repair audit or commit-plan evidence that would prevent it.

### Contradiction Or Gap Disposition

The worker defects remain valid findings. The additional defect was the review
workflow: connected findings and closure mechanics were not fully consolidated
before repair and commit.

### Claim Update

CVF now requires single-pass audit evidence and commit/latency dispositions for
future changed completion reviews. Semantic completeness and fast-path
eligibility remain reviewer-owned judgments.

## Claim Boundary

This standard defines an evidence-shape and cooperative pre-dispatch contract.
It does not certify
that a review's findings are correct, that its root-cause classification is
accurate, that its `valueDelta` narrative is substantively true, or that its
`stopDisposition` choice was the right call. Semantic review quality,
criticality judgment, and the decision to continue or stop repair remain
exclusively reviewer-owned. This standard does not authorize SOT3 runtime,
provider/live token metering, out-of-band launcher interception, or public-sync.
