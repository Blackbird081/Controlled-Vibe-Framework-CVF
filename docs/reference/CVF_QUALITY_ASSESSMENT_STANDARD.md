# CVF Quality Assessment Standard
Memory class: POINTER_RECORD

> Status: canonical scoring standard for CVF tranche and architecture quality assessments
> Applies to: tranche closure reassessment, whitepaper-progress quality review, post-wave continuation review, and release-readiness quality snapshots
> Last reviewed: `2026-03-30`

## Purpose

- define one reusable quality rubric for CVF
- make quality scoring comparable across waves instead of ad-hoc opinion
- force every quality claim to cite governed evidence
- define what must happen when any score is too low

## Assessment Scope Rule

Every quality assessment must declare all of the following:

- scope being assessed
- cutoff date
- canonical source-of-truth set
- whether worktree-only changes are included or excluded
- latest verified checks actually run

Default rule:

- use canonically committed or currently verified governed artifacts only
- do not score from memory notes or private agent scratchpads
- if a dimension lacks enough evidence, score it lower and say why

## Scoring Dimensions

Use the same six dimensions every time.

| Dimension | Weight | What it measures |
|---|---:|---|
| Governance Discipline | `20%` | tranche control, guards, closure packets, authorization hygiene, continuity correctness |
| Contract / Architecture Quality | `20%` | boundary clarity, deterministic design, additive compatibility, source ownership, semantic coherence |
| Evidence and Traceability | `15%` | whether claims are backed by baseline deltas, reviews, tracker sync, hashes, IDs, and source truth |
| Test and Verification Confidence | `20%` | typecheck/test coverage, regression strength, deterministic checks, package-level verification |
| Maintainability | `15%` | file size discipline, fixture freshness, partition ownership, readability, drift resistance |
| Canonical Documentation Quality | `10%` | whitepaper/tracker/handoff/index/KB alignment and absence of stale contradictory truth |

Total score:

- weighted score out of `10`
- dimension scores must still be shown individually

## Scoring Bands

| Score | Band | Meaning |
|---|---|---|
| `9.0 - 10.0` | `EXCELLENT` | strong enough to trust with minimal follow-up |
| `8.0 - 8.9` | `STRONG` | high-quality, small non-blocking debt may remain |
| `7.0 - 7.9` | `GOOD WITH DEBT` | usable and defensible, but debt must be tracked explicitly |
| `6.0 - 6.9` | `FRAGILE` | quality concerns are material and need follow-up before expanding scope |
| `< 6.0` | `UNACCEPTABLE` | do not promote posture claims; remediation wave required |

## Mandatory Evidence Per Dimension

| Dimension | Minimum evidence |
|---|---|
| Governance Discipline | guard passes or explicit guard findings, authorization packet, closure review, handoff state |
| Contract / Architecture Quality | contract source, tranche review, compatibility notes, deterministic/hash behavior |
| Evidence and Traceability | baseline delta, review packet, tracker sync, provenance IDs, report hashes where applicable |
| Test and Verification Confidence | `npm run check` / `npm test` / relevant guard chain output actually rerun |
| Maintainability | file-size/test-partition posture, fixture drift status, active advisories or exceptions |
| Canonical Documentation Quality | whitepaper, tracker, handoff, and any changed reference docs aligned to the same truth |

## Low-Score Action Policy

If any dimension drops below threshold, action is mandatory:

| Condition | Required action |
|---|---|
| any dimension `< 6.0` | stop promotion claims for that scope; open remediation batch before further expansion |
| weighted total `< 7.0` | do not call the scope `STRONG` or `SUBSTANTIALLY DELIVERED` without explicit limitation note |
| Governance Discipline `< 8.0` | no new tranche on adjacent scope until continuity/guard issues are closed |
| Test and Verification Confidence `< 8.0` | rerun/expand verification before closure is considered stable |
| Canonical Documentation Quality `< 8.0` | whitepaper/tracker/handoff sync required in same batch |
| Maintainability `< 7.0` | open cleanup follow-up or record governed debt explicitly |

## Pre-GC-018 Quality-First Decision Gate

Before drafting or authorizing any fresh `GC-018` continuation packet, the proposer MUST read the current active quality assessment first and record one explicit decision:

- `REMEDIATE_FIRST`
- `EXPAND_NOW`

Default posture:

- if weighted total `< 8.0`, default to `REMEDIATE_FIRST`
- if any low-score action policy above is triggered, default to `REMEDIATE_FIRST`
- if the lowest-scoring dimension is directly adjacent to the proposed new tranche scope, default to `REMEDIATE_FIRST`

`EXPAND_NOW` is allowed only when the packet states all of the following:

- which active quality assessment was used
- the current weighted total and lowest dimension
- why expansion is still the higher-value move now
- which quality protections or same-batch cleanup commitments will prevent further drift

This gate exists to stop expansion-by-momentum when quality debt should be tightened first.

## Quality Lift Playbook

Use this table when a score is too low.

| Dimension | Typical cause | Quality lift action |
|---|---|---|
| Governance Discipline | stale handoff, weak guard enforcement, closure drift | add or strengthen guard, close sync gaps, normalize tracker/handoff in same batch |
| Contract / Architecture Quality | ambiguous ownership, leaky boundary, nondeterminism | tighten contract fields, remove hidden dependencies, add deterministic IDs and hashes |
| Evidence and Traceability | narrative claims without source proof | add baseline delta, review packet, provenance IDs, report hashes |
| Test and Verification Confidence | stale fixtures, missing regression, no package check | update fixtures to source truth, add regression tests, rerun typecheck and full suite |
| Maintainability | oversized files, mixed concerns, weak test partitioning | split files, refresh partition ownership, reduce exceptions, simplify fixtures |
| Canonical Documentation Quality | whitepaper/tracker/handoff mismatch | sync all continuity surfaces and record delta in same batch |

## Required Report Structure

Every new quality report should contain:

1. scope
2. evidence basis
3. weighted score table
4. strongest areas
5. weakest areas
6. open risks
7. required follow-up if any score is below target
8. canonical pointers

## Refresh Rule

- update the active quality assessment after each material reassessment wave
- if a tranche materially changes the quality posture, refresh the report in the same batch
- archive old snapshots only when a newer canonical quality report supersedes them
