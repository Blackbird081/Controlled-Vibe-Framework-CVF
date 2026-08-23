// LPCI1-T5: TypeScript types derived from T4 Retrieval Boundary Spec and T3 Search Filter Index Spec

export type AnswerClass =
  | 'DIRECT_CITED_ANSWER'
  | 'SUMMARY_WITH_SOURCE'
  | 'PROCEDURAL_GUIDANCE'
  | 'ESCALATE_OR_ABSTAIN';

export type RecordStatus =
  | 'effective'
  | 'draft'
  | 'amended'
  | 'superseded'
  | 'repealed'
  | 'obsolete'
  | 'unknown';

// EC-02 lifecycle status for regulatory/policy documents (EC-T3).
// Distinct from RecordStatus -- this tracks promulgation/force state, not workflow state.
export type DocumentStatus = 'PROMULGATED' | 'IN_FORCE' | 'STATUS_UNKNOWN';

export type RawDisposition = 'ACCEPT' | 'DEFER' | 'ACCEPT_SUMMARY_ONLY';
export type DispositionAlias = 'ACCEPT' | 'ACCEPT_DEFERRED';

export type ResponseBoundaryClass =
  | 'ANSWER_EMITTED'
  | 'ABSTAINED'
  | 'ESCALATED'
  | 'NEGATIVE_RECEIPT';

export type Phase1ReceiptType = 'NO_RESULTS' | 'FILTERED_OUT' | 'ESCALATED';

export interface LpciIndexRecord {
  normalizedPath: string;
  sourceHash: string;
  documentType: string;
  jurisdiction?: string;
  authorityLevel?: string;
  issuingBody?: string;
  effectiveDate?: string;
  promulgationDate?: string;
  documentStatus?: DocumentStatus;
  status: RecordStatus;
  answerClass: AnswerClass;
  rawDisposition: RawDisposition;
  dispositionAlias: DispositionAlias;
  sensitivityLevel?: string;
  titleSnippet?: string;
  contentSnippet?: string;
}

export interface FilterParams {
  status?: RecordStatus[];
  jurisdiction?: string;
  documentType?: string;
  authorityLevel?: string;
  sensitivityClearance?: boolean;
}

// T3 Phase 1 outputs
export interface RankedResultSet {
  records: LpciIndexRecord[];
}

export interface Phase1NegativeReceipt {
  receiptType: Phase1ReceiptType;
  query: string;
  reason?: string;
}

// T4 Phase 2 schemas
export interface RetrievalReceipt {
  matched_paths: string[];
  answer_class: AnswerClass;
  freshness_flag: boolean;
  conflict_flag: boolean;
  matched_records: LpciIndexRecord[];
  query: string;
  query_timestamp: string;
}

export interface StaleRecord {
  normalizedPath: string;
  status: RecordStatus;
  effectiveDate?: string;
}

export interface ConflictRecord {
  normalizedPath: string;
  authorityLevel?: string;
  effectiveDate?: string;
}

export interface AuditReceipt {
  auditId: string;
  query: string;
  query_timestamp: string;
  matched_paths: string[];
  answer_class: AnswerClass;
  freshness_flag: boolean;
  conflict_flag: boolean;
  model_response_hash: string;
  response_boundary_class: ResponseBoundaryClass;
  phase1_receipt_type?: Phase1ReceiptType;
  applied_filters: FilterParams;
  sensitivity_pre_filter_applied: boolean;
  stale_records?: StaleRecord[];
  conflict_records?: ConflictRecord[];
}

// Corpus intake types (T4 spec / T1 architecture)
export interface ManifestEntry {
  relativePath: string;
  documentType: string;
  hash?: string;
  jurisdiction?: string;
  authorityLevel?: string;
  issuingBody?: string;
  effectiveDate?: string;
  promulgationDate?: string;
  documentStatus?: DocumentStatus;
  status?: RecordStatus;
}

export interface CorpusManifest {
  corpusId: string;
  files: ManifestEntry[];
  manifestHashProxy?: boolean;
  manifestProxyException?: string;
}

export interface IntakeRecord extends LpciIndexRecord {
  relativePath: string;
}

export interface IntakeReport {
  rowCount: number;
  gaps: string[];
  sourceHashSummary: string;
}

export type SensitivityLevel =
  | 'public'
  | 'restricted'
  | 'confidential'
  | 'classified'
  | 'unknown';

export type AuthorizationDecision = 'PUBLIC_ONLY';

export type EvidenceOutcome =
  | 'NOT_EVALUATED'
  | 'NO_MATCHES'
  | 'FILTERED_PUBLIC_ONLY'
  | 'ABSTAINED'
  | 'UNAVAILABLE'
  | 'ELIGIBLE_NOT_SENT'
  | 'PROVIDER_FAILED'
  | 'ANSWER_EMITTED';

export interface ModelEvidenceRecord {
  normalizedPath: string;
  effectiveDate: string;
  status: RecordStatus;
  answerClass: AnswerClass;
  contentSnippet: string;
}

export interface ModelEvidenceProjection {
  schemaVersion: 'cvf.lpci1Web.modelEvidence.v1';
  records: ModelEvidenceRecord[];
}

export interface RouteGovernanceProofView {
  actorId: string | null;
  authMode: string;
  decision: 'ALLOW' | 'DENY';
}

interface LpciUnauditedResponse {
  message: string;
  routeGovernanceProof: RouteGovernanceProofView;
}

interface LpciAuditedResponse {
  query: string;
  corpusId: string;
  auditId: string;
  authorizationDecision: AuthorizationDecision;
  evidenceOutcome: EvidenceOutcome;
  auditReceipt: AuditReceipt;
  routeGovernanceProof: RouteGovernanceProofView;
}

export type LpciQueryResponse =
  | ({ outcome: 'AUTHORIZATION_DENIED' } & LpciUnauditedResponse)
  | ({ outcome: 'INVALID_REQUEST' } & LpciUnauditedResponse)
  | ({ outcome: 'CORPUS_NOT_REGISTERED'; message: string } & LpciAuditedResponse)
  | ({ outcome: 'PHASE1_NEGATIVE'; receiptType: Phase1ReceiptType; reason?: string } & LpciAuditedResponse)
  | ({ outcome: 'ABSTAINED'; response: string; answerClass: 'ESCALATE_OR_ABSTAIN' } & LpciAuditedResponse)
  | ({ outcome: 'GROUNDING_EVIDENCE_UNAVAILABLE'; message: string } & LpciAuditedResponse)
  | ({ outcome: 'NO_PROVIDER_CONFIGURED'; message: string } & LpciAuditedResponse)
  | ({ outcome: 'PROVIDER_ERROR'; message: string } & LpciAuditedResponse)
  | ({
      outcome: 'ANSWER_EMITTED';
      response: string;
      answerClass: AnswerClass;
      matchedSources: string[];
      freshnessFlag: boolean;
      conflictFlag: boolean;
    } & LpciAuditedResponse);
