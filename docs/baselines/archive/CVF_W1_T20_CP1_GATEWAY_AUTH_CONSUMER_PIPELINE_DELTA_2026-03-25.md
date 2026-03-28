# CVF W1-T20 CP1 Delta — GatewayAuth Consumer Pipeline Contract

Memory class: SUMMARY_RECORD
> Date: 2026-03-25
> Tranche: W1-T20 / CP1
> Baseline reference: CPF 856 tests (W1-T19 closure)

---

## Delta Summary

| Field | Before | After |
|---|---|---|
| CPF test count | 856 | 883 |
| New contracts | — | `GatewayAuthConsumerPipelineContract` |
| New test files | — | `gateway.auth.consumer.pipeline.test.ts` (27 tests) |
| Gap addressed | `GatewayAuthContract` had no consumer-visible output path | **CLOSED** |

---

## New Files

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.auth.consumer.pipeline.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/gateway.auth.consumer.pipeline.test.ts`

## Modified Files

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` — W1-T20 CP1 barrel export block prepended

---

## Capability Added

`GatewayAuthConsumerPipelineContract` — CPF-internal bridge from `GatewayAuthContract` to `ControlPlaneConsumerPipelineContract`. Auth decisions (AUTHENTICATED/DENIED/EXPIRED/REVOKED) are now enrichable and consumer-visible. Warnings generated for DENIED, EXPIRED, and REVOKED outcomes.
