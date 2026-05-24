# Governance Benchmark Live Metrics - 2026-05-24

Status: PUBLIC-SAFE SUMMARY

This public-safe summary records a bounded live governance benchmark run
against the hosted CVF `/api/execute` endpoint.

Measured window:

- Target: hosted `/api/execute`
- Provider lane: Alibaba
- Model lane: `qwen-turbo`
- Live calls: 5
- Evidence mode: `live`
- Raw secrets printed: `false`

Measured metrics from the current E2 operational benchmark event model:

| Metric | Value |
| --- | --- |
| `taskCompletionRate` | `0.5` (`5/10` events) |
| `policyViolationRate` | `0` (`0/10` events) |
| `receiptIntegrityRate` | `0.5` (`5/10` events) |

Boundary:

- This is a bounded benchmark window, not an SLA or production-readiness
  claim.
- This does not prove universal provider stability.
- This does not claim enterprise benchmark certification.
- Mock-only checks are not accepted as governance behavior proof.
