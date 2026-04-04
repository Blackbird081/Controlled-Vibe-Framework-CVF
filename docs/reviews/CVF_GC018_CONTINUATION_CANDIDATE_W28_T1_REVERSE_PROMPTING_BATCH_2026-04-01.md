# CVF GC-018 Continuation Candidate — W28-T1 ReversePromptingBatchContract

Memory class: FULL_RECORD

> Date: 2026-04-01
> Reviewer: Cascade
> Quality assessment: `docs/assessments/CVF_POST_W27_CONTINUATION_QUALITY_ASSESSMENT_2026-04-01.md`
> Decision gate: EXPAND_NOW (score 9.86/10)

---

## Candidate Summary

| Field | Value |
|---|---|
| Tranche | W28-T1 |
| Class | REALIZATION |
| Contract | `ReversePromptingContract` |
| Method | `generate(intakeResult: ControlPlaneIntakeResult): ReversePromptPacket` |
| Source file | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/reverse.prompting.contract.ts` |
| Whitepaper surface | W1-T5 — Reverse Prompting |
| Dominant metric | `QuestionPriority` — "high" > "medium" > "low"; "NONE" for empty batch |
| Batch hash salt | `"w28-t1-cp1-reverse-prompting-batch"` |
| Batch ID salt | `"w28-t1-cp1-reverse-prompting-batch-id"` |

---

## Authorization Scope

**In scope:**
- `ReversePromptingBatchContract` class — batches `ReversePromptingContract.generate()`
- `ReversePromptingBatchResult` interface
- `ReversePromptingBatchContractDependencies` interface
- `createReversePromptingBatchContract()` factory function
- ~27 tests in `tests/reverse.prompting.batch.contract.test.ts`
- Barrel exports in `src/index.ts` under W28-T1 block
- CP1 Full Lane governance artifacts (audit, GC-019 review, delta, GC-026 sync)

**Not in scope:**
- Changes to `ReversePromptingContract` implementation
- Changes to `ClarificationRefinementContract`
- Any consumer pipeline batch contracts
- Any other W1-T5 surfaces

---

## Ownership and Dependencies

- **Owns:** `reverse.prompting.batch.contract.ts` (new file)
- **Depends on:** `reverse.prompting.contract.ts` (read-only; not modified)
- **Input type:** `ControlPlaneIntakeResult[]` (from `intake.contract.ts`)
- **Output type:** `ReversePromptingBatchResult` (new interface in batch contract file)
- **No inter-family dependencies** beyond the source contract

---

## Pass Conditions

1. `reverse.prompting.batch.contract.ts` compiles with zero TypeScript errors
2. All ~27 tests pass; CPF suite remains at 0 failures
3. Dominant priority resolution: "high" > "medium" > "low"; "NONE" for empty batch
4. `batchHash` and `batchId` are deterministic across identical inputs
5. `totalPackets`, `totalQuestions`, `highCount`, `mediumCount`, `lowCount` are accurate
6. Barrel exports in `src/index.ts` expose `ReversePromptingBatchContract` and `ReversePromptingBatchResult`
7. All CP1 governance artifacts created with correct memory class declarations

**GC-018 VERDICT: AUTHORIZED — W28-T1 ReversePromptingBatchContract; CP1 Full Lane next**
