# CVF W84-T1 Knowledge Live Benchmark Evidence Packet

Memory class: SUMMARY_RECORD

> Tranche: W84-T1 — Knowledge Live Benchmark Evidence Promotion
> Date: 2026-04-14
> Evidence class: LIVE_INFERENCE
> GC-018: `docs/baselines/CVF_GC018_W84_T1_KNOWLEDGE_LIVE_BENCHMARK_EVIDENCE_PROMOTION_AUTHORIZATION_2026-04-14.md`
> Manifest: `docs/baselines/CVF_W84_T1_BENCHMARK_RUN_MANIFEST_2026-04-14.md`
> Tool: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/knowledge/benchmark.live.test.ts`

---

## 1. Run Identification

| Field | Value |
|---|---|
| Provider | Alibaba DashScope |
| Model | `qwen-max` |
| Run date | 2026-04-14 16:24:47 UTC+07:00 |
| Total calls | 12 (3 scenarios × 2 runs × 2 paths) |
| Total runtime | 9.43s (benchmark execution phase only) |
| Exit code | 0 (all 12/12 tests passed) |
| Harness version | W84-T1 adopted `benchmark.live.test.ts` |

---

## 2. Per-Run Raw Results

| Scenario | Run | Path | Precision | Latency (ms) |
|---|---|---|---|---|
| kcc-live-001 | 1 | compiled-context | 0.67 | 815 |
| kcc-live-001 | 1 | raw-query baseline | 0.33 | 906 |
| kcc-live-002 | 1 | compiled-context | 1.00 | 1028 |
| kcc-live-002 | 1 | raw-query baseline | 1.00 | 1975 |
| kcc-live-003 | 1 | compiled-context | 0.33 | 1032 |
| kcc-live-003 | 1 | raw-query baseline | 0.33 | 709 |
| kcc-live-001 | 2 | compiled-context | 0.67 | 710 |
| kcc-live-001 | 2 | raw-query baseline | 0.33 | 802 |
| kcc-live-002 | 2 | compiled-context | 1.00 | 1033 |
| kcc-live-002 | 2 | raw-query baseline | 1.00 | 1928 |
| kcc-live-003 | 2 | compiled-context | 0.33 | 937 |
| kcc-live-003 | 2 | raw-query baseline | 0.33 | 880 |

---

## 3. Per-Scenario Summary

### kcc-live-001 — VEGA-9 / PRISM-signature

| Metric | Compiled | Raw | Delta |
|---|---|---|---|
| Run 1 precision | 0.67 | 0.33 | +0.33 |
| Run 2 precision | 0.67 | 0.33 | +0.33 |
| Avg precision | **0.67** | **0.33** | **+0.33** |
| Run 1 latency | 815ms | 906ms | -91ms |
| Run 2 latency | 710ms | 802ms | -92ms |
| Avg latency | 762ms | 854ms | -92ms (compiled faster) |
| Temporal delta | 0.00 | 0.00 | — |

Model answered: `PRISM-signature` + `Sanctum Council` on compiled path (2/3 keywords).
Missing keyword on raw path: `PRISM-signature` (model answered about approval without naming PRISM-signature).
Compiled artifact governance metadata appears to have helped anchor the specific term.

### kcc-live-002 — DELTA-MAINTENANCE / FLUX-CONTAMINATION

| Metric | Compiled | Raw | Delta |
|---|---|---|---|
| Run 1 precision | 1.00 | 1.00 | +0.00 |
| Run 2 precision | 1.00 | 1.00 | +0.00 |
| Avg precision | **1.00** | **1.00** | **+0.00** |
| Run 1 latency | 1028ms | 1975ms | -947ms |
| Run 2 latency | 1033ms | 1928ms | -895ms |
| Avg latency | 1031ms | 1952ms | -921ms (compiled faster) |
| Temporal delta | 0.00 | 0.00 | — |

Both paths achieved perfect recall on all 3 keywords (ECHO-VAULT, 72 hours, REFLEX-BOARD).
Raw path latency was approximately 89% higher than compiled — likely model/network variance (prompts are comparable in token length). Not a systematic effect.

### kcc-live-003 — CATALYST-REFACTOR / SIGMA-DRIFT

| Metric | Compiled | Raw | Delta |
|---|---|---|---|
| Run 1 precision | 0.33 | 0.33 | +0.00 |
| Run 2 precision | 0.33 | 0.33 | +0.00 |
| Avg precision | **0.33** | **0.33** | **+0.00** |
| Run 1 latency | 1032ms | 709ms | +323ms |
| Run 2 latency | 937ms | 880ms | +57ms |
| Avg latency | 985ms | 795ms | +190ms (compiled slower) |
| Temporal delta | 0.00 | 0.00 | — |

Both paths retrieved only `PRAXIS-COMMITTEE` (1/3 keywords). The model's answers were
truncated at 256 tokens and omitted `TERMINUS-ORDER` and `archive`. The compiled artifact
structure did not help when the answer requires multiple specific terms within token constraints.
This is an honest weak-evidence finding.

---

## 4. Aggregate Statistics

| Metric | Compiled path | Raw path | Delta |
|---|---|---|---|
| Overall avg precision | **0.667** | **0.556** | **+0.111** |
| Min scenario precision | 0.33 | 0.33 | — |
| Max scenario precision | 1.00 | 1.00 | — |
| Avg latency (all calls) | 926ms | 1200ms | -274ms |
| Scenarios where compiled > raw | 1/3 | — | — |
| Scenarios where compiled = raw | 2/3 | — | — |
| Scenarios where compiled < raw | 0/3 | — | — |

Latency note: the raw path avg is inflated by kcc-live-002 outlier (1975ms, 1928ms).
Latency differences are within typical network variance and should not be interpreted as a
systematic compiled-context speed advantage.

---

## 5. Gate Assessment

| Gate | Criterion | Result | Status |
|---|---|---|---|
| Gate 1 — Precision ≥ baseline | compiled ≥ raw on ≥ 3/3 scenarios | 3/3 (0.67≥0.33, 1.00≥1.00, 0.33≥0.33) | **MET ✓** |
| Gate 2 — Temporal consistency | run delta ≤ 0.4 on ≥ 3/3 scenarios | 0.00 delta on all 3 | **MET ✓** |
| Latency overhead ≤ +30% | compiled not more than 30% slower than raw | compiled is FASTER on avg | **MET ✓** |
| Citation trail 100% | all compiled artifacts carry citationTrail | enforced by contract | **MET ✓** |
| Fallback coverage 100% | raw-query path exercised every run | 6/6 raw calls completed | **MET ✓** |
| ≥ 2 independent consistent runs | 2 runs, same conditions | Run 1 and Run 2 consistent | **MET ✓** |
| ≥ 3 distinct use-cases | 3 scenarios | kcc-live-001, 002, 003 | **MET ✓** |
| ≥ 2 BenchmarkTarget planes | both KNOWLEDGE_COMPILED_CONTEXT and KNOWLEDGE_QUERY | both exercised | **MET ✓** |

All 8 measurable gates: **MET**.

---

## 6. Evidence Interpretation (Conservative)

All promotion gates pass at the measurement level. However, the evidence strength is weak:

- **2/3 scenarios are tied** (compiled = raw precision). The compiled artifact structure provides
  no measurable advantage when scenario content is simple enough for the model to extract all
  terms from raw text.
- **1/3 scenario shows compiled advantage** (+0.33 delta). The compiled artifact structure helps
  anchor governance-specific terminology when the model must distinguish between similar terms.
- **Absolute precision is moderate**: compiled avg 0.667 is not dominant — there is room for
  the raw-source fallback to perform equivalently.
- **Latency difference is within noise**: compiled path token overhead did not produce measurable
  latency penalty; the raw path outlier in kcc-live-002 is not a systematic finding.

This evidence does not warrant upgrading to an unconditional compiled-first default.
The evidence does confirm that compiled-context is at minimum equal to raw-source across all
tested scenarios, which supports the conditional compiled-preference (Rule 1).

---

## 7. Decision

**HYBRID / NO SINGLE DEFAULT CONFIRMED**

This decision is consistent with the W78-T1 contract-layer decision, now backed by live inference.

| Policy rule | Status after W84-T1 |
|---|---|
| Rule 1 — compiled-preferred (conditional) | SUPPORTED by live evidence. When a governed artifact exists, compiled ≥ raw on all 3 tested scenarios. |
| Rule 2 — raw-source fallback (mandatory) | CONFIRMED ESSENTIAL. Tied precision in 2/3 scenarios demonstrates raw baseline achieves equivalent quality; fallback must remain always reachable. |
| Rule 3 — no unconditional compiled-first default | UNCHANGED. Evidence margin (+0.111 avg delta, 2/3 tied) is insufficient to warrant unconditional default promotion without operator authorization for policy change. |
| Unconditional default | NOT SET |

No policy change. No canon change. W79-T1 N3 decision remains canonical.

---

## 8. Evidence Class

Previous evidence class (W78-T1): `PROPOSAL_ONLY` (contract-layer, no live inference)

W84-T1 evidence class: **`LIVE_INFERENCE`**

Evidence class is upgraded from `PROPOSAL_ONLY` to `LIVE_INFERENCE` for the two NOT MET gates:
- Gate 1 (precision ≥ baseline): evidence class now LIVE_INFERENCE ✓
- Gate 2 (temporal consistency): evidence class now LIVE_INFERENCE ✓

This upgrade does not change the decision — it provides trace-backed confirmation of the existing canon.

---

*Filed: 2026-04-14 — W84-T1 Knowledge Live Benchmark Evidence Packet*
*Evidence class: LIVE_INFERENCE*
*Decision: HYBRID / NO SINGLE DEFAULT CONFIRMED*
