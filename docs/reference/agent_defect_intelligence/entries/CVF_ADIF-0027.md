# ADIF-0027 - Absorption Omits Reverse Architecture Projection

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0027
title: Absorption omits reverse architecture projection
defectCategory: CLOSURE_EVIDENCE
defectClass: RULE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: general absorption-closure pattern, not one worker finding row
severity: HIGH
lifecycleState: ACTIVE
taskClasses: External knowledge absorption; Reviewer-return review; Closure
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-dispatch; pre-closure
surfaceSelectors: absorption roadmaps, owner maps, canonical contracts, completion reviews, architecture catalog, system-chain gaps, stable README and index front doors
detectionSignals: accepted absorption creates a capability, owner, boundary, contract family, rejected shape, or GAP but omits or does not explicitly defer Catalog/GAP/README/Index projection
enforcementLevel: GUIDANCE_ONLY
checkerBindings: NOT_APPLICABLE_WITH_REASON: architecture impact and owner novelty require semantic review
promotionState: RULE_EXISTS
supersedes: NONE
lastVerifiedCommit: 8e318cc92
roadmapSeedId: NONE
```

## Purpose

Make absorption bidirectional: accepted value must update discoverable CVF
architecture when it reveals a capability, owner, contract family, or GAP.

## Scope / Applies To

Applies after accepted owner/architecture/contract/gap decisions. Pending worker
output remains candidate evidence and must not become an as-built fact.

## Bad Example

> Absorption establishes new modules and contracts, but Catalog/GAP remain
> unchanged, forcing the next agent to repeat owner discovery.

## Good Example

> Closure maps each accepted capability to an existing/new Catalog entry, GAP
> entry, or bounded defer; generated aggregates are rebuilt from source entries.

## Canonical Sources

- `docs/reference/system_architecture_catalog/README.md` (as-built catalog)
- `docs/reference/system_chain/gaps/README.md` (GAP front door)
- `docs/reference/CVF_JSON_GENERATED_AGGREGATE_DISCIPLINE_STANDARD_2026-06-12.md` (generated-source discipline)
- `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` (absorption routing)
- `docs/roadmaps/CVF_SOT_THREE_LAYER_ABSORPTION_ROADMAP_2026-07-12.md` (SOT3 evidence)

## Remediation

Architecture-changing absorption must include this closure matrix:

| Column | Meaning |
|---|---|
| `Absorbed capability or gap` | accepted doctrine, module, contract, rejected shape, or missing owner |
| `Existing catalog/GAP owner checked` | exact entry or `OWNER_SURFACE_NOT_FOUND` |
| `Projection disposition` | `UPDATE_EXISTING`, `ADD_CATALOG_ENTRY`, `ADD_GAP_ENTRY`, `DEFER_PENDING_ACCEPTANCE`, or `NOT_APPLICABLE_WITH_REASON` |
| `Target source path` | compact source entry or stable README/Index |
| `Claim class` | `AS_BUILT`, `CONTRACT_ONLY`, `OWNER_CANDIDATE`, `RUNTIME_CANDIDATE`, or `REJECTED_COMPETING_SHAPE` |
| `Evidence` | accepted artifact/commit or pending-review reason |

Closure is incomplete if accepted architecture-changing absorption omits this
matrix or leaves projection unexplained. Before acceptance use
`DEFER_PENDING_ACCEPTANCE`, never `AS_BUILT`.

## Epistemic Process Block

### Expected Result / Prediction

Without reverse projection, later agents repeat searches and miss known GAPs.

### Evidence Comparison

The earlier catalog correctly described then-existing CVF but could not name
most SOT concepts; SOT3 later discovered new owners and gaps.

### Contradiction Or Gap Disposition

The prior catalog was valid. The missing rule was extension after absorption.

### Claim Update

Accepted absorption is knowledge conversion plus potential architecture
completion; pending candidates remain distinct from as-built facts.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer |
| Provider or surface | local private provenance workspace |
| Session or invocation | SOT3 reverse-projection learning, 2026-07-12 |
| Working directory | repository root |
| Command or tool surface | governed reads, rg, apply_patch, ADIF integrity and resolver checks |
| Target paths | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0027.md`; `docs/reference/agent_defect_intelligence/entries/README.md`; `docs/reference/guard_orientation/README.md` |
| Allowed scope source | operator instruction to require Catalog/GAP reverse projection |
| Before status evidence | SOT3 found concepts absent from prior Catalog/GAP with no general projection rule |
| After status evidence | ADIF-0027 defines mandatory projection disposition and pending/as-built separation |
| Diff evidence | new entry and bounded guidance changes; `git diff --name-status` before commit |
| Approval boundary | guidance only; no catalog aggregate mutation, runtime, public-sync, or T2 acceptance |
| Claim boundary | agent-enforced rule; no machine-proof claim |
| Agent type | reviewer/closer |
| Invocation ID | `sot3-reverse-projection-adif-2026-07-12` |
| Expected manifest | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0027.md`; `docs/reference/agent_defect_intelligence/entries/README.md`; `docs/reference/guard_orientation/README.md` |
| Actual changed set | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0027.md`; `docs/reference/agent_defect_intelligence/entries/README.md`; `docs/reference/guard_orientation/README.md` |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance architecture-learning record.

## Claim Boundary

This entry requires reverse projection after accepted absorption. It does not
itself update SOT3 into as-built catalog or authorize implementation.
