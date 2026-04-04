# CVF W1-T1 CP1 Control-Plane Foundation Audit

> Decision type: `GC-019` structural change audit  
> Tranche: `W1-T1 — Control-Plane Foundation`  
> Date: 2026-03-21

---

## 1. Proposal

- Change ID: `GC019-W1-T1-CP1-CONTROL-PLANE-FOUNDATION-2026-03-21`
- Date: `2026-03-21`
- Proposed target: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`
- Proposed change class:
  - `coordination package`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_W1_T1_CONTROL_PLANE_EXECUTION_PLAN_2026-03-21.md`

## 2. Scope

- Source modules:
  - `EXTENSIONS/CVF_ECO_v1.0_INTENT_VALIDATION`
  - `EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE`
  - `EXTENSIONS/CVF_ECO_v2.1_GOVERNANCE_CANVAS`
  - `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`
  - selected control-oriented surfaces from `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE` are reference-only at this stage
- Affected consumers:
  - control-plane planning and whitepaper evidence chain
  - `EXTENSIONS/CVF_PLANE_FACADES/src/knowledge.facade.ts`
  - docs/reference modules that currently point to these extensions individually
- Active-path impact:
  - `LIMITED`
- Out of scope:
  - physical merge of the source modules
  - direct relocation of `CVF_v1.7_CONTROLLED_INTELLIGENCE`
  - execution-plane or learning-plane code

## 3. Module Profiles

### `CVF_ECO_v1.0_INTENT_VALIDATION`

- language/runtime: TypeScript
- current location: ecosystem extension
- package/build system: standalone package, `vitest`
- tests / coverage: dedicated test suite exists
- entrypoints: `src/intent.pipeline.ts`
- current owners / responsibilities:
  - intent parsing
  - schema mapping
  - constraint generation

### `CVF_ECO_v1.4_RAG_PIPELINE`

- language/runtime: TypeScript
- current location: ecosystem extension
- package/build system: standalone package, `vitest`
- tests / coverage: dedicated test suite exists
- entrypoints: `src/rag.pipeline.ts`
- current owners / responsibilities:
  - document retrieval
  - retriever orchestration
  - knowledge lookup foundation

### `CVF_ECO_v2.1_GOVERNANCE_CANVAS`

- language/runtime: TypeScript
- current location: ecosystem extension
- package/build system: standalone package, `vitest`
- tests / coverage: dedicated test suite exists
- entrypoints: `src/canvas.ts`
- current owners / responsibilities:
  - metrics collection
  - report rendering
  - governance-visualization surfaces

### `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`

- language/runtime: TypeScript
- current location: extension line root
- package/build system: standalone package, `tsc`, `vitest`, coverage
- tests / coverage: strong conformance suite exists
- entrypoints: context freezer, snapshot, replay, workflow coordinator
- current owners / responsibilities:
  - context freezing
  - deterministic packaging
  - replay / audit evidence

### `CVF_v1.7_CONTROLLED_INTELLIGENCE` — selected surfaces only

- language/runtime: TypeScript
- current location: extension line root
- package/build system: standalone package, `tsc`, `vitest`
- tests / coverage: broad test surface exists
- entrypoints: many, including policy/risk/context logic
- current owners / responsibilities:
  - policy / risk logic
  - context segmentation
  - controlled reasoning

Important current-cycle constraint:

- this module has active-path critical references and should not be physically absorbed in the first sub-batch

## 4. Consumer Analysis

- `CVF_ECO_v1.0_INTENT_VALIDATION`
  - mostly documentation-coupled and upstream-referenced by policy/risk docs
  - no strong evidence of active-path compile-time imports outside its own tests
- `CVF_ECO_v1.4_RAG_PIPELINE`
  - already represented in `CVF_PLANE_FACADES` as the intended knowledge delegate
  - current usage is interface-level, not unified package-level
- `CVF_ECO_v2.1_GOVERNANCE_CANVAS`
  - mostly isolated package usage plus documentation/review references
  - no evidence that active-path core runtime depends on its internal files
- `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`
  - stronger runtime significance and large evidence chain
  - should keep lineage intact in early tranche work
- `CVF_v1.7_CONTROLLED_INTELLIGENCE`
  - active-path derivative references exist, including web safety-status mirroring and release/readiness inventory
  - this makes it unsuitable for early physical movement in `CP1`

## 5. Overlap Classification

- conceptual overlap:
  - `HIGH`
  - all four main modules support the whitepaper control-plane narrative
- interface overlap:
  - `MEDIUM`
  - they expose neighboring responsibilities but do not share one stable package surface today
- implementation overlap:
  - `LOW`
  - there is little evidence of duplicated code that would justify physical merge

## 6. Risk Assessment

- structural risk:
  - `LOW-MEDIUM` for coordination package
  - `HIGH` for physical merge
- runtime risk:
  - `LOW` if source modules remain in place and the first package acts as a shell
- test / CI risk:
  - `LOW-MEDIUM`
  - existing module-local tests can be preserved; new package-local smoke tests would be needed
- rollback risk:
  - `LOW`
  - shell package can be reverted independently if no physical move happens
- release / readiness risk:
  - `LOW`
  - provided current frozen invariants and active-path compatibility are preserved

## 7. Recommendation

- recommended change class:
  - `coordination package`
- why this class is better than the alternatives:
  - creates one evidence-backed control-plane package surface without forcing premature source consolidation
  - preserves lineage for modules with mature tests and active-path relevance
  - allows `CVF_v1.7_CONTROLLED_INTELLIGENCE` to remain reference-only in the first sub-batch
- why preserving lineage is preferable:
  - implementation overlap is weak
  - consumer coupling is asymmetric
  - physical move would create avoidable rollback and readiness risk

## 8. Verification Plan

- commands:
  - `cd EXTENSIONS/CVF_ECO_v1.0_INTENT_VALIDATION && npm run test`
  - `cd EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE && npm run test`
  - `cd EXTENSIONS/CVF_ECO_v2.1_GOVERNANCE_CANVAS && npm run test`
  - `cd EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY && npm run check`
  - `cd EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE && npm run test`
  - package-local smoke tests for `CVF_CONTROL_PLANE_FOUNDATION` once created
- success criteria:
  - source module tests remain green
  - new coordination package exposes stable entrypoints for intent / knowledge / context / reporting
  - no active-path runtime import is broken
- evidence artifacts to update:
  - tranche-local implementation delta
  - `docs/CVF_INCREMENTAL_TEST_LOG.md`
  - `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
  - `docs/reviews/CVF_WHITEPAPER_COMPLETION_STATUS_2026-03-21.md` when tranche evidence is strong enough

## 9. Rollback Plan

- rollback unit:
  - `CP1` shell package only
- rollback trigger:
  - source module tests regress
  - active-path compatibility is broken
  - tranche scope starts drifting into physical merge pressure
- rollback commands / steps:
  - revert the `CVF_CONTROL_PLANE_FOUNDATION` package creation and related docs
  - keep source modules unchanged
- rollback success criteria:
  - original module inventory and test posture are restored with no lingering import changes

## 10. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - `CP1` should be treated as a shell package, not a source-consolidation move
  - selected `CVF_v1.7_CONTROLLED_INTELLIGENCE` surfaces should remain outside the initial package body
