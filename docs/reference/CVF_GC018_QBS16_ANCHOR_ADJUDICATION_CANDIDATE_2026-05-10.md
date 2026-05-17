# GC-018 Candidate - QBS16 Anchor Adjudication

Date: 2026-05-10

Status: `CLOSED_COMPLETE_NO_PUBLIC_QBS_CLAIM`

## Candidate

QBS-16 authorizes adjudication of the QBS15 high-disagreement reviewer
calibration anchors and publication of a reviewer rubric addendum.

## Motivation

QBS15 produced calibration anchors but did not resolve them. Before another
live claim run, QBS needs adjudicated guidance for the highest-drift anchor
classes.

## Authorized Scope

- Use a third model adjudicator fallback when no human gold-label reviewer is
  available.
- Adjudicate QBS15 high-disagreement anchors.
- Publish adjudication JSON and reviewer rubric addendum.
- Keep historical R5/R6/R7 scores unchanged.

## Explicit Non-Scope

- No live R8 run.
- No historical score mutation.
- No human gold-label claim.
- No L4/L5 public claim.

## Closure

Public commit:

`fe93f00 Publish QBS anchor adjudication`

Public status:

`QBS16_ANCHOR_ADJUDICATION_COMPLETE_NO_NEW_SCORE`
