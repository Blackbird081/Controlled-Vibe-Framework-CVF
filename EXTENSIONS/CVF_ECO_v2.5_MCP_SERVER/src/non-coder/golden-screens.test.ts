/**
 * Tests for 5 Golden Screens
 */

import { describe, it, expect } from 'vitest';
import {
  generateVibeBoxScreen,
  generateIntentionMapScreen,
  generateLiveDashboardScreen,
  generateHITLScreen,
  generateAuditLedgerScreen,
} from './golden-screens.js';
import { parseVibe } from '../vibe-translator/vibe-parser.js';
import { generateClarifications } from '../vibe-translator/clarification-engine.js';
import { generateConfirmationCard } from '../vibe-translator/confirmation-card.js';
import type { SessionSnapshot } from '../memory/session-memory.js';
import type { GuardPipelineResult, GuardAuditEntry } from '../guards/types.js';

function makeSnapshot(overrides?: Partial<SessionSnapshot>): SessionSnapshot {
  return {
    sessionId: 'test',
    currentPhase: 'BUILD',
    currentRisk: 'R1',
    mutationCount: 3,
    totalDecisions: 5,
    blockedCount: 1,
    escalatedCount: 1,
    allowedCount: 3,
    entryCount: 10,
    createdAt: new Date(Date.now() - 60000).toISOString(),
    lastActivityAt: new Date().toISOString(),
    phaseHistory: [{ phase: 'DISCOVERY', timestamp: new Date().toISOString() }],
    ...overrides,
  };
}

function makePipelineResult(overrides?: Partial<GuardPipelineResult>): GuardPipelineResult {
  return {
    requestId: 'test-001',
    finalDecision: 'ALLOW',
    results: [],
    executedAt: new Date().toISOString(),
    durationMs: 5,
    ...overrides,
  };
}

describe('Screen 1: Vibe Box', () => {
  it('generates default screen', () => {
    const screen = generateVibeBoxScreen();
    expect(screen.type).toBe('vibe_box');
    expect(screen.placeholder).toBeDefined();
    expect(screen.placeholderVi).toBeDefined();
    expect(screen.voiceEnabled).toBe(true);
  });

  it('has phase-specific prompts', () => {
    const discovery = generateVibeBoxScreen([], 'DISCOVERY');
    const build = generateVibeBoxScreen([], 'BUILD');
    expect(discovery.suggestedPrompts).not.toEqual(build.suggestedPrompts);
  });

  it('includes recent vibes', () => {
    const screen = generateVibeBoxScreen(['vibe 1', 'vibe 2'], 'BUILD');
    expect(screen.recentVibes).toHaveLength(2);
  });

  it('caps recent vibes at 5', () => {
    const screen = generateVibeBoxScreen(['1', '2', '3', '4', '5', '6', '7']);
    expect(screen.recentVibes).toHaveLength(5);
  });

  it('shows current phase hint', () => {
    const screen = generateVibeBoxScreen([], 'DESIGN');
    expect(screen.currentPhaseHint).toContain('DESIGN');
  });
});

describe('Screen 2: Intention Map', () => {
  function makeMap(input: string) {
    const parsed = parseVibe(input);
    const clar = generateClarifications(parsed);
    const card = generateConfirmationCard(parsed, clar);
    return generateIntentionMapScreen(parsed, clar, card);
  }

  it('generates intention map for create', () => {
    const map = makeMap('Create a landing page');
    expect(map.type).toBe('intention_map');
    expect(map.rootGoal).toContain('landing page');
    expect(map.nodes.length).toBeGreaterThan(0);
  });

  it('has goal node with step children', () => {
    const map = makeMap('Create a page');
    const goal = map.nodes.find((n) => n.type === 'goal');
    expect(goal).toBeDefined();
    expect(goal!.children.length).toBeGreaterThan(0);
    expect(goal!.children[0].type).toBe('step');
  });

  it('includes auto-guardrails', () => {
    const map = makeMap('Create a page');
    expect(map.autoGuardrails.length).toBeGreaterThanOrEqual(2);
    expect(map.autoGuardrails.some((g) => g.includes('Audit'))).toBe(true);
  });

  it('adds risk guardrail for deploy', () => {
    const map = makeMap('Deploy to production');
    expect(map.autoGuardrails.some((g) => g.includes('Deployment'))).toBe(true);
  });

  it('adds deletion guardrail for delete', () => {
    const map = makeMap('Delete old files');
    expect(map.autoGuardrails.some((g) => g.includes('Deletion'))).toBe(true);
  });

  it('tracks confidence', () => {
    const map = makeMap('Create a React dashboard');
    expect(map.confidence).toBeGreaterThan(0);
  });
});

describe('Screen 3: Live Dashboard', () => {
  it('generates dashboard from snapshot', () => {
    const dash = generateLiveDashboardScreen(makeSnapshot(), 2, 4);
    expect(dash.type).toBe('live_dashboard');
    expect(dash.currentStep).toBe(2);
    expect(dash.totalSteps).toBe(4);
    expect(dash.progress).toBe(50);
  });

  it('calculates mutation budget', () => {
    const dash = generateLiveDashboardScreen(makeSnapshot({ mutationCount: 5, currentRisk: 'R1' }));
    expect(dash.mutationBudget.used).toBe(5);
    expect(dash.mutationBudget.max).toBe(10);
    expect(dash.mutationBudget.percentage).toBe(50);
  });

  it('shows risk label', () => {
    const dash = generateLiveDashboardScreen(makeSnapshot({ currentRisk: 'R2' }));
    expect(dash.riskLabel).toContain('Elevated');
  });

  it('shows paused status', () => {
    const dash = generateLiveDashboardScreen(makeSnapshot(), 1, 4, true);
    expect(dash.isPaused).toBe(true);
    expect(dash.canPause).toBe(false);
    expect(dash.statusMessage).toContain('Paused');
    expect(dash.statusMessageVi).toContain('Tạm dừng');
  });

  it('shows budget exhausted', () => {
    const dash = generateLiveDashboardScreen(makeSnapshot({ mutationCount: 15, currentRisk: 'R2' }));
    expect(dash.mutationBudget.percentage).toBe(100);
    expect(dash.statusMessage).toContain('Budget exhausted');
  });

  it('caps budget percentage at 100', () => {
    const dash = generateLiveDashboardScreen(makeSnapshot({ mutationCount: 20, currentRisk: 'R2' }));
    expect(dash.mutationBudget.percentage).toBe(100);
  });
});

describe('Screen 4: Human-in-the-Loop', () => {
  it('generates empty screen for ALLOW result', () => {
    const screen = generateHITLScreen(makePipelineResult());
    expect(screen.type).toBe('hitl');
    expect(screen.notifications).toHaveLength(0);
    expect(screen.pendingCount).toBe(0);
  });

  it('generates notification for BLOCK', () => {
    const screen = generateHITLScreen(makePipelineResult({
      finalDecision: 'BLOCK',
      results: [{
        guardId: 'risk_gate',
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: 'R3 blocked for AI',
        timestamp: new Date().toISOString(),
      }],
    }));
    expect(screen.notifications).toHaveLength(1);
    expect(screen.notifications[0].severity).toBe('critical');
    expect(screen.criticalCount).toBe(1);
  });

  it('generates notification for ESCALATE', () => {
    const screen = generateHITLScreen(makePipelineResult({
      finalDecision: 'ESCALATE',
      results: [{
        guardId: 'authority_gate',
        decision: 'ESCALATE',
        severity: 'WARN',
        reason: 'Needs approval',
        timestamp: new Date().toISOString(),
      }],
    }));
    expect(screen.notifications).toHaveLength(1);
    expect(screen.notifications[0].severity).toBe('warning');
    expect(screen.notifications[0].actions.length).toBe(3);
  });

  it('BLOCK notification has override/cancel actions', () => {
    const screen = generateHITLScreen(makePipelineResult({
      results: [{
        guardId: 'phase_gate',
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: 'Wrong phase',
        timestamp: new Date().toISOString(),
      }],
    }));
    const notif = screen.notifications[0];
    expect(notif.actions.some((a) => a.action === 'override')).toBe(true);
    expect(notif.actions.some((a) => a.action === 'cancel')).toBe(true);
  });

  it('maps guard IDs to notification types', () => {
    const guards = ['risk_gate', 'mutation_budget', 'scope_guard'];
    for (const guardId of guards) {
      const screen = generateHITLScreen(makePipelineResult({
        results: [{
          guardId,
          decision: 'BLOCK',
          severity: 'ERROR',
          reason: 'test',
          timestamp: new Date().toISOString(),
        }],
      }));
      expect(screen.notifications[0].type).toBeDefined();
    }
  });

  it('has bilingual titles', () => {
    const screen = generateHITLScreen(makePipelineResult({
      results: [{
        guardId: 'risk_gate',
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: 'blocked',
        timestamp: new Date().toISOString(),
      }],
    }));
    expect(screen.notifications[0].title).toBeDefined();
    expect(screen.notifications[0].titleVi).toBeDefined();
  });
});

describe('Screen 5: Audit Ledger', () => {
  function makeAuditEntry(action: string, decision: string): GuardAuditEntry {
    return {
      requestId: `req-${Date.now()}`,
      timestamp: new Date().toISOString(),
      context: { requestId: 'r', phase: 'BUILD', riskLevel: 'R0', role: 'HUMAN', action },
      pipelineResult: {
        requestId: 'r', finalDecision: decision as any, results: [],
        executedAt: new Date().toISOString(), durationMs: 1,
      },
    };
  }

  it('generates empty ledger', () => {
    const screen = generateAuditLedgerScreen([]);
    expect(screen.type).toBe('audit_ledger');
    expect(screen.entries).toHaveLength(0);
    expect(screen.summary).toContain('No actions');
    expect(screen.summaryVi).toContain('Chưa có');
  });

  it('generates ledger with entries', () => {
    const log = [
      makeAuditEntry('write code', 'ALLOW'),
      makeAuditEntry('deploy', 'BLOCK'),
    ];
    const screen = generateAuditLedgerScreen(log);
    expect(screen.entries).toHaveLength(2);
    expect(screen.allowedCount).toBe(1);
    expect(screen.blockedCount).toBe(1);
    expect(screen.totalActions).toBe(2);
  });

  it('formats entries with human-readable explanations', () => {
    const log = [makeAuditEntry('write code', 'ALLOW')];
    const screen = generateAuditLedgerScreen(log);
    expect(screen.entries[0].explanation).toContain('write code');
    expect(screen.entries[0].explanation).toContain('allowed');
  });

  it('has Vietnamese explanations', () => {
    const log = [makeAuditEntry('deploy', 'BLOCK')];
    const screen = generateAuditLedgerScreen(log);
    expect(screen.entries[0].explanationVi).toContain('chặn');
  });

  it('has bilingual title', () => {
    const screen = generateAuditLedgerScreen([]);
    expect(screen.title).toBeDefined();
    expect(screen.titleVi).toBeDefined();
  });

  it('summary includes counts', () => {
    const log = [
      makeAuditEntry('a', 'ALLOW'),
      makeAuditEntry('b', 'ALLOW'),
      makeAuditEntry('c', 'BLOCK'),
    ];
    const screen = generateAuditLedgerScreen(log);
    expect(screen.summary).toContain('3');
    expect(screen.summary).toContain('2 allowed');
    expect(screen.summary).toContain('1 blocked');
  });
});
