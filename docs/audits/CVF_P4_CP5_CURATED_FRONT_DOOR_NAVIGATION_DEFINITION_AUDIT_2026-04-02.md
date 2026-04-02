# CVF P4 CP5 Audit - Curated Front-Door Navigation Definition

Memory class: FULL_RECORD

> Decision type: `GC-019` structural/publication-planning audit
> Pre-public phase: `P4`
> Date: `2026-04-02`

---

## 1. Proposal

- Change ID:
  - `GC019-P4-CP5-CURATED-FRONT-DOOR-NAVIGATION-DEFINITION-2026-04-02`
- Date:
  - `2026-04-02`
- Proposed target:
  - define the curated navigation map for the CVF repository front door
  - reduce noise before any later front-door content implementation or docs-mirror execution
- proposed outputs:
  - one canonical front-door navigation reference
  - one ring-based navigation model for current root entrypoints, guided docs, support surfaces, and private-core depth surfaces
  - one explicit rule for how `v1.0/` and `v1.1/` should remain visible without becoming first-click emphasis
- proposed change class:
  - `navigation-definition / publication-surface refinement`

## 2. Scope

- in scope:
  - define preferred root front-door entrypoints
  - define preferred guided next-click paths by reader type
  - define support vs private-core depth surfaces
  - align the front-door map with the existing docs-mirror boundary
- out of scope:
  - editing `README.md`, `START_HERE.md`, or `ARCHITECTURE.md`
  - public docs-mirror execution
  - package publication
  - root relocation

## 3. Source-Truth Context

- `P3/CP5` already concluded that `v1.0/` and `v1.1/` should remain visible frozen foundation anchors
- `P4/CP2` already defined the direct docs-mirror candidates, including the root front-door files
- `P4/CP3` and `P4/CP4` already defined the selective export-planning lane
- what remains ambiguous is the actual preferred reader path across the root front door and the initial docs zones

## 4. Current Navigation Reality

- `README.md` already acts as the main landing page
- `START_HERE.md` and `CVF_LITE.md` already act as shortened redirect-style entrypoints
- `ARCHITECTURE.md` already acts as the visual architecture front door
- `CVF_ECOSYSTEM_ARCHITECTURE.md` already provides a deeper structural checkpoint view
- however, these surfaces are not yet canonized as one intentional front-door map

## 5. Recommended Navigation Model

- Ring 1:
  - root front-door entry:
    - `README.md`
    - `START_HERE.md`
    - `ARCHITECTURE.md`
- Ring 2:
  - guided orientation by audience:
    - general evaluator
    - builder / integrator
    - non-coder / operator
    - architecture reader
- Ring 3:
  - support and context surfaces:
    - `CVF_LITE.md`
    - `CVF_ECOSYSTEM_ARCHITECTURE.md`
    - `CHANGELOG.md`
    - `LICENSE`
    - learning-zone docs
- private-core depth ring:
  - evidence-heavy, governance-heavy, or dense internal memory surfaces that should remain reachable but not first-click

## 6. Foundation Anchor Interpretation

- `v1.0/` and `v1.1/` should remain visible
- they should not be treated as first-wave public-navigation focal points
- curated front-door navigation is therefore the right reduction mechanism:
  - preserve historical truth
  - reduce accidental reader overload
  - avoid forced filesystem movement

## 7. Risk Assessment

- no curated front-door definition:
  - `MEDIUM`
  - front-door work remains ad hoc and may drift from the docs-mirror boundary
- curated front-door definition with no content rewrite yet:
  - `LOW`
  - clarifies the next implementation step without changing exposure posture
- immediate broad front-door rewrite without a navigation map:
  - `MEDIUM-HIGH`
  - risks duplicative entrypoints, stale links, and mixed public/private cues

## 8. Recommendation

- recommended outcome:
  - `APPROVE P4/CP5`
- rationale:
  - this is the minimum-risk step after `P4/CP4`
  - it completes the missing front-door planning output named by the roadmap
  - it stays consistent with `P3/CP5` and `P4/CP2`

## 9. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - this packet defines navigation only
  - it does not authorize front-door content rewrite, public mirror execution, or package publication
