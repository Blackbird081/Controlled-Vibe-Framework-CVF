# CVF Next-Move Freshness Checker Standard

Memory class: POINTER_RECORD

Status: ACTIVE

docType: reference_standard

Date: 2026-06-16

Owner: Codex

## Purpose

Define the bounded machine-check rule for active next-move freshness so a
current agent instruction surface cannot reopen work that active session state
already records as closed.

## Scope / Applies-To

Applies to current session continuity surfaces only:

- active generated state `nextAllowedMove`;
- active front-door `## Next Allowed Move`;
- active handoff `## Next Allowed Move`;
- active handoff startup acknowledgment.

It does not apply to archived handoffs or historical nested state-entry
`nextAllowedMove` provenance unless that text is promoted to a current surface.

## Rule

Active next-move surfaces must not instruct an agent to dispatch, redispatch,
open, execute, or treat as ready any target that current active session state
already records as `CLOSED_PASS` or `CLOSED_PASS_BOUNDED`.

## Current Surfaces

The machine checker must inspect only current instruction surfaces:

- `CVF_SESSION/ACTIVE_SESSION_STATE.json` top-level `nextAllowedMove`;
- `CVF_SESSION_MEMORY.md` section `## Next Allowed Move`;
- the active handoff section `## Next Allowed Move`;
- the active handoff startup acknowledgment.

Historical state-entry `nextAllowedMove` values are provenance and must not be
treated as active instructions unless promoted into the current top-level
surface.

## Required Behavior

The checker must:

- discover closed target labels from active session state records carrying
  `CLOSED_PASS` or `CLOSED_PASS_BOUNDED`;
- support common CVF target labels such as `RSF-T3`, `FPRC-T1`, `CCLV-T2`,
  `LHW24`, and `Model Gateway C-02 P2`;
- reject action wording such as dispatch, redispatch, ready, worker execute,
  may open, or next move when it targets a closed label;
- allow closed-target mentions that explicitly block or close the target, such
  as "do not redispatch", "already closed", or `CLOSED_PASS_BOUNDED`;
- split long next-move paragraphs into sentence fragments so a safe closure
  sentence cannot mask a later stale dispatch sentence.

## Non-Goals

This standard does not authorize runtime mutation, provider/API proof,
public-sync, legacy absorption, broad stale-roadmap scanning, or automatic
selection of the next roadmap. It only prevents current next-move surfaces from
reopening already closed targets.

## Epistemic Process Block

### Expected Result / Prediction

Current session surfaces should pass because RSF-T3 already remediated the
C-02 P2 pointer prose, while synthetic dispatch/open text for a closed target
should fail.

### Evidence Comparison

The checker run on current state returns zero violations. Focused tests show
closed-target dispatch, fresh-auth open wording, handoff next move, startup
acknowledgment, and long-line masking all fail in enforce mode.

### Contradiction Or Gap Disposition

No contradiction remains inside the bounded current-surface scope. Historical
roadmap or archived continuity scans remain outside this standard.

### Claim Update

The standard adds a current next-move freshness guard. It does not claim broad
historical roadmap reconciliation or runtime governance behavior.

## Verification

Verification boundary: local deterministic checker and unit tests only.

Final boundary: current next-move surfaces cannot action closed targets when
the checker runs. No provider, live, public-sync, production readiness, public
readiness, or Model Gateway implementation claim is made.
