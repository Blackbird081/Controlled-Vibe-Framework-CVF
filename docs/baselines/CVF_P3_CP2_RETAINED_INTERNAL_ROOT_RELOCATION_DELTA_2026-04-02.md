# CVF P3 CP2 Delta — Retained Internal Root Relocation

Memory class: SUMMARY_RECORD
Status: records the second executed pre-public `P3` move set that removes retained/internal non-canonical roots from the visible repository root.

## Purpose

- reduce visible root noise further without touching frozen core or high-reference-density roots
- preserve retained/internal lineage under `ECOSYSTEM/reference-roots/retained-internal/`
- keep publication posture aligned with `private-by-default, selective-publication-only`

## Scope

- relocated from visible repository root:
  - `CVF_SKILL_LIBRARY/`
  - `ui_governance_engine/`
- retained location:
  - `ECOSYSTEM/reference-roots/retained-internal/`
- still blocked for later waves:
  - `v1.0/`
  - `v1.1/`
  - `REVIEW/`

## Canonical Documents Updated

- `docs/audits/CVF_P3_CP2_RETAINED_INTERNAL_ROOT_RELOCATION_AUDIT_2026-04-02.md`
- `docs/reviews/CVF_GC019_P3_CP2_RETAINED_INTERNAL_ROOT_RELOCATION_REVIEW_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`
- `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`
- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `docs/INDEX.md`
- `AGENT_HANDOFF.md`
- `ECOSYSTEM/README.md`
- `CHANGELOG.md`

## Guard / Registry Updates

- `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`
- `governance/compat/CVF_ROOT_FILE_EXPOSURE_REGISTRY.json`
- `governance/compat/check_foundational_guard_surfaces.py`

## Verification

- `python governance/compat/check_repository_lifecycle_classification.py --enforce`
- `python governance/compat/check_repository_exposure_classification.py --enforce`
- `python governance/compat/check_prepublic_p3_readiness.py --enforce`
- `python governance/compat/check_docs_governance_compat.py --base HEAD --head HEAD --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## Final Note

This delta covers only `CVF_SKILL_LIBRARY/` and `ui_governance_engine/`. It does not authorize movement of `v1.0/`, `v1.1/`, or `REVIEW/`, which remain intentionally deferred to a later bounded wave.
