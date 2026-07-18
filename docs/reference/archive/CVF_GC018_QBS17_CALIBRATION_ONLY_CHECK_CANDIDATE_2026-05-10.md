# GC-018 Candidate - QBS17 Calibration-Only Check

Date: 2026-05-10

Status: `CLOSED_COMPLETE_NO_PUBLIC_QBS_CLAIM`

## Candidate

QBS-17 authorizes a calibration-only reviewer agreement check against the
QBS15/QBS16 calibration anchors and the QBS16 reviewer rubric addendum.

## Motivation

QBS16 produced a model-adjudicated reference and rubric addendum, but it did
not prove that the revised reviewer plan would produce stable future scoring.
Before R8 can be pre-registered, the reviewer plan needs a dry run against the
calibration anchors.

## Authorized Scope

- Implement a calibration-only reviewer agreement checker.
- Use live OpenAI and DeepSeek reviewer calls.
- Compare reviewer-to-reviewer agreement and reviewer-vs-QBS16-reference
  alignment.
- Publish the resulting public JSON and report.
- Keep all historical R5/R6/R7 scores unchanged.

## Explicit Non-Scope

- No live R8 benchmark run.
- No historical score mutation.
- No human gold-label claim.
- No L4/L5 public claim.

## Closure

Public commit:

`ccfee10 Publish QBS calibration-only agreement check`

Public status:

`QBS17_CALIBRATION_ONLY_CHECK_COMPLETE_NO_NEW_SCORE`

Outcome:

The calibration-only check failed overall. Inter-reviewer agreement passed, but
reviewer-vs-QBS16-reference alignment failed. R8 remains blocked.
