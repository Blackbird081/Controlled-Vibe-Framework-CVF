# ADIF-0028 - Aggregated Output Exceeds Per-Item Authority Evidence

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0028
title: Aggregated output exceeds per-item authority evidence
defectCategory: AUTHORITY_BOUNDARY
defectClass: RULE_GAP
defectRole: reviewer
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; Worker execution (`WORKER_MUST_NOT_COMMIT`); Reviewer-return review; Closure
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: governed adapters that aggregate multiple records, chunks, sources, packets, evidence references, decisions, or distribution packages into one output
detectionSignals: output contains multiple governed items while evidence, decision, reference, receipt, or package identifiers cover only one item; multi-item test is absent; one packet is assumed valid for heterogeneous records
enforcementLevel: GUIDANCE_ONLY
checkerBindings: NOT_APPLICABLE_WITH_REASON: per-item authority completeness requires semantic source and test review
promotionState: DESIGN_REVIEW_REQUIRED
supersedes: NONE
lastVerifiedCommit: 5ef2b597b
roadmapSeedId: NONE
```

## Purpose

Prevent an adapter from aggregating multiple governed items into an approved
output when its authority evidence covers only a subset of those items.

## Scope / Applies To

Applies to product adapters, orchestrators, retrieval pipelines, review
packets, and distribution flows that combine multiple source records or
decision-bearing items. It does not require one universal runtime shape; it
requires explicit item-to-authority cardinality and negative proof.

## Bad Example

> Build one packet from several chunks, register evidence for the first source,
> then distribute all chunk content under the resulting reference.

## Good Example

> Preserve each chunk and source identity, prove a complete authority chain for
> every included item, and aggregate only items whose own terminal state meets
> the admission rule. Record all resulting identifiers or a source-backed
> many-to-one invariant.

## Canonical Sources

- `docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md`
  (layer boundaries and handoff contracts)
- `docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_INVARIANTS_AND_NEGATIVE_CASES.md`
  (fail-closed negative cases)
- `docs/work_orders/CVF_AGENT_WORK_ORDER_SOT3_ACT_A1_SCOPED_KNOWLEDGE_CONTEXT_PRODUCT_ADAPTER_2026-07-13.md`
  (exact packet/source binding and multi-layer adapter requirements)
- `docs/reviews/CVF_SOT3_ACT_A1_SCOPED_KNOWLEDGE_CONTEXT_PRODUCT_ADAPTER_COMPLETION_2026-07-13.md`
  (observed defect and bounded repair evidence)

## Remediation

Before accepting any multi-item governed adapter:

1. State the intended item-to-packet, item-to-evidence, item-to-decision,
   item-to-reference, and item-to-output cardinalities.
2. Source-verify any many-to-one authority invariant. Do not infer it from a
   single-item happy path.
3. Add at least one heterogeneous multi-item test that would fail if one item
   were uncovered, conflicting, rejected, stale, or missing provenance.
4. Record all terminal identifiers needed to trace every included item, or
   fail closed before aggregation.
5. If the owner package treats heterogeneous records as conflicts or review
   required, run independent lifecycles and aggregate only accepted outputs.

## Epistemic Process Block

### Expected Result / Prediction

A single-item lifecycle test was expected to generalize to a retrieved set.

### Evidence Comparison

SOT3-ACT-A1 review showed the initial set-level packet conflicted with
Refinery multi-record semantics and registered Kernel evidence for only the
first source while formatting all chunks for output.

### Contradiction Or Gap Disposition

The prediction was rejected. The accepted repair runs one complete lifecycle
per chunk and aggregates only acknowledged outputs, with complete ID arrays.

### Claim Update

Single-item success is not proof of multi-item authority completeness.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer |
| Provider or surface | local private provenance workspace |
| Session or invocation | SOT3-ACT-A1 authority-cardinality learning, 2026-07-13 |
| Working directory | repository root |
| Command or tool surface | governed source reads, focused multi-item test, `apply_patch`, ADIF integrity and resolver checks |
| Target paths | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0028.md`; `docs/reference/agent_defect_intelligence/entries/README.md` |
| Allowed scope source | Mandatory ADIF Defect Registry Disclosure rule for a new non-obvious reviewer finding |
| Before status evidence | A1 single-item tests passed while multi-item packet/evidence cardinality remained untested |
| After status evidence | ADIF-0028 makes per-item authority cardinality discoverable for future dispatch, implementation, and review |
| Diff evidence | new entry and front-door row; `git diff --name-status` before material commit |
| Approval boundary | governed defect learning only; no checker, runtime, provider, public-sync, or session-state change |
| Claim boundary | guidance record only; no automatic detection or prevention claim |
| Agent type | reviewer/closer |
| Invocation ID | sot3-act-a1-adif-0028-2026-07-13 |
| Expected manifest | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0028.md`; `docs/reference/agent_defect_intelligence/entries/README.md` |
| Actual changed set | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0028.md`; `docs/reference/agent_defect_intelligence/entries/README.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reviewer-learning record. No public-sync action is
authorized.

## Claim Boundary

This entry requires semantic review of item-to-authority completeness before
multi-item governed output is accepted. It does not implement a checker,
change SOT3 owner semantics, prove live behavior, or authorize public export.
