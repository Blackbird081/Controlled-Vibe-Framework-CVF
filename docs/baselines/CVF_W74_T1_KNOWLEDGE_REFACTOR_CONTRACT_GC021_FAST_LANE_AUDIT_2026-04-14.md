---
memory_class: SUMMARY_RECORD
---

# CVF Fast Lane Audit — W74-T1: KnowledgeRefactorContract

**Audit Date:** 2026-04-14
**Tranche:** W74-T1
**Classification:** REALIZATION class
**Authorization Ref:** CVF_GC018_W74_T1_KNOWLEDGE_REFACTOR_CONTRACT_AUTHORIZATION_2026-04-14.md

## Scope

Implements `KnowledgeRefactorContract` and `KnowledgeRefactorBatchContract` as Step 6 (Refactor) of the 6-step Knowledge Lifecycle. Takes a `KnowledgeMaintenanceResult` with `hasIssues: true` and produces a `KnowledgeRefactorProposal` with a recommended action (`recompile` | `archive` | `review`). This is a propose-only contract — no artifact mutations, no store writes.

## Deliverables

- `src/knowledge.refactor.contract.ts` — `KnowledgeRefactorContract`, `createKnowledgeRefactorContract`
- `src/knowledge.refactor.batch.contract.ts` — `KnowledgeRefactorBatchContract`, `createKnowledgeRefactorBatchContract`
- `src/control.plane.knowledge.barrel.ts` — W74-T1 exports added
- `tests/knowledge.refactor.contract.test.ts`
- `tests/knowledge.refactor.batch.contract.test.ts`

## Key Design Decisions

- `proposalHash` is **content-bound** — bound to `artifactId + triggerTypes + recommendedAction`
- `proposalId` is **time-variant** — unique per recommendation invocation
- Action heuristic: `orphan`-only signals → `"archive"`; `drift` or `staleness` present → `"recompile"`; otherwise → `"review"`
- Throws if `result.hasIssues === false` — refactor requires confirmed issues
- Completes the 6-step lifecycle at CPF contract layer

## Quality Gate

- tsc: clean
- vitest: all tests pass
- GC-023: no file size violations
