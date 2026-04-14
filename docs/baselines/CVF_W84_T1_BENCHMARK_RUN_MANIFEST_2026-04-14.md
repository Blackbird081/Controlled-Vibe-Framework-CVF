# CVF W84-T1 Benchmark Run Manifest

Memory class: SUMMARY_RECORD

> Tranche: W84-T1 — Knowledge Live Benchmark Evidence Promotion
> Date frozen: 2026-04-14
> Status: FROZEN — do not alter after first run
> GC-018: `docs/baselines/CVF_GC018_W84_T1_KNOWLEDGE_LIVE_BENCHMARK_EVIDENCE_PROMOTION_AUTHORIZATION_2026-04-14.md`

---

## 1. Provider and Model

| Field | Value |
|---|---|
| Provider | Alibaba DashScope |
| Model | `qwen-max` |
| Endpoint | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions` |
| Temperature | 0.1 |
| Max tokens | 256 |
| Excluded model | `qvq-max` (operator instruction) |

---

## 2. Benchmark Tool

| Field | Value |
|---|---|
| File | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/knowledge/benchmark.live.test.ts` |
| Tranche adoption | YES — adopted into W84-T1 scope under GC-018 |
| Env var required | `CVF_BENCHMARK_ALIBABA_KEY` |
| Run command | `$env:CVF_BENCHMARK_ALIBABA_KEY="<key>"; npx vitest run src/app/api/governance/knowledge/benchmark.live.test.ts --reporter=verbose` |

---

## 3. Scenarios (Frozen)

### Scenario kcc-live-001

| Field | Value |
|---|---|
| ID | `kcc-live-001` |
| BenchmarkTarget (compiled path) | `KNOWLEDGE_COMPILED_CONTEXT` |
| BenchmarkTarget (baseline path) | `KNOWLEDGE_QUERY` |
| Content seed | VEGA-9 governance mandate / PRISM-signature / Sanctum Council / DARK-STATUS |
| Question | What is required for a compiled artifact to enter the query pool? |
| Ground truth keywords | `PRISM-signature`, `Sanctum Council`, `DARK-STATUS` |
| Contamination guard | All terms are invented — not present in model training data |

### Scenario kcc-live-002

| Field | Value |
|---|---|
| ID | `kcc-live-002` |
| BenchmarkTarget (compiled path) | `KNOWLEDGE_COMPILED_CONTEXT` |
| BenchmarkTarget (baseline path) | `KNOWLEDGE_QUERY` |
| Content seed | DELTA-MAINTENANCE protocol / FLUX-CONTAMINATION / ECHO-VAULT / REFLEX-BOARD / 72 hours |
| Question | What happens to an artifact with FLUX-CONTAMINATION? |
| Ground truth keywords | `ECHO-VAULT`, `72 hours`, `REFLEX-BOARD` |
| Contamination guard | All terms are invented — not present in model training data |

### Scenario kcc-live-003

| Field | Value |
|---|---|
| ID | `kcc-live-003` |
| BenchmarkTarget (compiled path) | `KNOWLEDGE_COMPILED_CONTEXT` |
| BenchmarkTarget (baseline path) | `KNOWLEDGE_QUERY` |
| Content seed | CATALYST-REFACTOR rule / SIGMA-DRIFT signals / PRAXIS-COMMITTEE / TERMINUS-ORDER |
| Question | What happens to an artifact with three or more SIGMA-DRIFT signals? |
| Ground truth keywords | `PRAXIS-COMMITTEE`, `TERMINUS-ORDER`, `archive` |
| Contamination guard | All terms are invented — not present in model training data |

---

## 4. Metrics (Frozen)

| Metric | Instrument | Formula |
|---|---|---|
| Precision | Keyword recall | keywords found in answer (case-insensitive) ÷ total keywords |
| Latency | Wall-clock ms | `Date.now()` delta from request start to JSON parse complete |
| Consistency delta | Absolute run difference | `|run1.prec - run2.prec|` per scenario |

---

## 5. Pass Criteria (Frozen)

| Gate | Criterion | Pass condition |
|---|---|---|
| Gate 1 — Retrieval precision | Compiled-context precision ≥ raw-query baseline | Must hold on ≥ 3/3 scenarios (both runs averaged) |
| Gate 2 — Temporal consistency | Run delta ≤ 0.4 per scenario | Must hold on ≥ 3/3 scenarios |
| Latency overhead | Compiled path overhead vs raw baseline | ≤ +30% |
| Citation trail | All compiled artifacts carry citationTrail | 100% (enforced by contract) |
| Fallback coverage | Raw-query baseline path exercised | Every run — both paths executed |

---

## 6. Run Count

| Field | Value |
|---|---|
| Runs per scenario | 2 (Run 1, Run 2) |
| Paths per scenario | 2 (compiled-context, raw-query baseline) |
| Total API calls | 12 (3 scenarios × 2 runs × 2 paths) |

---

## 7. Operator Sign-Off Fields

| Field | Value |
|---|---|
| Manifest frozen by | CVF Agent (W84-T1) |
| Manifest frozen date | 2026-04-14 |
| Operator authorization | GC-018 (`CVF_GC018_W84_T1_KNOWLEDGE_LIVE_BENCHMARK_EVIDENCE_PROMOTION_AUTHORIZATION_2026-04-14.md`) |
| Run executed by | CVF Agent (W84-T1) |
| Run date | 2026-04-14 |
| Pass/fail status | Filed in: `docs/baselines/CVF_W84_T1_KNOWLEDGE_LIVE_BENCHMARK_EVIDENCE_PACKET_2026-04-14.md` |

---

*Filed: 2026-04-14 — W84-T1 Run Manifest — FROZEN*
