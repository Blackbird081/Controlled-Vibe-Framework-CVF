# CVF W26-T1 Orchestration Batch Contract — Execution Plan

Memory class: SUMMARY_RECORD

> Date: 2026-04-01
> Tranche: W26-T1 — OrchestrationBatchContract (REALIZATION class)
> Authorization: GC-018 AUTHORIZED 2026-04-01
> Auth packet: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W26_T1_ORCHESTRATION_BATCH_2026-04-01.md`

---

## Objective

Implement `OrchestrationBatchContract` batching `OrchestrationContract.orchestrate(plan: DesignPlan)` across a list of design plans. Aggregate `totalAssignments`, `r0Count`, `r1Count`, `r2Count`, `r3Count`, and resolve `dominantRiskLevel` with precedence R3 > R2 > R1 > R0 (NONE for empty batch). Produce deterministic `batchHash`/`batchId`.

---

## Key Implementation Values

| Key | Value |
|---|---|
| Batch hash salt | `"w26-t1-cp1-orchestration-batch"` |
| Batch ID salt | `"w26-t1-cp1-orchestration-batch-id"` |
| Fixed test timestamp | `"2026-04-01T00:00:00.000Z"` |
| Dominant precedence | R3 > R2 > R1 > R0 |
| Empty batch sentinel | `"NONE"` |
| Source contract tranche | W1-T3 |

---

## Checkpoint Plan

### CP1 — Implementation

1. Create `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/orchestration.batch.contract.ts`
   - `OrchestrationBatchContract.batch(plans: DesignPlan[]): OrchestrationBatchResult`
   - Calls `OrchestrationContract.orchestrate(plan)` for each plan
   - Aggregates `totalPlans`, `totalAssignments`, `r0Count`, `r1Count`, `r2Count`, `r3Count`
   - Resolves `dominantRiskLevel` with R3 > R2 > R1 > R0 precedence; NONE for empty batch
   - Produces deterministic `batchHash`, `batchId`
   - Exports `createOrchestrationBatchContract` factory

2. Create `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/orchestration.batch.contract.test.ts`
   - ~27 tests covering: empty batch, single plan, multiple plans, count accuracy, dominant R3 wins, dominant R2 over R1, R0 default, determinism, batchHash != batchId, factory export, output shape

3. Add W26-T1 barrel exports to `src/index.ts`

4. Run full CPF test suite — target 0 failures, CPF 2440 → ~2467

CP1 pass conditions:
- [ ] `OrchestrationBatchContract` exported
- [ ] `batch()` calls `orchestrate()` for each plan
- [ ] All count fields accurate
- [ ] `dominantRiskLevel` R3>R2>R1>R0; NONE on empty
- [ ] `batchHash`/`batchId` distinct, deterministic, W26-T1 domain salts
- [ ] ~27 tests, 0 failures
- [ ] No regressions

CP1 governance artifacts:
- `docs/audits/CVF_W26_T1_CP1_ORCHESTRATION_BATCH_AUDIT_2026-04-01.md`
- `docs/reviews/CVF_GC019_W26_T1_CP1_ORCHESTRATION_BATCH_REVIEW_2026-04-01.md`
- `docs/baselines/CVF_W26_T1_CP1_ORCHESTRATION_BATCH_DELTA_2026-04-01.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W26_T1_CP1_DONE_2026-04-01.md`

### CP2 — Tranche Closure

1. Tranche closure review: `docs/reviews/CVF_W26_T1_TRANCHE_CLOSURE_REVIEW_2026-04-01.md`
2. GC-026 closed sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W26_T1_CLOSED_2026-04-01.md`
3. Update progress tracker: W26-T1 CLOSED DELIVERED
4. Update AGENT_HANDOFF
5. Commit + push
