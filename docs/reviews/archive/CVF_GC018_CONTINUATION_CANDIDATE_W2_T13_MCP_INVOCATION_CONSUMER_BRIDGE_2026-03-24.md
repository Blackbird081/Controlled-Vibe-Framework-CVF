# CVF GC-018 Continuation Candidate — W2-T13 MCP Invocation Consumer Bridge

Memory class: FULL_RECORD

> Date: `2026-03-24`
> Proposed tranche: `W2-T13 — MCP Invocation Consumer Bridge`
> Plane: `Execution Plane (EPF → CPF cross-plane bridge)`
> Extension: `CVF_EXECUTION_PLANE_FOUNDATION`

---

## 1. Tranche Summary

`W2-T13` closes the gap between the MCP Invocation Slice (W2-T8) and the governed consumer pipeline. `MCPInvocationResult` is a first-class execution artifact with `toolName`, `invocationStatus`, `contextId`, and `responsePayload` — but has no governed consumer-visible enriched output path. This tranche delivers that path via a two-CP consumer bridge.

---

## 2. Implied Gap Being Closed

| Gap source | Gap description |
|---|---|
| `W2-T8 MCPInvocationContract` | `MCPInvocationResult` has no governed consumer-visible enriched output path |
| Consumer bridge rotation | CPF (W1-T17) → **EPF (W2-T13)** → GEF (W3-T8) — rotation demands EPF next |

---

## 3. Proposed Control Points

| CP | Name | Lane |
|---|---|---|
| CP1 | `MCPInvocationConsumerPipelineContract` | Full Lane |
| CP2 | `MCPInvocationConsumerPipelineBatchContract` | Fast Lane (GC-021) |
| CP3 | Tranche Closure Review | Full Lane |

### CP1 — MCPInvocationConsumerPipelineContract (Full Lane)

- Input: `MCPInvocationRequest + MCPInvocationStatus + responsePayload` (+ optional `candidateItems`, `scoringWeights`, `segmentTypeConstraints`, `consumerId`)
- Internal chain:
  1. `MCPInvocationContract.invoke(request, status, responsePayload)` → `MCPInvocationResult`
  2. `query` = `${result.toolName}:${result.invocationStatus}`.slice(0, 120)
  3. `contextId` = `result.resultId`
  4. `ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})` → `ControlPlaneConsumerPackage`
- Warnings: FAILURE → mcp tool unavailable; TIMEOUT → invocation timed out; REJECTED → authorization or policy gate
- `pipelineHash` from `invocationHash + consumerPackage.pipelineHash + createdAt`
- `resultId` from `pipelineHash`
- Plane boundary: EPF → CPF (cross-plane bridge, imports CPF consumer pipeline)

### CP2 — MCPInvocationConsumerPipelineBatchContract (Fast Lane)

- Input: `MCPInvocationConsumerPipelineResult[]`
- Output: `MCPInvocationConsumerPipelineBatch`
- `dominantTokenBudget` = `Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))`
- `successCount` = results where `invocationResult.invocationStatus === "SUCCESS"`
- `failureCount` = results where status is FAILURE | TIMEOUT | REJECTED
- `batchHash` from `total + dominantTokenBudget + successCount + failureCount + createdAt`
- `batchId` from `batchHash` only
- Fast Lane eligible: additive only, inside authorized tranche, no new module

### CP3 — Tranche Closure Review

Standard CP3 closure with test log update, GC-026 closure sync, AGENT_HANDOFF update, push.

---

## 4. Rationale

| Criterion | Score | Notes |
|---|---|---|
| Source contract exists | 10/10 | `MCPInvocationContract` in EPF, fully tested |
| Clear implied gap | 10/10 | `MCPInvocationResult` has no consumer bridge |
| Additive only | 10/10 | no restructuring, no boundary changes |
| Plane boundary clean | 9/10 | cross-plane EPF→CPF, same established pattern as W2-T11/W2-T12 |
| Consumer pipeline reuse | 10/10 | reuses `ControlPlaneConsumerPipelineContract` from CPF |
| **Total** | **49/50** | |

---

## 5. Authorization Boundary

- Files authorized for creation:
  - `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mcp.invocation.consumer.pipeline.contract.ts`
  - `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mcp.invocation.consumer.pipeline.batch.contract.ts`
  - `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/mcp.invocation.consumer.pipeline.test.ts`
  - `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/mcp.invocation.consumer.pipeline.batch.test.ts`
- Files authorized for update:
  - `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/index.ts` (barrel exports)
  - `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` (partition entries)
  - `docs/CVF_INCREMENTAL_TEST_LOG.md`
  - `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
  - `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
  - `AGENT_HANDOFF.md`

**Authorization verdict: AUTHORIZED — GC-018 score 49/50**
