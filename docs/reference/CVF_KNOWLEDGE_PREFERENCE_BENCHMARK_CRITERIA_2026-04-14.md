# CVF Knowledge Preference Benchmark Criteria

Memory class: POINTER_RECORD

> Date: 2026-04-14
> Tranche: W72-T3
> Authority: GC-021 Fast Lane audit `CVF_W72_T3_KNOWLEDGE_PREFERENCE_BENCHMARK_CRITERIA_GC021_FAST_LANE_AUDIT_2026-04-14.md`
> Intake: W72-T2 `CVF_COMPILED_CONTEXT_GOVERNANCE_POLICY_2026-04-14.md` §4 (Rule 3)
> Status: CRITERIA STANDARD — not implementation authority; not a policy default change

---

## 1. Purpose

W72-T2 established that neither compiled-first nor graph-first may be declared an unconditional
default retrieval preference without benchmark evidence. This document defines exactly what that
benchmark evidence must look like before either preference is promoted from candidate to default policy.

---

## 2. The Two Candidate Preferences

### Preference A — Compiled-First

**Current status:** Candidate (from `CVF_COMPILED_CONTEXT_GOVERNANCE_POLICY_2026-04-14.md` Rule 1)

**Claim to prove:** Context assembled from approved compiled artifacts produces higher-quality
agent behavior than context assembled from raw source retrieval alone, on representative CVF use-cases.

### Preference B — Graph-First (Structural-Index-Informed)

**Current status:** Candidate (from W72-T1 `StructuralIndexContract`, synthesis note §2.2)

**Claim to prove:** Context that includes structurally-retrieved neighbors from `StructuralIndexContract`
produces higher-quality agent behavior than text-only retrieval alone, on representative CVF use-cases.

---

## 3. Required Evidence Standard

To promote either preference from candidate to default policy, the following must all be true:

### 3.1 Minimum Use-Case Coverage

- At least **3 distinct CVF use-cases** must be tested per preference
- Use-cases must span at least **2 different BenchmarkTarget planes** (e.g., CPF_PIPELINE + LPF_PIPELINE)
- Each use-case must have a declared baseline (raw source retrieval, no compiled preference)

### 3.2 Measurement Requirements

Each benchmark run must record:

| Metric | Instrument | Minimum threshold for promotion |
|---|---|---|
| Retrieval precision | `PerformanceBenchmarkHarnessContract` — custom measurement | Compiled/structural result must be ≥ baseline in ≥ 3/3 use-cases |
| Latency overhead | `PerformanceBenchmarkHarnessContract` — `LATENCY_MS` | Compiled/structural overhead must not exceed +30% of raw baseline |
| Citation trail integrity | Audit check: `citationTrail` present + verifiable in all returned artifacts | 100% — no exceptions |
| Fallback coverage | Test: raw-source fallback path exercised in every run | 100% — fallback must always be reachable |

### 3.3 Evidence Class Requirements

- All runs must use `PerformanceBenchmarkHarnessContract` (W8-T2 CPF)
- All reports produced are `evidenceClass: PROPOSAL_ONLY` until a **GC-026 tracker sync** with
  trace-backed evidence is committed in a dedicated wave
- A `PROPOSAL_ONLY` report alone is **not** sufficient to change policy defaults
- The GC-026 sync must include: run manifest, trace IDs, harness version, operator sign-off

### 3.4 Consistency Requirement

- The same preference must hold across **≥ 2 independent benchmark runs** (different timestamps,
  same use-cases) before being declared stable
- A single-run result may be noted as preliminary evidence but cannot trigger a policy change

### 3.5 Required BenchmarkTarget Extensions

`PerformanceBenchmarkHarnessContract.BenchmarkTarget` currently supports:
`CPF_PIPELINE | EPF_PIPELINE | GEF_PIPELINE | LPF_PIPELINE | CROSS_PLANE`

Knowledge-layer preference benchmarks require additional targets. These are **candidate extensions**
for a future implementation wave:

| Candidate target | Measures |
|---|---|
| `KNOWLEDGE_QUERY` | Text-based retrieval via `KnowledgeQueryContract` |
| `KNOWLEDGE_RANKING` | Ranked retrieval via `KnowledgeRankingContract` |
| `KNOWLEDGE_STRUCTURAL_INDEX` | Structural traversal via `StructuralIndexContract` |
| `KNOWLEDGE_COMPILED_CONTEXT` | Context packaging from compiled artifacts |

These extensions require a GC-018 wave authorization for `PerformanceBenchmarkHarnessContract`
before they can be added. They are listed here as criteria prerequisites, not as implementation
instructions.

---

## 4. Promotion Gate Summary

| Gate | Compiled-First | Graph-First |
|---|---|---|
| ≥ 3 CVF use-cases tested | Required | Required |
| ≥ 2 BenchmarkTarget planes | Required | Required |
| Retrieval precision ≥ baseline on all 3 use-cases | Required | Required |
| Latency overhead ≤ +30% | Required | Required |
| Citation trail 100% | Required | Not applicable (structural index has `indexHash`) |
| Fallback path 100% reachable | Required | Required |
| ≥ 2 independent consistent runs | Required | Required |
| GC-026 tracker sync with trace evidence | Required | Required |
| Operator authorization for policy change | Required | Required |

All gates must pass. Partial evidence does not justify a partial default. The policy remains
compiled-preferred (conditional) + raw-source fallback until all gates are cleared.

---

## 5. What Happens If Preference Is NOT Proven

If benchmark evidence does not meet the promotion gate:

- The preference remains at **candidate status**
- `CVF_COMPILED_CONTEXT_GOVERNANCE_POLICY_2026-04-14.md` Rule 1 (compiled-preferred, conditional)
  continues to apply — agents MAY prefer compiled artifacts when governance conditions are met
- No unconditional default is set
- The raw-source fallback path (Rule 2) remains the safety net in all cases

Inconclusive or contradictory evidence should be logged in `PerformanceBenchmarkHarnessContract`
with `evidenceClass: PROPOSAL_ONLY` and the gate results noted for the next wave.

---

## 6. What This Document Does NOT Do

- Does not run any benchmark — this is criteria-only
- Does not promote either preference — no default changes in this document
- Does not extend `PerformanceBenchmarkHarnessContract` — requires future GC-018 wave
- Does not change any existing contract, test, or policy document
- Does not grant implementation authority to the described extensions

---

*Filed: 2026-04-14 — W72-T3 CP1 Knowledge Preference Benchmark Criteria*
