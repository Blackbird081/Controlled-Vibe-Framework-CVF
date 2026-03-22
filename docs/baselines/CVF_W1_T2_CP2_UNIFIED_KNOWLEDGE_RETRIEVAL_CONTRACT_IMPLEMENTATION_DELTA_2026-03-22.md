# CVF W1-T2 CP2 Unified Knowledge Retrieval Contract Implementation Delta

> Date: `2026-03-22`  
> Scope: implement `CP2` inside `W1-T2 - Usable Intake Slice`  
> Authorization chain:
> - `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_T2_2026-03-22.md`
> - `docs/audits/CVF_W1_T2_CP2_UNIFIED_KNOWLEDGE_RETRIEVAL_CONTRACT_AUDIT_2026-03-22.md`
> - `docs/reviews/CVF_GC019_W1_T2_CP2_UNIFIED_KNOWLEDGE_RETRIEVAL_CONTRACT_REVIEW_2026-03-22.md`

---

## 1. Outcome

`CP2` has been implemented in the approved form:

- change class: `additive contract alignment`
- target surfaces:
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`
  - `EXTENSIONS/CVF_PLANE_FACADES/`
- physical consolidation: `NO`

The control-plane foundation now provides one unified retrieval contract that:

- eliminates retrieval duplication between `intake.contract.ts` and `knowledge.facade.ts`
- makes retrieval independently callable through a governed contract
- serves as the shared retrieval path for both `ControlPlaneIntakeContract.execute()` and `KnowledgeFacade.retrieveContext()`

## 2. Files Updated

Implementation:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/retrieval.contract.ts` (NEW)
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/intake.contract.ts` (REFACTORED — delegates retrieval to unified contract)
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` (UPDATED — new barrel exports)
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/index.test.ts` (UPDATED — 15 new CP2 tests)
- `EXTENSIONS/CVF_PLANE_FACADES/src/knowledge.facade.ts` (REFACTORED — delegates retrieval to unified contract, removed 5 duplicated methods)

Docs and status updates:

- `docs/audits/CVF_W1_T2_CP2_UNIFIED_KNOWLEDGE_RETRIEVAL_CONTRACT_AUDIT_2026-03-22.md`
- `docs/reviews/CVF_GC019_W1_T2_CP2_UNIFIED_KNOWLEDGE_RETRIEVAL_CONTRACT_REVIEW_2026-03-22.md`
- `docs/baselines/CVF_W1_T2_CP2_UNIFIED_KNOWLEDGE_RETRIEVAL_CONTRACT_IMPLEMENTATION_DELTA_2026-03-22.md`
- `docs/roadmaps/CVF_W1_T2_USABLE_INTAKE_SLICE_EXECUTION_PLAN_2026-03-22.md`
- `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
- `docs/reviews/CVF_WHITEPAPER_COMPLETION_STATUS_2026-03-21.md`
- `docs/reference/CVF_MODULE_INVENTORY.md`
- `docs/reference/CVF_RELEASE_MANIFEST.md`
- `docs/reference/CVF_MATURITY_MATRIX.md`
- `docs/INDEX.md`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`

## 3. Behavioral Readout

The new unified retrieval contract behaves as follows:

- `RetrievalContract.retrieve()` accepts a typed `RetrievalRequest` with query + options (maxChunks, minRelevance, sources, filters)
- delegates to `RAGPipeline.query()` for the actual search
- maps `RAGDocument[]` → `RetrievalChunk[]` through one shared `mapDocument()` function
- applies post-retrieval filtering through one shared `matchesFilters()` function
- returns a typed `RetrievalResultSurface` with query, chunkCount, totalCandidates, retrievalTimeMs, tiersSearched, and chunks

Delegation changes:

- `ControlPlaneIntakeContract.execute()` now creates a `RetrievalContract` internally and delegates retrieval to it instead of using inline mapping/filtering logic
- `KnowledgeFacade.retrieveContext()` now creates a `RetrievalContract` via `createRetrievalContract()` instead of reimplementing mapping/filtering logic
- both paths produce identical retrieval behavior to the pre-CP2 baseline

Duplication eliminated:

- `resolveSource()` — extracted to shared function in `retrieval.contract.ts`
- `matchesFilters()` — extracted to shared function in `retrieval.contract.ts`
- `readStringFilter()` — extracted to shared function in `retrieval.contract.ts`
- `readStringList()` — extracted to shared function in `retrieval.contract.ts`
- document-to-chunk mapping — extracted to shared `mapDocument()` in `retrieval.contract.ts`

## 4. Explicit Boundary

This batch does **not** claim:

- full `AI Gateway` realization
- unified `Knowledge Layer` convergence beyond the bounded retrieval contract
- new embedding or vector-search behavior
- memory/graph unification
- downstream consumer proof for tranche closure

Those remain later `W1-T2` control points.

## 5. Verification

Package-local verification:

- `cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm run check` -> PASS
- `cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm run test` -> PASS (23 tests, 15 new)
- `cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm run test:coverage` -> PASS
- `cd EXTENSIONS/CVF_PLANE_FACADES && npm run check` -> PASS
- `cd EXTENSIONS/CVF_PLANE_FACADES && npm run test` -> PASS (8 tests)
- `cd EXTENSIONS/CVF_PLANE_FACADES && npm run test:coverage` -> PASS

Coverage:

- `CVF_CONTROL_PLANE_FOUNDATION`
  - statements: `97.66%`
  - branches: `86.27%`
  - functions: `92.85%`
  - lines: `97.66%`
- `CVF_PLANE_FACADES`
  - statements: `98.11%`
  - branches: `78.12%`
  - functions: `94.44%`
  - lines: `98.11%`

Source-line regression:

- `cd EXTENSIONS/CVF_ECO_v1.0_INTENT_VALIDATION && npm run test` -> PASS (41 tests)
- `cd EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE && npm run test` -> PASS (34 tests)
- `cd EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY && npm run test` -> PASS (94 tests)

Governance/doc gates:

- `python governance/compat/check_docs_governance_compat.py --enforce` -> PASS
- `python governance/compat/check_baseline_update_compat.py --enforce` -> PASS
- `python governance/compat/check_release_manifest_consistency.py --enforce` -> PASS

## 6. Notes

- the unified retrieval contract eliminates real duplication across 5+ private methods that were independently maintained in two files
- source lineage remains preserved; this batch extracts shared logic, not physical merge
- retrieval is now independently callable, which is a genuine new consumer capability
- later `W1-T2` packets still need to strengthen deterministic packaging semantics and prove one real downstream consumer path before the tranche can close
