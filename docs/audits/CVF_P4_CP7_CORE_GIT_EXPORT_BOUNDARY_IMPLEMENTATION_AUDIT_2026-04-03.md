# CVF P4 CP7 Core Git Export Boundary Implementation Audit — 2026-04-03

Memory class: FULL_RECORD
Status: approved audit packet for the first candidate-scoped export implementation under `P4`.

## Scope

- target exactly one shortlisted candidate:
  - `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI`
- formalize a root-barrel-first package surface
- keep `exportReadiness` unchanged at `NEEDS_PACKAGING`

## Source Truth Reviewed

- `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/package.json`
- `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/index.ts`

## Findings

1. `CVF_v3.0_CORE_GIT_FOR_AI` is the lowest-blast-radius shortlist member for the first implementation packet.
   - it already has a canonical root barrel
   - it does not require wildcard runtime exports
   - it does not require JSON/config asset surfacing

2. The candidate still lacked explicit package-surface metadata.
   - there was no declared `main`
   - there was no declared `types`
   - there was no explicit `exports` map
   - package contents were not bounded by a `files` allowlist

3. A root-barrel-first implementation is the safest first step.
   - it matches the shortlist packaging-boundary story
   - it avoids accidental direct-subpath promises
   - it keeps later subpath decisions separately governable

## Approved Changes

- add explicit manifest fields for:
  - `main`
  - `types`
  - `exports`
  - `files`
- add a package-local README that names the supported entry and non-goals
- add a package boundary test that locks the explicit surface
- preserve `exportReadiness: NEEDS_PACKAGING`

## Non-Goals

- no package publication
- no readiness uplift
- no widening to another shortlist member
- no docs-mirror execution

## Audit Result

`APPROVED`
