# CVF DSCP-T1 Standard Schema Proposal: Domain-Agnostic Scan and Context Pack

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: schema_proposal

Date: 2026-06-07

workOrder: `docs/work_orders/CVF_AGENT_WORK_ORDER_DSCP_T1_OWNER_SURFACE_MAP_FOR_CLAUDE_2026-06-07.md`

ownerSurfaceMap: `docs/reference/CVF_DSCP_T1_OWNER_SURFACE_MAP_2026-06-07.md`

executionBaseHead: `8e61f65d`

---

## Scope

Applies to the DSCP-T1 tranche. Covers proposed doc-only TypeScript interface
definitions for the domain-agnostic scan -> classify -> pack -> retrieve
pipeline standard. Does not cover runtime TypeScript implementation (DSCP-T2),
runtime pilot (DSCP-T3), LPCI2 T12, or any external source modification.

## Purpose

Propose domain-agnostic TypeScript interface definitions for the governed
scan -> classification -> context pack -> retrieval pipeline. These interfaces
are doc-only proposals (not yet implemented). They generalize the LPCI2
PolicyLocal pattern into a standard CVF schema that any future corpus
expansion lane can adopt without domain-specific field coupling.

All proposed interfaces are doc-only. No `.ts` file is created in this tranche.
DSCP-T2 is the authorized tranche for TypeScript contract authoring.

---

## Design Principles

1. **Governance envelope is mandatory, domain payload is optional.** Every
   interface in the standard carries non-optional governance fields (gate
   results, policy decision, integrity hash). Domain-specific metadata flows
   through an open `metadata: Record<string, string>` bag or typed
   `customGates` map.

2. **Pattern reference: `MemoryContextBlock` is the gold standard.**
   `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager.ts`
   lines 27-35 already demonstrates the governance-envelope pattern:
   `policyDecision`, `rawMemoryReleased: false`, `canReinject: false`,
   `evidence`. The proposed interfaces extend this pattern to the scan and
   retrieval layers.

3. **`ContextPackagerContract.pack()` remains the terminal authority.**
   The `GovernedContextPackRequest` wraps `ContextPackagerRequest` - it does
   not replace the packager. The governance envelope rides alongside the pack,
   not inside it.

4. **LPCI-specific fields move to `customGates` / `metadata`.** Fields like
   `ec02Gate`, `t12Eligible`, `jurisdiction`, `authorityLevel`, `answerClass`
   become domain-specific extensions, not standard fields.

---

## Section 2 - Proposed: Scan Layer Interfaces

### 2.1 GovernanceGateSet

```typescript
// Proposed: domain-agnostic gate result set.
// Domain-specific gates extend via customGates.
interface GovernanceGateSet {
  // Freshness gate: is the artifact's content fresh enough for use?
  freshnessGate: 'PASS' | 'BLOCKED' | 'NOT_APPLICABLE' | 'UNKNOWN';

  // Classification gate: has the artifact been classified and approved?
  classificationGate: 'PASS' | 'BLOCKED' | 'CONDITIONAL' | 'UNKNOWN';

  // Eligibility gate: is the artifact eligible for downstream use (e.g. ingestion)?
  eligibilityGate: 'YES' | 'NO' | 'CONDITIONAL' | 'UNKNOWN';

  // Domain-specific gates (e.g. ec02Gate, t12Eligible for LPCI).
  // Key = gate name; value = gate result string.
  customGates?: Record<string, string>;
}
```

**Design note:** `ESCALATE_OR_ABSTAIN` from `AnswerClass`
(file: `src/lib/lpci/types.ts` line 7) is carried forward as the value for
`classificationGate: 'BLOCKED'` when an artifact cannot be classified.
The governance outcome is preserved; the LPCI-specific naming is removed.

---

### 2.2 GovernedArtifactDescriptor

```typescript
// Proposed: domain-agnostic artifact descriptor for the scan layer.
// Replaces LpciIndexRecord fields for non-LPCI domains.
interface GovernedArtifactDescriptor {
  // Stable artifact identifier (e.g. T11A-CAND-001).
  artifactId: string;

  // Deterministic content hash (sha256 or equivalent).
  sourceHash: string;

  // Role of this artifact in the governed pipeline.
  // 'corpus_candidate': under evaluation for ingestion.
  // 'reference':        already ingested reference document.
  // 'template':         prompt/output template.
  // 'operational':      runtime operational log or configuration.
  artifactRole: 'corpus_candidate' | 'reference' | 'template' | 'operational';

  // Free-string content class. Domain lanes supply their own taxonomy
  // (e.g. 'applied_policy_record', 'doctrine', 'guard_rule').
  // Not an enum in the standard - avoids domain lock-in.
  contentClass: string;

  // Governance gate results for this artifact.
  governanceGates: GovernanceGateSet;

  // Open metadata bag for domain-specific fields.
  // LPCI example keys: 'jurisdiction', 'authorityLevel', 'ec02Gate', 'answerClass'.
  metadata: Record<string, string>;
}
```

**Replaces (per surface map Layer 1 and Layer 2):**
- `ManifestEntry` domain-specific fields (`jurisdiction`, `authorityLevel`,
  `issuingBody`, `effectiveDate`, `status`) - move to `metadata`.
- `LpciIndexRecord` domain-specific fields - move to `metadata` + `customGates`.
- T11A `candidateFamily`, `ec02Applies`, `answerClass` fields - move to
  `metadata` / `customGates`.

---

## Section 3 - Proposed: Context Pack Interfaces

### 3.1 GovernanceContextEnvelope

```typescript
// Proposed: governance envelope attached to a context pack request.
// Carries gate results and policy decision alongside the pack content.
interface GovernanceContextEnvelope {
  // Artifacts whose content contributes to this context pack.
  artifactDescriptors: GovernedArtifactDescriptor[];

  // Aggregate classification gate result across all artifacts.
  classificationGate: 'PASS' | 'BLOCKED' | 'CONDITIONAL';

  // Aggregate freshness gate result.
  freshnessGate: 'PASS' | 'BLOCKED' | 'NOT_APPLICABLE';

  // Governance policy decision string (free text, auditable).
  policyDecision: string;

  // Operator-supplied authorization reference (e.g. GC-018 baseline path).
  authorizationRef?: string;
}
```

---

### 3.2 GovernedContextPackRequest

```typescript
// Proposed: ContextPackagerRequest extended with governance envelope.
// Wraps the existing ContextPackagerRequest (CPF lines 29-38)
// without modifying it.
interface GovernedContextPackRequest {
  // The inner pack request, passed to ContextPackagerContract.pack().
  packRequest: ContextPackagerRequest;  // from context.packager.contract.ts:29

  // Mandatory governance envelope.
  governanceEnvelope: GovernanceContextEnvelope;
}
```

**Design note:** `ContextPackagerContract.pack()` (file:
`EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract.ts`
line 104) remains the terminal packaging authority unchanged. The
`GovernedContextPackRequest` is the caller-side envelope; the packager
receives only `packRequest.packRequest`.

---

### 3.3 GovernedContextPackage

```typescript
// Proposed: TypedContextPackage extended with governance evidence.
// Pattern reference: MemoryContextBlock.evidence
// (EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager.ts lines 27-35).
interface GovernedContextPackageEvidence {
  // Aggregate gate results at pack time.
  classificationGate: 'PASS' | 'BLOCKED' | 'CONDITIONAL';
  freshnessGate: 'PASS' | 'BLOCKED' | 'NOT_APPLICABLE';

  // Policy decision recorded at pack time.
  policyDecision: string;

  // IDs of source artifacts contributing to this pack.
  sourceArtifactIds: string[];

  // Governance locks (pattern from MemoryContextBlock).
  rawContentReleased: false;
  canBypassGovernance: false;

  // Optional: authorization reference for audit trail.
  authorizationRef?: string;
}

interface GovernedContextPackage {
  // The inner package produced by ContextPackagerContract.pack().
  innerPackage: TypedContextPackage;  // from context.packager.contract.ts:49

  // Mandatory governance evidence block.
  governanceEvidence: GovernedContextPackageEvidence;
}
```

---

## Section 4 - Proposed: Retrieval Receipt Interface

### 4.1 ContentDeliveryClass

```typescript
// Proposed: domain-agnostic replacement for AnswerClass (lpci/types.ts:3-7).
// Maps LPCI values to generic governance outcome categories.
type ContentDeliveryClass =
  | 'DIRECT_ANSWER'       // maps from DIRECT_CITED_ANSWER
  | 'SUMMARIZED_ANSWER'   // maps from SUMMARY_WITH_SOURCE
  | 'GUIDED_RESPONSE'     // maps from PROCEDURAL_GUIDANCE
  | 'ESCALATE_OR_ABSTAIN'; // carried over as-is; governance-universal
```

---

### 4.2 GovernedRetrievalReceipt

```typescript
// Proposed: domain-agnostic retrieval receipt.
// Replaces AuditReceipt (lpci/types.ts:88-103) for non-LPCI domains.
interface GovernedRetrievalReceipt {
  receiptId: string;
  query: string;
  queryTimestamp: string;

  // ID of the GovernedContextPackage used in this retrieval.
  contextPackageId: string;

  // High-level governance outcome of the retrieval.
  governanceOutcome:
    | 'ANSWER_EMITTED'
    | 'ABSTAINED'
    | 'ESCALATED'
    | 'BLOCKED';

  // Content delivery class (domain-agnostic; maps from AnswerClass for LPCI).
  contentDeliveryClass: ContentDeliveryClass;

  // Whether freshness disclosure was applied to the LLM response.
  freshnessDisclosureApplied: boolean;

  // Gate results at retrieval time (open map; domain lanes add their keys).
  governanceGateResults: Record<string, string>;

  // Hash of the model response (governance lock).
  modelResponseHash: string;

  // IDs of source artifacts contributing to this retrieval.
  sourceArtifactIds: string[];

  // Governance lock: raw source content was not released to LLM directly.
  rawSourceReleased: false;
}
```

**Replaces (per surface map Layer 4):**
- `AuditReceipt.applied_filters` (LPCI `FilterParams` with `jurisdiction`) -
  replaced by `governanceGateResults` open map.
- `AuditReceipt.answer_class` (`AnswerClass` LPCI union) - replaced by
  `contentDeliveryClass: ContentDeliveryClass`.
- `AuditReceipt.stale_records`, `conflict_records` - domain-specific LPCI
  records; move to `governanceGateResults` open map for LPCI lanes.
- `AuditReceipt.phase1_receipt_type` - LPCI-specific; move to
  `governanceGateResults['phase1ReceiptType']` for LPCI lanes.

---

## Section 5 - Standard Context Pack Narrative

### The Governed Scan -> Classify -> Pack -> Retrieve Pipeline

A domain-agnostic CVF corpus lane follows this sequence:

```
1. SCAN
   Input:  filesystem path or external artifact reference
   Output: GovernedArtifactDescriptor[]
           - sourceHash per artifact
           - artifactRole assignment
           - contentClass (domain-specific string)
           - governanceGates: { freshnessGate, classificationGate, eligibilityGate }
           - metadata bag for domain-specific fields

2. CLASSIFY
   Input:  GovernedArtifactDescriptor[]
   Output: GovernedArtifactDescriptor[] with governanceGates populated
           - freshnessGate: PASS / BLOCKED (e.g. after freshness review date)
           - classificationGate: PASS / BLOCKED / CONDITIONAL
           - eligibilityGate: YES / NO / CONDITIONAL
           - customGates: domain-specific gate results (e.g. ec02Gate for LPCI)

3. PACK
   Input:  GovernedContextPackRequest
           - packRequest: ContextPackagerRequest (inner pack for CPF)
           - governanceEnvelope: { artifactDescriptors, classificationGate,
             freshnessGate, policyDecision, authorizationRef }
   Output: GovernedContextPackage
           - innerPackage: TypedContextPackage (from ContextPackagerContract.pack())
           - governanceEvidence: { classificationGate, freshnessGate,
             policyDecision, sourceArtifactIds,
             rawContentReleased: false, canBypassGovernance: false }

4. RETRIEVE
   Input:  query string + GovernedContextPackage
   Output: GovernedRetrievalReceipt
           - governanceOutcome: ANSWER_EMITTED / ABSTAINED / ESCALATED / BLOCKED
           - contentDeliveryClass (domain-agnostic)
           - freshnessDisclosureApplied: true/false
           - governanceGateResults open map
           - modelResponseHash
           - rawSourceReleased: false
```

### LPCI Lane Extension Pattern

For a legal/policy domain lane, the standard schema is extended as follows:

```
GovernedArtifactDescriptor.metadata keys:
  'jurisdiction'    -> legal jurisdiction value
  'authorityLevel'  -> legal authority level
  'issuingBody'     -> legal issuing body
  'effectiveDate'   -> legal effective date

GovernanceGateSet.customGates keys (LPCI-specific):
  'ec02Gate'        -> 'PASS' | 'BLOCKED_UNTIL_<date>'
  't12Eligible'     -> 'YES' | 'NO' | 'CONDITIONAL'
  'answerClass'     -> T2 matrix value string

GovernedRetrievalReceipt.governanceGateResults keys (LPCI-specific):
  'phase1ReceiptType'   -> 'NO_RESULTS' | 'FILTERED_OUT' | 'ESCALATED'
  'conflictFlag'        -> 'true' | 'false'
  'stalenessFlag'       -> 'true' | 'false'
```

This extension pattern ensures LPCI lanes can carry full LPCI governance
evidence through the standard schema without polluting the standard interface.

---

## Section 6 - Migration Mapping Table

| Current LPCI surface | Current field | Proposed domain-agnostic field | Standard interface |
|---|---|---|---|
| `LpciIndexRecord` | `jurisdiction` | `metadata['jurisdiction']` | `GovernedArtifactDescriptor` |
| `LpciIndexRecord` | `answerClass` | `customGates['answerClass']` | `GovernanceGateSet` |
| `LpciIndexRecord` | `status: RecordStatus` | `metadata['status']` | `GovernedArtifactDescriptor` |
| T11C classification | `ec02Gate` | `customGates['ec02Gate']` | `GovernanceGateSet` |
| T11C classification | `t12Eligible` | `eligibilityGate` + `customGates['t12Eligible']` | `GovernanceGateSet` |
| `AuditReceipt` | `answer_class` | `contentDeliveryClass` | `GovernedRetrievalReceipt` |
| `AuditReceipt` | `applied_filters.jurisdiction` | `governanceGateResults['jurisdiction']` | `GovernedRetrievalReceipt` |
| `AuditReceipt` | `phase1_receipt_type` | `governanceGateResults['phase1ReceiptType']` | `GovernedRetrievalReceipt` |
| `ContextPackagerRequest` | (no governance envelope) | `governanceEnvelope` | `GovernedContextPackRequest` |
| `TypedContextPackage` | (no governance evidence) | `governanceEvidence` | `GovernedContextPackage` |
| `MemoryContextBlock` | `rawMemoryReleased: false` | `rawContentReleased: false` | `GovernedContextPackageEvidence` |
| `MemoryContextBlock` | `canReinject: false` | `canBypassGovernance: false` | `GovernedContextPackageEvidence` |

---

## Acceptance Receipt Assertion Matrix

This tranche proposes `GovernedRetrievalReceipt` as a doc-only interface.
No runtime retrieval query or provider call was made in DSCP-T1.

| Required value | Observed value | Status |
|---|---|---|
| No runtime query performed | Worker confirms: no provider call, no live retrieval, no LLM query in DSCP-T1 | N/A with reason: doc-only proposal tranche; no runtime retrieval executed |
| No query receipt generated | Worker confirms: no `GovernedRetrievalReceipt` instance created; interfaces are doc-only proposals | N/A with reason: doc-only proposal tranche |

## Machine Closure Package

| Closure item | Required artifact/path | Machine-readable evidence | Final status |
|---|---|---|---|
| Work order status | `docs/work_orders/CVF_AGENT_WORK_ORDER_DSCP_T1_OWNER_SURFACE_MAP_FOR_CLAUDE_2026-06-07.md` | work order updated to `Status: CLOSED_PASS_BOUNDED` by reviewer after commit | BLOCKED with reason: WORKER_MUST_NOT_COMMIT |
| Completion or reviewer artifact | `docs/reviews/CVF_DSCP_T1_OWNER_SURFACE_MAP_WORKER_RETURN_2026-06-07.md` | worker return reviewed and committed by Codex | BLOCKED with reason: WORKER_MUST_NOT_COMMIT |
| Roadmap state | `docs/roadmaps/CVF_DSCP_DOMAIN_AGNOSTIC_SCAN_CONTEXT_PACK_READINESS_ROADMAP_2026-06-07.md` | DSCP-T1 row updated to closed by reviewer | BLOCKED with reason: WORKER_MUST_NOT_COMMIT |
| Registry JSON | `CVF_SESSION/ACTIVE_SESSION_STATE.json` | session sync updated by reviewer/committer after closure | BLOCKED with reason: WORKER_MUST_NOT_COMMIT |
| Registry Markdown | `CVF_SESSION_MEMORY.md` and `AGENT_HANDOFF_V16_2026-06-06.md` | session markdown updated by reviewer/committer after closure | BLOCKED with reason: WORKER_MUST_NOT_COMMIT |
| External evidence digest | proposed interfaces derived from source surfaces in owner surface map | no new external artifact hash generated; all derivations trace to source-verified map at `8e61f65d` | PASS |
| System loop interlock | no system-loop mutation authorized | DSCP-T1 is doc-only schema proposal; no runtime loop changed | N/A with reason: doc-only |
| Session continuity | `CVF_SESSION_MEMORY.md` and `AGENT_HANDOFF_V16_2026-06-06.md` | session sync updated by reviewer/committer after closure | BLOCKED with reason: WORKER_MUST_NOT_COMMIT |

## Claim Boundary

This schema proposal claims: doc-only TypeScript interface definitions for
domain-agnostic governed scan -> classify -> pack -> retrieve standard,
derived from source-verified gap analysis. It does not claim: runtime
implementation, TypeScript compilation validation, test coverage, provider
calls, corpus ingestion, production readiness, public readiness, or LPCI2
eligibility promotion.

DSCP-T2 (not yet authorized) is the tranche for TypeScript contract authoring
and test validation.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY - private provenance reference; not yet public-synced.
