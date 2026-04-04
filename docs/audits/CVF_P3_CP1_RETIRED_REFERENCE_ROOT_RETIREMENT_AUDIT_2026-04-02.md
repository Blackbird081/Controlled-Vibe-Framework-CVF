# CVF P3 CP1 Retired Reference Root Retirement Audit

Memory class: FULL_RECORD

> Decision type: `GC-019` structural change audit
> Pre-public phase: `P3`
> Date: `2026-04-02`

---

## 1. Proposal

- Change ID: `GC019-P3-CP1-RETIRED-REFERENCE-ROOT-RETIREMENT-2026-04-02`
- Date: `2026-04-02`
- Proposed target:
  - retire `CVF Edit/`, `CVF_Important/`, and `CVF_Restructure/` from the visible repository root
  - preserve optional local recovery copies under `.private_reference/legacy/`
- Proposed change class:
  - `physical merge`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`

## 2. Scope

- Source modules:
  - `CVF Edit/`
  - `CVF_Important/`
  - `CVF_Restructure/`
- Affected consumers:
  - root-level repository navigation
  - pre-public lifecycle/exposure classification
  - historical path references in docs and manifests
- Active-path impact:
  - `NONE` for runtime and package execution
  - `LOW-MEDIUM` for documentation/path continuity
- Out of scope:
  - `REVIEW/`
  - `v1.0/`
  - `v1.1/`
  - `ECOSYSTEM/`, `EXTENSIONS/`, `docs/`, `governance/`
  - public packaging model lock-in

## 3. Module Profiles

### `CVF Edit/`

- language/runtime:
  - markdown-only local review/reference payload
- current location:
  - repository root
- package/build system:
  - none
- tests / coverage:
  - none
- entrypoints:
  - none
- current owners / responsibilities:
  - historical local analysis only
  - already `.gitignored`

### `CVF_Important/`

- language/runtime:
  - markdown/doc-only historical reference payload
- current location:
  - repository root
- package/build system:
  - none
- tests / coverage:
  - none
- entrypoints:
  - none
- current owners / responsibilities:
  - legacy review/reference source material
  - selected outputs already promoted into canonical `docs/` artifacts

### `CVF_Restructure/`

- language/runtime:
  - markdown/doc-only historical planning/reference payload
- current location:
  - repository root
- package/build system:
  - none
- tests / coverage:
  - none
- entrypoints:
  - none
- current owners / responsibilities:
  - archived local planning workspace
  - original source for earlier ECOSYSTEM restructuring material
  - already `.gitignored`

## 4. Consumer Analysis

- who imports or calls each module:
  - no compile-time imports
  - no runtime calls
  - consumers are documentation-only references, manifests, and historical notes
- whether coupling is compile-time, runtime, or documentation-only:
  - `documentation-only`
- whether consumers are active-path critical:
  - no runtime-critical consumers
  - only a small set of active docs need path cleanup:
    - `docs/INDEX.md`
    - `docs/reference/CVF_RESTRUCTURE_ARCHIVE_MANIFEST.md`
    - `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
    - `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
    - `CVF_ECOSYSTEM_ARCHITECTURE.md`
    - lifecycle/guard registries

Reference evidence summary:

- filesystem payload:
  - `CVF Edit/`: 10 files, `73.2 KB`
  - `CVF_Important/`: 178 files, `820.1 KB`
  - `CVF_Restructure/`: 74 files, `437.3 KB`
- active-doc reference density:
  - `CVF Edit/`: 2 reference files
  - `CVF_Important/`: 5 reference files
  - `CVF_Restructure/`: 3 reference files

## 5. Overlap Classification

- conceptual overlap:
  - `HIGH`
  - all three roots have already been superseded by canonical artifacts elsewhere in the repo
- interface overlap:
  - `NONE`
  - these roots do not expose runtime/package interfaces
- implementation overlap:
  - `N/A`
  - no executable implementation lives here

## 6. Risk Assessment

- structural risk:
  - `LOW-MEDIUM`
  - root navigation, docs references, and lifecycle truth must be updated together
- runtime risk:
  - `LOW`
  - no code/package entrypoints depend on these roots
- test / CI risk:
  - `LOW-MEDIUM`
  - classification and foundational-root guards will fail if registries/docs are not updated in the same batch
- rollback risk:
  - `LOW`
  - tracked payload can be restored from git history
  - local recovery copies can remain under `.private_reference/legacy/`
- release / readiness risk:
  - `LOW`
  - removing these roots improves pre-public legibility and does not reduce active product/runtime readiness

## 7. Recommendation

- recommended change class:
  - `physical merge`
- why this class is better than the alternatives:
  - `coordination package` is not appropriate because these roots are not active functional modules
  - `wrapper/re-export merge` is not appropriate because there is no public API to unify
  - physical relocation/removal is the simplest way to eliminate misleading root-level noise
- why preserving lineage is or is not preferable:
  - preserving visible root-level lineage is no longer preferable
  - preserving optional local recovery under `.private_reference/legacy/` is sufficient
  - canonical lineage already lives in `docs/`, manifests, ADRs, and git history

## 8. Verification Plan

- commands:
  - `python governance/compat/check_repository_lifecycle_classification.py --enforce`
  - `python governance/compat/check_repository_exposure_classification.py --enforce`
  - `python governance/compat/check_prepublic_p3_readiness.py --enforce`
  - `python governance/compat/check_docs_governance_compat.py --base HEAD --head HEAD --enforce`
  - `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
- success criteria:
  - no visible root remains for `CVF Edit/`, `CVF_Important/`, or `CVF_Restructure/`
  - `.private_reference/` exists only as ignored local recovery space
  - canonical docs no longer instruct readers to use the old root paths as active references
  - lifecycle/exposure registries and guard surfaces remain compliant
- evidence artifacts to update:
  - `docs/reviews/CVF_GC019_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_DELTA_2026-04-02.md`
  - `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
  - `AGENT_HANDOFF.md`

## 9. Rollback Plan

- rollback unit:
  - `P3 / CP1` retired-root cleanup batch
- rollback trigger:
  - a canonical doc still requires one of the old root paths as a live reference
  - lifecycle or foundational guards indicate the new hidden recovery root is not handled correctly
- rollback commands / steps:
  - restore tracked deletions from git
  - move any local recovery copy back from `.private_reference/legacy/` only if a fresh follow-up review explicitly requires it
  - revert registry and doc updates in the same commit range
- rollback success criteria:
  - visible root inventory returns to the pre-CP1 state
  - all docs/guards pass again without hidden-path drift

## 10. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - this audit assumes the user-authority clarification remains true: these three roots are no longer canonical and should not remain GitHub-visible
  - `REVIEW/`, `v1.0/`, and `v1.1/` stay out of scope because their active reference footprint is still materially higher
