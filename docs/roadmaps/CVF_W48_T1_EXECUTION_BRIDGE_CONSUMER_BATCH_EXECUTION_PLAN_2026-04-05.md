# CVF W48-T1 Execution Plan — ExecutionBridgeConsumerBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-05
> Tranche: W48-T1
> Class: REALIZATION
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W48_T1_EXECUTION_BRIDGE_CONSUMER_BATCH_2026-04-05.md`

---

## Objective

Implement `ExecutionBridgeConsumerBatchContract` that batches multiple `DesignConsumptionReceipt` inputs through `ExecutionBridgeConsumerContract.bridge()`, producing an `ExecutionBridgeConsumptionBatchResult` with dominant status classification and aggregated counts.

---

## Fixed Inputs (READ-ONLY)

- `execution.bridge.consumer.contract.ts` — `ExecutionBridgeConsumerContract.bridge(receipt)`
- `ExecutionBridgeReceipt` — `policyGateResult.allowedCount`, `policyGateResult.deniedCount`, `policyGateResult.sandboxedCount`, `totalAssignments`, `authorizedForExecution`, `warnings`
- `createDeterministicBatchIdentity` from `batch.contract.shared.ts` pattern (EPF equivalent)
- Batch hash salt: `"w48-t1-cp1-execution-bridge-consumer-batch"`
- Batch ID salt: `"w48-t1-cp1-execution-bridge-consumer-batch-id"`
- Fixed timestamp for tests: `"2026-04-05T00:00:00.000Z"`

---

## Status Classification

| Status | Condition |
|---|---|
| `FULLY_AUTHORIZED` | `policyGateResult.deniedCount === 0 && policyGateResult.sandboxedCount === 0` |
| `PARTIALLY_AUTHORIZED` | `policyGateResult.allowedCount > 0 && (deniedCount > 0 || sandboxedCount > 0)` |
| `BLOCKED` | `policyGateResult.allowedCount === 0` (all denied or sandboxed) |
| `"NONE"` | empty batch |

Precedence: `BLOCKED > PARTIALLY_AUTHORIZED > FULLY_AUTHORIZED`

---

## Output Shape

```typescript
type ExecutionBridgeBatchStatus = "FULLY_AUTHORIZED" | "PARTIALLY_AUTHORIZED" | "BLOCKED";

interface ExecutionBridgeConsumptionBatchResult {
  batchHash: string;
  batchId: string;
  createdAt: string;
  totalRequests: number;
  receipts: ExecutionBridgeReceipt[];
  dominantStatus: ExecutionBridgeBatchStatus | "NONE";
  fullyAuthorizedCount: number;
  partiallyAuthorizedCount: number;
  blockedCount: number;
  warnedCount: number;
  totalAssignments: number;
  totalAuthorizedForExecution: number;
}
```

---

## Delivery Steps

1. Implement `execution.bridge.consumer.batch.contract.ts` in `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/`
2. Write `execution.bridge.consumer.batch.contract.test.ts` in `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/` (~27 tests)
3. Update `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/index.ts` with exports
4. Update `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
5. Write CP1 audit, GC-019 review, CP1 delta
6. Write GC-026 CP1 delivered sync, closure review, GC-026 closed sync
7. Update `CVF_INCREMENTAL_TEST_LOG.md`, `AGENT_HANDOFF.md`, progress tracker
8. Commit W48-T1 CP1

---

## Pass Conditions

1. `batch([])` → `dominantStatus: "NONE"`, all counts 0
2. Single FULLY_AUTHORIZED receipt → correct status + counts
3. Single PARTIALLY_AUTHORIZED receipt → correct status + counts
4. Single BLOCKED receipt → correct status + counts
5. BLOCKED dominates PARTIALLY_AUTHORIZED in mixed batch
6. Aggregates (`totalAssignments`, `totalAuthorizedForExecution`, `warnedCount`) accurate
7. Deterministic: same inputs → same `batchHash` and `batchId`
8. EPF: all tests pass, 0 failures
9. No regressions in any suite
