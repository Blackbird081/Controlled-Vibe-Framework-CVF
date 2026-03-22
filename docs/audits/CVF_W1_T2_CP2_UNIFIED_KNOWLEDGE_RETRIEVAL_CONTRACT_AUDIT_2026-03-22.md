# CVF W1-T2 CP2 Unified Knowledge Retrieval Contract Audit

> Decision type: `GC-019` structural change audit  
> Tranche: `W1-T2 - Usable Intake Slice`  
> Date: `2026-03-22`

---

## 1. Proposal

- Change ID: `GC019-W1-T2-CP2-UNIFIED-KNOWLEDGE-RETRIEVAL-CONTRACT-2026-03-22`
- Date: `2026-03-22`
- Proposed target:
  - unified retrieval contract in `CVF_CONTROL_PLANE_FOUNDATION` consumed by both the intake contract and the knowledge facade
- Proposed change class:
  - `additive contract alignment`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_W1_T2_USABLE_INTAKE_SLICE_EXECUTION_PLAN_2026-03-22.md`

## 2. Scope

- Source modules:
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`
  - `EXTENSIONS/CVF_PLANE_FACADES`
  - `EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE` (source dependency, not modified)
  - `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` (source dependency, not modified)
- Affected consumers:
  - `ControlPlaneIntakeContract.execute()` — should delegate retrieval to the new unified contract instead of owning retrieval logic directly
  - `KnowledgeFacade.retrieveContext()` — should delegate to the same unified retrieval contract instead of duplicating mapping/filtering logic
  - `KnowledgeFacade.prepareIntake()` — benefits indirectly because the intake contract it delegates to will use the unified retrieval path
  - future callers who need governed retrieval without full intake
- Active-path impact:
  - `LIMITED-MEDIUM`
- Out of scope:
  - full `AI Gateway` runtime rewrite
  - physical merge of the source modules
  - `AI Boardroom / Reverse Prompting`
  - `CEO Orchestrator Agent`
  - learning-plane and concept-only governance targets
  - new embedding or vector-search behavior beyond what `CVF_ECO_v1.4_RAG_PIPELINE` already provides
  - memory/graph unification beyond current source-backed retrieval

## 3. Problem Statement

The current implementation has two parallel retrieval paths with duplicated logic:

### Path A — `KnowledgeFacade.retrieveContext()`

- maps `RAGDocument` → `ContextChunk` with its own inline logic
- resolves document sources with its own `resolveSource()` method
- applies post-retrieval filters with its own `matchesFilters()` method
- uses its own `readStringFilter()` and `readStringList()` helpers
- logs retrieval but has no contract-level metadata surface

### Path B — `ControlPlaneIntakeContract.execute()` (CP1)

- maps `RAGDocument` → `IntakeContextChunk` with its own `mapDocument()` method
- resolves document sources with its own `resolveSource()` method
- applies post-retrieval filters with its own `matchesFilters()` method
- uses its own `readStringFilter()` and `readStringList()` helpers
- does not expose retrieval as an independently callable contract

### Duplication Evidence

The following private methods are duplicated between `intake.contract.ts` and `knowledge.facade.ts`:

- `resolveSource()` — identical logic, different hosts
- `matchesFilters()` — identical logic, different hosts
- `readStringFilter()` — identical logic, different hosts
- `readStringList()` — identical logic, different hosts
- document-to-chunk mapping — near-identical logic with different type names

### Consumer Impact

- callers who want governed retrieval without full intake must use the loose facade path, which bypasses the contract boundary
- callers who use `prepareIntake()` get retrieval bundled in, with no way to inspect or reuse the retrieval step independently
- the duplicated logic means that a retrieval behavior change must be made in two places

## 4. Module Profiles

### `CVF_CONTROL_PLANE_FOUNDATION`

- language/runtime: TypeScript
- current role:
  - governed control-plane boundary package
  - hosts `ControlPlaneIntakeContract` (CP1)
- strength relevant to `CP2`:
  - natural location for a unified retrieval contract that the intake contract delegates to

### `CVF_PLANE_FACADES`

- language/runtime: TypeScript
- current role:
  - facade contract layer for callers
  - hosts `KnowledgeFacade` with `retrieveContext()` and `prepareIntake()`
- strength relevant to `CP2`:
  - caller-facing surface that should delegate to the unified retrieval contract instead of reimplementing retrieval logic

### `CVF_ECO_v1.4_RAG_PIPELINE`

- language/runtime: TypeScript
- current role:
  - retrieval / RAG pipeline foundations
- strength relevant to `CP2`:
  - provides the underlying `RAGPipeline.query()` that both paths already use
  - remains a dependency, not a modification target

## 5. Proposed Solution Shape

### New artifact: `retrieval.contract.ts` in `CVF_CONTROL_PLANE_FOUNDATION/src/`

A unified retrieval contract class that:

1. accepts a typed retrieval request (query, options, filters)
2. delegates to `RAGPipeline.query()` for the actual search
3. maps `RAGDocument[]` → `RetrievalChunk[]` through one shared mapping path
4. applies post-retrieval filtering through one shared filter path
5. returns a typed retrieval result with metadata (timing, tier info, chunk count, lineage)

### Changes to existing surfaces

- `intake.contract.ts` — refactor to delegate retrieval to `RetrievalContract` instead of owning mapping/filtering logic
- `knowledge.facade.ts` — refactor `retrieveContext()` to delegate to `RetrievalContract` instead of reimplementing logic
- barrel exports in both packages updated to expose the new contract

### Explicitly not changed

- `RAGPipeline` internals remain untouched
- `IntentPipeline` and `ContextFreezer` remain untouched
- the overall `prepareIntake()` flow remains intact — it just delegates retrieval through the new contract
- existing test assertions should continue to pass

## 6. Consumer Analysis

- the unified retrieval contract provides real caller value: callers can now retrieve governed context without committing to full intake
- `KnowledgeFacade.retrieveContext()` callers get the same result with less internal duplication
- `ControlPlaneIntakeContract.execute()` callers get cleaner internal composition
- the retrieval contract becomes a building block for CP3 (deterministic context packaging)

## 7. Overlap Classification

- conceptual overlap:
  - `HIGH`
  - all selected modules already participate in retrieval-related behavior
- interface overlap:
  - `HIGH`
  - the two current retrieval paths are near-identical in logic but split across two files
- implementation overlap:
  - `MEDIUM`
  - the duplication is real and measurable across 5+ private methods

## 8. Risk Assessment

- structural risk:
  - `LOW-MEDIUM` for additive contract extraction with delegation
  - the new contract extracts existing logic rather than inventing new behavior
- runtime risk:
  - `LOW-MEDIUM`
  - both existing paths should produce identical results after refactor
  - the change is internal composition, not external behavior change
- test / CI risk:
  - `LOW`
  - existing tests should continue passing
  - new contract-level tests should cover the extracted retrieval surface
- rollback risk:
  - `LOW`
  - the unified contract can be reverted by restoring the duplicated inline logic
- scope-creep risk:
  - `MEDIUM`
  - `CP2` must not expand into embedding changes, new vector search behavior, or memory/graph unification

## 9. Verification Plan

- commands:
  - `cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm run check`
  - `cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm run test`
  - `cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm run test:coverage`
  - `cd EXTENSIONS/CVF_PLANE_FACADES && npm run check`
  - `cd EXTENSIONS/CVF_PLANE_FACADES && npm run test`
  - `cd EXTENSIONS/CVF_PLANE_FACADES && npm run test:coverage`
  - `cd EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE && npm run test`
  - `cd EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY && npm run test`
  - `python governance/compat/check_docs_governance_compat.py --enforce`
  - `python governance/compat/check_baseline_update_compat.py --enforce`
  - `python governance/compat/check_release_manifest_consistency.py --enforce`
  - `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
- success criteria:
  - one unified retrieval contract exists in `CVF_CONTROL_PLANE_FOUNDATION`
  - both `ControlPlaneIntakeContract` and `KnowledgeFacade` delegate retrieval to it
  - retrieval duplication across the two files is eliminated
  - retrieval is independently callable through the new contract
  - all existing tests continue passing
  - new retrieval-contract-level tests are added
- evidence artifacts to update:
  - tranche-local implementation delta
  - `docs/CVF_INCREMENTAL_TEST_LOG.md`
  - `docs/roadmaps/CVF_W1_T2_USABLE_INTAKE_SLICE_EXECUTION_PLAN_2026-03-22.md`
  - `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
  - `docs/reviews/CVF_WHITEPAPER_COMPLETION_STATUS_2026-03-21.md`
  - `docs/reference/CVF_MODULE_INVENTORY.md`
  - `docs/INDEX.md`

## 10. Rollback Plan

- rollback unit:
  - `CP2` retrieval contract extraction only
- rollback trigger:
  - unified contract does not produce identical retrieval behavior to the current duplicated paths
  - active-path compatibility regresses
  - scope drifts into RAG internals or new embedding behavior
- rollback commands / steps:
  - revert the unified retrieval contract and restore inline logic in `intake.contract.ts` and `knowledge.facade.ts`
  - preserve source modules in place
- rollback success criteria:
  - callers return to the pre-`CP2` baseline with no cross-module semantic drift

## 11. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - `CP2` should be judged on whether it makes retrieval explicitly usable and eliminates duplication, not on whether it adds new search capabilities
  - the execution decision should reject any framing that expands retrieval beyond what `CVF_ECO_v1.4_RAG_PIPELINE` already provides
  - later packets (`CP3`) must build on the unified retrieval contract for deterministic packaging
