# CVF Governance Runtime Remediation Roadmap

> Date: `2026-03-19`
> Source review: `docs/reviews/archive/CVF_INDEPENDENT_UPDATE_REVIEW_2026-03-19.md`
> Goal: Fix all independently identified governance runtime gaps
> Scope: Governance runtime, SDK wiring, conformance, orchestrator, and regression coverage
> Priority: `P0-P2`
> Execution update: Remediation batch completed on `2026-03-19`; verification recorded in `docs/baselines/CVF_GOVERNANCE_RUNTIME_REMEDIATION_DELTA_2026-03-19.md`

---

## 1. Objective

This roadmap closes the 4 unresolved issues identified in the independent review:

1. `ai_commit` declared mandatory but not enabled in default runtime path
2. 5-phase model not enforced end-to-end in orchestrator runtime
3. `fileScope` added in request context but not actually enforced
4. `AiCommitGuard` read-only detection vulnerable to substring-based false exemption

Target outcome:

- default runtime reflects declared governance policy
- orchestrator and guards use the same phase model
- file access controls enforce both protected zones and explicit file scope
- bypass-style string edge cases are covered by regression tests

## 1A. Execution Status Update

Status after remediation batch on `2026-03-19`:

- Workstream A — `COMPLETED`
- Workstream B — `COMPLETED`
- Workstream C — `COMPLETED`
- Workstream D — `COMPLETED`
- Workstream E — `COMPLETED`
- Workstream F — `COMPLETED`

Verification outcome:

- `npm test` -> `506/506` passed
- `npm run build` -> pass

Baseline receipt:

- `docs/baselines/CVF_GOVERNANCE_RUNTIME_REMEDIATION_DELTA_2026-03-19.md`

---

## 2. Current Gap Summary

| Finding | Severity | Current State | Required End State |
|---|---|---|---|
| Mandatory `ai_commit` not wired by default | High | Only active in isolated manual tests | Registered in default runtime presets and conformance path |
| 5-phase model incomplete in runtime | High | Guards speak 5 phases, orchestrator still runs legacy 4-phase + aliases | Orchestrator exposes real `INTAKE` and `FREEZE` runtime states |
| `fileScope` not enforced | Medium | Guard checks protected paths only | Guard rejects target files outside explicit allowed scope |
| `AiCommitGuard` false read-only exemptions | Medium | Uses loose substring matching | Uses tokenized or intent-safe matching with regression tests |

---

## 3. Execution Order

Implementation should follow this order:

1. Fix `AiCommitGuard` classification logic first
2. Wire `AiCommitGuard` and `FileScopeGuard` into default runtime/SDK exports
3. Update conformance and SDK tests to match hardened default behavior
4. Refactor orchestrator to real 5-phase runtime
5. Enforce `fileScope` semantics and add negative-path regression tests
6. Update docs, changelog, audit log, and baseline references only after runtime behavior is true

Reason for this order:

- runtime wiring should not happen before the bypass bug in `AiCommitGuard` is fixed
- conformance should be updated only after default wiring is stable
- orchestrator refactor is broader and should happen after guard-level hardening is safe

---

## 4. Workstream A — Mandatory Guard Wiring

> Priority: `P0`
> Goal: Make declared mandatory guards actually mandatory in default runtime behavior

### A.1 Runtime Registration

Tasks:

- update SDK preset registration to include `AiCommitGuard`
- decide whether `FileScopeGuard` belongs in `core` or `full`
- keep legacy `ScopeGuard` temporarily only if needed for backward compatibility
- define explicit guard order so `ai_commit` runs before mutation/scope checks

Target files:

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/sdk/cvf.sdk.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/index.ts`

Deliverables:

- default preset registers hardened guard set
- public exports expose `AiCommitGuard` and `FileScopeGuard`
- guard count expectations updated in SDK tests

### A.2 Mandatory Guard Invariant

Tasks:

- add a startup/runtime invariant test that every guard in `MANDATORY_GUARD_IDS` is present in default runtime preset
- add one integration test that proves default SDK path blocks modifying action without `ai_commit`
- add one integration test that proves public default path is aligned with declared mandatory list

Target files:

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/sdk.test.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/guard.runtime.test.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/v1.1.3.hardening.test.ts`

Exit criteria:

- `CvfSdk.create()` blocks modifying actions without `ai_commit`
- default preset tests fail if `ai_commit` is accidentally removed later

Risks:

- existing scenarios relying on 6-guard default may fail
- downstream adapters may need to supply `metadata.ai_commit`

Mitigation:

- update adapter normalization layer to inject or require `ai_commit` for modifying actions
- keep migration notes in docs

---

## 5. Workstream B — `AiCommitGuard` Bypass Fix

> Priority: `P0`
> Goal: Remove false exemptions before enabling `ai_commit` by default

### B.1 Read-only Action Classification Redesign

Tasks:

- replace loose `includes()` matching with safer matching strategy
- preferred approach: normalize action into tokens or operation intents
- separate read-only verbs from payload/file names
- ensure `"modify README.md"` is treated as modifying, not read-only
- ensure strings like `"thread triage"` do not match `read`

Target files:

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/guards/ai.commit.guard.ts`

Recommended implementation rule:

- read-only classification should trigger only when the normalized action verb or leading intent is in an allowlist
- filename substrings must not influence intent classification

### B.2 Regression Coverage

Add tests for:

- `modify README.md` -> must require `ai_commit`
- `create thread summary` -> should not become read-only because of `thread`
- `read code` -> should remain read-only
- `explain architecture` -> should remain read-only
- `write_readme_file` or similar composite forms -> should be classified by operation, not substring accident

Target files:

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/v1.1.3.hardening.test.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/guard.runtime.test.ts`

Exit criteria:

- no substring-based false exemption remains
- regression tests cover filename and mixed-token edge cases

---

## 6. Workstream C — Real 5-Phase Runtime Enforcement

> Priority: `P1`
> Goal: Align orchestrator runtime with 5-phase governance model

### C.1 Runtime Model Refactor

Tasks:

- replace legacy operational sequence with explicit runtime phases:
  - `INTAKE`
  - `DESIGN`
  - `BUILD`
  - `REVIEW`
  - `FREEZE`
- decide whether `AUDIT` remains:
  - Option A: keep `AUDIT` as post-`FREEZE` administrative state
  - Option B: fold audit evidence into `FREEZE`
- remove semantic overload where `FREEZE` maps to `REVIEW`
- remove semantic overload where `INTAKE` maps to `DISCOVERY`

Target files:

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/pipeline.orchestrator.ts`
- related pipeline tests

Recommended design choice:

- keep `AUDIT` as a terminal evidence state after `FREEZE`
- phase gate checks should operate on true business phase, not alias mapping

### C.2 Backward Compatibility Strategy

Tasks:

- keep `DISCOVERY` as legacy alias input only if external callers still depend on it
- normalize alias inputs at entry boundary, not in runtime state machine internals
- document deprecation path for `DISCOVERY`

Target files:

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/entry/*`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/pipeline.orchestrator.ts`
- docs as needed

### C.3 Orchestrator Test Rebuild

Add or update tests for:

- `CREATED -> INTAKE`
- `INTAKE -> DESIGN`
- `REVIEW -> FREEZE`
- `FREEZE -> AUDIT` or terminal completion, depending on chosen design
- role restrictions specifically in `FREEZE`
- rollback to `INTAKE` and `FREEZE`
- event emission must reference true runtime phase names

Target files:

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/pipeline.orchestrator.test.ts`

Exit criteria:

- orchestrator status history exposes actual 5-phase runtime
- no runtime branch silently remaps `FREEZE` to `REVIEW`
- phase-gate policy and orchestrator lifecycle use the same phase vocabulary

---

## 7. Workstream D — Real File Scope Enforcement

> Priority: `P1`
> Goal: Enforce explicit file-level boundaries, not only protected zones

### D.1 `fileScope` Semantics

Define exact contract:

- `fileScope` means the list of files or path prefixes the agent is allowed to modify
- if `targetFiles` contains any file outside `fileScope`, block or escalate
- protected paths remain a separate hard block layer

Decision required:

- recommended behavior: `BLOCK` when `fileScope` exists and any target is out of scope

### D.2 Guard Implementation

Tasks:

- normalize path separators before comparison
- support exact file matches and allowed prefix matches
- reject path traversal style mismatches
- enforce `fileScope` for modifying actions only
- keep read-only actions allowed even when `targetFiles` are present, if no modification intent exists

Target files:

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/guards/file.scope.guard.ts`
- possibly adapter/request normalization files if `fileScope` is injected upstream

### D.3 Regression Coverage

Add tests for:

- allowed target inside `fileScope`
- blocked target outside `fileScope`
- mixed batch where one file is in-scope and one file is out-of-scope
- Windows path separators
- exact file match versus directory prefix match
- behavior when `fileScope` is absent

Target files:

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/v1.1.3.hardening.test.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/guard.runtime.test.ts`

Exit criteria:

- `fileScope` is enforced in runtime behavior
- tests prove scope escape attempts are blocked

---

## 8. Workstream E — Conformance and Default Path Alignment

> Priority: `P1`
> Goal: Ensure tests that claim conformance actually exercise the hardened default runtime

### E.1 Conformance Engine Alignment

Tasks:

- update conformance engine factory to use same default hardened guard set as SDK
- add scenarios for missing `ai_commit`
- add scenarios for `fileScope` violations
- add scenarios for `FREEZE` phase behavior after orchestrator alignment

Target files:

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/conformance.runner.test.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/conformance/conformance.scenarios.ts`

### E.2 Scenario Coverage Expansion

New scenario groups to add:

- `MANDATORY_AUDIT_ENFORCEMENT`
- `FILE_SCOPE_ENFORCEMENT`
- `PHASE_ALIAS_COMPAT`
- `FREEZE_GOVERNANCE`

Exit criteria:

- conformance does not pass using an outdated weaker guard stack
- scenario set reflects actual declared governance posture

---

## 9. Workstream F — Documentation and Baseline Reconciliation

> Priority: `P2`
> Goal: Make docs truthful after runtime changes land

Tasks:

- update hardening claims in assessment docs only after implementation is real
- update changelog to distinguish:
  - policy declared
  - policy integrated
  - policy regression-tested
- add reconciliation note back to the independent review
- update baseline or compat notes if default runtime contract changes

Suggested target docs:

- `CHANGELOG.md`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- `docs/assessments/CVF_GOVERNANCE_AUDIT_LOG_2026-03-19.md`
- `docs/assessments/CVF_PHASE1_COMPLETION_REPORT_2026-03-19.md`
- `docs/baselines/CVF_CORE_COMPAT_BASELINE.md`
- `docs/reviews/archive/CVF_INDEPENDENT_UPDATE_REVIEW_2026-03-19.md`

Exit criteria:

- no doc claims mandatory/default enforcement before code proves it
- review and implementation state are reconcilable in one pass

---

## 10. Detailed Delivery Plan

### Phase 0 — Safety-first Prep

Duration:

- `0.5 day`

Tasks:

- freeze current failing assumptions in tests
- add TODO issue list from independent review into implementation tracker
- identify all entry points that can create modifying actions without `metadata.ai_commit`

Output:

- stable task list
- known affected test files

### Phase 1 — P0 Remediation

Duration:

- `1-2 days`

Tasks:

- fix `AiCommitGuard` intent classification
- wire `AiCommitGuard` into default preset
- export new guards publicly
- update SDK/default-path tests

Output:

- hardened default runtime starts enforcing `ai_commit`

Definition of done:

- default SDK path blocks modifying actions without `ai_commit`
- false read-only string regressions covered

### Phase 2 — P1 Runtime Alignment

Duration:

- `2-3 days`

Tasks:

- refactor orchestrator to real 5-phase runtime
- enforce `fileScope`
- align conformance engine and scenario set

Output:

- runtime model and guard model no longer diverge

Definition of done:

- orchestrator tests use true `INTAKE` and `FREEZE`
- file scope escapes fail in tests
- conformance uses hardened default path

### Phase 3 — P2 Reconciliation

Duration:

- `0.5-1 day`

Tasks:

- update docs and test logs
- add implementation receipt to review
- mark each finding as resolved, partially resolved, or open

Output:

- auditable closure package

---

## 11. Verification Matrix

| Area | Required Check | Pass Condition |
|---|---|---|
| Build | `npm run build` | passes with no TS errors |
| Full extension tests | `npm test` | all tests pass |
| SDK default path | modifying action without `ai_commit` | blocked |
| Guard regression | `modify README.md` | not classified as read-only |
| File scope | out-of-scope target file | blocked |
| Orchestrator lifecycle | created-to-freeze path | uses true 5-phase model |
| Conformance | hardened scenario set | passes on updated default guard stack |

---

## 12. Definition of Done

This roadmap is complete only when all statements below are true:

- `AiCommitGuard` is enabled in the default runtime path
- `FileScopeGuard` is enabled where hardening claims apply
- public exports include the hardened guards
- default SDK, conformance runner, and tests use the same effective guard stack
- `AiCommitGuard` no longer relies on unsafe substring intent matching
- `fileScope` is enforced against modifying target files
- orchestrator uses a true 5-phase runtime model
- docs no longer overstate implementation status

---

## 13. Final Recommendation

Recommended implementation strategy:

- do not try to close all findings in one giant patch
- land this roadmap in 3 merges:
  1. `ai_commit` safety + default wiring
  2. orchestrator + `fileScope` enforcement
  3. conformance/docs reconciliation

This reduces regression risk and makes future independent re-review much easier.
