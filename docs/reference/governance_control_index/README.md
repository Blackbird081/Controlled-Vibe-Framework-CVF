# CVF Governance Control Index Front Door

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-07

## Purpose

Provide the stable front door for CVF governance-control lifecycle management.
This directory is the official place to start when a future packet needs to
ask whether a governance control should remain active, move to watch, become a
consolidation candidate, become a retirement candidate, or stay protected.

The paired index is:

`docs/reference/governance_control_index/CVF_GOVERNANCE_CONTROL_INDEX.md`

## Scope / Applies To

Applies to governance controls that affect CVF's operating cost, evidence
burden, safety boundary, or review ceremony. This includes standards, guard
families, hook phases, checker families, reference registries, Fast Lane
routing, public/provenance boundary controls, and session-continuity controls.

This front door does not apply to runtime product features, public-sync
content, provider certification, production Memory/RAG, private generated
outputs, or use-case/legal workflow release decisions except when those lanes
create or modify governance controls.

## Reading Order

1. Read this README.
2. Read `CVF_GOVERNANCE_CONTROL_INDEX.md`.
3. For owner/class details, read `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`.
4. For task-first guard routing, read `docs/reference/guard_orientation/README.md`.
5. For storage/citation class, read `docs/reference/CVF_REFERENCE_ARTIFACT_INDEX.md`.

## Operating Rule

Future governance-control work should classify the affected control family in
the Governance Control Index before proposing new controls, broadening existing
controls, deleting controls, or consolidating controls. When the index lacks a
row for the affected family, the future packet should add or update the index
first, then perform any narrower implementation in a separate authorized
tranche.

## Claim Boundary

This README is a navigation front door only. It does not implement a checker,
change hook catalogs, delete or disable any control, mutate public-sync, run
provider/live proof, authorize runtime/source/test/checker edits, or make
public/production claims.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference front door for governance-control
lifecycle management. Public export requires a separate public-safe summary
and operator authorization.
