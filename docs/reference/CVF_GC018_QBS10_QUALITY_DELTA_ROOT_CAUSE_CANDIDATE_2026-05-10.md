# GC-018 Candidate - QBS10 Quality Delta Root Cause

Date: 2026-05-10

Status: `CLOSED_COMPLETE`

## Candidate

QBS-10 investigates the QBS-9 negative quality delta and authorizes a bounded
remediation for user-facing governed stop output.

## Motivation

QBS-9 passed model-assisted reviewer agreement, but `CFG-B` scored below direct
baselines. The root-cause pass found that high-risk and ambiguous non-coder
families were being governed correctly but returned empty or too-terse primary
outputs on non-ALLOW decisions.

## Authorized Scope

- Add deterministic user-facing output for `/api/execute` `BLOCK`,
  `CLARIFY`, and `NEEDS_APPROVAL` states.
- Improve `/api/qbs/front-door-clarification` output shape for weak-confidence
  prompts.
- Add targeted tests for these non-ALLOW output contracts.
- Publish public root-cause/remediation documentation with no new score claim.

## Explicit Non-Scope

- No policy relaxation.
- No direct provider call changes.
- No new QBS score.
- No L4/L5 public claim.
- No modification of historical QBS-9 reviewer artifacts.

## Closure

Closed by public commit:

`57fd8c3 Improve QBS governed stop outputs`

Closure state:

`QBS10_REMEDIATION_COMPLETE_NO_NEW_SCORE`
