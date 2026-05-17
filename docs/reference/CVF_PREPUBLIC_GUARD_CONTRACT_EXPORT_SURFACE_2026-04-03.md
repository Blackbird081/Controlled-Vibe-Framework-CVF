# CVF Pre-Public Guard Contract Export Surface — 2026-04-03

Memory class: POINTER_RECORD
Status: canonical candidate-scoped implementation reference for `CVF_GUARD_CONTRACT` in the first-wave export lane.

## Purpose

- preserve the first explicit public-surface tightening for `CVF_GUARD_CONTRACT`
- keep the candidate aligned to the shortlist packaging boundary instead of the broader internal runtime tree
- document what is in scope versus what stays deferred

## Canonical Entry Rule

Preferred entry:

- root barrel:
  - `src/index.ts`

Explicit subpaths currently allowed:

- `./types`
- `./engine`
- `./guards/*`
- `./runtime/agent-handoff`
- `./runtime/agent-coordination`

## Explicitly Out Of Scope

- wildcard runtime subpaths
- provider-specific runtime adapters under `src/runtime/providers/`
- `enterprise` subpath promises
- SQLite-backed audit persistence as a default contract surface

## Packet Consequences

- package manifest now removes the broad `./runtime/*` surface
- package manifest no longer publishes the `enterprise` subpath
- package README now explains the narrowed first-wave boundary
- package boundary tests now lock the exact allowed export map and package file envelope

## Still Deferred

- `READY_FOR_EXPORT` uplift
- public package publication
- provider/runtime support commitments beyond the two selected runtime helpers
- broader SDK, audit, adapter, or enterprise surfacing

## Related Artifacts

- `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `EXTENSIONS/CVF_GUARD_CONTRACT/package.json`
- `EXTENSIONS/CVF_GUARD_CONTRACT/README.md`
