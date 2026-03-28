# CVF W2-T12 Execution Plan — Execution Re-intake Consumer Bridge

Memory class: SUMMARY_RECORD
> Tranche: W2-T12 — Execution Re-intake Consumer Bridge
> Date: 2026-03-24
> Authorization: GC-018 GRANTED (10/10)

---

## Objective

Deliver a cross-plane consumer bridge in EPF that chains
`ExecutionReintakeContract` (W2-T5/W2-T6) through
`ControlPlaneConsumerPipelineContract` (CPF W1-T13) to expose a deterministic,
governed `ControlPlaneConsumerPackage` from `FeedbackResolutionSummary` input.

---

## Control Points

| CP | Contract | Lane | Target tests |
|---|---|---|---|
| CP1 | `ExecutionReintakeConsumerPipelineContract` | Full Lane | ~17 |
| CP2 | `ExecutionReintakeConsumerPipelineBatchContract` | Fast Lane (GC-021) | ~10 |
| CP3 | Tranche closure review | — | — |

---

## CP1 — Full Lane

### Contract: `ExecutionReintakeConsumerPipelineContract`

**File:** `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.reintake.consumer.pipeline.contract.ts`

**Internal chain:**
```
FeedbackResolutionSummary
  → ExecutionReintakeContract.reinject(summary)  → ExecutionReintakeRequest
  → ControlPlaneConsumerPipelineContract.execute(...)  → ControlPlaneConsumerPackage
```

**Query derivation:**
```
reintakeRequest.reintakeVibe.slice(0, 120)
```

**ContextId:** `reintakeRequest.reintakeId`

**Warnings:**
- `REPLAN` → `[reintake] full replanning required — new design authorization needed`
- `RETRY` → `[reintake] execution retry requested — revised orchestration required`
- `ACCEPT` → no warnings

**Determinism:** `now` injected; propagated to both sub-contracts

**Hash key:** `"w2-t12-cp1-reintake-consumer-pipeline"`

**Artifacts:** audit, review, delta, exec plan update, test log update, commit

---

## CP2 — Fast Lane (GC-021)

### Contract: `ExecutionReintakeConsumerPipelineBatchContract`

**File:** `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.reintake.consumer.pipeline.batch.contract.ts`

**Pattern:**
- `dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))`
- empty batch → `dominantTokenBudget = 0`, valid hash
- `batchId ≠ batchHash`
- `replanCount` = results with REPLAN action
- `retryCount` = results with RETRY action

**GC-021 eligibility:** additive only, no restructuring, inside authorized tranche

**Artifacts:** Fast Lane audit, review, delta, exec plan update, test log update, commit

---

## CP3 — Closure

**Artifacts:** closure review, GC-026 closure sync, progress tracker update, AGENT_HANDOFF update, commit

---

## CP Status

| CP | Status |
|---|---|
| CP1 | DELIVERED — 17 tests (EPF 502 total) |
| CP2 | DELIVERED — 10 tests (EPF 512 total) |
| CP3 | DELIVERED — closure committed |
