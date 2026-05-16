# Web Governance Path

Memory class: POINTER_RECORD

Status: CURRENT PUBLIC WEB GOVERNANCE BOUNDARY

## Purpose

Clarify for evaluators and coder/dev readers what `cvf-web` is, what it
publicly claims to do, and what it does not claim, so they can evaluate the
web surface without conflating it with the whole CVF runtime.

## Scope

Public-facing claims about the `cvf-web` control surface, its supported user
actions, and its evidence boundary against live governance.

## Source

`cvf-web` is a control surface over CVF governance, not the whole CVF
runtime.

## Evidence

Publicly supported web claims:

- non-coder and operator UI can submit governed requests
- governance receipts are visible in the UI path
- protected release-gate job trigger exists
- provider key values are not intended to be displayed or committed

## Decision

`cvf-web` is treated as a control surface over governance, not a
replacement for governance enforcement. Live governance proof remains the
authoritative evidence for runtime behavior.

## Boundary

- UI mock checks prove layout/RBAC/navigation only.
- Governance behavior must cite live provider proof.

## Claim Boundary

This file claims only the listed public web actions, receipt visibility, and
mock-vs-live evidence boundary. It does not claim the web surface enforces
governance on its own, does not claim UI mock results as governance evidence,
and does not authorize publishing UI-only outcomes as governance proof.
