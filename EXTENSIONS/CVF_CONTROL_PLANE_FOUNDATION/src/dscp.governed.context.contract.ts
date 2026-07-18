import type { ContextPackagerRequest, TypedContextPackage } from "./context.packager.contract";

// --- DSCP Domain-Agnostic Governed Context Standard Interfaces ---
// Tranche: DSCP-T2
// Schema source: docs/reference/CVF_DSCP_T1_SCHEMA_PROPOSAL_2026-06-07.md
// Authorization: docs/baselines/CVF_GC018_DSCP_T2_STANDARD_CONTRACT_AUTHORING_2026-06-07.md

// --- Section 2: Scan Layer Interfaces ---

// Domain-agnostic gate result set.
// Domain-specific gates extend via customGates.
// Schema source: lines 72-86
export interface GovernanceGateSet {
  // Freshness gate: is the artifact's content fresh enough for use?
  freshnessGate: "PASS" | "BLOCKED" | "NOT_APPLICABLE" | "UNKNOWN";

  // Classification gate: has the artifact been classified and approved?
  classificationGate: "PASS" | "BLOCKED" | "CONDITIONAL" | "UNKNOWN";

  // Eligibility gate: is the artifact eligible for downstream use (e.g. ingestion)?
  eligibilityGate: "YES" | "NO" | "CONDITIONAL" | "UNKNOWN";

  // Domain-specific gates (e.g. ec02Gate, t12Eligible for LPCI).
  // Key = gate name; value = gate result string.
  customGates?: Record<string, string>;
}

// Domain-agnostic artifact descriptor for the scan layer.
// Replaces LpciIndexRecord fields for non-LPCI domains.
// Schema source: lines 100-125
export interface GovernedArtifactDescriptor {
  // Stable artifact identifier (e.g. T11A-CAND-001).
  artifactId: string;

  // Deterministic content hash (sha256 or equivalent).
  sourceHash: string;

  // Role of this artifact in the governed pipeline.
  artifactRole: "corpus_candidate" | "reference" | "template" | "operational";

  // Free-string content class. Domain lanes supply their own taxonomy.
  // Not an enum in the standard to avoid domain lock-in.
  contentClass: string;

  // Governance gate results for this artifact.
  governanceGates: GovernanceGateSet;

  // Open metadata bag for domain-specific fields.
  // LPCI example keys: 'jurisdiction', 'authorityLevel', 'ec02Gate', 'answerClass'.
  metadata: Record<string, string>;
}

// --- Section 3: Context Pack Interfaces ---

// Governance envelope attached to a context pack request.
// Carries gate results and policy decision alongside the pack content.
// Schema source: lines 144-160
export interface GovernanceContextEnvelope {
  // Artifacts whose content contributes to this context pack.
  artifactDescriptors: GovernedArtifactDescriptor[];

  // Aggregate classification gate result across all artifacts.
  classificationGate: "PASS" | "BLOCKED" | "CONDITIONAL";

  // Aggregate freshness gate result.
  freshnessGate: "PASS" | "BLOCKED" | "NOT_APPLICABLE";

  // Governance policy decision string (free text, auditable).
  policyDecision: string;

  // Operator-supplied authorization reference (e.g. GC-018 baseline path).
  authorizationRef?: string;
}

// ContextPackagerRequest extended with governance envelope.
// Wraps the existing ContextPackagerRequest (CPF lines 29-38) without modifying it.
// Schema source: lines 170-176
export interface GovernedContextPackRequest {
  // The inner pack request, passed to ContextPackagerContract.pack().
  packRequest: ContextPackagerRequest;

  // Mandatory governance envelope.
  governanceEnvelope: GovernanceContextEnvelope;
}

// Governance evidence block attached to a context package.
// Pattern reference: MemoryContextBlock.evidence
// (EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager.ts lines 27-35).
// Schema source: lines 193-210
export interface GovernedContextPackageEvidence {
  // Aggregate gate results at pack time.
  classificationGate: "PASS" | "BLOCKED" | "CONDITIONAL";
  freshnessGate: "PASS" | "BLOCKED" | "NOT_APPLICABLE";

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

// TypedContextPackage extended with governance evidence.
// Schema source: lines 212-218
export interface GovernedContextPackage {
  // The inner package produced by ContextPackagerContract.pack().
  innerPackage: TypedContextPackage;

  // Mandatory governance evidence block.
  governanceEvidence: GovernedContextPackageEvidence;
}

// --- Section 4: Retrieval Receipt Interfaces ---

// Domain-agnostic replacement for AnswerClass (lpci/types.ts:3-7).
// Maps LPCI values to generic governance outcome categories.
// Schema source: lines 230-234
export type ContentDeliveryClass =
  | "DIRECT_ANSWER"       // maps from DIRECT_CITED_ANSWER
  | "SUMMARIZED_ANSWER"   // maps from SUMMARY_WITH_SOURCE
  | "GUIDED_RESPONSE"     // maps from PROCEDURAL_GUIDANCE
  | "ESCALATE_OR_ABSTAIN"; // carried over as-is; governance-universal

// Domain-agnostic retrieval receipt.
// Replaces AuditReceipt (lpci/types.ts:88-103) for non-LPCI domains.
// Schema source: lines 244-276
export interface GovernedRetrievalReceipt {
  receiptId: string;
  query: string;
  queryTimestamp: string;

  // ID of the GovernedContextPackage used in this retrieval.
  contextPackageId: string;

  // High-level governance outcome of the retrieval.
  governanceOutcome:
    | "ANSWER_EMITTED"
    | "ABSTAINED"
    | "ESCALATED"
    | "BLOCKED";

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
