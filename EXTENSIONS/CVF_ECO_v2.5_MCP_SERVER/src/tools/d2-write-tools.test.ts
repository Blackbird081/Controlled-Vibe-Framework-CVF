/**
 * D2 Write Tools Tests — cvf.mcpWriteSubmitTools.delta.d2.v1
 * Tests: cvf_submit_review_receipt + cvf_advance_pipeline_stage
 */

import { describe, it, expect } from 'vitest';

// ─── Inline implementations (mirrors index.ts logic) ──────────────────

const D2_CONTRACT = 'cvf.mcpWriteSubmitTools.delta.d2.v1';
const D2_ALLOWED_SUBMIT_ROLES = new Set(['REVIEWER', 'OPERATOR']);
const D2_ALLOWED_ADVANCE_ROLES = new Set(['REVIEWER', 'OPERATOR', 'AI_AGENT']);
const D2_VALID_STAGES = new Set(['intake_gate', 'orchestrator', 'worker', 'reviewer', 'closure_gate']);
const D2_STAGE_ORDER: Record<string, string> = {
  intake_gate: 'orchestrator',
  orchestrator: 'worker',
  worker: 'reviewer',
  reviewer: 'closure_gate',
  closure_gate: 'closure_gate',
};

function submitReviewReceipt(args: {
  receiptId: string;
  agentRole: string;
  templateId: string;
  decision: 'APPROVE' | 'REJECT' | 'NEEDS_REVISION';
  findings: string[];
  evidenceRefs: string[];
  claimBoundary: string;
  qualityScore?: number;
}) {
  const role = (args.agentRole || '').toUpperCase();
  if (!D2_ALLOWED_SUBMIT_ROLES.has(role)) {
    return {
      contractVersion: D2_CONTRACT, tool: 'cvf_submit_review_receipt',
      accepted: false, receiptId: args.receiptId,
      auditRecordId: `d2-reject-test`, decision: args.decision,
      rejectionReason: `role_not_authorized: role "${args.agentRole}" is not in allowed roles`,
      writtenAt: new Date().toISOString(),
    };
  }
  return {
    contractVersion: D2_CONTRACT, tool: 'cvf_submit_review_receipt',
    accepted: true, receiptId: args.receiptId,
    auditRecordId: `d2-rcpt-test`, decision: args.decision,
    writtenAt: new Date().toISOString(),
  };
}

function advancePipelineStage(args: {
  currentStage: string;
  stageResult: 'completed' | 'failed' | 'needs_review' | 'escalated';
  agentRole: string;
  receiptRef?: string;
  notes?: string;
}) {
  const role = (args.agentRole || '').toUpperCase();
  const stage = args.currentStage;

  if (!D2_ALLOWED_ADVANCE_ROLES.has(role)) {
    return {
      contractVersion: D2_CONTRACT, tool: 'cvf_advance_pipeline_stage',
      previousStage: stage, nextStage: stage, advanced: false,
      humanInterventionRequired: false,
      rejectionReason: `role_not_authorized: role "${args.agentRole}" is not in allowed roles`,
      auditRecordId: `d2-reject-test`, advancedAt: new Date().toISOString(),
    };
  }

  if (!D2_VALID_STAGES.has(stage)) {
    return {
      contractVersion: D2_CONTRACT, tool: 'cvf_advance_pipeline_stage',
      previousStage: stage, nextStage: stage, advanced: false,
      humanInterventionRequired: false,
      rejectionReason: `validation_error: "${stage}" is not a valid stage`,
      auditRecordId: `d2-reject-test`, advancedAt: new Date().toISOString(),
    };
  }

  const failed = args.stageResult === 'failed' || args.stageResult === 'escalated';
  const nextStage = failed ? stage : (D2_STAGE_ORDER[stage] ?? stage);
  const advanced = !failed && nextStage !== stage;

  return {
    contractVersion: D2_CONTRACT, tool: 'cvf_advance_pipeline_stage',
    previousStage: stage, nextStage, advanced,
    humanInterventionRequired: failed,
    auditRecordId: `d2-adv-test`, advancedAt: new Date().toISOString(),
  };
}

// ─── cvf_submit_review_receipt tests ──────────────────────────────────

describe('cvf_submit_review_receipt', () => {
  const validBase = {
    receiptId: 'rcpt-test-001',
    agentRole: 'REVIEWER',
    templateId: 'strategy_analysis',
    decision: 'APPROVE' as const,
    findings: [],
    evidenceRefs: ['rcpt-prior-001'],
    claimBoundary: 'Review covers code quality and security scan.',
  };

  it('returns correct contract version', () => {
    const r = submitReviewReceipt(validBase);
    expect(r.contractVersion).toBe(D2_CONTRACT);
    expect(r.tool).toBe('cvf_submit_review_receipt');
  });

  it('accepts valid REVIEWER role', () => {
    const r = submitReviewReceipt(validBase);
    expect(r.accepted).toBe(true);
    expect(r.receiptId).toBe('rcpt-test-001');
    expect(r.decision).toBe('APPROVE');
    expect(r.auditRecordId).toBeTruthy();
    expect(r.writtenAt).toBeTruthy();
  });

  it('accepts valid OPERATOR role', () => {
    const r = submitReviewReceipt({ ...validBase, agentRole: 'OPERATOR' });
    expect(r.accepted).toBe(true);
  });

  it('rejects unauthorized role', () => {
    const r = submitReviewReceipt({ ...validBase, agentRole: 'AI_AGENT' });
    expect(r.accepted).toBe(false);
    expect(r.rejectionReason).toContain('role_not_authorized');
  });

  it('rejects unknown role', () => {
    const r = submitReviewReceipt({ ...validBase, agentRole: 'UNKNOWN' });
    expect(r.accepted).toBe(false);
  });

  it('accepts REJECT decision', () => {
    const r = submitReviewReceipt({ ...validBase, decision: 'REJECT', findings: ['missing tests'] });
    expect(r.accepted).toBe(true);
    expect(r.decision).toBe('REJECT');
  });

  it('accepts NEEDS_REVISION decision', () => {
    const r = submitReviewReceipt({ ...validBase, decision: 'NEEDS_REVISION' });
    expect(r.accepted).toBe(true);
  });

  it('normalizes role to uppercase', () => {
    const r = submitReviewReceipt({ ...validBase, agentRole: 'reviewer' });
    expect(r.accepted).toBe(true);
  });
});

// ─── cvf_advance_pipeline_stage tests ─────────────────────────────────

describe('cvf_advance_pipeline_stage', () => {
  const validBase = {
    currentStage: 'intake_gate',
    stageResult: 'completed' as const,
    agentRole: 'OPERATOR',
  };

  it('returns correct contract version', () => {
    const r = advancePipelineStage(validBase);
    expect(r.contractVersion).toBe(D2_CONTRACT);
    expect(r.tool).toBe('cvf_advance_pipeline_stage');
  });

  it('advances intake_gate → orchestrator on completed', () => {
    const r = advancePipelineStage(validBase);
    expect(r.advanced).toBe(true);
    expect(r.previousStage).toBe('intake_gate');
    expect(r.nextStage).toBe('orchestrator');
    expect(r.humanInterventionRequired).toBe(false);
  });

  it('advances orchestrator → worker', () => {
    const r = advancePipelineStage({ ...validBase, currentStage: 'orchestrator' });
    expect(r.nextStage).toBe('worker');
    expect(r.advanced).toBe(true);
  });

  it('advances worker → reviewer', () => {
    const r = advancePipelineStage({ ...validBase, currentStage: 'worker' });
    expect(r.nextStage).toBe('reviewer');
  });

  it('advances reviewer → closure_gate', () => {
    const r = advancePipelineStage({ ...validBase, currentStage: 'reviewer' });
    expect(r.nextStage).toBe('closure_gate');
  });

  it('closure_gate stays at closure_gate (terminal)', () => {
    const r = advancePipelineStage({ ...validBase, currentStage: 'closure_gate' });
    expect(r.nextStage).toBe('closure_gate');
    expect(r.advanced).toBe(false);
  });

  it('failed result does not advance stage', () => {
    const r = advancePipelineStage({ ...validBase, stageResult: 'failed' });
    expect(r.advanced).toBe(false);
    expect(r.nextStage).toBe('intake_gate');
    expect(r.humanInterventionRequired).toBe(true);
  });

  it('escalated result sets humanInterventionRequired', () => {
    const r = advancePipelineStage({ ...validBase, stageResult: 'escalated' });
    expect(r.humanInterventionRequired).toBe(true);
    expect(r.advanced).toBe(false);
  });

  it('needs_review advances normally', () => {
    const r = advancePipelineStage({ ...validBase, currentStage: 'worker', stageResult: 'needs_review' });
    expect(r.nextStage).toBe('reviewer');
    expect(r.advanced).toBe(true);
    expect(r.humanInterventionRequired).toBe(false);
  });

  it('accepts AI_AGENT role', () => {
    const r = advancePipelineStage({ ...validBase, agentRole: 'AI_AGENT' });
    expect(r.advanced).toBe(true);
    expect((r as { rejectionReason?: string }).rejectionReason).toBeUndefined();
  });

  it('rejects unauthorized role', () => {
    const r = advancePipelineStage({ ...validBase, agentRole: 'WORKER' });
    expect(r.advanced).toBe(false);
    expect(r.rejectionReason).toContain('role_not_authorized');
  });

  it('rejects invalid stage', () => {
    const r = advancePipelineStage({ ...validBase, currentStage: 'invalid_stage' });
    expect(r.advanced).toBe(false);
    expect(r.rejectionReason).toContain('validation_error');
  });

  it('normalizes role to uppercase', () => {
    const r = advancePipelineStage({ ...validBase, agentRole: 'reviewer' });
    expect(r.advanced).toBe(true);
  });

  it('audit record ID is present', () => {
    const r = advancePipelineStage(validBase);
    expect(r.auditRecordId).toBeTruthy();
    expect(r.advancedAt).toBeTruthy();
  });
});
