# CVF GC019 Public Sync CI Surface And Workflow Orchestration Review

Memory class: `FULL_RECORD`
Status: `ACCEPTED`

## Purpose

Record the structural review for the 2026-05-19 public-sync CI repair batch, including public-surface cleanup, raw/runtime artifact removal, static gate restoration, and workflow orchestration hardening.

## Target

- public repository clone: `Controlled-Vibe-Framework-CVF-public-sync`
- workflow surfaces under `.github/workflows/`
- static/public gate runners under `scripts/`
- governance guard surfaces under `governance/compat/` and `governance/toolkit/05_OPERATION/`
- tracked public-surface artifacts under `EXTENSIONS/` and `governance/skill-library/registry/external-sources/`

## Claim Boundary

This review covers non-live public CI structure and repository surface hygiene. It does not claim live provider governance behavior, release readiness, or output-quality parity.

## Source

The review is based on the local public-sync worktree after GitHub workflows exposed real failures in public-surface, static CI, file-size, and full web CI lanes.

## Scope

In scope:

- remove tracked raw `.jsonl` and raw external-source JSON artifacts from the public repo surface
- keep public-surface exceptions explicit in `governance/public-surface-manifest.json`
- add the missing static CI gate runner
- add a workflow orchestration guard for canonical CI routing
- keep `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts` under the governed file-size threshold
- repair GitHub workflow YAML structure that would block real CI parsing

Out of scope:

- live release proof
- broad F-1 output-quality tuning
- private provenance handoff or archive changes
- public claims that require provider-backed governance evidence

## Methodology

1. Reproduced local equivalents of the failed public gates.
2. Removed or allowlisted public-surface blockers according to the public manifest.
3. Added the missing static CI runner and routed static governance checks through it.
4. Added `CVF_WORKFLOW_ORCHESTRATION_GUARD.md` plus an automated compat checker.
5. Validated guard registry, guard authoring, YAML parse, file-size, public-surface, static CI, and full web test suite locally.

## Findings

- Existing guards were strong for registry, authoring, file size, public surface, and foundational surfaces.
- No existing guard directly enforced workflow orchestration as a single system contract.
- The right fix is a new meta-guard, not another duplicated workflow-local smoke list.
- The raw/runtime tracked artifacts were inappropriate for the public surface and removal is structurally acceptable when recorded here.

## Risk

Residual risk is limited to CI runtime variance on GitHub runners and older documentation workflow jobs that may expose legacy dependency or markdown lint issues outside this repair batch. The guarded CI orchestration path itself is now explicit and locally verified.

## Corrective Action

- Add `governance/compat/check_workflow_orchestration_guard.py`.
- Register `CVF_WORKFLOW_ORCHESTRATION_GUARD.md` in README and the core knowledge base.
- Wire the workflow guard into static CI and the local pre-push governance hook chain.
- Replace duplicated front-door smoke test lists in workflow YAML with the canonical static CI runner.
- Keep public-surface scanning tracked-file aware and explicit-manifest based.

## Decision

Accept the structural cleanup and workflow orchestration guard as the correct public-sync repair path. The public repository should now treat public-surface, static CI, web CI, and protected live release proof as a sequenced workflow rather than unrelated checks.

## Recommendation

After push, use GitHub Actions results to confirm the public workflows pass on the runner. If a later lane fails, fix that lane through the canonical runner or guard surface first, then update workflow YAML only for scheduling/install concerns.
