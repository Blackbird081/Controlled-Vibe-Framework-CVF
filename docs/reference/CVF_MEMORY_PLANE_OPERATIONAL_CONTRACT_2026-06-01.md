# CVF Memory Plane Operational Contract — 2026-06-01

Memory class: FULL_RECORD

Status: PENDING (documentation-only)

## Scope / Applies To

Memory plane advisory surfaces and helpers documented below (current `/api/memory/readout` route, projection helper, workflow chain, lifecycle policy, retrieval policy, durable store). No new runtime wiring or routes are added in this tranche; durable store remains unwired.

## Purpose

Formalize, from current source, the bounded Memory plane runtime contract: inputs, authorization signals, allowed route surfaces, returned readout shape, forbidden fields, lifecycle states, advisory-only boundary, durable-write boundary, and the scoped `canReinject=false` invariant that applies to the readout/advisory surface.

## Inputs (Memory Readout Request)

Source: `MemoryRuntimeReadoutBody` schema @ `route.ts` lines 9-32 @ `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts`.

- Required: `operationId`, `sessionId`, `projectId`, `actorId`, `actorRole`, `scope`, `riskLevel`, `query`, `tokenBudget`, `candidates[]` (id, scope, summary, createdAt, auditTrust, lifecycleState, optional content, containsSecret), optional `policyDecision`, `containsSensitiveData`, `maxResults`.
- Allowed enums: actorRole `OPERATOR|GOVERNOR|HUMAN|BUILDER|AI_AGENT|REVIEWER|SERVICE_AGENT|OBSERVER|ANALYST|unknown`; risk `R0-R3`; lifecycle `working|episodic|semantic|procedural|expired|disputed`; policy decisions `allow|allow_limited|allow_redacted|allow_summary_only|deny|require_human_approval` (lines 34-63).

## Authorization Signals

- Service-token check: `verifyServiceTokenRequest` over headers (`x-cvf-service-token`, signature, timestamp, body) (lines 136-155 @ `route.ts`).
- Session auth: `verifySessionCookie(request)` (lines 156-158 @ `route.ts`).
- Authorization rule: request must satisfy service-token OR session; otherwise 401 (lines 158-163 @ `route.ts`).

## Allowed Route Surfaces

- `POST /api/memory/readout` (authenticated local route): builds `memoryRuntimeReadout` projection and returns summary-only invariants (lines 135-204 @ `route.ts`); version literal `MEMORY_RUNTIME_READOUT_ROUTE_VERSION` = `cvf.memoryRuntimeReadoutRoute.mkg6.v1` (line 1 @ `route-constants.ts`).
- Planned advisory attachment point in `/api/execute` is roadmap-scoped only (no runtime wiring yet): `docs/roadmaps/CVF_MKG7_MEMORY_PLANE_OPERATIONALIZATION_ROADMAP_2026-06-01.md` lines 180-183.

## Returned Readout Shape

- Response envelope: `{ success:true, routeVersion, memoryRuntimeReadout, rawMemoryReleased:false, canReinject:false }` (lines 198-204 @ `route.ts`).
- Projection builder sanitizes workflow result: strips candidate `content`, sets `rawMemoryReleased:false` and `canReinject:false` on projection and nested `contextBlock.evidence` (lines 35-54 @ `memory-runtime-readout.ts`).
- Workflow chain emits status `packaged|denied|deferred`, gateway/retrieval/context events, `sourceMemoryIds`, `excludedMemory`, and invariant flags `rawMemoryReleased:false`, `canReinject:false` (lines 49-62 @ `memory-runtime-workflow-chain.ts`).

## Forbidden Fields and Sentinel Guard

- RAW sentinel: `RAW_MEMORY_CONTENT_MUST_NOT_LEAK`; response 500 if serialized projection contains it (lines 7, 193-196 @ `route.ts`).
- Projection sanitization removes `content` from selected candidates (lines 15-33 @ `memory-runtime-readout.ts`).
- Receipts and workflow results fix `rawMemoryReleased:false` and `canReinject:false`; raw payloads are rejected in durable writes (lines 256-259 @ `durable-memory-store.ts`).

## Lifecycle States (Current Tier Model)

- Tier state machine: `working | episodic | semantic | procedural | expired | disputed | forgotten` (lines 4-11 @ `memory-lifecycle-policy.ts`).
- Tier transition flag: `canReinject` is **true** only when transitioning into `semantic` or `procedural`; otherwise false (line 44 @ `memory-lifecycle-policy.ts`). This is an internal lifecycle signal, not a prompt-assembly authorization.
- Readout-eligibility lifecycle (T2) is not yet implemented; this contract documents current tier states and distinguishes them from the upcoming readout-eligibility policy.

## Advisory-Only Execution Boundary

- Readout surface returns summary-only projection; `contextBlock` constraints include `summary_only`, `no_raw_memory_release`, `no_prompt_reinjection_authorized` (lines 73-78 @ `memory-runtime-workflow-chain.ts`).
- Route and projection fix `rawMemoryReleased:false` and `canReinject:false` (lines 198-204 @ `route.ts`; lines 41-54 @ `memory-runtime-readout.ts`).
- No prompt reinjection or raw content is authorized on the readout/advisory surface.

## Durable Write Boundary (Present, Fail-Closed)

- Durable store exists and actively gates writes: `write()` denies unless `actorAuthorized===true` and `policyDecision==='allow'` (lines 195-211 @ `durable-memory-store.ts`), durable tier only (`isDurableTier` line 114) with runtime decision gate (lines 227-246) and provenance floor `MIN_PROVENANCE_SCORE = 0.7` (line 98, enforced at lines 248-264).
- Raw payloads are rejected (`raw_memory_payload_rejected`, lines 256-259), blocked lifecycle and low provenance deny writes, and receipts set `summaryOnly:true`, `canReinject:false`, `rawMemoryReleased:false` (lines 172-175, 268-275 @ `durable-memory-store.ts`).
- Durable reads also require `actorAuthorized` and enforce scope/tier filters; receipts remain `summaryOnly:true`, `canReinject:false` (lines 308-391 @ `durable-memory-store.ts`).
- Durable path is **not** currently wired into `/api/memory/readout`; it remains a gated capability for future T5 readiness.

## Invariant Scope: `canReinject`

- Readout/advisory surface: always returns `canReinject:false` (route response lines 198-204; projection sanitization lines 41-54 @ `memory-runtime-readout.ts`; workflow chain invariants lines 60-62 @ `memory-runtime-workflow-chain.ts`).
- Tier lifecycle policy: `canReinject:true` for semantic/procedural states (line 44 @ `memory-lifecycle-policy.ts`) is a separate lifecycle flag and is **not** a prompt-assembly or route authorization.

## Source Verification Table

| Claimed item | Source file | Lines / symbol | Disposition |
| --- | --- | --- | --- |
| Readout request body fields | `route.ts` | 9-32 | ACCEPT |
| Service-token + session auth signals | `route.ts` | 136-163 | ACCEPT |
| Returned readout response shape | `route.ts` | 198-204 | ACCEPT |
| Readout surface invariants `rawMemoryReleased:false`, `canReinject:false` | `route.ts` | 202-204 | ACCEPT |
| RAW sentinel guard | `route.ts` | 7, 193-196 | ACCEPT |
| Route version literal | `route-constants.ts` | 1-2 | ACCEPT |
| Workflow chain invariants (`rawMemoryReleased:false`, `canReinject:false`) and status set | `memory-runtime-workflow-chain.ts` | 26-62 | ACCEPT |
| Tier lifecycle states + `canReinject` true only for semantic/procedural | `memory-lifecycle-policy.ts` | 4-11, 44 | ACCEPT |
| Retrieval result fields | `memory-retrieval-policy.ts` | 6-47 | ACCEPT |
| Durable write fail-closed branches + provenance floor | `durable-memory-store.ts` | 195-306, 98 | ACCEPT |

## Claim Boundary

Documentation-only contract. No runtime/source edits, no new fields, no provider calls, no raw Memory release, no prompt reinjection, no durable mutation wiring change, no public-sync or push. `canReinject=false` applies to the readout/advisory surface; durable store exists and already fails closed but is not wired into a route.
