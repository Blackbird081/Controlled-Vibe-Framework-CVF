# CVF P0-P2 Repository Lifecycle Classification Delta — 2026-04-02

Memory class: SUMMARY_RECORD
Status: baseline delta for pre-public repository restructuring preparation.

## Scope

- create lifecycle classification for visible repository roots
- create lifecycle classification for extension roots
- create a canonical reference doc before any physical move wave
- add `GC-037` enforcement so classification stays complete

## Artifacts Added

- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`
- `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json`
- `governance/toolkit/05_OPERATION/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md`
- `governance/compat/check_repository_lifecycle_classification.py`

## Closure Statement

`P0-P2` classification is now explicit enough to support later relocation decisions without guessing lifecycle from folder names alone.
