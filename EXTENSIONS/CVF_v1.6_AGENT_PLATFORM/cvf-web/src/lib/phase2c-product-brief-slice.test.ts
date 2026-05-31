import { describe, expect, it } from 'vitest';
import {
  buildPhase2CProductBriefSlice,
  PHASE_2C_CERTIFIED_CAPABILITY_REFS,
  PHASE_2C_PRODUCT_BRIEF_SLICE_ID,
} from './phase2c-product-brief-slice';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';

const receipt: GovernanceEvidenceReceipt = {
  receiptId: 'rcpt-env-phase2c-test',
  evidenceMode: 'live',
  routeId: '/api/execute',
  decision: 'ALLOW',
  riskLevel: 'R1',
  provider: 'alibaba',
  model: 'qwen-turbo',
  routingDecision: 'allow_requested_provider',
  policySnapshotId: 'policy-phase2c-test',
  envelopeId: 'env-phase2c-test',
  generatedAt: '2026-05-18T08:00:00.000Z',
};

describe('phase2c product brief slice', () => {
  it('generates a receipt-backed deliverable pack for app_builder_complete', () => {
    const slice = buildPhase2CProductBriefSlice({
      templateId: 'app_builder_complete',
      templateName: 'App Builder Complete',
      category: 'development',
      inputs: {
        appName: 'TaskFlow',
        appType: 'Web App',
        problem: 'Small teams need a lighter way to plan tasks.',
      },
      intent: 'Create Product Brief for TaskFlow',
      output:
        '## Product Brief\n\nTaskFlow helps small teams plan tasks with a clear board, owner fields, and acceptance criteria.\n\n## Acceptance Criteria\n\n1. Users can create tasks.\n2. Users can review board status.',
      evidenceReceipt: receipt,
      validation: {
        qualityHint: 'PASS',
        issues: [],
      },
    });

    expect(slice?.sliceId).toBe(PHASE_2C_PRODUCT_BRIEF_SLICE_ID);
    expect(slice?.capabilityRefs).toEqual(PHASE_2C_CERTIFIED_CAPABILITY_REFS);
    expect(slice?.outputValidation.structuredResult).toBe(true);
    expect(slice?.deliverablePack.packType).toBe('app_planning');
    expect(slice?.deliverablePack.governanceEvidence.receiptAvailable).toBe(true);
    expect(slice?.deliverablePack.governanceEvidence.rawReceipt?.receiptId).toBe(receipt.receiptId);
    expect(slice?.receiptAdapter).toMatchObject({
      source: 'web_governance_evidence_receipt',
      target: 'deliverable_pack_governance_evidence',
      receiptId: receipt.receiptId,
    });
    expect(slice?.claimBoundary).toBe('live_governance_proof_required_before_public_claim');
  });

  it('does not activate for other templates', () => {
    expect(buildPhase2CProductBriefSlice({
      templateId: 'documentation',
      templateName: 'Documentation',
      category: 'content',
      inputs: { topic: 'Onboarding' },
      intent: 'Write documentation',
      output: 'Documentation output',
      evidenceReceipt: receipt,
    })).toBeUndefined();
  });
});
