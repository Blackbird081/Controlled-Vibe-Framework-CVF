# CVF Governance Runtime Remediation Delta

> Date: `2026-03-19`
> Type: Post-fix baseline delta
> Source roadmap: `docs/roadmaps/archive/CVF_GOVERNANCE_RUNTIME_REMEDIATION_ROADMAP_2026-03-19.md`
> Source review: `docs/reviews/archive/CVF_INDEPENDENT_UPDATE_REVIEW_2026-03-19.md`
> Scope: Governance runtime remediation batch for mandatory guard wiring, 5-phase runtime alignment, and file-scope enforcement

---

## 1. Purpose

This delta records the runtime state after executing the remediation batch opened by the independent review on `2026-03-19`.

It exists so future reconciliation can compare:

- pre-fix findings
- post-fix runtime behavior
- evidence that default-path enforcement is now real

---

## 2. Findings Closed In This Delta

### Closed 1 — Mandatory `ai_commit` wiring

Resolved state:

- `AiCommitGuard` is now registered in default SDK presets
- `FileScopeGuard` is now registered in default SDK presets
- public barrel exports now expose both hardening guards
- guard count moved from legacy `13/6` to hardened `15/8` for `full/core`

Effect:

- default `CvfSdk.create()` now enforces missing `ai_commit` on modifying actions

### Closed 2 — `AiCommitGuard` substring bypass

Resolved state:

- read-only detection no longer uses unsafe substring matching
- action intent is classified via tokenized helper logic
- regression coverage now includes false-positive patterns such as `modify README.md`

Effect:

- filenames and incidental substrings no longer create read-only exemptions

### Closed 3 — `fileScope` enforcement gap

Resolved state:

- `fileScope` now flows through entry normalization, gateway, and conformance input
- `FileScopeGuard` now blocks modifying targets outside explicit allowed scope
- builder-class roles remain blocked from protected paths even when `fileScope` is present

Effect:

- runtime now enforces both protected zones and explicit file-scope boundaries

### Closed 4 — 5-phase orchestrator mismatch

Resolved state:

- orchestrator runtime now uses real statuses:
  - `INTAKE`
  - `DESIGN`
  - `BUILD`
  - `REVIEW`
  - `FREEZE`
- `DISCOVERY` remains input alias only
- `FREEZE` is no longer remapped to `REVIEW`
- completion now occurs from `FREEZE`

Effect:

- runtime lifecycle and phase-gate vocabulary are now aligned

---

## 3. Verification Evidence

Executed on `2026-03-19`:

- `npm test` in `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`
  - result: `506/506` tests passed
- `npm run build` in `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`
  - result: pass (`tsc --noEmit`)

Coverage of the remediation batch includes:

- SDK/default runtime tests
- multi-entry normalization and gateway tests
- conformance runner and scenario alignment
- 5-phase orchestrator lifecycle tests
- v1.1.3 hardening regression tests

---

## 4. Runtime Contract Changes

New default-path expectations:

- modifying actions require `metadata.ai_commit` unless classified as read-only/non-mutating
- `fileScope` is enforced when present
- canonical runtime phase path is `INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE`
- default preset guard counts are:
  - `full = 15`
  - `core = 8`

---

## 5. Reconciliation Result

For the four findings listed in the independent review dated `2026-03-19`:

- code remediation status: `CLOSED`
- regression coverage status: `CLOSED`
- default runtime integration status: `CLOSED`
- documentation/baseline receipt status: `CLOSED`

Residual note:

- external downstream consumers still using legacy phase names should migrate toward canonical `INTAKE` and `FREEZE`, even though alias compatibility remains for request input.
