# ADIF-0038 - Worker Return Fast Gate Accepts Scaffold Closure Residue

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0038
title: Worker return fast gate accepts scaffold closure residue
defectCategory: CLOSURE_EVIDENCE
defectClass: MACHINE_GATE_GAP
defectRole: worker
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Reviewer-return review; Closure
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-implementation; pre-closure
surfaceSelectors: no-commit worker returns containing a Machine Closure Package copied from the governed scaffold
detectionSignals: worker-return fast gate reports PASS while TODO-prefixed status or work-order values and generic must-list or must-record instructions remain
enforcementLevel: PARTIAL_CHECK
checkerBindings: governance/compat/check_worker_return_quality_gate.py; governance/compat/check_machine_closure_package.py
promotionState: MACHINE_CHECK_CANDIDATE
supersedes: NONE
lastVerifiedCommit: 9c04a8d67
roadmapSeedId: NONE
```

## Purpose

Prevent a passing worker-return fast gate from being treated as proof that the
returned packet contains final closure evidence rather than scaffold text.

## Scope / Applies To

Applies to pending worker returns with a Machine Closure Package, especially
no-commit returns that a reviewer will convert into closure evidence.

## Bad Example

Report `COMPLETE_PENDING_REVIEW` and a passing fast gate while a lower machine
package still contains a TODO-prefixed status, a placeholder work-order path,
and instructions saying the worker must later list paths or record results.

## Good Example

Before handoff, scan the entire return for scaffold residue and replace every
machine-package value with the actual status, governed path, exact changed set,
and observed gate disposition. A reviewer repeats the raw scan before closure.

## Canonical Sources

- `docs/reference/CVF_GOVERNED_ARTIFACT_LITERAL_FORMAT_GOTCHAS_2026-06-25.md`
- `docs/reference/work_order_authoring/CVF_WORKER_RETURN_QUALITY_GATE_STANDARD.md`
- `docs/reviews/CVF_SYSTEM_CHAIN_UC04B_R3R2_REVIEWER_AUTH_PROJECTION_REPAIR_COMPLETION_2026-07-15.md`
- `docs/reviews/CVF_SYSTEM_CHAIN_UC04B_R3R3_REVIEWER_NEGATIVE_PROOF_WORKER_RETURN_2026-07-15.md`

## Remediation

1. Run the existing worker-return fast gate.
2. Independently scan the complete returned artifact for `TODO_` and generic
   scaffold instructions such as `must list real paths` or `must record`.
3. Reject or bounded-repair every residue with actual command-backed evidence.
4. Treat a fast-gate PASS plus surviving residue as a checker gap, not a clean
   worker return.
5. In a separately authorized guard-maintenance batch, extend the existing
   checkers to cover these pending-return machine-package values.

## Epistemic Process Block

### Expected Result / Prediction

A worker-return fast-gate PASS should imply that no unresolved scaffold value
remains in the returned Machine Closure Package.

### Evidence Comparison

R3R2 and R3R3 both reported a fast-gate PASS while their returned machine
packages still contained placeholder status/path values and generic future
instructions.

### Contradiction Or Gap Disposition

The repeated evidence contradicts complete placeholder coverage in the current
fast gate. Keep the gate, add a mandatory raw reviewer scan, and route checker
hardening to a separately authorized guard-maintenance batch.

### Claim Update

The existing fast gate is useful but only partial for scaffold finalization; a
PASS is not standalone proof that the whole return is residue-free.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer |
| Provider or surface | local private provenance workspace |
| Session or invocation | SCLP-UC04B-R3R3 closure, 2026-07-15 |
| Working directory | repository root |
| Command or tool surface | worker-return raw scan, existing fast-gate result, bounded `apply_patch` repair |
| Target paths | this entry, entries README, and the R3R3 worker return |
| Allowed scope source | mandatory ADIF recurring-defect disclosure and reviewer-owned R3R3 closure |
| Before status evidence | R3R2 and R3R3 fast gates passed while their machine packages retained scaffold placeholders |
| After status evidence | recurring pattern is resolver-discoverable and R3R3 residue is repaired |
| Diff evidence | new entry, README row, and bounded worker-return repair in the R3R3 closure set |
| Approval boundary | record and repair closure evidence only; no checker mutation or live rerun |
| Claim boundary | partial-check defect record; no machine prevention claim |
| Agent type | reviewer/closer |
| Invocation ID | system-chain-uc04b-adif-0038-2026-07-15 |
| Expected manifest | ADIF-0038 entry, entries README row, and R3R3 worker-return repair |
| Actual changed set | ADIF-0038 entry, entries README row, and R3R3 worker-return repair |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: none |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance learning record; no public-sync action.

## Claim Boundary

This entry records a recurring finalization and checker-coverage defect. It does
not modify a checker, prove universal detection, or expand the R3R3 business
claim.
