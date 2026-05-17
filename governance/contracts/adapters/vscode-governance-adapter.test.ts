/**
 * Tests for CVF VS Code Governance Adapter
 * @module governance/contracts/adapters/vscode-governance-adapter.test
 */

import {
  VSCodeGovernanceAdapter,
  PHASE_ROLE_ALLOWED_ACTIONS,
  PHASE_MAX_RISK,
  type VSCodeAdapterConfig,
} from './vscode-governance-adapter';
import type {
  CVFGuardRequest,
  CVFCanonicalPhase,
  CVFCanonicalRisk,
} from '../cross-channel-guard-contract';

function makeRequest(overrides: Partial<CVFGuardRequest> = {}): CVFGuardRequest {
  return {
    requestId: `test-${Date.now()}`,
    channel: 'vscode',
    phase: 'BUILD',
    riskLevel: 'R2',
    role: 'BUILDER',
    action: 'write code',
    ...overrides,
  };
}

function makeAdapter(overrides: Partial<VSCodeAdapterConfig> = {}): VSCodeGovernanceAdapter {
  return new VSCodeGovernanceAdapter({
    phase: 'BUILD',
    role: 'BUILDER',
    riskLevel: 'R2',
    ...overrides,
  });
}

// ─── Constructor & State ─────────────────────────────────────────────

describe('VSCodeGovernanceAdapter: constructor', () => {
  it('sets channel to vscode by default', () => {
    const adapter = makeAdapter();
    expect(adapter.channel).toBe('vscode');
  });

  it('accepts custom channel', () => {
    const adapter = makeAdapter({ channel: 'cli' });
    expect(adapter.channel).toBe('cli');
  });

  it('normalizes phase strings', () => {
    const adapter = makeAdapter({ phase: 'DISCOVERY' });
    expect(adapter.phase).toBe('INTAKE');
  });

  it('normalizes risk strings', () => {
    const adapter = makeAdapter({ riskLevel: 'r3' });
    expect(adapter.riskLevel).toBe('R3');
  });

  it('uses provided role', () => {
    const adapter = makeAdapter({ role: 'REVIEWER' });
    expect(adapter.role).toBe('REVIEWER');
  });
});

describe('VSCodeGovernanceAdapter: state mutation', () => {
  it('setPhase normalizes and updates', () => {
    const adapter = makeAdapter({ phase: 'INTAKE' });
    adapter.setPhase('DESIGN');
    expect(adapter.phase).toBe('DESIGN');
  });

  it('setPhase handles aliases', () => {
    const adapter = makeAdapter();
    adapter.setPhase('A');
    expect(adapter.phase).toBe('INTAKE');
  });

  it('setRole updates role', () => {
    const adapter = makeAdapter();
    adapter.setRole('GOVERNOR');
    expect(adapter.role).toBe('GOVERNOR');
  });

  it('setRiskLevel normalizes and updates', () => {
    const adapter = makeAdapter();
    adapter.setRiskLevel('R4');
    expect(adapter.riskLevel).toBe('R4');
  });
});

// ─── Evaluate: Phase Gate ────────────────────────────────────────────

describe('VSCodeGovernanceAdapter: evaluate - phase gate', () => {
  it('ALLOWS when request phase matches adapter phase', () => {
    const adapter = makeAdapter({ phase: 'BUILD' });
    const result = adapter.evaluate(makeRequest({ phase: 'BUILD' }));
    expect(result.finalDecision).toBe('ALLOW');
  });

  it('BLOCKS when request phase differs from adapter phase', () => {
    const adapter = makeAdapter({ phase: 'INTAKE' });
    const result = adapter.evaluate(makeRequest({ phase: 'BUILD' }));
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('phase-gate');
  });
});

// ─── Evaluate: Risk Gate ─────────────────────────────────────────────

describe('VSCodeGovernanceAdapter: evaluate - risk gate', () => {
  it('ALLOWS when risk within phase limit', () => {
    const adapter = makeAdapter({ phase: 'BUILD' }); // max R3
    const result = adapter.evaluate(makeRequest({ riskLevel: 'R2' }));
    expect(result.finalDecision).toBe('ALLOW');
  });

  it('BLOCKS in strict mode when risk exceeds phase limit', () => {
    const adapter = makeAdapter({ phase: 'INTAKE', strictMode: true }); // max R1
    const result = adapter.evaluate(makeRequest({ phase: 'INTAKE', riskLevel: 'R3' }));
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.results.find(r => r.guardId === 'risk-gate')?.decision).toBe('BLOCK');
  });

  it('ESCALATES in non-strict mode when risk exceeds', () => {
    const adapter = makeAdapter({ phase: 'INTAKE', strictMode: false }); // max R1
    const result = adapter.evaluate(makeRequest({ phase: 'INTAKE', riskLevel: 'R3', role: 'ANALYST', action: 'analyze inputs' }));
    expect(result.results.find(r => r.guardId === 'risk-gate')?.decision).toBe('ESCALATE');
  });

  it('R0 always passes in any phase', () => {
    const phases: CVFCanonicalPhase[] = ['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE'];
    for (const phase of phases) {
      const adapter = makeAdapter({ phase, role: 'GOVERNOR' });
      const result = adapter.evaluate(makeRequest({ phase, riskLevel: 'R0', role: 'GOVERNOR', action: 'read context' }));
      const riskResult = result.results.find(r => r.guardId === 'risk-gate');
      expect(riskResult?.decision).toBe('ALLOW');
    }
  });
});

// ─── Evaluate: Authority Gate ────────────────────────────────────────

describe('VSCodeGovernanceAdapter: evaluate - authority gate', () => {
  it('ALLOWS action in the allowed list', () => {
    const adapter = makeAdapter({ phase: 'BUILD', role: 'BUILDER' });
    const result = adapter.evaluate(makeRequest({ action: 'write code' }));
    expect(result.results.find(r => r.guardId === 'authority-gate')?.decision).toBe('ALLOW');
  });

  it('BLOCKS unauthorized action in strict mode', () => {
    const adapter = makeAdapter({ phase: 'INTAKE', role: 'OBSERVER', strictMode: true });
    const result = adapter.evaluate(makeRequest({ phase: 'INTAKE', riskLevel: 'R0', role: 'OBSERVER', action: 'deploy to production' }));
    expect(result.results.find(r => r.guardId === 'authority-gate')?.decision).toBe('BLOCK');
  });

  it('ESCALATES unauthorized action in non-strict mode', () => {
    const adapter = makeAdapter({ phase: 'INTAKE', role: 'OBSERVER', strictMode: false });
    const result = adapter.evaluate(makeRequest({ phase: 'INTAKE', riskLevel: 'R0', role: 'OBSERVER', action: 'deploy to production' }));
    expect(result.results.find(r => r.guardId === 'authority-gate')?.decision).toBe('ESCALATE');
  });

  it('partial match works for actions', () => {
    const adapter = makeAdapter({ phase: 'BUILD', role: 'BUILDER' });
    const result = adapter.evaluate(makeRequest({ action: 'write code for auth module' }));
    expect(result.results.find(r => r.guardId === 'authority-gate')?.decision).toBe('ALLOW');
  });
});

// ─── checkPhaseGate / checkRiskGate ──────────────────────────────────

describe('VSCodeGovernanceAdapter: individual gate methods', () => {
  it('checkPhaseGate returns ALLOW for matching phase', () => {
    const adapter = makeAdapter({ phase: 'DESIGN' });
    const result = adapter.checkPhaseGate(makeRequest({ phase: 'DESIGN' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('checkPhaseGate returns BLOCK for mismatched phase', () => {
    const adapter = makeAdapter({ phase: 'DESIGN' });
    const result = adapter.checkPhaseGate(makeRequest({ phase: 'BUILD' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('checkRiskGate returns ALLOW when within limit', () => {
    const adapter = makeAdapter({ phase: 'BUILD' }); // max R3
    const result = adapter.checkRiskGate(makeRequest({ riskLevel: 'R1' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('checkRiskGate returns BLOCK when over limit in strict mode', () => {
    const adapter = makeAdapter({ phase: 'DESIGN', strictMode: true }); // max R2
    const result = adapter.checkRiskGate(makeRequest({ riskLevel: 'R4' }));
    expect(result.decision).toBe('BLOCK');
  });
});

// ─── Audit Log ───────────────────────────────────────────────────────

describe('VSCodeGovernanceAdapter: audit log', () => {
  it('starts empty', () => {
    const adapter = makeAdapter();
    expect(adapter.getAuditLog()).toHaveLength(0);
  });

  it('adds entries after evaluate', () => {
    const adapter = makeAdapter();
    adapter.evaluate(makeRequest());
    expect(adapter.getAuditLog()).toHaveLength(1);
  });

  it('records multiple evaluations', () => {
    const adapter = makeAdapter();
    adapter.evaluate(makeRequest({ requestId: 'req-1' }));
    adapter.evaluate(makeRequest({ requestId: 'req-2' }));
    adapter.evaluate(makeRequest({ requestId: 'req-3' }));
    expect(adapter.getAuditLog()).toHaveLength(3);
  });

  it('limit parameter works', () => {
    const adapter = makeAdapter();
    adapter.evaluate(makeRequest({ requestId: 'req-1' }));
    adapter.evaluate(makeRequest({ requestId: 'req-2' }));
    adapter.evaluate(makeRequest({ requestId: 'req-3' }));
    const last2 = adapter.getAuditLog(2);
    expect(last2).toHaveLength(2);
    expect(last2[0].requestId).toBe('req-2');
  });

  it('caps at maxAuditEntries', () => {
    const adapter = makeAdapter({ maxAuditEntries: 2 });
    adapter.evaluate(makeRequest({ requestId: 'req-1' }));
    adapter.evaluate(makeRequest({ requestId: 'req-2' }));
    adapter.evaluate(makeRequest({ requestId: 'req-3' }));
    const log = adapter.getAuditLog();
    expect(log).toHaveLength(2);
    expect(log[0].requestId).toBe('req-2');
  });

  it('audit entries contain full request and result', () => {
    const adapter = makeAdapter();
    adapter.evaluate(makeRequest({ requestId: 'audit-test' }));
    const entry = adapter.getAuditLog()[0];
    expect(entry.requestId).toBe('audit-test');
    expect(entry.request).toBeDefined();
    expect(entry.pipelineResult).toBeDefined();
    expect(entry.channel).toBe('vscode');
  });
});

// ─── Health Check ────────────────────────────────────────────────────

describe('VSCodeGovernanceAdapter: healthCheck', () => {
  it('returns healthy status', () => {
    const adapter = makeAdapter();
    const health = adapter.healthCheck();
    expect(health.status).toBe('healthy');
    expect(health.channel).toBe('vscode');
    expect(health.guardsLoaded).toBe(3);
    expect(health.version).toBe('1.0.0');
  });
});

// ─── Phase Advancement ───────────────────────────────────────────────

describe('VSCodeGovernanceAdapter: advancePhase', () => {
  it('allows forward advancement by one phase', () => {
    const adapter = makeAdapter({ phase: 'INTAKE' });
    const result = adapter.advancePhase({
      requestId: 'adv-1',
      channel: 'vscode',
      currentPhase: 'INTAKE',
      targetPhase: 'DESIGN',
      role: 'BUILDER',
      justification: 'Requirements gathered',
    });
    expect(result.allowed).toBe(true);
    expect(adapter.phase).toBe('DESIGN');
  });

  it('blocks backward movement', () => {
    const adapter = makeAdapter({ phase: 'BUILD' });
    const result = adapter.advancePhase({
      requestId: 'adv-2',
      channel: 'vscode',
      currentPhase: 'BUILD',
      targetPhase: 'INTAKE',
      role: 'BUILDER',
      justification: 'Want to go back',
    });
    expect(result.allowed).toBe(false);
    expect(adapter.phase).toBe('BUILD'); // unchanged
  });

  it('blocks skipping phases in strict mode', () => {
    const adapter = makeAdapter({ phase: 'INTAKE', strictMode: true });
    const result = adapter.advancePhase({
      requestId: 'adv-3',
      channel: 'vscode',
      currentPhase: 'INTAKE',
      targetPhase: 'BUILD',
      role: 'BUILDER',
      justification: 'Skip design',
    });
    expect(result.allowed).toBe(false);
    expect(adapter.phase).toBe('INTAKE'); // unchanged
  });

  it('allows skipping phases in non-strict mode', () => {
    const adapter = makeAdapter({ phase: 'INTAKE', strictMode: false });
    const result = adapter.advancePhase({
      requestId: 'adv-4',
      channel: 'vscode',
      currentPhase: 'INTAKE',
      targetPhase: 'BUILD',
      role: 'BUILDER',
      justification: 'Fast track',
    });
    expect(result.allowed).toBe(true);
    expect(adapter.phase).toBe('BUILD');
  });
});

// ─── System Prompt Generation ────────────────────────────────────────

describe('VSCodeGovernanceAdapter: generateSystemPrompt', () => {
  it('includes current phase, role, risk', () => {
    const adapter = makeAdapter({ phase: 'BUILD', role: 'BUILDER', riskLevel: 'R2' });
    const prompt = adapter.generateSystemPrompt();
    expect(prompt).toContain('Phase: BUILD');
    expect(prompt).toContain('Role: BUILDER');
    expect(prompt).toContain('Risk Level: R2');
  });

  it('includes allowed actions for phase+role', () => {
    const adapter = makeAdapter({ phase: 'BUILD', role: 'BUILDER' });
    const prompt = adapter.generateSystemPrompt();
    expect(prompt).toContain('write code');
    expect(prompt).toContain('run tests');
  });

  it('includes max risk for phase', () => {
    const adapter = makeAdapter({ phase: 'DESIGN' });
    const prompt = adapter.generateSystemPrompt();
    expect(prompt).toContain('MAX RISK FOR DESIGN: R2');
  });

  it('shows warning when risk exceeds max', () => {
    const adapter = makeAdapter({ phase: 'INTAKE', riskLevel: 'R3' });
    const prompt = adapter.generateSystemPrompt();
    expect(prompt).toContain('EXCEEDS MAX');
  });

  it('includes governance toolkit header', () => {
    const adapter = makeAdapter();
    const prompt = adapter.generateSystemPrompt();
    expect(prompt).toContain('[CVF GOVERNANCE TOOLKIT — ACTIVE]');
  });

  it('includes mandatory rules', () => {
    const adapter = makeAdapter();
    const prompt = adapter.generateSystemPrompt();
    expect(prompt).toContain('MANDATORY RULES');
    expect(prompt).toContain('REFUSE any request outside scope');
  });

  it('includes refusal template with current role and phase', () => {
    const adapter = makeAdapter({ phase: 'REVIEW', role: 'REVIEWER' });
    const prompt = adapter.generateSystemPrompt();
    expect(prompt).toContain('role REVIEWER in phase REVIEW');
  });
});

// ─── Pipeline Result Structure ───────────────────────────────────────

describe('VSCodeGovernanceAdapter: pipeline result structure', () => {
  it('has all required fields', () => {
    const adapter = makeAdapter();
    const result = adapter.evaluate(makeRequest());
    expect(result.requestId).toBeDefined();
    expect(result.channel).toBe('vscode');
    expect(result.finalDecision).toBeDefined();
    expect(result.results).toBeInstanceOf(Array);
    expect(result.executedAt).toBeDefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('contains 3 guard results', () => {
    const adapter = makeAdapter();
    const result = adapter.evaluate(makeRequest());
    expect(result.results).toHaveLength(3);
    const guardIds = result.results.map(r => r.guardId);
    expect(guardIds).toContain('phase-gate');
    expect(guardIds).toContain('risk-gate');
    expect(guardIds).toContain('authority-gate');
  });

  it('agentGuidance present on ALLOW', () => {
    const adapter = makeAdapter();
    const result = adapter.evaluate(makeRequest());
    expect(result.agentGuidance).toContain('All guards passed');
  });

  it('agentGuidance explains blocking reason', () => {
    const adapter = makeAdapter({ phase: 'INTAKE' });
    const result = adapter.evaluate(makeRequest({ phase: 'BUILD' }));
    expect(result.agentGuidance).toContain('phase-gate');
  });
});

// ─── Constants ───────────────────────────────────────────────────────

describe('PHASE_ROLE_ALLOWED_ACTIONS', () => {
  it('covers all 5 phases', () => {
    const phases: CVFCanonicalPhase[] = ['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE'];
    for (const phase of phases) {
      expect(PHASE_ROLE_ALLOWED_ACTIONS[phase]).toBeDefined();
    }
  });

  it('BUILD+BUILDER includes write code', () => {
    expect(PHASE_ROLE_ALLOWED_ACTIONS.BUILD.BUILDER).toContain('write code');
  });

  it('FREEZE roles are read-only except GOVERNOR', () => {
    const freezeActions = PHASE_ROLE_ALLOWED_ACTIONS.FREEZE;
    expect(freezeActions.OBSERVER).toEqual(['read only']);
    expect(freezeActions.BUILDER).toEqual(['read only']);
    expect(freezeActions.GOVERNOR).toContain('unlock if needed');
  });
});

describe('PHASE_MAX_RISK', () => {
  it('has correct risk limits', () => {
    expect(PHASE_MAX_RISK.INTAKE).toBe('R1');
    expect(PHASE_MAX_RISK.DESIGN).toBe('R2');
    expect(PHASE_MAX_RISK.BUILD).toBe('R3');
    expect(PHASE_MAX_RISK.REVIEW).toBe('R3');
    expect(PHASE_MAX_RISK.FREEZE).toBe('R4');
  });
});
