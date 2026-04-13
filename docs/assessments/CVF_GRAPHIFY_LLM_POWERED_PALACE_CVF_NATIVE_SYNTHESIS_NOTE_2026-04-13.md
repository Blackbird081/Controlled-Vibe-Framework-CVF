# CVF-Native Synthesis Note — Graphify / LLM-Powered / Palace

Memory class: SUMMARY_RECORD

> **Date:** 2026-04-13
> **Document Type:** CVF-NATIVE SYNTHESIS CANDIDATE / NOT CANON / NOT IMPLEMENTATION AUTHORITY
> **Source Packet:**
> - `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_ARBITRATION_SYNTHESIS_2026-04-13.md`
> - `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_FOCUSED_REBUTTAL_ROUND2_2026-04-13.md`
> **Source Folders:**
> - `.private_reference/legacy/CVF ADDING NEW/Knowledge Base_Graphify/`
> - `.private_reference/legacy/CVF ADDING NEW/Knowledge Base_LLM-Powered/`
> - `.private_reference/legacy/CVF ADDING NEW/Knowledge Base_Palace/`
> **Purpose:** Replace broad re-reading of 3 source folders and 6 assessment documents for any future agent. This is the unified design input note.

---

## 1. Verdict

`ACCEPT AS DESIGN INPUT / DIRECT INTEGRATION NOT APPROVED`

These three knowledge clusters contribute real design value to CVF, but none is canon, runtime, or implementation-ready. This note distills the agreed-upon value into CVF-native language. Future agents should read **this note** instead of the 3 source folders and assessment chain.

---

## 2. Accepted Value

### 2.1 Knowledge Compilation as Governed CVF Activity

**Source:** LLM-Powered cluster
**CVF Owner:** Knowledge Layer + Context Builder + Learning Plane

The strongest doctrine contribution across all 3 folders is the concept of **knowledge compilation** — treating raw external sources as input material that must be compiled into governed, reusable knowledge artifacts before entering context pipelines.

**Corrected lifecycle (6-step, mandatory):**

```
Ingest → Compile → Govern → Query → Maintain → Refactor
```

> The original 5-loop model (`Ingest → Compile → Query → Maintain → Refactor`) omitted the `Govern` step between `Compile` and `Query`. The source document's own workflow diagram already included governance, but the loop description was inconsistent. This synthesis uses the corrected 6-step form only.

**Key principles accepted:**

| Principle | CVF-native grounding |
|---|---|
| Raw sources are ground truth | Consistent with CVF provenance discipline — raw sources are read-only input |
| Compiled knowledge is a governed artifact | Consistent with existing artifact governance (audit trail, phase gate, freeze) |
| Compiled-knowledge preference with raw-source fallback | Consistent with deterministic context via `RagContextEngineConvergenceContract` (W9-T1) |
| Knowledge maintenance is a governed operation | Consistent with Learning Plane `FeedbackLedger → PatternInsight → TruthModel` chain |
| Knowledge refactoring is a governed operation | Consistent with Learning Plane — extends existing maintenance vocabulary |
| Citation is mandatory for all knowledge artifacts | Consistent with `AuditTrailGuard` provenance requirement |

### 2.2 Structural Index as Knowledge Layer Enhancement

**Source:** Graphify cluster
**CVF Owner:** Knowledge Layer + Context Builder

CVF's current Knowledge Layer operates on text-based query + ranking (`KnowledgeRankingBatchContract`). It does not maintain structural relationships between knowledge entities (dependency, call-graph, concept hierarchy).

**Gap identified:** No structural index exists. Agent retrieval currently relies on grep/glob-style text scan — effective but structurally unaware.

**Accepted enhancement concept:**

| Concept | CVF-native mapping |
|---|---|
| Graph-shaped knowledge indexing | Candidate capability inside Knowledge Layer — adds structural navigation alongside existing query+ranking |
| Graph-informed context packaging | Candidate enhancement for Context Builder — enables dependency-aware context assembly |
| Graph provenance tracking | Maps to existing `AuditTrailGuard` — no new guard needed |
| Graph evaluation vocabulary | Candidate LPF quality signal — not a scoring doctrine |

**Boundary:** This is framed as **Knowledge Layer enhancement**, not a new `Graph Memory Layer`. No new architectural surface.

### 2.3 Governed Memory Metadata and Hierarchical Routing

**Source:** Palace cluster
**CVF Owner:** Knowledge Layer + Context Builder + W7MemoryRecord

The Palace cluster contributes vocabulary for hierarchical context narrowing — organizing memory by progressive specificity rather than flat retrieval.

**Accepted vocabulary (candidate concepts, not canon surfaces):**

| Concept | CVF-native mapping | Status |
|---|---|---|
| Canonical raw evidence before summarization | Consistent with CVF provenance — raw sources preserved as-is | Accepted |
| Hierarchical routing metadata for context narrowing | Candidate enhancement for Context Builder context-shaping | Candidate concept |
| Governed memory metadata | Maps to W7MemoryRecord enrichment candidates | Candidate concept |
| Benchmark discipline for memory retrieval quality | Maps to `PerformanceBenchmarkHarnessContract` (W8-T2, PROPOSAL ONLY) | Deferred — needs calibration evidence |

### 2.4 Knowledge Quality Operations

**Source:** LLM-Powered (lint engine) + Graphify (drift detection) + Palace (contradiction detection)
**CVF Owner:** Learning Plane

All three folders independently propose knowledge quality operations. After deduplication, these collapse into a single vocabulary:

| Operation | Deduplicated definition | CVF Owner |
|---|---|---|
| Lint | Check knowledge artifacts for citation, schema compliance, orphan references, staleness | Learning Plane — `FeedbackLedger` + `PatternInsight` |
| Contradiction detection | Flag conflicting claims across knowledge artifacts | Learning Plane — `TruthModel` |
| Drift detection | Detect when knowledge artifacts diverge from source truth | Learning Plane — `PatternInsight` |
| Orphan detection | Find knowledge artifacts with no inbound reference | Learning Plane maintenance function |
| Staleness detection | Find knowledge artifacts not updated after source change | Learning Plane maintenance function |
| Knowledge refactoring | Merge, split, rename, restructure knowledge artifacts under governance | Learning Plane — governed operation requiring audit |

---

## 3. Rejected / Deferred Value

### 3.1 Permanently Rejected (in current form)

| Concept | Source | Reason |
|---|---|---|
| `Graph Memory Layer` as new architecture surface | Graphify | No new surfaces — enhancement only |
| `/graphify` CLI command | Graphify | CLI runtime deferred by design; governance bypass risk |
| `cvf graph *` command family (8 commands) | Graphify | CLI runtime deferred by design |
| `G-GM-*` guard family (6 guards) | Graphify | All 6 remap to existing CVF guards — net zero new guards |
| `Schema → Governance Layer` direct mapping | LLM-Powered | Prompt/config files are Context Builder inputs, not governance objects |
| `Persistent Wiki` as independent authority | LLM-Powered | CVF Knowledge Layer is the owner; no parallel system |
| Palace runtime as independent subsystem | Palace | No parallel memory runtime |
| AAAK as trusted compression primitive | Palace | Not CVF-governed; no evidence of reliability |
| All Palace python code (5 files) | Palace | Fails import, wrong metrics, bypasses own structure |
| Palace execution-plan checklist | Palace | Claims completion that repo evidence contradicts |
| All `Approved` / `Approved for Integration` labels | All 3 folders | No GC-018 wave exists; labels are overstated |
| Score/weight/truth-delta doctrine from these folders | All 3 folders | No LPF calibration evidence |

### 3.2 Deferred (reopenable under specific conditions)

| Concept | Source | Reopen condition |
|---|---|---|
| Graph preference as policy default | Graphify | Fresh GC-018 wave + benchmark evidence showing graph-informed retrieval outperforms current retrieval on ≥3 CVF use-cases |
| Compiled-knowledge preference as policy default | LLM-Powered | Fresh GC-018 wave + benchmark evidence showing compiled-knowledge context outperforms raw-source context |
| Memory retrieval benchmarks | Palace | Fresh GC-018 wave + `PerformanceBenchmarkHarnessContract` moved from PROPOSAL ONLY to active |
| CLI-shaped material from all 3 folders | All | W7/CLI family explicitly reopened via fresh bounded wave |
| Palace field vocabulary (`wing`, `hall`, `room`, `drawer`, `closet_summary`, `tunnel_links`) | Palace | Future W7MemoryRecord enrichment wave — vocabulary seed only |

---

## 4. Deduplicated Concept Map

The 3 source folders use different terminology for overlapping concepts. This map records the canonical CVF-native term to use.

### A. Structural Knowledge Terms

| Folder term | CVF-native term | Owner surface |
|---|---|---|
| Knowledge graph (Graphify) | **Candidate: Structural Index** | Knowledge Layer |
| Compiled wiki pages (LLM-Powered) | **Candidate: Compiled Knowledge Artifact** | Knowledge Layer |
| Wing/hall/room hierarchy (Palace) | **Candidate: Context Routing Hierarchy** | Context Builder |
| Graph report (Graphify) | Structural Index output → Context Builder input | Context Builder |
| Concept/entity/summary pages (LLM-Powered) | Compiled Knowledge Artifact types | Knowledge Layer |
| Closet/drawer (Palace) | Context narrowing levels | Context Builder |

### B. Governance-Like Controls (Deduplicated)

All 20 unique governance-adjacent constructs from the 3 folders map to existing CVF owners:

| Cross-folder concern | CVF owner | Net new guards needed |
|---|---|---|
| Provenance / source tracing | `AuditTrailGuard` | 0 |
| Access control | `AuthorityGateGuard` | 0 |
| Scope enforcement | `ScopeGuard` | 0 |
| Confidentiality | `FileScopeGuard` + trust isolation | 0 |
| Mutation / overwrite prevention | `MutationBudgetGuard` | 0 |
| Phase compliance | `PhaseGateGuard` | 0 |
| Risk compliance | `RiskGateGuard` | 0 |
| Context preference (graph-first / compiled-first) | Context Builder policy (not a guard) | 0 |
| Data integrity | Data validation rule (not a guard) | 0 |
| **Total new guard families required** | | **0** |

### C. Knowledge Quality Terms (Deduplicated)

| Cross-folder concern | Folder sources | CVF Owner |
|---|---|---|
| Citation required | LLM-Powered (KG-G2, KLE-01, KCP-02, CCP-02) | `AuditTrailGuard` provenance rule |
| Contradiction detection | LLM-Powered (KG-G4, KLE-04) + Palace (G2) | `TruthModel` in Learning Plane |
| Schema compliance | LLM-Powered (KLE-05, KCP-05) | Knowledge schema validation |
| Drift detection | Graphify (G-GM-07) | `PatternInsight` in Learning Plane |
| Orphan detection | LLM-Powered (KLE-02) | Learning Plane maintenance |
| Staleness detection | LLM-Powered (KLE-06) | Learning Plane maintenance |
| Version tracking | LLM-Powered (KG-G6, KCP-04) | `FeedbackLedger` observability |
| Truth consistency | Palace (G2) | `TruthModel` in Learning Plane |

---

## 5. Owner-Surface Mapping

All accepted value maps into 4 existing CVF surfaces. No new surface required.

| CVF Surface | What it absorbs from this synthesis |
|---|---|
| **Knowledge Layer** (Control Plane) | Knowledge compilation capability; structural index as candidate retrieval mode; compiled knowledge artifact governance |
| **Context Builder & Packager** (Control Plane) | Compiled-knowledge preference policy with raw-source fallback; graph-informed context packaging; hierarchical context routing/narrowing |
| **Learning Plane** | Knowledge maintenance operations (lint, contradiction detection, drift detection, orphan detection, staleness detection, refactoring); knowledge quality signals as candidate LPF inputs |
| **W7 Governance Integration** (W7MemoryRecord) | Palace memory metadata vocabulary as enrichment candidates (not immediate adoption) |

---

## 6. No-New-Surface Rule

This synthesis explicitly creates **zero** new CVF architectural surfaces.

| Proposed by source | Outcome |
|---|---|
| `Graph Memory Layer` | Rejected — absorbed as Knowledge Layer enhancement |
| `Persistent Wiki` | Rejected — absorbed as Knowledge Layer compilation capability |
| `MemPalace Runtime` | Rejected — vocabulary absorbed into Context Builder and W7MemoryRecord |
| `G-GM-*` guard family | Rejected — all concerns map to existing 8 core + 15 runtime guards |
| `KG-G*` guard family | Rejected — all concerns are quality/eval rules for Learning Plane |
| `Knowledge Lint Engine` as standalone | Rejected — absorbed into Learning Plane maintenance chain |

---

## 7. Future Reopen Conditions

This synthesis note may be reopened for further action if and only if:

1. A fresh `GC-018` wave is authorized for one of these specific areas:
   - Knowledge compilation implementation
   - Structural index implementation
   - W7MemoryRecord enrichment
   - CLI runtime (which would unblock CLI-shaped material from all 3 folders)

2. The wave authorization specifies:
   - **Doctrine wave:** start with LLM-Powered compilation policy → then Graphify structural index
   - **Implementation wave:** start with Graphify structural index → then LLM-Powered compilation

3. Any implementation wave must:
   - Use this synthesis note as the intake document (not the original 3 folders)
   - Follow the corrected 6-step lifecycle for knowledge compilation
   - Produce benchmark evidence before any policy-default changes
   - Pass GC-019 structural audit before any source-tree changes

---

## 8. Provenance Note

The 3 source folders contain `Thong_tin.md` files that synthesize external sources:

| File | External source | Provenance quality |
|---|---|---|
| Graphify `Thong_tin.md` | `safishamsi/graphify` repo + community analysis | Informal — no date/author attribution for opening paragraph |
| LLM-Powered `Thong_tin.md` | Andrej Karpathy's gist + DAIR.AI analysis + Obsidian ecosystem | Present but informal — Karpathy named but gist URL not cited |
| Palace `Thong_tin.md` | `milla-jovovich/mempalace` repo | Best of three — explicit URL, clear analysis boundary |

**Standing provenance rule:** If any future document references these `Thong_tin.md` files:

```
Provenance: community synthesis of [source]. Not primary documentation. Not independently verified.
```

---

*CVF-Native Synthesis Agent | 2026-04-13*
*This document is the preferred front-door synthesis note for future agents working on this packet. It is NOT canon, NOT implementation authority, and NOT a GC-018 wave opener.*
