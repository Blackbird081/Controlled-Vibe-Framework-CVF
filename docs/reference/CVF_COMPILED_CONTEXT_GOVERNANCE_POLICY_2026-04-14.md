# CVF Compiled Context Governance Policy

Memory class: POINTER_RECORD

> Date: 2026-04-14
> Tranche: W72-T2
> Authority: GC-021 Fast Lane audit `CVF_W72_T2_KNOWLEDGE_COMPILATION_DOCTRINE_UPLIFT_GC021_FAST_LANE_AUDIT_2026-04-14.md`
> Lifecycle step: Query (Step 4) — Context Builder behavior
> Intake: `CVF_GRAPHIFY_LLM_POWERED_PALACE_CVF_NATIVE_SYNTHESIS_NOTE_2026-04-13.md` §2.1, §2.2, §2.3
> Status: POLICY — not implementation authority

---

## 1. Purpose

This document defines how compiled knowledge artifacts may feed context packaging, how they relate
to the three Query-step retrieval modes, and what governance conditions govern preference between
compiled artifacts and raw sources.

---

## 2. Retrieval Mode Landscape (Query Step)

The `Query` step (Step 4 in the lifecycle) offers three retrieval modes. All three operate on the
governed artifact pool (artifacts approved by the `Govern` step):

| Retrieval mode | Contract | What it retrieves |
|---|---|---|
| Text-based query | `KnowledgeQueryContract` | Items matching a text query with relevance score |
| Ranked retrieval | `KnowledgeRankingContract` | Items ranked by configurable scoring weights |
| Structural retrieval | `StructuralIndexContract` (W72-T1) | Structural neighbors via BFS traversal over declared relations |

These three modes are peers. None has unconditional priority over the others. Context Builder
selects among them per the governance rules in §4 below.

---

## 3. How Compiled Artifacts Enter Context Packaging

Context packaging is the activity by which the Context Builder assembles a context window
for agent consumption. Compiled artifacts may be used as inputs to context packaging under
the following conditions:

1. The artifact has `governanceStatus: approved` (passed the `Govern` step)
2. The artifact's `citationTrail` is intact and traceable to at least one raw source
3. The artifact's `artifactHash` is verifiable at time of packaging
4. The packaging operation is recorded with the artifact's `artifactId` in the audit trail

When these conditions are met, a compiled artifact is a valid context packaging input.

---

## 4. Preference Model: Compiled-Preferred with Raw-Source Fallback

The accepted preference model from the LLM-Powered synthesis (synthesis note §2.1):

> **Compiled-knowledge preference with raw-source fallback**
> Consistent with deterministic context via `RagContextEngineConvergenceContract` (W9-T1)

Operationalized as a policy rule:

**Rule 1 — Compiled-preferred (conditional):**
When an approved compiled artifact exists for a given `contextId` and its `citationTrail` is
verified, Context Builder **may** prefer that artifact over raw source retrieval for context
packaging in that context.

**Rule 2 — Raw-source compilation fallback (mandatory):**
When no approved compiled artifact exists for a given `contextId`, or when the artifact's
`citationTrail` cannot be verified, Context Builder **must** fall back to the raw source
compilation path: the relevant raw source must first pass `Compile → Govern` before it can
be used for context packaging. Raw sources do not enter the `Query` step directly, even in
the fallback path — the lifecycle gate is not bypassed. The compilation fallback path is
always available and must not be blocked.

**Rule 3 — No compiled-first unconditional default:**
Compiled-preferred is not an unconditional system default. Declaring compiled artifacts as the
mandatory default across all contexts requires benchmark evidence showing compiled-artifact context
outperforms raw-source context on ≥3 CVF use-cases. That evidence does not exist yet.
This rule remains deferred to W72-T3.

---

## 5. Structural Retrieval and Compiled Artifacts

`StructuralIndexContract` (W72-T1) operates on structural entities and relations. These must be
derived from governed artifacts (e.g., an Entity Artifact with explicit `depends_on` relations
that has passed the `Govern` step). Raw source metadata does not flow into `StructuralIndexContract`
without first passing `Compile → Govern`.

When structural retrieval is used for context packaging:

- The structural index input entities and relations are governed inputs — all must carry
  `governedAt` and `governanceStatus: approved`
- The `indexHash` from `StructuralIndexResult` is recorded in the context packaging audit trail
- Structural retrieval does not bypass the `citationTrail` requirement — neighbor artifacts
  returned by structural traversal must trace to governed artifacts, not raw unverified content

Structural retrieval is an enrichment of the `Query` step. It does not create a new lifecycle step
and does not grant direct access to raw unverified sources.

---

## 6. Context Routing Hierarchy (Candidate Concept — Not Canon)

The Palace synthesis contributed vocabulary for hierarchical context narrowing
(`wing/hall/room/drawer` from `cvf_mem_memory_schema.py` — SALVAGE_VOCABULARY, file #13 in
promotion map). This vocabulary is noted as a candidate enrichment for Context Builder and
W7MemoryRecord, but is not absorbed into this policy.

Reason: no implementation surface exists for this hierarchy yet; absorbing it as canon without
a governed W7MemoryRecord enrichment wave would be premature. Future agents should track this
under a dedicated W7MemoryRecord enrichment wave.

---

## 7. What This Policy Does NOT Establish

- Does not create a new architecture surface (no `CompiledContextEngine`, no parallel packaging runtime)
- Does not grant graph-first or compiled-first as unconditional defaults
- Does not override the raw source compilation fallback — the fallback path (Compile → Govern on the raw source before context packaging) is always available and must not be blocked
- Does not absorb Palace field vocabulary into canon (`wing`, `hall`, `room`, `drawer` remain
  deferred vocabulary seeds)
- Does not require changes to `RagContextEngineConvergenceContract` or any existing CPF contract
- Does not grant implementation authority — a GC-018 wave is required before any contract changes

---

---

## 8. N2 Decision Record (W78-T1 — 2026-04-14)

> Authority: `docs/baselines/CVF_W78_T1_BENCHMARK_EVIDENCE_PACKET_2026-04-14.md`
> GC-026 sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W78_T1_N2_BENCHMARK_EVIDENCE_CLOSURE_2026-04-14.md`

**Decision: HYBRID / NO SINGLE DEFAULT**

The N2 Benchmark Evidence Closure wave (W78-T1) evaluated compiled-first and graph-first preferences
using `PerformanceBenchmarkHarnessContract` (W8-T2 + W72-T5 extensions) against 8 declared runs.
Evidence class: PROPOSAL_ONLY (contract-layer; no live inference system available).

The promotion gate was not fully met: retrieval precision and temporal independence gates require
runtime inference measurements unavailable at contract layer. Per §5 of the benchmark criteria,
the preferences remain at candidate status.

**Effective policy after N3 (unchanged from pre-N2 state):**

| Rule | Status |
|---|---|
| Rule 1 — compiled-preferred (conditional) | CONFIRMED UNCHANGED — agents may prefer compiled artifacts when governance conditions are met |
| Rule 2 — raw-source fallback (mandatory) | CONFIRMED UNCHANGED — always reachable; never blocked |
| Rule 3 — no unconditional compiled-first default | CONFIRMED — promotion gate not met |
| Structural index peer mode | CONFIRMED in canon (N1/W77-T1 `rag.context.engine.convergence.contract.ts`) |
| Unconditional default | NOT SET |

This decision closes the N2 evidence gate and was promoted into whitepaper and tracker canon by W79-T1.
Future waves may revisit default promotion if runtime inference evidence becomes available.

---

*Filed: 2026-04-14 — W72-T2 CP1 Knowledge Compilation Doctrine Uplift*
*Updated: 2026-04-14 — W79-T1 N3 Canon Default Promotion (§8 appended)*
