# CVF Knowledge Compilation Lifecycle Policy

Memory class: POINTER_RECORD

> Date: 2026-04-14
> Tranche: W72-T2
> Authority: GC-021 Fast Lane audit `CVF_W72_T2_KNOWLEDGE_COMPILATION_DOCTRINE_UPLIFT_GC021_FAST_LANE_AUDIT_2026-04-14.md`
> Intake: `CVF_GRAPHIFY_LLM_POWERED_PALACE_CVF_NATIVE_SYNTHESIS_NOTE_2026-04-13.md` §2.1
> Status: POLICY — not implementation authority

---

## 1. Purpose

This document defines the corrected 6-step knowledge compilation lifecycle in CVF-native terms.
It names each step's owner surface, inputs, outputs, and governance gate.

This lifecycle governs all knowledge-layer activity in CVF: ingestion of raw sources, compilation
into governed artifacts, governance validation before query, retrieval, maintenance, and refactoring.
It is the governing spine for all W72-T2 doctrine documents.

---

## 2. Corrected Lifecycle

```
Ingest → Compile → Govern → Query → Maintain → Refactor
```

The original LLM-Powered source used a 5-loop description that omitted `Govern` between `Compile`
and `Query`. That omission was a documentation inconsistency — the source's own workflow diagram
already included governance. This policy uses only the corrected 6-step form.

**`Govern` is mandatory.** No compiled artifact may enter the `Query` step without passing `Govern`.
This is not optional or advisory.

---

## 3. Step Definitions

### Step 1 — Ingest

| Field | Value |
|---|---|
| Owner | Knowledge Layer (Control Plane) |
| Input | Raw external sources: documents, APIs, structured data, code artifacts |
| Output | Raw source record with provenance: `sourceId`, `ingestedAt`, `citationRef`, `rawContentHash` |
| Governance gate | Source validation: citation present, format recognizable, source not previously rejected |
| Key rule | Raw sources are read-only ground truth. They are never modified. Compiled artifacts are derived from them, not replacements for them. |

### Step 2 — Compile

| Field | Value |
|---|---|
| Owner | Knowledge Layer (Control Plane) |
| Input | Raw source record (from Ingest) |
| Output | Compiled Knowledge Artifact (see `CVF_COMPILED_KNOWLEDGE_ARTIFACT_STANDARD_2026-04-14.md`) |
| Governance gate | Schema compliance check: required provenance fields present, citation trail populated, no orphaned references |
| Key rule | Compilation is a transformation, not a copy. The artifact must carry explicit provenance back to its raw source. Prompt files, config files, and schema templates are **not** governance authority — they are Context Builder inputs. |

### Step 3 — Govern

| Field | Value |
|---|---|
| Owner | Governance Layer — via existing guards |
| Input | Compiled Knowledge Artifact (from Compile) |
| Output | Governed artifact: approved for query or rejected with reason |
| Governance gate | **Mandatory gate.** Applies the applicable guard chain before releasing to Query. |
| Applicable guards | `AuditTrailGuard` (provenance verification), `AuthorityGateGuard` (access/permission), `PhaseGateGuard` (phase compliance), `RiskGateGuard` (risk classification) |
| Key rule | This step is not a new contract or a new guard family. It is the explicit application of the existing guard chain to knowledge artifacts. No artifact bypasses this step. |

### Step 4 — Query

| Field | Value |
|---|---|
| Owner | Knowledge Layer + Context Builder (Control Plane) |
| Input | Governed artifact pool (approved artifacts from Govern) |
| Output | Retrieved artifact set: ranked items, query results, structural neighbors |
| Retrieval modes | Text-based: `KnowledgeQueryContract`; Ranked: `KnowledgeRankingContract`; Structural: `StructuralIndexContract` (W72-T1) |
| Key rule | `StructuralIndexContract` is a retrieval mode inside this step, not a new lifecycle step. All three retrieval modes are peer alternatives. Context Builder selects among them per governance policy (see `CVF_COMPILED_CONTEXT_GOVERNANCE_POLICY_2026-04-14.md`). |

### Step 5 — Maintain

| Field | Value |
|---|---|
| Owner | Learning Plane |
| Input | Governed artifact pool + incoming feedback signals |
| Output | Quality signal events: lint findings, contradiction flags, drift alerts, orphan detections, staleness marks |
| Governance gate | Quality signals feed `FeedbackLedger → PatternInsight → TruthModel` chain. No action taken without audit trail. |
| Key rule | Maintenance operations are governed Learning Plane activities, not standalone engines. See `CVF_KNOWLEDGE_MAINTENANCE_AND_REFACTOR_OWNER_MAP_2026-04-14.md` for full operation-to-owner mapping. |

### Step 6 — Refactor

| Field | Value |
|---|---|
| Owner | Learning Plane |
| Input | Governed artifact pool + quality signal events (from Maintain) |
| Output | Restructured, merged, split, or renamed knowledge artifacts — all as new governed artifacts |
| Governance gate | Full audit trail required. Every refactor operation is a governed write, not a silent overwrite. The original artifact's provenance chain is preserved. |
| Key rule | Refactoring is a governed operation. It does not reset provenance. The resulting artifact must trace back to its pre-refactor predecessor and ultimately to its raw source. |

---

## 4. Govern Step — Guard Chain Detail

The `Govern` step is the explicit application of CVF's existing guard infrastructure to knowledge artifacts.
No new guard family is required or created.

| Guard | Role in Govern step |
|---|---|
| `AuditTrailGuard` | Verify provenance: citationRef, sourceId, compiledAt, artifactHash all present and consistent |
| `AuthorityGateGuard` | Verify access permission: artifact creator has authority to write to this knowledge surface |
| `PhaseGateGuard` | Verify phase compliance: compilation was performed in a phase where knowledge writes are permitted |
| `RiskGateGuard` | Classify risk: artifact does not introduce high-risk content without explicit operator override |

All four guards are already implemented in CVF. The `Govern` step is documentation of their role in the lifecycle, not a new enforcement surface.

---

## 5. Relationship to StructuralIndexContract (W72-T1)

`StructuralIndexContract` (landed W72-T1) adds structural navigation to the `Query` step:
- It operates on governed artifacts in the artifact pool
- It traverses declared structural relationships (depends_on, related_to, extends, supersedes)
- It returns structural neighbors with deterministic hash bound to actual graph content
- It is a peer of `KnowledgeQueryContract` and `KnowledgeRankingContract` — not a lifecycle step

The `StructuralIndex` does not change the lifecycle. It enriches the `Query` step with a third retrieval mode.

---

## 6. What This Policy Does NOT Claim

- Does not declare compiled-first or graph-first as an unconditional default retrieval preference
  (requires benchmark evidence — deferred to W72-T3)
- Does not create a new CVF architectural surface (no Graph Memory Layer, no Persistent Wiki, no MemPalace Runtime)
- Does not create a new guard family (all governance maps to existing guards)
- Does not grant implementation authority — this is a policy document, not a GC-018 wave authorization
- Does not absorb Palace memory vocabulary into canon — that requires a future W7MemoryRecord enrichment wave

---

*Filed: 2026-04-14 — W72-T2 CP1 Knowledge Compilation Doctrine Uplift*
