# CVF W50-T1 Execution Plan — PolicyGateBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-05
> Tranche: W50-T1 | Class: REALIZATION | Lane: Full Lane

---

## Phase A — Barrel Move (PolicyGate → epf.dispatch.barrel.ts)

1. Remove `PolicyGateContract` exports from `index.ts` (lines 544–554, ~10 lines)
2. Add PolicyGate exports to `epf.dispatch.barrel.ts` (W2-T2 CP2 section)
3. Verify `export * from "./epf.dispatch.barrel"` in `index.ts` still covers all PolicyGate symbols
4. Expected result: `index.ts` 1423 → ~1413 lines

## Phase B — Implementation

File: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/policy.gate.batch.contract.ts`

```
PolicyGateBatchInput     { dispatchResult: DispatchResult }
PolicyGateBatchStatus    "FULLY_ALLOWED" | "PARTIALLY_ALLOWED" | "FULLY_BLOCKED" | "NONE"
PolicyGateBatchResult    {
  batchId, batchHash, evaluatedAt,
  results: PolicyGateResult[],
  totalAllowed, totalDenied, totalReviewRequired, totalSandboxed, totalPending,
  totalEntries, warnedCount,
  dominantDecision: PolicyGateBatchStatus
}
PolicyGateBatchContract.batch(inputs: PolicyGateBatchInput[]): PolicyGateBatchResult
```

Status resolution:
- NONE: no inputs
- FULLY_ALLOWED: totalAllowed > 0, totalDenied=0, totalReviewRequired=0, totalSandboxed=0, totalPending=0
- PARTIALLY_ALLOWED: totalAllowed > 0, any of (denied|review|sandbox|pending) > 0
- FULLY_BLOCKED: totalAllowed = 0 (non-empty)

Salts: batchHash = "w50-t1-cp1-policy-gate-batch" / batchId = "w50-t1-cp1-policy-gate-batch-id"

## Phase C — Tests

File: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/policy.gate.batch.contract.test.ts`
Target: ≥22 tests covering empty batch, each status path, aggregation counts, warnedCount, determinism, factory.

## Phase D — Governance Chain

- CP1 audit, GC-019 review, CP1 delta, GC-026 CP1 sync, closure review, GC-026 closed sync
- Update CVF_INCREMENTAL_TEST_LOG.md
- Update AGENT_HANDOFF.md
- Commit
