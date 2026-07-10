# CVF Workspace Paid User Authoring Guide

Memory class: ACTIVE_REFERENCE

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-09

## Scope / Applies To

This guide applies to paid-user-safe local workspaces that need practical CVF
authoring discipline without importing private operator continuity state.

It is a workspace guide, not a full governance template. Project-local
`AGENTS.md`, `.cvf/manifest.json`, `.cvf/policy.json`, tests, and handoff files
remain the controlling project surfaces.

## Purpose

Give downstream agents a short authoring rule set that keeps useful CVF habits:

- state the target and boundary before editing;
- use project-local evidence, not chat memory, for claims;
- keep app code out of the hidden CVF core;
- run the smallest meaningful test or checker before claiming completion;
- leave a compact handoff when a task is not finished.

## Minimal Authoring Contract

| Step | Required behavior | Evidence |
|---|---|---|
| 1 | Read workspace rules, the active rule-pack guide, and the target project's agent instructions. | File paths read. |
| 2 | Confirm the target project folder and avoid editing the hidden CVF core unless the task is CVF maintenance. | `pwd` or equivalent path evidence. |
| 3 | Name the user-visible goal and the forbidden scope before implementation. | Short task note or handoff row. |
| 4 | Make the smallest coherent change that satisfies the goal. | Changed-file list. |
| 5 | Run the project-local test, lint, doctor, or validation command that best matches the change. | Command and result. |
| 6 | Update project handoff or workspace handoff only when continuity matters. | Handoff path or N/A reason. |

## Onboarding Flow

Use `docs/reference/CVF_WORKSPACE_PAID_USER_SAFE_ONBOARDING_FLOW.md` as the
setup checklist before relying on this authoring guide in a downstream
workspace.

The short version is:

1. refresh the workspace public core and wrapper set;
2. select the `paid-user-safe` rule-pack profile;
3. verify the active manifest;
4. create or refresh the downstream project;
5. run the workspace gate and the project-local checks.

## Boundary Rules

- Do not copy private operator continuity state into a customer or public
  workspace.
- Do not put downstream app code inside `.Controlled-Vibe-Framework-CVF/`.
- Do not claim hosted, production, legal, medical, financial, or live-provider
  readiness from a local docs or wrapper change.
- Do not treat this rule pack as a replacement for project tests.
- Do not keep stacking local commits; push or hand off a clean branch when a
  coherent change is ready.

## Recommended Completion Note

Use a short completion note shaped like this:

```text
Task: <goal>
Changed paths: <paths>
Verification: <command/result>
Boundary: <what was not changed or claimed>
Next: <none or exact next action>
```

## Claim Boundary

This guide provides paid-user-safe authoring guidance only. It does not import
private continuity state, implement runtime behavior, run provider proof,
publish a public artifact, or certify a downstream project.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this guide is currently distributed through local workspace rule-pack
selection. A later public-safe export can publish it separately if selected by
the operator.
