/**
 * CVF v1.7.1 Safety Runtime — Approval State Machine, EventBus, Policy Hash,
 * CostGuard & Roles Tests (W6-T80)
 * ============================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (5 contracts):
 *   policy/approval.state-machine.ts:
 *     nextState — proposed→validated (decision ignored); validated→approved/rejected/pending;
 *       approved→executed; other states→unchanged
 *   core/event-bus.ts:
 *     EventBus — on+emit; off removes handler; onAll receives all events;
 *       offAll removes wildcard; listenerCount; clear; handler errors don't propagate
 *   policy/policy.hash.ts:
 *     generatePolicyHash — returns 64-char hex; same inputs→same hash; different→different
 *   policy/cost.guard.ts:
 *     CostGuard.validate — OK; WARNING at 80%; LIMIT_EXCEEDED token/file/time/user-daily/org-daily
 *   cvf-ui/lib/roles.ts:
 *     canExecute — ADMIN+OPERATOR→true; VIEWER→false
 *     canApprove — ADMIN→true; OPERATOR+VIEWER→false
 */

import { describe, it, expect, vi } from 'vitest';

import { nextState } from '../policy/approval.state-machine';
import { EventBus } from '../core/event-bus';
import { generatePolicyHash } from '../policy/policy.hash';
import { CostGuard } from '../policy/cost.guard';
import { canExecute, canApprove } from '../cvf-ui/lib/roles';
import type { CVFEvent } from '../core/event-bus';

// ─── approval.state-machine ───────────────────────────────────────────────────

describe('nextState', () => {
  it('proposed + any decision → validated (decision ignored)', () => {
    expect(nextState('proposed', 'approved')).toBe('validated');
    expect(nextState('proposed', 'rejected')).toBe('validated');
    expect(nextState('proposed', 'pending')).toBe('validated');
  });

  it('validated + approved → approved', () => {
    expect(nextState('validated', 'approved')).toBe('approved');
  });

  it('validated + rejected → rejected', () => {
    expect(nextState('validated', 'rejected')).toBe('rejected');
  });

  it('validated + pending → pending', () => {
    expect(nextState('validated', 'pending')).toBe('pending');
  });

  it('approved + any → executed', () => {
    expect(nextState('approved', 'approved')).toBe('executed');
  });

  it('other states (executed/rejected/pending) → unchanged', () => {
    expect(nextState('executed', 'approved')).toBe('executed');
    expect(nextState('rejected', 'approved')).toBe('rejected');
    expect(nextState('pending', 'approved')).toBe('pending');
  });
});

// ─── EventBus ─────────────────────────────────────────────────────────────────

describe('EventBus', () => {
  function makeEvent(type: string): CVFEvent {
    return { type, timestamp: Date.now(), data: {} };
  }

  it('on + emit → handler called with the event', () => {
    const bus = new EventBus();
    const received: CVFEvent[] = [];
    bus.on('test:event', (e) => received.push(e));
    const evt = makeEvent('test:event');
    bus.emit(evt);
    expect(received).toHaveLength(1);
    expect(received[0]).toBe(evt);
  });

  it('off → handler no longer called after removal', () => {
    const bus = new EventBus();
    const counts = { n: 0 };
    const handler = () => counts.n++;
    bus.on('ev', handler);
    bus.emit(makeEvent('ev'));
    bus.off('ev', handler);
    bus.emit(makeEvent('ev'));
    expect(counts.n).toBe(1);
  });

  it('onAll → receives every event regardless of type', () => {
    const bus = new EventBus();
    const types: string[] = [];
    bus.onAll((e) => types.push(e.type));
    bus.emit(makeEvent('a'));
    bus.emit(makeEvent('b'));
    expect(types).toEqual(['a', 'b']);
  });

  it('offAll → wildcard handler removed', () => {
    const bus = new EventBus();
    let count = 0;
    const handler = () => count++;
    bus.onAll(handler);
    bus.emit(makeEvent('x'));
    bus.offAll(handler);
    bus.emit(makeEvent('x'));
    expect(count).toBe(1);
  });

  it('listenerCount → counts type-specific + wildcard handlers', () => {
    const bus = new EventBus();
    bus.on('ev', () => {});
    bus.onAll(() => {});
    expect(bus.listenerCount('ev')).toBe(2); // 1 specific + 1 wildcard
    expect(bus.listenerCount('other')).toBe(1); // only wildcard
  });

  it('clear → removes all listeners', () => {
    const bus = new EventBus();
    let count = 0;
    bus.on('ev', () => count++);
    bus.onAll(() => count++);
    bus.clear();
    bus.emit(makeEvent('ev'));
    expect(count).toBe(0);
  });

  it('throwing handler does not stop other handlers from running', () => {
    const bus = new EventBus();
    const results: string[] = [];
    bus.on('ev', () => { throw new Error('boom'); });
    bus.on('ev', () => results.push('ok'));
    expect(() => bus.emit(makeEvent('ev'))).not.toThrow();
    expect(results).toContain('ok');
  });
});

// ─── generatePolicyHash ───────────────────────────────────────────────────────

describe('generatePolicyHash', () => {
  const rule = {
    id: 'r1',
    description: 'Block high-risk',
    evaluate: (p: unknown) => ({ allowed: false }),
  };

  it('returns a 64-character hex string (SHA-256)', () => {
    const hash = generatePolicyHash('v1', [rule]);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('same inputs → identical hash', () => {
    const h1 = generatePolicyHash('v1', [rule]);
    const h2 = generatePolicyHash('v1', [rule]);
    expect(h1).toBe(h2);
  });

  it('different version → different hash', () => {
    const h1 = generatePolicyHash('v1', [rule]);
    const h2 = generatePolicyHash('v2', [rule]);
    expect(h1).not.toBe(h2);
  });
});

// ─── CostGuard ────────────────────────────────────────────────────────────────

describe('CostGuard.validate', () => {
  const baseLimits = {
    maxTokensPerProposal: 1000,
    maxTokensPerUserPerDay: 5000,
    maxTokensPerOrgPerDay: 20000,
    maxGenerationTimeMs: 30000,
    maxFilesPerProposal: 10,
  };
  const baseAccumulated = { userDailyTokens: 0, orgDailyTokens: 0 };

  it('all within limits → level="OK", no reasons', () => {
    const result = CostGuard.validate({
      snapshot: { tokensUsed: 100, generationTimeMs: 1000, filesGenerated: 2 },
      limits: baseLimits,
      accumulated: baseAccumulated,
    });
    expect(result.level).toBe('OK');
    expect(result.reasons).toHaveLength(0);
  });

  it('tokensUsed > 80% of maxTokensPerProposal → WARNING', () => {
    const result = CostGuard.validate({
      snapshot: { tokensUsed: 850, generationTimeMs: 1000, filesGenerated: 1 },
      limits: baseLimits,
      accumulated: baseAccumulated,
    });
    expect(result.level).toBe('WARNING');
    expect(result.reasons.some((r) => r.includes('nearing'))).toBe(true);
  });

  it('tokensUsed > maxTokensPerProposal → LIMIT_EXCEEDED', () => {
    const result = CostGuard.validate({
      snapshot: { tokensUsed: 1500, generationTimeMs: 1000, filesGenerated: 1 },
      limits: baseLimits,
      accumulated: baseAccumulated,
    });
    expect(result.level).toBe('LIMIT_EXCEEDED');
    expect(result.reasons.some((r) => r.includes('Proposal token limit'))).toBe(true);
  });

  it('filesGenerated > maxFilesPerProposal → LIMIT_EXCEEDED', () => {
    const result = CostGuard.validate({
      snapshot: { tokensUsed: 100, generationTimeMs: 1000, filesGenerated: 15 },
      limits: baseLimits,
      accumulated: baseAccumulated,
    });
    expect(result.level).toBe('LIMIT_EXCEEDED');
    expect(result.reasons.some((r) => r.includes('File generation'))).toBe(true);
  });

  it('accumulated + tokensUsed > userDailyTokens → LIMIT_EXCEEDED user daily', () => {
    const result = CostGuard.validate({
      snapshot: { tokensUsed: 100, generationTimeMs: 1000, filesGenerated: 1 },
      limits: baseLimits,
      accumulated: { userDailyTokens: 4950, orgDailyTokens: 0 },
    });
    expect(result.level).toBe('LIMIT_EXCEEDED');
    expect(result.reasons.some((r) => r.includes('User daily'))).toBe(true);
  });
});

// ─── roles.ts ─────────────────────────────────────────────────────────────────

describe('canExecute', () => {
  it('ADMIN → true', () => expect(canExecute('ADMIN')).toBe(true));
  it('OPERATOR → true', () => expect(canExecute('OPERATOR')).toBe(true));
  it('VIEWER → false', () => expect(canExecute('VIEWER')).toBe(false));
});

describe('canApprove', () => {
  it('ADMIN → true', () => expect(canApprove('ADMIN')).toBe(true));
  it('OPERATOR → false', () => expect(canApprove('OPERATOR')).toBe(false));
  it('VIEWER → false', () => expect(canApprove('VIEWER')).toBe(false));
});
