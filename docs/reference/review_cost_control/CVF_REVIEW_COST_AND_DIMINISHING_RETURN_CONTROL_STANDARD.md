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
nine required fields below).

## Required Fields

An applicable review must declare all nine fields:

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

`elapsedReviewMinutes` and `tokenOrQuotaUsage` are the only two fields where
ADIF-0026 permits an explicit unavailable reason instead of a number, because
cross-agent wall-clock and provider-neutral token accounting are not always
exposed in the governed workspace. Every other numeric field must be a
concrete non-negative integer; a worker or reviewer that cannot produce one
must not fabricate a number, and must instead route the review as
`BLOCKED_WITH_REASON` upstream of this telemetry section, not answer with
`NOT_AVAILABLE_WITH_REASON` on a field this standard does not exempt.

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
| presence of all nine required fields | ENFORCE |
| integer-or-explicit-unavailable value shape per field | ENFORCE |
| `stopDisposition` is one of the five allowed tokens | ENFORCE |
| round-three escalation token restriction | ENFORCE |
| whether a root cause is truly independent | REVIEWER_JUDGMENT |
| whether `valueDelta` is substantively high or low | REVIEWER_JUDGMENT |
| whether a critical contradiction justifies continuation past round three | REVIEWER_JUDGMENT |
| whether the chosen `stopDisposition` token is the semantically correct one | REVIEWER_JUDGMENT |

## Epistemic Process Block

### Expected Result / Prediction

Artifact-shaped applicability plus deterministic field and round rules should
make review cost visible without pretending to judge finding value.

### Evidence Comparison

The checker validates nine fields, five stop tokens, the round-three route,
and the declaration for every changed completion review. Twenty-three focused
tests cover valid, missing, invalid, escalation, archive, and non-review cases.

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
| Actor | worker plus reviewer bounded repair |
| Provider or surface | local private provenance workspace |
| Session or invocation | SOT3-RCS-T1 implementation and review, 2026-07-12 |
| Working directory | repository root |
| Command or tool surface | governed reads, apply_patch, pytest, checker and hook gates |
| Target paths | this standard and the paired README/checker/tests/catalogs/worker return |
| Allowed scope source | SOT3-RCS-T1 work order eight-path manifest |
| Before status evidence | ADIF-0026 was guidance-only |
| After status evidence | mandatory forward-only completion-review evidence shape implemented |
| Diff evidence | exact eight-path git status and diff before reviewer commit |
| Approval boundary | review-cost evidence-shape governance only |
| Claim boundary | no semantic scoring, runtime, provider/live, or public claim |
| Agent type | worker and reviewer/closer |
| Invocation ID | `sot3-rcs-t1-review-cost-standard-2026-07-12` |
| Expected manifest | eight work-order paths |
| Actual changed set | eight work-order paths |
| Manifest delta | MATCH |

## Non-Goals

- This standard does not implement live provider/quota accounting; token and
  wall-clock fields may be declared `NOT_AVAILABLE_WITH_REASON`.
- This standard does not implement semantic scoring, automatic review
  closure, or automatic criticality judgment.
- This standard does not reopen unchanged or archived historical reviews.
- This standard does not modify SOT3 runtime, Catalog/GAP sources, or any
  checker/hook outside the three catalogs it is wired into.

## Related Surfaces

- `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0026.md` - source
  guidance this standard machine-enforces the shape of.
- `governance/compat/check_review_cost_control.py` - the forward-only checker
  implementing this standard.
- `governance/compat/check_worker_experience_retrospective.py` - narrow
  forward-only declaration-shape precedent this checker follows.
- `docs/reference/guard_orientation/README.md` - task-first guard routing.

## Claim Boundary

This standard defines an evidence-shape contract only. It does not certify
that a review's findings are correct, that its root-cause classification is
accurate, that its `valueDelta` narrative is substantively true, or that its
`stopDisposition` choice was the right call. Semantic review quality,
criticality judgment, and the decision to continue or stop repair remain
exclusively reviewer-owned. This standard does not authorize SOT3 runtime,
provider/live quota integration, or public-sync.
