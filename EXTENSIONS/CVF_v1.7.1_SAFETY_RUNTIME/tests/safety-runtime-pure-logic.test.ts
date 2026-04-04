/**
 * CVF v1.7.1 Safety Runtime — Pure-Logic Dedicated Tests (W6-T55)
 * ================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (6 pure-logic contracts, zero external I/O):
 *   skills/dev-automation/risk.scorer.ts:
 *     scoreRisk — keyword/length/role/devMode breakdown, additive totals
 *   cvf-ui/pricing/pricing.registry.ts:
 *     calculateUsdCost — per-model rate math, unknown model throws
 *   simulation/sandbox.mode.ts:
 *     enableSandbox / disableSandbox / isSandbox — flag lifecycle
 *   adapters/openclaw/response.formatter.ts:
 *     formatResponse — approved/pending/rejected/unknown branches
 *   adapters/openclaw/proposal.builder.ts:
 *     buildProposal — confidence→riskLevel tiers, envelope fields
 *   ai/provider.policy.ts:
 *     setProviderPolicy / enforceProviderPolicy — token/temp/keyword guards
 */

import { beforeEach, describe, it, expect } from 'vitest';

import { scoreRisk } from '../skills/dev-automation/risk.scorer';
import { calculateUsdCost } from '../cvf-ui/pricing/pricing.registry';
import { enableSandbox, disableSandbox, isSandbox } from '../simulation/sandbox.mode';
import { formatResponse } from '../adapters/openclaw/response.formatter';
import { buildProposal } from '../adapters/openclaw/proposal.builder';
import { setProviderPolicy, enforceProviderPolicy } from '../ai/provider.policy';

// ─── scoreRisk ────────────────────────────────────────────────────────────────

describe('scoreRisk', () => {
  it('clean short input with ADMIN role → totalScore=0', () => {
    const result = scoreRisk({ instruction: 'show logs', role: 'ADMIN' });
    expect(result.totalScore).toBe(0);
    expect(result.breakdown).toEqual({
      keywordRisk: 0,
      lengthRisk: 0,
      roleRisk: 0,
      devAutomationRisk: 0,
    });
  });

  it('HIGH keyword "delete" adds 40 to keywordRisk', () => {
    const result = scoreRisk({ instruction: 'delete all records', role: 'ADMIN' });
    expect(result.breakdown.keywordRisk).toBe(40);
  });

  it('MEDIUM keyword "deploy" adds 20 to keywordRisk', () => {
    const result = scoreRisk({ instruction: 'deploy to production', role: 'ADMIN' });
    expect(result.breakdown.keywordRisk).toBe(20);
  });

  it('devMode=true adds 15 devAutomationRisk', () => {
    const result = scoreRisk({ instruction: 'run task', role: 'ADMIN', devMode: true });
    expect(result.breakdown.devAutomationRisk).toBe(15);
    expect(result.totalScore).toBe(15);
  });

  it('instruction >2000 chars → lengthRisk=20', () => {
    const result = scoreRisk({ instruction: 'x'.repeat(2001), role: 'ADMIN' });
    expect(result.breakdown.lengthRisk).toBe(20);
  });

  it('instruction >1000 chars (≤2000) → lengthRisk=10', () => {
    const result = scoreRisk({ instruction: 'x'.repeat(1001), role: 'ADMIN' });
    expect(result.breakdown.lengthRisk).toBe(10);
  });

  it('OPERATOR role → roleRisk=5', () => {
    const result = scoreRisk({ instruction: 'ping', role: 'OPERATOR' });
    expect(result.breakdown.roleRisk).toBe(5);
  });

  it('VIEWER role → roleRisk=15', () => {
    const result = scoreRisk({ instruction: 'ping', role: 'VIEWER' });
    expect(result.breakdown.roleRisk).toBe(15);
  });

  it('unknown role → roleRisk=20', () => {
    const result = scoreRisk({ instruction: 'ping', role: 'UNKNOWN_ROLE' });
    expect(result.breakdown.roleRisk).toBe(20);
  });

  it('combined: HIGH keyword + devMode + VIEWER → keywordRisk=40, devRisk=15, roleRisk=15, total=70', () => {
    const result = scoreRisk({
      instruction: 'delete everything',
      role: 'VIEWER',
      devMode: true,
    });
    expect(result.breakdown.keywordRisk).toBe(40);
    expect(result.breakdown.roleRisk).toBe(15);
    expect(result.breakdown.devAutomationRisk).toBe(15);
    expect(result.totalScore).toBe(70);
  });
});

// ─── calculateUsdCost ─────────────────────────────────────────────────────────

describe('calculateUsdCost', () => {
  it('gpt-4o: 1k input + 1k output → $0.005 + $0.015 = $0.020', () => {
    const cost = calculateUsdCost('gpt-4o', 1000, 1000);
    expect(cost).toBeCloseTo(0.02, 5);
  });

  it('claude-3-opus: 2k input + 500 output → $0.030 + $0.0375 = $0.0675', () => {
    const cost = calculateUsdCost('claude-3-opus', 2000, 500);
    expect(cost).toBeCloseTo(0.0675, 5);
  });

  it('unknown model → throws "Unknown model pricing"', () => {
    expect(() => calculateUsdCost('gpt-99-ultra', 100, 100)).toThrow(
      'Unknown model pricing'
    );
  });
});

// ─── sandbox.mode ─────────────────────────────────────────────────────────────

describe('sandbox.mode', () => {
  it('isSandbox() returns false by default', () => {
    // Vitest gives each test file a fresh module instance
    expect(isSandbox()).toBe(false);
  });

  it('enableSandbox() → isSandbox() returns true', () => {
    enableSandbox();
    expect(isSandbox()).toBe(true);
  });

  it('disableSandbox() → isSandbox() returns false', () => {
    disableSandbox();
    expect(isSandbox()).toBe(false);
  });
});

// ─── formatResponse ───────────────────────────────────────────────────────────

describe('formatResponse', () => {
  it('approved status includes execution ID', () => {
    const msg = formatResponse({ status: 'approved', executionId: 'exec-abc' });
    expect(msg).toBe('Approved. Execution ID: exec-abc');
  });

  it('pending status → "Pending approval."', () => {
    const msg = formatResponse({ status: 'pending' });
    expect(msg).toBe('Pending approval.');
  });

  it('rejected status includes reason', () => {
    const msg = formatResponse({ status: 'rejected', reason: 'risk too high' });
    expect(msg).toBe('Rejected: risk too high');
  });

  it('unknown status → "Unknown status."', () => {
    const msg = formatResponse({ status: 'unknown' as 'approved' });
    expect(msg).toBe('Unknown status.');
  });
});

// ─── buildProposal ────────────────────────────────────────────────────────────

describe('buildProposal', () => {
  it('confidence=0.9 (>0.8) → riskLevel="low"', () => {
    const proposal = buildProposal({ action: 'read', confidence: 0.9, parameters: {} });
    expect(proposal.riskLevel).toBe('low');
  });

  it('confidence=0.8 (not >0.8) → riskLevel="medium"', () => {
    const proposal = buildProposal({ action: 'read', confidence: 0.8, parameters: {} });
    expect(proposal.riskLevel).toBe('medium');
  });

  it('confidence=0.6 (>0.5) → riskLevel="medium"', () => {
    const proposal = buildProposal({ action: 'read', confidence: 0.6, parameters: {} });
    expect(proposal.riskLevel).toBe('medium');
  });

  it('confidence=0.5 (not >0.5) → riskLevel="high"', () => {
    const proposal = buildProposal({ action: 'read', confidence: 0.5, parameters: {} });
    expect(proposal.riskLevel).toBe('high');
  });

  it('proposal envelope has source, action, payload, createdAt, confidence fields', () => {
    const intent = { action: 'create_task', confidence: 0.75, parameters: { key: 'val' } };
    const proposal = buildProposal(intent);
    expect(proposal.source).toBe('openclaw');
    expect(proposal.action).toBe('create_task');
    expect(proposal.payload).toEqual({ key: 'val' });
    expect(typeof proposal.createdAt).toBe('number');
    expect(proposal.confidence).toBe(0.75);
    expect(typeof proposal.id).toBe('string');
    expect(proposal.id.length).toBeGreaterThan(0);
  });
});

// ─── provider.policy ──────────────────────────────────────────────────────────

describe('enforceProviderPolicy', () => {
  beforeEach(() => {
    // Reset policy to empty before each test
    setProviderPolicy({});
  });

  it('maxTokens exceeded → throws "Token limit exceeds provider policy"', () => {
    setProviderPolicy({ maxTokens: 100 });
    expect(() =>
      enforceProviderPolicy({ userPrompt: 'hi', maxTokens: 200 })
    ).toThrow('Token limit exceeds provider policy');
  });

  it('maxTokens within limit → no throw', () => {
    setProviderPolicy({ maxTokens: 100 });
    expect(() =>
      enforceProviderPolicy({ userPrompt: 'hi', maxTokens: 50 })
    ).not.toThrow();
  });

  it('allowTemperature=false + temperature set → throws "Temperature override not allowed"', () => {
    setProviderPolicy({ allowTemperature: false });
    expect(() =>
      enforceProviderPolicy({ userPrompt: 'hi', temperature: 0.5 })
    ).toThrow('Temperature override not allowed');
  });

  it('allowTemperature=false + no temperature → no throw', () => {
    setProviderPolicy({ allowTemperature: false });
    expect(() => enforceProviderPolicy({ userPrompt: 'hi' })).not.toThrow();
  });

  it('blocked keyword in prompt → throws with keyword name', () => {
    setProviderPolicy({ blockedKeywords: ['secret', 'exploit'] });
    expect(() =>
      enforceProviderPolicy({ userPrompt: 'expose the secret key' })
    ).toThrow('secret');
  });

  it('prompt with no blocked keywords → no throw', () => {
    setProviderPolicy({ blockedKeywords: ['secret', 'exploit'] });
    expect(() =>
      enforceProviderPolicy({ userPrompt: 'run the daily report' })
    ).not.toThrow();
  });
});
