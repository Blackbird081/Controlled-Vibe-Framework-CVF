# CVF Model Gateway C-02 P3 Unified Gateway Interface Boundary Definition

Memory class: FULL_RECORD

rawMemoryReleased=false

Status: ACTIVE

Date: 2026-06-15

---

## Purpose

This document defines the boundary between the existing Model Gateway fragment
contracts and the new `UnifiedGatewayInterfaceContract` introduced in P3. It
is the authoritative reference for P4 implementation and any future tranche
that names the unified gateway entry point.

## Scope

Applies to: `EXTENSIONS/CVF_MODEL_GATEWAY/` unified gateway interface boundary
decision only.

Does not apply to: runtime `UnifiedGatewayInterface` class implementation
(not authorized in P3), EPF integration wiring, strategy-layer components,
AI Gateway absorption, or any external registry.

---

## Fragment Contract Coverage (Retained Authority)

Each existing fragment contract retains its own authority and is NOT mutated
by P3.

### stream-contract.ts (35L)

Covers: `StreamRequest`, `StreamContract`, `StreamCapableProvider`,
`isStreamContract` guard, `STREAM_CONTRACT_REQUIRED_FIELDS`.

Authority retained: individual provider stream adapter shape. A provider that
supports streaming must implement `StreamCapableProvider`. This surface is
unchanged by P3.

### embedding-contract.ts (38L)

Covers: `EmbeddingRequest`, `EmbeddingContract`, `EmbeddingCapableProvider`,
`isEmbeddingContract` guard, `EMBEDDING_CONTRACT_REQUIRED_FIELDS`.

Authority retained: individual provider embedding adapter shape. Unchanged by P3.

### provider-health.ts (74L)

Covers: `ProviderHealthState`, `ProviderHealthRecord`, `ProviderHealthMonitor`
class with `recordSuccess`, `recordFailure`, `isUsable`, and `classifyFailure`.

Authority retained: runtime health monitoring and state transitions for
individual providers. `ProviderHealthState` (5-value union) is the canonical
health type; P3 reuses it by import for `GatewayHealthResponse.providerHealthSummary`.
The `ProviderHealthMonitor` class is unchanged by P3.

### gateway-policy.ts (18L)

Covers: `GatewayPolicyResult`, `GatewayPolicyContext`, `isPolicyAllowed`.

Authority retained: policy evaluation context and result for all gateway
dispatch paths. P3 reuses `GatewayPolicyContext` by import as a required field
on `GatewayExecuteRequest` and `GatewayEmbeddingRequest`.

---

## What UnifiedGatewayInterfaceContract Adds

The `UnifiedGatewayInterfaceContract` (P3) defines a single caller entry point
that aggregates the four gateway operations:

| Method | Input | Output |
|---|---|---|
| `execute` | `GatewayExecuteRequest` | `GatewayExecuteResponse \| GatewayErrorEnvelope` |
| `stream` | `GatewayStreamRequest` | `AsyncIterable<GatewayStreamChunk \| GatewayErrorEnvelope>` |
| `embedding` | `GatewayEmbeddingRequest` | `GatewayEmbeddingResponse \| GatewayErrorEnvelope` |
| `health` | `traceId: string` | `GatewayHealthResponse` |

Key additions over the fragment contracts:

1. **Standard error envelope** (`GatewayErrorEnvelope`): every error path returns
   a typed envelope with `errorClass`, `credentialShielded: true`, and `retryable`
   flag. Fragment contracts do not define error shapes.
2. **Credential shielding declaration**: `credentialShielded: true` and optional
   `providerIdShielded?: true` are literal-typed markers, not runtime redaction.
   They declare the contract obligation that the implementing class must never
   surface raw credentials or provider identity in error responses.
3. **Unified policy gate**: `GatewayExecuteRequest` and `GatewayEmbeddingRequest`
   require `policy: GatewayPolicyContext`, making policy evaluation mandatory
   at the entry-point contract level.
4. **DMR integration hook**: `GatewayExecuteRequest.preferredModel?: DynamicModelRecord`
   connects the P2 registry contract to the P3 entry-point contract without
   requiring a runtime registry at this stage.

---

## Merge-Strategy Rules

| Rule | Detail |
|---|---|
| MR-1 | Fragment contracts retain authority over individual provider adapter shapes |
| MR-2 | `UnifiedGatewayInterfaceContract` is the caller-facing entry point; it does not replace fragment adapters |
| MR-3 | `ProviderHealthState` is the sole health type; `GatewayHealthResponse` reuses it, does not redeclare |
| MR-4 | `GatewayPolicyContext` is the sole policy input type; unified contract requires it, does not redeclare |
| MR-5 | P3 mutates no existing fragment contract, registry, or routing surface |
| MR-6 | A future P4 runtime class must implement `UnifiedGatewayInterfaceContract` and cite this boundary definition as its interface authority |

---

## Verification Boundary

This document is a planning and boundary definition artifact only. It does
not claim:

- Runtime behavior of any existing or future `UnifiedGatewayInterface` class.
- That the P3 contract file contains any runtime implementation.
- Production readiness, hosted readiness, or public readiness.
- Provider or API call behavior.
- That credential shielding is enforced at runtime (enforcement is a P4
  implementation obligation, not a P3 contract claim).

## Claim Boundary

Private provenance document. Public export disposition: `DEFERRED_PRIVATE_ONLY`.
No public-sync authorized by this document.
