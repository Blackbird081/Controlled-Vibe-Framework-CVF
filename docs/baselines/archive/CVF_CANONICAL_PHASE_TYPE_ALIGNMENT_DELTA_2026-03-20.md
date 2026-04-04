# CVF Canonical Phase Type Alignment Delta

> Date: `2026-03-20`
> Scope: Shared type system, enterprise auxiliary surfaces, and user-facing phase labels
> Source roadmap: `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
> Change class: `alignment delta`

---

## 1. Purpose

This delta records a narrow cleanup batch after the larger system-unification delivery.

Goal:

- keep canonical phase semantics clean at the internal type level
- restrict legacy `DISCOVERY` vocabulary to explicit compatibility boundaries
- remove residual teaching drift from auxiliary enterprise and UI surfaces

---

## 2. Changes Applied

### Shared contract

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts`
  - added canonical helper exports:
    - `CanonicalCVFPhase`
    - `LegacyCVFPhaseAlias`
    - `CVFPhaseInput`
  - narrowed `PHASE_ORDER` to canonical phases only

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/sdk/guard-sdk.ts`
  - re-exported shared phase helper types from the canonical contract instead of redefining them locally

### Enterprise auxiliary surfaces

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/enterprise/enterprise.ts`
  - normalized legacy phase alias input to canonical phase storage
  - `TeamPermissions.allowedPhases` now stays canonical
  - `ApprovalRequest.phase` now stores canonical phase values
  - `ComplianceReport.phaseDistribution` now reports canonical phases only

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/phase-gate.guard.ts`
  - enterprise permission checks now normalize legacy alias input before comparing against canonical allowed phases

### Web auxiliary surfaces

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/friendly-labels.ts`
  - removed `DISCOVERY` from the canonical-friendly phase map
  - moved legacy alias handling into render-time normalization

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/reports/compliance/page.tsx`
  - compliance mock report now uses canonical phase distribution only

---

## 3. Verification

- `cd EXTENSIONS/CVF_GUARD_CONTRACT && npx vitest run src/enterprise/enterprise.test.ts src/sdk/guard-sdk.test.ts` -> `PASS`
- `cd EXTENSIONS/CVF_GUARD_CONTRACT && npm run check` -> `PASS`
- `cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx vitest run src/lib/friendly-labels.test.ts` -> `PASS`

---

## 4. Resulting Status

After this delta:

- canonical phases are cleaner at the shared type level
- enterprise approval/reporting surfaces no longer store `DISCOVERY` as a first-class internal phase
- legacy alias support remains available only as compatibility input handling
- user-facing labels still render legacy input safely, but no longer teach it as canonical CVF vocabulary

---

## 5. Remaining Caveat

This delta improves the active reference path only.

It does not claim that every historical or low-priority extension family has been refactored to the same type depth yet; it only tightens the currently active shared contract, enterprise auxiliary path, and Web auxiliary path.
