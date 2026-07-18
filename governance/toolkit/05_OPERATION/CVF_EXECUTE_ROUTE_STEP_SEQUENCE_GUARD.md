# CVF Execute Route Step Sequence Guard

Memory class: POLICY_RECORD

Status: ACTIVE

## Purpose

Protect the critical `/api/execute` route from silent static step-order drift
across the eight canonical governance call sites.

## Scope / Target / Owner Boundary

In scope: static validation of selected call-site order in
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts`.

Out of scope: modifying `route.ts`, validating runtime semantics, provider
execution, output quality, or other route files.

## Rule

The selected occurrence of each call pattern must exist and must appear at a
strictly increasing line number in this order:

1. `resolveExecutionCVFRole(`
2. `evaluateExecutionActorRoleGate(`
3. `checkRoleOutputPermission(`
4. `evaluateEnforcement(`
5. `routeWebProvider(`
6. `buildEvidenceReceipt(` using selector `last`
7. `buildRouteAuditMemoryCapture(`
8. `appendAuditEvent(` using selector `last`

Detection ignores lines whose stripped content starts with `import ` or `//`.
Selectors must be either `first` or `last`.

## Enforcement Surface

The guard runs through:

- `governance/compat/check_execute_route_step_sequence.py --enforce`
- `governance/compat/run_local_governance_hook_chain.py`
- `scripts/run_cvf_static_ci_gate.py`

## Registry File Path

Canonical registry:

`governance/compat/CVF_EXECUTE_ROUTE_STEP_SEQUENCE_REGISTRY.json`

## Maintenance Note

Any future refactor that changes the call order, renames a function, or adds a
mandatory step to `route.ts` MUST update
`CVF_EXECUTE_ROUTE_STEP_SEQUENCE_REGISTRY.json` in the same commit. Failure to
do so will cause the guard to fail on the next CI run.

## Related Artifacts

- GC-018:
  `docs/baselines/archive/CVF_GC018_C3_EXECUTE_ROUTE_STEP_SEQUENCE_GUARD_2026-05-19.md`
- Work order:
  `docs/work_orders/archive/CVF_AGENT_WORK_ORDER_C3_EXECUTE_ROUTE_STEP_SEQUENCE_GUARD_2026-05-19.md`
- Completion review:
  `docs/reviews/archive/CVF_C3_EXECUTE_ROUTE_STEP_SEQUENCE_GUARD_COMPLETION_2026-05-19.md`

## Final Clause

This policy is a static guardrail. It does not prove live governance behavior
and must not be cited as release-quality proof for runtime governance claims.
