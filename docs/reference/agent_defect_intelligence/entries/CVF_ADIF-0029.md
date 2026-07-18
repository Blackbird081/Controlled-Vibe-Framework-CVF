# ADIF-0029 - Durable Evidence Projection And Admission Drift

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0029
title: Durable evidence projection and admission drift
defectCategory: AUTHORITY_BOUNDARY
defectClass: WORKER_EXECUTION_ERROR
defectRole: reviewer
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; Worker execution (`WORKER_MUST_NOT_COMMIT`); Reviewer-return review; Closure
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: durable evidence records, owner-output projections, integrity-bound stores, replay records, diagnostic audit projections
detectionSignals: owner-declared fields are omitted from a durable trace; append accepts a record that the next read rejects; canonical hash exists but document bytes depend on insertion order; distinct store errors collapse to one audit diagnostic
enforcementLevel: GUIDANCE_ONLY
checkerBindings: NOT_APPLICABLE_WITH_REASON: projection completeness and admission symmetry require semantic source and negative-test review
promotionState: DESIGN_REVIEW_REQUIRED
supersedes: NONE
lastVerifiedCommit: 8d928802b
roadmapSeedId: NONE
```

## Purpose

Prevent a durable evidence feature from appearing replay-safe while its write
projection omits owner fields, its ingress accepts records that later fail
read validation, or its audit collapses materially different failure classes.

## Scope / Applies To

Applies to local or external durable evidence stores, receipts, replay logs,
activation records, and adapters that copy authoritative owner outputs into a
persisted projection. It does not prescribe one database or serialization
technology.

## Bad Example

> Copy only receipt ID and hash, accept any caller-supplied record and hash,
> write non-canonical JSON, then report corrupt input, duplicate conflict, and
> write failure under one generic persistence diagnostic.

## Good Example

> Source-verify every required owner field, copy the complete bounded owner
> projection, strictly admit the same schema later used for reads, verify the
> incoming integrity hash before mutation, canonicalize document ordering, and
> preserve distinct failure diagnostics through the audit boundary.

## Canonical Sources

- `docs/work_orders/CVF_AGENT_WORK_ORDER_SOT3_ACT_A2_DURABLE_ACTIVATION_EVIDENCE_2026-07-13.md`
  (evidence schema, owner projection, atomic store, and diagnostic contract)
- `docs/reviews/CVF_SOT3_ACT_A2_DURABLE_ACTIVATION_EVIDENCE_COMPLETION_2026-07-13.md`
  (observed A2 defects, bounded repair, and negative proof)
- `docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md`
  (Refinery, Kernel, and Flow owner boundaries)

## Remediation

Before accepting a durable evidence implementation:

1. Build a field-by-field projection matrix from every authoritative owner
   type to the persisted trace; test high-value bindings, not only IDs.
2. Apply the same strict, versioned record schema at append and read. Reject
   unknown keys so raw content cannot be smuggled through a typed boundary.
3. Verify an incoming record's canonical integrity projection before any main
   file mutation.
4. Canonicalize object keys and record ordering; prove byte equality across
   different append orders for the same semantic record set.
5. Preserve corrupt-store, record-integrity, duplicate-conflict, and
   write/replace diagnostic classes through route and audit projection.
6. Inject request identity and clock dependencies in deterministic tests when
   they contribute to record identity or integrity.

## Epistemic Process Block

### Expected Result / Prediction

Passing atomic-write, restart, duplicate, and corruption tests was expected to
be sufficient evidence for bounded replay-safe local persistence.

### Evidence Comparison

SOT3-ACT-A2 review found that the first worker return passed 66 focused tests,
yet omitted multiple owner-declared Kernel and Flow fields, admitted an
unverified new record that would corrupt its own next read, emitted
insertion-order-dependent document bytes, and collapsed distinct failures in
route audit.

### Contradiction Or Gap Disposition

The prediction was rejected. The accepted repair couples owner projection,
strict incoming admission, canonical serialization, and diagnostic
preservation, with new negative tests for each boundary.

### Claim Update

Storage happy paths and read-side corruption tests alone do not prove durable
evidence replay integrity.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer |
| Provider or surface | local private provenance workspace |
| Session or invocation | SOT3-ACT-A2 durable-evidence review, 2026-07-13 |
| Working directory | repository root |
| Command or tool surface | source/type review, focused negative tests, `apply_patch`, ADIF resolver and integrity guard |
| Target paths | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0029.md`; `docs/reference/agent_defect_intelligence/entries/README.md` |
| Allowed scope source | Mandatory ADIF rule for a new non-obvious reviewer finding and A2 reviewer closure authority |
| Before status evidence | A2 worker return passed 66 focused tests while durable projection/admission/diagnostic symmetry remained incomplete |
| After status evidence | ADIF-0029 makes the combined projection, admission, canonicalization, and diagnostic review pattern discoverable |
| Diff evidence | new entry and front-door row; `git diff --name-status` before material commit |
| Approval boundary | governed defect learning only; no checker, provider, public-sync, or session-state change |
| Claim boundary | guidance record only; no automatic semantic detection or prevention claim |
| Agent type | reviewer/closer |
| Invocation ID | sot3-act-a2-adif-0029-2026-07-13 |
| Expected manifest | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0029.md`; `docs/reference/agent_defect_intelligence/entries/README.md` |
| Actual changed set | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0029.md`; `docs/reference/agent_defect_intelligence/entries/README.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reviewer-learning record. No public-sync action is
authorized.

## Claim Boundary

This entry requires semantic review of durable projection and store-admission
symmetry. It does not implement a checker, mandate a storage technology, prove
live or distributed durability, or authorize public export.
