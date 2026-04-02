# CVF Pre-Public P3 Readiness

Memory class: POINTER_RECORD
Status: current readiness reference that must be consulted before any `P3` structural relocation authorization.

## Purpose

- convert `P0-P2` from broad preparation into explicit `P3` readiness evidence
- close the known review gaps before any folder move is discussed as executable work
- preserve one canonical place that says what is ready, what still needs curation, and what still needs packaging

## Readiness Rule

`P3` must stay blocked unless all of the following remain true:

1. `P0`, `P1`, and `P2` are formally closed in `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json`
2. every visible root file is exposure-classified in `governance/compat/CVF_ROOT_FILE_EXPOSURE_REGISTRY.json`
3. every `PUBLIC_DOCS_ONLY` root declares an explicit public-content audit status
4. every `PUBLIC_EXPORT_CANDIDATE` extension declares an explicit export-readiness status
5. the publication decision memo still has a live re-assessment date
6. any future physical relocation wave executes on a dedicated `restructuring/p3-*` branch
7. any future physical relocation wave executes from a secondary git worktree, not the canonical `cvf-next` working tree

## Current Phase-Gate Status

- `P0`: `CLOSED`
- `P1`: `CLOSED`
- `P2`: `CLOSED`

Machine-readable source of truth:

- `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json`

## Root File Exposure Status

Root-level files are now separately classified from root directories.

Machine-readable source of truth:

- `governance/compat/CVF_ROOT_FILE_EXPOSURE_REGISTRY.json`

Implication:

- `README.md`, `LICENSE`, `ARCHITECTURE.md`, `CVF_LITE.md`, `START_HERE.md`, and `CVF_ECOSYSTEM_ARCHITECTURE.md` are treated as `PUBLIC_DOCS_ONLY`
- internal handoff, workflow scratch, and tool-facing root files remain `INTERNAL_ONLY`

## PUBLIC_DOCS_ONLY Root Audit

Current root audit posture:

- `docs`: `CURATION_REQUIRED`
- `public`: `CURATION_REQUIRED`

Meaning:

- these roots may participate in a later public docs mirror model
- they are **not** treated as “safe to mirror as-is”
- curation is still required because the current `docs/` tree contains internal-density surfaces such as incremental test logs, ADR history, and deep internal governance records

## PUBLIC_EXPORT_CANDIDATE Extension Readiness

Current readiness summary:

- `READY_FOR_EXPORT`: `0`
- `NEEDS_PACKAGING`: `13`
- `CONCEPT_ONLY`: `1`

Interpretation:

- `PUBLIC_EXPORT_CANDIDATE` means “possible candidate later”
- it does **not** mean the module is public-ready right now
- today, no extension should be treated as immediately exportable without separate packaging work

## Publication Decision Timeline

Publication decision memo:

- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`

Current re-assessment boundary:

- `Re-assessment-By: 2026-05-01`
- or earlier if a concrete `P3` authorization proposal is drafted before that date

## Current P3 Execution Note

Executed move set:

- `P3 / CP1` retired `CVF Edit/`, `CVF_Important/`, and `CVF_Restructure/` from the visible repo root
- governing packet chain:
  - `docs/audits/CVF_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_AUDIT_2026-04-02.md`
  - `docs/reviews/CVF_GC019_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_REVIEW_2026-04-02.md`
  - `docs/baselines/CVF_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_DELTA_2026-04-02.md`

## Required Next Step Before Any Further P3 Move

Before any further `P3` authorization:

- run `GC-019` structural audit/review for the proposed relocation wave
- run `GC-039` pre-public `P3` readiness guard
- confirm the target publication model that the relocation wave is trying to support
- execute on a dedicated branch matching `restructuring/p3-*`
- use a dedicated secondary worktree for that branch so relocation changes stay isolated from the canonical workspace

## Related Artifacts

- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- `docs/reviews/CVF_MULTI_AGENT_REBUTTAL_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- `docs/audits/CVF_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_AUDIT_2026-04-02.md`
- `docs/reviews/CVF_GC019_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_REVIEW_2026-04-02.md`
- `docs/baselines/CVF_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_DELTA_2026-04-02.md`
- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json`
- `governance/compat/CVF_ROOT_FILE_EXPOSURE_REGISTRY.json`

## Final Clause

Classification alone is not enough for relocation. `P3` requires explicit readiness truth.
