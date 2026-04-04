# CVF W2-T1 CP2 MCP And Gateway Wrapper Alignment Audit

> Decision type: `GC-019` structural change audit  
> Tranche: `W2-T1 — Execution-Plane Foundation`  
> Date: 2026-03-22

---

## 1. Proposal

- Change ID: `GC019-W2-T1-CP2-MCP-GATEWAY-WRAPPER-ALIGNMENT-2026-03-22`
- Date: `2026-03-22`
- Proposed target:
  - `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION`
  - aligned to:
    - `EXTENSIONS/CVF_MODEL_GATEWAY`
    - `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/sdk.ts`
- Proposed change class:
  - `wrapper/re-export alignment`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_W2_T1_EXECUTION_PLANE_EXECUTION_PLAN_2026-03-22.md`

## 2. Scope

- Source modules:
  - `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION`
  - `EXTENSIONS/CVF_MODEL_GATEWAY`
  - `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER`
- Affected consumers:
  - `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/index.ts`
  - `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/index.test.ts`
  - `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/README.md`
  - future execution-plane consumers expected to import from the `CP1` shell rather than raw source barrels
- Active-path impact:
  - `LIMITED`
- Out of scope:
  - physical movement of any source modules
  - changes inside `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/guards`
  - changes inside `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/cli`
  - changes inside `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts`
  - adapter evidence / explainability integration (`CP3`)
  - selected execution authorization boundary alignment (`CP4`)
  - behavior changes inside gateway adapters, guard evaluation, or CLI runtime flow

## 3. Module Profiles

### `CVF_EXECUTION_PLANE_FOUNDATION`

- language/runtime: TypeScript
- current location: extension line root
- package/build system: standalone package, `tsc`, `vitest`, coverage
- tests / coverage: dedicated package-local suite exists
- entrypoints:
  - `src/index.ts`
- current owners / responsibilities:
  - tranche-local execution-plane coordination shell created by `CP1`
  - reviewable shell summary and prompt preview surface
  - additive re-export point for gateway, MCP-runtime, registry, memory, and explainability helpers

Important current observation:

- `CP1` successfully created the shell, but the wrapper boundary for gateway-facing vs MCP-facing imports is still implicit because the shell currently re-exports broad source barrels directly

### `CVF_MODEL_GATEWAY`

- language/runtime: TypeScript
- current location: extension line root
- package/build system: standalone package, `tsc`, `vitest`
- tests / coverage: dedicated package-local suite exists
- entrypoints:
  - `src/index.ts`
- current owners / responsibilities:
  - canonical gateway-facing wrapper anchor
  - runtime adapter, policy parser, release evidence, and external-skill bridge exports
  - preserved wrapper surface from the current-cycle restructuring baseline

### `CVF_ECO_v2.5_MCP_SERVER`

- language/runtime: TypeScript / Node
- current location: ecosystem extension
- package/build system: standalone package, `tsup`, `vitest`
- tests / coverage: strong package-local suite exists
- entrypoints relevant to this packet:
  - `src/sdk.ts`
- current owners / responsibilities:
  - canonical MCP runtime barrel for guard engine, registry, prompt generation, memory, vibe parsing, and confirmation helpers
  - active-path runtime significance remains high in the source package

## 4. Consumer Analysis

- `CVF_EXECUTION_PLANE_FOUNDATION`
  - current consumers are package-local tests, roadmap/status artifacts, and future shell importers
  - the shell is intended to become the reviewable execution-plane import surface introduced by `CP1`
- contract pressure
  - `CP1` promised one stable execution-plane shell, but the shell still exposes MCP and gateway surfaces mainly through direct broad re-exports
  - this creates a contract-clarity gap: future consumers can see the surface, but the intended wrapper boundary is not yet explicit
- primary risk
  - the main `CP2` risk is contract ambiguity and future import drift, not instability in gateway adapters or MCP runtime algorithms
- active-path criticality
  - runtime impact should stay bounded if `CP2` remains additive and backward compatible for current `CP1` imports

## 5. Overlap Classification

- conceptual overlap:
  - `HIGH`
  - the shell, the gateway wrapper, and the MCP SDK all represent adjacent execution-plane boundaries in the whitepaper narrative
- interface overlap:
  - `HIGH`
  - `CVF_EXECUTION_PLANE_FOUNDATION` currently overlaps source-barrel import semantics without yet making the intended gateway/MCP wrapper boundary explicit
- implementation overlap:
  - `LOW`
  - canonical runtime logic still lives in `CVF_MODEL_GATEWAY` and `CVF_ECO_v2.5_MCP_SERVER`

## 6. Risk Assessment

- structural risk:
  - `LOW`
  - if treated strictly as wrapper/re-export alignment
- runtime risk:
  - `LOW-MEDIUM`
  - import shapes may drift if wrapper boundaries are tightened without preserving current additive access
- test / CI risk:
  - `LOW-MEDIUM`
  - package-local shell tests plus source-package regression checks should remain green
- rollback risk:
  - `LOW`
  - rollback can be limited to `CVF_EXECUTION_PLANE_FOUNDATION`
- release / readiness risk:
  - `LOW`
  - provided the packet does not widen into `CP3` evidence integration or `CP4` authorization-boundary work

## 7. Recommendation

- recommended change class:
  - `wrapper/re-export alignment`
- why this class is better than the alternatives:
  - it makes the post-`CP1` execution-shell contract explicit without forcing ownership or source-module consolidation
  - it keeps `CVF_MODEL_GATEWAY` as the gateway-facing wrapper anchor while making MCP bridge entrypoints more deliberate
  - it resolves the clearest post-`CP1` contract gap before broader evidence or authorization work
- why preserving lineage is preferable:
  - the source packages already hold the canonical implementation and test history
  - `CP1` was explicitly approved as a lineage-preserving shell
  - the active-path MCP runtime is still too sensitive for premature relocation

## 8. Verification Plan

- commands:
  - `cd EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION && npm run check`
  - `cd EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION && npm run test`
  - `cd EXTENSIONS/CVF_MODEL_GATEWAY && npm run check`
  - `cd EXTENSIONS/CVF_MODEL_GATEWAY && npm run test`
  - `cd EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER && npm run test:run`
  - `python governance/compat/check_docs_governance_compat.py --enforce`
- success criteria:
  - the shell exposes explicit MCP and gateway wrapper entrypoints consistent with the execution-shell contract
  - `CVF_MODEL_GATEWAY` remains the canonical gateway-facing wrapper anchor
  - no MCP guard-runtime or CLI internals are physically moved into the shell package body
  - the change stays additive or backward compatible for current `CP1` consumers
  - `CP3` and `CP4` scope remains deferred
- evidence artifacts to update:
  - tranche-local packet delta
  - `docs/roadmaps/CVF_W2_T1_EXECUTION_PLANE_EXECUTION_PLAN_2026-03-22.md`
  - `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
  - implementation delta only if execution is explicitly approved

## 9. Rollback Plan

- rollback unit:
  - `CP2` wrapper-alignment changes only
- rollback trigger:
  - current `CP1` shell imports break
  - source-package regression checks fail
  - the work starts absorbing `CP3` evidence integration or `CP4` authorization-boundary scope
- rollback commands / steps:
  - revert the `CVF_EXECUTION_PLANE_FOUNDATION` wrapper-alignment changes and related docs
  - keep `CVF_MODEL_GATEWAY`, `CVF_ECO_v2.5_MCP_SERVER`, and the `CP1` shell baseline intact otherwise
- rollback success criteria:
  - the repository returns to the post-`CP1` execution-shell posture
  - source-module lineage and active-path runtime baselines remain unchanged

## 10. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - `CP2` should remain a contract-clarity wrapper step, not a deeper execution-runtime refactor
  - the packet should make wrapper intent explicit, not broaden MCP runtime ownership
  - adapter evidence and explainability expansion belongs to `CP3`, not this packet
