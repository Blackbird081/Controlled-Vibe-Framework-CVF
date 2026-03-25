# CVF Runtime Guard Alias Boundary Delta

> Date: `2026-03-20`
> Scope: `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`
> Source roadmap: `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
> Change class: `alignment delta`

---

## 1. Purpose

This delta records the runtime-side cleanup that mirrors the shared-contract alias-boundary hardening.

Goal:

- keep legacy `DISCOVERY` support only as compatibility input
- remove legacy alias keys from active runtime guard matrices
- keep multi-agent coordination aligned with the same canonical phase model

---

## 2. Changes Applied

### Runtime types

- `governance/guard_runtime/guard.runtime.types.ts`
  - added:
    - `CanonicalCVFPhase`
    - `LegacyCVFPhaseAlias`
    - `CVFPhaseInput`

### Runtime core guards

- `governance/guard_runtime/guards/phase.gate.guard.ts`
  - `PHASE_ROLE_MATRIX` is now canonical-only
  - legacy alias input is normalized before role-matrix lookup

- `governance/guard_runtime/guards/authority.gate.guard.ts`
  - `AUTHORITY_MATRIX` is now canonical-only
  - legacy alias input is normalized before authority lookup

### Runtime coordination

- `governance/guard_runtime/cloud/multi.agent.runtime.ts`
  - task assignment now normalizes legacy phase alias input before checking role authorization

### Regression coverage

- `tests/guard.runtime.test.ts`
  - now asserts canonical-only matrix keys while preserving alias-input behavior

---

## 3. Verification

- `cd EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL && npx vitest run tests/guard.runtime.test.ts tests/sdk.test.ts tests/multi.entry.test.ts tests/conformance.runner.test.ts tests/multi.agent.runtime.test.ts` -> `PASS`
- `cd EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL && npm run build` -> `PASS`

---

## 4. Resulting Status

After this delta:

- runtime guard internals on the active `v1.1.1` path use canonical phase matrices only
- legacy alias handling remains available for compatibility callers
- multi-agent assignment checks follow the same normalized phase semantics as the guard layer

---

## 5. Remaining Caveat

This delta hardens the active runtime path only.

Other compatibility-oriented runtime surfaces may still accept `DISCOVERY` explicitly where boundary compatibility is intentional, but the core runtime matrices and coordination layer no longer keep it as a first-class internal state key.
