# CVF P3 CP2 Retained Internal Root Relocation Audit

Memory class: FULL_RECORD

> Decision type: `GC-019` structural change audit
> Pre-public phase: `P3`
> Date: `2026-04-02`

---

## 1. Proposal

- Change ID: `GC019-P3-CP2-RETAINED-INTERNAL-ROOT-RELOCATION-2026-04-02`
- Date: `2026-04-02`
- Proposed target:
  - relocate `CVF_SKILL_LIBRARY/` and `ui_governance_engine/` out of the visible repository root
  - preserve both roots under a dedicated retained/internal container:
    - `ECOSYSTEM/reference-roots/retained-internal/CVF_SKILL_LIBRARY/`
    - `ECOSYSTEM/reference-roots/retained-internal/ui_governance_engine/`
- Proposed change class:
  - `physical merge`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`

## 2. Scope

- Source modules:
  - `CVF_SKILL_LIBRARY/`
  - `ui_governance_engine/`
- Affected consumers:
  - root-level repository navigation
  - pre-public lifecycle / exposure classification
  - retained internal lineage paths for non-canonical payloads
- Active-path impact:
  - `NONE` for runtime and package execution
  - `LOW-MEDIUM` for documentation / path continuity
- Out of scope:
  - `v1.0/`
  - `v1.1/`
  - `REVIEW/`
  - `docs/`, `EXTENSIONS/`, `governance/`, `public/`
  - publication model lock-in

## 3. Module Profiles

### `CVF_SKILL_LIBRARY/`

- language/runtime:
  - markdown-only root stub
- current location:
  - repository root
- package/build system:
  - none
- tests / coverage:
  - none
- entrypoints:
  - `README.md` only
- current owners / responsibilities:
  - retained lineage marker for the skill-governance family
  - canonical skill-governance implementation already lives under `governance/skill-library/`
- filesystem evidence:
  - `1` file
  - `0.4 KB`

### `ui_governance_engine/`

- language/runtime:
  - JSON + markdown retained design/policy payload
- current location:
  - repository root
- package/build system:
  - none
- tests / coverage:
  - none
- entrypoints:
  - `TREEVIEW.md`
  - retained policy/design data only
- current owners / responsibilities:
  - historical UI governance design reference
  - not an active runtime package or app root
- filesystem evidence:
  - `9` files
  - `2.0 KB`

## 4. Consumer Analysis

- who imports or calls each module:
  - no compile-time imports
  - no runtime calls
  - remaining consumers are docs, compatibility registries, and historical assessments
- whether coupling is compile-time, runtime, or documentation-only:
  - `documentation-only`
- whether consumers are active-path critical:
  - no runtime-critical consumers found
  - active references are sparse and concentrated in governance canon:
    - `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
    - `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
    - `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`
    - `governance/compat/check_foundational_guard_surfaces.py`
    - `governance/skill-library/INTEGRATION_ROADMAP.md`
    - `governance/skill-library/README.md`
    - `CHANGELOG.md`
- comparative density:
  - `CVF_SKILL_LIBRARY/` active textual references across non-ignored repo surfaces: `9` files
  - `ui_governance_engine/` active textual references across non-ignored repo surfaces: `7` files
  - by comparison, `v1.0/` and `v1.1/` each still carry `56` `docs/` references and therefore remain higher-blast-radius than this batch

## 5. Overlap Classification

- conceptual overlap:
  - `HIGH`
  - both roots are already non-canonical at the repository root
- interface overlap:
  - `NONE`
  - neither root exposes a runtime or package interface
- implementation overlap:
  - `LOW`
  - payload is retained for lineage/reference value, not current execution

## 6. Risk Assessment

- structural risk:
  - `LOW-MEDIUM`
  - root-path references, registries, and README surfaces must move together
- runtime risk:
  - `LOW`
  - no app/package/build entrypoints depend on these roots
- test / CI risk:
  - `LOW-MEDIUM`
  - lifecycle/exposure registries and foundational guard allowlists must be updated in the same batch
- rollback risk:
  - `LOW`
  - tracked payload is small and restorable from git history
- release / readiness risk:
  - `LOW`
  - this wave improves root legibility while keeping retained/internal lineage available under a less public-facing container

## 7. Recommendation

- recommended change class:
  - `physical merge`
- why this class is better than the alternatives:
  - `coordination package` is unnecessary because neither root is an active functional module
  - `wrapper/re-export merge` is not applicable because there is no API surface to preserve
  - physical relocation into an internal retained container removes misleading root-level noise while preserving path-traceable lineage
- why preserving lineage is or is not preferable:
  - preserving lineage remains preferable
  - root-level visibility is not preferable
  - `ECOSYSTEM/reference-roots/retained-internal/` is a better fit for publication models `PRIVATE_CORE + PUBLIC_DOCS_MIRROR` and `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS` because it keeps internal retained payload explicit without implying public-facing canonical ownership

## 8. Verification Plan

- commands:
  - `python governance/compat/check_repository_lifecycle_classification.py --enforce`
  - `python governance/compat/check_repository_exposure_classification.py --enforce`
  - `python governance/compat/check_prepublic_p3_readiness.py --enforce`
  - `python governance/compat/check_docs_governance_compat.py --base HEAD --head HEAD --enforce`
  - `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
- success criteria:
  - `CVF_SKILL_LIBRARY/` and `ui_governance_engine/` no longer remain visible root directories
  - retained payload moves under `ECOSYSTEM/reference-roots/retained-internal/`
  - canonical docs and registries no longer describe the old root paths as visible-root inventory
  - all `GC-037`, `GC-038`, and `GC-039` surfaces remain compliant
- evidence artifacts to update during execution:
  - `docs/reviews/CVF_GC019_P3_CP2_RETAINED_INTERNAL_ROOT_RELOCATION_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P3_CP2_RETAINED_INTERNAL_ROOT_RELOCATION_DELTA_2026-04-02.md`
  - `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
  - `docs/INDEX.md`
  - `AGENT_HANDOFF.md`

## 9. Rollback Plan

- rollback unit:
  - `P3 / CP2` retained-internal-root relocation batch
- rollback trigger:
  - a canonical doc still expects the old visible root path
  - a guard/registry surface fails because the new retained container was not updated consistently
- rollback commands / steps:
  - restore tracked path moves from git
  - revert registry/doc updates in the same commit range
  - remove the new retained container entries only if rollback fully restores visible-root truth
- rollback success criteria:
  - visible root inventory returns to the pre-CP2 state
  - all restructuring guards pass again without path drift

## 10. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - this audit authorizes discussion only; actual relocation still requires a dedicated `restructuring/p3-*` branch and a secondary git worktree before execution
  - `v1.0/`, `v1.1/`, and `REVIEW/` remain intentionally out of scope because their active documentation footprint is materially higher than this batch
