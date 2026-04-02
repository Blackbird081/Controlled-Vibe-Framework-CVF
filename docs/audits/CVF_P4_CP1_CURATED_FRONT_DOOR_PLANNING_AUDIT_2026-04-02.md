# CVF P4 CP1 Audit - Curated Front-Door Planning

Memory class: FULL_RECORD

> Decision type: `GC-019` structural/publication-planning audit
> Pre-public phase: `P4`
> Date: `2026-04-02`

---

## 1. Proposal

- Change ID:
  - `GC019-P4-CP1-CURATED-FRONT-DOOR-PLANNING-2026-04-02`
- Date:
  - `2026-04-02`
- Proposed target:
  - open the first `P4` lane as planning-only work
  - translate the `P3/CP5` foundation-anchor pivot into a practical front-door/publication-boundary plan
- proposed outputs:
  - one curated front-door navigation map for future external readers
  - one docs-mirror boundary definition
  - one shortlist of selective public export candidates
  - one explicit rule that `v1.0/` and `v1.1/` remain visible private-core foundation anchors
- proposed change class:
  - `planning authorization / boundary definition`

## 2. Scope

- in scope:
  - planning for:
    - navigation curation
    - docs mirror boundaries
    - package/export boundary candidates
    - private-core-visible foundation-anchor policy
- out of scope:
  - any new physical relocation
  - any package publication
  - any public mirror creation
  - any public repository switch
  - any landing-path override for `P3/CP2`

## 3. Source-Truth Context

- `P3/CP2` already relocated the retained-internal pair under isolated execution
- `P3/CP3` and `P3/CP4` held further physical relocation and canonical landing assumptions
- `P3/CP5` then approved a strategy pivot:
  - `v1.0/` and `v1.1/` should remain visible frozen foundation anchors
  - safer reduction should move to `P4` navigation/docs-mirror/packaging curation
- the publication memo already ranks:
  - `PRIVATE_CORE + PUBLIC_DOCS_MIRROR`
  - and `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`
  - above `FULL_PUBLIC_MONOREPO`

## 4. Consumer Analysis

- internal maintainers need:
  - a stable private-core repository with minimal path churn
  - explicit front-door guidance so foundational roots stop looking like accidental clutter
- future external evaluators need:
  - a curated entry path that highlights the right surfaces without implying the whole monorepo is public-ready
- governance needs:
  - planning progress that does not silently become publication execution

## 5. Risk Assessment

- continuing without `P4` planning:
  - `MEDIUM`
  - the strategy pivot would remain conceptually correct but operationally underspecified
- opening `P4/CP1` as planning-only:
  - `LOW`
  - no filesystem, runtime, or publication state changes are required
- jumping directly to public mirror/package implementation:
  - `MEDIUM-HIGH`
  - would bypass the boundary-definition step and recreate the same ambiguity that `P3/CP4` exposed

## 6. Recommendation

- recommended outcome:
  - `APPROVE P4/CP1`
- rationale:
  - CVF now needs a boundary-definition step, not another relocation wave
  - `P4/CP1` gives the team a safe place to define front-door navigation, docs-mirror boundaries, and export candidates without changing private-core ownership
  - this is the minimum next step that turns `P3/CP5` from posture into executable planning truth

## 7. Guardrails

- `P4/CP1` authorizes planning only
- it does not authorize:
  - public mirror pushes
  - package publication
  - making `cvf-next` public
  - additional `P3` physical relocation
  - relaxing `GC-039`
- any later `P4` implementation packet must still carry its own bounded scope and evidence

## 8. Success Criteria

- canon explicitly states that `P4` is open for planning-only work
- canon explicitly states that `v1.0/` and `v1.1/` remain visible private-core foundation anchors
- canon explicitly states that public/noise reduction now flows through curated navigation and boundary definition

## 9. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - this packet opens the planning lane only
  - implementation remains separate future work
