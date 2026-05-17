import { describe, expect, it } from 'vitest';

import {
  buildBoundaryFirstGovernanceRecord,
  buildAgentContinuityDelegationRecord,
  buildGovernedCapabilityRecord,
  buildGovernedContextProfileMetadata,
  buildScopedKnowledgeProviderBoundary,
  validateGovernedCapabilityRecord,
} from './cvf-add-runtime-doctrine';

describe('CVF ADD runtime doctrine records', () => {
  it('builds and validates a governed capability record with owner and evidence binding', () => {
    const record = buildGovernedCapabilityRecord({
      capabilityName: 'CLI Anything intake',
      sourceProvenance: 'CVF ADD/CLI-Anything',
      sourceClass: 'document_bundle',
      capabilityClass: 'tool',
      riskClass: 'R1',
      ownerSurface: 'external-asset-governance',
      allowedOperations: ['review source', 'normalize doctrine', 'record provenance'],
      blockedOperations: ['execute unreviewed CLI'],
      sandboxTier: 'read_only',
      policyBinding: 'CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07',
      evidenceRequirement: 'doc_review',
      evaluationStatus: 'accepted',
    });

    expect(record.capabilityId).toBe('cap-cvf-add-cli-anything-cli-anything-intake');
    expect(record.allowedOperations).toEqual([
      'review source',
      'normalize doctrine',
      'record provenance',
    ]);
    expect(validateGovernedCapabilityRecord(record)).toEqual({
      valid: true,
      issues: [],
    });
  });

  it('rejects accepted capabilities without evidence', () => {
    const record = buildGovernedCapabilityRecord({
      capabilityName: 'Unproven tool',
      sourceProvenance: 'external/tool',
      sourceClass: 'tool',
      capabilityClass: 'tool',
      riskClass: 'R2',
      ownerSurface: 'tool-adapter',
      sandboxTier: 'operator_bound',
      policyBinding: 'manual-review',
      evidenceRequirement: 'none',
      evaluationStatus: 'accepted',
    });

    expect(validateGovernedCapabilityRecord(record).issues).toContain(
      'ACCEPTED_CAPABILITY_REQUIRES_EVIDENCE',
    );
  });

  it('maps boundary-first policy class into agent behavior and W7 candidate signals', () => {
    const record = buildBoundaryFirstGovernanceRecord({
      policyClass: 'restricted_execution_path',
      reasons: ['Use docs/reference before private review files'],
      pathLocked: true,
      minimalResponseMatched: true,
    });

    expect(record.agentBehavior).toBe('follow_restricted_path');
    expect(record.operatorDecisionRequired).toBe(false);
    expect(record.candidateW7Signals).toEqual({
      pathLockSignal: true,
      minimalResponseMatch: true,
      restrictedPathCount: 1,
    });
  });

  it('keeps context profiles advisory only', () => {
    const profile = buildGovernedContextProfileMetadata({
      taskContextType: 'docs_absorption',
      capabilityNeed: 'external capability intake',
      skillMatch: 'high',
      contextBudget: 'standard',
      freshnessRequirement: 'current',
      reuseCandidate: true,
      reinjectionPolicy: 'artifact_pointer',
      handoffNeed: 'phase_checkpoint',
      evidenceSensitivity: 'medium',
      ownerSurfaceHint: 'context-builder',
    });

    expect(profile.advisoryOnly).toBe(true);
    expect(profile.ownerSurfaceHint).toBe('context-builder');
  });

  it('forces scoped knowledge providers to remain non-policy authorities', () => {
    const provider = buildScopedKnowledgeProviderBoundary({
      providerId: 'code-review-graph',
      sourcePath: 'docs/reference',
      sourceClass: 'canon',
      freshness: 'current',
      confidence: 'high',
      scopeBoundary: 'reference docs only',
      retrievalReason: 'runtime activation owner map',
      ownerSurface: 'knowledge-layer',
      policyAuthority: true,
    });

    expect(provider.policyAuthority).toBe(false);
  });

  it('keeps continuity/delegation records bounded when delegation has no authority', () => {
    const record = buildAgentContinuityDelegationRecord({
      phase: 'runtime_activation',
      checkpointRequired: true,
      handoffUpdateRequired: true,
      delegationAllowed: true,
      delegationAuthority: 'none',
      artifactRefs: ['docs/reference/CVF_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-07.md'],
      blockedDelegationReasons: ['No runtime delegation authority in current phase'],
      nextOwnerSurface: 'external-asset-governance',
    });

    expect(record.delegationAllowed).toBe(false);
    expect(record.delegationAuthority).toBe('none');
    expect(record.handoffUpdateRequired).toBe(true);
    expect(record.blockedDelegationReasons).toEqual([
      'No runtime delegation authority in current phase',
    ]);
  });
});
