# CVF GC-018 Continuation Candidate — W33-T1 KnowledgeRankingBatchContract

Memory class: FULL_RECORD

> Date: 2026-04-01
> Reviewer: Cascade
> Trigger: W32-T1 CLOSED DELIVERED; quality-first gate cleared (9.17/10 EXCELLENT — EXPAND_NOW); no active tranche

---

## 1. Candidate Identity

| Field | Value |
|---|---|
| Tranche | W33-T1 |
| Class | REALIZATION |
| Contract name | `KnowledgeRankingBatchContract` |
| Batched surface | `KnowledgeRankingContract.rank(request: KnowledgeRankingRequest)` |
| Whitepaper surface | W1-T12 — Knowledge Ranking |
| Source file | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.batch.contract.ts` |
| Test file | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/knowledge.ranking.batch.contract.test.ts` |

---

## 2. Quality-First Gate

| Field | Value |
|---|---|
| Active quality assessment | `docs/assessments/CVF_POST_W32_CONTINUATION_QUALITY_ASSESSMENT_2026-04-01.md` |
| Weighted score | `9.17/10` — EXCELLENT |
| Gate decision | `EXPAND_NOW` |
| Gate rationale | Score above 9.0 threshold; no low-score action policy triggered; weakest dimension (Maintainability) is not an immediate blocker |

---

## 3. Candidate Justification

- `KnowledgeRankingContract.rank()` is a canonical W1-T12 surface with no existing batch contract.
- Single method, single request type (`KnowledgeRankingRequest`) — matches the established batch contract pattern exactly.
- Only injectable dependency: `now?: () => string` — no external shell or platform dependencies; fully testable.
- Pure composite scoring logic (relevance + tier + recency weights) — deterministic and self-contained.
- Fits naturally after the boardroom family closure (W29-T1 through W32-T1); shifts continuation into the knowledge-layer batch surface.
- Expected CPF test delta: +~28–35 tests.

---

## 4. Batch Contract Design

### Input/Output

- `batch(requests: KnowledgeRankingRequest[]): KnowledgeRankingBatch`
- Each request → `KnowledgeRankingContract.rank(request)` → `RankedKnowledgeResult`
- Empty batch → `totalRankings: 0`, valid `batchHash`/`batchId`

### Output Shape

```typescript
interface KnowledgeRankingBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRankings: number;
  dominantRankedCount: number;
  results: RankedKnowledgeResult[];
}
```

### Determinism

- Batch hash salt: `"w33-t1-cp1-knowledge-ranking-batch"`
- Batch ID salt: `"w33-t1-cp1-knowledge-ranking-batch-id"`
- Hash inputs: `createdAt`, `totalRankings`, `dominantRankedCount`, summary of item counts

### No dominant enum resolution

`KnowledgeRankingContract.rank()` returns scored/ranked items, not a decision enum. The batch aggregate exposes `totalRankings` and `dominantRankedCount` (max `totalRanked` across results) as the aggregate surface.

---

## 5. Scope Boundaries

### In scope

- `KnowledgeRankingBatchContract` source file
- Dedicated test file with full coverage
- Barrel exports in `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`
- CP1 Full Lane governance artifacts
- Tracker and AGENT_HANDOFF updates

### Not in scope

- Modifying `KnowledgeRankingContract` or any consumer pipeline contracts
- New `KnowledgeRankingRequest` types or scoring weight changes
- Any other unbatched contract surfaces
- EPF / GEF / LPF changes

---

## 6. Dependency Declaration

| Dependency | Type | Status |
|---|---|---|
| `KnowledgeRankingContract` | inner contract | STABLE — read-only dependency |
| `batch.contract.shared.ts` | shared helper | STABLE — `createDeterministicBatchIdentity` used |
| `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` | hash util | STABLE |
| CPF test partition registry | governance | Updated as part of this tranche |

---

## 7. Exclusions

- No changes to `knowledge.query.batch.contract.ts` or any existing batch contract
- No `knowledge.ranking.consumer.pipeline.batch.contract.ts` modification
- No whitepaper update in this tranche (reserved for future DOCUMENTATION class tranche)
- No `L0-L4` risk model or trust-isolation surface changes

---

## 8. Maintainability Notes (GC-033 through GC-036)

- Reuse `batch.contract.shared.ts` (`createDeterministicBatchIdentity`) — no local copy-paste of hashing logic
- Tests use `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/helpers/cpf.batch.contract.fixtures.ts` helper where applicable
- No new advisory-threshold breach expected; knowledge.ranking.batch.contract.ts projected <100 lines

---

## 9. Pass Conditions

| # | Condition |
|---|---|
| 1 | `knowledge.ranking.batch.contract.ts` canonical; zero TypeScript errors |
| 2 | All tests pass; CPF 0 failures |
| 3 | `batch(requests)` correctly calls `KnowledgeRankingContract.rank()` per request |
| 4 | Empty batch returns `totalRankings: 0`, valid hash/ID |
| 5 | `dominantRankedCount` = `Math.max(...results.map(r => r.totalRanked))`, `0` for empty |
| 6 | `batchHash` and `batchId` deterministic with correct salts; `batchId ≠ batchHash` |
| 7 | All CP1 governance artifacts present with correct memory classes |

---

## 10. Authorization

**GC-018 AUTHORIZED — W33-T1 KnowledgeRankingBatchContract**

- Quality gate: CLEARED (9.17/10 EXCELLENT — EXPAND_NOW)
- Candidate: ACCEPTED — single-method, injectable, W1-T12 surface, no external shell
- Scope: BOUNDED — no other surfaces touched
- Maintainability: PROTECTED — shared helpers enforced
- Next: proceed to CP1 Full Lane implementation
