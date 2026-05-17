# CVF Pre-Public Core Git Export Surface — 2026-04-03

Memory class: POINTER_RECORD
Status: canonical candidate-scoped implementation reference for `CVF_v3.0_CORE_GIT_FOR_AI` in the first-wave export lane.

## Purpose

- preserve the first concrete package-surface implementation for one shortlisted export candidate
- keep `CVF_v3.0_CORE_GIT_FOR_AI` smaller than a broad workflow/product promise
- document what is now explicit versus what is still deferred

## Canonical Entry Rule

Current explicit package entry:

- root barrel only:
  - `index.ts`

Current explicit package export map:

- `.` -> `./index.ts`

This means:

- consumers are guided through the root barrel first
- primitive families remain packaged because the root barrel depends on them
- direct subpath import promises are still deferred

## Primitive Families Included In Scope

- `ai_commit/`
- `artifact_staging/`
- `artifact_ledger/`
- `process_model/`
- `skill_lifecycle/`

## Packet Consequences

- package manifest now declares explicit `main`, `types`, `exports`, and `files`
- package README now names the supported root entry and the bounded primitive families
- package-level boundary tests now verify that the surface remains root-barrel-first

## Still Deferred

- `READY_FOR_EXPORT` uplift
- public package publication
- extra subpath exports
- release automation or release-channel claims

## Related Artifacts

- `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/package.json`
- `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/README.md`
