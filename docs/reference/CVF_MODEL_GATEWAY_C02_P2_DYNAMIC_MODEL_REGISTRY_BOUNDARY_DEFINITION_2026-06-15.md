# CVF Model Gateway C-02 P2 Dynamic Model Registry Boundary Definition

Memory class: FULL_RECORD

rawMemoryReleased=false

Status: ACTIVE

Date: 2026-06-15

---

## Purpose

This document defines the merge-strategy boundary between the three registry
surfaces that together govern provider and model selection in the CVF Model
Gateway. It is the authoritative reference for P2 scope decisions and for
any future implementation tranche that names one of these surfaces.

## Scope

Applies to: `EXTENSIONS/CVF_MODEL_GATEWAY/` registry boundary decision only.

Does not apply to: runtime `DynamicModelRegistry` implementation (not
authorized in P2), P3 unified gateway interface, strategy-layer components,
AI Gateway absorption, or any external registry.

---

## Registry Surface Boundary

### Surface 1: PROVIDER_CAPABILITY_REGISTRY (static, deploy-time)

Location: `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts`

Role: authoritative source of truth for which methods each provider model
supports at deploy time. The `supportedMethods` array in any `DynamicModelRecord`
must be derived from or consistent with this registry at the time a dynamic
record is constructed. P2 does not mutate this surface.

### Surface 2: ProviderRegistry (runtime, routable-provider decisions)

Location: `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-registry.ts`

Role: authoritative runtime registry for which providers are registered,
enabled, and routable. `isRoutable` and `assertAllowed` are the canonical
gate calls before any dispatch. P2 does not mutate this surface.

### Surface 3: DynamicModelRegistry (future, tier and health enrichment)

Contract: `EXTENSIONS/CVF_MODEL_GATEWAY/src/dynamic-model-registry-contract.ts`

Role: the future `DynamicModelRegistry` merges static capability facts from
`PROVIDER_CAPABILITY_REGISTRY` with runtime health state from
`ProviderHealthMonitor` and adds tier, cost, and latency metadata.
It does NOT replace either existing surface; it extends the information
available for optimal model selection.

P2 defines the contract only (`DynamicModelRegistryContract` interface). No
runtime class implementation exists after P2. A future implementation
tranche must cite this contract as its interface authority, require a fresh
GC-018, and must not mutate the two existing registries above.

---

## Merge-Strategy Rules

| Rule | Detail |
|---|---|
| MR-1 | `PROVIDER_CAPABILITY_REGISTRY` is the sole truth source for `supportedMethods` at deploy time |
| MR-2 | `ProviderRegistry.isRoutable` is the sole gate for runtime routable-provider decisions |
| MR-3 | A future `DynamicModelRegistry` consumes (reads) both surfaces; it does not replace them |
| MR-4 | Health state in a `DynamicModelRecord.healthState` reuses the 5-value `ProviderHealthState` from `provider-health.ts`; no parallel union is declared |
| MR-5 | `DynamicModelRecord.status` reuses `ProviderStatus` from `provider-registry.ts`; no parallel status union is declared |
| MR-6 | P2 mutates neither existing registry; the only additive change is the new contract file and its barrel export |

---

## Verification Boundary

This document is a planning and boundary definition artifact only. It does
not claim:

- Runtime behavior of any existing or future `DynamicModelRegistry`.
- That the P2 contract file contains any runtime implementation.
- Production readiness, hosted readiness, or public readiness.
- Provider or API call behavior.

Evidence of the types-only constraint is in `git diff` of
`dynamic-model-registry-contract.ts`: no class body, no `new`, no runtime
statement beyond declarations and one literal version constant.

## Claim Boundary

Private provenance document. Public export disposition: `DEFERRED_PRIVATE_ONLY`.
No public-sync authorized by this document.
