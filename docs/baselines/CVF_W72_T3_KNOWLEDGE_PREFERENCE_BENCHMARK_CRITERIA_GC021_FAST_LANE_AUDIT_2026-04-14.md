# CVF Fast Lane Audit — W72-T3 Knowledge Preference Benchmark Criteria + W7 Vocabulary Enrichment

Memory class: FULL_RECORD

> Decision type: `Fast Lane` additive documentation wave
> Date: 2026-04-14
> Tranche: W72-T3
> Control point: CP1 (single control point — documentation-only wave)
> Control: GC-021
> Active execution plan: this document

---

## 1. Proposal

- **Change ID:** W72-T3-CP1-KNOWLEDGE-PREFERENCE-BENCHMARK-CRITERIA
- **Date:** 2026-04-14
- **Tranche:** W72-T3
- **Wave class:** `DOCUMENTATION / GOVERNANCE UPLIFT`
- **Active execution plan:** this document

**Summary:** Close the final documentation gap from the Graphify/LLM-Powered/Palace intake lane.
Produces two reference documents: (1) benchmark criteria defining what evidence is required to
promote compiled-first or graph-first retrieval preference from candidate to default policy, and
(2) Palace vocabulary enrichment note establishing W7-aligned memory routing vocabulary seeds as
documented candidates for a future W7MemoryRecord implementation wave. No code, no runtime, no guard
family, no new architecture surface.

After W72-T3, the documentation lane of the Graphify/LLM-Powered/Palace intake is fully closed.
Any remaining work is implementation (benchmarks, W7MemoryRecord contract) requiring fresh GC-018.

---

## 2. Doctrine Documentation

### What this wave closes

**From W72-T2 roadmap §12:**
> Only after W72-T2 is clean should the repo consider:
> 1. benchmark whether compiled artifacts should become preferred context input
> 2. benchmark whether structural index should influence retrieval preference
> 3. reopen W7-aligned vocabulary enrichment for Palace metadata only

W72-T2 is clean. W72-T3 closes all three items at documentation scope:
- Items 1+2: `CVF_KNOWLEDGE_PREFERENCE_BENCHMARK_CRITERIA_2026-04-14.md` defines the
  evidence standard required to promote either preference to default policy
- Item 3: `CVF_W7_MEMORY_RECORD_PALACE_VOCABULARY_ENRICHMENT_NOTE_2026-04-14.md` documents
  Palace vocabulary seeds as W7-aligned candidates

### Owner-surface mapping

| Deliverable | CVF Owner | This wave's output |
|---|---|---|
| Benchmark criteria (compiled-first) | Context Builder + Knowledge Layer | `CVF_KNOWLEDGE_PREFERENCE_BENCHMARK_CRITERIA_2026-04-14.md` |
| Benchmark criteria (graph-first) | Knowledge Layer | same file |
| W7 vocabulary enrichment | W7NormalizedAssetCandidate + future W7MemoryRecord | `CVF_W7_MEMORY_RECORD_PALACE_VOCABULARY_ENRICHMENT_NOTE_2026-04-14.md` |

### Existing infrastructure note

`PerformanceBenchmarkHarnessContract` (W8-T2, CPF) exists and supports `PROPOSAL_ONLY` evidence
class. All benchmark runs produce `PROPOSAL_ONLY` reports until a GC-026 tracker sync with
trace-backed evidence is committed (future wave). W72-T3 defines the criteria; W72-T4 or later
would run actual benchmarks.

---

## 3. Eligibility Check (Fast Lane)

| Check | Status |
|---|---|
| already-authorized tranche | YES — operator authorized W72-T3 as direct continuation |
| additive only | YES — 2 new reference docs + AGENT_HANDOFF.md update; no edits to existing contracts |
| no physical merge | YES — no source files moved from `.private_reference/` |
| no ownership transfer | YES — all new docs land in `docs/reference/` |
| no runtime authority change | YES — no guard engine, no provider lane, no execution plane |
| no target-state claim expansion | YES — benchmark criteria are prerequisites, not policy defaults |
| doctrine-first rule satisfied (GC-043) | YES — W72-T1 implementation + W72-T2 doctrine both closed before T3 |

**Fast Lane eligible: YES**

---

## 4. Scope

**Files created (docs/reference/):**
- `CVF_KNOWLEDGE_PREFERENCE_BENCHMARK_CRITERIA_2026-04-14.md`
- `CVF_W7_MEMORY_RECORD_PALACE_VOCABULARY_ENRICHMENT_NOTE_2026-04-14.md`

**Files created (docs/baselines/):**
- `CVF_W72_T3_KNOWLEDGE_PREFERENCE_BENCHMARK_CRITERIA_GC021_FAST_LANE_AUDIT_2026-04-14.md` (this file)

**Files modified (additive only):**
- `AGENT_HANDOFF.md` — record W72-T3 CLOSED DELIVERED; mark lane documentation-complete

**Out of scope:**
- No code changes to `PerformanceBenchmarkHarnessContract` or any other contract
- No W7MemoryRecord contract implementation (future wave)
- No benchmark run execution (future wave requiring GC-018 + GC-026)
- No policy default changes — neither compiled-first nor graph-first becomes default
- No guard family, no CLI surface, no new architecture surface

**Rollback unit:** delete 2 new reference docs + revert AGENT_HANDOFF.md; no other state changes

---

## 5. Intake Packet Reference

1. `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_CVF_NATIVE_SYNTHESIS_NOTE_2026-04-13.md`
2. `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_PROMOTION_AND_REJECTION_MAP_2026-04-13.md`
3. `docs/roadmaps/CVF_W72_T2_KNOWLEDGE_COMPILATION_DOCTRINE_UPLIFT_ROADMAP_2026-04-14.md` §12
4. `docs/reference/CVF_COMPILED_CONTEXT_GOVERNANCE_POLICY_2026-04-14.md` (W72-T2 output)

---

*Filed: 2026-04-14*
*Fast Lane (GC-021) CP1 — W72-T3 documentation closure*
