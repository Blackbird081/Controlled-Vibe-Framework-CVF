# CVF W3-T15 Execution Plan — Governance Checkpoint Reintake Summary Consumer Bridge

Memory class: SUMMARY_RECORD

> Tranche: W3-T15 — Governance Checkpoint Reintake Summary Consumer Bridge
> Date: 2026-03-24
> Branch: `cvf-next`
> Authorization: GC-018 ID GC018-W3-T15-2026-03-24 (10/10)

---

## Objective

Deliver `GovernanceCheckpointReintakeSummaryConsumerPipelineContract` (CP1) and `GovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract` (CP2) — governed cross-plane consumer bridge that enriches `CheckpointReintakeSummary` through the Control Plane consumer pipeline.

Gap closed: W6-T5 CP2 implied — `CheckpointReintakeSummary` has no governed consumer-visible enriched output path.

---

## CP1 — GovernanceCheckpointReintakeSummaryConsumerPipelineContract (Full Lane)

**File:** `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/governance.checkpoint.reintake.summary.consumer.pipeline.contract.ts`

**Contract chain:**
```
CheckpointReintakeRequest[]
  → GovernanceCheckpointReintakeSummaryContract.summarize()
  → CheckpointReintakeSummary
    query = `[reintake-summary] ${dominantScope} — ${totalRequests} request(s)`.slice(0, 120)
    contextId = summary.summaryId
  → ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
  → ControlPlaneConsumerPackage
  → GovernanceCheckpointReintakeSummaryConsumerPipelineResult
```

**Output type:**
```typescript
export interface GovernanceCheckpointReintakeSummaryConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  reintakeSummary: CheckpointReintakeSummary;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}
```

**Warnings:**
- `dominantScope === "IMMEDIATE"` → `[governance-reintake-summary] dominant scope IMMEDIATE — immediate reintake required`
- `dominantScope === "DEFERRED"` → `[governance-reintake-summary] dominant scope DEFERRED — deferred reintake scheduled`

**Hash pattern:**
- `pipelineHash = computeDeterministicHash("w3-t15-cp1-checkpoint-reintake-summary-consumer-pipeline", summary.summaryHash, consumerPackage.pipelineHash, createdAt)`
- `resultId = computeDeterministicHash("w3-t15-cp1-result-id", pipelineHash)`

**Test file:** `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tests/governance.checkpoint.reintake.summary.consumer.pipeline.test.ts`

---

## CP2 — GovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract (Fast Lane GC-021)

**File:** `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/governance.checkpoint.reintake.summary.consumer.pipeline.batch.contract.ts`

**Batch output type:**
```typescript
export interface GovernanceCheckpointReintakeSummaryConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: GovernanceCheckpointReintakeSummaryConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  immediateResultCount: number;
  deferredResultCount: number;
  batchHash: string;
}
```

**Aggregation rules:**
- `dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))` — 0 for empty
- `immediateResultCount` = count of results where `reintakeSummary.dominantScope === "IMMEDIATE"`
- `deferredResultCount` = count of results where `reintakeSummary.dominantScope === "DEFERRED"`
- `batchId ≠ batchHash`

**Test file:** `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tests/governance.checkpoint.reintake.summary.consumer.pipeline.batch.test.ts`

---

## CP3 — Tranche Closure

- GEF `index.ts` barrel exports
- Test partition registry (2 entries)
- Closure review + GC-026 sync
- Progress tracker + roadmap post-cycle record + test log
- AGENT_HANDOFF.md update
