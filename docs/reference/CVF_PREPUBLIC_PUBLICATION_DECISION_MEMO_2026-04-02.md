# CVF Pre-Public Publication Decision Memo — 2026-04-02

Memory class: POINTER_RECORD
Status: decision-support memo for choosing a later CVF publication model after `P0-P2` lifecycle and exposure classification.

## Purpose

- preserve the current assessment, cautions, and recommendations in one place
- help future publication decisions stay architecture-aligned instead of convenience-driven
- give one compact file to review before choosing any public/private publication model

## Executive Summary

CVF should not default to a full-public monorepo.

Current recommendation order:

1. `PRIVATE_CORE + PUBLIC_DOCS_MIRROR`
2. `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`
3. `PUBLIC_CORE_REDUCED + PRIVATE_ENTERPRISE_ADDONS`
4. `FULL_PUBLIC_MONOREPO`

Default posture recommendation:

- keep CVF `private-by-default`
- treat public exposure as a selective product decision, not a cleanup side effect
- prefer a model that separates public docs and/or curated public exports from the private core

## Core Reality

If one GitHub repository is public, the repository contents can be cloned as a whole.

That means:

- folder cleanup alone does not create selective download control
- better structure is necessary, but it is not sufficient for IP protection
- publication design must be treated like data-governance design: explicit, classified, and intentionally limited

## Why This Matters

CVF contains more than one kind of value:

- canonical architecture and governance concepts that may help public understanding
- reusable module candidates that could be selectively exported
- internal runtime and governance surfaces that are not appropriate for broad public release
- enterprise-private or commercially sensitive surfaces that should remain closed by default

If these layers are not separated intentionally, public release can:

- disclose more implementation detail than necessary
- weaken product narrative by exposing internal lineage and legacy structure too early
- reduce commercial defensibility for enterprise/private surfaces
- make later “re-closing” practically impossible

## Current Governance Baseline

The repository now has two explicit classification layers:

- lifecycle classification:
  - `ACTIVE_CANONICAL`
  - `MERGED_RETAINED`
  - `FROZEN_REFERENCE`
  - `RETIRE_CANDIDATE`
- exposure classification:
  - `PUBLIC_DOCS_ONLY`
  - `PUBLIC_EXPORT_CANDIDATE`
  - `INTERNAL_ONLY`
  - `PRIVATE_ENTERPRISE_ONLY`

Canonical source artifacts:

- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`
- `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json`

These classifications make later publication decisions possible, but they do not themselves authorize publication.

## Publication Options

### Option 1: `PRIVATE_CORE + PUBLIC_DOCS_MIRROR`

Meaning:

- keep the main CVF source repository private
- publish architecture/docs/guides/examples in a separate public repo or site

Strengths:

- strongest IP protection
- easiest way to explain CVF publicly without exposing the full implementation tree
- supports product marketing, onboarding, and architecture evaluation

Weaknesses:

- no direct public code download of core modules
- requires separate curation pipeline for docs/public examples
- a public docs mirror should be treated as a curated subset boundary, not as a wholesale copy of the private `docs/` tree

Best when:

- public narrative matters first
- code exposure should stay minimal
- enterprise/private differentiation must remain strong

### Option 2: `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`

Meaning:

- keep the monorepo private
- publish selected modules/packages as separate public artifacts

Strengths:

- good balance between protection and ecosystem growth
- allows controlled adoption of useful CVF building blocks
- aligns well with the `PUBLIC_EXPORT_CANDIDATE` exposure class
- can be staged through a very small first-wave shortlist instead of treating all candidates as equally near-term
- can now be discussed through a candidate-scoped packaging-boundary reference instead of a vague export backlog

Weaknesses:

- needs packaging discipline and curated boundaries
- requires ongoing release hygiene for exported modules

Best when:

- selected technical adoption is desired
- core governance/runtime internals should remain private
- productization will happen by module family

### Option 3: `PUBLIC_CORE_REDUCED + PRIVATE_ENTERPRISE_ADDONS`

Meaning:

- publish a deliberately reduced/open subset
- keep enterprise/private modules and commercial accelerators elsewhere

Strengths:

- strongest ecosystem visibility among controlled models
- creates an open-core style entry point
- can support community familiarity without exposing all enterprise value

Weaknesses:

- hardest model to define cleanly
- requires very careful scope boundaries
- risk of confusing “reduced public core” with “full CVF”

Best when:

- there is a product strategy for open core
- packaging and brand boundaries are mature enough

### Option 4: `FULL_PUBLIC_MONOREPO`

Meaning:

- the main repository becomes public as a whole

Strengths:

- simplest public hosting model
- maximum transparency

Weaknesses:

- highest exposure risk
- weakens selective IP protection
- public consumers can see the entire public tree, including lineage-heavy and internal surfaces
- hard to reverse once done

Best when:

- CVF intentionally chooses full openness
- commercial risk is accepted
- repository structure and narrative are already simplified enough for outside consumption

## Current Recommendation

Recommended ordering of safety and strategic fit:

1. `PRIVATE_CORE + PUBLIC_DOCS_MIRROR`
2. `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`
3. `PUBLIC_CORE_REDUCED + PRIVATE_ENTERPRISE_ADDONS`
4. `FULL_PUBLIC_MONOREPO`

Practical recommendation for the next decision wave:

- do not choose `FULL_PUBLIC_MONOREPO` as the first publication step
- finish repository restructuring preparation first
- decide whether CVF’s near-term priority is:
  - public understanding
  - selective technical adoption
  - or open-core productization
- do not assume that every visible frozen foundation root must be physically relocated first; for roots such as `v1.0/` and `v1.1/`, curated navigation and mirror/package boundaries may be safer than path movement

## Decision Criteria

Before selecting a publication model, review these criteria:

1. IP protection:
   - how much source exposure is acceptable?
2. Product narrative:
   - do we want people to understand CVF, or to download code, or both?
3. Packaging readiness:
   - are curated public artifacts actually ready to stand alone?
4. Boundary clarity:
   - are public/export/private surfaces already well separated?
5. Commercial posture:
   - which parts must remain enterprise-private?
6. Operational burden:
   - can we maintain public mirrors/packages cleanly over time?

## Recommended Decision Sequence

Use this sequence before any publication move:

1. finish `P0-P2`
2. decide the intended publication model
3. only then authorize `P3` relocation with that target model in mind
4. prepare `P4` public navigation + packaging around that chosen model
5. leave `P5` retirement/archive work as cleanup after the packaging structure stabilizes

## Foundation Anchor Note

Some visible roots can be architecturally noisy while still being strategically correct to keep in place inside a private core.

Current planning interpretation:

- `v1.0/` and `v1.1/` are frozen foundation anchors with active onboarding/reference value
- their visibility inside the private monorepo does not by itself create public exposure
- if CVF adopts `PRIVATE_CORE + PUBLIC_DOCS_MIRROR` or `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`, these anchors can remain in the private core while public-facing navigation is curated elsewhere

Implication:

- better publication isolation can come from selective mirrors, curated docs front-doors, and package boundaries
- it does not always require additional physical relocation of the private-core foundation roots
- if CVF chooses `PRIVATE_CORE + PUBLIC_DOCS_MIRROR`, the active boundary reference is `docs/reference/CVF_PREPUBLIC_DOCS_MIRROR_BOUNDARY_2026-04-02.md`

## What Should Not Happen

Avoid these failure modes:

- using folder cleanup as a substitute for access control
- making the main repo public “temporarily”
- exposing enterprise-private surfaces because they were not labeled clearly enough
- treating `MERGED_RETAINED` or `FROZEN_REFERENCE` surfaces as public-ready by default
- deciding publication model after moving folders, instead of before

## Recommended Near-Term Action

Near-term recommendation:

- keep `private-by-default`
- complete classification and governance preparation
- delay any full-public decision until after repository restructuring planning is mature enough to support selective publication cleanly

Most likely best first publication move:

- `PRIVATE_CORE + PUBLIC_DOCS_MIRROR`
  or
- `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`

Current first-wave export shortlist reference:

- `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`

Current shortlist packaging-boundary reference:

- `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`

Current curated front-door navigation reference:

- `docs/reference/CVF_PREPUBLIC_CURATED_FRONT_DOOR_NAVIGATION_2026-04-02.md`

## Re-Assessment Boundary

Re-assessment-By: `2026-05-01`

If a concrete `P3` authorization packet is drafted before `2026-05-01`, this memo must be re-read and revalidated at that time instead of waiting for the date boundary.

## Related Artifacts

- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`
- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `governance/toolkit/05_OPERATION/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md`

## Final Clause

CVF should become more understandable before it becomes more exposed.
