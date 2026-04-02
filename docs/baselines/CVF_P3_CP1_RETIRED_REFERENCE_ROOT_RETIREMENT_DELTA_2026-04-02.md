# CVF P3 CP1 Delta — Retired Reference Root Retirement

Memory class: SUMMARY_RECORD
Status: records the first executed pre-public `P3` move set that removes non-canonical reference roots from the visible repository root.

## Purpose

- reduce root-level structural noise before broader public packaging decisions
- remove three roots that are no longer canonical ownership surfaces
- preserve optional local recovery under `.private_reference/legacy/` without keeping those roots GitHub-visible

## Scope

- retired from visible repository root:
  - `CVF Edit/`
  - `CVF_Important/`
  - `CVF_Restructure/`
- local-only recovery location:
  - `.private_reference/legacy/`

## Canonical Documents Updated

- `docs/audits/CVF_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_AUDIT_2026-04-02.md`
- `docs/reviews/CVF_GC019_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_REVIEW_2026-04-02.md`
- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `docs/reference/CVF_RESTRUCTURE_ARCHIVE_MANIFEST.md`
- `docs/INDEX.md`
- `AGENT_HANDOFF.md`

## Guard / Registry Updates

- `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`
- `governance/compat/check_foundational_guard_surfaces.py`
- `.gitignore`

## Verification

- `python governance/compat/check_repository_lifecycle_classification.py --enforce`
- `python governance/compat/check_repository_exposure_classification.py --enforce`
- `python governance/compat/check_prepublic_p3_readiness.py --enforce`
- `python governance/compat/check_docs_governance_compat.py --base HEAD --head HEAD --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## Final Note

This delta retires only the three roots named above. It does not authorize additional `P3` relocation beyond this bounded move set.
