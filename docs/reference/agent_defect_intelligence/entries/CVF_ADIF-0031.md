# ADIF-0031 - Behavior-Changing Reject Row Missing From Writable Manifest

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0031
title: Behavior-changing reject row missing from writable manifest
defectCategory: SOURCE_FIDELITY
defectClass: RULE_GAP
defectRole: dispatcher
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; Worker execution (`WORKER_MUST_NOT_COMMIT`); Reviewer-return review
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: Source Verification REJECT rows, Work-Order Fulfillment Manifest, existing regression tests
detectionSignals: a current behavior is marked REJECT and must change, but the source or regression assertion encoding that behavior is absent from the writable manifest
enforcementLevel: GUIDANCE_ONLY
checkerBindings: NOT_APPLICABLE_WITH_REASON: current dispatch checker validates cited paths and manifest presence separately but does not reconcile behavior-changing REJECT rows to writable paths
promotionState: RULE_EXISTS
supersedes: NONE
lastVerifiedCommit: bf50f7b6b
roadmapSeedId: NONE
```

## Purpose

Prevent a source-verified dispatch from correctly identifying behavior that
must change while making the regression file that encodes that behavior
unwritable. This mismatch forces a predictable worker stop or invites an
out-of-scope edit.

## Scope / Applies To

Applies when a work order uses a Source Verification `REJECT` row to identify
current runtime or test behavior that the tranche will replace. It does not
require every read-only rejection or historical finding to become writable.

## Bad Example

> Mark an existing one-call regression as rejected behavior, require zero calls
> in the execution plan, but authorize only a new additive test file.

## Good Example

> Before dispatch, trace each behavior-changing rejection to every source and
> regression assertion that must move, then include those paths and the exact
> bounded edit in the fulfillment manifest.

## Canonical Sources

- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
- `docs/reference/CVF_WORK_ORDER_DEPENDENCY_RELEASE_EVIDENCE_STANDARD_2026-06-03.md`
- `docs/work_orders/CVF_AGENT_WORK_ORDER_SOT3_ACT_A4_FAILURE_AND_RECOVERY_BOUNDARY_PROOF_2026-07-13.md`
- `docs/reviews/CVF_SOT3_ACT_A4_FAILURE_AND_RECOVERY_BOUNDARY_PROOF_WORKER_RETURN_2026-07-13.md`

## Remediation

1. Classify each `REJECT` row as read-only evidence or behavior-changing work.
2. For behavior-changing rows, trace all source and regression assertions that
   must change.
3. Reconcile those paths against the writable manifest before dispatch.
4. If one is absent, add it with an exact edit boundary or keep the packet on
   hold.

## Epistemic Process Block

### Expected Result / Prediction

A source-verified dispatch that names current rejected behavior was expected
to include every existing regression assertion that must change.

### Evidence Comparison

The A4 Source Verification Block correctly cited the one-call regression as
`REJECT`, but the exact fulfillment manifest authorized only a new additive
test and made the existing regression unwritable.

### Contradiction Or Gap Disposition

The prediction is rejected. Source fidelity and writable scope were each
present but were not reconciled with one another.

### Claim Update

Behavior-changing rejection rows require a pre-dispatch trace to all source
and regression paths that must move.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer |
| Provider or surface | local private provenance workspace |
| Session or invocation | SOT3-ACT-A4 bounded repair R1, 2026-07-13 |
| Working directory | repository root |
| Command or tool surface | worker-return review, source comparison, `apply_patch`, ADIF entry authoring |
| Target paths | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0031.md`; entries README |
| Allowed scope source | Mandatory ADIF Defect Registry Disclosure and A4 reviewer bounded-repair authority |
| Before status evidence | A4 blocker proves a behavior-changing `REJECT` row cited an out-of-manifest regression test |
| After status evidence | ADIF-0031 is indexed for resolver discovery and the A4 manifest is reconciled |
| Diff evidence | new entry, README row, worker-return repair, and work-order bounded amendment |
| Approval boundary | dispatch learning and A4 repair only; no runtime implementation or live call |
| Claim boundary | defect guidance only; no machine-wide prevention claim |
| Agent type | reviewer/closer |
| Invocation ID | sot3-act-a4-adif-0031-2026-07-13 |
| Expected manifest | ADIF-0031 entry and entries README row |
| Actual changed set | ADIF-0031 entry and entries README row |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reviewer-learning record; no public-sync action.

## Claim Boundary

This entry records a dispatch fidelity defect and bounded prevention rule. It
does not implement a checker, prove universal prevention, or authorize A4
runtime, live, A5, public, or production work.
