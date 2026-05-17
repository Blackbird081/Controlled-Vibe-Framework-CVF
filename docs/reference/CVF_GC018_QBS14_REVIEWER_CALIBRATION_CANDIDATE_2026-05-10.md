# GC-018 Candidate - QBS14 Reviewer Calibration

Date: 2026-05-10

Status: `CLOSED_COMPLETE_NO_PUBLIC_QBS_CLAIM`

## Candidate

QBS-14 authorizes reviewer drift analysis across R5, R6, and R7, plus a public
calibration plan before any future QBS claim run.

## Motivation

QBS-13 R7 did not improve reviewer agreement or aggregate quality delta after
QBS-12 remediation. The next responsible step is to stop live reruns and
calibrate the scoring method before another pre-registered run.

## Authorized Scope

- Analyze R5/R6/R7 reviewer drift and per-reviewer scoring bias.
- Publish a reproducible diagnostic script and JSON artifact.
- Publish a no-score reviewer calibration plan.
- Update public QBS status without changing historical scores.

## Explicit Non-Scope

- No live R8 run.
- No mutation of R5/R6/R7 scored artifacts.
- No L4/L5 public claim.
- No raw API key or unredacted provider log publication.

## Closure

Public commit:

`5fef21b Publish QBS reviewer drift analysis`

Public status:

`QBS14_REVIEWER_CALIBRATION_REQUIRED_NO_NEW_SCORE`
