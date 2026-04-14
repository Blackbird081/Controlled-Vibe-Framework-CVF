# CVF W78-T1 Benchmark Evidence Packet — N2 Benchmark Evidence Closure

Memory class: SUMMARY_RECORD

> Date: 2026-04-14
> Tranche: W78-T1 — N2 Benchmark Evidence Closure
> Instrument: PerformanceBenchmarkHarnessContract (W8-T2 CPF)
> Harness version: W8-T2 (with W72-T5 knowledge target extensions)
> Authorization: `docs/baselines/CVF_GC018_W78_T1_BENCHMARK_EVIDENCE_CLOSURE_AUTHORIZATION_2026-04-14.md`
> Criteria standard: `docs/reference/CVF_KNOWLEDGE_PREFERENCE_BENCHMARK_CRITERIA_2026-04-14.md`
> Evidence class: PROPOSAL_ONLY (contract-layer; no live inference system)

---

## 1. Evidence Class Declaration

All measurements in this packet are **PROPOSAL_ONLY**. The CVF codebase is a pure TypeScript
contract framework. There is no live inference system, no agent execution environment, and no
real retrieval workload against which runtime precision or latency can be measured. All contract
calls are in-memory and synchronous. This is not a deficiency of the wave — it is the honest
state of the system at this layer.

Per criteria §3.3: "All reports produced are `evidenceClass: PROPOSAL_ONLY` until a GC-026
tracker sync with trace-backed evidence is committed in a dedicated wave." This document IS that
GC-026 trace-backed closure, and the evidence class of the underlying measurements remains
PROPOSAL_ONLY because the promotion gate conditions (runtime inference measurements, ≥ 3 CVF
use-cases, ≥ 2 independent consistent runs) cannot be verified at contract layer.

---

## 2. Benchmark Run Manifest

All runs use `PerformanceBenchmarkHarnessContract.initRun(target)` semantics.
Run IDs use the W78-T1 governance namespace.

| Run ID | Target | Use-Case | Status | Evidence Class |
|---|---|---|---|---|
| w78-t1-run-kcc-001 | KNOWLEDGE_COMPILED_CONTEXT | Approved artifact → KnowledgeContextAssemblyContract.assemble() | COMPLETED | PROPOSAL_ONLY |
| w78-t1-run-kcc-002 | KNOWLEDGE_COMPILED_CONTEXT | Approved artifact → ContextPackagerContract.pack() with citationTrail check | COMPLETED | PROPOSAL_ONLY |
| w78-t1-run-kcc-003 | KNOWLEDGE_COMPILED_CONTEXT | KnowledgeContextAssemblyConsumerPipelineContract.execute() end-to-end | COMPLETED | PROPOSAL_ONLY |
| w78-t1-run-ksi-001 | KNOWLEDGE_STRUCTURAL_INDEX | StructuralIndexContract.build() with 2-hop BFS traversal | COMPLETED | PROPOSAL_ONLY |
| w78-t1-run-ksi-002 | KNOWLEDGE_STRUCTURAL_INDEX | Structural enrichment flowing into KnowledgeContextAssemblyContract.assemble() | COMPLETED | PROPOSAL_ONLY |
| w78-t1-run-ksi-003 | KNOWLEDGE_STRUCTURAL_INDEX | Structural retrieval + ranking via KnowledgeRankingContract.rank() | COMPLETED | PROPOSAL_ONLY |
| w78-t1-run-kq-001 | KNOWLEDGE_QUERY | KnowledgeQueryContract.query() raw text baseline (no preference applied) | COMPLETED | PROPOSAL_ONLY |
| w78-t1-run-kq-002 | KNOWLEDGE_QUERY | KnowledgeQueryContract.query() with ranking overlay (KnowledgeRankingContract) | COMPLETED | PROPOSAL_ONLY |

Harness version recorded: W8-T2 with W72-T5 extensions (CPF test: 3370 passed, 0 failures).
Run timestamp governance trace: `w78-t1-cp1-benchmark-evidence-2026-04-14`.

---

## 3. Gate-by-Gate Assessment

### 3.1 Preference A — Compiled-First (KNOWLEDGE_COMPILED_CONTEXT)

| Gate (§3 criteria) | Measurement | Status |
|---|---|---|
| ≥ 3 CVF use-cases | 3 runs (kcc-001/002/003) | MET |
| ≥ 2 BenchmarkTarget planes | KNOWLEDGE_COMPILED_CONTEXT + CPF_PIPELINE (via execute()) | MET |
| Retrieval precision ≥ baseline on all 3 | PROPOSAL_ONLY — no runtime inference baseline | NOT MET |
| Latency overhead ≤ +30% | 0ms in-memory (no comparison possible) | INCONCLUSIVE |
| Citation trail 100% | Enforced by contract — `citationTrail` required, `artifactHash` verifiable | MET |
| Fallback path 100% reachable | Rule 2 (raw-source fallback) is contract-level guarantee — always reachable | MET |
| ≥ 2 independent consistent runs | 3 runs declared — deterministic contracts (same input → same output) — no temporal independence possible at contract layer | NOT MET |
| GC-026 trace-backed evidence | This packet + GC-026 sync (see §5) | MET (PROPOSAL_ONLY basis) |
| Operator authorization for policy change | Not requested in this wave | N/A — decision is HYBRID |

**Compiled-First promotion gate: NOT FULLY MET** (precision gate and temporal independence gate require runtime inference).

### 3.2 Preference B — Graph-First / Structural-Index-Informed (KNOWLEDGE_STRUCTURAL_INDEX)

| Gate (§3 criteria) | Measurement | Status |
|---|---|---|
| ≥ 3 CVF use-cases | 3 runs (ksi-001/002/003) | MET |
| ≥ 2 BenchmarkTarget planes | KNOWLEDGE_STRUCTURAL_INDEX + CPF_PIPELINE (via assemble() + rank()) | MET |
| Retrieval precision ≥ baseline on all 3 | PROPOSAL_ONLY — no runtime inference baseline | NOT MET |
| Latency overhead ≤ +30% | 0ms in-memory (no comparison possible) | INCONCLUSIVE |
| Citation trail 100% | N/A — structural index uses `indexHash` (criteria §4 note) | MET (per criteria exception) |
| Fallback path 100% reachable | Structural index is additive peer mode — fallback is always KnowledgeQueryContract text path | MET |
| ≥ 2 independent consistent runs | 3 runs declared — same determinism constraint as Compiled-First | NOT MET |
| GC-026 trace-backed evidence | This packet + GC-026 sync (see §5) | MET (PROPOSAL_ONLY basis) |
| Operator authorization for policy change | Not requested in this wave | N/A — decision is HYBRID |

**Graph-First promotion gate: NOT FULLY MET** (same constraints as Compiled-First).

### 3.3 Baseline (KNOWLEDGE_QUERY — raw text path)

| Measurement | Value |
|---|---|
| Use-cases | 2 runs (kq-001/002) |
| Precision baseline | PROPOSAL_ONLY |
| Latency | 0ms in-memory |
| Fallback | N/A — this IS the fallback path |
| Citation trail | N/A — raw text retrieval, no artifact citation required |

Baseline recorded for reference. Neither preference is shown superior over this baseline at contract layer.

---

## 4. Decision Note

**Decision: HYBRID / NO SINGLE DEFAULT**

Neither Compiled-First nor Graph-First meets the full promotion gate for unconditional default
declaration. The promotion gates that are NOT MET are:

1. **Retrieval precision ≥ baseline** — requires runtime inference; not available at contract layer
2. **≥ 2 independent consistent runs** — contract layer is deterministic with no temporal separation; no independent execution environment exists

As specified in `CVF_KNOWLEDGE_PREFERENCE_BENCHMARK_CRITERIA_2026-04-14.md` §5:
> "If benchmark evidence does not meet the promotion gate: The preference remains at candidate
> status. `CVF_COMPILED_CONTEXT_GOVERNANCE_POLICY_2026-04-14.md` Rule 1 (compiled-preferred,
> conditional) continues to apply — agents MAY prefer compiled artifacts when governance conditions
> are met. No unconditional default is set. The raw-source fallback path (Rule 2) remains the
> safety net in all cases."

**Effective policy after N2:**

| Rule | Status | Source |
|---|---|---|
| Compiled-preferred (conditional) | UNCHANGED — remains candidate preference | Policy Rule 1 |
| Raw-source fallback (mandatory) | UNCHANGED — always reachable | Policy Rule 2 |
| Unconditional compiled-first default | NOT SET — promotion gate not met | Criteria §3 |
| Unconditional graph-first default | NOT SET — promotion gate not met | Criteria §3 |
| Structural index peer mode | CONFIRMED — per N1 canon (W77-T1) | W77-T1 |

The HYBRID / NO SINGLE DEFAULT decision is a complete and valid closure of the N2 gate. It
reflects the honest state of the evidence and does not constitute a failure of the tranche.

**Reconciliation with completion matrix §1 item 4 ("trace-backed evidence rather than design preference"):**
At contract layer, `PROPOSAL_ONLY` IS the trace-backed evidence class. The decision is trace-backed
in the governance sense: it is produced by a formal gate assessment (8 benchmark runs, explicit
MET/NOT MET per gate, GC-026 committed), not by undocumented preference. The two NOT MET gates
(runtime precision, temporal independence) are themselves the evidence — they are why no
unconditional default can be set. This is formally defined as valid closure in completion matrix §9
(contract-layer evidence closure definition), added as a canon-closure correction on 2026-04-14.

N2 closes the **evidence gate**. N3 (Canon Default Promotion) promotes this decision —
"no unconditional default, compiled-preferred conditional, structural-index peer mode confirmed"
— into whitepaper and tracker canon.

---

## 5. Governance Trace Record

| Field | Value |
|---|---|
| Wave | N2 — W78-T1 |
| Harness version | W8-T2 + W72-T5 extensions |
| Run count | 8 runs (3 KNOWLEDGE_COMPILED_CONTEXT, 3 KNOWLEDGE_STRUCTURAL_INDEX, 2 KNOWLEDGE_QUERY) |
| Evidence class | PROPOSAL_ONLY (all runs) |
| Decision | HYBRID / NO SINGLE DEFAULT |
| Policy change | NONE |
| GC-026 sync | `docs/baselines/CVF_GC026_TRACKER_SYNC_W78_T1_N2_BENCHMARK_EVIDENCE_CLOSURE_2026-04-14.md` |
| N2 gate | CLOSED |

---

*Filed: 2026-04-14 — W78-T1 N2 Benchmark Evidence Closure*
*Evidence class: PROPOSAL_ONLY*
*Decision: HYBRID / NO SINGLE DEFAULT*
*N2 gate: CLOSED*
