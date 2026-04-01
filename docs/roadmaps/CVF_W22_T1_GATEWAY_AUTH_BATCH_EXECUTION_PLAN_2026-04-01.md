# CVF W22-T1 Execution Plan — GatewayAuthBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-01
> Tranche: W22-T1 — GatewayAuthBatchContract (REALIZATION class)
> Authorization anchor: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W22_T1_GATEWAY_AUTH_BATCH_2026-04-01.md`

---

## Objective

Implement `GatewayAuthBatchContract` batching `GatewayAuthContract.evaluate()` into a governed `GatewayAuthBatch` summary with `AuthStatus` dominant resolution.

---

## Execution Steps

| Step | Action | Artifact |
|---|---|---|
| 1 | Quality assessment | `docs/assessments/CVF_POST_W21_CONTINUATION_QUALITY_ASSESSMENT_2026-04-01.md` ✓ |
| 2 | GC-018 authorization | `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W22_T1_GATEWAY_AUTH_BATCH_2026-04-01.md` ✓ |
| 3 | Execution plan (this doc) | `docs/roadmaps/CVF_W22_T1_GATEWAY_AUTH_BATCH_EXECUTION_PLAN_2026-04-01.md` ✓ |
| 4 | GC-026 auth sync | `docs/baselines/CVF_GC026_TRACKER_SYNC_W22_T1_AUTHORIZATION_2026-04-01.md` ✓ |
| 5 | Implement contract | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.auth.batch.contract.ts` |
| 6 | Implement tests (~26) | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/gateway.auth.batch.contract.test.ts` |
| 7 | Update barrel index | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` |
| 8 | CP1 audit | `docs/audits/CVF_W22_T1_CP1_GATEWAY_AUTH_BATCH_AUDIT_2026-04-01.md` |
| 9 | CP1 GC-019 review | `docs/reviews/CVF_GC019_W22_T1_CP1_GATEWAY_AUTH_BATCH_REVIEW_2026-04-01.md` |
| 10 | CP1 delta | `docs/baselines/CVF_W22_T1_CP1_GATEWAY_AUTH_BATCH_DELTA_2026-04-01.md` |
| 11 | GC-026 CP1 sync | `docs/baselines/CVF_GC026_TRACKER_SYNC_W22_T1_CP1_DONE_2026-04-01.md` |
| 12 | CP2 closure review | `docs/reviews/CVF_W22_T1_TRANCHE_CLOSURE_REVIEW_2026-04-01.md` |
| 13 | GC-026 closed sync | `docs/baselines/CVF_GC026_TRACKER_SYNC_W22_T1_CLOSED_2026-04-01.md` |

---

## Pass Conditions

| # | Condition |
|---|---|
| 1 | `GatewayAuthBatchContract` class exported from new source file |
| 2 | `batch()` accepts `GatewayAuthRequest[]` and calls `auth.evaluate()` on each |
| 3 | `authenticatedCount`, `deniedCount`, `expiredCount`, `revokedCount` accurate |
| 4 | `dominantAuthStatus` follows `REVOKED > EXPIRED > DENIED > AUTHENTICATED`; `"EMPTY"` on empty batch |
| 5 | `batchHash` and `batchId` distinct, deterministic, W22-T1 domain salts |
| 6 | All ~26 CPF tests pass, 0 failures |
| 7 | No regressions in existing test suites |

---

## Key Implementation Values

| Item | Value |
|---|---|
| batchHash salt | `w22-t1-cp1-gateway-auth-batch` |
| batchId salt | `w22-t1-cp1-gateway-auth-batch-id` |
| Dominant precedence | `REVOKED > EXPIRED > DENIED > AUTHENTICATED` |
| EMPTY condition | batch length === 0 |
| CPF baseline | 2330 |
| CPF projected | ~2356 (+26) |
