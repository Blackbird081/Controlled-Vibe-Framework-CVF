# CVF W69-T1 Governed Registry Lifecycle + Read Model — Binding Agent Protocol

Memory class: POINTER_RECORD

## 1. Purpose

This document is binding guidance for any future agent working on `W69-T1 Governed Registry Lifecycle + Read Model`.

Its purpose is to reduce avoidable drift and force the implementation to follow the intended order.

## 2. Required Reading Before Any Edit

Read these files first:

1. `docs/roadmaps/CVF_W69_T1_GOVERNED_REGISTRY_LIFECYCLE_READMODEL_EXECUTION_PLAN_2026-04-13.md`
2. `docs/reference/CVF_W67_T1_EXTERNAL_ASSET_GOVERNANCE_API_CONTRACT.md`
3. `AGENT_HANDOFF.md`

If the agent has not read these three files, it should not begin implementation.

## 3. Non-Negotiable Boundaries

The agent must not:

- modify `/api/execute`
- modify provider adapters
- reopen PVV/API-key/provider lanes
- change sandbox posture
- replace local JSONL persistence with a new backend
- mutate historical registry lines in place
- widen external-asset semantics outside the bounded registry lifecycle/read-model scope

If the task seems to require one of those changes, the correct action is to stop and state that the wave boundary has been exceeded.

## 4. Allowed Work

The agent may work only on:

- lifecycle status for governed registry entries
- retire / re-register behavior
- duplicate gate alignment with lifecycle state
- filtered registry list/read/detail behavior
- docs/handoff alignment required by those changes

## 5. Required Implementation Order

The agent must execute in this order:

1. define lifecycle rule
2. implement helper/storage semantics
3. add helper tests
4. implement route behavior
5. add route tests
6. add UI/readability adjustments only if the route contract requires them
7. update docs/handoff last

If the agent starts with UI cosmetics, it is off track.

## 6. Required Lifecycle Rule

Unless the agent can prove a contradiction, implementation must honor:

- `source_ref + candidate_asset_type` remains the logical identity key
- at most one active entry exists per logical identity
- retirement preserves history
- re-registration is allowed only after retirement of the prior active entry
- append-only storage remains append-only

The agent must not silently invent a different lifecycle model.

## 7. Required Proof Standard

At minimum, the agent must provide:

- direct helper-level tests for lifecycle semantics
- direct route-level tests for retire / duplicate / re-register behavior
- a short explicit note describing lifecycle status semantics
- a short explicit note describing any remaining MVP storage limitations

Claims like `operational`, `lifecycle-ready`, or `auditable` are not acceptable without direct test evidence.

## 8. Required Test Cases

The agent must cover these cases if relevant to the implemented change:

- active duplicate registration is refused
- active entry can be retired
- retired logical asset can be re-registered
- history remains inspectable after retirement + re-registration
- filtered reads by lifecycle status work
- filtered reads by `source_ref` work
- filtered reads by `candidate_asset_type` work
- malformed-line and missing-file behavior still do not break the registry

If a case is intentionally not implemented, the agent must say so explicitly in the close-out.

## 9. Required Close-Out Format

The agent’s final summary must state:

- what lifecycle rule was adopted
- which files were changed
- which tests were run
- what was intentionally left out of scope

If docs or handoff were not updated, the agent must say why.

## 10. Stop Conditions

The agent must stop and report instead of continuing if:

- the work requires a new backend or storage migration
- the work requires provider execution changes
- the work requires a broad redesign of external-asset preparation semantics
- the work would force historical-record mutation rather than append-only behavior

## 11. Simple Rule

If the next action does not make the governed registry more operable, more reviewable, or more auditable without widening scope, it probably does not belong in `W69-T1`.
