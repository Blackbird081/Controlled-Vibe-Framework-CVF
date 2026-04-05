# CVF W51-T1 Execution Plan — CommandRuntimeBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-05
> Tranche: W51-T1 | Class: REALIZATION
> Authorization: GC-018 AUTHORIZED

---

## Phase A — Governance Pre-work (DONE)

1. Post-W50 quality assessment — DONE
2. GC-018 authorization — DONE
3. This execution plan — DONE
4. GC-026 auth sync — DONE

## Phase B — Barrel Move

Move `CommandRuntimeContract` exports from `index.ts:522-532` → `epf.dispatch.barrel.ts`:
- `CommandRuntimeContract`, `createCommandRuntimeContract`
- `RuntimeExecutionStatus`, `RuntimeExecutionRecord`, `CommandRuntimeResult`, `CommandRuntimeContractDependencies`

Update `epf.dispatch.barrel.ts` header comment to include W51-T1.

## Phase C — Contract Implementation

File: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/command.runtime.batch.contract.ts`

```
CommandRuntimeBatchContract.batch(inputs: CommandRuntimeBatchInput[]): CommandRuntimeBatchResult

Input: { policyGateResult: PolicyGateResult }[]
Calls: CommandRuntimeContract.execute(policyGateResult) per input
Aggregates: totalExecuted, totalSandboxed, totalSkipped, totalFailed, totalRecords, warnedCount
dominantStatus: FULLY_EXECUTED | PARTIALLY_EXECUTED | FULLY_BLOCKED | NONE
Salts: "w51-t1-cp1-command-runtime-batch" / "w51-t1-cp1-command-runtime-batch-id"
```

Status resolution:
- NONE: empty
- FULLY_EXECUTED: totalExecuted > 0, totalSandboxed=0, totalSkipped=0, totalFailed=0
- PARTIALLY_EXECUTED: totalExecuted > 0, any of sandboxed/skipped/failed > 0
- FULLY_BLOCKED: totalExecuted=0, non-empty

## Phase D — Tests

File: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/command.runtime.batch.contract.test.ts`

≥22 tests covering:
- empty batch → NONE
- all-executed → FULLY_EXECUTED
- all-sandboxed → FULLY_BLOCKED
- all-skipped-denied → FULLY_BLOCKED
- all-failed → FULLY_BLOCKED
- mix executed+sandboxed → PARTIALLY_EXECUTED
- mix executed+skipped → PARTIALLY_EXECUTED
- mix executed+failed → PARTIALLY_EXECUTED
- aggregate counts correct (multi-input)
- totalRecords = sum of records.length
- warnedCount = count of results with failedCount > 0
- deterministic batchId / batchHash
- batchId !== batchHash
- factory method

## Phase E — Governance Chain

1. Partition registry entry
2. Full EPF suite — no regressions
3. CP1 audit, GC-019 review, delta, GC-026 CP1 sync, closure review, GC-026 closed sync
4. Update test log + AGENT_HANDOFF
5. Commit
