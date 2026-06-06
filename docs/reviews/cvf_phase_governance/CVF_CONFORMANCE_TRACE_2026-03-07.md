# CVF Conformance Trace

Memory class: FULL_RECORD

Status: ACTIVE WINDOW POINTER

## Purpose / Decision / Baseline

Provide the public-safe active conformance trace path required by the active
window registry.

## Source / Predecessor Evidence

Source registry: `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`.

Predecessor guard:
`governance/toolkit/05_OPERATION/CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md`.

## Scope

This public pointer preserves the active-window path only. It does not expose
private provenance trace detail.

## Findings / Position

The active window registry expects this path to exist so rotation and archive
guards can distinguish active trace windows from ordinary historical review
artifacts.

## Risk / Corrective Action

Risk: if the path is missing, the public hook chain reports active-window
registry drift.

Corrective action: keep this public-safe pointer at the active path until a
governed rotation updates the registry and guard together.

## Evidence / Verification

Verification surface:

- `governance/compat/check_active_window_registry.py --enforce`
- `governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## Decision / Recommendation / Disposition

Disposition: retain this public-safe pointer as the active conformance trace
window until a governed rotation updates the active-window registry.

## Archive Index

No public conformance trace archives are currently published in this
public-sync branch.

## Claim Boundary

This pointer proves only that the public active-window path exists. It does not
prove private conformance trace completeness, runtime behavior, provider
behavior, hosted readiness, production readiness, public readiness, or
autonomous mutation.
