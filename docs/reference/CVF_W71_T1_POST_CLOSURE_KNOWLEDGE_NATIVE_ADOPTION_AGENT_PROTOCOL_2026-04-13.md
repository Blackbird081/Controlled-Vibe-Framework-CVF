# CVF W71-T1 Post-Closure Knowledge Native Adoption — Binding Agent Protocol

Memory class: POINTER_RECORD

## 1. Purpose

This document is binding guidance for any future agent working on `W71-T1 Post-Closure Knowledge Native Adoption`.

Its purpose is to reduce avoidable drift and force implementation to follow the intended order.

## 2. Required Reading Before Any Edit

Read these files first:

1. `docs/roadmaps/CVF_W71_T1_POST_CLOSURE_KNOWLEDGE_NATIVE_ADOPTION_ROADMAP_2026-04-13.md`
2. `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
3. `docs/reference/README.md`
4. `AGENT_HANDOFF.md`

If the agent has not read these four files, it should not begin implementation.

## 3. Non-Negotiable Boundaries

The agent must not:

- reopen PVV/API-key/provider lanes
- modify `/api/execute`
- change provider adapters
- widen sandbox posture
- perform storage migration
- invent new architecture theory unrelated to the absorbed knowledge packets
- promote draft material to canon without both doctrinal fit and implementation evidence
- claim "100% native" while leaving important posture or runtime ambiguity unresolved

If the task seems to require one of those changes, the correct action is to stop and state that the wave boundary has been exceeded.

## 4. Allowed Work

The agent may work only on:

- final posture classification for promoted `CVF ADDING NEW` and `Windows_Skill_Normalization` artifacts
- whitepaper / reference README / handoff alignment needed to remove uplift ambiguity
- bounded CPF / LPF / `cvf-web` alignment that makes the absorbed semantics clearly CVF-native
- test and build proof for the exact surfaces touched
- explicit closure of what remains `deferred by design`

## 5. Required Implementation Order

The agent must execute in this order:

1. classify posture for promoted artifacts
2. align whitepaper / README / handoff wording
3. identify the exact bounded code/runtime surfaces that still need native-adoption alignment
4. implement only those bounded changes
5. prove them with focused tests/build
6. write closure notes last

If the agent starts with code only, it is off track.
If the agent starts with wording only and never closes runtime ambiguity, it is also off track.

## 6. Required Native-Adoption Rule

Implementation must preserve all of the following:

- canon-native means posture is explicit, not implied
- governance-native means review/registry/diagnostic behavior uses the absorbed semantics as first-class policy inputs
- runtime-native means the bounded operational surfaces treat the absorbed semantics as normal CVF behavior, not an experimental sidecar
- quality-native means tests/build and docs/code/UI all tell the same story

The agent must not silently collapse these into "docs look cleaner now".

## 7. Required Proof Standard

At minimum, the agent must provide:

- explicit posture matrix for the important promoted artifacts
- direct proof for any touched bounded runtime surfaces
- a short explicit note naming what is now fully native
- a short explicit note naming what remains intentionally deferred

Claims like `fully native`, `100% part of CVF`, or `canonically adopted` are not acceptable without both documentation alignment and implementation evidence.

## 8. Required Questions To Close

The agent must answer these explicitly in the close-out:

1. Which promoted docs are now `canonical`?
2. Which promoted docs remain `reference appendix`?
3. Which items remain `deferred by design`?
4. Which bounded runtime/governance surfaces now count as official CVF-native behavior?
5. What exact ambiguity was removed by W71?

## 9. Required Test / Build Discipline

The smallest proving commands that cover touched surfaces must be used.

At minimum, if `cvf-web` external-asset governance surfaces are touched:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx vitest run src/app/api/governance/external-assets/prepare/route.test.ts src/app/api/governance/external-assets/register/route.test.ts src/app/api/governance/external-assets/retire/route.test.ts
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx tsc --noEmit
```

If UI or route behavior changes materially:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run test:run
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run build
```

If CPF or LPF helper surfaces are materially changed, the agent must run the smallest proving commands that cover those exact files instead of defaulting to unrelated full-suite churn.

## 10. Required Close-Out Format

The agent's final summary must state:

- which posture classifications changed
- which runtime/governance surfaces were aligned
- which files were changed
- which tests/build commands were run
- what was intentionally left deferred

If the agent did not touch code, it must say why code alignment was not needed.

## 11. Stop Conditions

The agent must stop and report instead of continuing if:

- the work requires reopening provider execution
- the work requires backend/storage redesign
- the work requires Docker/sandbox expansion
- the work turns into broad architecture invention rather than native adoption of already absorbed knowledge

## 12. Simple Rule

If the next action does not make the absorbed post-closure knowledge more clearly canonical, more clearly governed, more clearly operational, or more clearly evidenced as part of present CVF, it probably does not belong in `W71-T1`.
