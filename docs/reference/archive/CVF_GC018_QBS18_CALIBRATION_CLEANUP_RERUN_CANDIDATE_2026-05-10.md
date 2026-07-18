# GC-018 Candidate - QBS18 Calibration Cleanup Rerun

Date: 2026-05-10

Status: `CLOSED_COMPLETE_NO_PUBLIC_QBS_CLAIM`

## Candidate

QBS-18 authorizes cleanup of QBS15/QBS16 calibration anchor references, rework
rubric normalization, and an immediate calibration-only rerun.

## Motivation

QBS17 restored inter-reviewer agreement but failed reviewer-vs-reference
alignment. The largest blocker was `QBS15-001`, where the visible anchor output
was empty while the QBS16 model-adjudicated reference scored it as high quality.
Rework labels also remained unstable.

## Authorized Scope

- Build a cleaned calibration reference without mutating QBS15/QBS16 history.
- Correct visible-output/reference conflicts.
- Normalize `REJECT`, `HEAVY`, `LIGHT`, and `NONE` rework semantics.
- Rerun calibration-only scoring with live OpenAI and DeepSeek reviewers.
- Publish public JSON/report artifacts and updated benchmark status.

## Explicit Non-Scope

- No live R8 benchmark run.
- No historical score mutation.
- No human gold-label claim.
- No L4/L5 public claim.

## Closure

Public commit:

`59d4a06 Publish QBS18 calibration cleanup rerun`

Public status:

`QBS18_CALIBRATION_ONLY_RERUN_PASS_NO_NEW_SCORE`

Outcome:

QBS18 passed the calibration-only reviewer-plan gate after cleaned-reference
rerun. No QBS score is claimed. The next track may freeze the reviewer plan and
pre-register a future R8 claim run.
