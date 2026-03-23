/**
 * CVF v1.7.1 Safety Runtime — State, Journal & Kernel Dedicated Tests (W6-T57)
 * =============================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (5 pure-logic contracts):
 *   core/state.store.ts:
 *     setState / getState (found/undefined) / _clearAllStates
 *   policy/execution.journal.ts:
 *     recordExecution (fields) / getJournal (cumulative) / _clearJournal
 *   kernel-architecture/kernel/04_refusal_router/refusal.authority.policy.ts:
 *     AuthorityPolicy.isAllowed — read allowed, write/execute/network blocked
 *   kernel-architecture/kernel/05_creative_control/creative_permission.policy.ts:
 *     CreativePermissionPolicy.allow — R0/R1 allowed, R2+ blocked;
 *     creative_allowed=false always blocks
 *   kernel-architecture/runtime/session_state.ts:
 *     SessionState — setDomain/getDomain/setRisk/getRisk per-instance isolation
 */

import { beforeAll, describe, it, expect } from 'vitest';

import { setState, getState, _clearAllStates } from '../core/state.store';
import { recordExecution, getJournal, _clearJournal } from '../policy/execution.journal';
import { AuthorityPolicy } from '../kernel-architecture/kernel/04_refusal_router/refusal.authority.policy';
import { CreativePermissionPolicy } from '../kernel-architecture/kernel/05_creative_control/creative_permission.policy';
import { SessionState } from '../kernel-architecture/runtime/session_state';

// ─── state.store ──────────────────────────────────────────────────────────────

describe('state.store', () => {
  beforeAll(() => {
    _clearAllStates();
  });

  it('setState + getState returns the stored state', () => {
    setState('p-001', 'proposed');
    expect(getState('p-001')).toBe('proposed');
  });

  it('getState returns undefined for unknown proposalId', () => {
    expect(getState('p-nonexistent')).toBeUndefined();
  });

  it('setState overwrites existing state for same proposalId', () => {
    setState('p-002', 'pending');
    setState('p-002', 'approved');
    expect(getState('p-002')).toBe('approved');
  });

  it('_clearAllStates removes all stored states', () => {
    setState('p-003', 'rejected');
    _clearAllStates();
    expect(getState('p-001')).toBeUndefined();
    expect(getState('p-002')).toBeUndefined();
    expect(getState('p-003')).toBeUndefined();
  });
});

// ─── execution.journal ────────────────────────────────────────────────────────

describe('execution.journal', () => {
  beforeAll(() => {
    _clearJournal();
  });

  it('recordExecution appends to journal; getJournal reflects entry', () => {
    recordExecution('prop-A', 'v1', 'hash-A', 'approved');
    const journal = getJournal();
    expect(journal.length).toBe(1);
    const entry = journal[0];
    expect(entry.proposalId).toBe('prop-A');
    expect(entry.policyVersion).toBe('v1');
    expect(entry.policyHash).toBe('hash-A');
    expect(entry.decision).toBe('approved');
    expect(typeof entry.timestamp).toBe('number');
  });

  it('journal is cumulative — second record adds to existing', () => {
    recordExecution('prop-B', 'v2', 'hash-B', 'rejected');
    expect(getJournal().length).toBe(2);
    expect(getJournal()[1].decision).toBe('rejected');
  });

  it('recordExecution with resumeContext populates field', () => {
    const ctx = {
      checkpointedAt: Date.now(),
      resumeCount: 1,
      resumeAuthorized: true,
    };
    recordExecution('prop-C', 'v1', 'hash-C', 'pending', ctx);
    const entry = getJournal()[getJournal().length - 1];
    expect(entry.resumeContext).toBeDefined();
    expect(entry.resumeContext!.resumeCount).toBe(1);
  });

  it('_clearJournal empties the journal', () => {
    _clearJournal();
    expect(getJournal().length).toBe(0);
  });
});

// ─── AuthorityPolicy ──────────────────────────────────────────────────────────

describe('AuthorityPolicy', () => {
  const policy = new AuthorityPolicy();

  it('"read" capability is allowed (DefaultCapabilityProfile.read=true)', () => {
    expect(policy.isAllowed({ capability: 'read', source: 'test' })).toBe(true);
  });

  it('"write" capability is NOT allowed (default=false)', () => {
    expect(policy.isAllowed({ capability: 'write', source: 'test' })).toBe(false);
  });

  it('"execute" capability is NOT allowed (default=false)', () => {
    expect(policy.isAllowed({ capability: 'execute', source: 'test' })).toBe(false);
  });

  it('"network" capability is NOT allowed (default=false)', () => {
    expect(policy.isAllowed({ capability: 'network', source: 'test' })).toBe(false);
  });
});

// ─── CreativePermissionPolicy ─────────────────────────────────────────────────

describe('CreativePermissionPolicy', () => {
  const policy = new CreativePermissionPolicy();

  function makeCtx(creative_allowed: boolean) {
    return {
      domain_id: 'test',
      domain_type: 'creative' as const,
      input_class: 'text' as const,
      allowed_output_types: [],
      risk_ceiling: 'low' as const,
      boundary_conditions: [],
      refusal_policy_id: 'p1',
      creative_allowed,
    };
  }

  it('creative_allowed=true + R0 → allowed (RISK_ORDER.R0=0 ≤ R1=1)', () => {
    expect(policy.allow(makeCtx(true), 'R0')).toBe(true);
  });

  it('creative_allowed=true + R1 → allowed (RISK_ORDER.R1=1 ≤ R1=1)', () => {
    expect(policy.allow(makeCtx(true), 'R1')).toBe(true);
  });

  it('creative_allowed=true + R2 → NOT allowed (RISK_ORDER.R2=2 > R1=1)', () => {
    expect(policy.allow(makeCtx(true), 'R2')).toBe(false);
  });

  it('creative_allowed=false + R0 → NOT allowed (flag overrides risk)', () => {
    expect(policy.allow(makeCtx(false), 'R0')).toBe(false);
  });
});

// ─── SessionState ─────────────────────────────────────────────────────────────

describe('SessionState', () => {
  it('getDomain returns undefined before setDomain', () => {
    const s = new SessionState();
    expect(s.getDomain()).toBeUndefined();
  });

  it('setDomain + getDomain round-trips correctly', () => {
    const s = new SessionState();
    s.setDomain('finance');
    expect(s.getDomain()).toBe('finance');
  });

  it('setRisk + getRisk round-trips correctly; instances are independent', () => {
    const s1 = new SessionState();
    const s2 = new SessionState();
    s1.setRisk('high');
    s2.setRisk('low');
    expect(s1.getRisk()).toBe('high');
    expect(s2.getRisk()).toBe('low');
  });
});
