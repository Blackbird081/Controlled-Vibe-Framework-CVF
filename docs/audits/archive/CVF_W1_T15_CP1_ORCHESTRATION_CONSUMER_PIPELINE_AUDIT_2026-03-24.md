# CVF W1-T15 CP1 Audit — OrchestrationConsumerPipelineContract

Memory class: FULL_RECORD

> Tranche: W1-T15 — Control Plane Orchestration Consumer Bridge
> Control Point: CP1 — OrchestrationConsumerPipelineContract
> Lane: Full Lane
> Date: 2026-03-24
> Authorization: GC-018 10/10 (`docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_T15_2026-03-24.md`)

---

## Scope

Delivers `OrchestrationConsumerPipelineContract` — bridges `DesignPlan → OrchestrationResult → ControlPlaneConsumerPackage`. Closes the W1-T3 implied gap: orchestration assignments had no governed consumer-visible enriched output path.

## Contract Delivered

**File:** `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/orchestration.consumer.pipeline.contract.ts`

**Input:** `OrchestrationConsumerPipelineRequest`
- `plan: DesignPlan` — the design plan to orchestrate
- `candidateItems?: RankableKnowledgeItem[]` — optional knowledge candidates
- `scoringWeights?: ScoringWeights` — optional ranking weights
- `segmentTypeConstraints?: SegmentTypeConstraints` — optional type constraints
- `consumerId?: string` — consumer identity override

**Pipeline chain:**
1. `OrchestrationContract.orchestrate(plan)` → `OrchestrationResult` (assignments, phase/role/risk breakdowns, warnings)
2. `ControlPlaneConsumerPipelineContract.execute({ rankingRequest: { query, contextId: orchestrationId, candidateItems, scoringWeights }, segmentTypeConstraints })` → `ControlPlaneConsumerPackage`
   - `query`: derived from `plan.vibeOriginal` (max 120 chars) or falls back to `plan.planId`
   - `contextId`: `orchestrationResult.orchestrationId` (deterministic tracing anchor)

**Output:** `OrchestrationConsumerPipelineResult`
- `resultId`, `createdAt`, `consumerId?`
- `orchestrationResult: OrchestrationResult`
- `consumerPackage: ControlPlaneConsumerPackage`
- `pipelineHash` — deterministic composite hash
- `warnings[]` — orchestration warnings prefixed with `[orchestration]`

## Determinism Verification

- `now` injected via `ContractDependencies` (default: `() => new Date().toISOString()`)
- propagated to both sub-contracts via `now: this.now`
- `pipelineHash`: `computeDeterministicHash("w1-t15-cp1-orchestration-consumer-pipeline", orchestrationHash, consumerPackage.pipelineHash, createdAt)`
- `resultId`: `computeDeterministicHash("w1-t15-cp1-result-id", pipelineHash)` — differs from `pipelineHash`

## Test Evidence

**File:** `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/orchestration.consumer.pipeline.test.ts` (dedicated — GC-023 compliant)

Tests: 17 new
- factory pattern
- all required fields on result
- consumerId propagation (request override > plan fallback)
- task assignments propagate correctly
- orchestrationId used as contextId
- query truncation at 120 chars / planId fallback
- candidateItems pass-through (totalRanked verified)
- deterministic pipelineHash and resultId under fixed now
- warning prefix `[orchestration]` for R3 tasks
- empty plan → zero assignments, no R3 warnings
- pipelineHash ≠ orchestrationHash ≠ consumerPackage.pipelineHash
- resultId ≠ pipelineHash
- different plans → different resultIds
- typedContextPackage.estimatedTokens ≥ 0

Total CPF tests after CP1: **722** (0 failures)

## GC-023 Compliance

- `index.test.ts` NOT modified (currently 3106 lines, frozen at 3200 max)
- new tests in dedicated file only

## GC-024 Compliance

- Partition registry entry added for `OrchestrationConsumerPipelineContract`

## Risk Assessment

- R0 — additive CPF contract only; no modification of existing contracts
- No boundary change; no ownership transfer; no module creation
