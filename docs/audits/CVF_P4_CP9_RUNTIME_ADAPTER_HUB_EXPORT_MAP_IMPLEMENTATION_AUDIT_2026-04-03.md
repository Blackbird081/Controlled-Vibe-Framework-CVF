# CVF P4 CP9 Runtime Adapter Hub Export Map Implementation Audit — 2026-04-03

Memory class: FULL_RECORD
Status: approved audit packet for the third candidate-scoped export implementation under `P4`.

## Scope

- target exactly one shortlisted candidate:
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
- add canonical root entrypoint and explicit export map
- keep `exportReadiness: NEEDS_PACKAGING`

## Source Truth Reviewed

- `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/package.json`
- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/README.md`

## Findings

1. The candidate matched shortlist intent, but still lacked the core packaging primitives.
   - root package manifest existed
   - no canonical root `index.ts` barrel existed
   - no explicit package `exports` map existed

2. Explicit export naming is necessary for this package more than for the other shortlist members.
   - adapter capability levels vary materially
   - JSON risk assets are part of the package story, but should be named explicitly
   - wildcard export patterns would blur capability and asset promises

3. A root-barrel-first implementation with named asset subpaths is the safest first-wave move.
   - it gives a stable default entry
   - it keeps secondary surfaces explicit
   - it avoids widening beyond the approved shortlist boundary

## Approved Changes

- add root `index.ts` barrel
- add explicit `exports` map
- add bounded `files` allowlist
- name each JSON risk-model asset explicitly
- add package-local README and package boundary tests
- preserve `exportReadiness: NEEDS_PACKAGING`

## Non-Goals

- no readiness uplift
- no public package publication
- no wildcard export surface
- no capability flattening across adapters

## Audit Result

`APPROVED`
