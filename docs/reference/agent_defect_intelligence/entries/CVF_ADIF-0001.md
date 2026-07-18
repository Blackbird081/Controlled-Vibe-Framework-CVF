# ADIF-0001 - Exhaustive Directory Claim Omits Actual Children

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0001
title: Exhaustive directory claim omits actual children
defectCategory: SOURCE_FIDELITY
defectClass: WORKER_EXECUTION_ERROR
defectRole: NOT_APPLICABLE_WITH_REASON: this entry is a general pattern, not a single finding row
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; Worker execution (WORKER_MUST_NOT_COMMIT)
roles: dispatcher; worker
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: completion reviews, audits, and dispatch packets that claim a directory or corpus was exhaustively read
detectionSignals: a packet claims "all files" or "every file" in a directory were read or enumerated without a matching enumeration command and reconciliation count
enforcementLevel: MACHINE_CHECKED
checkerBindings: governance/compat/check_closure_packaging_preflight.py (_validate_exhaustive_directory_claims)
promotionState: MACHINE_CHECK_ADDED
supersedes: NONE
lastVerifiedCommit: 0fde5cf2
roadmapSeedId: ADIF-SEED-001
```

## Purpose

Record one observed defect pattern so an agent can recognize it before
authoring a completion review, audit, or dispatch packet that claims
exhaustive directory coverage.

## Scope / Applies To

Applies to completion reviews, audits, and dispatch packets that claim a
directory or corpus was exhaustively read. Does not apply to runtime,
provider, or public-sync behavior.

## Bad Example

> "All files in `docs/reviews/` were read and no findings remain."

with no enumeration command, manifest, or reconciliation count shown.

## Good Example

> "47 files enumerated via `rg --files --hidden --no-ignore docs/reviews`;
> 47 read; 0 unresolved." with the Corpus Completeness And Report Integrity
> block populated.

## Canonical Sources

- `docs/reviews/CVF_MPI_T6_REVIEW_GATE_HARDENING_COMPLETION_2026-06-22.md`
  (Findings / Position: exhaustive directory claim violations observed at
  packet lines 95 and 141)
- `docs/reference/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_STANDARD_2026-06-01.md`

## Remediation

Use a fully qualified, safe enumeration command (`rg --files --hidden
--no-ignore` or equivalent direct filesystem reads) and populate the Corpus
Completeness And Report Integrity block with a manifest count, a ledger
terminal count, and an unresolved count before claiming a directory was
exhaustively processed.

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
