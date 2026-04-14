# GC-018 Authorization — W78-T1 N2 Benchmark Evidence Closure

Memory class: SUMMARY_RECORD

> Date: 2026-04-14
> Tranche: W78-T1 — N2 Benchmark Evidence Closure
> Wave: N2 of CVF-native completion matrix
> Class: EVIDENCE
> Lane: Fast Lane (GC-021) — documentation only, no contract changes
> Prerequisite assessment: `docs/assessments/CVF_POST_W77_CONTINUATION_QUALITY_ASSESSMENT_2026-04-14.md`

---

## 1. Authorization Subject

Execute the N2 Benchmark Evidence Closure wave as defined by the CVF-native completion matrix
(`docs/roadmaps/CVF_GRAPHIFY_LLM_POWERED_PALACE_CVF_NATIVE_COMPLETION_MATRIX_2026-04-14.md` §5).

---

## 2. Mandate

Produce trace-backed benchmark evidence using the criteria from
`docs/reference/CVF_KNOWLEDGE_PREFERENCE_BENCHMARK_CRITERIA_2026-04-14.md` and the
W72-T5 `BenchmarkTarget` extensions. Render an explicit decision note with one of:

- `COMPILED-PREFERRED DEFAULT`
- `GRAPH-INFORMED DEFAULT`
- `HYBRID / NO SINGLE DEFAULT`

Produce a GC-026 tracker sync and update `AGENT_HANDOFF.md`.

---

## 3. Authorized Scope

| Item | Authorized |
|---|---|
| Produce benchmark run manifest using W72-T5 targets | YES |
| Use `PerformanceBenchmarkHarnessContract` as instrument | YES |
| Declare evidence class PROPOSAL_ONLY (contract-layer only) | YES |
| Render decision: HYBRID / NO SINGLE DEFAULT | YES |
| Produce GC-026 tracker sync | YES |
| Update AGENT_HANDOFF.md to advance to N3 | YES |

---

## 4. Hard Boundaries

- Do NOT change any policy default in this wave
- Do NOT modify any `.ts` contract file
- Do NOT choose compiled-first or graph-informed as unconditional default without meeting all promotion gates in §3 of the benchmark criteria
- Do NOT reopen source folders (Graphify, LLM-Powered, Palace)
- PROPOSAL_ONLY evidence class is honest and required; do not inflate to "confirmed evidence"

---

## 5. Benchmark Inputs

| Input | File | Status |
|---|---|---|
| Criteria standard | `docs/reference/CVF_KNOWLEDGE_PREFERENCE_BENCHMARK_CRITERIA_2026-04-14.md` | PRESENT |
| Instrument contract | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/performance.benchmark.harness.contract.ts` | PRESENT |
| W72-T5 targets | `KNOWLEDGE_QUERY`, `KNOWLEDGE_RANKING`, `KNOWLEDGE_STRUCTURAL_INDEX`, `KNOWLEDGE_COMPILED_CONTEXT` | LANDED |
| Governance policy | `docs/reference/CVF_COMPILED_CONTEXT_GOVERNANCE_POLICY_2026-04-14.md` | PRESENT |

---

## 6. Expected Decision Rationale

At contract layer without live inference:
- `KNOWLEDGE_COMPILED_CONTEXT` — citation trail 100% (contract-enforced), latency 0ms (in-memory), precision = contract-defined (not runtime-measured). Precision gate PROPOSAL_ONLY only.
- `KNOWLEDGE_STRUCTURAL_INDEX` — index hash 100% (contract-enforced), latency 0ms, precision = contract-defined. Same status.

Neither preference meets the full promotion gate (promotion requires runtime measurement evidence,
≥ 3 use-cases, ≥ 2 independent runs with real latency/precision data).

Expected decision: **HYBRID / NO SINGLE DEFAULT** — existing Rule 1 (compiled-preferred, conditional) and Rule 2 (raw-source fallback) remain unchanged. No unconditional default is set.

---

## 7. Exit Criteria for W78-T1

- Benchmark run manifest produced with ≥ 4 run records (2 per preference, 2 use-cases minimum)
- Evidence packet filed with gate-by-gate assessment
- Decision note filed: HYBRID / NO SINGLE DEFAULT
- GC-026 tracker sync committed
- AGENT_HANDOFF.md updated: N2 CLOSED, N3 is current required step

---

## 8. What This Tranche Does NOT Do

- Does not promote compiled-first or graph-first as unconditional default
- Does not modify any contract, test, or barrel
- Does not create new CPF capability
- Does not re-audit source folders

---

*GC-018 Authorization: APPROVED*
*Tranche: W78-T1 — N2 Benchmark Evidence Closure*
*Date: 2026-04-14*
