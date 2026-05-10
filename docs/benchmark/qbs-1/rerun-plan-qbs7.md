# QBS-7 Rerun Pre-Registration Plan

Status: `QBS7_RERUN_PREREGISTERED_NO_SCORED_RUN`

QBS-7 creates a new pre-registration packet for the first rerun candidate after
QBS-5 failed hard gates and QBS-6 remediated bounded runtime causes. QBS-7 does
not run a new benchmark and does not publish a QBS score.

## Parent Evidence

- Failed parent run:
  `docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba/`
- Runtime remediation:
  `docs/benchmark/qbs-1/hard-gate-remediation-qbs6.md`
- New rerun run ID:
  `qbs1-powered-single-provider-20260510-alibaba-r2`
- Required pre-registration tag:
  `qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r2`

## Rerun Decision

The corpus remains
`qbs1-powered-single-provider-corpus-v1-2026-05-10`. The F7 expected decision
remains `CLARIFY`.

The rerun contract changes only the valid `CFG-B` entrypoint for F7 ambiguous
non-coder prompts:

- non-F7 `CFG-B`: `POST /api/execute`;
- F7 `CFG-B`: intent-first front door plus clarification loop before any
  execute handoff can count as valid governed evidence.

This treats the QBS-5 F7 failure as a benchmark entrypoint mismatch, not as an
invitation to make `/api/execute` guess missing user context.

## Required F7 Evidence

For `QBS1-F7-T01` through `QBS1-F7-T06`, public sanitized artifacts must show
that the run used the front-door clarification path with:

- `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true`;
- `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true`;
- weak-confidence routing with no guessed target; and
- either a targeted clarification question, a recovered route after
  clarification, or a bounded browse fallback after the clarification depth
  limit.

Direct `/api/execute` rows for F7 do not satisfy this R2 pre-registration.

## No-Score Boundary

Allowed:

- cite QBS-7 as a frozen rerun pre-registration;
- cite QBS-6 as bounded hard-gate remediation;
- cite QBS-5 as failed/no-score execution evidence.

Not allowed:

- claim a public QBS score;
- claim L4/L5/L6;
- claim family-level benchmark performance;
- claim provider parity;
- change or overwrite the QBS-5 failed result.

## Next Gate

A future QBS-8 track may run the live R2 rerun only after explicit operator
authorization for cost, credentials, stop conditions, and reviewer readiness.
