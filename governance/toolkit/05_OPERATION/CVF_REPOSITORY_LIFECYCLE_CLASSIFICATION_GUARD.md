# CVF Repository Lifecycle Classification Guard

**Control ID:** `GC-037`
**Guard Class:** `PACKAGE_AND_RUNTIME_ALIGNMENT_GUARD`
**Status:** Active pre-public repository classification rule.
**Applies to:** visible repository roots, extension roots, and pre-public repository restructuring waves.
**Enforced by:** `governance/compat/check_repository_lifecycle_classification.py`

## Purpose

- force lifecycle classification before broad repository cleanup becomes structural execution
- stop root or extension folders from being moved, hidden, or retired based on appearance alone
- give later `GC-019` relocation waves a machine-readable starting point

## Rule

Before any pre-public repository relocation wave:

- every meaningful top-level repository root must be lifecycle-classified
- every extension root under `EXTENSIONS/` must be lifecycle-classified
- the classification must use one of the canonical lifecycle classes:
  - `ACTIVE_CANONICAL`
  - `MERGED_RETAINED`
  - `FROZEN_REFERENCE`
  - `RETIRE_CANDIDATE`

Unclassified roots are not allowed.

This guard does not authorize physical moves by itself.

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_repository_lifecycle_classification.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

## Related Artifacts

- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`
- `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json`
- `governance/toolkit/05_OPERATION/CVF_STRUCTURAL_CHANGE_AUDIT_GUARD.md`

## Final Clause

Pre-public cleanup starts with lifecycle truth, not with folder movement.
