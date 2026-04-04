# CVF W1-T1 CP2 Knowledge And Context Wrapper Alignment Audit

> Decision type: `GC-019` structural change audit  
> Tranche: `W1-T1 — Control-Plane Foundation`  
> Date: 2026-03-21

---

## 1. Proposal

- Change ID: `GC019-W1-T1-CP2-KNOWLEDGE-CONTEXT-WRAPPER-ALIGNMENT-2026-03-21`
- Date: `2026-03-21`
- Proposed target:
  - `EXTENSIONS/CVF_PLANE_FACADES`
  - aligned to `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`
- Proposed change class:
  - `wrapper/re-export merge`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_W1_T1_CONTROL_PLANE_EXECUTION_PLAN_2026-03-21.md`

## 2. Scope

- Source modules:
  - `EXTENSIONS/CVF_PLANE_FACADES`
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`
  - canonical delegates in:
    - `EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE`
    - `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`
- Affected consumers:
  - `docs/roadmaps/CVF_PHASE_1_CONTRACT_BOUNDARY_CONVERGENCE.md`
  - `EXTENSIONS/CVF_PLANE_FACADES/src/index.ts`
  - `EXTENSIONS/CVF_PLANE_FACADES/src/index.test.ts`
  - future control-plane consumers that are expected to use plane-level facade entrypoints
- Active-path impact:
  - `LIMITED`
- Out of scope:
  - physical movement of any source modules
  - changes to `GovernanceFacade`, `ExecutionFacade`, or `LearningFacade`
  - governance-canvas reporting integration (`CP3`)
  - selected `CVF_v1.7_CONTROLLED_INTELLIGENCE` surface alignment (`CP4`)
  - internal algorithm changes inside `RAGPipeline` or `ContextFreezer`

## 3. Module Profiles

### `CVF_PLANE_FACADES`

- language/runtime: TypeScript
- current location: extension line root
- package/build system: standalone package, `tsc`, `vitest`
- tests / coverage: dedicated package-local suite exists
- entrypoints:
  - `src/knowledge.facade.ts`
  - `src/index.ts`
- current owners / responsibilities:
  - canonical plane-level facade contract
  - public `KnowledgeFacade` signatures for retrieval, context packaging, and privacy filtering
  - additive wrapper layer over lower control-plane modules

Important current-cycle observation:

- the current knowledge facade is still a stub-style implementation and does not yet align explicitly to the `CP1` control-plane shell

### `CVF_CONTROL_PLANE_FOUNDATION`

- language/runtime: TypeScript
- current location: extension line root
- package/build system: standalone package, `tsc`, `vitest`
- tests / coverage: dedicated package-local suite exists
- entrypoints:
  - `src/index.ts`
- current owners / responsibilities:
  - control-plane coordination shell created by `CP1`
  - stable shell surface for intent, knowledge, reporting, and deterministic context freezing
  - lineage-preserving re-export point for canonical control-plane delegates

### `CVF_ECO_v1.4_RAG_PIPELINE`

- language/runtime: TypeScript
- current location: ecosystem extension
- package/build system: standalone package, `vitest`
- tests / coverage: dedicated test suite exists
- entrypoints:
  - `src/rag.pipeline.ts`
- current owners / responsibilities:
  - document retrieval
  - retrieval orchestration
  - canonical knowledge lookup primitive for this tranche

### `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`

- language/runtime: TypeScript
- current location: extension line root
- package/build system: standalone package, `tsc`, `vitest`, coverage
- tests / coverage: strong conformance suite exists
- entrypoints:
  - `core/context.freezer.ts`
  - hash helpers and workflow-level reproducibility surfaces
- current owners / responsibilities:
  - deterministic context freeze
  - snapshot hashing
  - drift / replay evidence

## 4. Consumer Analysis

- `CVF_PLANE_FACADES`
  - the strongest current consumers are package-local tests and roadmap/spec references
  - coupling is mostly compile-time within the package and documentation-level outside it
  - there is little evidence of active-path critical runtime imports depending on the current stub behavior
- `CVF_CONTROL_PLANE_FOUNDATION`
  - current consumers are tranche-local tests, roadmap references, and module-inventory/status artifacts
  - coupling is currently low, but it is the intended concrete shell introduced by `CP1`
- contract pressure
  - `docs/roadmaps/CVF_PHASE_1_CONTRACT_BOUNDARY_CONVERGENCE.md` already defines `KnowledgeFacade` as the single control-plane entrypoint for retrieval and context packaging
  - this means the main `CP2` risk is contract drift between the facade contract and the newly created `CP1` shell, not source-module instability
- active-path criticality
  - evidence still suggests this is a bounded alignment step, not an active-path structural hazard, provided the facade signatures remain stable

## 5. Overlap Classification

- conceptual overlap:
  - `HIGH`
  - both `CVF_PLANE_FACADES` and `CVF_CONTROL_PLANE_FOUNDATION` are now trying to represent the same knowledge/context boundary in the whitepaper control-plane story
- interface overlap:
  - `HIGH`
  - the plane facade defines the public contract while the `CP1` shell now exposes concrete delegate surfaces for the same responsibility family
- implementation overlap:
  - `LOW-MEDIUM`
  - the current facade includes placeholder retrieval and local packaging logic, but the canonical runtime primitives still live in the source modules preserved by `CP1`

## 6. Risk Assessment

- structural risk:
  - `LOW`
  - if treated strictly as wrapper alignment
- runtime risk:
  - `LOW-MEDIUM`
  - public wrapper behavior may change if delegation is tightened without preserving the established facade signatures
- test / CI risk:
  - `LOW-MEDIUM`
  - both package-local suites and source-module regression checks should stay green
- rollback risk:
  - `LOW`
  - rollback can be limited to the facade-alignment layer if no physical moves occur
- release / readiness risk:
  - `LOW`
  - provided the alignment remains additive and does not silently widen tranche scope into `CP3` or `CP4`

## 7. Recommendation

- recommended change class:
  - `wrapper/re-export merge`
- why this class is better than the alternatives:
  - it aligns the public knowledge/context contract to the concrete `CP1` shell without forcing any physical module consolidation
  - it simplifies the tranche story: `CP1` provides the shell, `CP2` makes the shell explicit at the plane-facade boundary
  - it keeps the change bounded to entrypoint semantics rather than algorithm or ownership changes
- why preserving lineage is preferable:
  - the canonical retrieval and reproducibility implementations are already stable where they are
  - `CP1` was explicitly approved as a lineage-preserving shell
  - there is still no strong evidence that physical consolidation would provide enough gain to justify the rollback and ownership cost

## 8. Verification Plan

- commands:
  - `cd EXTENSIONS/CVF_PLANE_FACADES && npm run check`
  - `cd EXTENSIONS/CVF_PLANE_FACADES && npm run test`
  - `cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm run check`
  - `cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm run test`
  - `cd EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE && npm run test`
  - `cd EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY && npm run check`
  - `python governance/compat/check_docs_governance_compat.py --enforce`
- success criteria:
  - `KnowledgeFacade` signatures remain consistent with the Phase 1 contract
  - the aligned wrapper clearly delegates knowledge/context responsibility toward the `CP1` shell or its preserved canonical delegates
  - no active-path import boundary or source-module lineage is broken
  - the alignment does not silently absorb governance-canvas reporting or controlled-intelligence scope
- evidence artifacts to update:
  - tranche-local packet delta
  - `docs/roadmaps/CVF_W1_T1_CONTROL_PLANE_EXECUTION_PLAN_2026-03-21.md`
  - `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
  - implementation delta only if execution is explicitly approved

## 9. Rollback Plan

- rollback unit:
  - `CP2` facade-alignment changes only
- rollback trigger:
  - facade signature drift breaks the expected contract
  - package-local or source-module verification regresses
  - the work starts absorbing `CP3` reporting or `CP4` controlled-intelligence scope
- rollback commands / steps:
  - revert the `CVF_PLANE_FACADES` knowledge/context alignment changes and related docs
  - keep `CVF_CONTROL_PLANE_FOUNDATION` and the source modules unchanged
- rollback success criteria:
  - `CVF_PLANE_FACADES` returns to the pre-`CP2` additive posture
  - `CP1` shell remains intact and independently valid

## 10. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - `CP2` should remain a public-surface alignment step, not a deeper control-plane refactor
  - `filterPII` may remain facade-owned unless a separate packet later establishes a more canonical control-plane home
  - governance-canvas integration belongs to `CP3`, not this packet
