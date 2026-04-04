# CVF W1-T3 CP1 Design Contract Baseline — Structural Change Audit

Memory class: FULL_RECORD

> Governance control: `GC-019`
> Date: `2026-03-22`
> Tranche: `W1-T3 — Usable Design/Orchestration Slice`
> Control point: `CP1 — Design Contract Baseline`
> Change class: `new contract baseline`

---

## 1. Problem

The control plane has a governed intake pipeline (intent → retrieval → packaging → consumer path) from `W1-T2`, but no governed DESIGN-phase contract exists. The whitepaper places `AI Boardroom` and `CEO Orchestrator` at the DESIGN phase boundary. A design contract is needed to bridge intake results into governed design plans.

## 2. Proposed Solution

Create a `DesignContract` class that:

- accepts a `ControlPlaneIntakeResult` (from the existing intake contract)
- decomposes the intake into governed tasks with risk assessment
- assigns agent roles per the canonical CVF agent model (orchestrator, architect, builder, reviewer)
- produces a deterministic `DesignPlan` with plan hash
- does NOT execute tasks — only produces the governed plan surface

## 3. Scope

### In scope

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/design.contract.ts` (new)
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` (barrel exports)
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/index.test.ts` (new CP1 tests)

### Out of scope

- boardroom session (CP2)
- orchestration dispatch (CP3)
- consumer path (CP4)
- execution-plane runtime
- physical merge of existing modules

## 4. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| design contract over-promises execution capability | medium | contract produces plan only, no dispatch |
| task decomposition logic too simplistic | low | start with deterministic rule-based decomposition, defer ML |
| risk assessment diverges from existing R0-R3 model | low | reuse canonical `CVFRiskLevel` from guard contract |

## 5. Verification Plan

- new unit tests for `DesignContract` covering: plan generation, task decomposition, risk assessment, deterministic hashing, edge cases
- all existing 149 tests continue to pass
- governance gates: docs-compat, baseline-update, release-manifest — COMPLIANT
