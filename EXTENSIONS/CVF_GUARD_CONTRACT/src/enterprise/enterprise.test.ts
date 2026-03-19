import { describe, it, expect } from 'vitest';
import type { GuardPipelineResult, GuardResult } from '../types';
import {
  getPermissions,
  canPerformAction,
  ApprovalWorkflow,
  generateComplianceReport,
} from './enterprise';

function makeGuardResult(guardId: string, decision: 'ALLOW' | 'BLOCK' | 'ESCALATE'): GuardResult {
  return {
    guardId,
    decision,
    severity: decision === 'ALLOW' ? 'INFO' : 'ERROR',
    reason: `${guardId} ${decision}`,
    timestamp: new Date().toISOString(),
  };
}

function makePipelineResult(overrides: Partial<GuardPipelineResult> = {}): GuardPipelineResult {
  return {
    requestId: 'req-1',
    finalDecision: 'ALLOW',
    results: [makeGuardResult('g1', 'ALLOW')],
    executedAt: new Date().toISOString(),
    durationMs: 12,
    ...overrides,
  };
}

describe('enterprise', () => {
  it('returns a fresh permissions object', () => {
    const perms = getPermissions('developer');
    perms.canExecute = false;
    const fresh = getPermissions('developer');
    expect(fresh.canExecute).toBe(true);
  });

  it('enforces role risk and phase limits', () => {
    const developer = { id: 'u1', name: 'Dev', email: 'dev@cvf', role: 'developer', joinedAt: 'now' as const };
    const tooRisky = canPerformAction(developer, 'deploy', 'R3', 'BUILD');
    expect(tooRisky.allowed).toBe(false);
    expect(tooRisky.reason).toMatch(/exceeds/);

    const wrongPhase = canPerformAction(developer, 'review', 'R1', 'REVIEW');
    expect(wrongPhase.allowed).toBe(false);
    expect(wrongPhase.reason).toMatch(/not allowed/);

    const allowed = canPerformAction(
      { ...developer, role: 'admin' },
      'build',
      'R2',
      'BUILD',
    );
    expect(allowed.allowed).toBe(true);
  });

  it('normalizes legacy DISCOVERY alias for enterprise phase checks', () => {
    const developer = { id: 'u1', name: 'Dev', email: 'dev@cvf', role: 'developer', joinedAt: 'now' as const };
    const allowed = canPerformAction(developer, 'clarify', 'R0', 'DISCOVERY');
    expect(allowed.allowed).toBe(true);
  });

  it('tracks approval requests and approvals', () => {
    const workflow = new ApprovalWorkflow(24);
    const req = workflow.createRequest({
      requestedBy: 'u1',
      action: 'deploy',
      phase: 'BUILD',
      riskLevel: 'R3',
      reason: 'High risk',
    });
    expect(req.status).toBe('pending');

    const approved = workflow.approve(req.id, 'reviewer-1', 'ok');
    expect(approved?.status).toBe('approved');
    expect(approved?.reviewedBy).toBe('reviewer-1');
  });

  it('expires requests that are past their deadline', () => {
    const workflow = new ApprovalWorkflow(-1);
    const req = workflow.createRequest({
      requestedBy: 'u1',
      action: 'deploy',
      phase: 'BUILD',
      riskLevel: 'R3',
      reason: 'High risk',
    });
    const approved = workflow.approve(req.id, 'reviewer-1');
    expect(approved?.status).toBe('expired');
  });

  it('generates compliance report summaries', () => {
    const results: GuardPipelineResult[] = [
      makePipelineResult({
        requestId: 'a',
        finalDecision: 'ALLOW',
        results: [makeGuardResult('g1', 'ALLOW')],
        durationMs: 10,
      }),
      makePipelineResult({
        requestId: 'b',
        finalDecision: 'BLOCK',
        blockedBy: 'g2',
        agentGuidance: 'Blocked',
        results: [makeGuardResult('g2', 'BLOCK')],
        durationMs: 20,
      }),
      makePipelineResult({
        requestId: 'c',
        finalDecision: 'ESCALATE',
        escalatedBy: 'g3',
        results: [makeGuardResult('g3', 'ESCALATE')],
        durationMs: 30,
      }),
    ];

    const report = generateComplianceReport(results, '2026-03-10', '2026-03-12');
    expect(report.summary.totalActions).toBe(3);
    expect(report.summary.allowedActions).toBe(1);
    expect(report.summary.blockedActions).toBe(1);
    expect(report.summary.escalatedActions).toBe(1);
    expect(report.summary.avgResponseTimeMs).toBe(20);
    expect(report.complianceScore).toBe(90);
    expect(report.guardBreakdown.length).toBeGreaterThan(0);
    expect(report.topBlockedActions[0].action).toBe('g2');
  });
});
