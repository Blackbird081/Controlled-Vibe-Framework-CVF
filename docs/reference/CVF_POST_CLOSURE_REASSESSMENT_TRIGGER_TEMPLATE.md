# CVF Post-Closure Reassessment Trigger Template

Status: reusable template for proposing a new independent reassessment after an active wave has been closed.

## Purpose

- standardize when and why a closed wave should be reassessed
- distinguish real new-gap discovery from routine maintenance or curiosity-driven re-audit
- make the reassessment path as reviewable as the `GC-018` continuation-candidate path

## When To Use

Use this template when all of the following are true:

- the roadmap or wave is already marked `COMPLETE FOR ACTIVE WAVE`, `MATERIALLY DELIVERED`, or `DEPTH-FROZEN`
- someone believes a new material governance gap may have appeared, or that the current closure readout may no longer be sufficient
- the proposed next move is a new independent reassessment rather than a scoped continuation batch

Do not use this template for:

- ordinary bug fixing
- baseline refresh only
- already-authorized continuation work under an accepted `GC-018` packet

## Required Packet

Copy the following block into one reviewable artifact:

- review note
- roadmap addendum
- baseline delta
- reassessment request

```text
Post-Closure Reassessment Trigger
- Trigger ID: <stable id>
- Date: <YYYY-MM-DD>
- Parent roadmap / wave: <path>
- Why reassessment is needed now: <short justification>
- Suspected gap class:
  - CANONICAL_MODEL | EXECUTABLE_GOVERNANCE | WORKFLOW_REALISM | WEB_ALIGNMENT | DOC_TRUTHFULNESS | CONTROL_LOOP | OTHER
- Active-path impact: NONE | LIMITED | MATERIAL
- Evidence already observed:
  - <signal 1>
  - <signal 2>
- What would count as a confirmed gap:
  - <short criterion>
- Requested next step:
  - INDEPENDENT REASSESSMENT
- If reassessment finds no new material gap:
  - remain closed
- If reassessment finds a material gap:
  - open a new roadmap or continuation candidate under current governance rules
```

## Reading Rules

- this template proposes investigation, not implementation
- using this template does not reopen the roadmap by itself
- any implementation that follows from the reassessment still needs the appropriate roadmap/update controls and baseline evidence

## Preferred Placement

For system-level closure handling, prefer one of:

- `docs/reviews/...`
- `docs/baselines/...`
- `docs/roadmaps/...`

There should be one obvious canonical source for the trigger.

## Related Controls

- `docs/reviews/CVF_SYSTEM_UNIFICATION_ACTIVE_WAVE_CLOSURE_REVIEW_2026-03-20.md`
- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`
- `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md`
- `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
