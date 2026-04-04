# CVF W1-T1 CP4 Selected Controlled-Intelligence Surface Alignment Audit

> Decision type: `GC-019` structural change audit  
> Tranche: `W1-T1 — Control-Plane Foundation`  
> Date: 2026-03-22

---

## 1. Proposal

- Change ID: `GC019-W1-T1-CP4-SELECTED-CONTROLLED-INTELLIGENCE-SURFACE-ALIGNMENT-2026-03-22`
- Date: `2026-03-22`
- Proposed target:
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`
  - selected reference-only surfaces from `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE`
- Proposed change class:
  - `wrapper/re-export`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_W1_T1_CONTROL_PLANE_EXECUTION_PLAN_2026-03-21.md`

## 2. Scope

- Source modules:
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`
  - `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE`
- Candidate surfaces for packet review:
  - policy/risk mapping references:
    - `core/governance/risk.mapping.ts`
    - `core/governance/risk.labels.ts`
    - `integration/risk.bridge.ts`
  - context segmentation interfaces and helpers:
    - `intelligence/context_segmentation/context.segmenter.ts`
    - `intelligence/context_segmentation/context.types.ts`
    - `intelligence/context_segmentation/memory.boundary.ts`
  - reasoning-boundary surfaces:
    - `intelligence/reasoning_gate/reasoning.types.ts`
    - `intelligence/determinism_control/reasoning.mode.ts`
- Affected consumers:
  - tranche-local control-plane shell readers who now need a narrower bridge to selected `v1.7` surfaces after `CP1-CP3`
  - future whitepaper truth-reconciliation readers who need explicit evidence of what parts of controlled intelligence are aligned vs still intentionally outside the shell
  - package-local tests and status artifacts if execution is later approved
- Active-path impact:
  - `LOW` if limited to wrapper/re-export of stable helper/type surfaces
- Out of scope:
  - physical movement of any `CVF_v1.7_CONTROLLED_INTELLIGENCE` files
  - direct absorption of runtime-critical reasoning logic such as:
    - `intelligence/reasoning_gate/controlled.reasoning.ts`
    - role-transition recursion enforcement
    - verification-policy execution internals
  - tranche closure and defer decisions beyond `CP4`

## 3. Module Profiles

### `CVF_CONTROL_PLANE_FOUNDATION`

- language/runtime: TypeScript
- current location: extension line root
- package/build system: standalone package, `tsc`, `vitest`
- tests / coverage: dedicated package-local suite exists
- current owners / responsibilities:
  - lineage-preserving control-plane shell
  - stable shell surface for intent, knowledge, reporting, deterministic context freeze, and tranche-local evidence surfacing

Current post-`CP3` observation:

- the shell now covers intent, knowledge, reporting, and deterministic packaging clearly, but still treats selected controlled-intelligence surfaces as reference-only with no narrowed wrapper story

### `CVF_v1.7_CONTROLLED_INTELLIGENCE`

- language/runtime: TypeScript
- current location: extension line root
- package/build system: standalone package, `tsc`, `vitest`
- tests / coverage: dedicated test suite exists
- current owners / responsibilities:
  - intelligence controls
  - risk/governance mapping
  - reasoning boundaries
  - context segmentation and transition safety

Current observation:

- the package is broad and active-path sensitive
- only a subset of its interfaces/helpers appear appropriate for tranche-local control-plane alignment
- runtime-critical reasoning execution remains too coupled for a safe first wrapper step

## 4. Consumer Analysis

- current tranche readers
  - after `CP3`, they can review the shell and reporting evidence, but they still do not have one explicit statement of which `v1.7` surfaces belong to the control-plane narrative and which remain outside it
- `CVF_CONTROL_PLANE_FOUNDATION`
  - can safely carry a narrower wrapper layer if the scope is limited to stable references, types, and low-risk helpers
- `CVF_v1.7_CONTROLLED_INTELLIGENCE`
  - should remain canonical for implementation ownership
  - appears too broad for package-body absorption inside `W1-T1`
- active-path criticality
  - medium-to-high for deeper runtime logic
  - low for selected mapping/types/helpers if no behavior rewrite is introduced

## 5. Overlap Classification

- conceptual overlap:
  - `MEDIUM-HIGH`
  - the whitepaper control-plane narrative overlaps with selected `v1.7` surfaces around risk, context boundaries, and reasoning shape
- interface overlap:
  - `MEDIUM`
  - selected interfaces/helpers can plausibly sit behind a shell wrapper without claiming full runtime convergence
- implementation overlap:
  - `LOW`
  - the value is boundary clarification, not duplicate-code removal

## 6. Risk Assessment

- structural risk:
  - `LOW-MEDIUM`
  - safe only if kept to wrapper/re-export scope
- runtime risk:
  - `MEDIUM`
  - rises quickly if `controlled.reasoning.ts` or transition enforcement logic is pulled into the packet body
- test / CI risk:
  - `LOW-MEDIUM`
  - manageable if package-local wrapper tests and source-module regression checks remain explicit
- rollback risk:
  - `LOW`
  - wrapper-only alignment should be independently reversible
- release / readiness risk:
  - `LOW`
  - provided the packet does not over-claim whitepaper completion of the broader intelligence line

## 7. Recommendation

- recommended change class:
  - `wrapper/re-export`
- recommended execution posture:
  - open `CP4` for a narrow wrapper path only
  - explicitly allow likely wrapper candidates:
    - `risk.mapping`
    - `risk.labels`
    - `risk.bridge`
    - context-segmentation interfaces/helpers
    - reasoning-boundary types and mode resolution helpers
  - explicitly keep deeper runtime logic outside the packet:
    - `controlled.reasoning.ts`
    - recursion/role-transition enforcement internals
    - verification-engine execution internals
- why this class is preferable:
  - it gives the control-plane shell a truthful bridge to the highest-value `v1.7` surfaces without reopening merge pressure
  - it preserves active-path safety and rollback clarity
  - it creates a cleaner evidence story for later whitepaper reconciliation

## 8. Verification Plan

- commands for packet-opening batch:
  - `python governance/compat/check_docs_governance_compat.py --enforce`
  - `python governance/compat/check_baseline_update_compat.py --enforce`
  - `python governance/compat/check_release_manifest_consistency.py --enforce`
  - `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
- success criteria:
  - `CP4` becomes reviewable as a narrow wrapper/re-export candidate
  - documentation makes the allowed vs deferred `v1.7` surfaces explicit
  - no runtime/code movement occurs in this packet-opening batch
- evidence artifacts to update:
  - tranche-local packet delta
  - roadmap/status/index/test-log chain
  - implementation delta only if execution is later approved

## 9. Rollback Plan

- rollback unit:
  - `CP4` packet-opening docs only
- rollback trigger:
  - packet wording starts implying a physical move or broader runtime merge
  - selected-surface boundary becomes too vague to review safely
- rollback steps:
  - revert the `CP4` audit/review/delta/status docs
  - keep `CP1-CP3` artifacts unchanged
- rollback success criteria:
  - tranche returns to the post-`CP3` baseline with no open `CP4` packet chain

## 10. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - `CP4` should stay strictly narrower than a `v1.7` merge
  - README ownership banners are not mandatory in this packet-opening step because no source ownership move is proposed
  - any wider closure/defer readout remains a later `CP5` responsibility
