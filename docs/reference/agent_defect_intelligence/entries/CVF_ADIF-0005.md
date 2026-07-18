# ADIF-0005 - Closed Artifact Retains Pending-Gate Residue

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0005
title: Closed artifact retains pending-gate residue
defectCategory: CLOSURE_EVIDENCE
defectClass: MACHINE_GATE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry is a general pattern, not a single finding row
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Closure
roles: closer; reviewer
lifecyclePhases: pre-closure
surfaceSelectors: completion reviews, work orders, or GC-018 baselines that declare a closed-equivalent status while a checklist or table inside the same artifact still has an open/pending row
detectionSignals: a closed-equivalent artifact contains unresolved `- [ ]` checklist items, `| OPEN |` table rows, or stale `WORK_ORDER_READY`/`HOLD until` residue
enforcementLevel: MACHINE_CHECKED
checkerBindings: governance/compat/check_closure_packaging_preflight.py (closure-residue validation, shared logic with _validate_decided_roadmap_residue and _is_closed_equivalent)
promotionState: MACHINE_CHECK_ADDED
supersedes: NONE
lastVerifiedCommit: 0fde5cf2
roadmapSeedId: ADIF-SEED-005
```

## Purpose

Record one observed defect pattern so an agent can recognize it before
declaring an artifact closed-equivalent while a checklist or table inside
that same artifact still has an open/pending row.

## Scope / Applies To

Applies to completion reviews, work orders, and GC-018 baselines that
declare a closed-equivalent status. Does not apply to runtime, provider, or
public-sync behavior.

## Bad Example

> `Status: CLOSED_PASS_BOUNDED` with a Closure Checklist that still contains
> `- [ ] Reviewer accepts the deliverable` unchecked.

## Good Example

> `Status: CLOSED_PASS_BOUNDED` with every Closure Checklist item checked
> `- [x]`, or any remaining open item explicitly routed to a separate,
> still-open follow-up artifact named by path.

## Canonical Sources

- `docs/reviews/CVF_MPI_T6_REVIEW_GATE_HARDENING_COMPLETION_2026-06-22.md`
  (Findings / Position and Closure Diff Gate: closure-residue patterns
  hardened alongside the decided-roadmap-residue check)
- `AGENTS.md` (Closure Finality Gate: a closed-equivalent artifact must not
  retain `| OPEN |` rows or unchecked checklist items)

## Remediation

Before declaring an artifact closed-equivalent, resolve or explicitly
re-route every checklist item and table row inside that same artifact so no
open/pending residue remains alongside the closed status.

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
