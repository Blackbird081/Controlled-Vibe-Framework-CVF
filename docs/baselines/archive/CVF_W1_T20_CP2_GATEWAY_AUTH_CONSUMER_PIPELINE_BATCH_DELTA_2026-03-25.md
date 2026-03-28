# CVF W1-T20 CP2 Delta — GatewayAuth Consumer Pipeline Batch Contract

Memory class: SUMMARY_RECORD
> Date: 2026-03-25
> Tranche: W1-T20 / CP2
> Baseline reference: CPF 883 tests (W1-T20 CP1)

---

## Delta Summary

| Field | Before | After |
|---|---|---|
| CPF test count | 883 | 897 |
| New contracts | — | `GatewayAuthConsumerPipelineBatchContract` |
| New test files | — | `gateway.auth.consumer.pipeline.batch.test.ts` (14 tests) |

---

## New Files

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.auth.consumer.pipeline.batch.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/gateway.auth.consumer.pipeline.batch.test.ts`

## Modified Files

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` — W1-T20 comment updated to CP1–CP2; batch exports added

---

## Capability Added

`GatewayAuthConsumerPipelineBatchContract` — batch aggregation of `GatewayAuthConsumerPipelineResult[]` with `nonAuthenticatedCount` (DENIED/EXPIRED/REVOKED outcomes) and `dominantTokenBudget`.
