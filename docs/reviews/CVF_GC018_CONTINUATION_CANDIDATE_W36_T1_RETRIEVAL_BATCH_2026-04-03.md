# CVF GC-018 Continuation Authorization — W36-T1 RetrievalBatchContract

Memory class: FULL_RECORD

> Date: 2026-04-03
> Reviewer: Cascade
> Tranche: W36-T1 — RetrievalBatchContract (REALIZATION class)
> Gate: GC-018 Continuation Authorization
> Quality gate input: `docs/assessments/CVF_POST_W32_CONTINUATION_QUALITY_ASSESSMENT_2026-04-01.md` (9.17/10 — EXPAND_NOW)

---

## 1. Candidate Identity

| Field | Value |
|---|---|
| Tranche | W36-T1 |
| Class | REALIZATION |
| Contract to create | `RetrievalBatchContract` |
| Source contract | `RetrievalContract` |
| Batched method | `retrieve(request: RetrievalRequest): RetrievalResultSurface` |
| Whitepaper surface | W1-T2 — Usable Intake Slice (retrieval sub-surface) |
| Batch hash salt | `"w36-t1-cp1-retrieval-batch"` |
| Batch ID salt | `"w36-t1-cp1-retrieval-batch-id"` |
| Dominant aggregation | `dominantStatus` by severity: HIT > EMPTY > NONE (empty) |

---

## 2. Quality Gate

| Field | Value |
|---|---|
| Active quality assessment | `docs/assessments/CVF_POST_W32_CONTINUATION_QUALITY_ASSESSMENT_2026-04-01.md` |
| Weighted score | 9.17/10 — EXCELLENT |
| Decision | EXPAND_NOW |
| Quality gate | PASSED |

---

## 3. Scope Declaration

### In This Wave

- Create `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/retrieval.batch.contract.ts`
- Write `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/retrieval.batch.contract.test.ts` (target ≥ 30 tests)
- Add barrel exports to `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.workflow.barrel.ts`
- Add `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry
- Create CP1 governance artifacts (audit, review, delta, GC-026 CP1 sync)
- Create CP2 closure artifacts (tranche closure review, GC-026 closed sync)
- Update `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
- Update `AGENT_HANDOFF.md`

### Not In This Wave

- No changes to `RetrievalContract` source (read-only dependency)
- No changes to `PackagingContract`, `ConsumerContract`, or `ControlPlaneIntakeContract` (read-only)
- No EPF / GEF / LPF changes
- No whitepaper architectural changes (architecture baseline remains `v3.6-W32T1`)
- No `tests/index.test.ts` or `tests/barrel.smoke.test.ts` modification

---

## 4. Status Classification Model

| Status | Condition |
|---|---|
| `HIT` | `result.chunkCount > 0` — retrieval found at least one chunk for the query |
| `EMPTY` | `result.chunkCount === 0` — retrieval returned no chunks for the query |
| `NONE` | Empty batch — no requests processed |

Severity ordering: `HIT` > `EMPTY`; `NONE` for empty batch.

`dominantStatus` rule: if any result is `HIT`, the batch dominant is `HIT`; if all results are `EMPTY`, the batch dominant is `EMPTY`; empty batch yields `NONE`.

---

## 5. Dependency Declaration

| Dependency | Role | Status |
|---|---|---|
| `RetrievalContract` | Source contract (read-only) | Canonical — W1-T2 |
| `RetrievalRequest` | Input type from `retrieval.contract` | Canonical |
| `RetrievalResultSurface` | Output type from `retrieval.contract` | Canonical |
| `RetrievalContractDependencies` | Dep injection interface | Canonical |
| `createDeterministicBatchIdentity` | Batch identity helper from `batch.contract.shared.ts` | Canonical |
| `FIXED_BATCH_NOW` | Test fixture constant from `cpf.batch.contract.fixtures.ts` | Canonical |

---

## 6. Ownership Map

| Item | Action |
|---|---|
| `retrieval.batch.contract.ts` | CREATE — new REALIZATION class module |
| `retrieval.batch.contract.test.ts` | CREATE — dedicated test partition |
| `control.plane.workflow.barrel.ts` | MODIFY — add W36-T1 exports |
| `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` | MODIFY — add entry |

---

## 7. Pass Conditions

1. `retrieval.batch.contract.ts` canonical; zero TypeScript errors
2. All tests pass; CPF 0 failures
3. `batch(requests)` correctly calls `RetrievalContract.retrieve()` for each request
4. Empty batch returns `dominantStatus: "NONE"`, all counts 0, `totalChunkCount` 0, valid `batchHash`/`batchId`
5. Status classification: `HIT` = chunkCount > 0, `EMPTY` = chunkCount === 0
6. `dominantStatus` severity ordering: HIT > EMPTY > NONE
7. `batchHash` and `batchId` deterministic with correct salts; `batchId ≠ batchHash`
8. All CP1 governance artifacts present with correct memory classes

---

## 8. Authorization Verdict

**GC-018 AUTHORIZED — W36-T1 RetrievalBatchContract (REALIZATION class); bounded scope; W1-T2 retrieval batch surface; Full Lane; ready to implement.**
