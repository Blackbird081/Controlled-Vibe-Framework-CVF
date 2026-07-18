# ADIF-0022 - Literal Evidence Row False Positives In Worker Returns

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0022
title: Literal evidence row false positives in worker returns
defectCategory: GATE_TRIGGER_FRICTION
defectClass: RULE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry records cross-role artifact authoring friction, not a single worker fault
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Worker execution (WORKER_MUST_NOT_COMMIT); Reviewer-return review; Closure
roles: worker; reviewer; closer
lifecyclePhases: pre-implementation; pre-closure
surfaceSelectors: docs/reviews worker-return packets and finding-bearing review evidence sections
detectionSignals: a NOT_EXISTS evidence row repeats a never-created optional docs/reviews path, or a Finding-To-Governance row uses N/A_WITH_REASON in the defect-class position
enforcementLevel: PARTIAL_CHECK
checkerBindings: governance/compat/check_agent_packet_authority_and_encoding.py; governance/compat/check_finding_to_governance_learning.py
promotionState: RULE_EXISTS
supersedes: NONE
lastVerifiedCommit: 8ffa0182
roadmapSeedId: NONE
```

## Purpose

Record the MFE-R1 worker-return pattern where parseable evidence text can trip
literal guards even when the human intent is clear. The two observed traps were
an optional governed artifact path repeated in an absence-evidence row, and a
Finding-To-Governance learning row that used a disposition token where the
checker required a defect-class enum token.

## Scope / Applies To

Applies to worker returns, completion reviews, and review evidence tables that
describe optional decision packets, optional completion packets, or
finding-bearing governance lessons.

It does not change checker behavior. It tells authors to shape evidence so the
existing gates see the intended contract.

## Bad Example

A worker return records a command proving an optional decision packet was not
created, but the row includes the full never-created `docs/reviews/...md` path.
The authority-and-encoding gate reads that literal path as a missing authority
artifact.

A finding row records a reusable lesson, but places `N/A_WITH_REASON` in the
defect-class position. The Finding-To-Governance gate requires one of its
`DEFECT_CLASSES` enum values once a finding row exists.

## Good Example

For optional absence evidence, write that the optional decision-packet planned
path was checked and was intentionally not created, then cite the existing
worker return or work order path. Do not repeat the never-created governed path
as a parseable `docs/.../*.md` token.

For a reusable learning row, choose a real defect class such as `RULE_GAP`,
`MACHINE_GATE_GAP`, or `ORCHESTRATOR_PACKET_GAP`, then use
`N/A_WITH_REASON` only as a disposition when the note is non-reusable or
session-local.

## Canonical Sources

- `docs/reference/CVF_GOVERNED_ARTIFACT_LITERAL_FORMAT_GOTCHAS_2026-06-25.md`
  (items 36 and 37)
- `governance/compat/check_agent_packet_authority_and_encoding.py`
  (`AUTHORITY_REFERENCE_RE` and review-packet missing-authority validation)
- `governance/compat/check_finding_to_governance_learning.py`
  (`DEFECT_CLASSES`, `DISPOSITIONS`, and finding-bearing artifact validation)
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
  (Finding-To-Governance enum reminder that `N/A_WITH_REASON` is a disposition,
  not a defect class)

## Remediation

Before finalizing a worker return or review evidence table, scan any absence
evidence rows for literal optional governed paths that were deliberately not
created. Replace those literals with prose and cite an existing governed
artifact. For any finding-bearing row, verify the defect-class cell contains a
checker-accepted enum before using `N/A_WITH_REASON` in any disposition cell.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer role |
| Provider or surface | local workspace |
| Session or invocation | MFE-R1 literal evidence row learning addendum, 2026-07-02 |
| Working directory | repository root |
| Command or tool surface | source reads, rg, apply_patch, governance gates |
| Target paths | this entry file; entries README; literal-format gotchas |
| Allowed scope source | operator instruction to handle the MFE-R1 literal-format traps for future work |
| Before status evidence | MFE-R1 worker execution self-caught optional-path evidence and Finding-To-Governance defect-class traps |
| After status evidence | ADIF-0022 records the literal evidence row pattern for future resolver results |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | defect record and artifact-authoring guidance only |
| Claim boundary | defect-record only; no new checker, runtime/provider/live behavior, public-sync, package activation, adapter behavior, or production claim |
| Agent type | reviewer/closer |
| Invocation ID | `mfe-r1-literal-evidence-row-learning-2026-07-02` |
| Expected manifest | this entry; entries README; literal-format gotchas |
| Actual changed set | this entry; entries README; literal-format gotchas |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry and authoring guidance. No public-sync
claim.

## Claim Boundary

This entry records literal evidence-row authoring traps and points to existing
partial guard surfaces. It does not modify any checker, create a resolver
mutation, authorize source import, or assert runtime/provider/live, public-sync,
MCP/CLI adapter, package lifecycle, action authority, automatic invocation, or
production behavior.

## Epistemic Process Block

EPISTEMIC_PROCESS_NA_WITH_REASON: this defect entry records a confirmed
artifact-authoring and checker-literal pattern, not an empirical
provider/runtime claim.
