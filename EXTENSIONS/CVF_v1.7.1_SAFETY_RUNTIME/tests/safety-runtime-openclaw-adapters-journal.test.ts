/**
 * CVF v1.7.1 Safety Runtime — OpenClaw Adapters & Execution Journal Tests (W6-T72)
 * ==================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (6 contracts):
 *   adapters/openclaw/provider.registry.ts:
 *     registerProvider / getProvider — registered returns provider; unknown throws
 *   adapters/openclaw/response.formatter.ts:
 *     formatResponse — approved/pending/rejected/default
 *   adapters/openclaw/proposal.builder.ts:
 *     buildProposal — confidence>0.8→low; 0.5–0.8→medium; <0.5→high; fields present
 *   adapters/openclaw/intent.parser.ts:
 *     parseIntent — mock provider returns valid JSON; provider throws→fallback;
 *       Vietnamese "tạo nhân sự"→create_hr_module; generic→unknown
 *   adapters/openclaw/safety.guard.ts:
 *     guardProposal — clean→allowed; low-confidence→escalate-high; blocked-action→denied;
 *       token-budget-exceeded→denied; guardBudget within/exceeded/unregistered;
 *       registerProviderBudget / registerTokenUsage / resetTokenUsage
 *   policy/execution.journal.ts:
 *     recordExecution / getJournal / _clearJournal
 */

import { beforeEach, describe, it, expect } from 'vitest';

import { registerProvider, getProvider } from '../adapters/openclaw/provider.registry';
import { formatResponse } from '../adapters/openclaw/response.formatter';
import { buildProposal } from '../adapters/openclaw/proposal.builder';
import { parseIntent } from '../adapters/openclaw/intent.parser';
import {
  guardProposal,
  guardBudget,
  registerProviderBudget,
  registerTokenUsage,
  resetTokenUsage,
} from '../adapters/openclaw/safety.guard';
import { recordExecution, getJournal, _clearJournal } from '../policy/execution.journal';
import type { CVFExecutionResult, CVFProposalEnvelope } from '../adapters/openclaw/types/contract.types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeEnvelope(
  action: string,
  confidence: number,
): CVFProposalEnvelope {
  return {
    id: 'test-id',
    source: 'openclaw',
    action,
    payload: {},
    createdAt: Date.now(),
    confidence,
    riskLevel: confidence > 0.8 ? 'low' : confidence > 0.5 ? 'medium' : 'high',
  };
}

// ─── provider.registry ───────────────────────────────────────────────────────

describe('provider.registry', () => {
  it('registerProvider + getProvider returns the registered adapter', () => {
    const adapter = {
      name: 'mock-provider',
      sendMessage: async () => ({ content: 'ok' }),
    };
    registerProvider(adapter);
    expect(getProvider('mock-provider')).toBe(adapter);
  });

  it('getProvider for unknown name → throws', () => {
    expect(() => getProvider('no-such-provider')).toThrow('no-such-provider');
  });

  it('registering a second provider stores it separately', () => {
    const adapterB = { name: 'mock-b', sendMessage: async () => ({ content: 'b' }) };
    registerProvider(adapterB);
    expect(getProvider('mock-b')).toBe(adapterB);
  });
});

// ─── response.formatter ──────────────────────────────────────────────────────

describe('response.formatter — formatResponse', () => {
  it('approved status → includes "Approved" and executionId', () => {
    const result: CVFExecutionResult = { status: 'approved', executionId: 'exec-123' };
    expect(formatResponse(result)).toContain('Approved');
    expect(formatResponse(result)).toContain('exec-123');
  });

  it('pending status → "Pending approval."', () => {
    expect(formatResponse({ status: 'pending' })).toBe('Pending approval.');
  });

  it('rejected status → includes "Rejected" and reason', () => {
    const result: CVFExecutionResult = { status: 'rejected', reason: 'policy violation' };
    expect(formatResponse(result)).toContain('Rejected');
    expect(formatResponse(result)).toContain('policy violation');
  });

  it('unknown status (cast) → "Unknown status."', () => {
    expect(formatResponse({ status: 'unknown' as any })).toBe('Unknown status.');
  });
});

// ─── proposal.builder ────────────────────────────────────────────────────────

describe('proposal.builder — buildProposal', () => {
  it('confidence > 0.8 → riskLevel = "low"', () => {
    const p = buildProposal({ action: 'deploy', confidence: 0.9, parameters: {} });
    expect(p.riskLevel).toBe('low');
  });

  it('confidence 0.5–0.8 → riskLevel = "medium"', () => {
    const p = buildProposal({ action: 'deploy', confidence: 0.6, parameters: {} });
    expect(p.riskLevel).toBe('medium');
  });

  it('confidence < 0.5 → riskLevel = "high"; required fields present', () => {
    const p = buildProposal({ action: 'deploy', confidence: 0.3, parameters: { key: 'val' } });
    expect(p.riskLevel).toBe('high');
    expect(p.source).toBe('openclaw');
    expect(typeof p.id).toBe('string');
    expect(p.id.length).toBeGreaterThan(0);
    expect(p.payload).toEqual({ key: 'val' });
  });
});

// ─── intent.parser ───────────────────────────────────────────────────────────

describe('intent.parser — parseIntent', () => {
  it('provider returns valid JSON → returns parsed intent', async () => {
    const mockProvider = {
      name: 'mock-json',
      sendMessage: async () => ({
        content: JSON.stringify({ action: 'create_feature', confidence: 0.95, parameters: { name: 'auth' } }),
      }),
    };
    const result = await parseIntent('create auth feature', mockProvider);
    expect(result.action).toBe('create_feature');
    expect(result.confidence).toBe(0.95);
  });

  it('provider throws → deterministicFallback returns action="unknown" for generic input', async () => {
    const mockProvider = {
      name: 'mock-fail',
      sendMessage: async () => { throw new Error('provider down'); },
    };
    const result = await parseIntent('random input', mockProvider);
    expect(result.action).toBe('unknown');
    expect(result.confidence).toBe(0.2);
  });

  it('provider returns invalid JSON → fallback: Vietnamese "tạo nhân sự" → create_hr_module', async () => {
    const mockProvider = {
      name: 'mock-bad-json',
      sendMessage: async () => ({ content: 'not json' }),
    };
    const result = await parseIntent('tạo nhân sự module', mockProvider);
    expect(result.action).toBe('create_hr_module');
    expect(result.confidence).toBe(0.6);
  });

  it('provider returns invalid JSON + generic input → action="unknown"', async () => {
    const mockProvider = {
      name: 'mock-bad-json2',
      sendMessage: async () => ({ content: '!!!' }),
    };
    const result = await parseIntent('do something', mockProvider);
    expect(result.action).toBe('unknown');
  });
});

// ─── safety.guard ────────────────────────────────────────────────────────────

describe('safety.guard', () => {
  beforeEach(() => {
    resetTokenUsage();
  });

  it('clean proposal (high confidence, allowed action) → allowed=true', () => {
    const result = guardProposal(makeEnvelope('deploy', 0.9));
    expect(result.allowed).toBe(true);
  });

  it('confidence < 0.4 → allowed=true with escalatedRisk="high"', () => {
    const result = guardProposal(makeEnvelope('deploy', 0.3));
    expect(result.allowed).toBe(true);
    expect(result.escalatedRisk).toBe('high');
  });

  it('blocked action "delete_database" → allowed=false', () => {
    expect(guardProposal(makeEnvelope('delete_database', 0.9)).allowed).toBe(false);
  });

  it('tokenUsage > maxTokensPerDay → allowed=false', () => {
    registerTokenUsage('test', 100001);
    expect(guardProposal(makeEnvelope('deploy', 0.9)).allowed).toBe(false);
  });

  it('guardBudget: within daily limit → true', () => {
    registerProviderBudget('prov-a', 1000);
    registerTokenUsage('prov-a', 500);
    expect(guardBudget('prov-a')).toBe(true);
  });

  it('guardBudget: exceeds daily limit → false', () => {
    registerProviderBudget('prov-b', 100);
    registerTokenUsage('prov-b', 200);
    expect(guardBudget('prov-b')).toBe(false);
  });

  it('guardBudget: unregistered provider → true (default allow)', () => {
    expect(guardBudget('never-registered')).toBe(true);
  });
});

// ─── execution.journal ───────────────────────────────────────────────────────

describe('execution.journal', () => {
  beforeEach(() => {
    _clearJournal();
  });

  it('getJournal() is empty after _clearJournal', () => {
    expect(getJournal().length).toBe(0);
  });

  it('recordExecution → getJournal has entry with correct fields', () => {
    recordExecution('prop-1', 'v1', 'hash-abc', 'approved');
    const journal = getJournal();
    expect(journal.length).toBe(1);
    expect(journal[0].proposalId).toBe('prop-1');
    expect(journal[0].policyVersion).toBe('v1');
    expect(journal[0].decision).toBe('approved');
    expect(typeof journal[0].timestamp).toBe('number');
  });

  it('multiple recordExecution calls accumulate entries', () => {
    recordExecution('prop-2', 'v1', 'hash-def', 'rejected');
    recordExecution('prop-3', 'v1', 'hash-ghi', 'pending');
    expect(getJournal().length).toBe(2);
  });
});
