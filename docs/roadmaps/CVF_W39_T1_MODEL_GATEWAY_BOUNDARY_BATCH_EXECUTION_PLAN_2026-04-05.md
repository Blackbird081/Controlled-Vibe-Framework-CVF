# CVF W39-T1 Execution Plan — ModelGatewayBoundaryBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-05
> Tranche: W39-T1 — ModelGatewayBoundaryBatchContract (REALIZATION class)
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W39_T1_MODEL_GATEWAY_BOUNDARY_BATCH_2026-04-05.md`

---

## Objective

Close the W8-T1 model gateway boundary batch surface by implementing `ModelGatewayBoundaryBatchContract`, which aggregates `ModelGatewayBoundaryReport[]` into a governed batch envelope.

---

## Control Points

| CP | Lane | Description |
|---|---|---|
| CP1 | Full Lane | Create contract + tests + barrel + registry + governance artifacts |
| CP2 | Full Lane | Tranche closure review + GC-026 closed sync + tracker/handoff updates |

---

## CP1 — Contract Implementation

### Files to Create

1. `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/model.gateway.boundary.batch.contract.ts`
   - `ModelGatewayBoundaryBatch` interface
   - `ModelGatewayBoundaryBatchContractDependencies` interface
   - `ModelGatewayBoundaryBatchContract` class with `batch(reports: ModelGatewayBoundaryReport[])` method
   - `createModelGatewayBoundaryBatchContract` factory
   - Hash salts: `"w39-t1-cp1-model-gateway-boundary-batch"` / `"w39-t1-cp1-model-gateway-boundary-batch-id"`

2. `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/model.gateway.boundary.batch.contract.test.ts`
   - Target: ≥ 28 tests
   - Coverage: empty batch, single report, multi-report, determinism, factory

### Files to Modify

3. `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.continuation.barrel.ts`
   - Export `ModelGatewayBoundaryBatchContract`, `createModelGatewayBoundaryBatchContract`, `ModelGatewayBoundaryBatch`, `ModelGatewayBoundaryBatchContractDependencies`

4. `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
   - Add: `"CPF Model Gateway Boundary Batch (W39-T1 CP1)"` entry

### Governance Artifacts

5. `docs/audits/CVF_W39_T1_CP1_MODEL_GATEWAY_BOUNDARY_BATCH_AUDIT_2026-04-05.md`
6. `docs/reviews/CVF_GC019_W39_T1_CP1_MODEL_GATEWAY_BOUNDARY_BATCH_REVIEW_2026-04-05.md`
7. `docs/baselines/CVF_W39_T1_CP1_MODEL_GATEWAY_BOUNDARY_BATCH_DELTA_2026-04-05.md`

---

## CP2 — Closure

### Closure Artifacts

1. `docs/reviews/CVF_W39_T1_TRANCHE_CLOSURE_REVIEW_2026-04-05.md`
2. `docs/baselines/CVF_GC026_TRACKER_SYNC_W39_T1_CLOSED_2026-04-05.md`
3. Update `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
4. Update `AGENT_HANDOFF.md`

---

## Pass Conditions (carry-forward from GC-018)

1. `model.gateway.boundary.batch.contract.ts` canonical; zero TypeScript errors
2. All tests pass; CPF 0 failures
3. `batch(reports)` correctly aggregates `ModelGatewayBoundaryReport[]`
4. Empty batch: `totalResults: 0`, `dominantSurfaceCount: 0`, `totalFixedInputCount: 0`, `totalInScopeCount: 0`, valid `batchHash`/`batchId`
5. `dominantSurfaceCount` = max of `surfaces.length`; `0` for empty
6. `totalFixedInputCount` = sum of `fixedInputCount`; `totalInScopeCount` = sum of `inScopeCount`
7. `batchHash` and `batchId` deterministic with correct salts; `batchId ≠ batchHash`
8. `batchId` = hash of `batchHash` only
9. All CP1 governance artifacts present with correct memory classes
