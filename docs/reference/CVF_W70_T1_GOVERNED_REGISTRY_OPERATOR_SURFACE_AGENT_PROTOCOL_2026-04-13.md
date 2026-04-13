# CVF W70-T1 Governed Registry Operator Surface — Binding Agent Protocol

Memory class: POINTER_RECORD

## 1. Purpose

This document is binding guidance for any future agent working on `W70-T1 Governed Registry Operator Surface`.

Its purpose is to reduce avoidable drift and force implementation to follow the intended order.

## 2. Required Reading Before Any Edit

Read these files first:

1. `docs/roadmaps/CVF_W70_T1_GOVERNED_REGISTRY_OPERATOR_SURFACE_EXECUTION_PLAN_2026-04-13.md`
2. `docs/reference/CVF_W67_T1_EXTERNAL_ASSET_GOVERNANCE_API_CONTRACT.md`
3. `AGENT_HANDOFF.md`

If the agent has not read these three files, it should not begin implementation.

## 3. Non-Negotiable Boundaries

The agent must not:

- modify `/api/execute`
- modify provider adapters
- reopen PVV/API-key/provider lanes
- change sandbox posture
- migrate registry storage to a new backend
- redesign lifecycle semantics already delivered in W69
- add new external-asset doctrine outside the bounded operator-surface scope

If the task seems to require one of those changes, the correct action is to stop and state that the wave boundary has been exceeded.

## 4. Allowed Work

The agent may work only on:

- `cvf-web` governance UI consumption of register/filter/detail/retire behavior
- lifecycle readability in the operator surface
- operator retire flow
- operator guidance for duplicate vs retire vs re-register behavior
- docs/handoff alignment required by those UI integrations

## 5. Required Implementation Order

The agent must execute in this order:

1. map current route contract to the current UI
2. implement filtered read / lifecycle display
3. prove filtered read / lifecycle display
4. implement retire action
5. prove retire action behavior
6. improve guidance/readability
7. update docs/handoff last

If the agent starts with visual polish and no contract usage, it is off track.

## 6. Required UI Rule

The UI must remain a consumer of server truth:

- prepare/register/retire routes remain authoritative
- the UI must not infer lifecycle/write decisions that contradict route responses
- operator affordances must reflect actual server capabilities

The agent must not silently invent local-only lifecycle behavior.

## 7. Required Proof Standard

At minimum, the agent must provide:

- direct evidence that route contract usage still passes
- direct evidence for any new operator-surface behavior if UI files changed materially
- a short explicit note describing what operator actions became possible
- a short explicit note describing what still remains out of scope

Claims like `usable`, `operable`, or `review-ready` are not acceptable without test/build evidence.

## 8. Required Test Cases

The agent must cover these cases if relevant to the implemented change:

- lifecycle state is visible for active vs retired entries
- filter behavior in the operator surface maps to route filters
- retire is only available for active entries
- retire success refreshes the visible state
- retire failure is surfaced clearly
- re-register guidance is present and does not imply in-place update

If a case is intentionally not implemented, the agent must say so explicitly in the close-out.

## 9. Required Close-Out Format

The agent’s final summary must state:

- which operator actions/visibility were added
- which files were changed
- which tests/build commands were run
- what was intentionally left out of scope

If docs or handoff were not updated, the agent must say why.

## 10. Stop Conditions

The agent must stop and report instead of continuing if:

- the work requires backend storage migration
- the work requires provider execution changes
- the work requires new lifecycle semantics beyond W69
- the work turns into a broad dashboard redesign unrelated to governed registry operations

## 11. Simple Rule

If the next action does not make the governed registry easier to operate, easier to review, or easier to understand from the existing UI without widening backend scope, it probably does not belong in `W70-T1`.
