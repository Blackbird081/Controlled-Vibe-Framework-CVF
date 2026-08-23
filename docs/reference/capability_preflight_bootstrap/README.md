# Capability Preflight Bootstrap

Memory class: POINTER_RECORD

Status: ACTIVE_INDEX

## Purpose

This folder owns durable CVF reference material for capability-environment
preflight and bootstrap boundaries. Runtime code remains in its existing
script or package owner; this folder does not grant execution authority.

## Current Surfaces

- `CVF_CAPABILITY_PREFLIGHT_OWNER_RECONCILIATION_CONTRACT.md` maps the
  mixed-origin candidate fields to existing CVF owners, explicit gaps, and
  rejected or parked lanes.
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/controlled-acquisition.contract.ts`
  is the absorbed RSPB-AI-T3 contract kernel for deterministic plan digests,
  exact approval binding, fail-closed authorization, receipt reconciliation,
  and bounded repair-stop decisions. It is pure decision logic and cannot
  download, install, mutate, roll back, or invoke a provider.
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/capability-route-readiness.contract.ts`
  is the absorbed RSPB-AI-T4 evidence kernel for two-stage route escalation,
  material-authority ambiguity, explicit rationale/fallbacks, and fail-closed
  readiness precedence. Route and READY outputs remain evidence only and
  expose literal `executionAuthorized: false`.
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/capability-case-evidence-projection.contract.ts`
  is the absorbed RSPB-AI-T5 projection kernel. It composes T3 acquisition and
  T4 route/readiness evidence into deterministic, traceable, secret-safe case
  projections while preserving literal `PROJECTION_ONLY` authority and no
  execution or mutation grant.

## Scope / Applies To

Applies to owner reconciliation, bounded environment-snapshot design,
projection-only capability-case evidence, and future work orders that enrich
the existing CVF runtime doctor.

## Claim Boundary

The read-only snapshot seam is implemented in the existing
`scripts/cvf_doctor.py` owner. The controlled-acquisition contract kernel is
runtime-testable in Guard Contract. Route/readiness evidence is also
runtime-testable there, and the case/evidence projection seam is
runtime-testable there, but no candidate router or transport was imported.
Any executor and any actual
acquisition, mutation, credential, network, provider, public-sync, deployment,
or production action remain separately governed.
