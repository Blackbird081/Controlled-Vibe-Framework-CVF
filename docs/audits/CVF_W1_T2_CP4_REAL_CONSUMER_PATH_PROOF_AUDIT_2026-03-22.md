# CVF W1-T2 CP4 Real Consumer Path Proof — Structural Change Audit

> Governance control: `GC-019`
> Date: `2026-03-22`
> Tranche: `W1-T2 — Usable Intake Slice`
> Control point: `CP4 — Real Consumer Path Proof`
> Change class: `consumer-path integration`

---

## 1. Problem

The intake pipeline (`CP1` intake contract, `CP2` retrieval contract, `CP3` packaging contract) is internally well-structured and independently testable. However, no downstream consumer currently exercises the pipeline end-to-end in a governed way. Without a real consumer path, the tranche output remains internally self-referential rather than operationally meaningful.

## 2. Proposed Solution

Create a `ConsumerContract` in `CVF_CONTROL_PLANE_FOUNDATION` that:

- accepts a consumer request (vibe + consumer identity + options)
- runs the full intake pipeline (intent → retrieval → packaging)
- produces a governed `ConsumptionReceipt` proving the pipeline was exercised end-to-end
- optionally freezes the execution context via `ContextFreezer` for reproducibility
- is independently callable by any downstream consumer (execution facade, MCP bridge, API handler)

Wire the `KnowledgeFacade` to expose a `consume()` method that delegates to this contract, proving the facade can serve as a real consumer entry point.

## 3. Scope

### In scope

- `ConsumerContract` class with `consume()` method
- `ConsumptionReceipt` type with intake result + consumer metadata + governed evidence hash
- `createConsumerContract()` factory function
- `KnowledgeFacade.consume()` method delegating to the new contract
- barrel exports for the consumer contract
- dedicated CP4 tests proving end-to-end pipeline consumption

### Out of scope

- actual AI provider calls or model routing through the consumer path
- streaming or async consumer paths
- consumer-path persistence or storage
- full execution runtime integration (deferred to later tranches)

## 4. Module Profiles

| Module | Role | Impact |
|---|---|---|
| `CVF_CONTROL_PLANE_FOUNDATION` | new `consumer.contract.ts` source file | additive — new contract |
| `CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` | updated barrel exports | additive — new exports |
| `CVF_PLANE_FACADES/src/knowledge.facade.ts` | new `consume()` method | additive — new method |
| `CVF_CONTROL_PLANE_FOUNDATION/tests/index.test.ts` | new CP4 test suite | additive — new tests |

## 5. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| over-engineering the consumer path | medium | keep the contract thin — compose existing contracts, do not add new logic |
| breaking existing intake contract or facade tests | low | run full regression before commit |
| scope creep into execution runtime | medium | explicitly defer execution integration — receipt proves pipeline was exercised, not that execution happened |

## 6. Verification Plan

- `npm run check` in `CVF_CONTROL_PLANE_FOUNDATION` — type-correct
- `npm run test` in `CVF_CONTROL_PLANE_FOUNDATION` — all existing + new CP4 tests pass
- `npm run test` in `CVF_PLANE_FACADES` — no regressions
- `npm run test:coverage` — maintain or improve current levels
- governance gates: docs-compat, baseline-update, release-manifest — all pass

## 7. Rollback Plan

- revert `consumer.contract.ts` and related changes
- restore previous barrel exports and facade
- no other modules affected
