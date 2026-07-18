# ADIF-0018 - Optional Completion Review Overbuilt Into Closure-Shape Drag

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0018
title: Optional completion review overbuilt into closure-shape drag
defectCategory: GATE_TRIGGER_FRICTION
defectClass: WORKER_EXECUTION_ERROR
defectRole: NOT_APPLICABLE_WITH_REASON: this entry is a general pattern, not a single finding row
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Reviewer-return review; Closure
roles: reviewer; closer
lifecyclePhases: pre-closure
surfaceSelectors: worker returns, optional completion reviews, completionReviewPath, reviewer-owned closure paths, closure packets
detectionSignals: a work order marks completion review optional but the reviewer creates a CLOSED_PASS_BOUNDED completion review anyway, triggering closure-shape gates that are not required to accept the worker return
enforcementLevel: GUIDANCE_ONLY
checkerBindings: NOT_APPLICABLE_WITH_REASON: deciding whether a completion review is required versus optional depends on the work order's Reviewer Closure Conversion and reviewer judgment
promotionState: RULE_EXISTS
supersedes: NONE
lastVerifiedCommit: b9b83e47
roadmapSeedId: NONE
```

## Purpose

Record the workflow defect where a reviewer creates an optional completion
review to make a closeout feel more formal, then spends extra time satisfying
closure-shape gates that were never required for the task. In CVF, optional
artifacts are not free: a file with `Status: CLOSED_PASS_BOUNDED`,
`## Machine Closure Package`, or closure-oriented headings can enter a heavier
checker lane.

## Scope / Applies To

Applies to reviewer-return review and closure work where the governing work
order's Reviewer Closure Conversion says completion review is optional, or
where the worker return already contains the required acceptance evidence.

## Bad Example

> The reviewer accepts a no-commit worker return, then creates a separate
> `CLOSED_PASS_BOUNDED` completion review even though the work order says the
> completion review is optional. The new artifact triggers Machine Closure
> Package exact-column checks, Delta claim-boundary checks, work-order status
> residue checks, and Agent Operation Trace manifest checks. The reviewer then
> spends time repairing a file that was not necessary to close the worker
> return.

## Good Example

> The reviewer reads the Reviewer Closure Conversion block first. If
> `completionReviewPath` is optional and the worker return has the required
> evidence, the reviewer records any small repair inside the worker return,
> runs `run_agent_commit_steward_preflight.py --mode reviewer-return`, commits
> the material paths, and then performs a separate session-sync. A completion
> review is created only when the work order explicitly requires one or when a
> material review decision cannot be expressed safely in the worker return.

## Canonical Sources

- `docs/reference/guard_orientation/README.md`
  (reviewer-return and closure task class guidance)
- `docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md`
  (phase-specific steward lanes and material/session split)
- `docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md`
  (closure-shape requirements once an artifact enters closed-equivalent status)
- `docs/reference/CVF_GOVERNED_ARTIFACT_LITERAL_FORMAT_GOTCHAS_2026-06-25.md`
  (literal-format trap checklist)

## Remediation

Before creating any reviewer-owned closeout artifact, read the work order's
Reviewer Closure Conversion. If the completion review is optional, prefer the
fast path:

1. repair allowed-scope evidence defects inside the worker return;
2. run the reviewer-return steward preflight;
3. commit only material paths;
4. run a separate session-sync if next-move surfaces change.

Create a separate completion review only when required by the work order or
when the worker return cannot safely carry the reviewer decision.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer |
| Provider or surface | local workspace |
| Session or invocation | optional-completion-review ADIF promotion, 2026-06-29 |
| Working directory | repository root |
| Command or tool surface | source reads, apply_patch, ADIF integrity guard, resolver readout, governance gates |
| Target paths | this entry file; entries README; guard orientation; governed artifact literal-format gotchas |
| Allowed scope source | operator instruction to make these pre-work rules durable for future agents |
| Before status evidence | AGSK-T4 closeout briefly overbuilt an optional completion review and triggered avoidable closure-shape gates |
| After status evidence | ADIF-0018 records the reusable defect and Guard Orientation/Gotchas surface the rule before future review/closure work |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | defect-record and pre-work guidance only; no checker, runtime, provider, public-sync, package, or session-state behavior |
| Claim boundary | guidance-only ADIF entry; no automatic prevention claim |
| Agent type | reviewer/closer |
| Invocation ID | `optional-completion-review-overbuild-adif-2026-06-29` |
| Expected manifest | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0018.md`; `docs/reference/agent_defect_intelligence/entries/README.md`; `docs/reference/guard_orientation/README.md`; `docs/reference/CVF_GOVERNED_ARTIFACT_LITERAL_FORMAT_GOTCHAS_2026-06-25.md` |
| Actual changed set | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0018.md`; `docs/reference/agent_defect_intelligence/entries/README.md`; `docs/reference/guard_orientation/README.md`; `docs/reference/CVF_GOVERNED_ARTIFACT_LITERAL_FORMAT_GOTCHAS_2026-06-25.md` |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry. No public-sync claim.

## Claim Boundary

This entry records a reusable reviewer/closure workflow defect only. It does
not implement a checker or claim that optional completion-review overbuild will
be prevented unless future agents consult the ADIF/Guard Orientation surfaces.
