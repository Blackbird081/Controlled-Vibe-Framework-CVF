# CVF W54-T1 Execution Plan — ExecutionReintakeBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-05
> Tranche: W54-T1 | Class: REALIZATION
> Authorization: GC-018 AUTHORIZED

---

## Phase A — Governance Pre-work (DONE)

1. Post-W53 quality assessment — DONE
2. GC-018 authorization — DONE
3. This execution plan — DONE
4. GC-026 auth sync — DONE

## Phase B — Barrel Move (Phase E of the series)

Move `ExecutionReintakeContract` + `ExecutionReintakeSummaryContract` exports from `index.ts:442-459` → `epf.dispatch.barrel.ts`:
- `ExecutionReintakeContract`, `createExecutionReintakeContract`
- `ReintakeAction`, `ExecutionReintakeRequest`, `ExecutionReintakeContractDependencies`
- `ExecutionReintakeSummaryContract`, `createExecutionReintakeSummaryContract`
- `ExecutionReintakeSummary`, `ExecutionReintakeSummaryContractDependencies`

## Phase C — Contract Implementation

File: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.reintake.batch.contract.ts`

Input: `{ summary: FeedbackResolutionSummary }[]`
Method: `ExecutionReintakeBatchContract.batch(inputs)`
Calls: `ExecutionReintakeContract.reinject(input.summary)` per input
Aggregates: `totalRequests`, `replanCount`, `retryCount`, `acceptCount`, `warnedCount`
dominantAction: `ReintakeAction | "NONE"` (REPLAN > RETRY > ACCEPT; NONE for empty)
warnedCount = requests where reintakeAction !== "ACCEPT"
Salts: "w54-t1-cp1-execution-reintake-batch" / "w54-t1-cp1-execution-reintake-batch-id"

## Phase D — Tests

File: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/execution.reintake.batch.contract.test.ts`

Tests covering:
- empty batch → NONE
- CRITICAL urgency → REPLAN dominates
- HIGH urgency → RETRY (no CRITICAL)
- NORMAL urgency → ACCEPT
- REPLAN > RETRY precedence
- aggregate totalRequests, replanCount, retryCount, acceptCount
- warnedCount (REPLAN+RETRY cases)
- deterministic batchId/batchHash, batchId !== batchHash
- factory method

## Phase E — Governance Chain

1. Partition registry entry
2. Full EPF suite — no regressions
3. CP1 audit, GC-019 review, delta, GC-026 CP1 sync, closure review, GC-026 closed sync
4. Update test log + AGENT_HANDOFF
5. Commit
