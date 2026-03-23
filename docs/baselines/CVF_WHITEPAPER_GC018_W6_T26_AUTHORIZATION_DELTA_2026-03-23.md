# CVF Whitepaper GC-018 W6-T26 Authorization Delta

Memory class: SUMMARY_RECORD

> Date: `2026-03-23`

## Tranche

**W6-T26 — CPF Intake & Consumer Tests Slice**
Branch: `cvf-next`
Risk: R0 (test-only, no source changes)
Lane: Full Lane (closes CPF dedicated test coverage gap for intake and consumer contracts)

## Scope

Provide dedicated test coverage for the CPF Intake & Consumer pipeline — two contracts
that previously had coverage only via `index.test.ts`:

- `ControlPlaneIntakeContract` — ControlPlaneIntakeRequest → ControlPlaneIntakeResult
  (createdAt=now(); consumerId propagated/undefined; requestId deterministic; retrieval.query
   = explicit or intent-derived; warnings include "No retrieval chunks" on empty; intent present)
  + `packageIntakeContext` helper (token budget filtering; truncation)
- `ConsumerContract` — ConsumerRequest → ConsumptionReceipt
  (consumerId/consumedAt propagated; requestId/evidenceHash truthy; intake field present;
   freeze=undefined/present based on executionId; getContext() returns injected context)
  + `buildPipelineStages` helper (always: intent-validation, context-packaging;
   knowledge-retrieval when chunkCount>0; deterministic-hashing when hash.length===32)

Key behavioral notes tested:
- ControlPlaneIntakeContract uses default RAGPipeline (no docs) → always warns about empty chunks
- buildPipelineStages "deterministic-hashing" requires snapshotHash.length === 32 (matches hash output)
- ConsumerContract freeze requires non-empty executionId string

## Artifacts Delivered

| File | Change | Lines |
|---|---|---|
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/intake.consumer.test.ts` | New — dedicated test file (GC-023 compliant) | 290 |

## GC-023 Compliance

- `intake.consumer.test.ts`: 290 lines — under 1200 hard threshold ✓
- `tests/index.test.ts` (CPF, frozen at approved max) — untouched ✓
- `src/index.ts` (CPF) — untouched ✓

## Test Counts (Post-Delivery)

| Plane | Tests |
|---|---|
| LPF | 377 |
| GEF | 185 |
| EPF | 416 |
| CPF | 313 (+28) |
| GC  | 172 |

## Authorization

Authorized under GC-018 (Continuation Governance). Test-only — no risk to
existing contracts. Closes dedicated test coverage gap for ControlPlaneIntakeContract
and ConsumerContract (CPF contracts previously covered only via index.test.ts).
