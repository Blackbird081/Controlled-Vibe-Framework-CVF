# CVF Independent Update Review

> Date: `2026-03-19`
> Reviewer stance: Independent expert review
> Purpose: Save a stable comparison record for later reconciliation
> Scope window: Changes observed in the last 3 days before review (`2026-03-16` to `2026-03-19`)
> Branch reviewed: `cvf-next`

---

## 1. Review Scope

This review focuses on the recent CVF update wave in the last 3 days, with emphasis on:

- governance runtime hardening
- phase/role/risk enforcement changes
- newly added `ai_commit` and `file_scope` controls
- runtime wiring versus documented claims
- test and build evidence

Primary change set identified:

- Code commit: `9b7b272`  
  `feat(governance): Phase 1 CVF Edit Integration - Governance Runtime Hardening (100% test pass)`
- Follow-up docs commits:
  - `0d1937a`
  - `be97c1e`
  - `7223845`

Observation:

- In this 3-day window, only one commit materially changed runtime code.
- The remaining commits mainly updated assessment, roadmap, changelog, and governance documentation.

---

## 2. Evidence Used

Repository-level evidence reviewed:

- `git log --since="2026-03-16" --name-only --oneline --decorate`
- `git show --stat --summary 9b7b272`
- targeted source review of governance runtime and phase protocol files
- targeted test review for hardening, runtime, conformance, orchestrator, and SDK

Verification executed locally:

- `npm test` in `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`
  - Result: `504/504` tests passed
- `npm run build` in `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`
  - Result: pass (`tsc --noEmit`)

---

## 3. Independent Findings

### Finding 1 — High

`ai_commit` is declared as a mandatory non-bypassable guard, but it is not wired into the default CVF runtime path.

Why this matters:

- `MANDATORY_GUARD_IDS` includes `ai_commit`
- default SDK presets still register only the legacy 6 core guards
- public barrel exports still expose the old guard set, not the new hardening guards
- SDK tests still assert `13` guards for full mode and `6` for core mode

Independent conclusion:

- The system currently enforces `ai_commit` only in isolated tests that manually register it.
- Therefore the claim that this control is part of the non-bypassable runtime core is not yet true for the default runtime path.

Key references:

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/guard.runtime.types.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/sdk/cvf.sdk.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/index.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/sdk.test.ts`

### Finding 2 — High

The new 5-phase model is not yet enforced end-to-end in the orchestrator runtime.

Why this matters:

- guards now model `INTAKE`, `DESIGN`, `BUILD`, `REVIEW`, `FREEZE`
- orchestrator still runs the older flow:
  - `CREATED -> DISCOVERY -> DESIGN -> BUILD -> REVIEW -> AUDIT`
- `INTAKE` is only back-mapped to `DISCOVERY`
- `FREEZE` is only back-mapped to `REVIEW`

Independent conclusion:

- The 5x5 phase/role authority matrix is implemented at guard level, but not yet represented as a real runtime pipeline state model.
- `FREEZE` currently has policy semantics without a true runtime phase.

Key references:

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/pipeline.orchestrator.ts`

### Finding 3 — Medium

`fileScope` was added to request context, but `FileScopeGuard` does not enforce it.

Why this matters:

- request context now includes `fileScope`
- the guard only checks:
  - `targetFiles`
  - read-only roles
  - protected paths
- it does not compare `targetFiles` against allowed file scope

Independent conclusion:

- This is partial implementation, not full file-level scope enforcement.
- Agents may still modify files outside intended scope if those files are not in protected paths.

Key references:

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/guard.runtime.types.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/guards/file.scope.guard.ts`

### Finding 4 — Medium

`AiCommitGuard` uses substring matching for read-only detection and can produce false exemptions.

Why this matters:

- read-only detection is based on `includes()`
- a modifying action string containing `read` can be misclassified as read-only
- example pattern risk: `"modify README.md"` contains `"read"`

Independent conclusion:

- Once wired into the default runtime, this logic becomes a realistic bypass vector.
- The test suite does not currently cover these false-positive cases.

Key references:

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/guards/ai.commit.guard.ts`

---

## 4. Overall Assessment

### Current Status

The recent update is real progress, especially in:

- expanding governance semantics
- improving state model explicitness
- adding more focused hardening tests
- preserving build and test health

However, from an independent review perspective, this update should be classified as:

**"Hardening completed at module/test level, but not yet fully hardened at default runtime integration level."**

### Practical Readout

What is strong now:

- tests are green
- phase protocol is more explicit
- authority matrix is more structured
- governance intent is clearer than before

What is still overstated if claimed as complete:

- mandatory non-bypassable `ai_commit`
- real 5-phase runtime enforcement
- full file-scope enforcement
- production-grade closure of bypass paths

---

## 5. Recommended Reconciliation Checklist

Use this section for future comparison against later updates.

The review should be considered reconciled only when all items below are true:

- `AiCommitGuard` is registered by default in SDK/runtime presets
- `FileScopeGuard` is registered by default where the hardening claim applies
- public exports expose the new guards as supported runtime controls
- conformance runner uses the same hardened default guard set
- orchestrator has a true runtime representation of `INTAKE` and `FREEZE`
- `fileScope` is actually enforced against `targetFiles`
- `AiCommitGuard` read-only detection is token-based or intent-based, not loose substring matching
- regression tests cover false-positive strings such as `README`, `thread`, and similar cases

---

## 6. Final Independent Verdict

Verdict for the `2026-03-19` update wave:

- Test health: `PASS`
- Build health: `PASS`
- Governance hardening intent: `STRONG`
- Runtime integration completeness: `PARTIAL`
- Production confidence for "non-bypassable by default" claim: `NOT YET FULLY JUSTIFIED`

Short conclusion:

CVF is stronger than it was before this update, but the latest governance hardening should still be treated as an integration-incomplete milestone rather than a fully closed enforcement state.

---

## 7. Reconciliation Update After Remediation

Reconciliation timestamp:

- `2026-03-19`

Follow-up remediation batch completed after this review:

- `AiCommitGuard` wired into default SDK/runtime presets
- `FileScopeGuard` wired into default SDK/runtime presets
- `AiCommitGuard` intent detection converted from substring matching to tokenized action classification
- `fileScope` propagated through entry normalization and enforced in runtime
- orchestrator runtime converted to real `INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE`
- conformance, SDK, entry, runtime, and hardening tests aligned to hardened default path

Verification rerun after remediation:

- `npm test` in `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`
  - result: `506/506` passed
- `npm run build` in `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`
  - result: pass

Post-fix comparison artifact:

- `docs/baselines/CVF_GOVERNANCE_RUNTIME_REMEDIATION_DELTA_2026-03-19.md`

Updated reconciliation readout for the 4 original findings:

- Finding 1 — `CLOSED`
- Finding 2 — `CLOSED`
- Finding 3 — `CLOSED`
- Finding 4 — `CLOSED`

Independent note:

The original review findings were valid at review time. They are now closed by a later remediation batch executed on the same date and supported by updated runtime behavior plus full test/build evidence.
