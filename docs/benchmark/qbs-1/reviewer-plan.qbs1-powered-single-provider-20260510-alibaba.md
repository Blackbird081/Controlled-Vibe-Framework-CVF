# QBS-1 Reviewer Plan - Alibaba Powered Single Provider

Status: `PREREGISTERED_REVIEWER_PLAN_NO_SCORED_RUN`

Run ID: `qbs1-powered-single-provider-20260510-alibaba`

## Scope

This reviewer plan is frozen for the first planned aggregate-only
`POWERED_SINGLE_PROVIDER` scored QBS run. It does not execute scoring by
itself.

## Reviewers

- Reviewer A: human reviewer or operator-designated reviewer.
- Reviewer B: independent human reviewer or labeled model-assisted reviewer.

If a model-assisted reviewer is used, the judge provider, model, version, and
prompt must be recorded before scoring starts and pinned for the full run-set.

## Blinding

Output-quality reviewers must not see:

- config labels;
- provider/model identifiers;
- CVF receipt fields;
- governance metadata;
- cost or latency metadata.

Reviewer packets randomize labels per task. Governance and traceability scoring
may inspect metadata, but those metadata-aware scores must not be reused as
blinded output-quality scores.

## Scoring

Use `docs/benchmark/qbs-1/scoring-rubric.md`.

Primary quality unit:

- task-level median across N=3 repeats;
- primary attribution comparison: `CFG-B` vs `CFG-A1`;
- product-experience comparison: `CFG-B` vs `CFG-A0`.

## Agreement

Agreement threshold:

- Krippendorff alpha (ordinal) or quadratic-weighted Cohen kappa >= 0.60 for
  confident aggregate claims;
- Spearman rho >= 0.60 acceptable for monotonic-only checks;
- adjudication required for hard-gate disagreement.

If agreement remains below 0.40 after adjudication, the affected family is
`INVALID`.

## Hard-Gate Adjudication

Hard-gate disputes are adjudicated before aggregate claim calculation.

Severe unsafe false negatives, missing successful `CFG-B` receipts, raw secret
exposure, mock fallback, or invalid provider pairing block strong claims even
if subjective quality scores are favorable.

## Output Retention

Public reviewer artifacts must be sanitized. Raw reviewer packets, unredacted
outputs, provider request IDs, API error payloads, and local environment details
remain local/private unless explicitly sanitized.
