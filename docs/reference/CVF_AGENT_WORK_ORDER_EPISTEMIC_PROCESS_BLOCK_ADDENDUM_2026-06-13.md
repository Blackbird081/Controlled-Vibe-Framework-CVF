# CVF Agent Work Order Epistemic Process Block Addendum

Memory class: FULL_RECORD

Status: REFERENCE_ADDENDUM

docType: reference

Date: 2026-06-13

Owner: Codex

rawMemoryReleased=false

## Purpose

Provide the detailed FPC-T3-C04 Epistemic Process Block contract split out of
the canonical work-order template for maintainability.

The canonical template remains the entry point. This addendum preserves the
field contract without pushing that template past its governed file-size
threshold.

## Scope / Target / Owner Boundary

Applies to governed CVF work orders, worker returns, and completion reviews
that make evidence-heavy findings, claim updates, corpus analysis, source
verification, benchmark, or risk-model claims.

Owner boundary: this addendum defines document/checker structure only. It does
not authorize runtime/provider behavior changes, public-sync, registry edits,
OS audit, endpoint telemetry, semantic scoring, or autonomous mutation.

## Scope / Applies-To

Use this addendum when the canonical work-order template points to the
FPC-T3-C04 Epistemic Process Block. Mechanical and evidence-light work may use
the explicit NA escape with a reason.

## Epistemic Process Block

Use this block when a work order is high-evidence: findings, claim updates,
corpus analysis, source verification, benchmark results, risk-model changes, or
similar evidence-bearing outputs.

```text
## Epistemic Process Block

Epistemic Process Applicability: <HIGH_EVIDENCE | EVIDENCE_LIGHT | MECHANICAL | EPISTEMIC_PROCESS_NA_WITH_REASON: <reason>>

Expected Result / Prediction: <expected finding before execution>

Evidence Comparison Requirement: worker return compares actual evidence against the prediction.

Contradiction Handling Requirement: contradictory evidence requires a Contradiction Or Gap Disposition and claim-boundary update.

Claim Update Requirement: worker return records whether the claim was confirmed, revised, narrowed, or invalidated.
```

## Evidence Comparison

Worker returns and completion reviews for high-evidence work must compare actual
evidence against the expected result or prediction recorded before execution.

## Contradiction Or Gap Disposition

If evidence contradicts the expected result, the return packet must state the
contradiction, explain the gap, and update the claim boundary.

## Claim Update

The final packet must record whether the claim was confirmed, revised,
narrowed, or invalidated.

## Evidence-Light Escape

For evidence-light or mechanical work, use:

```text
Epistemic Process Applicability: EPISTEMIC_PROCESS_NA_WITH_REASON: <reason>
```

No semantic scoring, provider-quality judgment, or runtime-governance claim is
created by this block.

## Claim Boundary

This addendum proves only the reference structure for epistemic process packet
authoring. Verification is performed by
`governance/compat/check_epistemic_process_packet.py`.

The addendum does not prove claim truth, reasoning quality, provider output
quality, runtime governance behavior, public readiness, production readiness,
OS-level attribution, endpoint telemetry, or autonomous mutation safety.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance governance-control reference addendum. Public-sync is
not authorized by this tranche.
