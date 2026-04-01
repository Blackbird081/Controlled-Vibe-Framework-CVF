# CVF W28-T1 Execution Plan — ReversePromptingBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-01
> Tranche: W28-T1 — ReversePromptingBatchContract (REALIZATION class)
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W28_T1_REVERSE_PROMPTING_BATCH_2026-04-01.md`
> Lane: CP1 Full Lane

---

## Objective

Implement `ReversePromptingBatchContract` to batch `ReversePromptingContract.generate()` over a `ControlPlaneIntakeResult[]` input, resolving dominant `QuestionPriority` and producing a deterministic `ReversePromptingBatchResult`.

---

## Implementation Steps

### Step 1 — Implement `reverse.prompting.batch.contract.ts`

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/reverse.prompting.batch.contract.ts`

Key elements:
- `ReversePromptingBatchResult` interface: `batchId`, `batchHash`, `createdAt`, `totalPackets`, `totalQuestions`, `highCount`, `mediumCount`, `lowCount`, `dominantPriority`, `results: ReversePromptPacket[]`
- `ReversePromptingBatchContractDependencies`: `{ now?: () => string }`
- `ReversePromptingBatchContract.batch(intakeResults: ControlPlaneIntakeResult[], contract: ReversePromptingContract): ReversePromptingBatchResult`
- `resolveDominantPriority(high, medium, low)`: highest count wins; tie-break "high" > "medium" > "low"; "NONE" if all zero
- Deterministic hashing: batchHash salt `"w28-t1-cp1-reverse-prompting-batch"`, batchId salt `"w28-t1-cp1-reverse-prompting-batch-id"`
- `createReversePromptingBatchContract()` factory

### Step 2 — Write tests

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/reverse.prompting.batch.contract.test.ts`

~27 tests covering:
- Empty batch → NONE dominant, all counts 0, zero packets
- Single intake → packet count 1, correct question routing
- Dominant priority: high wins; medium wins over low; low only
- Tie-breaking: high > medium when equal counts
- Tie-breaking: high > low when equal counts
- Tie-breaking: medium > low when equal counts
- All three equal → high wins
- Count accuracy: totalQuestions sum
- Count accuracy: highCount, mediumCount, lowCount
- Determinism: identical inputs → identical batchHash
- Determinism: different inputs → different batchHash
- Output shape: all required fields present
- Factory function: creates correct instance

### Step 3 — Add barrel exports

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`

Add W28-T1 block exporting:
- `ReversePromptingBatchContract`
- `ReversePromptingBatchResult`
- `ReversePromptingBatchContractDependencies`
- `createReversePromptingBatchContract`

### Step 4 — Run CPF test suite

Confirm: CPF 2507 → ~2534 (+~27), 0 failures.

### Step 5 — Create CP1 governance artifacts

- `docs/audits/CVF_W28_T1_CP1_REVERSE_PROMPTING_BATCH_AUDIT_2026-04-01.md`
- `docs/reviews/CVF_GC019_W28_T1_CP1_REVERSE_PROMPTING_BATCH_REVIEW_2026-04-01.md`
- `docs/baselines/CVF_W28_T1_CP1_REVERSE_PROMPTING_BATCH_DELTA_2026-04-01.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W28_T1_CP1_DONE_2026-04-01.md`

### Step 6 — Update tracker + AGENT_HANDOFF, commit, push

---

## Key Values

| Key | Value |
|---|---|
| Batch hash salt | `"w28-t1-cp1-reverse-prompting-batch"` |
| Batch ID salt | `"w28-t1-cp1-reverse-prompting-batch-id"` |
| Fixed test timestamp | `"2026-04-01T00:00:00.000Z"` |
| Dominant precedence | high > medium > low; NONE for empty |
| Input type | `ControlPlaneIntakeResult[]` |
| Output type | `ReversePromptingBatchResult` |
