# ADIF-0003 - Closed GC-018 Lacks Machine Closure Package

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0003
title: Closed GC-018 lacks Machine Closure Package
defectCategory: CLOSURE_EVIDENCE
defectClass: MACHINE_GATE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry is a general pattern, not a single finding row
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Closure
roles: closer; reviewer
lifecyclePhases: pre-closure
surfaceSelectors: GC-018 baselines and work orders that declare a closed-equivalent status (e.g. CLOSED_PASS_BOUNDED)
detectionSignals: a packet's Status line reads as closed but the packet contains no Machine Closure Package section, or that section has empty/placeholder rows
enforcementLevel: MACHINE_CHECKED
checkerBindings: governance/compat/check_machine_closure_package.py
promotionState: MACHINE_CHECK_ADDED
supersedes: NONE
lastVerifiedCommit: 0fde5cf2
roadmapSeedId: ADIF-SEED-003
```

## Purpose

Record one observed defect pattern so an agent can recognize it before
declaring a GC-018 baseline or work order closed without a complete Machine
Closure Package.

## Scope / Applies To

Applies to GC-018 baselines and work orders that declare a closed-equivalent
status. Does not apply to runtime, provider, or public-sync behavior.

## Bad Example

> `Status: CLOSED_PASS_BOUNDED` with no `## Machine Closure Package` section
> anywhere in the file.

## Good Example

> `Status: CLOSED_PASS_BOUNDED` plus a `## Machine Closure Package` table
> with non-empty, non-placeholder rows for Work order status, GC-018 status,
> Completion or reviewer artifact, Session continuity, and System loop
> interlock (each `PASS` or an explicit `N/A with reason`).

## Canonical Sources

- `docs/reviews/CVF_MPI_T6_REVIEW_GATE_HARDENING_COMPLETION_2026-06-22.md`
  (Findings / Position: missing Machine Closure Package violation for the
  closed GC-018)

## Remediation

Any packet that declares a closed-equivalent status must include a complete
`## Machine Closure Package` section with `Work order status` and
`Completion or reviewer artifact` rows populated; `N/A` alone is not valid,
only `N/A with reason: ...`.

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
