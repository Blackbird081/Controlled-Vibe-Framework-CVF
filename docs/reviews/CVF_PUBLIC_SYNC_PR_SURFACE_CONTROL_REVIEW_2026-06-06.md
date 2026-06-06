# CVF Public Sync PR Surface Control Review

Status: active public-sync guard compatibility review

## Purpose

Record the public-safe baseline for replacing operator-facing PR classification
checkboxes with an agent-owned publication record and for keeping private
provenance active-window traces out of the public repository.

## Target

Reviewed target:

- `.github/pull_request_template.md`
- `scripts/check_public_surface.py`
- `governance/public-surface-manifest.json`
- `governance/compat/check_active_window_registry.py`
- `governance/compat/check_conformance_trace_rotation.py`

## Scope

This review covers only public-sync publication controls and guard
compatibility for public omission of private provenance paths.

Out of scope:

- runtime governance behavior changes
- live provider proof
- private provenance export
- hosted, production, or public-readiness expansion
- user-facing manual classification decisions

## Methodology

Validation basis:

- inspect the PR template for user-facing checkbox choices
- run the public-surface scan
- run active-window and conformance-trace focused gates
- run focused regression tests for public-sync private-path omission
- run the local pre-push governance hook chain before publication

## Findings

Finding 1: the PR template previously exposed classification checkboxes to the
operator. That was a control-plane UX defect because public/private publication
classification should be resolved by agent-owned guards before push.

Finding 2: the public-sync guard chain inherited a private provenance active
trace requirement. That was correct for the private provenance workspace but
incorrect for the public repository because `docs/reviews/**` is
`PRIVATE_PROVENANCE_BLOCKED` unless explicitly allowlisted.

## Risk

Without this correction, a public PR could ask an operator to choose a
classification manually, or a future public-sync push could be tempted to
restore private review evidence only to satisfy a generic registry guard.

## Decision

Use an agent-owned PR publication record with explicit evidence lines instead
of checkboxes. Keep private provenance traces absent from public-sync when the
public-surface manifest blocks the path, while still requiring public guard
source files and scripts to exist.

## Verification

Required verification for this change:

- `python -m pytest governance/compat/test_check_active_window_registry.py governance/compat/test_check_conformance_trace_rotation.py -q`
- `python scripts/check_public_surface.py`
- `python governance/compat/check_active_window_registry.py --enforce`
- `python governance/compat/check_conformance_trace_rotation.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## Claim Boundary

This review is a public-safe structural control record only. It does not claim
runtime governance behavior, live provider behavior, production readiness,
hosted readiness, private provenance export, or benchmark quality improvement.
