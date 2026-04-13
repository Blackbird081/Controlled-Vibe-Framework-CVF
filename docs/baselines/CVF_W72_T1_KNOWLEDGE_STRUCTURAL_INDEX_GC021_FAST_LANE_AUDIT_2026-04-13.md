# CVF Fast Lane Audit — W72-T1 Knowledge Structural Index Enhancement

Memory class: FULL_RECORD

> Decision type: `Fast Lane` additive tranche-local audit
> Date: 2026-04-13
> Tranche: W72-T1 CP1
> Control point: GC-021
> Active execution plan: this file

---

## 1. Proposal

- **Change ID:** W72-T1-CP1-KNOWLEDGE-STRUCTURAL-INDEX
- **Date:** 2026-04-13
- **Tranche:** W72-T1
- **Control point:** CP1 — doctrine documentation + GC-018 authorization filing
- **Active execution plan:** this document

**Summary:** Open the Graphify / LLM-Powered / Palace synthesis lane for a bounded
`implementation-capability` wave targeting one surface: add `StructuralIndexContract`
(+ batch variant) to the CPF Knowledge Layer as a new retrieval mode alongside the
existing `KnowledgeQueryContract` and `KnowledgeRankingContract`.

This CP1 (Fast Lane) covers:
- the doctrine documentation step (mandatory first per handoff sequence)
- the GC-018 issuance (implementation authorization)

CP2 and beyond: the implementation itself (TypeScript contracts + tests), governed
by the issued GC-018.

---

## 2. Doctrine Documentation (Mandatory First Step)

Per `AGENT_HANDOFF.md` and `docs/roadmaps/CVF_GRAPHIFY_LLM_POWERED_PALACE_SYNTHESIS_ONLY_ROADMAP_2026-04-13.md`,
the first step for any reopen of this lane must be doctrine/governance documentation.

### What this wave absorbs

**From Graphify (`Knowledge Base_Graphify/CVF_GRAPH_MEMORY_LAYER_SPEC.md` — ADAPT_HEAVY):**

The synthesis note established:
> CVF's current Knowledge Layer operates on text-based query + ranking. It does not
> maintain structural relationships between knowledge entities (dependency, call-graph,
> concept hierarchy). This is a real current gap.

The accepted concept:
- `StructuralIndex` as a new retrieval mode inside the existing Knowledge Layer
- Adds structural navigation (dependency, extension, relatedness) alongside text-based query+ranking
- Does NOT create a `Graph Memory Layer` as a new architecture surface
- Does NOT create a `G-GM-*` guard family (all concerns remap to existing guards)
- Does NOT open a CLI surface (`/graphify` or `cvf graph *`)

**From LLM-Powered (doctrine, already canonical in synthesis note):**
- The corrected 6-step lifecycle `Ingest → Compile → Govern → Query → Maintain → Refactor`
  is the governing doctrine for all knowledge operations
- `StructuralIndex` sits inside `Query` — it is an alternative retrieval mode, not a
  new lifecycle step

### CVF-native owner-surface mapping

| Concept | CVF Owner | Implementation surface |
|---|---|---|
| Structural entity with relationships | Knowledge Layer (CPF) | `StructuralIndexContract` |
| Structural graph traversal (BFS up to maxDepth) | Knowledge Layer (CPF) | `StructuralIndexContract.index()` |
| Batch structural indexing | Knowledge Layer (CPF) | `StructuralIndexBatchContract.batch()` |
| Provenance / source tracing | `AuditTrailGuard` (existing) | deterministic hash in result |
| Access control | `AuthorityGateGuard` (existing) | no changes needed |
| Scope enforcement | `ScopeGuard` (existing) | no changes needed |

### No-new-surface confirmation

- No new architectural surface is created
- No new guard family is created
- No CLI command surface is created
- No Palace code is used
- `StructuralIndexContract` is an additive sibling of `KnowledgeQueryContract`
  and `KnowledgeRankingContract` within the same barrel

---

## 3. Eligibility Check (Fast Lane CP1)

| Check | Status |
|---|---|
| already-authorized tranche | YES — operator explicitly confirmed lane opening |
| additive only | YES — new contracts and tests only; no edits to existing contracts |
| no physical merge | YES — no merging of source files from `.private_reference/` |
| no ownership transfer | YES — all new surfaces land in CPF Knowledge Layer (existing owner) |
| no runtime authority change | YES — no changes to guard engine, execution plane, or provider lane |
| no target-state claim expansion | YES — StructuralIndex is explicitly framed as enhancement, not new surface |
| no concept-to-module creation | YES — no new module; files added to existing CPF |

**Fast Lane eligible: YES**

---

## 4. Scope

**Files created (implementation — covered by GC-018 below):**
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.structural.index.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.structural.index.batch.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/knowledge.structural.index.contract.test.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/knowledge.structural.index.batch.contract.test.ts`

**Files modified (additive only):**
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.knowledge.barrel.ts` (add exports)

**Files created (governance):**
- `docs/baselines/CVF_W72_T1_KNOWLEDGE_STRUCTURAL_INDEX_GC021_FAST_LANE_AUDIT_2026-04-13.md` (this file)
- `docs/baselines/CVF_GC018_W72_T1_KNOWLEDGE_STRUCTURAL_INDEX_AUTHORIZATION_2026-04-13.md`

**Out of scope:**
- No changes to `KnowledgeQueryContract`, `KnowledgeRankingContract`, or any existing contract
- No changes to `cvf-web`, provider adapters, or PVV surfaces
- No changes to EPF, GEF, or LPF
- No CLI surface
- No whitepaper edit (synthesis note remains the front-door reference)
- No Palace code

**Caller / consumer affected:** none — new exports only; existing consumers unchanged

---

## 5. Why Fast Lane Is Safe

**Why this change is low-risk:**
- Purely additive: new TypeScript files, no edits to existing logic
- Follows established CPF batch contract pattern exactly (same as W33-T1 KnowledgeRankingBatchContract)
- All new exports are opt-in; existing imports and tests are unaffected
- No runtime path changes; no provider lane changes; no governance surface changes
- GC-023 compliance maintained (new files are under all thresholds; barrel delta is ~15 lines)

**Why full-lane governance is not required for CP1:**
- CP1 covers only the doctrine documentation and GC-018 authorization filing
- The implementation (CP2+) is authorized separately via the GC-018 below

**Rollback unit:** delete 4 new source/test files + remove 15 lines from barrel; no other state changes

---

## 6. Intake Packet Reference

This wave uses the synthesis note and promotion map as the ONLY intake documents:
1. `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_CVF_NATIVE_SYNTHESIS_NOTE_2026-04-13.md`
2. `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_PROMOTION_AND_REJECTION_MAP_2026-04-13.md`

The 3 source folders (`.private_reference/legacy/CVF ADDING NEW/`) are NOT used as
implementation sources. All implementation is derived from CVF-native synthesis language only.

---

*Filed: 2026-04-13*
*Fast Lane (GC-021) CP1 — doctrine documentation + GC-018 issuance*
