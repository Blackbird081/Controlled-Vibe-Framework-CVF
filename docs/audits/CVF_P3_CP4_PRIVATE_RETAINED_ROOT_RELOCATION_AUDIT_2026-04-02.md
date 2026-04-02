# CVF P3 CP4 Private Retained Root Relocation Audit

Memory class: FULL_RECORD

> Decision type: `GC-019` structural change audit
> Pre-public phase: `P3`
> Date: `2026-04-02`

---

## 1. Proposal

- Change ID: `GC019-P3-CP4-PRIVATE-RETAINED-ROOT-RELOCATION-2026-04-02`
- Proposed target:
  - relocate `CVF_SKILL_LIBRARY/` to `ECOSYSTEM/reference-roots/CVF_SKILL_LIBRARY/`
  - relocate `ui_governance_engine/` to `ECOSYSTEM/reference-roots/ui_governance_engine/`
- Proposed change class:
  - `physical merge`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`

## 2. Scope

- source modules:
  - `CVF_SKILL_LIBRARY/`
  - `ui_governance_engine/`
- affected consumers:
  - visible-root repository navigation
  - pre-public lifecycle/exposure classification canon
  - a small number of historical or integration docs that still mention the old root paths
- active-path impact:
  - `LOW`
- out of scope:
  - `ECOSYSTEM/strategy/`
  - `v1.0/`
  - `v1.1/`
  - any public packaging decision

## 3. Module Profiles

### `CVF_SKILL_LIBRARY/`

- current payload:
  - one README placeholder file
- active ownership:
  - superseded by:
    - `governance/skill-library/`
    - `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/`
- runtime/package entrypoints:
  - none
- rationale:
  - visible-root placeholder adds noise but no active capability

### `ui_governance_engine/`

- current payload:
  - small retained JSON/TREEVIEW payload
- active ownership:
  - no active visible-root ownership required
- runtime/package entrypoints:
  - none detected in active-path imports
- rationale:
  - should be preserved as internal lineage, but no longer deserves visible-root status

## 4. Consumer Analysis

- dependency footprint summary:
  - `CVF_SKILL_LIBRARY`: low; mainly historical/integration doc mentions
  - `ui_governance_engine`: low; mainly historical assessment mentions
- active runtime dependency:
  - none detected
- documentation dependency:
  - present but small enough to rewrite in the same batch

## 5. Overlap Classification

- conceptual overlap:
  - `HIGH`
  - both roots are already conceptually absorbed by other canonical surfaces
- interface overlap:
  - `NONE`
- implementation overlap:
  - `LOW`

## 6. Risk Assessment

- structural risk:
  - `LOW`
- runtime risk:
  - `LOW`
- docs/registry drift risk:
  - `LOW-MEDIUM`
  - only if lifecycle/exposure docs and allowed-root guard are not updated together
- rollback risk:
  - `LOW`
  - payload remains in repo under `ECOSYSTEM/reference-roots/`

## 7. Recommendation

- recommendation:
  - `APPROVE FOR SMALL-BOUNDED RELOCATION`
- why:
  - this change reduces visible-root clutter
  - preserves lineage inside an internal retained subtree
  - does not conflate cleanup with public-release authorization

## 8. Verification Plan

- commands:
  - `python governance/compat/check_repository_lifecycle_classification.py --enforce`
  - `python governance/compat/check_repository_exposure_classification.py --enforce`
  - `python governance/compat/check_prepublic_p3_readiness.py --enforce`
  - `python governance/compat/check_docs_governance_compat.py --base HEAD --head HEAD --enforce`
  - `python governance/compat/check_agent_handoff_guard_compat.py --base HEAD --head HEAD --enforce`
  - `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## 9. Rollback Plan

- rollback unit:
  - `P3/CP4` retained-root relocation batch
- rollback action:
  - restore the two roots to the visible repository root
  - revert canon/registry/doc updates in the same commit range

## 10. Execution Posture

- audit decision:
  - `AUDIT READY`
- notes:
  - this batch is intentionally small and does not widen the next move horizon for `v1.0/`, `v1.1/`, or `ECOSYSTEM/`
