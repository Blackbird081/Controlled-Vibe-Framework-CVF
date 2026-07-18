# GC-018 Candidate - QBS15 Reviewer Calibration Anchors

Date: 2026-05-10

Status: `CLOSED_COMPLETE_NO_PUBLIC_QBS_CLAIM`

## Candidate

QBS-15 authorizes creation of a fixed reviewer calibration anchor set from
R5/R6/R7 scored artifacts and updates future reviewer scoring to accept
explicit calibration inputs.

## Motivation

QBS-14 showed that reviewer agreement instability blocks further claim runs.
The next control is to create reproducible calibration anchors before any R8
pre-registration.

## Authorized Scope

- Build deterministic calibration anchors from existing public scored artifacts.
- Include high-disagreement and consensus-reference examples.
- Update the reviewer scoring script to optionally include calibration anchors
  and explicit prompt-version metadata.
- Publish public no-score anchor documentation.

## Explicit Non-Scope

- No live benchmark run.
- No third-reviewer or human adjudication yet.
- No mutation of historical R5/R6/R7 scores.
- No L4/L5 public claim.

## Closure

Public commit:

`53462f7 Publish QBS reviewer calibration anchors`

Public status:

`QBS15_REVIEWER_CALIBRATION_ANCHORS_READY_NO_NEW_SCORE`
