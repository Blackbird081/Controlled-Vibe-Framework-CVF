# CVF P4 CP8 Guard Contract Export Boundary Tightening Audit — 2026-04-03

Memory class: FULL_RECORD
Status: approved audit packet for the second candidate-scoped export implementation under `P4`.

## Scope

- target exactly one shortlisted candidate:
  - `EXTENSIONS/CVF_GUARD_CONTRACT`
- tighten the package surface to match the approved first-wave boundary
- preserve `exportReadiness: NEEDS_PACKAGING`

## Source Truth Reviewed

- `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `EXTENSIONS/CVF_GUARD_CONTRACT/package.json`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/index.ts`

## Findings

1. `CVF_GUARD_CONTRACT` had a narrower root story than its manifest implied.
   - root barrel already centered the package on typed contracts, engine, explicit guards, and two runtime helpers
   - manifest still published wildcard runtime subpaths and an enterprise subpath

2. Wildcard runtime exposure was too broad for the first-wave boundary.
   - it could imply provider-specific runtime integrations were first-wave promises
   - it blurred the line between selected helpers and broader internal runtime support

3. Enterprise and audit-adjacent surfaces should remain deferred.
   - they are not part of the approved first-wave boundary
   - surfacing them now would widen support expectations without a separate decision packet

## Approved Changes

- replace wildcard runtime export with explicit helper subpaths
- remove the manifest-level `enterprise` export
- add a package-local README that names the allowed entrypoints and exclusions
- add package boundary tests that lock the narrowed export map and file envelope
- preserve `exportReadiness: NEEDS_PACKAGING`

## Non-Goals

- no readiness uplift
- no package publication
- no provider-specific runtime publication
- no runtime adapter, audit persistence, or enterprise support promise

## Audit Result

`APPROVED`
