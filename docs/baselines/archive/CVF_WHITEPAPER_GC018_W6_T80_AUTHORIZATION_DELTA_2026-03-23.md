# CVF Whitepaper GC-018 W6-T80 Authorization Delta

Memory class: SUMMARY_RECORD
> Date: `2026-03-23`

## Tranche

**W6-T80 — Approval State Machine, EventBus, Policy Hash, CostGuard & Roles Tests Slice**
Branch: `cvf-next`
Risk: R0 (test-only, no source changes)
Lane: Full Lane (closes 5 contract gaps in CVF_v1.7.1_SAFETY_RUNTIME)

## Scope

Provide dedicated test coverage for 5 contracts in CVF_v1.7.1_SAFETY_RUNTIME:

- `policy/approval.state-machine.ts` — `nextState()`:
  proposed+any→validated; validated→approved/rejected/pending; approved→executed;
  other states (executed/rejected/pending)→unchanged
- `core/event-bus.ts` — `EventBus`:
  on+emit; off removes handler; onAll receives all types; offAll removes wildcard;
  listenerCount (type+wildcard); clear removes all; throwing handler doesn't propagate
- `policy/policy.hash.ts` — `generatePolicyHash()`:
  returns 64-char hex; same inputs→same hash; different version→different hash
- `policy/cost.guard.ts` — `CostGuard.validate()`:
  all OK; WARNING at 80% threshold; LIMIT_EXCEEDED proposal-tokens/file-count/user-daily
- `cvf-ui/lib/roles.ts` — `canExecute` + `canApprove`:
  canExecute: ADMIN+OPERATOR→true/VIEWER→false;
  canApprove: ADMIN→true/OPERATOR+VIEWER→false

## Artifacts Delivered

| File | Extension | Lines | Tests |
|---|---|---|---|
| `tests/safety-runtime-approval-statemachine-eventbus-cost-roles.test.ts` | CVF_v1.7.1_SAFETY_RUNTIME | 215 | 27 |

## GC-023 Compliance

- New test file: 215 lines — under 1200 hard threshold ✓
- Existing test files — untouched ✓
- Source contracts — untouched ✓

## Test Counts (Post-Delivery)

| Extension | Before | After | Delta |
|---|---|---|---|
| CVF_v1.7.1_SAFETY_RUNTIME | 616 | 643 | +27 |

All CVF planes (LPF 377 / GEF 185 / EPF 416 / CPF 644 / GC 172) unaffected — green.

## Authorization

Authorized under GC-018 (Continuation Governance). Test-only — no risk to
existing contracts. Closes approval state machine, EventBus, policy hash,
CostGuard and roles dedicated test coverage gaps in CVF_v1.7.1_SAFETY_RUNTIME.
