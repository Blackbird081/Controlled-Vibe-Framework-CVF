# CVF System Unification Phase 1 Backlog

> Date: `2026-03-19`
> Parent roadmap: `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
> Source review: `docs/reviews/CVF_INDEPENDENT_SYSTEM_REVIEW_2026-03-19.md`
> Goal: Convert Phase 1 of the system unification roadmap into an implementation-ready backlog
> Timebox: `Weeks 2-4`
> Priority: `P0`

---

## 1. Phase 1 Mission

Phase 1 exists to close the most damaging source of system drift:

**CVF currently has more than one governance dialect in active use.**

The single mission of Phase 1 is:

- unify the canonical phase and guard model across backend channels
- make the shared contract tell the same truth as the hardened runtime
- remove the legacy `4-phase / 6-guard` default from active backend entrypoints

Phase 1 is successful when:

- backend-facing channels no longer disagree on core governance semantics
- shared engine, shared types, and backend adapters all point to one hardened default model
- legacy compatibility is still possible, but only through explicit normalization boundaries

---

## 2. Phase 1 Scope

### In Scope

- `CVF_GUARD_CONTRACT` type and factory unification
- backend-facing Web guard adapter alignment
- API validation surfaces that hardcode old phase/guard assumptions
- mandatory gateway and execution runtime alignment to the canonical model
- core tests that currently lock the legacy model in place

### Out Of Scope

- full non-coder UX redesign
- dashboard visual refresh
- full cross-extension workflow execution realism
- approval UX and freeze receipt UX
- README and product positioning rewrite

Those items belong to later phases of the parent roadmap.

---

## 3. Delivery Strategy

Recommended merge sequence for Phase 1:

1. `shared schema + factory unification`
2. `backend adapter and route alignment`
3. `runtime gateway/execution alignment + test closure`

Reason:

- shared schema must settle first
- backend adapters and routes should consume the new schema second
- runtime utilities and broader tests should lock the model after the public shape is stable

---

## 4. Work Package A — Shared Schema Unification

> Priority: `P0`
> Outcome: one canonical shared contract for phase, context, and default guard semantics

### A.1 Update Canonical Types

Primary files:

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts`

Tasks:

- replace legacy phase enum with canonical runtime phase model
- define explicit legacy alias handling policy in comments and type docs
- add shared context fields needed for hardened runtime parity, including:
  - `fileScope`
  - `metadata.ai_commit` or equivalent typed carrier for `ai_commit`
- ensure channel typing remains compatible with active entrypoints

Required decisions:

- canonical phase set should match hardened runtime, not Web legacy defaults
- legacy `DISCOVERY` should no longer be a canonical runtime phase

### A.2 Update Shared Constants

Primary files:

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts`

Tasks:

- update `PHASE_ORDER`
- update any helper constants or doc comments that still assert 4 phases
- verify default config comments still describe actual runtime behavior

### A.3 Test Lock

Primary files:

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/index.test.ts`

Tasks:

- replace tests that assume `6` canonical guards
- replace tests that assume `DISCOVERY` is a first-class canonical phase
- add at least one assertion that the shared contract matches the hardened default path

Exit criteria:

- shared types represent the canonical model
- tests fail if legacy 4-phase model is reintroduced as default

---

## 5. Work Package B — Shared Factory Unification

> Priority: `P0`
> Outcome: one shared default engine consistent with hardened runtime

### B.1 Update Shared Factory

Primary files:

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/index.ts`

Tasks:

- replace the legacy 6-guard factory with the hardened default set
- define canonical registration order
- ensure exports match the intended default guard set

### B.2 Review Guard Surface

Primary files:

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/index.ts`
- related exported guards and helper modules

Tasks:

- verify whether `AiCommitGuard` and `FileScopeGuard` should be re-exported from shared contract
- verify whether `ScopeGuard` stays as compatibility layer or remains first-class in default stack
- ensure public exports reflect actual intended support, not historical leftovers

### B.3 Factory Tests

Primary files:

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/index.test.ts`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/sdk/guard-sdk.test.ts`

Tasks:

- update guard count expectations
- update guard ID expectations
- add one integration-style test proving the shared factory blocks a modifying action without required audit metadata

Exit criteria:

- `createGuardEngine()` now means the hardened default path
- no active shared-factory test still describes the old factory as canonical

---

## 6. Work Package C — Backend Adapter And Route Alignment

> Priority: `P0`
> Outcome: backend Web/API surfaces consume the same canonical model as shared contract

### C.1 Guard Runtime Adapter Alignment

Primary files:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/guard-runtime-adapter.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/guard-runtime-adapter.test.ts`

Tasks:

- update phase normalization to canonical backend phases
- keep legacy aliases only as input normalization rules
- align defaults with canonical backend expectations
- propagate new context fields if required by hardened default guards

### C.2 Shared Engine Singleton Validation

Primary files:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/guard-engine-singleton.ts`

Tasks:

- confirm singleton uses the newly unified shared factory
- ensure no route-specific fallback recreates a legacy engine

### C.3 Guard Evaluation API Alignment

Primary files:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/guards/evaluate/route.ts`

Tasks:

- replace hardcoded valid phase list with canonical values
- align defaults and validation messaging
- include new context fields when relevant
- ensure route examples and docs reflect canonical model

### C.4 Execute Route Context Alignment

Primary files:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.test.ts`

Tasks:

- ensure build of guard context can supply hardened runtime requirements
- ensure route tests no longer indirectly depend on legacy guard assumptions
- add at least one regression test for canonical phase and guard behavior through the execute path

Exit criteria:

- backend Web routes no longer validate only the legacy model
- Web adapter is a normalization shell, not a second governance dialect

---

## 7. Work Package D — Runtime Utility Alignment

> Priority: `P0`
> Outcome: runtime helpers no longer carry legacy assumptions

### D.1 Mandatory Gateway

Primary files:

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/mandatory-gateway.ts`
- matching tests

Tasks:

- update default phase/risk assumptions if they no longer match canonical model
- propagate newly required context fields where possible
- ensure bypass list semantics are still intentionally narrow

### D.2 Agent Execution Runtime

Primary files:

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/agent-execution-runtime.ts`
- matching tests

Tasks:

- align intent parsing and pre-check context with canonical model
- ensure planning/runtime comments do not overstate execution completeness
- make sure runtime-generated contexts remain compatible with the hardened default engine

### D.3 Adapter Surfaces

Primary files:

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/adapters/vscode-governance-adapter.ts`
- matching tests

Tasks:

- verify all adapter entrypoints compile and test against the unified contract
- remove or update assumptions about legacy phase names

Exit criteria:

- runtime utility layer can operate on the canonical model without hidden legacy assumptions

---

## 8. Work Package E — Phase 1 Test Closure

> Priority: `P0`
> Outcome: tests become the lock on the new backend truth

### E.1 Minimum Required Tests

Shared contract:

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/index.test.ts`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/sdk/guard-sdk.test.ts`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/mandatory-gateway.test.ts`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/agent-execution-runtime.test.ts`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/adapters/vscode-governance-adapter.test.ts`

Web/backend adapter layer:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/guard-runtime-adapter.test.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.test.ts`
- add or update tests for `app/api/guards/evaluate/route.ts` if coverage is missing

### E.2 Required Assertions

At minimum, Phase 1 tests should prove:

- shared factory and backend adapter agree on canonical phase vocabulary
- shared factory no longer reports only 6 canonical guards
- legacy aliases are accepted only as inputs, not as canonical state
- guard evaluation route validates canonical phases correctly
- execute route builds contexts compatible with hardened backend expectations

### E.3 Regression List

Explicit regressions to prevent:

- reintroducing `DISCOVERY` as a canonical backend phase
- reintroducing 6-guard default semantics as the official shared model
- leaving Web backend routes validated against an outdated phase list

Exit criteria:

- tests encode the new truth strongly enough that legacy drift re-breaks CI

---

## 9. Implementation Notes

### Non-Goals For This Phase

Do not do these in Phase 1 unless required for compilation:

- rewrite non-coder copy in all UI surfaces
- redesign dashboard components
- add new workflow orchestration features
- add new agent autonomy features

### Compatibility Policy

Use this policy:

- canonical runtime model lives in shared contract and hardened runtime
- legacy values may be accepted at input boundaries temporarily
- legacy values must be normalized before entering core evaluation flow

### Documentation Rule

Only update docs that are required to avoid false statements introduced by Phase 1 changes.

Major narrative refresh belongs to the parent roadmap's later documentation phase.

---

## 10. Verification Commands

Recommended Phase 1 verification set:

```bash
# Shared contract
cd EXTENSIONS/CVF_GUARD_CONTRACT
npm test
npm run build

# Web platform targeted verification
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm test
npm run build

# Repo docs governance
cd ../../..
python governance/compat/check_docs_governance_compat.py --enforce
```

If test scope is too large for one pass, at minimum run targeted suites covering:

- shared contract factory/types/runtime
- Web guard adapter
- Web guard/execute API routes

---

## 11. Phase 1 Definition Of Done

Phase 1 is complete only when all statements below are true:

- `CVF_GUARD_CONTRACT` exposes the canonical governance model, not the legacy one
- `createGuardEngine()` represents the hardened default path
- backend Web/API adapter surfaces normalize legacy input but do not preserve legacy runtime semantics
- runtime helpers compile and test against the canonical model
- test suites lock the new backend model strongly enough to prevent regression

---

## 12. Recommended Commit Split

Use this split to keep review clean:

1. `refactor(guard-contract): unify canonical phase schema and default guard factory`
2. `fix(web-backend): align guard adapter and api routes with canonical governance model`
3. `test(governance): lock phase-1 unified backend semantics`

This split keeps code review readable and makes future reassessment much easier.
