# CVF P0-P2 Repository Exposure Classification Delta — 2026-04-02

Memory class: SUMMARY_RECORD
Status: baseline delta for pre-public exposure governance before any later public packaging decision.

## Scope

- add explicit exposure classification for visible repository roots
- add explicit exposure classification for extension roots
- encode the `private-by-default, selective-publication-only` rule as canonical governance
- block later publication planning from treating folder cleanup as access control

## Artifacts Added

- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `governance/toolkit/05_OPERATION/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md`
- `governance/compat/check_repository_exposure_classification.py`
- `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`
- `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json`

## Closure Statement

`P0-P2` now classify not only what roots are architecturally, but also how or whether they may be published later. CVF remains private-by-default unless a later explicit distribution decision says otherwise.
