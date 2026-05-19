# CVF Workflow Orchestration Guard

Memory class: `FULL_RECORD`
**Guard Class:** `META_GUARD`
**Status:** Active mandatory workflow orchestration rule for public CI and release gates.
**Applies to:** All humans and AI agents creating, deleting, or materially revising GitHub workflows, CI runners, public-surface checks, static gates, or release-gate runners.
**Enforced by:** `governance/compat/check_workflow_orchestration_guard.py`

## Purpose

- keep CI workflows thin, readable, and routed through canonical CVF runner scripts
- prevent repeated YAML-local test lists from drifting away from the actual governance gate
- make public-surface, static CI, full web CI, and live release proof feel like one system instead of separate islands

## Rule

Workflow files under `.github/workflows/` MUST call canonical runner surfaces for governed checks instead of embedding their own duplicate static-governance command lists.

Minimum orchestration contract:

1. public-surface workflow calls `scripts/check_public_surface.py`
2. static CI workflow calls `scripts/run_cvf_static_ci_gate.py --json`
3. protected live release workflow calls `scripts/run_cvf_release_gate_bundle.py --json`
4. the static CI runner includes public-surface, workflow-orchestration, build, typecheck, secret, docs-governance, and static governance/unit checks
5. local pre-push governance hook chain includes this workflow orchestration guard
6. static front-door test file lists live in the static CI runner, not in copied workflow YAML blocks

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_workflow_orchestration_guard.py`
- static CI enforcement runs through `scripts/run_cvf_static_ci_gate.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`

The guard intentionally checks command fragments rather than trying to become a general GitHub Actions linter. Its job is to protect the CVF orchestration contract: workflows may install dependencies and schedule jobs, but the governed check definitions stay in versioned runner scripts.

## Related Artifacts

- `.github/workflows/public-surface.yml`
- `.github/workflows/cvf-static-ci.yml`
- `.github/workflows/cvf-ci.yml`
- `.github/workflows/cvf-web-ci.yml`
- `.github/workflows/cvf-protected-live-release-gate.yml`
- `scripts/check_public_surface.py`
- `scripts/run_cvf_static_ci_gate.py`
- `scripts/run_cvf_release_gate_bundle.py`
- `governance/compat/run_local_governance_hook_chain.py`

## Final Clause

If CI logic is scattered, CVF is a collection of checks. If CI logic is routed, CVF becomes a system.
