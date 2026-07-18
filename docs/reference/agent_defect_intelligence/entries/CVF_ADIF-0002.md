# ADIF-0002 - Provider-Local Interaction Accepted As Authority

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0002
title: Provider-local interaction accepted as authority
defectCategory: AUTHORITY_BOUNDARY
defectClass: ORCHESTRATOR_PACKET_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry is a general pattern, not a single finding row
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; Worker execution (WORKER_MUST_NOT_COMMIT)
roles: dispatcher; worker; reviewer
lifecyclePhases: pre-dispatch; pre-implementation
surfaceSelectors: Source Verification Block ACCEPT rows; Authority Chain rows in GC-018/work-order packets
detectionSignals: an ACCEPT row cites an AskUserQuestion answer, a provider-local chat exchange, or an agent's own prior turn as the source artifact instead of a CVF-governed file path
enforcementLevel: MACHINE_CHECKED
checkerBindings: governance/compat/check_closure_packaging_preflight.py (provider-local authority validation)
promotionState: MACHINE_CHECK_ADDED
supersedes: NONE
lastVerifiedCommit: 0fde5cf2
roadmapSeedId: ADIF-SEED-002
```

## Purpose

Record one observed defect pattern so an agent can recognize it before
citing an ACCEPT row's source in a Source Verification or Authority Chain
table.

## Scope / Applies To

Applies to Source Verification Block ACCEPT rows and Authority Chain rows
in GC-018/work-order packets. Does not apply to runtime, provider, or
public-sync behavior.

## Bad Example

> "ACCEPT - operator confirmed via AskUserQuestion that this field is
> correct." with no CVF-governed file path cited.

## Good Example

> "ACCEPT - `docs/reference/CVF_FINDING_TO_GOVERNANCE_LEARNING_TRIGGER_STANDARD.md`,
> Minimum defect classes section."

## Canonical Sources

- `docs/reviews/CVF_MPI_T6_REVIEW_GATE_HARDENING_COMPLETION_2026-06-22.md`
  (Findings / Position: provider-local authority violation observed at
  packet line 56)
- `docs/reference/CVF_FINDING_PROPAGATION_AND_ROOT_CAUSE_GROUPING_STANDARD_2026-06-16.md`
  (Provider Memory Is Not CVF Authority)

## Remediation

Every Source Verification or Authority Chain ACCEPT row must cite a
CVF-governed file path and section. Operator instructions, AskUserQuestion
answers, and provider-local chat exchanges are input that motivates a
decision; they are never themselves the cited source-verification authority.

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
