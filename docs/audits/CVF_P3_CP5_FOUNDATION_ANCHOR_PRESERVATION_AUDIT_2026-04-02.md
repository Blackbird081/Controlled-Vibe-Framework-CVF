# CVF P3 CP5 Audit - Foundation Anchor Preservation Strategy

Memory class: FULL_RECORD

> Decision type: `GC-019` structural change audit
> Pre-public phase: `P3`
> Date: `2026-04-02`

---

## 1. Proposal

- Change ID:
  - `GC019-P3-CP5-FOUNDATION-ANCHOR-PRESERVATION-2026-04-02`
- Date:
  - `2026-04-02`
- Proposed target:
  - adjust the post-`P3/CP2` restructuring plan away from additional forced physical relocation of the frozen foundation roots
  - treat:
    - `v1.0/`
    - `v1.1/`
  - as explicit visible foundation anchors rather than default relocation candidates
- proposed strategy:
  - preserve these roots in place
  - reduce public/noise pressure through:
    - curated front-door navigation
    - selective docs mirror strategy
    - package/export curation under later `P4`
- proposed change class:
  - `strategy pivot / preserve-in-place`
- active roadmap anchor:
  - `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`

## 2. Scope

- roots covered:
  - `v1.0/`
  - `v1.1/`
- adjacent consideration:
  - `REVIEW/` remains non-actionable as a local placeholder concern
- out of scope:
  - any new physical move
  - any publication model final approval
  - changing lifecycle or exposure classes in machine registries

## 3. Source-Truth Context

- `v1.0/` and `v1.1/` are the earliest frozen framework layers and still anchor active onboarding/reference surfaces
- recent re-assessment packets already established:
  - `P3/CP3`: no low-blast-radius next physical move is currently approved
  - `P3/CP4`: canonical landing semantics for isolated `P3` relocation branches remain unresolved
- publication memo already recommends:
  - `PRIVATE_CORE + PUBLIC_DOCS_MIRROR`
  - or `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`
  - ahead of `FULL_PUBLIC_MONOREPO`
- therefore:
  - reducing future public exposure does not require physically moving every visible frozen root

## 4. Consumer Analysis

- `v1.0/`:
  - acts as foundational doctrine and first-learning baseline
  - directly linked by onboarding and version-selection docs
- `v1.1/`:
  - acts as foundational extended-governance baseline
  - directly linked by onboarding, architecture guidance, and migration docs
- architectural interpretation:
  - visibility of these roots serves comprehension and lineage more than clutter
  - their main risk is public overexposure, which publication-model controls can mitigate without filesystem movement

## 5. Risk Assessment

- physical relocation risk:
  - `MEDIUM-HIGH`
  - many doc links, learning flows, and baseline semantics would need coordinated rewrite
- preserve-in-place risk:
  - `LOW-MEDIUM`
  - root noise remains, but governance and publication controls can manage it more safely
- public exposure risk if left untouched forever:
  - `MEDIUM`
  - but this risk belongs primarily to publication/mirroring choices, not to private-repo path layout alone

## 6. Strategy Comparison

- option A:
  - continue forcing physical relocation of `v1.0/` and `v1.1/`
  - result:
    - higher blast radius
    - larger doc rewrite burden
    - unresolved landing-path governance still in the way
- option B:
  - preserve `v1.0/` and `v1.1/` in place as visible frozen anchors
  - shift next work to `P4` navigation/packaging/docs curation
  - result:
    - better alignment with private-core publication models
    - lower blast radius
    - safer for lineage and onboarding continuity

## 7. Recommendation

- recommended outcome:
  - `ADOPT STRATEGY PIVOT`
- rationale:
  - `v1.0/` and `v1.1/` are foundational anchors, not merely leftover clutter
  - for these roots, publication isolation is better solved by curated navigation and packaging strategy than by path relocation
  - this approach is more balanced, safer, and more consistent with the publication memo than continuing to force `P3` physical movement
- next recommended workstream:
  - open `P4` planning around:
    - front-door navigation reduction
    - docs mirror curation boundaries
    - selective public export candidates
    - explicit “foundation anchors remain private-core visible” policy

## 8. Verification Evidence

- evidence basis:
  - `P3/CP3` frozen-reference reassessment
  - `P3/CP4` canonical landing-path reassessment
  - `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
  - active lifecycle/exposure classification references
- success criteria for this packet:
  - canon no longer assumes that every noisy visible root must be physically moved
  - frozen foundation anchors are treated explicitly as a preserve-in-place exception class in planning

## 9. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - this packet does not authorize a new filesystem move
  - it changes planning posture so future work shifts toward `P4` navigation/packaging instead of more `P3` forced relocation
