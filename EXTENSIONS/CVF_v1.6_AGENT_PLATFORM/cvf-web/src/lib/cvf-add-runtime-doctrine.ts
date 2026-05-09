import type { CVFRiskLevel } from 'cvf-guard-contract';

export type GovernedCapabilityClass =
  | 'tool'
  | 'skill'
  | 'provider_utility'
  | 'agent_harness'
  | 'knowledge_helper'
  | 'workflow'
  | 'runtime_adapter';

export type GovernedCapabilitySourceClass =
  | 'repo'
  | 'folder'
  | 'document_bundle'
  | 'tool'
  | 'provider'
  | 'generated_harness'
  | 'other';

export type GovernedCapabilitySandboxTier =
  | 'none'
  | 'read_only'
  | 'workspace_bound'
  | 'network_bound'
  | 'operator_bound';

export type GovernedCapabilityEvidenceRequirement =
  | 'none'
  | 'doc_review'
  | 'unit'
  | 'e2e'
  | 'live_governance';

export type GovernedCapabilityEvaluationStatus =
  | 'proposed'
  | 'accepted'
  | 'deferred'
  | 'rejected'
  | 'retired';

export type BoundaryPolicyClass =
  | 'hard_prohibition'
  | 'soft_constraint'
  | 'communication_policy'
  | 'restricted_execution_path';

export interface GovernedCapabilityRecord {
  capabilityId: string;
  capabilityName: string;
  sourceProvenance: string;
  sourceClass: GovernedCapabilitySourceClass;
  capabilityClass: GovernedCapabilityClass;
  riskClass: CVFRiskLevel;
  ownerSurface: string;
  allowedOperations: string[];
  blockedOperations: string[];
  sandboxTier: GovernedCapabilitySandboxTier;
  policyBinding: string;
  evidenceRequirement: GovernedCapabilityEvidenceRequirement;
  freshnessStatus: 'current' | 'stale' | 'unknown';
  evaluationStatus: GovernedCapabilityEvaluationStatus;
  retirementCondition: string;
}

export interface GovernedCapabilityRecordInput {
  capabilityId?: string;
  capabilityName: string;
  sourceProvenance: string;
  sourceClass: GovernedCapabilitySourceClass;
  capabilityClass: GovernedCapabilityClass;
  riskClass: CVFRiskLevel;
  ownerSurface: string;
  allowedOperations?: string[];
  blockedOperations?: string[];
  sandboxTier: GovernedCapabilitySandboxTier;
  policyBinding: string;
  evidenceRequirement: GovernedCapabilityEvidenceRequirement;
  freshnessStatus?: 'current' | 'stale' | 'unknown';
  evaluationStatus?: GovernedCapabilityEvaluationStatus;
  retirementCondition?: string;
}

export interface CapabilityRecordValidation {
  valid: boolean;
  issues: string[];
}

export interface BoundaryFirstGovernanceRecord {
  policyClass: BoundaryPolicyClass;
  agentBehavior: 'stop' | 'optimize_inside_boundary' | 'record_tradeoff' | 'follow_restricted_path';
  operatorDecisionRequired: boolean;
  reasons: string[];
  candidateW7Signals: {
    pathLockSignal: boolean;
    minimalResponseMatch: boolean;
    restrictedPathCount: number;
  };
}

export interface GovernedContextProfileMetadata {
  taskContextType: string;
  capabilityNeed: string;
  skillMatch: 'high' | 'medium' | 'low' | 'unknown';
  contextBudget: 'compact' | 'standard' | 'expanded';
  freshnessRequirement: 'current' | 'recent' | 'historical' | 'unknown';
  reuseCandidate: boolean;
  reinjectionPolicy: 'none' | 'summary_only' | 'artifact_pointer' | 'full_record_when_authorized';
  handoffNeed: 'none' | 'phase_checkpoint' | 'agent_transfer' | 'closure';
  evidenceSensitivity: 'low' | 'medium' | 'high';
  ownerSurfaceHint: string;
  advisoryOnly: true;
}

export interface ScopedKnowledgeProviderBoundary {
  providerId: string;
  sourcePath: string;
  sourceClass: 'canon' | 'private_reference' | 'external_reference' | 'generated_index' | 'example' | 'rejected_material';
  freshness: 'current' | 'stale' | 'unknown';
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  scopeBoundary: string;
  retrievalReason: string;
  ownerSurface: string;
  policyAuthority: false;
}

export interface AgentContinuityDelegationRecord {
  phase: 'intake' | 'normalization' | 'registry_review' | 'runtime_activation' | 'closure';
  checkpointRequired: boolean;
  handoffUpdateRequired: boolean;
  delegationAllowed: boolean;
  delegationAuthority: 'none' | 'bounded_worker' | 'operator_authorized';
  artifactRefs: string[];
  blockedDelegationReasons: string[];
  nextOwnerSurface: string;
}

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeList(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );
}

export function buildGovernedCapabilityRecord(
  input: GovernedCapabilityRecordInput,
): GovernedCapabilityRecord {
  const capabilityId =
    input.capabilityId?.trim() ||
    `cap-${normalizeToken(input.sourceProvenance)}-${normalizeToken(input.capabilityName)}`;

  return {
    capabilityId,
    capabilityName: input.capabilityName.trim(),
    sourceProvenance: input.sourceProvenance.trim(),
    sourceClass: input.sourceClass,
    capabilityClass: input.capabilityClass,
    riskClass: input.riskClass,
    ownerSurface: input.ownerSurface.trim(),
    allowedOperations: normalizeList(input.allowedOperations),
    blockedOperations: normalizeList(input.blockedOperations),
    sandboxTier: input.sandboxTier,
    policyBinding: input.policyBinding.trim(),
    evidenceRequirement: input.evidenceRequirement,
    freshnessStatus: input.freshnessStatus ?? 'unknown',
    evaluationStatus: input.evaluationStatus ?? 'proposed',
    retirementCondition: input.retirementCondition?.trim() || 'Reassess when source, owner, policy, or runtime behavior changes.',
  };
}

export function validateGovernedCapabilityRecord(
  record: GovernedCapabilityRecord,
): CapabilityRecordValidation {
  const issues: string[] = [];

  if (!record.capabilityId) issues.push('MISSING_CAPABILITY_ID');
  if (!record.capabilityName) issues.push('MISSING_CAPABILITY_NAME');
  if (!record.sourceProvenance) issues.push('MISSING_SOURCE_PROVENANCE');
  if (!record.ownerSurface) issues.push('MISSING_OWNER_SURFACE');
  if (!record.policyBinding) issues.push('MISSING_POLICY_BINDING');

  if (record.evidenceRequirement === 'none' && record.evaluationStatus === 'accepted') {
    issues.push('ACCEPTED_CAPABILITY_REQUIRES_EVIDENCE');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function buildBoundaryFirstGovernanceRecord(input: {
  policyClass: BoundaryPolicyClass;
  reasons?: string[];
  pathLocked?: boolean;
  minimalResponseMatched?: boolean;
  restrictedPathCount?: number;
  trueAuthorizationNeeded?: boolean;
}): BoundaryFirstGovernanceRecord {
  const reasons = normalizeList(input.reasons);
  const restrictedPathCount = Math.max(0, input.restrictedPathCount ?? (input.pathLocked ? 1 : 0));

  const agentBehaviorByClass: Record<BoundaryPolicyClass, BoundaryFirstGovernanceRecord['agentBehavior']> = {
    hard_prohibition: 'stop',
    soft_constraint: 'optimize_inside_boundary',
    communication_policy: 'record_tradeoff',
    restricted_execution_path: 'follow_restricted_path',
  };

  return {
    policyClass: input.policyClass,
    agentBehavior: agentBehaviorByClass[input.policyClass],
    operatorDecisionRequired: input.trueAuthorizationNeeded ?? false,
    reasons,
    candidateW7Signals: {
      pathLockSignal: input.pathLocked ?? input.policyClass === 'restricted_execution_path',
      minimalResponseMatch: input.minimalResponseMatched ?? false,
      restrictedPathCount,
    },
  };
}

export function buildGovernedContextProfileMetadata(
  input: Omit<GovernedContextProfileMetadata, 'advisoryOnly'>,
): GovernedContextProfileMetadata {
  return {
    ...input,
    taskContextType: input.taskContextType.trim(),
    capabilityNeed: input.capabilityNeed.trim(),
    ownerSurfaceHint: input.ownerSurfaceHint.trim(),
    advisoryOnly: true,
  };
}

export function buildScopedKnowledgeProviderBoundary(
  input: Omit<ScopedKnowledgeProviderBoundary, 'policyAuthority'> & { policyAuthority?: boolean },
): ScopedKnowledgeProviderBoundary {
  return {
    providerId: input.providerId.trim(),
    sourcePath: input.sourcePath.trim(),
    sourceClass: input.sourceClass,
    freshness: input.freshness,
    confidence: input.confidence,
    scopeBoundary: input.scopeBoundary.trim(),
    retrievalReason: input.retrievalReason.trim(),
    ownerSurface: input.ownerSurface.trim(),
    policyAuthority: false,
  };
}

export function buildAgentContinuityDelegationRecord(
  input: AgentContinuityDelegationRecord,
): AgentContinuityDelegationRecord {
  const delegationAllowed = input.delegationAllowed && input.delegationAuthority !== 'none';

  return {
    phase: input.phase,
    checkpointRequired: input.checkpointRequired,
    handoffUpdateRequired: input.handoffUpdateRequired,
    delegationAllowed,
    delegationAuthority: delegationAllowed ? input.delegationAuthority : 'none',
    artifactRefs: normalizeList(input.artifactRefs),
    blockedDelegationReasons: delegationAllowed ? [] : normalizeList(input.blockedDelegationReasons),
    nextOwnerSurface: input.nextOwnerSurface.trim(),
  };
}
