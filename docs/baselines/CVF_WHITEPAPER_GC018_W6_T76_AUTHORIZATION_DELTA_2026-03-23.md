# CVF Whitepaper GC-018 W6-T76 Authorization Delta

Memory class: SUMMARY_RECORD

> Date: `2026-03-23`

## Tranche

**W6-T76 — Safety Runtime Refusal Router Utilities, Risk Gate, Rollback Controller & Lineage Graph Tests Slice**
Branch: `cvf-next`
Risk: R0 (test-only, no source changes)
Lane: Full Lane (closes 8 contract gaps in CVF_v1.7.1_SAFETY_RUNTIME)

## Scope

Provide dedicated test coverage for 8 contracts in CVF_v1.7.1_SAFETY_RUNTIME:

- `kernel/04_refusal_router/alternative_route_engine.ts` — AlternativeRouteEngine.suggest:
  returns non-empty "Alternative route" guidance string
- `kernel/04_refusal_router/clarification_generator.ts` — ClarificationGenerator.generate:
  returns non-empty clarification request string
- `kernel/04_refusal_router/safe_rewrite_engine.ts` — SafeRewriteEngine.rewrite:
  "kill myself" → redacted; case-insensitive; clean→unchanged
- `kernel/04_refusal_router/refusal.authority.policy.ts` — AuthorityPolicy.isAllowed:
  read→true; write→false (DefaultCapabilityProfile)
- `kernel/04_refusal_router/capability.guard.ts` — CapabilityGuard.validate:
  read→no throw; execute→throws with capability name
- `kernel/04_refusal_router/refusal.risk.ts` — RiskGate.evaluate:
  safe text→passthrough; R4 (self_harm)→block JSON; R3 (legal)→needs_approval JSON
- `kernel/03_contamination_guard/rollback_controller.ts` — RollbackController.plan:
  R4→required+critical_risk; driftDetected→required+drift_detected; clean→required=false
- `kernel/03_contamination_guard/lineage_graph.ts` — LineageGraph.addNode/addEdge/getSnapshot:
  nodes/edges tracked; getSnapshot returns copy (immutable pattern)

## Artifacts Delivered

| File | Extension | Lines | Tests |
|---|---|---|---|
| `tests/safety-runtime-refusal-router-rollback-lineage.test.ts` | CVF_v1.7.1_SAFETY_RUNTIME | 199 | 18 |

## GC-023 Compliance

- New test file: 199 lines — under 1200 hard threshold ✓
- Existing test files — untouched ✓
- Source contracts — untouched ✓

## Test Counts (Post-Delivery)

| Extension | Before | After | Delta |
|---|---|---|---|
| CVF_v1.7.1_SAFETY_RUNTIME | 547 | 565 | +18 |

All CVF planes (LPF 377 / GEF 185 / EPF 416 / CPF 644 / GC 172) unaffected — green.

## Authorization

Authorized under GC-018 (Continuation Governance). Test-only — no risk to
existing contracts. Closes 8 refusal router utility, risk gate, rollback
controller and lineage graph dedicated test coverage gaps in CVF_v1.7.1_SAFETY_RUNTIME.
