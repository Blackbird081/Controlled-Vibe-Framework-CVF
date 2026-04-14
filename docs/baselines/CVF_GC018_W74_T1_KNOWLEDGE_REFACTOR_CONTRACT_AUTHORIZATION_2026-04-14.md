---
memory_class: SUMMARY_RECORD
---

# GC-018 Authorization — W74-T1: KnowledgeRefactorContract

**Authorization Date:** 2026-04-14
**Tranche:** W74-T1
**Class:** REALIZATION
**Authorized by:** Operator (explicit authorization 2026-04-14)

## Authorization Statement

W74-T1 is authorized to implement `KnowledgeRefactorContract` and `KnowledgeRefactorBatchContract` as **Step 6 (Refactor)** of the 6-step Knowledge Lifecycle: `Ingest → Compile → Govern → Query → Maintain → Refactor`.

This completes the full lifecycle implementation at CPF contract layer.

## Scope Boundaries

**Allowed:**
- `KnowledgeRefactorProposal` type with content-bound `proposalHash` and time-variant `proposalId`
- `recommend()` method: takes `KnowledgeMaintenanceResult` (must have `hasIssues: true`), produces proposal
- `KnowledgeRefactorAction`: `"recompile"` | `"archive"` | `"review"`
- Action selection heuristic based on signal types present in the result
- Batch surface via `KnowledgeRefactorBatchContract`
- Barrel exports in `control.plane.knowledge.barrel.ts`

**Not allowed in this tranche:**
- Any actual artifact recompilation or mutation (contract is propose-only)
- Any write to the Learning Plane, FeedbackLedger, or external stores
- New guard families or validation contracts
- CLI/runtime surface changes

## Dependency

Depends on `KnowledgeMaintenanceResult` and `KnowledgeMaintenanceSignalType` from W73-T2 (`knowledge.maintenance.contract.ts`).
