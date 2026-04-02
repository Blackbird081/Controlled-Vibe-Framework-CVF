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
- `P3 / CP2` — reconcile visible-root truth so future relocation waves do not mistake local/worktree metadata for canonical structure; no additional physical relocation is authorized in this step
  - `docs/audits/CVF_P3_CP2_VISIBLE_ROOT_TRUTH_RECONCILIATION_AUDIT_2026-04-02.md`
  - `docs/reviews/CVF_GC019_P3_CP2_VISIBLE_ROOT_TRUTH_RECONCILIATION_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P3_CP2_VISIBLE_ROOT_TRUTH_RECONCILIATION_DELTA_2026-04-02.md`
- `P3 / CP3` — audit `v1.0/` and `v1.1/` relocation readiness; keep both out of the near-term move set because live dependency density is still too high
  - `docs/audits/CVF_P3_CP3_FROZEN_VERSION_ROOT_DEPENDENCY_AUDIT_2026-04-02.md`
  - `docs/reviews/CVF_GC019_P3_CP3_FROZEN_VERSION_ROOT_DEPENDENCY_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P3_CP3_FROZEN_VERSION_ROOT_DEPENDENCY_DELTA_2026-04-02.md`

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

### `P5` Retirement / Archive Closure

- retire or archive roots that no longer carry active, merged, or reference value
- keep only what is necessary for runtime, lineage, evidence, or migration memory

## Current Instruction

Current execution boundary:

- `P0-P2` may proceed now
- `P3-P5` require later explicit authorization
- any future `P3` relocation beyond delivered `P3/CP1` must run on a dedicated `restructuring/p3-*` branch and secondary git worktree

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
