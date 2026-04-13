# CVF W68-T1 Governed Registry Hardening — Binding Agent Protocol

Memory class: POINTER_RECORD

## 1. Purpose

This document is binding guidance for any future agent working on `W68-T1 Governed Registry Hardening`.

Its purpose is to reduce avoidable drift, prevent scope widening, and force the implementation to follow the intended order.

## 2. Required Reading Before Any Edit

Read these files first:

1. `docs/roadmaps/CVF_W68_T1_GOVERNED_REGISTRY_HARDENING_EXECUTION_PLAN_2026-04-13.md`
2. `docs/reference/CVF_W67_T1_EXTERNAL_ASSET_GOVERNANCE_API_CONTRACT.md`
3. `AGENT_HANDOFF.md`

If the agent has not read these three files, it should not begin implementation.

## 3. Non-Negotiable Boundaries

The agent must not:

- modify `/api/execute`
- modify provider adapters
- reopen PVV/API-key/provider lanes
- widen external-asset semantics or add a new ingestion doctrine
- repurpose PVV evidence files as registry storage
- change sandbox posture

If the task seems to require one of those changes, the correct action is to stop and state that the wave boundary has been exceeded.

## 4. Allowed Work

The agent may work only on:

- registry write safety
- duplicate handling / idempotency behavior
- registry read/query/detail behavior
- bounded file persistence hardening
- canon/handoff alignment required by those changes

## 5. Required Implementation Order

The agent must execute in this order:

1. define duplicate/idempotency rule
2. implement write-path enforcement
3. add tests proving write-path enforcement
4. improve registry read/detail behavior
5. add tests for read/detail behavior
6. document local persistence posture
7. update handoff last

If the agent starts with UI cosmetics, it is off track.

## 6. Required Proof Standard

At minimum, the agent must provide:

- direct evidence of route behavior through tests
- direct evidence of helper behavior if `asset-registry.ts` changes materially
- a short explicit note describing duplicate policy
- a short explicit note describing persistence limitations

Claims like “safe”, “hardened”, or “idempotent” are not acceptable without direct test evidence.

## 7. Required Test Cases

The agent must cover these cases if relevant to the implemented change:

- repeat registration of the same logical asset
- malformed or unexpected persisted lines
- registry read when file is missing
- registry read when file contains multiple valid entries
- route refusal when write-safety rule is violated

If a case is intentionally not implemented, the agent must say so explicitly in the close-out.

## 8. Required Close-Out Format

The agent’s final summary must state:

- what duplicate/idempotency rule was adopted
- which files were changed
- which tests were run
- what was intentionally left out of scope

If docs or handoff were not updated, the agent must say why.

## 9. Stop Conditions

The agent must stop and report instead of continuing if:

- the work requires provider execution changes
- the work requires a new storage backend beyond bounded local MVP scope
- the requested change would force a new architecture wave rather than registry hardening

## 10. Simple Rule

If the next action does not make the governed registry more reliable, more reviewable, or more legible, it probably does not belong in `W68-T1`.
