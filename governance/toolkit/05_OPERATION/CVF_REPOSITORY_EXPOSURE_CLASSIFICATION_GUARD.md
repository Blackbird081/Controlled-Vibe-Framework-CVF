# CVF Repository Exposure Classification Guard

**Control ID:** `GC-038`
**Guard Class:** `PACKAGE_AND_RUNTIME_ALIGNMENT_GUARD`
**Status:** Active pre-public publication-boundary rule.
**Applies to:** visible repository roots, extension roots, and any pre-public publication or selective-distribution planning wave.
**Enforced by:** `governance/compat/check_repository_exposure_classification.py`

## Purpose

- enforce `private-by-default, selective-publication-only` as a governed repository rule
- stop public packaging discussions from assuming lifecycle cleanup alone is enough
- require explicit exposure classification before any later public mirror, package export, or reduced-core decision proceeds

## Rule

Every visible repository root and every extension root must declare one exposure class:

- `PUBLIC_DOCS_ONLY`
- `PUBLIC_EXPORT_CANDIDATE`
- `INTERNAL_ONLY`
- `PRIVATE_ENTERPRISE_ONLY`

Exposure classification must be explicit before any publish-facing restructure or product-packaging wave.

This guard does not itself authorize publication.

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_repository_exposure_classification.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

## Related Artifacts

- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`
- `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json`
- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`

## Final Clause

Selective publication is a governance choice, not a side effect of folder cleanup.
