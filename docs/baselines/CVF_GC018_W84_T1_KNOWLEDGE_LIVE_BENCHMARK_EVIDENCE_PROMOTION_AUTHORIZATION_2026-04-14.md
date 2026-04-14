# GC-018 Authorization — W84-T1 Knowledge Live Benchmark Evidence Promotion

Memory class: SUMMARY_RECORD

> Date: 2026-04-14
> Tranche: W84-T1 — Knowledge Live Benchmark Evidence Promotion
> Class: VALIDATION_EVIDENCE / GOVERNED_RUNTIME_BENCHMARK
> Lane: Full Lane — new evidence-producing surface committed
> Prerequisite assessment: `docs/assessments/CVF_POST_W83_CONTINUATION_QUALITY_ASSESSMENT_2026-04-14.md`
> Roadmap: `docs/roadmaps/CVF_W84_T1_KNOWLEDGE_LIVE_BENCHMARK_EVIDENCE_PROMOTION_ROADMAP_2026-04-14.md`

---

## 1. Authorization Subject

Execute the W84-T1 Knowledge Live Benchmark Evidence Promotion wave, promoting the knowledge
benchmark evidence from contract-layer `PROPOSAL_ONLY` (W78-T1) to governed live-runtime
`LIVE_INFERENCE` evidence with a formal run manifest, reproducible traces, and a decision packet.

---

## 2. Mandate

1. Formally adopt the exploratory benchmark harness into W84-T1 tranche scope (or create anew)
2. Freeze a run manifest declaring scenarios, metrics, provider/model, pass criteria, and run count
3. Execute the benchmark under the declared manifest
4. Produce a governed evidence packet from actual run output only
5. Produce a post-run quality assessment with one explicit decision
6. Record outcome in a GC-026 tracker sync
7. Update `AGENT_HANDOFF.md` with W84-T1 outcome and canon impact

---

## 3. Authorized Scope

| Item | Authorized |
|---|---|
| Formally adopt `benchmark.live.test.ts` as W84-T1 tranche artifact | YES |
| Execute live benchmark runs against Alibaba DashScope `qwen-max` | YES |
| Use `qwen-max` as the inference model | YES |
| Use invented domain scenarios (contamination-resistant design) | YES |
| Produce run manifest documenting scenarios + pass criteria | YES |
| Produce `LIVE_INFERENCE` evidence packet from actual results | YES |
| Issue decision: one of HYBRID/NO SINGLE DEFAULT CONFIRMED, COMPILED-PREFERRED DEFAULT SUPPORTED, LIVE EVIDENCE INCONCLUSIVE | YES |
| Update AGENT_HANDOFF.md | YES |
| Produce GC-026 closure sync | YES |

---

## 4. Provider and Model Lane

| Field | Value |
|---|---|
| Provider | Alibaba DashScope (OpenAI-compatible endpoint) |
| Model | `qwen-max` |
| Explicitly excluded | `qvq-max` (operator instruction: quota exhausted) |
| Endpoint | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions` |
| Key source | Operator-supplied; loaded from env var `CVF_BENCHMARK_ALIBABA_KEY` |

---

## 5. Benchmark Design Constraints

| Field | Value |
|---|---|
| Scenario count | 3 (kcc-live-001, kcc-live-002, kcc-live-003) |
| BenchmarkTarget planes | `KNOWLEDGE_COMPILED_CONTEXT` (compiled path) + `KNOWLEDGE_QUERY` (raw baseline) |
| Runs per scenario | 2 independent (different timestamps) |
| Temperature | 0.1 (near-deterministic for consistency) |
| Precision metric | Keyword recall: keywords found in answer ÷ total keywords |
| Consistency rule | Run delta ≤ 0.4 per scenario for temporal gate |
| Contamination guard | All scenarios use invented domain terminology not in model training data |

---

## 6. Hard Boundaries

- Do NOT change any CPF contract, test, or barrel file
- Do NOT change policy defaults (Rule 1 / Rule 2) without explicit evidence packet conclusion
- Do NOT cherry-pick runs or edit scenarios after manifest freeze
- Do NOT inflate evidence class beyond what run output supports
- Do NOT use `qvq-max` or any model with confirmed quota exhaustion
- Do NOT cite the exploratory run from the previous session as formal tranche evidence — new runs under this authorization are the authoritative record
- If evidence is mixed or weak, record it honestly; roadmap §9 is binding

---

## 7. Expected Decision Rationale

Based on the W78-T1 contract-layer analysis and exploratory benchmark:

- `KNOWLEDGE_COMPILED_CONTEXT`: compiled artifact structure includes governance metadata, citation trail, and `approved` status — provides structured context to the model
- `KNOWLEDGE_QUERY` (raw baseline): raw source text only — no governance metadata

If compiled ≥ raw on all 3 scenarios AND temporal gate passes: promotion gate technically met.
Conservative interpretation applies: if margin is weak (≤ 0.15 average delta), decision remains
`HYBRID / NO SINGLE DEFAULT CONFIRMED`.

---

## 8. Exit Criteria for W84-T1

- Run manifest exists and was frozen before executing runs
- Live benchmark tool formally adopted (header updated, tranche ID in file)
- Evidence packet filed with per-scenario and per-gate results
- Decision explicitly stated
- Post-run quality assessment filed
- GC-026 closure sync committed
- AGENT_HANDOFF.md updated: W84-T1 result + canon impact

---

## 9. What This Tranche Does NOT Do

- Does not modify any CPF contract, test, or policy document
- Does not guarantee promotion gate will be met (run must produce honest evidence)
- Does not retroactively upgrade the exploratory session run to formal evidence
- Does not open any new capability surface beyond the benchmark tool artifact

---

*GC-018 Authorization: APPROVED*
*Tranche: W84-T1 — Knowledge Live Benchmark Evidence Promotion*
*Date: 2026-04-14*
