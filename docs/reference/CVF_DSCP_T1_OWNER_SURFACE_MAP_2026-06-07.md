# CVF DSCP-T1 Owner Surface Map

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: owner_surface_map

Date: 2026-06-07

workOrder: `docs/work_orders/CVF_AGENT_WORK_ORDER_DSCP_T1_OWNER_SURFACE_MAP_FOR_CLAUDE_2026-06-07.md`

executionBaseHead: `8e61f65d`

---

## Scope

Applies to the DSCP-T1 tranche. Covers all existing CVF scan, classification,
context-pack, and retrieval receipt surfaces as of `executionBaseHead: 8e61f65d`.
Does not cover DSCP-T2 contract authoring, DSCP-T3 runtime pilot, LPCI2 T12,
or any runtime/external source outside the CVF provenance repository.

## Purpose

Source-verified map of all existing scan, classification, context-pack, and
retrieval receipt surfaces in CVF. For each surface, records:
- owning file and line range
- key interfaces/types
- which fields are domain-specific (LPCI/legal) vs domain-agnostic (reusable)
- gap disposition (FIXED_INPUT, GENERALIZABLE, NEEDS_WRAPPER)

This map is the evidence basis for the schema proposal in
`docs/reference/CVF_DSCP_T1_SCHEMA_PROPOSAL_2026-06-07.md`.

---

## Layer 1 - Scan / Artifact Descriptor Surfaces

These surfaces handle the initial discovery and metadata capture of candidate
artifacts before any content is read or classified.

### Surface 1A: T11A Candidate Inventory Schema (doc-only)

**File:** `docs/reference/CVF_LPCI2_T11_CANDIDATE_INVENTORY_2026-06-07.md`
**Lines:** 37 (table header)
**Owner:** LPCI2-T11A (doc-only; no TypeScript interface)

| Field | Domain-specific? | Notes |
|---|---|---|
| `Candidate ID` | No | Generic artifact identifier |
| `Filename` | No | Generic |
| `Extension` | No | Generic |
| `Size (bytes)` | No | Generic |
| `Last Modified` | No | Generic |
| `Candidate Family` | YES - LPCI | `applied_policy_record`, `project_case_record`, `administrative_decision`, `administrative_notice` are legal/admin domain enums |
| `Document Type` | Partially | `other`, `decision`, `notice` overlap with LPCI domain; needs a domain-agnostic content class |
| `Current Status` | YES - LPCI | `effective`/`draft`/`amended`/`superseded`/`repealed`/`obsolete`/`unknown` are legal record lifecycle states |
| `Answer Class` | YES - LPCI | `ESCALATE_OR_ABSTAIN` etc. are LPCI T2-matrix values |
| `EC-02 Applies` | YES - LPCI | `ec02` is LPCI EC-02 freshness gate specific |
| `Source Role` | Partially | `expansion_candidate` is generic concept; naming is LPCI-specific |
| `Readable At` | No | Generic filesystem path |

**Disposition:** NEEDS_WRAPPER - underlying fields (id, hash, size, path)
are generic; LPCI-specific fields (`candidateFamily`, `ec02Applies`,
`answerClass`) must move to domain-specific metadata bag.

---

### Surface 1B: ManifestEntry / CorpusManifest (TypeScript)

**File:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/lpci/types.ts`
**Lines:** 106-122
**Owner:** LPCI1-T1 / LPCI runtime (domain-specific)

| Field | Domain-specific? | Notes |
|---|---|---|
| `relativePath` | No | Generic |
| `documentType` | YES - LPCI | Typed as `string` but populated with LPCI doc types |
| `hash` | No | Generic integrity field |
| `jurisdiction` | YES - LPCI | Legal jurisdiction is LPCI-domain |
| `authorityLevel` | YES - LPCI | Legal authority hierarchy |
| `issuingBody` | YES - LPCI | Legal issuing body |
| `effectiveDate` | YES - LPCI | Legal effective date |
| `status` | YES - LPCI | `RecordStatus` enum is legal lifecycle |
| `corpusId` | No | Generic corpus identifier |

**Disposition:** NEEDS_WRAPPER - `relativePath`, `hash`, `corpusId` are
generic; all other fields are LPCI legal-domain specific and must be replaced
by a generic `metadata: Record<string, string>` bag.

---

### Surface 1C: RAGDocument (TypeScript)

**File:** `EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE/src/types.ts`
**Lines:** 11-21
**Owner:** CVF_ECO_v1.4_RAG_PIPELINE

| Field | Domain-specific? | Notes |
|---|---|---|
| `id` | No | Generic |
| `title` | No | Generic |
| `content` | No | Generic |
| `tier: RetrievalTier` | No | `T1_DOCTRINE / T2_POLICY / T3_OPERATIONAL / T4_CONTEXTUAL` are governance tiers not domain-locked |
| `documentType` | Partially | Typed as enum: `doctrine \| policy \| guard_rule \| template \| operational_log \| context_snippet` - governance-class categories, not purely legal |
| `domain?: string` | No | Optional domain hint, generic string |
| `tags` | No | Generic |
| `score` | No | Generic |
| `metadata` | No | Open bag |

**Disposition:** GENERALIZABLE - already mostly domain-agnostic. `RetrievalTier`
names reference governance classes (doctrine, policy, operational) which apply
across any domain. `documentType` enum is CVF-governance-native, not
legal-domain-specific. Minor: need to confirm `domain` is truly optional in
domain-agnostic usage.

---

## Layer 2 - Classification Envelope Surfaces

These surfaces record the result of classifying an artifact: what governance
gates apply, what answer class is assigned, and whether the artifact is
eligible for downstream use.

### Surface 2A: LpciIndexRecord (TypeScript)

**File:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/lpci/types.ts`
**Lines:** 29-44
**Owner:** LPCI1-T3/T4 runtime

| Field | Domain-specific? | Notes |
|---|---|---|
| `normalizedPath` | No | Generic |
| `sourceHash` | No | Generic |
| `documentType: string` | Partially | Open string but populated with LPCI types |
| `jurisdiction` | YES - LPCI | Legal jurisdiction |
| `authorityLevel` | YES - LPCI | Legal hierarchy level |
| `issuingBody` | YES - LPCI | Legal issuing body |
| `effectiveDate` | YES - LPCI | Legal date |
| `status: RecordStatus` | YES - LPCI | Legal lifecycle enum |
| `answerClass: AnswerClass` | YES - LPCI | T2 matrix values |
| `rawDisposition` | YES - LPCI | `ACCEPT / DEFER / ACCEPT_SUMMARY_ONLY` are LPCI retrieval policy |
| `dispositionAlias` | YES - LPCI | LPCI alias |
| `sensitivityLevel` | Partially | Generic concept; naming is LPCI-flavored |
| `titleSnippet` | No | Generic |
| `contentSnippet` | No | Generic |

**Disposition:** NEEDS_WRAPPER - `normalizedPath`, `sourceHash`,
`titleSnippet`, `contentSnippet` are generic; all other fields are
LPCI-specific and must be replaced in domain-agnostic form with:
`governanceGates: GovernanceGateSet`, `contentClass: string`,
`metadata: Record<string, string>`.

---

### Surface 2B: AnswerClass (TypeScript union)

**File:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/lpci/types.ts`
**Lines:** 3-7
**Owner:** LPCI1-T4

```
'DIRECT_CITED_ANSWER' | 'SUMMARY_WITH_SOURCE' |
'PROCEDURAL_GUIDANCE' | 'ESCALATE_OR_ABSTAIN'
```

**Domain-specific?** YES - these four values are legal-domain answer
classification from the LPCI T2 decision matrix. They describe what type of
legal response the LLM should give.

**Disposition:** NEEDS_WRAPPER - replace with a domain-agnostic
`contentDeliveryClass` enum: `DIRECT_ANSWER | SUMMARIZED_ANSWER |
GUIDED_RESPONSE | ESCALATE_OR_ABSTAIN`. `ESCALATE_OR_ABSTAIN` is
governance-universal and carries over as-is.

---

### Surface 2C: T11C Classification Fields (doc-only)

**File:** `docs/reference/CVF_LPCI2_T11_CLASSIFICATION_PRE_CHECK_2026-06-07.md`
**Lines:** 50 (classification table header)
**Owner:** LPCI2-T11C (doc-only; no TypeScript interface)

| Field | Domain-specific? | Notes |
|---|---|---|
| `candidateFamily` | YES - LPCI | Legal/admin document family |
| `documentType` | Partially | Enum values include legal-specific types |
| `currentStatus` | YES - LPCI | Legal lifecycle |
| `jurisdiction` | YES - LPCI | Legal jurisdiction |
| `domainCategory` | YES - LPCI | `applied_policy`, `project_case`, `administrative_notice` etc. |
| `answerClass` | YES - LPCI | T2 matrix value |
| `ec02Gate` | YES - LPCI | EC-02 is PolicyLocal / legal freshness gate |
| `t12Eligible` | YES - LPCI | T12 is LPCI2 ingestion pipeline step |

**Disposition:** NEEDS_WRAPPER - entire classification table is
LPCI-specific. Domain-agnostic replacement: `GovernanceGateSet` with
`freshnessGate`, `classificationGate`, `eligibilityGate`, and open
`customGates` for domain-specific additions.

---

## Layer 3 - Context Pack Surfaces

These surfaces assemble the final context delivered to the LLM.

### Surface 3A: ContextPackagerRequest / TypedContextPackage (TypeScript)

**File:** `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract.ts`
**Lines:** 29-59
**Owner:** CVF_CONTROL_PLANE_FOUNDATION (`ContextPackagerContract`)

| Field | Domain-specific? | Notes |
|---|---|---|
| `query: string` | No | Generic |
| `contextId: string` | No | Generic |
| `knowledgeItems` | No | Generic knowledge bag |
| `codeSnippets` | No | Generic |
| `structuredData` | No | Generic |
| `metadata` | No | Open bag |
| `maxTokens` | No | Generic token budget |
| `segmentTypeConstraints` | No | Generic |
| `packageId` | No | Generic |
| `packageHash` | No | Generic deterministic hash |
| `segments: TypedContextSegment[]` | No | Generic segments |
| `perTypeTokens` | No | Generic |
| `estimatedTokens` | No | Generic |

**Gap identified:** `ContextPackagerRequest` has no governance envelope.
There is no field to carry: source artifact descriptors, gate results,
policy decision, or freshness disclosure. The pack is produced without
evidence of what governance review approved the source content.

**Disposition:** GENERALIZABLE - domain-agnostic foundation already sound.
**Gap:** missing `governanceEnvelope` field to carry gate results and policy
decision alongside the packed content.

---

### Surface 3B: MemoryContextPackageInput / MemoryContextBlock (TypeScript)

**File:** `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager.ts`
**Lines:** 17-48
**Owner:** CVF_LEARNING_PLANE_FOUNDATION

| Field | Domain-specific? | Notes |
|---|---|---|
| `purpose: string` | No | Generic |
| `scope: string` | No | Generic |
| `riskLevel: string` | No | Generic governance field |
| `approvedMemory` | No | Generic governance-approved items |
| `excludedMemory` | No | Generic governance exclusion log |
| `policyDecision: string` | No | Generic governance decision string |
| `tokenBudget: number` | No | Generic |
| `rawMemoryReleased: false` | No | Governance lock; domain-agnostic |
| `canReinject: false` | No | Governance lock; domain-agnostic |
| `tokenBudgetExceeded` | No | Generic |

**Disposition:** FIXED_INPUT - already domain-agnostic with full governance
envelope (policyDecision, rawMemoryReleased lock, canReinject lock).
This surface is the strongest governance-native model in CVF and is the
primary reference for the proposed `GovernedContextPackage` evidence block.

---

### Surface 3C: KnowledgeNativeRetrievalAuthorityDeclaration (TypeScript)

**File:** `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/rag.context.engine.convergence.contract.ts`
**Lines:** 49-60
**Owner:** CVF_CONTROL_PLANE_FOUNDATION (W77-T1 declaration)

Canonical retrieval path (domain-agnostic):
1. `KnowledgeQueryContract.query()` + `StructuralIndexContract.build()`
2. `KnowledgeRankingContract.rank()`
3. `KnowledgeContextAssemblyContract.assemble()`
4. `KnowledgeContextAssemblyConsumerPipelineContract.execute()`
5. `ContextPackagerContract.pack()` (terminal authority)

**Domain-specific?** No - this authority chain is governance-layer, not
legal-domain-specific.

**Gap:** No governance gate injection point defined in the retrieval path.
Gates (freshness, classification, eligibility) are evaluated upstream (in
LPCI runtime) and their results are not carried into the context pack.

**Disposition:** FIXED_INPUT - retrieval authority is sound and domain-agnostic.
Gap: gate result handoff between classification layer and retrieval path
is not formalized.

---

## Layer 4 - Retrieval Receipt Surfaces

These surfaces record what happened during a retrieval: what was matched,
what governance checks were applied, what the LLM response boundary was.

### Surface 4A: RetrievalReceipt (TypeScript)

**File:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/lpci/types.ts`
**Lines:** 66-74
**Owner:** LPCI1-T4

| Field | Domain-specific? | Notes |
|---|---|---|
| `matched_paths` | No | Generic |
| `answer_class` | YES - LPCI | LPCI T2 answer class |
| `freshness_flag` | Partially | Concept is generic; field name/value is LPCI |
| `conflict_flag` | Partially | Legal conflict detection; concept generalizable |
| `matched_records: LpciIndexRecord[]` | YES - LPCI | Contains LPCI-specific fields |
| `query: string` | No | Generic |
| `query_timestamp` | No | Generic |

**Disposition:** NEEDS_WRAPPER - generic fields: `query`, `query_timestamp`,
`matched_paths`. LPCI-specific: `answer_class`, `matched_records`. Replace
with `GovernedRetrievalReceipt` that uses `governanceOutcome` and
`governanceGateResults` instead.

---

### Surface 4B: AuditReceipt (TypeScript)

**File:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/lpci/types.ts`
**Lines:** 88-103
**Owner:** LPCI1-T4

| Field | Domain-specific? | Notes |
|---|---|---|
| `auditId` | No | Generic |
| `query`, `query_timestamp` | No | Generic |
| `matched_paths` | No | Generic |
| `answer_class` | YES - LPCI | |
| `freshness_flag`, `conflict_flag` | Partially | |
| `model_response_hash` | No | Generic governance lock |
| `response_boundary_class` | Partially | `ANSWER_EMITTED / ABSTAINED / ESCALATED / NEGATIVE_RECEIPT` generalizable |
| `phase1_receipt_type` | YES - LPCI | LPCI phase-1 specific |
| `applied_filters: FilterParams` | YES - LPCI | Contains `jurisdiction`, `documentType` etc. |
| `sensitivity_pre_filter_applied` | No | Generic |
| `stale_records`, `conflict_records` | YES - LPCI | Legal record conflict detection |

**Disposition:** NEEDS_WRAPPER - `auditId`, `query`, `model_response_hash`,
`response_boundary_class`, `sensitivity_pre_filter_applied` are generic.
LPCI-specific fields must be replaced by `governanceGateResults` open map.

---

## Layer 5 - Gap Analysis Summary

| Layer | Surface | Current state | Gap | Priority |
|---|---|---|---|---|
| Scan | T11A inventory (doc) | Domain-locked enum fields | No TypeScript interface; `candidateFamily`/`ec02Applies`/`answerClass` are LPCI | HIGH |
| Scan | `ManifestEntry` (TS) | Domain-locked | `jurisdiction`/`authorityLevel`/`issuingBody`/`effectiveDate`/`status` all LPCI | HIGH |
| Scan | `RAGDocument` (TS) | Mostly generic | Only `documentType` enum needs extension; `domain` field already optional | LOW |
| Classification | `LpciIndexRecord` (TS) | Domain-locked | LPCI-specific fields dominate; no generic gate set | HIGH |
| Classification | `AnswerClass` (TS) | Domain-locked | T2 matrix values are legal-specific | MEDIUM |
| Classification | T11C classification (doc) | Domain-locked | Entire gate set is LPCI | HIGH |
| Context Pack | `ContextPackagerRequest` (TS) | Generic but incomplete | No governance envelope in request or output | HIGH |
| Context Pack | `MemoryContextBlock` (TS) | Already domain-agnostic | Gold standard; `rawMemoryReleased`/`canReinject` governance locks | NONE |
| Context Pack | Retrieval authority chain | Generic | No gate injection point defined | MEDIUM |
| Receipt | `RetrievalReceipt` (TS) | Partially LPCI | `answer_class`/`matched_records` LPCI-locked | HIGH |
| Receipt | `AuditReceipt` (TS) | Partially LPCI | `applied_filters`/`stale_records`/`conflict_records` LPCI-locked | HIGH |

### Primary Gaps Requiring New Standard Interfaces

1. **No domain-agnostic `GovernedArtifactDescriptor`**: The scan layer has
   no TypeScript interface that describes an artifact without domain-specific
   fields. A governed artifact descriptor must carry: `artifactId`,
   `sourceHash`, `artifactRole`, `contentClass`, `governanceGates`,
   `metadata`.

2. **No `GovernanceGateSet`**: Gate results (`freshnessGate`,
   `classificationGate`, `eligibilityGate`) are scattered across LPCI-specific
   fields. A standard gate set must be expressible independent of any
   domain-specific gate name (`ec02Gate`, `t12Eligible`).

3. **`ContextPackagerRequest` lacks a governance envelope**: The terminal
   packaging authority (`ContextPackagerContract.pack()`) accepts no
   governance evidence. A `GovernedContextPackRequest` must add a
   `governanceEnvelope` carrying gate results and policy decision.

4. **`AuditReceipt` is LPCI-locked**: The retrieval receipt contains
   `applied_filters` (with `jurisdiction`), `stale_records`, and
   `conflict_records` which are legal-domain specific. A
   `GovernedRetrievalReceipt` must replace these with generic
   `governanceGateResults: Record<string, string>`.

---

## Machine Closure Package

| Closure item | Required artifact/path | Machine-readable evidence | Final status |
|---|---|---|---|
| Work order status | `docs/work_orders/CVF_AGENT_WORK_ORDER_DSCP_T1_OWNER_SURFACE_MAP_FOR_CLAUDE_2026-06-07.md` | work order updated to `Status: CLOSED_PASS_BOUNDED` by reviewer after commit | BLOCKED with reason: WORKER_MUST_NOT_COMMIT |
| Completion or reviewer artifact | `docs/reviews/CVF_DSCP_T1_OWNER_SURFACE_MAP_WORKER_RETURN_2026-06-07.md` | worker return reviewed and committed by Codex | BLOCKED with reason: WORKER_MUST_NOT_COMMIT |
| Roadmap state | `docs/roadmaps/CVF_DSCP_DOMAIN_AGNOSTIC_SCAN_CONTEXT_PACK_READINESS_ROADMAP_2026-06-07.md` | DSCP-T1 row updated to closed by reviewer | BLOCKED with reason: WORKER_MUST_NOT_COMMIT |
| Registry JSON | `CVF_SESSION/ACTIVE_SESSION_STATE.json` | session sync updated by reviewer/committer after closure | BLOCKED with reason: WORKER_MUST_NOT_COMMIT |
| Registry Markdown | `CVF_SESSION_MEMORY.md` and `AGENT_HANDOFF_V16_2026-06-06.md` | session markdown updated by reviewer/committer after closure | BLOCKED with reason: WORKER_MUST_NOT_COMMIT |
| External evidence digest | source surfaces cited in this map (lines cited per surface) | all source citations are file-path + line-range verified at executionBaseHead `8e61f65d` | PASS |
| System loop interlock | no system-loop mutation authorized | DSCP-T1 is doc-only surface map; no runtime loop changed | N/A with reason: doc-only |
| Session continuity | `CVF_SESSION_MEMORY.md` and `AGENT_HANDOFF_V16_2026-06-06.md` | session sync updated by reviewer/committer after closure | BLOCKED with reason: WORKER_MUST_NOT_COMMIT |

## Claim Boundary

This surface map claims: identification and domain-specificity analysis of
existing CVF surfaces based on direct source verification (file + line range
cited for each surface). It does not claim: TypeScript implementation,
runtime behavior, provider calls, corpus ingestion, public readiness,
production readiness, or LPCI2 eligibility promotion.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY - private provenance reference; not yet public-synced.
