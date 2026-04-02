# CVF Repository Exposure Classification

Memory class: POINTER_RECORD
Status: canonical exposure classification for visible repository roots and extension roots under the default `private-by-default, selective-publication-only` model.

## Purpose

- separate architectural lifecycle from publication exposure
- stop later public GitHub or packaging decisions from defaulting to accidental full disclosure
- make selective publication possible without guessing which roots are safe to expose

## Core Rule

Exposure classification is independent from lifecycle classification.

- lifecycle answers: what is this root in architecture terms?
- exposure answers: how may this root be published, if at all?

## Exposure Classes

| Class | Meaning |
|---|---|
| `PUBLIC_DOCS_ONLY` | may appear in public-facing docs/navigation material, but not as a full source delivery promise |
| `PUBLIC_EXPORT_CANDIDATE` | candidate for curated public package/repo/release export after separate approval |
| `INTERNAL_ONLY` | internal working surface; not intended for direct public release |
| `PRIVATE_ENTERPRISE_ONLY` | enterprise-private or commercially sensitive surface that should remain non-public by default |

## Root Exposure Classification

The machine-readable source of truth is:

- `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`
- `governance/compat/CVF_ROOT_FILE_EXPOSURE_REGISTRY.json` for root-level files

Current summary:

- `PUBLIC_DOCS_ONLY`: `docs`, `public`
- `INTERNAL_ONLY`: `.agents`, `.claude`, `.githooks`, `.github`, `.vscode`, `EXTENSIONS`, `governance`, `scripts`, `tools`, `REVIEW`, `v1.0`, `v1.1`, `ECOSYSTEM`
- `PRIVATE_ENTERPRISE_ONLY`: none at the visible repo root after `P3/CP2`

Foundation-anchor implication:

- `v1.0` and `v1.1` may remain visible inside the private monorepo without changing their exposure class
- reducing public/noise risk for these roots is primarily a publication-navigation problem, not automatically a relocation problem
- the active curated-navigation reference for that reduction is `docs/reference/CVF_PREPUBLIC_CURATED_FRONT_DOOR_NAVIGATION_2026-04-02.md`

Retired local-only reference roots:

- `CVF Edit`, `CVF_Important`, and `CVF_Restructure` are no longer part of the visible root exposure map after `P3/CP1`
- if retained locally, they belong under `.private_reference/legacy/` and remain non-canonical

Relocated retained/internal roots:

- `CVF_SKILL_LIBRARY` and `ui_governance_engine` were removed from the visible root exposure map in `P3/CP2`
- they now live under `ECOSYSTEM/reference-roots/retained-internal/`
- their exposure posture remains private/internal rather than public-facing

Root-file implication:

- root files such as `README.md`, `LICENSE`, `ARCHITECTURE.md`, and `START_HERE.md` are governed separately from root directories
- internal handoff/workflow scratch files must not rely on directory-level exposure tags as a substitute for file-level classification
- before any `P3` relocation wave, root-file exposure truth must be explicit through `GC-039`

## Extension Exposure Classification

The machine-readable source of truth is:

- `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json`

Current summary:

- `PUBLIC_EXPORT_CANDIDATE`: core public-facing foundations and reusable runtime contracts such as `CVF_CONTROL_PLANE_FOUNDATION`, `CVF_EXECUTION_PLANE_FOUNDATION`, `CVF_GOVERNANCE_EXPANSION_FOUNDATION`, `CVF_LEARNING_PLANE_FOUNDATION`, `CVF_GUARD_CONTRACT`, `CVF_AGENT_DEFINITION`, `CVF_AGENT_LEDGER`, `CVF_MODEL_GATEWAY`, `CVF_POLICY_ENGINE`, `CVF_TRUST_SANDBOX`, `CVF_PLANE_FACADES`
- `INTERNAL_ONLY`: lineage-heavy, orchestration-heavy, or internal support families that should not be assumed publishable by default
- `PRIVATE_ENTERPRISE_ONLY`: end-user platform, enterprise delivery, UX/product surfaces, or commercially sensitive families that should remain closed unless a separate product decision says otherwise
- `PUBLIC_DOCS_ONLY`: not used for extension roots by default

Export-readiness rule:

- `PUBLIC_EXPORT_CANDIDATE` is not the same thing as “ready to publish now”
- each candidate must also declare `exportReadiness` before any real export packaging wave proceeds
- current export-readiness truth is part of `GC-039` pre-public `P3` readiness
- current first-wave prioritization truth is tracked separately in `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`
- current shortlist packaging-boundary truth is tracked separately in `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`

## Public GitHub Implication

If one GitHub repository is public, the repository contents can be cloned as a whole.

Therefore:

- folder regrouping alone does not create selective download control
- public docs and public modules should normally be published through separate mirrors, packages, or reduced public repos
- the main CVF core should remain private by default unless an explicit full-public decision is made
- `PUBLIC_DOCS_ONLY` roots such as `docs/` may still require curation before public mirroring, even if they are the right target class
- the active docs-mirror boundary reference is `docs/reference/CVF_PREPUBLIC_DOCS_MIRROR_BOUNDARY_2026-04-02.md`

## Management Rule

No visible repository root and no extension root may remain exposure-unclassified once the exposure classification guard is active.

## Related Artifacts

- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`
- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `governance/toolkit/05_OPERATION/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md`
- `governance/compat/check_repository_exposure_classification.py`

## Final Clause

Public release posture must be chosen intentionally; it must never emerge accidentally from a cleanup wave.
