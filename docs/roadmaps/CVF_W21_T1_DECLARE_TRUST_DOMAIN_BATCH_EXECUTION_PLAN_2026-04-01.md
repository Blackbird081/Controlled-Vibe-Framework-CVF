# CVF W21-T1 Execution Plan — DeclareTrustDomainBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-01
> Tranche: W21-T1 — DeclareTrustDomainBatchContract (REALIZATION class)
> Authorization: GC-018 AUTHORIZED 2026-04-01
> Lane: Full Lane (GC-019)

---

## Objective

Implement `DeclareTrustDomainBatchContract` — batching `TrustIsolationBoundaryContract.declareTrustDomain()`. Closes the W8-T1 `TrustIsolationBoundaryContract` batch surface entirely.

---

## Inputs

| Item | Value |
|---|---|
| Source contract | `trust.isolation.boundary.contract.ts` |
| Target method | `declareTrustDomain(criteria: TrustDomainCriteria): TrustDomainDeclaration` |
| Input type | `TrustDomainDeclaration[]` (batch of declaration results) |
| Dominant precedence | `FULL_RUNTIME > LIGHTWEIGHT_SDK` |
| EMPTY condition | batch length === 0 |
| batchHash salt | `w21-t1-cp1-declare-trust-domain-batch` |
| batchId salt | `w21-t1-cp1-declare-trust-domain-batch-id` |

---

## Deliverables

| # | Deliverable | Path |
|---|---|---|
| 1 | Contract source | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/declare.trust.domain.batch.contract.ts` |
| 2 | Test file (~26 tests) | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/declare.trust.domain.batch.contract.test.ts` |
| 3 | Barrel index update | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` |
| 4 | CP1 audit | `docs/audits/CVF_W21_T1_CP1_DECLARE_TRUST_DOMAIN_BATCH_AUDIT_2026-04-01.md` |
| 5 | CP1 GC-019 review | `docs/reviews/CVF_GC019_W21_T1_CP1_DECLARE_TRUST_DOMAIN_BATCH_REVIEW_2026-04-01.md` |
| 6 | CP1 delta | `docs/baselines/CVF_W21_T1_CP1_DECLARE_TRUST_DOMAIN_BATCH_DELTA_2026-04-01.md` |
| 7 | GC-026 CP1 sync | `docs/baselines/CVF_GC026_TRACKER_SYNC_W21_T1_CP1_DONE_2026-04-01.md` |

---

## Pass Conditions

| # | Condition |
|---|---|
| 1 | `DeclareTrustDomainBatchContract` class exported from new file |
| 2 | `batch()` accepts `TrustDomainDeclaration[]` and computes counts correctly |
| 3 | `fullRuntimeCount` and `lightweightSdkCount` accurate |
| 4 | `dominantResolvedDomain` follows FULL_RUNTIME > LIGHTWEIGHT_SDK; EMPTY when empty |
| 5 | `batchHash` and `batchId` distinct, deterministically computed with correct salts |
| 6 | All ~26 CPF tests pass, 0 failures |
| 7 | No regressions in existing test suites |

---

## CPF Projection

| Metric | Value |
|---|---|
| Current CPF | 2304 |
| Projected CPF after W21-T1 | ~2330 (+26) |
| Risk class | R1 |
