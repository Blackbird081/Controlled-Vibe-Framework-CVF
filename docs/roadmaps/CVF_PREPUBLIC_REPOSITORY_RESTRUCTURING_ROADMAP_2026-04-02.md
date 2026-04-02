# CVF Pre-Public Repository Restructuring Roadmap — 2026-04-02

Memory class: SUMMARY_RECORD
Status: planning-only roadmap for pre-public repository hygiene and structural clarity before broad external packaging.

## Purpose

- prepare CVF for broader public presentation without rushing physical moves
- classify repository roots and extension roots before any relocation wave starts
- separate lifecycle planning from structural execution so future folder moves remain governed

## Guiding Rule

Before any pre-public repository relocation wave:

1. classify the current root and extension lifecycle truth
2. decide what is active, merged-but-retained, frozen-reference, or retire-candidate
3. only then authorize physical moves under `GC-019`

This roadmap does not authorize physical relocation by itself.

## Public Exposure Model

Pre-public restructuring must assume a later product-facing distribution decision, not only an internal cleanup decision.

Critical reality:

- if one GitHub repository is public, the repository contents are clonable as a whole
- folder cleanup alone does not create selective download control
- “public docs but not full core download” requires a different publishing model, not only a different folder layout

Approved distribution models to evaluate later:

1. `PRIVATE_CORE + PUBLIC_DOCS_MIRROR`
   - keep the full CVF source repository private
   - publish only docs, architecture, guides, and curated public artifacts to a separate public repo/site

2. `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`
   - keep the main monorepo private
   - publish selected modules as separate public repos, packages, or release bundles

3. `PUBLIC_CORE_REDUCED + PRIVATE_ENTERPRISE_ADDONS`
   - make only a deliberately reduced/open subset public
   - keep enterprise-only modules, governance internals, or customer-facing accelerators private elsewhere

4. `FULL_PUBLIC_MONOREPO`
   - only acceptable if CVF intentionally decides the entire repository may be cloned

The restructuring plan should stay compatible with models `1-3` by default.

To support that, `P0-P2` must now produce both:

- lifecycle classification
- exposure classification

## Lifecycle States

| State | Meaning |
|---|---|
| `ACTIVE_CANONICAL` | active architectural ownership root; remains in the primary visible structure |
| `MERGED_RETAINED` | canonical ownership has shifted, but the root still carries lineage, runtime, or reference value |
| `FROZEN_REFERENCE` | historical/reference root kept for evidence, comparison, or migration memory |
| `RETIRE_CANDIDATE` | low-value root that may be archived or retired after explicit review |

## Phase Plan

### `P0` Inventory + Lifecycle Registry

- inventory visible repository roots
- inventory `EXTENSIONS/` roots
- create machine-readable lifecycle registries
- classify exposure posture for visible roots and extension roots
- create a canonical classification reference
- add a repo gate so new visible roots cannot appear unclassified

Exit condition:

- every meaningful top-level repository root is lifecycle-classified
- every extension root is lifecycle-classified
- every meaningful root and extension root is also exposure-classified
- `P0` is formally closed in `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json`

### `P1` Root-Level Hygiene

- review root-level folders against architecture-facing clarity
- confirm which roots must remain visible before public packaging
- mark obvious frozen or retire-candidate roots without moving them yet
- confirm whether dot-prefixed or tooling roots remain intentionally visible
- identify which roots are:
  - internal-only
  - public-navigation candidates
  - public-export candidates
  - never-public candidates

Exit condition:

- root-level lifecycle posture is explicit enough to support later relocation decisions
- visible roots are also tagged by likely public exposure role
- visible root files are also exposure-classified
- every `PUBLIC_DOCS_ONLY` root declares public-content audit status
- `P1` is formally closed in `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json`

### `P2` Extension Lifecycle Cleanup

- classify extension roots into active, merged-retained, frozen-reference, or retire-candidate
- tie legacy `CVF_ECO*` families to current architectural ownership rather than assuming deletion
- document whether each family is runtime-active, lineage-retained, or freeze-only
- mark which extension families are:
  - internal architecture lineage only
  - public-facing module candidates
  - package/export candidates
  - enterprise-private candidates

Exit condition:

- `EXTENSIONS/` has a canonical lifecycle map that can support later structural relocation
- extension families are tagged for future public distribution posture
- every `PUBLIC_EXPORT_CANDIDATE` extension declares export-readiness status
- `P2` is formally closed in `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json`

Canonical exposure authority:

- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`
- `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- `docs/reviews/CVF_MULTI_AGENT_REBUTTAL_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- `governance/toolkit/05_OPERATION/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md`

### `P3` Structural Relocation Wave

- physically move approved roots or families only after `P0-P2` are complete
- require `GC-019` structural audit/review/decision before execution
- require `GC-039` pre-public `P3` readiness verification before execution
- require a dedicated branch matching `restructuring/p3-*` for each future relocation wave
- require a dedicated secondary git worktree for each future relocation wave
- preserve backwards path recovery and packaging integrity while relocating

Current executed move set:

- `P3 / CP1` — retire `CVF Edit/`, `CVF_Important/`, and `CVF_Restructure/` from the visible repo root; optional local recovery may live under `.private_reference/legacy/`
- governing packet chain:
  - `docs/audits/CVF_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_AUDIT_2026-04-02.md`
  - `docs/reviews/CVF_GC019_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_DELTA_2026-04-02.md`
- `P3 / CP2` — relocate `CVF_SKILL_LIBRARY/` and `ui_governance_engine/` into `ECOSYSTEM/reference-roots/retained-internal/`
- governing packet chain:
  - `docs/audits/CVF_P3_CP2_RETAINED_INTERNAL_ROOT_RELOCATION_AUDIT_2026-04-02.md`
  - `docs/reviews/CVF_GC019_P3_CP2_RETAINED_INTERNAL_ROOT_RELOCATION_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P3_CP2_RETAINED_INTERNAL_ROOT_RELOCATION_DELTA_2026-04-02.md`
- execution status:
  - delivered on dedicated branch `restructuring/p3-cp2-retained-internal-root-relocation`
  - delivered from a secondary git worktree, not the canonical `cvf-next` workspace

Re-assessed next-candidate status:

- `P3 / CP3` frozen-reference re-assessment packet:
  - `docs/audits/CVF_P3_CP3_FROZEN_REFERENCE_REASSESSMENT_AUDIT_2026-04-02.md`
  - `docs/reviews/CVF_GC019_P3_CP3_FROZEN_REFERENCE_REASSESSMENT_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P3_CP3_FROZEN_REFERENCE_REASSESSMENT_DELTA_2026-04-02.md`
- result:
  - `HOLD`
- rationale summary:
  - `REVIEW/` is currently a local placeholder rather than a tracked relocation unit
  - `v1.0/` and `v1.1/` remain too documentation-dense for the current slow-and-safe posture

Canonical landing-path status:

- `P3 / CP4` canonical landing-path re-assessment packet:
  - `docs/audits/CVF_P3_CP4_CANONICAL_LANDING_PATH_REASSESSMENT_AUDIT_2026-04-02.md`
  - `docs/reviews/CVF_GC019_P3_CP4_CANONICAL_LANDING_PATH_REASSESSMENT_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P3_CP4_CANONICAL_LANDING_PATH_REASSESSMENT_DELTA_2026-04-02.md`
- result:
  - `HOLD`
- rationale summary:
  - current canon defines isolated `P3` execution clearly
  - current `GC-039` semantics do not yet provide an explicit machine-compatible landing path for bringing a delivered relocation branch back onto `cvf-next`

Foundation-anchor strategy pivot:

- `P3 / CP5` foundation-anchor preservation packet:
  - `docs/audits/CVF_P3_CP5_FOUNDATION_ANCHOR_PRESERVATION_AUDIT_2026-04-02.md`
  - `docs/reviews/CVF_GC019_P3_CP5_FOUNDATION_ANCHOR_PRESERVATION_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P3_CP5_FOUNDATION_ANCHOR_PRESERVATION_DELTA_2026-04-02.md`
- result:
  - `APPROVED STRATEGY PIVOT`
- rationale summary:
  - `v1.0/` and `v1.1/` are foundational frozen anchors with ongoing onboarding/reference value
  - for these roots, safer reduction now comes from `P4` navigation/packaging/docs curation rather than additional `P3` physical relocation

P4 opening status:

- `P4 / CP1` curated front-door planning packet:
  - `docs/audits/CVF_P4_CP1_CURATED_FRONT_DOOR_PLANNING_AUDIT_2026-04-02.md`
  - `docs/reviews/CVF_GC019_P4_CP1_CURATED_FRONT_DOOR_PLANNING_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P4_CP1_CURATED_FRONT_DOOR_PLANNING_DELTA_2026-04-02.md`
- result:
  - `APPROVED - PLANNING OPEN`
- rationale summary:
  - after `P3/CP5`, the safest next step is to define curated navigation and publication boundaries without changing private-core ownership or filesystem layout

P4 docs-mirror boundary status:

- `P4 / CP2` docs-mirror boundary packet:
  - `docs/audits/CVF_P4_CP2_DOCS_MIRROR_BOUNDARY_DEFINITION_AUDIT_2026-04-02.md`
  - `docs/reviews/CVF_GC019_P4_CP2_DOCS_MIRROR_BOUNDARY_DEFINITION_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P4_CP2_DOCS_MIRROR_BOUNDARY_DEFINITION_DELTA_2026-04-02.md`
  - `docs/reference/CVF_PREPUBLIC_DOCS_MIRROR_BOUNDARY_2026-04-02.md`
- result:
  - `APPROVED - BOUNDARY DEFINED`
- rationale summary:
  - the future `PUBLIC_DOCS_MIRROR` must be a curated subset
  - evidence-dense and governance-dense docs remain private-core only

P4 export-shortlist status:

- `P4 / CP3` export-shortlist packet:
  - `docs/audits/CVF_P4_CP3_EXPORT_SHORTLIST_DEFINITION_AUDIT_2026-04-02.md`
  - `docs/reviews/CVF_GC019_P4_CP3_EXPORT_SHORTLIST_DEFINITION_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P4_CP3_EXPORT_SHORTLIST_DEFINITION_DELTA_2026-04-02.md`
  - `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`
- result:
  - `APPROVED - FIRST WAVE PRIORITIZED`
- rationale summary:
  - first bounded shortlist is:
    - `CVF_GUARD_CONTRACT`
    - `CVF_v3.0_CORE_GIT_FOR_AI`
    - `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
  - broader foundations and concept-only facades stay out of the first wave

P4 shortlist packaging-boundary status:

- `P4 / CP4` shortlist-packaging-boundary packet:
  - `docs/audits/CVF_P4_CP4_SHORTLIST_PACKAGING_BOUNDARY_DEFINITION_AUDIT_2026-04-02.md`
  - `docs/reviews/CVF_GC019_P4_CP4_SHORTLIST_PACKAGING_BOUNDARY_DEFINITION_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P4_CP4_SHORTLIST_PACKAGING_BOUNDARY_DEFINITION_DELTA_2026-04-02.md`
  - `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`
- result:
  - `APPROVED - PACKAGING BOUNDARY DEFINED`
- rationale summary:
  - `CVF_GUARD_CONTRACT` now has a bounded first-wave package story centered on the guard barrel, types, engine, explicit guards, and selected runtime helpers
  - `CVF_v3.0_CORE_GIT_FOR_AI` now has a bounded first-wave package story centered on the root barrel plus the primitive families it already groups
  - `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` is confirmed as shortlist-worthy but still needs canonical entrypoint/export-map work before any later implementation packet

P4 curated front-door navigation status:

- `P4 / CP5` curated-front-door-navigation packet:
  - `docs/audits/CVF_P4_CP5_CURATED_FRONT_DOOR_NAVIGATION_DEFINITION_AUDIT_2026-04-02.md`
  - `docs/reviews/CVF_GC019_P4_CP5_CURATED_FRONT_DOOR_NAVIGATION_DEFINITION_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P4_CP5_CURATED_FRONT_DOOR_NAVIGATION_DEFINITION_DELTA_2026-04-02.md`
  - `docs/reference/CVF_PREPUBLIC_CURATED_FRONT_DOOR_NAVIGATION_2026-04-02.md`
- result:
  - `APPROVED - NAVIGATION MAP DEFINED`
- rationale summary:
  - `README.md`, `START_HERE.md`, and `ARCHITECTURE.md` are now canonized as the preferred first-click ring
  - guided next-click paths are now explicit by audience rather than ad hoc
  - `v1.0/` and `v1.1/` remain visible, but are intentionally pushed below the first-click navigation ring

P4 root front-door content sync status:

- `P4 / CP6` root-front-door-content-sync packet:
  - `docs/audits/CVF_P4_CP6_ROOT_FRONT_DOOR_CONTENT_SYNC_AUDIT_2026-04-03.md`
  - `docs/reviews/CVF_GC019_P4_CP6_ROOT_FRONT_DOOR_CONTENT_SYNC_REVIEW_2026-04-03.md`
  - `docs/baselines/CVF_P4_CP6_ROOT_FRONT_DOOR_CONTENT_SYNC_DELTA_2026-04-03.md`
- result:
  - `APPROVED - CONTENT SYNC DELIVERED`
- rationale summary:
  - `README.md` now triages audiences before deeper evidence chains
  - `START_HERE.md` now acts as a short front-door redirect aligned to ring-2 destinations
  - `ARCHITECTURE.md` now routes toward architecture depth instead of sending readers directly into review-heavy surfaces

P4 candidate-scoped export implementation status:

- `P4 / CP7` core-git-export-boundary-implementation packet:
  - `docs/audits/CVF_P4_CP7_CORE_GIT_EXPORT_BOUNDARY_IMPLEMENTATION_AUDIT_2026-04-03.md`
  - `docs/reviews/CVF_GC019_P4_CP7_CORE_GIT_EXPORT_BOUNDARY_IMPLEMENTATION_REVIEW_2026-04-03.md`
  - `docs/baselines/CVF_P4_CP7_CORE_GIT_EXPORT_BOUNDARY_IMPLEMENTATION_DELTA_2026-04-03.md`
  - `docs/reference/CVF_PREPUBLIC_CORE_GIT_EXPORT_SURFACE_2026-04-03.md`
- result:
  - `APPROVED - FIRST CANDIDATE IMPLEMENTATION DELIVERED`
- rationale summary:
  - `CVF_v3.0_CORE_GIT_FOR_AI` is the lowest-blast-radius shortlist member for the first implementation packet
  - the package now declares explicit root-barrel-first manifest metadata instead of leaving the public surface implicit
  - the candidate still remains `NEEDS_PACKAGING`, so this packet improves package clarity without authorizing publication

P4 second candidate-scoped export implementation status:

- `P4 / CP8` guard-contract-export-boundary-tightening packet:
  - `docs/audits/CVF_P4_CP8_GUARD_CONTRACT_EXPORT_BOUNDARY_TIGHTENING_AUDIT_2026-04-03.md`
  - `docs/reviews/CVF_GC019_P4_CP8_GUARD_CONTRACT_EXPORT_BOUNDARY_TIGHTENING_REVIEW_2026-04-03.md`
  - `docs/baselines/CVF_P4_CP8_GUARD_CONTRACT_EXPORT_BOUNDARY_TIGHTENING_DELTA_2026-04-03.md`
  - `docs/reference/CVF_PREPUBLIC_GUARD_CONTRACT_EXPORT_SURFACE_2026-04-03.md`
- result:
  - `APPROVED - SECOND CANDIDATE IMPLEMENTATION DELIVERED`
- rationale summary:
  - `CVF_GUARD_CONTRACT` already had a narrow root-barrel story, but its manifest still overexposed runtime and enterprise subpaths
  - this packet narrows the export map to the selected first-wave guard surface only
  - the candidate still remains `NEEDS_PACKAGING`, so publication posture does not change

P4 third candidate-scoped export implementation status:

- `P4 / CP9` runtime-adapter-hub-export-map-implementation packet:
  - `docs/audits/CVF_P4_CP9_RUNTIME_ADAPTER_HUB_EXPORT_MAP_IMPLEMENTATION_AUDIT_2026-04-03.md`
  - `docs/reviews/CVF_GC019_P4_CP9_RUNTIME_ADAPTER_HUB_EXPORT_MAP_IMPLEMENTATION_REVIEW_2026-04-03.md`
  - `docs/baselines/CVF_P4_CP9_RUNTIME_ADAPTER_HUB_EXPORT_MAP_IMPLEMENTATION_DELTA_2026-04-03.md`
  - `docs/reference/CVF_PREPUBLIC_RUNTIME_ADAPTER_HUB_EXPORT_SURFACE_2026-04-03.md`
- result:
  - `APPROVED - THIRD CANDIDATE IMPLEMENTATION DELIVERED`
- rationale summary:
  - `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` was the last shortlist candidate still missing a canonical root barrel and explicit export map
  - this packet adds a root-barrel-first entry plus named subpaths for support layers and risk-model assets
  - the candidate still remains `NEEDS_PACKAGING`, so publication posture does not change

P4 shortlist-wave consolidation status:

- `P4 / CP10` shortlist-wave-consolidation packet:
  - `docs/audits/CVF_P4_CP10_SHORTLIST_WAVE_CONSOLIDATION_AUDIT_2026-04-03.md`
  - `docs/reviews/CVF_GC019_P4_CP10_SHORTLIST_WAVE_CONSOLIDATION_REVIEW_2026-04-03.md`
  - `docs/baselines/CVF_P4_CP10_SHORTLIST_WAVE_CONSOLIDATION_DELTA_2026-04-03.md`
  - `docs/reference/CVF_PREPUBLIC_SHORTLIST_WAVE_STATUS_2026-04-03.md`
- result:
  - `APPROVED - FIRST WAVE CONSOLIDATED`
- rationale summary:
  - `P4/CP7-CP9` now form one completed first-wave shortlist implementation chain
  - all three candidates still remain `NEEDS_PACKAGING`
  - the next safe packet is a separate readiness re-assessment rather than an implicit uplift

Exit condition:

- approved folder moves land with migration notes, path recovery, and packaging validation

### `P4` Public Navigation + Packaging

- align docs navigation, product packaging, release-facing structure, and onboarding paths
- reduce visible structural noise for external evaluators
- decide whether CVF will ship as:
  - public docs only
  - curated public modules
  - reduced public core
  - or full public monorepo
- ensure the chosen model is supported by the repository structure created in `P3`
- current active packet:
  - `P4 / CP1` planning-only front-door packet is approved
- current bounded outputs:
  - curated front-door navigation map
  - docs mirror boundary definition
  - selective public export candidate shortlist
  - shortlist packaging-boundary definition
  - explicit private-core-visible foundation-anchor policy
- current curated front-door result:
  - Ring 1 root entry:
    - `README.md`
    - `START_HERE.md`
    - `ARCHITECTURE.md`
  - Ring 2 guided orientation:
    - audience-based routes for general evaluators, builders, non-coders, and architecture readers
  - Ring 3 support surfaces:
    - `CVF_LITE.md`, `CVF_ECOSYSTEM_ARCHITECTURE.md`, `CHANGELOG.md`, `LICENSE`, and learning-zone docs
  - private-core depth ring:
    - evidence-heavy and governance-heavy surfaces remain reachable, but not first-click
- current root front-door content result:
  - `README.md`:
    - now exposes an explicit front-door path before the deeper private-core chain
  - `START_HERE.md`:
    - now routes by audience and removes stale count / extension-first default links
  - `ARCHITECTURE.md`:
    - now keeps its follow-up links inside guided orientation, architecture depth, and status context
- current candidate-scoped export implementation result:
  - `CVF_v3.0_CORE_GIT_FOR_AI`:
    - now has explicit `main`, `types`, root-only `exports`, and a bounded `files` allowlist
    - now has a package-local README that documents the root entry and five primitive families
    - still remains `NEEDS_PACKAGING`; no readiness uplift or package release is implied
  - `CVF_GUARD_CONTRACT`:
    - now exposes `types`, `engine`, `guards/*`, and only the two selected runtime helper subpaths
    - no longer exposes wildcard runtime or `enterprise` subpaths at the manifest level
    - still remains `NEEDS_PACKAGING`; no provider-runtime or enterprise publication is implied
  - `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`:
    - now has a canonical root barrel and explicit named export map
    - names all four shipped JSON risk-model assets explicitly instead of hiding them behind a wildcard
    - still remains `NEEDS_PACKAGING`; no readiness uplift or package release is implied
- current first-wave consolidation result:
  - the shortlist implementation wave is complete for all three prioritized candidates
  - no candidate changed `exportReadiness`
  - future readiness-uplift discussion remains separately gated
- current docs-mirror result:
  - direct candidates:
    - root front-door files + learning-oriented docs zones
  - conditional zone:
    - selected explanatory `docs/reference/` files after per-file review
  - excluded zone:
    - audits, reviews, baselines, logs, roadmaps, and dense internal memory docs
- current export-shortlist result:
  - first-wave shortlist:
    - `CVF_GUARD_CONTRACT`
    - `CVF_v3.0_CORE_GIT_FOR_AI`
    - `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
  - deferred:
    - broad plane foundations
    - medium candidates needing more boundary work
    - `CVF_PLANE_FACADES` because current truth is `CONCEPT_ONLY`
- current shortlist packaging-boundary result:
  - `CVF_GUARD_CONTRACT`:
    - boundary is centered on root barrel, types, engine, explicit guards, and selected runtime helpers
    - provider-specific runtime integrations and SQLite persistence remain packaging-cautioned
  - `CVF_v3.0_CORE_GIT_FOR_AI`:
    - boundary is centered on root barrel plus `ai_commit`, `artifact_staging`, `artifact_ledger`, `process_model`, and `skill_lifecycle`
    - explicit export-map formalization remains future work
  - `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`:
    - boundary is centered on `contracts`, `adapters`, `policy`, `explainability`, and `risk_models`
    - canonical root entrypoint/export-map work remains future work
- hard non-goals:
  - no public mirror push
  - no package publication
  - no further `P3` physical relocation
  - no `cvf-next` landing-path override

### `P5` Retirement / Archive Closure

- retire or archive roots that no longer carry active, merged, or reference value
- keep only what is necessary for runtime, lineage, evidence, or migration memory

## Current Instruction

Current execution boundary:

- `P0-P2` may proceed now
- `P3` future physical relocation still requires later explicit authorization
- `P4/CP1` planning-only work may proceed now
- `P4/CP2` docs-mirror boundary is defined
- `P4/CP3` export shortlist is defined
- `P4/CP4` shortlist packaging boundary is defined
- `P4/CP5` curated front-door navigation is defined
- `P4/CP6` root front-door content sync is delivered
- `P4/CP7` core-git export boundary implementation is delivered
- `P4/CP8` guard-contract export boundary tightening is delivered
- `P4/CP9` runtime-adapter-hub export-map implementation is delivered
- `P4/CP10` shortlist wave consolidation is delivered; the next preferred packet is a bounded readiness re-assessment packet before any readiness uplift discussion
- any later `P4` implementation beyond planning still requires a fresh bounded packet
- `P5` remains blocked
- any future `P3` relocation beyond delivered `P3/CP2` must run on a dedicated `restructuring/p3-*` branch and secondary git worktree
- current preferred next lane is `P4` planning for curated navigation, docs mirror boundaries, and packaging, not additional forced relocation of `v1.0/` or `v1.1/`

## Non-Goals For `P0-P2`

`P0-P2` do not decide:

- whether the entire CVF repository will become public
- whether customers may clone the full core
- which modules will be published as standalone downloadable products

`P0-P2` only ensure that later decisions can be made from an architecture-aligned structure instead of a legacy-shaped tree.

## Related Artifacts

- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `governance/toolkit/05_OPERATION/CVF_STRUCTURAL_CHANGE_AUDIT_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md`

## Final Clause

Pre-public cleanup should improve architectural legibility first, then physical structure second.
