# CVF Memory Derived Graph Boundary

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-01

## Scope / Applies To

Applies to: all CVF Memory plane components that produce derived views —
`memory-runtime-workflow-chain.ts` (context summaries), `memory-retrieval-policy.ts`
(graph/retrieval indexes), and any future graph, semantic-region, Palace, or
snapshot layer.

Applies to: agents and workers implementing or evaluating Memory behavior who
must distinguish between source authority and rebuildable derived views.

## Purpose

Document the boundary between source authority and rebuildable derived views (graph, semantic-region maps, summaries, cache, snapshots, retrieval indexes). Make the boundary explicit and drift-detectable so derived graph lookups cannot be treated as source authority.

## Source Authority Definition

- Source authority is the original governed Memory content and contract-controlled runtime policies (e.g., `durable-memory-store.ts`, retrieval policy, T1 operational contract).
- Source authority remains primary for correctness, provenance, and governance claims.
- Any governance claim must cite source authority, not a derived view.

## Derived Views

- Derived views include graph nodes/edges, semantic-region maps, summaries/context blocks produced by `memory-runtime-workflow-chain`, caches/snapshots, and retrieval indexes (including `graph` retrieval method in `memory-retrieval-policy.ts`).
- Derived views are rebuildable from source authority. They do not expand scope or privilege beyond the source material.
- Derived views must remain summary-only; `rawMemoryReleased` stays `false` per retrieval policy contracts.

## Boundary Rules

- Source authority is primary; derived views **cannot overrule** or substitute for source authority.
- Drift is detectable: any divergence between derived view and source must be resolvable by rebuilding from source authority; rebuilt view wins.
- Graph lookups are advisory only; they cannot change routing, enforcement, or provider/model decisions without a separate authorized tranche.
- Public or runtime claims derived from graph/summaries require separate live proof and authorization; this document is documentation-only.
- No new persistence or mutation is authorized by this boundary; it records governance posture only.

## Evidence Trail

- `memory-runtime-workflow-chain.ts` produces derived context/summaries (context block) from source memories; it does not replace source authority.
- `memory-retrieval-policy.ts` defines `MemoryRetrievalMethod` including `graph`; retrieval results keep `rawMemoryReleased:false` and are advisory/read-only.
- T1 operational contract records advisory-only execution boundaries; no route/provider mutation authorized.

## Claim Boundary

- Documentation-only reference. No `.ts` changes, no graph persistence mutation, no new routes, no provider calls, no public-sync/push.
- Public Export Disposition: DEFERRED_PRIVATE_ONLY.

## Closure Evidence

Reviewer closeout date: 2026-06-05.

Closure base: `327813b0`.

Closure disposition: `CLOSED_PASS_BOUNDED`.

This closeout reconciles stale `DRAFT` status after the MKG7 roadmap and active
state already recorded MKG7-T6 as closed. It does not change runtime behavior,
graph persistence, retrieval authority, public export, live proof, hosted
readiness, production readiness, public readiness, or autonomous mutation.
