# CVF Review Cost And Diminishing Return Control Standard

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD

docType: reference

Date: 2026-07-12

Batch ID: SOT3-RCS-T1

## Purpose

Convert the machine-safe part of ADIF-0026 (sequential reviewer finding
cascade) into a provider-neutral, forward-only evidence-shape contract for
review-cost telemetry, without automating semantic value judgment. This
standard defines what every changed completion review must record; it
does not decide whether a review's findings are correct, whether a root
cause is truly independent, or whether continuing repair is worthwhile.

## Scope / Applies To

Applies to every changed `docs/reviews/*.md` artifact declaring
`docType: completion_review`. Such an artifact must carry the exact standalone
declaration line `Review-Cost Telemetry: REQUIRED`. Unchanged historical
reviews and archived reviews are not reopened.

This standard does not apply to work orders, baselines, roadmaps,
standards, tests, or this checker's own source file, even if any of those
mention the declaration token in prose or as a quoted example.

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
| eligibility for the 10-minute fast path | REVIEWER_JUDGMENT |
| whether a root cause is truly independent | REVIEWER_JUDGMENT |
| whether `valueDelta` is substantively high or low | REVIEWER_JUDGMENT |
| whether a critical contradiction justifies continuation past round three | REVIEWER_JUDGMENT |
| whether the chosen `stopDisposition` token is the semantically correct one | REVIEWER_JUDGMENT |

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

The standard machine-enforces evidence presence and shape only. Root-cause
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

- This standard does not implement live provider/quota accounting; token and
  wall-clock fields may be declared `NOT_AVAILABLE_WITH_REASON`.
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

- `governance/compat/check_review_cost_control.py`
- `governance/compat/test_check_review_cost_control.py`

Operator authorization: the operator explicitly requested that this become the
common CVF foundation and SOP for all future agents using CVF.

Rollback boundary: revert this SOP addendum, checker/test changes, ADIF update,
orientation update, commit-steward cross-reference, and completion review as one
material governance batch. Do not alter Continuous Projection T1 material or
closure commits.

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

This standard defines an evidence-shape contract only. It does not certify
that a review's findings are correct, that its root-cause classification is
accurate, that its `valueDelta` narrative is substantively true, or that its
`stopDisposition` choice was the right call. Semantic review quality,
criticality judgment, and the decision to continue or stop repair remain
exclusively reviewer-owned. This standard does not authorize SOT3 runtime,
provider/live quota integration, or public-sync.
