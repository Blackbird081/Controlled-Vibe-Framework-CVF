# CVF Review Cost Control Front Door

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-12

Batch ID: SOT3-RCS-T1

## Purpose

Stable front door for the CVF review-cost and diminishing-return evidence-
shape family. This directory answers "what must a completion review record
about its own repair-round cost, and when." It does not decide whether a
review's findings are correct or whether continuing repair is worth it.

The paired standard is:

`docs/reference/review_cost_control/CVF_REVIEW_COST_AND_DIMINISHING_RETURN_CONTROL_STANDARD.md`

## Scope / Applies To

Applies to every changed `docs/reviews/*.md` artifact declaring
`docType: completion_review`. Each applicable review must also carry the exact
standalone declaration `Review-Cost Telemetry: REQUIRED`. Files outside that
artifact shape, archived reviews, and unchanged historical reviews are out of
scope.

## Family Contents

| File | Purpose | Status |
|---|---|---|
| `README.md` | this file: family front door | ACTIVE |
| `CVF_REVIEW_COST_AND_DIMINISHING_RETURN_CONTROL_STANDARD.md` | canonical declaration, field, vocabulary, round-three, and claim-boundary contract | ACTIVE |

## Epistemic Process Block

### Expected Result / Prediction

A mandatory completion-review artifact shape should prevent silent omission
of review-cost evidence without applying to standards, work orders, worker
returns, archives, or unchanged history.

### Evidence Comparison

The implemented checker selects changed `docType: completion_review`
artifacts, requires the telemetry declaration, and leaves other artifact
classes outside applicability. Focused tests cover both inclusion and
exclusion paths.

### Contradiction Or Gap Disposition

The worker's original opt-in design allowed silent evasion. Reviewer repair
replaced marker-only applicability with completion-review docType
applicability while retaining exact-marker validation.

### Claim Update

This family now owns mandatory forward-only evidence shape for changed
completion reviews; it still does not score semantic value.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | worker plus reviewer bounded repair |
| Provider or surface | local private provenance workspace |
| Session or invocation | SOT3-RCS-T1 implementation and review, 2026-07-12 |
| Working directory | repository root |
| Command or tool surface | governed reads, apply_patch, pytest, checker and hook gates |
| Target paths | this README and the paired standard/checker/tests/catalogs/worker return |
| Allowed scope source | SOT3-RCS-T1 work order eight-path manifest |
| Before status evidence | no review-cost-control reference family existed |
| After status evidence | stable front door routes mandatory changed-completion-review evidence shape |
| Diff evidence | exact eight-path git status and diff before reviewer commit |
| Approval boundary | review-cost evidence-shape governance only |
| Claim boundary | no semantic scoring, runtime, provider/live, or public claim |
| Agent type | worker and reviewer/closer |
| Invocation ID | `sot3-rcs-t1-review-cost-front-door-2026-07-12` |
| Expected manifest | eight work-order paths |
| Actual changed set | eight work-order paths |
| Manifest delta | MATCH |
This is a two-file reference family with no generated aggregate; the standard
is the single source of truth and is updated directly.

## Origin

This family converts the machine-safe part of
`docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0026.md`
(sequential reviewer finding cascade) into an enforceable evidence-shape
contract, following the reverse-projection and review-cost-systemization
routing recorded in
`docs/roadmaps/CVF_SOT3_REVERSE_ARCHITECTURE_PROJECTION_AND_REVIEW_COST_SYSTEMIZATION_ROADMAP_2026-07-12.md`
and the accepted SOT3-RAP-T0 completion review.

## Enforcement Surface

`governance/compat/check_review_cost_control.py` is a forward-only checker
wired into the reviewer-fast, pre-commit, and pre-push local governance hook
catalogs. It enforces field presence, value shape, allowed
`stopDisposition` tokens, and the round-three escalation rule. It does not
score semantic value, judge root-cause independence, or force a review to
stop.

## Related Surfaces

- `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0026.md` -
  source reviewer-cost guidance.
- `docs/reference/guard_orientation/README.md` - task-first guard routing.
- `governance/compat/check_worker_experience_retrospective.py` - narrow
  forward-only declaration-shape precedent this family's checker follows.

## Claim Boundary

This README is the family front door only. It does not itself define the
field contract (see the paired standard), does not certify checker
correctness, and does not authorize SOT3 runtime, provider/live quota
integration, or public-sync.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance governance hardening family; no public-sync
authorization exists for this tranche.
