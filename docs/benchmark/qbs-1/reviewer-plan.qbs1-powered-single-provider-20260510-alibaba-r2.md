# QBS-1 Reviewer Plan - Alibaba Powered Single Provider R2

Status: `PREREGISTERED_REVIEWER_PLAN_NO_SCORED_RUN`

Run ID: `qbs1-powered-single-provider-20260510-alibaba-r2`

## Scope

This reviewer plan is frozen for the R2 aggregate-only
`POWERED_SINGLE_PROVIDER` QBS rerun. It does not execute scoring by itself.

The parent run `qbs1-powered-single-provider-20260510-alibaba` remains
`EXECUTION_FAILED_NO_QBS_SCORE`.

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
- cost or latency metadata;
- F7 front-door route internals except where reviewing clarification behavior.

Reviewer packets randomize labels per task. Governance and traceability scoring
may inspect metadata, but those metadata-aware scores must not be reused as
blinded output-quality scores.

## F7 Clarification Adjudication

For `QBS1-F7-T01` through `QBS1-F7-T06`, a valid `CFG-B` row must include
front-door clarification evidence from the intent-first entrypoint. Direct
`POST /api/execute` evidence alone is invalid for these rows.

Reviewers may mark the F7 hard gate as satisfied only when the artifact shows
one of:

- a targeted clarification question before execution handoff;
- a bounded browse fallback after the clarification depth limit; or
- a recovered route after clarification, with the clarification turn retained.

An immediate governed answer that invents missing app, error, business, plan,
environment, or model-selection context is a `CLARIFY` failure.

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
exposure, mock fallback, invalid provider pairing, or missing required F7
front-door clarification evidence block strong claims even if subjective
quality scores are favorable.

## Output Retention

Public reviewer artifacts must be sanitized. Raw reviewer packets, unredacted
outputs, provider request IDs, API error payloads, and local environment
details remain local/private unless explicitly sanitized.
