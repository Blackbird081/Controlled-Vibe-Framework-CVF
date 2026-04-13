# CVF Compiled Knowledge Artifact Standard

Memory class: FULL_RECORD

> Date: 2026-04-14
> Tranche: W72-T2
> Authority: GC-021 Fast Lane audit `CVF_W72_T2_KNOWLEDGE_COMPILATION_DOCTRINE_UPLIFT_GC021_FAST_LANE_AUDIT_2026-04-14.md`
> Lifecycle step: Compile (Step 2) → Govern (Step 3)
> Intake: `CVF_GRAPHIFY_LLM_POWERED_PALACE_CVF_NATIVE_SYNTHESIS_NOTE_2026-04-13.md` §2.1, §4.A
> Status: POLICY STANDARD — not implementation authority

---

## 1. Purpose

This document defines what a Compiled Knowledge Artifact is in CVF terms, its minimum provenance
requirements, and what it does not authorize. It is the governing standard for the `Compile` step
in the knowledge compilation lifecycle.

---

## 2. Definition

A **Compiled Knowledge Artifact** is a governed, versioned knowledge object produced by the `Compile`
step from one or more raw source records.

It differs from a raw source in three ways:

| Property | Raw Source | Compiled Knowledge Artifact |
|---|---|---|
| Origin | External input — ingested as-is | Produced inside CVF from raw sources |
| Mutability | Read-only (never modified) | Governed write (versioned, auditable) |
| Governance status | Unverified input | Must pass `Govern` step before entering `Query` |
| Citation requirement | Attributed at ingest | Explicit citation trail to raw source(s) mandatory |

---

## 3. Artifact Types

Three artifact types are recognized, derived from LLM-Powered vocabulary (synthesis note §4.A):

| Type | Description | Source term (CVF-native mapping) |
|---|---|---|
| **Concept Artifact** | Defines a bounded domain concept with provenance and scope | Concept page (LLM-Powered) |
| **Entity Artifact** | Represents a specific named entity (module, contract, actor) with structural relationships | Entity/summary page (LLM-Powered) |
| **Summary Artifact** | A governed aggregation of multiple raw sources or artifacts into a single navigable unit | Compiled wiki page (LLM-Powered) |

These types are candidate vocabulary. They do not require new contracts or new CVF modules to exist.
A future implementation wave may formalize them as typed fields in a knowledge artifact schema.

---

## 4. Minimum Required Fields

Every Compiled Knowledge Artifact must carry these fields. Their presence is the schema compliance
check enforced at the `Compile` step gate.

| Field | Type | Requirement | Rationale |
|---|---|---|---|
| `artifactId` | string | Required | Unique identifier within the knowledge surface |
| `artifactType` | enum | Required | `concept` / `entity` / `summary` |
| `compiledAt` | ISO 8601 | Required | Timestamp of compilation |
| `sourceId` | string (1+) | Required | Reference to the originating raw source record(s) |
| `citationRef` | string | Required | Human-readable citation of the raw source(s) |
| `citationTrail` | string[] | Required | Ordered chain of source references, from raw ingest through all intermediate steps |
| `contextId` | string | Required | Governance context in which the artifact was compiled |
| `compiledBy` | string | Required | Identity of the agent or process that performed compilation |
| `artifactHash` | string | Required | Deterministic hash of artifact content at compilation time |
| `governedAt` | ISO 8601 | Required (after Govern) | Timestamp of governance approval; absent means artifact has not yet passed Govern |
| `governanceStatus` | enum | Required (after Govern) | `pending` / `approved` / `rejected` |

Fields `governedAt` and `governanceStatus` are set by the `Govern` step, not the `Compile` step.
An artifact without `governedAt` is in `pending` state and must not enter `Query`.

---

## 5. What Makes an Artifact "Compiled" vs Raw

**Compiled means:**
- The artifact was produced inside CVF by a governed transformation
- It carries an explicit citation trail to its raw source(s)
- It has been (or is pending) governance validation
- Its content hash is deterministic and verifiable

**Raw means:**
- The source was ingested from an external origin as-is
- It has provenance (sourceId, ingestedAt, citationRef) but has not been transformed
- It cannot enter the `Query` step directly — it must first be compiled

Raw sources are never modified and never replaced by compiled artifacts.
Compiled artifacts complement raw sources; they do not supersede them.

---

## 6. What This Standard Does NOT Grant

- **No governance authority from template alone.** A schema template or a config file is not a
  governance artifact. Prompt files, YAML configs, and schema seeds are Context Builder inputs only.
  They do not satisfy the `citationTrail` or `governedAt` requirements.

- **No TruthScore authority.** Score or truth-delta fields from LLM-Powered and Palace source documents
  are not adopted into this standard. Scoring doctrine requires separate calibration evidence (deferred
  to a future wave).

- **No compiled-first policy default.** This standard does not declare that compiled artifacts must
  be preferred over raw sources in all contexts. Preference policy is governed separately
  (see `CVF_COMPILED_CONTEXT_GOVERNANCE_POLICY_2026-04-14.md`) and requires benchmark evidence before
  being set as a default.

- **No implementation authority.** This is a policy standard. Implementing it as a TypeScript contract
  requires a fresh GC-018 authorization.

---

## 7. Relationship to Lifecycle

| Lifecycle step | Artifact state |
|---|---|
| After `Ingest` | Raw source record exists; no compiled artifact yet |
| After `Compile` | Compiled artifact exists with `governanceStatus: pending` |
| After `Govern` (approved) | `governedAt` and `governanceStatus: approved` set; artifact enters `Query` pool |
| After `Govern` (rejected) | `governanceStatus: rejected` + rejection reason; artifact cannot enter `Query` |
| During `Maintain` | Quality signals may flag artifact for review; does not change `governanceStatus` without a new Govern pass |
| After `Refactor` | New compiled artifact created from refactored content; predecessor artifact's `artifactId` recorded in new artifact's `citationTrail` |

---

*Filed: 2026-04-14 — W72-T2 CP1 Knowledge Compilation Doctrine Uplift*
