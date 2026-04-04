# CVF Core Guard Alias Boundary Delta

> Date: `2026-03-20`
> Scope: Shared core guard matrices and IDE governance adapter
> Source roadmap: `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
> Change class: `alignment delta`

---

## 1. Purpose

This delta records the batch that removes legacy `DISCOVERY` from active core guard matrices while preserving compatibility at explicit normalization boundaries.

Target outcome:

- alias support remains available for callers
- core guard internals stay canonical
- auxiliary prompt adapters no longer teach legacy vocabulary as a first-class runtime state

---

## 2. Changes Applied

### Shared core guards

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/phase-gate.guard.ts`
  - `PHASE_ROLE_MATRIX` is now canonical-only
  - `PhaseGateGuard.evaluate()` normalizes legacy alias input before matrix lookup

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/authority-gate.guard.ts`
  - `AUTHORITY_MATRIX` is now canonical-only
  - `AuthorityGateGuard.evaluate()` normalizes legacy alias input before authority lookup

### Shared adapter surface

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/adapters/vscode-governance-adapter.ts`
  - prompt and JSON payload generation now normalize `DISCOVERY -> INTAKE`
  - IDE-facing governance context now reflects canonical phase guidance even for legacy callers

### Regression coverage

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/index.test.ts`
  - added checks that internal phase and authority matrices no longer include `DISCOVERY`
  - retained alias-input regression coverage

---

## 3. Verification

- `cd EXTENSIONS/CVF_GUARD_CONTRACT && npx vitest run src/index.test.ts src/adapters/vscode-governance-adapter.test.ts src/sdk/guard-sdk.test.ts` -> `PASS`
- `cd EXTENSIONS/CVF_GUARD_CONTRACT && npm run check` -> `PASS`

---

## 4. Resulting Status

After this delta:

- legacy alias handling is pushed outward to normalization boundaries
- active core guard matrices use canonical phases only
- IDE prompt export surfaces are more truthful to the canonical runtime model
- backward compatibility remains available without keeping legacy aliases as internal matrix keys

---

## 5. Remaining Caveat

This delta tightens the active shared contract path only.

Other compatibility-oriented surfaces may still mention `DISCOVERY` where they intentionally accept historical input, but the canonical guard internals are now materially cleaner and better aligned with the roadmap principle of boundary-only legacy support.
