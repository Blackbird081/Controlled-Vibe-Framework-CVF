# CVF Performance Acceptance Policy Baseline

Memory class: POINTER_RECORD

> Date: 2026-03-29
> Status: `PROPOSAL ONLY` — thresholds declared as targets; not verified as current truth
> Authorization: W8-T2 GC-018 — `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W8_T2_PERFORMANCE_BENCHMARK_HARNESS_2026-03-29.md`
> First evidence batch: committed in W8-T2 CP2 as deterministic contract-unit evidence; promotion gate still requires future trace-backed integration evidence

---

## Governance Constraint

All thresholds in this document are declared as `TARGET (PROPOSAL ONLY)`. They reflect architectural design intent, not measured truth. Promotion of any threshold from `PROPOSAL ONLY` to baseline truth requires:

1. A completed benchmark run using the `PerformanceBenchmarkHarnessContract` (W8-T2 CP1)
2. Trace-backed measurement evidence committed in a baseline artifact
3. An explicit GC-026 tracker sync referencing that evidence

No threshold in this document may be cited as a current performance guarantee.

---

## Control Plane (CPF) — Gateway Pipeline

| Surface | Metric | Target threshold | Status |
|---|---|---|---|
| Gateway intake → design output | End-to-end latency (P95) | ≤ 500 ms | PROPOSAL ONLY |
| Gateway auth check | Latency (P99) | ≤ 50 ms | PROPOSAL ONLY |
| PII detection scan | Latency (P95) | ≤ 100 ms | PROPOSAL ONLY |
| Context packaging | Latency (P95) | ≤ 200 ms | PROPOSAL ONLY |
| Knowledge query batch | Throughput | ≥ 10 queries/sec | PROPOSAL ONLY |
| Boardroom round | End-to-end latency (P95) | ≤ 2000 ms | PROPOSAL ONLY |

---

## Execution Plane (EPF) — Runtime Pipeline

| Surface | Metric | Target threshold | Status |
|---|---|---|---|
| Command runtime dispatch | Latency (P95) | ≤ 300 ms | PROPOSAL ONLY |
| Async runtime task queuing | Latency (P99) | ≤ 100 ms | PROPOSAL ONLY |
| MCP bridge invocation | Latency (P95) | ≤ 1000 ms | PROPOSAL ONLY |
| Streaming execution throughput | Throughput | ≥ 5 streams/sec | PROPOSAL ONLY |
| Feedback routing | Latency (P95) | ≤ 150 ms | PROPOSAL ONLY |

---

## Governance Expansion (GEF) — Policy Pipeline

| Surface | Metric | Target threshold | Status |
|---|---|---|---|
| Watchdog pulse check | Latency (P95) | ≤ 200 ms | PROPOSAL ONLY |
| Governance checkpoint evaluation | Latency (P95) | ≤ 500 ms | PROPOSAL ONLY |
| Consensus decision | Latency (P95) | ≤ 1000 ms | PROPOSAL ONLY |
| Audit signal write | Latency (P99) | ≤ 100 ms | PROPOSAL ONLY |

---

## Learning Plane (LPF) — Feedback Pipeline

| Surface | Metric | Target threshold | Status |
|---|---|---|---|
| Pattern detection scan | Latency (P95) | ≤ 500 ms | PROPOSAL ONLY |
| Truth score evaluation | Latency (P95) | ≤ 300 ms | PROPOSAL ONLY |
| Feedback ledger write | Latency (P99) | ≤ 100 ms | PROPOSAL ONLY |
| Learning storage write | Throughput | ≥ 20 ops/sec | PROPOSAL ONLY |

---

## Memory Budget Targets

| Surface | Target | Status |
|---|---|---|
| CPF gateway pipeline (peak) | ≤ 256 MB | PROPOSAL ONLY |
| EPF runtime pipeline (peak) | ≤ 512 MB | PROPOSAL ONLY |
| GEF governance pipeline (peak) | ≤ 256 MB | PROPOSAL ONLY |
| LPF learning pipeline (peak) | ≤ 512 MB | PROPOSAL ONLY |

---

## Promotion Path

Promotion of any threshold from `PROPOSAL ONLY` to `BASELINE TRUTH` requires:
1. A completed benchmark run with measurements committed to `docs/baselines/` with `evidenceClass: "PROPOSAL_ONLY"` upgraded to trace-backed evidence
2. Evidence batch reviewed and accepted by the governance chain
3. GC-026 tracker sync explicitly noting the promotion

This document will be updated to `STATUS: BASELINE TRUTH (partial)` as individual thresholds are verified by benchmark evidence in future waves.

---

## First Evidence Batch Provenance

The first harness-generated evidence batch is committed at:

- `docs/baselines/CVF_W8_T2_CP2_FIRST_EVIDENCE_BATCH_2026-03-29.md`
- `reportId`: `07694a0023d8b6334a327a4622a7a8b8`
- `reportHash`: `ee7820674da17bd1a6e86e411019c2e2`

This batch proves that the harness lifecycle and evidence-record model work correctly, but it remains contract-unit evidence only. It does **not** satisfy the promotion gate above.

---

## Related Artifacts

- Benchmark harness contract: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/performance.benchmark.harness.contract.ts`
- First evidence batch: `docs/baselines/CVF_W8_T2_CP2_FIRST_EVIDENCE_BATCH_2026-03-29.md`
- Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W8_T2_PERFORMANCE_BENCHMARK_HARNESS_2026-03-29.md`
