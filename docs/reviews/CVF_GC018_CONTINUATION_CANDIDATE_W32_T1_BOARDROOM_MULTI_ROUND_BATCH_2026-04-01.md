# CVF GC-018 Continuation Candidate Authorization — W32-T1 BoardroomMultiRoundBatchContract

Memory class: FULL_RECORD

> Date: 2026-04-01
> Reviewer: Cascade
> Control: GC-018 — Continuation Candidate Authorization
> Tranche: W32-T1 — BoardroomMultiRoundBatchContract (REALIZATION class)

---

## Authorization Scope

| Field | Value |
|---|---|
| Tranche | W32-T1 |
| Class | REALIZATION |
| Contract to create | `BoardroomMultiRoundBatchContract` |
| Source file | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.multi.round.batch.contract.ts` |
| Test file | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/boardroom.multi.round.batch.contract.test.ts` |
| Batched contract | `BoardroomMultiRoundContract.summarize(rounds: BoardroomRound[])` |
| Whitepaper surface | W1-T6 CP2 — Boardroom Multi-Round |
| Quality assessment | `docs/assessments/CVF_POST_W31_CONTINUATION_QUALITY_ASSESSMENT_2026-04-01.md` (9.17/10 EXCELLENT) |

---

## Authorized Scope

- Create `BoardroomMultiRoundBatchContract` that batches `BoardroomMultiRoundContract.summarize(rounds: BoardroomRound[])`
- Input type: `BoardroomMultiRoundSummaryRequest[]` where `BoardroomMultiRoundSummaryRequest = { rounds: BoardroomRound[] }`
- Output type: `BoardroomMultiRoundBatch` with fields:
  - `batchId: string`
  - `batchHash: string`
  - `createdAt: string`
  - `totalSummaries: number`
  - `proceedCount: number`
  - `amendCount: number`
  - `escalateCount: number`
  - `rejectCount: number`
  - `dominantDecision: BoardroomDecision | "NONE"`
  - `summaries: BoardroomMultiRoundSummary[]`
- Dominant decision severity: REJECT(4) > ESCALATE(3) > AMEND_PLAN(2) > PROCEED(1); `"NONE"` for empty batch
- Batch hash salt: `"w32-t1-cp1-boardroom-multi-round-batch"`
- Batch ID salt: `"w32-t1-cp1-boardroom-multi-round-batch-id"`
- Injectable dependencies: `now?: () => string`, inner `BoardroomMultiRoundContract` instance

---

## Dependencies

| Dependency | Source |
|---|---|
| `BoardroomMultiRoundContract`, `BoardroomMultiRoundSummary`, `BoardroomMultiRoundContractDependencies` | `./boardroom.multi.round.contract` |
| `BoardroomRound` | `./boardroom.round.contract` |
| `BoardroomDecision` | `./boardroom.contract` |
| `computeDeterministicHash` | `../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash` |

---

## Pass Conditions

| # | Condition |
|---|---|
| 1 | `boardroom.multi.round.batch.contract.ts` canonical; zero TypeScript errors |
| 2 | All tests pass; CPF 0 failures |
| 3 | Dominant decision REJECT > ESCALATE > AMEND_PLAN > PROCEED; NONE for empty batch |
| 4 | batchHash/batchId deterministic; correct salts |
| 5 | All count fields accurate (proceedCount, amendCount, escalateCount, rejectCount, totalSummaries) |
| 6 | New tests in dedicated file `boardroom.multi.round.batch.contract.test.ts`; index.test.ts not modified |
| 7 | All CP1 governance artifacts present with correct memory classes |

---

## GC-023 Pre-Flight

| File | Current lines | Limit | Decision |
|---|---|---|---|
| `CPF/src/boardroom.multi.round.batch.contract.ts` | 0 (new file) | 1000 | new file — no limit check needed |
| `CPF/tests/boardroom.multi.round.batch.contract.test.ts` | 0 (new file) | 1200 | new file — no limit check needed |
| `CPF/src/index.ts` | 944 | 1000 | adding ~10 export lines → ~954 — within limit |
| `CPF/tests/index.test.ts` | 3106 | 3200 (exception) | FROZEN — must not be touched |

---

## Out of Scope

- No changes to `BoardroomMultiRoundContract` implementation
- No changes to `BoardroomRoundContract` or other existing contracts
- No consumer pipeline batch work in this tranche

---

## Authorization Verdict

**GC-018 AUTHORIZED** — W32-T1 BoardroomMultiRoundBatchContract; batches `BoardroomMultiRoundContract.summarize(rounds: BoardroomRound[])`; dominant decision REJECT > ESCALATE > AMEND_PLAN > PROCEED; CPF 2654 baseline; proceed to CP1 Full Lane implementation.
