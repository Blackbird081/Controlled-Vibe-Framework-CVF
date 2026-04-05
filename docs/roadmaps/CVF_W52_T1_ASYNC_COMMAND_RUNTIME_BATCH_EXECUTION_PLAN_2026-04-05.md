# CVF W52-T1 Execution Plan — AsyncCommandRuntimeBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-05
> Tranche: W52-T1 | Class: REALIZATION
> Authorization: GC-018 AUTHORIZED

---

## Phase A — Governance Pre-work (DONE)

1. Post-W51 quality assessment — DONE
2. GC-018 authorization — DONE
3. This execution plan — DONE
4. GC-026 auth sync — DONE

## Phase B — Barrel Move (Phase C of the series)

Move `AsyncCommandRuntimeContract` exports from `index.ts:440-449` → `epf.dispatch.barrel.ts`:
- `AsyncCommandRuntimeContract`, `createAsyncCommandRuntimeContract`
- `AsyncExecutionStatus`, `AsyncCommandRuntimeTicket`, `AsyncCommandRuntimeContractDependencies`

Update `epf.dispatch.barrel.ts` header comment to include W52-T1.

## Phase C — Contract Implementation

File: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.async.runtime.batch.contract.ts`

```
AsyncCommandRuntimeBatchContract.batch(inputs: AsyncCommandRuntimeBatchInput[]): AsyncCommandRuntimeBatchResult

Input: { runtimeResult: CommandRuntimeResult }[]
Calls: AsyncCommandRuntimeContract.issue(runtimeResult) per input
Aggregates: totalTickets, totalExecuted, totalFailed, totalRecords, warnedCount
dominantStatus: FULLY_QUEUED | PARTIALLY_QUEUED | FAILED | NONE
Salts: "w52-t1-cp1-async-command-runtime-batch" / "w52-t1-cp1-async-command-runtime-batch-id"
```

Status resolution:
- NONE: empty
- FULLY_QUEUED: totalExecuted > 0, totalFailed = 0
- PARTIALLY_QUEUED: totalExecuted > 0, totalFailed > 0
- FAILED: totalExecuted = 0, non-empty

## Phase D — Tests

File: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/execution.async.runtime.batch.contract.test.ts`

≥22 tests covering:
- empty batch → NONE
- all-executed → FULLY_QUEUED
- all-failed → FAILED
- mix executed+failed → PARTIALLY_QUEUED
- aggregate totalTickets, totalExecuted, totalFailed, totalRecords
- warnedCount = count of tickets with failedCount > 0
- deterministic batchId / batchHash
- batchId !== batchHash
- factory method

## Phase E — Governance Chain

1. Partition registry entry
2. Full EPF suite — no regressions
3. CP1 audit, GC-019 review, delta, GC-026 CP1 sync, closure review, GC-026 closed sync
4. Update test log + AGENT_HANDOFF
5. Commit
