# CVF W40-T1 Execution Plan — PackagingBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-05
> Tranche: W40-T1 — PackagingBatchContract (REALIZATION class)
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W40_T1_PACKAGING_BATCH_2026-04-05.md`

---

## Objective

Close the packaging batch surface by implementing `PackagingBatchContract`, which batches `PackagingContract.package()` calls and aggregates results with `dominantStatus` (TRUNCATED/FULL/NONE), `totalTokens`, and `dominantTokenBudget`.

---

## Control Points

| CP | Lane | Description |
|---|---|---|
| CP1 | Full Lane | Create contract + tests + barrel + registry + governance artifacts |
| CP2 | Full Lane | Tranche closure review + GC-026 closed sync + tracker/handoff updates |

---

## CP1 — Contract Implementation

### Files to Create

1. `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/packaging.batch.contract.ts`
   - `PackagingBatchStatus` type: `"FULL" | "TRUNCATED"`
   - `PackagingBatch` interface
   - `PackagingBatchContractDependencies` interface
   - `PackagingBatchContract` class with `batch(requests: PackagingRequest[])` method
   - `createPackagingBatchContract` factory
   - Hash salts: `"w40-t1-cp1-packaging-batch"` / `"w40-t1-cp1-packaging-batch-id"`

2. `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/packaging.batch.contract.test.ts`
   - Target: ≥ 28 tests
   - Coverage: empty batch, full batch, truncated batch, mixed, determinism, factory

### Files to Modify

3. `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.workflow.barrel.ts`
   - Export `PackagingBatchContract`, `createPackagingBatchContract`, `PackagingBatch`, `PackagingBatchStatus`, `PackagingBatchContractDependencies`

4. `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
   - Add: `"CPF Packaging Batch (W40-T1 CP1)"` entry

### Governance Artifacts

5. `docs/audits/CVF_W40_T1_CP1_PACKAGING_BATCH_AUDIT_2026-04-05.md`
6. `docs/reviews/CVF_GC019_W40_T1_CP1_PACKAGING_BATCH_REVIEW_2026-04-05.md`
7. `docs/baselines/CVF_W40_T1_CP1_PACKAGING_BATCH_DELTA_2026-04-05.md`

---

## CP2 — Closure

### Closure Artifacts

1. `docs/reviews/CVF_W40_T1_TRANCHE_CLOSURE_REVIEW_2026-04-05.md`
2. `docs/baselines/CVF_GC026_TRACKER_SYNC_W40_T1_CLOSED_2026-04-05.md`
3. Update `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
4. Update `AGENT_HANDOFF.md`

---

## Pass Conditions (carry-forward from GC-018)

1. `packaging.batch.contract.ts` canonical; zero TypeScript errors
2. All tests pass; CPF 0 failures
3. `batch(requests)` correctly calls `PackagingContract.package()` for each request
4. Empty batch: `dominantStatus: "NONE"`, `totalTokens: 0`, `dominantTokenBudget: 0`, valid `batchHash`/`batchId`
5. Status classification: `FULL` = truncated === false, `TRUNCATED` = truncated === true
6. `dominantStatus` severity ordering: TRUNCATED > FULL > NONE
7. `totalTokens` = sum of result.totalTokens; `dominantTokenBudget` = max tokenBudget; both `0` for empty
8. `batchHash` and `batchId` deterministic with correct salts; `batchId ≠ batchHash`
9. All CP1 governance artifacts present with correct memory classes
