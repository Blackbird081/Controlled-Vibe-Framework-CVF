# ADIF-0024 - Worker Return Stale Evidence And Workspace Hygiene Drift

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0024
title: Worker return stale evidence and workspace hygiene drift
defectCategory: CLOSURE_EVIDENCE
defectClass: RULE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry records no-commit worker handoff evidence hygiene, not a single root-cause role row
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; Worker execution (WORKER_MUST_NOT_COMMIT); Reviewer-return review
roles: dispatcher; worker; reviewer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: no-commit work orders and docs/reviews worker-return packets that require command evidence, focused tests, or workspace cleanliness before COMPLETE_PENDING_REVIEW handoff
detectionSignals: worker return records stale failed or blocked command evidence after later source/test edits; expected focused command was not rerun; git status evidence omits untracked or provider-local workspace files; static-analysis diagnostics are neither fixed within scope nor recorded as out-of-scope disposition
enforcementLevel: PARTIAL_CHECK
checkerBindings: governance/compat/check_worker_return_quality_gate.py; governance/compat/check_agent_packet_authority_and_encoding.py; governance/compat/check_work_order_dispatch_quality.py
promotionState: RULE_EXISTS
supersedes: NONE
lastVerifiedCommit: 2b924255f
roadmapSeedId: NONE
```

## Purpose

Record the no-commit worker-output pattern where implementation work is mostly
usable, but the returned evidence is not closure-grade: command results are
stale, a required focused command was not rerun after the last material edit,
workspace status omits provider-local or IDE side-channel files, or a static
analysis diagnostic is left for the reviewer without an explicit in-scope or
out-of-scope disposition.

This entry is separate from checker-shape issues. A worker return can have the
right headings and still waste reviewer time if its command receipts and
workspace hygiene are not current at the handoff point.

## Scope / Applies To

Applies to `WORKER_MUST_NOT_COMMIT` source/test tranches and docs-only
decision tranches that return `COMPLETE_PENDING_REVIEW`.

It is especially relevant when a worker changes source or tests, then writes a
worker return from an earlier command result; when provider/model switching
creates local provider configuration files; or when an editor reports a
diagnostic for a file outside the work order's allowed edit set.

rawMemoryReleased=false. This entry records worker-return evidence hygiene
only; it does not release raw memory, private output, retrieval, reinjection,
or memory/RAG write behavior.

## Bad Example

A worker edits source and tests, runs a focused test early, then changes the
source again. The worker return still records the earlier failed or blocked
test as the final evidence and leaves review to discover that the current
focused command now passes. The same handoff omits current `git status
--short --untracked-files=all` evidence, so a provider-local file created by
the agent surface is discovered only during reviewer cleanup.

## Good Example

Before returning `COMPLETE_PENDING_REVIEW`, the worker runs a final
self-audit:

```markdown
Worker Output Quality Controls:

- exact required commands rerun after the last material edit, with current
  PASS/FAIL/BLOCKED result recorded;
- every required command copied exactly from the work order, with working
  directory and focused target when applicable;
- `git status --short --untracked-files=all` recorded after the worker return
  file is created, showing all pending owned files and no unexpected provider
  or IDE config files;
- any provider-local or IDE side-channel file is removed, ignored by local
  operator policy, or disclosed as pre-existing and not staged;
- any static-analysis diagnostic is either fixed inside allowed scope or
  recorded as out-of-scope with no source/test edit claim;
- at least one negative or edge-case test is added when the tranche touches
  security, private output, memory write, route release, or unsafe metadata
  normalization behavior.
```

The worker return treats stale evidence as a blocker, not as a note for the
reviewer to reinterpret.

## Canonical Sources

- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
  (self-reported gate evidence and no-commit worker-return requirements)
- `docs/reference/guard_orientation/README.md`
  (worker execution row and git status recording requirement)
- `docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md`
  (phase-gate and allowed-scope remediation discipline)
- `docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md`
  (closure evidence and file-change claim requirements)
- `docs/reviews/CVF_MSEA_R28_T20_MINERU_ACTUAL_DURABLE_STORE_INVOCATION_IMPLEMENTATION_COMPLETION_2026-07-05.md`
  (reviewer repair evidence for stale command result, unsafe marker
  normalization, and provider-local/no-Python-edit boundary)
- `governance/compat/check_worker_return_quality_gate.py`
  (partial worker-return quality coverage)
- `governance/compat/check_agent_packet_authority_and_encoding.py`
  (pending worker-return packet authority and status coverage)
- `governance/compat/check_work_order_dispatch_quality.py`
  (work-order dispatch quality coverage)

## Remediation

Dispatch authors should add a Worker Output Quality Controls section to any
no-commit source/test or high-evidence work order. The section should require
current command evidence, exact command replay, final workspace status,
provider-local/IDE side-channel cleanup or disclosure, static-analysis
diagnostic disposition, and a negative edge-case test when the tranche touches
security, private-output, memory-write, route-release, or unsafe metadata
normalization behavior.

Workers should run the final self-audit immediately before handoff, after the
worker return file exists. Reviewers should reject or repair a return that
claims blocked or stale command evidence when the required command can be
rerun inside allowed scope.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer role |
| Provider or surface | local workspace |
| Session or invocation | MSEA-R28-T20 worker-output quality hardening, 2026-07-05 |
| Working directory | repository root |
| Command or tool surface | startup reads, ADIF resolver read, template reads, apply_patch, governance gates |
| Target paths | this entry file; entries README; work-order template |
| Allowed scope source | operator approved hardening worker output quality controls before authoring the next tranche work order |
| Before status evidence | MSEA-R28-T20 closure required reviewer repair for stale command evidence and a normalization edge-case test, and operator noted provider-local side-channel file hygiene should be required in future worker instructions |
| After status evidence | ADIF-0024 records the reusable pattern and the work-order template now includes Worker Output Quality Controls for future no-commit worker returns |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | defect-record and work-order-template guidance only |
| Claim boundary | defect-record and template guidance only; no checker implementation, runtime/provider/live behavior, source import, public-sync, package activation, adapter behavior, or production claim |
| Agent type | reviewer/closer |
| Invocation ID | `msea-r28-t20-worker-output-quality-hardening-2026-07-05` |
| Expected manifest | this entry; entries README; work-order template |
| Actual changed set | this entry; entries README; work-order template |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry and work-order authoring guidance. No
public-sync claim.

## Claim Boundary

This entry records a worker-return evidence and workspace-hygiene pattern. It
does not modify any checker, claim automatic detection of every stale command
or provider-local side-channel file, authorize source/test work, or assert
runtime/provider/live, public-sync, MCP/CLI adapter, package lifecycle, action
authority, automatic invocation, document-truth, extraction-accuracy, or
production behavior.

## Epistemic Process Block

EPISTEMIC_PROCESS_NA_WITH_REASON: this defect entry records a confirmed
artifact-authoring and evidence-hygiene pattern, not an empirical
provider/runtime claim.
