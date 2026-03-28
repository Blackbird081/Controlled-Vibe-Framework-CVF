# CVF GC-018 Continuation Candidate — W1-T18 Gateway PII Detection Consumer Bridge

Memory class: FULL_RECORD

> Date: `2026-03-24`
> Proposed tranche: `W1-T18 — Gateway PII Detection Consumer Bridge`
> Plane: `Control Plane (CPF-internal bridge)`
> Extension: `CVF_CONTROL_PLANE_FOUNDATION`

---

## 1. Tranche Summary

`W1-T18` closes the gap between the Gateway PII Detection Slice (W1-T9) and the governed consumer pipeline. `GatewayPIIDetectionResult` is a first-class safety artifact with `piiDetected`, `piiTypes`, `matches`, `redactedSignal`, and `detectionHash` — but has no governed consumer-visible enriched output path. This tranche delivers that path via a two-CP consumer bridge, completing the safety chain consumer surface for the AI Gateway.

---

## 2. Implied Gap Being Closed

| Gap source | Gap description |
|---|---|
| `W1-T9 GatewayPIIDetectionContract` | `GatewayPIIDetectionResult` has no governed consumer-visible enriched output path |
| Consumer bridge rotation | EPF (W2-T13) → **CPF (W1-T18)** → GEF (W3-T8) — rotation demands CPF next |

---

## 3. Proposed Control Points

| CP | Name | Lane |
|---|---|---|
| CP1 | `GatewayPIIDetectionConsumerPipelineContract` | Full Lane |
| CP2 | `GatewayPIIDetectionConsumerPipelineBatchContract` | Fast Lane (GC-021) |
| CP3 | Tranche Closure Review | Full Lane |

### CP1 — GatewayPIIDetectionConsumerPipelineContract (Full Lane)

- Input: `GatewayPIIDetectionRequest + optional candidateItems, scoringWeights, segmentTypeConstraints, consumerId`
- Internal chain:
  1. `GatewayPIIDetectionContract.detect(request)` → `GatewayPIIDetectionResult`
  2. `query` = `${result.tenantId}:pii:${result.piiDetected}:${result.piiTypes.join(",")}`.slice(0, 120)
  3. `contextId` = `result.resultId`
  4. `ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})` → `ControlPlaneConsumerPackage`
- Warnings: `piiDetected = true` → redact before consumer use; `piiTypes` contains `CUSTOM` → custom pattern match detected
- `pipelineHash` from `detectionHash + consumerPackage.pipelineHash + createdAt`
- `resultId` from `pipelineHash`
- Plane boundary: CPF-internal (no cross-plane import required)

### CP2 — GatewayPIIDetectionConsumerPipelineBatchContract (Fast Lane)

- Input: `GatewayPIIDetectionConsumerPipelineResult[]`
- Output: `GatewayPIIDetectionConsumerPipelineBatch`
- `detectedCount` = results where `detectionResult.piiDetected === true`
- `cleanCount` = results where `detectionResult.piiDetected === false`
- `dominantTokenBudget` = `Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))`, 0 for empty batch
- `batchHash` from `total + dominantTokenBudget + detectedCount + cleanCount + createdAt`
- `batchId` from `batchHash` only
- Fast Lane eligible: additive only, inside authorized tranche, no new module

### CP3 — Tranche Closure Review

Standard CP3 closure with test log update, GC-026 closure sync, AGENT_HANDOFF update, push.

---

## 4. Rationale

| Criterion | Score | Notes |
|---|---|---|
| Source contract exists | 10/10 | `GatewayPIIDetectionContract` in CPF, fully tested |
| Clear implied gap | 10/10 | `GatewayPIIDetectionResult` has no consumer bridge |
| Additive only | 10/10 | no restructuring, no boundary changes |
| Plane boundary clean | 10/10 | CPF-internal, no cross-plane import needed |
| Consumer pipeline reuse | 10/10 | reuses `ControlPlaneConsumerPipelineContract` from CPF |
| **Total** | **50/50** | |

---

## 5. Authorization Boundary

- Files authorized for creation:
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.pii.detection.consumer.pipeline.contract.ts`
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.pii.detection.consumer.pipeline.batch.contract.ts`
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/gateway.pii.detection.consumer.pipeline.test.ts`
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/gateway.pii.detection.consumer.pipeline.batch.test.ts`
- Files authorized for update:
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` (barrel exports)
  - `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` (partition entries)
  - `docs/CVF_INCREMENTAL_TEST_LOG.md`
  - `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
  - `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
  - `AGENT_HANDOFF.md`

**Authorization verdict: AUTHORIZED — GC-018 score 50/50**
