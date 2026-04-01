# CVF W29-T1 BoardroomBatchContract Execution Plan

Memory class: SUMMARY_RECORD

> Date: 2026-04-01
> Tranche: W29-T1 — BoardroomBatchContract (REALIZATION class)
> Authorization: GC-018 AUTHORIZED 2026-04-01
> Lane: Full Lane

---

## Objective

Implement `BoardroomBatchContract` to batch `BoardroomContract.review()` calls across multiple `BoardroomRequest` inputs, resolving dominant `BoardroomDecision` with severity precedence REJECT > ESCALATE > AMEND_PLAN > PROCEED.

---

## Key Values

| Field | Value |
|---|---|
| Source contract | `boardroom.contract.ts` — `BoardroomContract.review(request: BoardroomRequest)` |
| Output interface | `BoardroomBatchResult` |
| Dominant enum | `BoardroomDecision`: REJECT(4) > ESCALATE(3) > AMEND_PLAN(2) > PROCEED(1) |
| Empty sentinel | `"NONE"` |
| Batch hash salt | `"w29-t1-cp1-boardroom-batch"` |
| Batch ID salt | `"w29-t1-cp1-boardroom-batch-id"` |
| Fixed test timestamp | `"2026-04-01T00:00:00.000Z"` |

---

## Implementation Steps

### Step 1 — Implement `boardroom.batch.contract.ts`

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.batch.contract.ts`

Structure:
```typescript
export interface BoardroomBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalSessions: number;
  proceedCount: number;
  amendCount: number;
  escalateCount: number;
  rejectCount: number;
  dominantDecision: BoardroomDecision | "NONE";
  sessions: BoardroomSession[];
}

export function resolveDominantBoardroomDecision(
  sessions: BoardroomSession[]
): BoardroomDecision | "NONE"

export class BoardroomBatchContract { batch(requests: BoardroomRequest[]): BoardroomBatchResult }
export function createBoardroomBatchContract(...): BoardroomBatchContract
```

### Step 2 — Write test suite

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/boardroom.batch.contract.test.ts`

Test groups (~28-32 tests):
- Empty batch → NONE sentinel, zero counts
- Single request routing → correct session in output
- Dominant resolution: REJECT wins over all; ESCALATE over AMEND/PROCEED; AMEND over PROCEED
- Count accuracy across mixed decision batches
- Determinism: same inputs → same batchHash/batchId
- Output shape: all required fields present
- Factory: `createBoardroomBatchContract()` returns working instance

### Step 3 — Add barrel exports

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`

Add W29-T1 block exporting `BoardroomBatchContract`, `BoardroomBatchResult`, `resolveDominantBoardroomDecision`, `createBoardroomBatchContract`.

### Step 4 — Run CPF tests

Command: `npx jest --testPathPattern="CVF_CONTROL_PLANE_FOUNDATION" --no-coverage`

Expected: 0 failures; count rises from 2538 to ~2566-2570.

### Step 5 — Create CP1 governance artifacts

- `docs/audits/CVF_W29_T1_CP1_BOARDROOM_BATCH_AUDIT_2026-04-01.md`
- `docs/reviews/CVF_GC019_W29_T1_CP1_BOARDROOM_BATCH_REVIEW_2026-04-01.md`
- `docs/baselines/CVF_W29_T1_CP1_BOARDROOM_BATCH_DELTA_2026-04-01.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W29_T1_CP1_DONE_2026-04-01.md`

### Step 6 — Update tracker + AGENT_HANDOFF, commit + push (CP1)

### Step 7 — Create CP2 closure artifacts + commit + push

---

## Exit Criteria

All 7 pass conditions satisfied; CPF 0 failures; W1-T3 CP2 boardroom surface closed.
