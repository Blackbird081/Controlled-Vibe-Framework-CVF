# CVF P4 CP2 Audit - Docs Mirror Boundary Definition

Memory class: FULL_RECORD

> Decision type: `GC-019` structural/publication-planning audit
> Pre-public phase: `P4`
> Date: `2026-04-02`

---

## 1. Proposal

- Change ID:
  - `GC019-P4-CP2-DOCS-MIRROR-BOUNDARY-DEFINITION-2026-04-02`
- Date:
  - `2026-04-02`
- Proposed target:
  - define the first concrete boundary for `PRIVATE_CORE + PUBLIC_DOCS_MIRROR`
  - make explicit that a future public docs mirror is a curated subset, not a mirror of the whole `docs/` tree
- proposed outputs:
  - a canonical docs-mirror boundary reference
  - explicit include / conditional / exclude zones for public docs curation
  - explicit retention of evidence-dense and governance-dense docs inside the private core
- proposed change class:
  - `boundary-definition / planning refinement`

## 2. Scope

- in scope:
  - root front-door files
  - `docs/` content classes
  - which docs zones can be mirrored directly
  - which docs zones require per-file review
  - which docs zones must stay private-core only
- out of scope:
  - actual mirror publication
  - code/package export planning
  - public repo creation
  - any filesystem relocation

## 3. Source-Truth Context

- the publication memo already ranks `PRIVATE_CORE + PUBLIC_DOCS_MIRROR` as the safest first publication model
- the multi-agent intake review explicitly flagged a mismatch:
  - `docs/` is classified `PUBLIC_DOCS_ONLY`
  - but the root contains dense internal records such as:
    - `docs/CVF_INCREMENTAL_TEST_LOG.md`
    - `docs/CVF_ARCHITECTURE_DECISIONS.md`
    - `docs/CVF_CORE_KNOWLEDGE_BASE.md`
- `P4/CP1` opened the planning lane for curated navigation and docs-mirror boundaries
- `P4/CP2` is therefore the next minimum-risk refinement

## 4. Boundary Analysis

- direct public-facing candidates already exist:
  - root front-door files:
    - `README.md`
    - `START_HERE.md`
    - `ARCHITECTURE.md`
    - `LICENSE`
    - `CHANGELOG.md`
    - `CVF_ECOSYSTEM_ARCHITECTURE.md`
    - `CVF_LITE.md`
  - learner/operator content zones:
    - `docs/guides/`
    - `docs/concepts/`
    - `docs/tutorials/`
    - `docs/case-studies/`
    - `docs/cheatsheets/`
  - concise docs-root guides:
    - `docs/GET_STARTED.md`
    - `docs/HOW_TO_APPLY_CVF.md`
    - `docs/VERSION_COMPARISON.md`
    - `docs/VERSIONING.md`
    - `docs/CHEAT_SHEET.md`
- conditional curation zone:
  - selected explanatory files under `docs/reference/`
  - these should be reviewed individually rather than mirrored wholesale
- private-core-only zones:
  - `docs/audits/`
  - `docs/reviews/`
  - `docs/baselines/`
  - `docs/logs/`
  - `docs/roadmaps/`
  - `docs/INDEX.md`
  - `docs/BUG_HISTORY.md`
  - `docs/CVF_INCREMENTAL_TEST_LOG.md`
  - `docs/CVF_ARCHITECTURE_DECISIONS.md`
  - `docs/CVF_CORE_KNOWLEDGE_BASE.md`
  - governance bootstrap / handoff surfaces outside `docs/`

## 5. Risk Assessment

- mirroring the whole `docs/` root:
  - `HIGH`
  - it would leak internal audit density and operational history
- curated subset boundary:
  - `LOW-MEDIUM`
  - still needs future implementation hygiene, but the boundary itself is legible and defensible
- leaving the boundary implicit:
  - `MEDIUM`
  - teams may incorrectly assume `PUBLIC_DOCS_ONLY` means “copy everything under `docs/`”

## 6. Recommendation

- recommended outcome:
  - `APPROVE P4/CP2`
- rationale:
  - this packet resolves the largest practical ambiguity in the docs-mirror model
  - it keeps the mirror strategy aligned with `private-by-default`
  - it reduces the risk of accidental public release of governance evidence and dense internal records

## 7. Success Criteria

- canon explicitly states that a future docs mirror is a curated subset, not the full `docs/` root
- canon explicitly defines:
  - direct mirror candidates
  - conditional per-file review zone
  - private-core-only exclusions
- canon keeps `v1.0/` and `v1.1/` visible in the private core without trying to solve their visibility through the docs mirror

## 8. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - this packet refines planning only
  - no publication or relocation action is authorized
