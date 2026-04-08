# CVF W64-T1 CP1 — Track 5A+5B Implementation Delta

Memory class: SUMMARY_RECORD

> Tranche: W64-T1 — Track 5 Deferred Architecture (5A+5B)
> Control Point: CP1
> Date: 2026-04-08
> Baseline: v3.7-W46T1

---

## Delta Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| CPF tests | 2929 | 2955 | +26 |
| Safety Runtime tests (sandbox) | 0 | 26 | +26 |
| EPF tests | 1301 | 1301 | 0 |
| GEF tests | 625 | 625 | 0 |
| LPF tests | 1465 | 1465 | 0 |
| CPF failures | 0 | 0 | 0 |
| Architecture: Model Gateway | [DEFERRED] | DELIVERED | ✅ |
| Architecture: Sandbox Runtime | [DEFERRED] | DELIVERED | ✅ |

---

## Files Created

| File | Module | Lines | Purpose |
|------|--------|-------|---------|
| `CVF_CONTROL_PLANE_FOUNDATION/src/provider.router.contract.ts` | CPF | 209 | Track 5A governance routing |
| `CVF_CONTROL_PLANE_FOUNDATION/tests/provider.router.contract.test.ts` | CPF tests | 382 | 26 CPF tests |
| `CVF_v1.7.1_SAFETY_RUNTIME/simulation/sandbox.isolation.contract.ts` | Safety Runtime | 249 | Track 5B typed contract |
| `CVF_v1.7.1_SAFETY_RUNTIME/tests/sandbox.isolation.contract.test.ts` | Safety Runtime tests | 358 | 26 sandbox tests |
| `CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/worker.thread.sandbox.adapter.ts` | Adapter Hub | 210 | Track 5B worker_threads adapter |

---

## Files Modified

| File | Module | Change |
|------|--------|--------|
| `CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.gateway.barrel.ts` | CPF | Added ProviderRouterContract exports |
| `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` | Documentation | Model Gateway + Sandbox Runtime [DEFERRED] → DELIVERED |

---

## Doctrine Deltas

| Item | Change |
|------|--------|
| Model Gateway Option B | Resolved from [DEFERRED] to IMPLEMENTED |
| Sandbox Runtime worker_threads | Resolved from [DEFERRED] to IMPLEMENTED |
| Track 5C (Agent Registry) | Remains CLOSED-BY-DEFAULT (not in scope) |

---

## Hash Salts (New)

| Contract | Hash salt | ID salt |
|----------|-----------|---------|
| ProviderRouterContract | `"w64-t1-provider-router"` | `"w64-t1-provider-router-id"` |

---

*Delta recorded: 2026-04-08*
*Tranche: W64-T1 CP1*
