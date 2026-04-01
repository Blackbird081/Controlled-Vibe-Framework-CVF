# CVF Maintainability Standard

Memory class: POINTER_RECORD
Status: canonical maintainability standard for governed public surfaces, batch-contract implementation patterns, shared test builders, and canon-summary layering.

## Purpose

- keep CVF extensible without letting repeated tranche work collapse back into large hotspot files
- require reusable contract/test patterns once a family has stabilized
- preserve a clean split between summary canon and full evidence so active surfaces stay readable

## Applies To

This standard applies to:

- active package public barrels such as `EXTENSIONS/*/src/index.ts`
- barrel smoke tests such as `EXTENSIONS/*/tests/index.test.ts`
- governed CPF batch contracts and their dedicated tests
- canonical summary docs that guide future work:
  - `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
  - `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
  - `AGENT_HANDOFF.md`
  - `docs/INDEX.md`
  - active roadmap summary docs

## Core Rules

### 1. Public Surface Must Stay Thin

Package public barrels must act as routing surfaces, not implementation sinks.

Mandatory posture:

- `src/index.ts` should re-export domain barrels or other explicit public-surface modules
- logic, branching, hashing, and local helper implementations belong in owned modules, not in the package barrel
- when the public surface grows, split by stable domain and keep `index.ts` thin

### 2. Barrel Smoke Tests Must Stay Ownership-Clean

`tests/index.test.ts` exists to prove public-surface reachability and basic barrel smoke only.

It must not:

- re-own tranche-local behavioral coverage already covered by dedicated test files
- import local tranche contracts directly when the public barrel already exposes the intended surface
- grow back into a monolithic test sink after canonical splits were made

### 3. Stable Batch Families Must Use Shared Helpers

When a batch-contract family repeats the same maintainability-sensitive pattern across multiple tranches, new work must adopt shared helpers instead of cloning the pattern.

In CPF this includes:

- deterministic batch identity construction
- dominant-status / dominant-severity resolution
- shared batch-test fixtures and builders for repeated request / plan / result shapes

### 4. Dedicated Tests Must Prefer Shared Builders

When a fixture shape is used repeatedly across governed tests, the shape should move into a shared helper instead of being redefined in every file.

Default posture:

- add or extend a helper under `tests/helpers/`
- keep dedicated tests focused on behavior, not large object-construction noise
- if a test needs a one-off shape, keep it local only when it is truly tranche-specific

### 5. Canon Summary Must Stay Separate From Full Evidence

Summary canon should route the reader to the right evidence, not embed full typed evidence payloads inline.

Summary surfaces may:

- state tranche posture
- state aggregate metrics
- point to closure reviews, baselines, audits, and assessments

Summary surfaces must not:

- inline typed evidence fields such as `measurementId`, `traceId`, `reportId`, `reportHash`, `runId`, `runHash`, or detailed hash-level payloads
- silently stand in for the full evidence artifact that actually owns those fields

## Required Workflow

Before closing a maintainability refactor or opening adjacent continuation work:

1. split public hotspots if they exceeded their intended role
2. move stable repeated contract/test patterns into shared helpers
3. keep barrel smoke and dedicated ownership separate
4. verify canonical summary docs still summarize instead of absorbing evidence detail

## Related Controls

- `governance/toolkit/05_OPERATION/CVF_PUBLIC_SURFACE_MAINTAINABILITY_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_BARREL_SMOKE_OWNERSHIP_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_SHARED_BATCH_HELPER_ADOPTION_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_CANON_SUMMARY_EVIDENCE_SEPARATION_GUARD.md`

## Final Clause

CVF maintainability is a governed execution concern.

Once a cleaner shape exists, future work must preserve it by default.
