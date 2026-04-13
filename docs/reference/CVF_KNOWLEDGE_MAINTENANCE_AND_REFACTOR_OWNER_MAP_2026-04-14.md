# CVF Knowledge Maintenance and Refactor Owner Map

Memory class: FULL_RECORD

> Date: 2026-04-14
> Tranche: W72-T2
> Authority: GC-021 Fast Lane audit `CVF_W72_T2_KNOWLEDGE_COMPILATION_DOCTRINE_UPLIFT_GC021_FAST_LANE_AUDIT_2026-04-14.md`
> Lifecycle steps: Maintain (Step 5), Refactor (Step 6)
> Intake: `CVF_GRAPHIFY_LLM_POWERED_PALACE_CVF_NATIVE_SYNTHESIS_NOTE_2026-04-13.md` §2.4, §4.C
> Status: OWNER MAP — not implementation authority

---

## 1. Purpose

This document maps all knowledge maintenance and refactoring operations to existing CVF owner surfaces.
All three source clusters (LLM-Powered, Graphify, Palace) independently proposed knowledge quality
operations. After deduplication, they collapse into the single vocabulary defined here.

No standalone lint engine, no standalone graph drift engine, and no parallel quality subsystem are
created by this map. All operations route to the existing Learning Plane chain.

---

## 2. Owner Map

### 2.1 Maintenance Operations (Step 5 — Maintain)

| Operation | Definition | CVF Owner | Existing chain / contract |
|---|---|---|---|
| **Lint** | Check compiled artifacts for schema compliance, citation presence, orphan references, malformed fields | Learning Plane | `FeedbackLedger` — records quality event; `PatternInsight` — flags pattern across artifacts |
| **Contradiction detection** | Flag conflicting claims across compiled artifacts for the same concept/entity | Learning Plane | `TruthModel` — models divergence between knowledge statements |
| **Drift detection** | Detect when a compiled artifact has diverged from its raw source(s) after a source update | Learning Plane | `PatternInsight` — compares artifact content hash against source change events |
| **Orphan detection** | Find compiled artifacts with no inbound reference from any context or other artifact | Learning Plane | Learning Plane maintenance function — queried against `citationTrail` index |
| **Staleness detection** | Find compiled artifacts whose raw source(s) have been updated but the artifact has not been recompiled | Learning Plane | Learning Plane maintenance function — timestamp comparison of `compiledAt` vs source `updatedAt` |
| **Version tracking** | Track changes to compiled artifacts over their lifecycle | Learning Plane | `FeedbackLedger` observability — records each governed write with `artifactId`, `compiledAt`, `artifactHash` |

**Source deduplication note:** Lint vocabulary came from LLM-Powered (KG-G2, KLE-01–06); contradiction
detection from LLM-Powered (KG-G4, KLE-04) and Palace (G2); drift detection from Graphify (G-GM-07).
All routes to Learning Plane chain after deduplication. Source references are provenance only — the
canonical owner is Learning Plane.

### 2.2 Refactor Operations (Step 6 — Refactor)

| Operation | Definition | CVF Owner | Governance requirement |
|---|---|---|---|
| **Merge** | Combine two or more compiled artifacts into a single new artifact | Learning Plane | Full audit trail; predecessor `artifactId` values recorded in new artifact's `citationTrail` |
| **Split** | Divide a compiled artifact into two or more narrower artifacts | Learning Plane | Full audit trail; original `artifactId` recorded in each successor's `citationTrail` |
| **Rename** | Change the label, title, or scope declaration of a compiled artifact | Learning Plane | Governed write with `artifactId` preserved; rename event recorded in `FeedbackLedger` |
| **Restructure** | Reorganize fields or relationships within a compiled artifact without changing its identity | Learning Plane | Governed write; `artifactHash` updated; predecessor hash retained as `priorArtifactHash` |

---

## 3. Learning Plane Chain Roles

For clarity, this table summarizes how the three key Learning Plane constructs are used for
knowledge maintenance:

| Learning Plane construct | Role in knowledge maintenance |
|---|---|
| `FeedbackLedger` | Observability layer — records all quality signal events (lint findings, contradiction flags, drift alerts, refactor operations) as immutable ledger entries |
| `PatternInsight` | Pattern analysis — identifies recurring quality issues across artifacts (e.g., systematic drift from a specific source type) |
| `TruthModel` | Consistency model — tracks conflicting knowledge claims and surfaces them for resolution |

These constructs are not changed by this map. The map documents how they serve the maintenance
and refactor steps of the knowledge lifecycle.

---

## 4. What Is NOT Created

- **No standalone Knowledge Lint Engine.** The LLM-Powered source proposed a `KnowledgeLinтEngine`
  as an independent subsystem (`CVF_KNOWLEDGE_LINT_ENGINE_SPEC.md` — SALVAGE_VOCABULARY in promotion
  map). This is rejected as a standalone surface. All lint operations route to `FeedbackLedger →
  PatternInsight` as governed quality signals.

- **No standalone Graph Drift Engine.** Graphify's G-GM-07 (drift detection) proposed an independent
  graph drift mechanism. This is absorbed into `PatternInsight` as a content-hash comparison signal.

- **No standalone Truth Engine.** Palace's G2 (truth consistency) is already covered by `TruthModel`.
  No new engine is created.

- **No new guard family.** All quality concerns map to existing guards and Learning Plane contracts.
  Net new guards required: 0. (Consistent with synthesis note §4.B — all 20 cross-folder
  governance-adjacent constructs map to existing CVF owners with 0 new guards.)

- **No parallel maintenance subsystem.** Maintenance is a governed Learning Plane activity, not a
  separate architectural layer.

---

## 5. Governance Rule for Maintenance Operations

Maintenance operations are governed writes to the knowledge surface. They are not read-only
quality scans that can run silently.

| Requirement | Rule |
|---|---|
| Every quality signal event | Must be recorded in `FeedbackLedger` with `artifactId`, event type, timestamp, and detecting agent |
| Every refactor operation | Must produce a governed write with full audit trail and predecessor provenance |
| Contradiction flags | Must be surfaced to an authorized operator before any artifact is modified; `TruthModel` records the flag; resolution requires explicit authorization |
| Drift alerts | Trigger a recompilation candidate; do not automatically overwrite the compiled artifact; operator review required |
| Staleness marks | Mark artifact as `stale` in `governanceStatus`; do not auto-expire; recompilation requires a new `Compile → Govern` pass |

---

## 6. Reopen Condition for Future Implementation

This map defines ownership and governance rules. Implementing these operations as TypeScript contracts
in the Learning Plane (or CPF Knowledge Layer) requires a fresh GC-018 authorization targeting those
specific surfaces.

Future implementation candidates (in dependency order):
1. `KnowledgeLintContract` — schema compliance + citation check (Learning Plane)
2. `KnowledgeContradictionContract` — cross-artifact conflict detection (Learning Plane `TruthModel`)
3. `KnowledgeDriftContract` — source divergence detection (Learning Plane `PatternInsight`)
4. `KnowledgeRefactorContract` — governed merge/split/rename/restructure (Learning Plane)

None of these are authorized by this map. They are recorded as future candidates only.

---

*Filed: 2026-04-14 — W72-T2 CP1 Knowledge Compilation Doctrine Uplift*
