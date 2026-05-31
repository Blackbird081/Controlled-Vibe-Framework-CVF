import { describe, expect, it } from 'vitest';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import { buildPhase2CProductBriefSlice } from './phase2c-product-brief-slice';
import { buildPhase3EEmissionPilot } from './phase3e-operational-emission';

const receipt: GovernanceEvidenceReceipt = {
  receiptId: 'rcpt-env-phase3e-test',
  evidenceMode: 'live',
  routeId: '/api/execute',
  decision: 'ALLOW',
  riskLevel: 'R1',
  provider: 'alibaba',
  model: 'qwen-turbo',
  routingDecision: 'allow_requested_provider',
  policySnapshotId: 'policy-phase3e-test',
  envelopeId: 'env-phase3e-test',
  generatedAt: '2026-05-18T08:00:00.000Z',
};

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
});

describe('phase3e operational emission pilot', () => {
  it('emits exactly the three Phase 3.E pilot metrics from a Phase 2.C source', () => {
    const pilot = buildPhase3EEmissionPilot({
      phase2cProductBrief: slice,
      evidenceReceipt: receipt,
      responseSuccess: true,
    });

    expect(pilot?.pilotId).toBe('CVF_17_05_PHASE_3E_EMISSION_PILOT');
    expect(pilot?.status).toBe('emitted');
    expect(pilot?.metrics.map(metric => metric.metricId)).toEqual([
      'policy-violation-rate',
      'receipt-integrity',
      'task-completion-rate',
    ]);
    expect(pilot?.metrics).toHaveLength(3);
    expect(pilot?.metrics.find(metric => metric.metricId === 'policy-violation-rate')?.value).toBe(0);
    expect(pilot?.metrics.find(metric => metric.metricId === 'receipt-integrity')?.value).toBe(1);
    expect(pilot?.metrics.find(metric => metric.metricId === 'task-completion-rate')?.value).toBe(1);
    expect(pilot?.skippedMetrics.length).toBeGreaterThanOrEqual(7);
    expect(pilot?.claimBoundary).toBe('pilot_only_no_full_operational_intelligence_claim');
  });

  it('records a policy violation rate when the source decision is blocked', () => {
    const blockedReceipt = { ...receipt, decision: 'BLOCK' };
    const blockedSlice = buildPhase2CProductBriefSlice({
      templateId: 'app_builder_complete',
      templateName: 'App Builder Complete',
      category: 'development',
      inputs: { appName: 'TaskFlow' },
      intent: 'Create Product Brief for TaskFlow',
      output: '## Product Brief\n\nA blocked source fixture with enough structure for the pack.',
      evidenceReceipt: blockedReceipt,
    });

    const pilot = buildPhase3EEmissionPilot({
      phase2cProductBrief: blockedSlice,
      evidenceReceipt: blockedReceipt,
      responseSuccess: false,
    });

    expect(pilot?.metrics.find(metric => metric.metricId === 'policy-violation-rate')?.value).toBe(1);
    expect(pilot?.metrics.find(metric => metric.metricId === 'task-completion-rate')?.value).toBe(0);
  });

  it('does not emit without a Phase 2.C source slice', () => {
    expect(buildPhase3EEmissionPilot({
      evidenceReceipt: receipt,
      responseSuccess: true,
    })).toBeUndefined();
  });
});
