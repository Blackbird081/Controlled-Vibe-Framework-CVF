# ADIF-0006 - Source Verification Symbol Cell Contains A Value/Type

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0006
title: Source Verification symbol cell contains a value/type
defectCategory: SOURCE_FIDELITY
defectClass: WORKER_EXECUTION_ERROR
defectRole: NOT_APPLICABLE_WITH_REASON: this entry is a general pattern, not a single finding row
severity: LOW
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch
roles: dispatcher
lifecyclePhases: pre-dispatch
surfaceSelectors: Source Verification Block `Verified path or symbol` column in any GC-018 or work-order packet
detectionSignals: the `Verified path or symbol` cell contains an assignment or type annotation, e.g. `rawMemoryReleased: false` or `canReinject: boolean`, instead of only the bare field/path/symbol name
enforcementLevel: MACHINE_CHECKED
checkerBindings: governance/compat/check_work_order_dispatch_quality.py (Verified path or symbol cell validation); governance/compat/check_agent_packet_authority_and_encoding.py (symbol-cell value/type rejection)
promotionState: MACHINE_CHECK_ADDED
supersedes: NONE
lastVerifiedCommit: 0fde5cf2
roadmapSeedId: ADIF-SEED-006
```

## Purpose

Record one observed defect pattern so an agent can recognize it before
writing a value or type annotation into a Source Verification `Verified
path or symbol` cell.

## Scope / Applies To

Applies to the Source Verification Block `Verified path or symbol` column
in any GC-018 or work-order packet. Does not apply to runtime, provider, or
public-sync behavior.

## Bad Example

> `Verified path or symbol`: `rawMemoryReleased: false`

## Good Example

> `Verified path or symbol`: `rawMemoryReleased` (the value/disposition goes
> in a different, dedicated column or in prose, not in the symbol cell)

## Canonical Sources

- `AGENTS.md` (Mandatory Work Order Source Verification: "In Source
  Verification tables, Verified path or symbol must contain only the
  field/path/symbol being verified.")
- `governance/compat/check_work_order_dispatch_quality.py`

## Remediation

Keep the `Verified path or symbol` cell to a bare field/path/symbol name
only. Record any associated value, type, or disposition in a separate
column or in prose elsewhere in the row.

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
