# CVF Repository Lifecycle Classification

Memory class: POINTER_RECORD
Status: canonical lifecycle classification for visible repository roots and extension roots before any pre-public relocation wave.

## Purpose

- give humans and agents one authoritative map of what each visible root currently is
- prevent “looks legacy, move it” decisions from bypassing architectural ownership truth
- establish the required precondition for any later folder relocation wave

## Lifecycle Classes

| Class | Meaning |
|---|---|
| `ACTIVE_CANONICAL` | active architectural or operational root that should remain first-class until an explicit relocation decision says otherwise |
| `MERGED_RETAINED` | ownership has shifted or converged elsewhere, but the root still carries lineage, runtime, packaging, or compatibility value |
| `FROZEN_REFERENCE` | historical or reference-only root kept for evidence, comparison, or migration context |
| `RETIRE_CANDIDATE` | low-value root that may be retired or archived later after explicit review |

## Root-Level Classification

The machine-readable source of truth is:

- `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`

Summary:

- `ACTIVE_CANONICAL`: `.agents`, `.claude`, `.githooks`, `.github`, `.vscode`, `docs`, `EXTENSIONS`, `governance`, `public`, `scripts`, `tools`
- `MERGED_RETAINED`: `CVF_SKILL_LIBRARY`, `ECOSYSTEM`, `ui_governance_engine`
- `FROZEN_REFERENCE`: `CVF_Important`, `CVF_Restructure`, `REVIEW`, `v1.0`, `v1.1`
- `RETIRE_CANDIDATE`: `CVF Edit`

## Extension-Level Classification

The machine-readable source of truth is:

- `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json`

Current interpretation:

- modern foundation and runtime-alignment families stay `ACTIVE_CANONICAL`
- `CVF_ECO*` roots default to `MERGED_RETAINED` unless proven otherwise
- reference packs such as `CVF_STARTER_TEMPLATE_REFERENCE`, `CVF_TOOLKIT_REFERENCE`, and `examples` stay `FROZEN_REFERENCE`

Exposure posture is governed separately through:

- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- the `exposureClass` fields inside the same root and extension registries

## What Folder Moves Would Affect

Moving folders can affect CVF even if the folder names themselves stay unchanged.

Typical impact surface:

- import paths and TypeScript/Python module resolution
- package/workspace paths
- script assumptions under `scripts/`, CI, and hooks
- docs links and canonical path references
- governance registries, release manifests, and archive tooling
- downstream packaging and public onboarding flow

Because of that:

- `P0-P2` classify only
- `P3` is the first phase where physical moves may happen
- every relocation wave should assume path compatibility work is required even if the folder name remains the same

## Public GitHub Implication

Lifecycle cleanup is not the same thing as access control.

Important rule:

- if the main repository is made public on GitHub, users can clone the full public repository
- folder regrouping does not prevent full-repo download
- selective download requires a selective publishing model

That means repository classification should also support a future exposure tag such as:

- `PUBLIC_DOCS_ONLY`
- `PUBLIC_EXPORT_CANDIDATE`
- `INTERNAL_ONLY`
- `PRIVATE_ENTERPRISE_ONLY`

This exposure model is separate from lifecycle class:

- lifecycle answers “what is this root in architecture terms?”
- exposure answers “how should this root be published, if at all?”

## Management Rule

No visible repository root and no extension root may remain unclassified once this classification guard is active.

## Related Artifacts

- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `governance/toolkit/05_OPERATION/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md`
- `governance/compat/check_repository_lifecycle_classification.py`
- `governance/toolkit/05_OPERATION/CVF_STRUCTURAL_CHANGE_AUDIT_GUARD.md`

## Final Clause

Repository cleanup becomes safe only after lifecycle truth is explicit.
