# ADIF-0004 - Decided Roadmap Retains Same-Tranche Parked Residue

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0004
title: Decided roadmap retains same-tranche parked residue
defectCategory: STATE_CONTINUITY
defectClass: MACHINE_GATE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry is a general pattern, not a single finding row
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Closure; Session-sync
roles: closer; session-sync steward
lifecyclePhases: pre-closure
surfaceSelectors: roadmaps whose Work Plan or tranche-status table marks a tranche decided/closed while body prose for that same tranche still reads HOLD or PARKED
detectionSignals: a roadmap row says PASS or committed for a tranche, but a body section for the identical tranche still contains stale HOLD_UNTIL or PARKED_PENDING language
enforcementLevel: MACHINE_CHECKED
checkerBindings: governance/compat/check_closure_packaging_preflight.py (_validate_decided_roadmap_residue)
promotionState: MACHINE_CHECK_ADDED
supersedes: NONE
lastVerifiedCommit: 0fde5cf2
roadmapSeedId: ADIF-SEED-004
```

## Purpose

Record one observed defect pattern so an agent can recognize it before
marking a roadmap tranche decided while body prose for the same tranche
still reads HOLD or PARKED.

## Scope / Applies To

Applies to roadmaps whose Work Plan or tranche-status table marks a tranche
decided/closed. Does not apply to runtime, provider, or public-sync
behavior.

## Bad Example

> Work Plan row: "Execute T0 | PASS"; body section below still says "T0 is
> HOLD_UNTIL operator selection."

## Good Example

> Work Plan row and body section both updated together to the decided
> disposition in the same commit.

## Canonical Sources

- `docs/reviews/CVF_MPI_T6_REVIEW_GATE_HARDENING_COMPLETION_2026-06-22.md`
  (Findings / Position: decided-versus-parked roadmap residue violation)

## Remediation

When a roadmap tranche's status-table row changes to a decided disposition,
update every body-prose mention of that same tranche in the same commit so
no stale HOLD/PARKED language survives next to a decided row.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Claude continuous-execution orchestrator/worker |
| Provider or surface | local workspace |
| Session or invocation | ADIF-T1 execution, 2026-06-23 |
| Working directory | repository root |
| Command or tool surface | governed source reads, file write tool |
| Target paths | this entry file |
| Allowed scope source | ADIF-T1 GC-018 baseline and paired work order |
| Before status evidence | file did not exist before this tranche |
| After status evidence | entry created with cited canonical evidence |
| Diff evidence | new-file creation in the ADIF-T1 checkpoint commit |
| Approval boundary | ADIF-T1 child scope only |
| Claim boundary | records an observed defect pattern only; no checker implementation |
| Agent type | continuous-execution orchestrator/worker |
| Invocation ID | `adif-t1-execution-2026-06-23` |
| Expected manifest | this entry, part of the ADIF-T1 eight-entry batch |
| Actual changed set | this entry |
| Manifest delta | MATCH |

## Claim Boundary

This entry records an observed defect pattern and its existing checker
binding. It does not implement, modify, or extend the cited checker.
