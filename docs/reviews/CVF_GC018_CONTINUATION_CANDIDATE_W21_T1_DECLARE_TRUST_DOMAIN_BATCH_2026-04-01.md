# CVF GC-018 Continuation Candidate Review — W21-T1 DeclareTrustDomainBatchContract

Memory class: FULL_RECORD

> Date: 2026-04-01
> Reviewer: Cascade
> Governance control: GC-018 — Continuation Authorization Gate
> Candidate: W21-T1 — DeclareTrustDomainBatchContract (REALIZATION class)
> Quality assessment anchor: `docs/assessments/CVF_POST_W20_CONTINUATION_QUALITY_ASSESSMENT_2026-04-01.md`

---

## Candidate Summary

- **Tranche**: W21-T1
- **Class**: REALIZATION
- **Target**: `TrustIsolationBoundaryContract.declareTrustDomain(TrustDomainCriteria): TrustDomainDeclaration`
- **Source contract**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/trust.isolation.boundary.contract.ts`
- **Batch contract to create**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/declare.trust.domain.batch.contract.ts`
- **Test file to create**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/declare.trust.domain.batch.contract.test.ts`

---

## Authorization Criteria

| Criterion | Status |
|---|---|
| Prior tranche W20-T1 CLOSED DELIVERED | SATISFIED |
| Candidate identified by quality assessment (9.86/10 EXCELLENT) | SATISFIED |
| Additive only — no boundary contract modification | SATISFIED |
| Established batch pattern applicable | SATISFIED |
| Dominant domain precedence defined (FULL_RUNTIME > LIGHTWEIGHT_SDK) | SATISFIED |
| CPF test delta quantified (~+26) | SATISFIED |
| Risk class R1 confirmed | SATISFIED |
| Execution plan exists | SATISFIED |

---

## Implementation Scope

### New contract: `DeclareTrustDomainBatchContract`

- Accepts `TrustDomainDeclaration[]` (results from `declareTrustDomain()`)
- Computes `fullRuntimeCount` and `lightweightSdkCount`
- Resolves `dominantResolvedDomain`: `FULL_RUNTIME > LIGHTWEIGHT_SDK`; `EMPTY` when batch is empty
- Computes deterministic `batchHash` (salt: `w21-t1-cp1-declare-trust-domain-batch`)
- Computes deterministic `batchId` (salt: `w21-t1-cp1-declare-trust-domain-batch-id`)
- Exposes `DeclareTrustDomainBatch` interface and `createDeclareTrustDomainBatchContract` factory

### Test coverage (~26 tests)

- Empty batch: EMPTY dominant domain, zero counts, valid hash/id
- Count accuracy: fullRuntimeCount and lightweightSdkCount correctness
- Dominant domain precedence: FULL_RUNTIME wins on tie; FULL_RUNTIME wins when non-zero; LIGHTWEIGHT_SDK when all lightweight
- Determinism: identical inputs → identical batchHash and batchId
- Factory function: createDeclareTrustDomainBatchContract returns valid instance
- Output shape: all required fields present on DeclareTrustDomainBatch

---

## GC-018 Verdict

**W21-T1 GC-018 AUTHORIZED — 2026-04-01**

DeclareTrustDomainBatchContract authorized for CP1 Full Lane. Proceed to implementation.
