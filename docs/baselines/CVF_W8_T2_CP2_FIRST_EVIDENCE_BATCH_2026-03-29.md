# CVF W8-T2 CP2 — First Evidence Batch

Memory class: SUMMARY_RECORD

> Date: 2026-03-29
> Tranche: W8-T2 — Candidate C Performance Benchmark Harness (parallel prerequisite)
> Evidence class: `PROPOSAL_ONLY` — first instrumentation run; not trace-backed production evidence
> Status: PROPOSAL ONLY — no threshold promoted to baseline truth

---

## Governance Constraint

All measurements in this document are `PROPOSAL_ONLY`. They represent the first instrumentation run against representative contract execution paths in the test environment. They do not reflect production load, sustained throughput, or warmed-up runtime state. No measurement here may be cited as a current performance guarantee.

---

## Harness Configuration

- Contract: `PerformanceBenchmarkHarnessContract` (W8-T2 CP1)
- Environment: local test environment (deterministic mocks, injected timestamps)
- Run date: 2026-03-29
- Run type: representative contract-unit paths (not end-to-end production pipeline)
- Deterministic harness timestamp: `2026-03-29T14:30:00.000Z`

---

## Report Provenance

| Field | Value |
|---|---|
| Report ID | `07694a0023d8b6334a327a4622a7a8b8` |
| Report Hash | `ee7820674da17bd1a6e86e411019c2e2` |
| Generated At | `2026-03-29T14:30:00.000Z` |
| Total Runs | `5` |
| Total Measurements | `8` |
| Evidence Class | `PROPOSAL_ONLY` |

Governance note:

`All measurements produced by this harness are PROPOSAL ONLY. No performance numbers may be promoted to baseline truth without an explicit GC-026 tracker sync with trace-backed evidence attached (future wave).`

---

## Run Provenance

| Target | Run ID | Run Hash | Status | Started At | Completed At | Measurements |
|---|---|---|---|---|---|---|
| `CPF_PIPELINE` | `c744c023678be348b01d647d9c82b271` | `bbd2828aeee63adc8b81a9b842f47fdf` | `COMPLETE` | `2026-03-29T14:30:00.000Z` | `2026-03-29T14:30:00.000Z` | `3` |
| `EPF_PIPELINE` | `c3088428ed4b86407c8c5ff24941b27c` | `3dfbc38bf212a0e1c34a377ad9993c08` | `COMPLETE` | `2026-03-29T14:30:00.000Z` | `2026-03-29T14:30:00.000Z` | `2` |
| `GEF_PIPELINE` | `e4fdefd993026b9b61f49d5944b3bb41` | `7c7e2fd3729a49fd6872c67dbd12d40f` | `COMPLETE` | `2026-03-29T14:30:00.000Z` | `2026-03-29T14:30:00.000Z` | `1` |
| `LPF_PIPELINE` | `a0fa19c305fb1f18028f27a8d4639c06` | `6c56db545d17c626641930bf653f5707` | `COMPLETE` | `2026-03-29T14:30:00.000Z` | `2026-03-29T14:30:00.000Z` | `1` |
| `CROSS_PLANE` | `e8f90d22f80e2eda13d9194cbd13b75d` | `f695c29bc2ddd79f72cb61fe4020d3a2` | `COMPLETE` | `2026-03-29T14:30:00.000Z` | `2026-03-29T14:30:00.000Z` | `1` |

---

## Measurement Records

| Measurement ID | Run ID | Trace ID | Target | Metric | Value | Unit | Timestamp | Evidence Class |
|---|---|---|---|---|---:|---|---|---|
| `84ef62f3e3a9d96c4f5aaf70892fcb96` | `c744c023678be348b01d647d9c82b271` | `5d9ab7e38d9552bdb943f1256458675c` | `CPF_PIPELINE` | `LATENCY_MS` | 0.41 | `ms` | `2026-03-29T14:30:00.000Z` | `PROPOSAL_ONLY` |
| `5275c2b54d126cca49e339cece3d3af8` | `c744c023678be348b01d647d9c82b271` | `bc688e462b0c33f523386335b9d23d3e` | `CPF_PIPELINE` | `THROUGHPUT_OPS_PER_SEC` | 1280.0 | `ops/s` | `2026-03-29T14:30:00.000Z` | `PROPOSAL_ONLY` |
| `121a6fd4257178de2fe173e7c3626c41` | `c744c023678be348b01d647d9c82b271` | `ff690e9a5de730dcdef9e0a1dd4b079e` | `CPF_PIPELINE` | `MEMORY_MB` | 42.7 | `MB` | `2026-03-29T14:30:00.000Z` | `PROPOSAL_ONLY` |
| `a7c964a4365fdef71a7df12b3ad412c5` | `c3088428ed4b86407c8c5ff24941b27c` | `a2dce7261500c474103789e437d1d83f` | `EPF_PIPELINE` | `LATENCY_MS` | 0.58 | `ms` | `2026-03-29T14:30:00.000Z` | `PROPOSAL_ONLY` |
| `d1ffea1ded59e5efe8041a67f3bf6950` | `c3088428ed4b86407c8c5ff24941b27c` | `d7e95245a0f82fc14316de0ba659562b` | `EPF_PIPELINE` | `THROUGHPUT_OPS_PER_SEC` | 1115.0 | `ops/s` | `2026-03-29T14:30:00.000Z` | `PROPOSAL_ONLY` |
| `e3f9c26b73c8623f767f93312a6911be` | `e4fdefd993026b9b61f49d5944b3bb41` | `7f282d24a015f7d21cd01da0a6d6e744` | `GEF_PIPELINE` | `LATENCY_MS` | 0.37 | `ms` | `2026-03-29T14:30:00.000Z` | `PROPOSAL_ONLY` |
| `ab304c0a40dbc29a05d9c75cb63d043e` | `a0fa19c305fb1f18028f27a8d4639c06` | `d5e911bf2f2bf0cddbe80d841c45f48d` | `LPF_PIPELINE` | `LATENCY_MS` | 0.63 | `ms` | `2026-03-29T14:30:00.000Z` | `PROPOSAL_ONLY` |
| `1b92fdb45105e0d57283bd290f32512a` | `e8f90d22f80e2eda13d9194cbd13b75d` | `4df7ca710358b874a0878ded89325eae` | `CROSS_PLANE` | `LATENCY_MS` | 0.92 | `ms` | `2026-03-29T14:30:00.000Z` | `PROPOSAL_ONLY` |

---

## Interpretation

All sampled values reflect contract-unit execution time in the test harness, which uses deterministic mocks. These measurements confirm that:

1. The benchmark harness contract functions correctly end-to-end: `initRun -> startRun -> recordMeasurement -> completeRun -> generateReport`
2. Every measurement now has contract-grade provenance (`runId`, `measurementId`, `traceId`, `reportId`, `reportHash`)
3. Contract-unit execution in isolation is sub-millisecond as expected in the deterministic test environment
4. The harness can be extended to measure real pipeline integration in future waves

These numbers do **not** represent end-to-end pipeline performance under production load. Future waves must run the harness against live integration paths to produce trace-backed production evidence.

---

## Next Steps for Evidence Promotion

To promote any threshold from PROPOSAL ONLY to BASELINE TRUTH in a future wave:

1. Configure benchmark harness to instrument real pipeline integration paths (not contract mocks)
2. Run under representative load (not test-environment isolation)
3. Collect P95/P99 latency and throughput measurements over a sustained period
4. Commit the results as a dedicated baseline artifact
5. Issue GC-026 tracker sync noting the promotion

---

## Acceptance Policy Reference

Threshold targets declared in: `docs/reference/CVF_PERFORMANCE_ACCEPTANCE_POLICY_BASELINE_2026-03-29.md`

All targets remain `PROPOSAL ONLY` until a future wave delivers trace-backed evidence and issues a GC-026 tracker sync for promotion.
