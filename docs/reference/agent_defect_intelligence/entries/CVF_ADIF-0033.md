# ADIF-0033 - Protected Path Listed Without Dispatch Authorization

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0033
title: Protected path listed without dispatch authorization
defectCategory: SCOPE_AND_OWNERSHIP
defectClass: ORCHESTRATOR_PACKET_GAP
defectRole: dispatcher
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; Worker execution (`WORKER_MUST_NOT_COMMIT`); Live runtime or provider proof
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: work-order fulfillment manifests and planned worker paths under governance/compat, CVF_SESSION, active handoff, or other core-guard protected families
detectionSignals: dispatch packet is ready and requires a protected output path but carries no Core Guard Self-Protection Authorization naming that path; worker positive gate fails only after creating the required file
enforcementLevel: PARTIAL_CHECK
checkerBindings: governance/compat/check_core_guard_self_protection.py; governance/compat/check_closure_packaging_preflight.py
promotionState: MACHINE_CHECK_CANDIDATE
supersedes: NONE
lastVerifiedCommit: aad31dc23
roadmapSeedId: NONE
```

## Purpose

Prevent a dispatcher from listing a protected worker output path while relying
on a later worker return or closure artifact to supply authorization. The
authorization must exist in the dispatch packet before the worker creates the
path.

## Scope / Applies To

Applies to ready GC-018 baselines and work orders whose fulfillment manifest,
allowed scope, or reviewer conversion requires a new or changed path protected
by the core guard. Existing closure-time checks remain useful but do not fully
prevent this dispatch-time trap.

## Bad Example

> Require a new test under `governance/compat`, mark the packet dispatch-ready,
> and omit the Core Guard Self-Protection Authorization block because the file
> is "only a test."

## Good Example

> Before dispatch, classify every planned output path. For each protected path,
> include an authorization block naming the exact path, operator authority,
> and rollback boundary, or relocate the output to a non-protected proof-test
> owner. Run a controlled manifest-path preflight before worker execution.

## Canonical Sources

- `governance/toolkit/05_OPERATION/CVF_CORE_GUARD_SELF_PROTECTION_GUARD.md`
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
- `governance/compat/check_core_guard_self_protection.py`
- `governance/compat/check_closure_packaging_preflight.py`
- `docs/work_orders/CVF_AGENT_WORK_ORDER_SYSTEM_CHAIN_UC04A_CLI_OPERATOR_READOUT_2026-07-14.md`
- `docs/reviews/CVF_SYSTEM_CHAIN_UC04A_CLI_OPERATOR_READOUT_WORKER_RETURN_2026-07-14.md`

## Remediation

1. Classify all planned worker and conditional output paths before dispatch.
2. If any path is core-guard protected, put the complete authorization carrier
   in the GC-018/work order before ready status and name the exact path.
3. Do not treat a later worker return authorization as retroactive dispatch
   authority.
4. On discovery after one bounded call, retain diagnostic evidence, close the
   attempt blocked, and authorize only the smallest recovery call.
5. Promote to a dispatch-quality machine check that compares manifest paths
   with the protected-path classifier if the existing carrier check does not
   already cover the exact artifact shape.

## Epistemic Process Block

### Expected Result / Prediction

The UC-04A positive CLI call was expected to pass because its source packet and
worker output shape had passed pre-dispatch and pre-implementation gates.

### Evidence Comparison

The worker created the exact required protected test path. The positive CLI
then failed only the core-guard and closure-packaging checks because no
dispatch-time authorization carrier named that path. The negative CLI behavior
passed and the CLI owner was not mutated.

### Contradiction Or Gap Disposition

The gates behaved correctly. The contradiction is between the packet's
declared ready status and its incomplete protected-path authority.

### Claim Update

Passing dispatch gates before a not-yet-created protected output does not prove
the future worker manifest is authorized. Planned protected paths require
explicit dispatch-time classification and carrier evidence.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer |
| Provider or surface | local private provenance workspace |
| Session or invocation | SCLP-UC04A-T3 blocked closure, 2026-07-14 |
| Working directory | repository root |
| Command or tool surface | worker-return review, receipt/diagnostic comparison, focused pytest, reviewer-fast gate, source search |
| Target paths | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0033.md`; entries README |
| Allowed scope source | mandatory ADIF learning and reviewer-owned UC-04A closure |
| Before status evidence | ready dispatch packet listed a protected focused-test path without an authorization carrier |
| After status evidence | ADIF-0033 makes the packet trap resolver-discoverable and recovery is narrowed to one positive call |
| Diff evidence | new entry and README row in the UC-04A blocked closure batch |
| Approval boundary | reviewer learning and bounded blocked closure only; no checker semantic change or proof retry |
| Claim boundary | defect record and machine-check candidate only |
| Agent type | reviewer/closer |
| Invocation ID | system-chain-uc04a-adif-0033-2026-07-14 |
| Expected manifest | ADIF-0033 entry and entries README row |
| Actual changed set | ADIF-0033 entry and entries README row |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reviewer-learning record; no public-sync action.

## Claim Boundary

This entry records a dispatch-authority defect and recovery discipline. It does
not implement a new checker, invalidate existing core guards, authorize guard
semantics changes, or prove UC-04A positive CLI operation.
