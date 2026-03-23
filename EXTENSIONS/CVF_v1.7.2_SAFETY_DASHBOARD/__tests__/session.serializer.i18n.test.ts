/**
 * CVF v1.7.2 Safety Dashboard — Session Serializer & i18n Dedicated Tests (W6-T42)
 * ==================================================================================
 * GC-023: dedicated file — never merge into sessionManager.test.ts.
 *
 * Coverage:
 *   serializeSession / toSessionSummary (lib/storage/sessionSerializer.ts):
 *     - version field = "cvf-session-v2"
 *     - sessionInfo is a shallow copy (not same reference)
 *     - state is a shallow copy
 *     - events are shallow copies of each entry
 *     - status propagated to serialized output
 *     - toSessionSummary: sessionId from sessionInfo
 *     - toSessionSummary: profile from sessionInfo
 *     - toSessionSummary: startedAt from sessionInfo
 *     - toSessionSummary: status propagated
 *     - toSessionSummary: eventCount = events.length
 *     - toSessionSummary: rLevel from state
 *     - toSessionSummary: phase from state
 *   i18n index (lib/i18n/index.ts):
 *     - default locale = 'vi'
 *     - getLocale() returns current locale
 *     - setLocale('en') → getLocale() returns 'en'
 *     - t() after setLocale('vi') → returns vi translations
 *     - t() after setLocale('en') → returns en translations
 *     - vi and en exports are defined objects
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { serializeSession, toSessionSummary } from '@/lib/storage/sessionSerializer';
import { setLocale, getLocale, t, vi, en } from '@/lib/i18n/index';
import type {
  SessionInfo,
  SessionState,
  GovernanceEvent,
  SessionStatus,
} from '@/lib/sessionManager';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeSessionInfo(): SessionInfo {
  return {
    sessionId: 'sess-001',
    cvfVersion: '1.7.2',
    profile: 'non-coder',
    startedAt: 1711000000000,
  };
}

function makeState(): SessionState {
  return {
    rLevel: 'R0',
    phase: 'INTAKE',
    autonomy: 80,
    step: 1,
    escalated: false,
    requireHuman: false,
    hardStop: false,
    warning: false,
    critical: false,
  };
}

function makeEvent(id: string): GovernanceEvent {
  return {
    id,
    sessionId: 'sess-001',
    timestamp: 1711000001000,
    step: 1,
    phase: 'INTAKE',
    rLevel: 'R0',
    autonomy: 80,
    type: 'PHASE_TRANSITION',
  };
}

// ─── serializeSession ─────────────────────────────────────────────────────────

describe('serializeSession', () => {
  it('version = "cvf-session-v2"', () => {
    const result = serializeSession(makeSessionInfo(), makeState(), [], 'ACTIVE');
    expect(result.version).toBe('cvf-session-v2');
  });

  it('sessionInfo propagated correctly', () => {
    const info = makeSessionInfo();
    const result = serializeSession(info, makeState(), [], 'ACTIVE');
    expect(result.sessionInfo.sessionId).toBe('sess-001');
    expect(result.sessionInfo.profile).toBe('non-coder');
  });

  it('sessionInfo is a copy (not same reference)', () => {
    const info = makeSessionInfo();
    const result = serializeSession(info, makeState(), [], 'ACTIVE');
    expect(result.sessionInfo).not.toBe(info);
  });

  it('state is a copy (not same reference)', () => {
    const state = makeState();
    const result = serializeSession(makeSessionInfo(), state, [], 'ACTIVE');
    expect(result.state).not.toBe(state);
  });

  it('state values propagated correctly', () => {
    const state = makeState();
    state.rLevel = 'R2';
    state.phase = 'BUILD';
    const result = serializeSession(makeSessionInfo(), state, [], 'ACTIVE');
    expect(result.state.rLevel).toBe('R2');
    expect(result.state.phase).toBe('BUILD');
  });

  it('events serialized as shallow copies', () => {
    const events = [makeEvent('e1'), makeEvent('e2')];
    const result = serializeSession(makeSessionInfo(), makeState(), events, 'ACTIVE');
    expect(result.events).toHaveLength(2);
    expect(result.events[0]).not.toBe(events[0]);
    expect(result.events[0]!.id).toBe('e1');
  });

  it('empty events → events = []', () => {
    const result = serializeSession(makeSessionInfo(), makeState(), [], 'ACTIVE');
    expect(result.events).toEqual([]);
  });

  it('status propagated to serialized output', () => {
    const resultActive = serializeSession(makeSessionInfo(), makeState(), [], 'ACTIVE');
    const resultFrozen = serializeSession(makeSessionInfo(), makeState(), [], 'FROZEN');
    expect(resultActive.status).toBe('ACTIVE');
    expect(resultFrozen.status).toBe('FROZEN');
  });
});

// ─── toSessionSummary ─────────────────────────────────────────────────────────

describe('toSessionSummary', () => {
  function makeSerialized(eventCount = 0, status: SessionStatus = 'ACTIVE') {
    const events = Array.from({ length: eventCount }, (_, i) => makeEvent(`e${i}`));
    return serializeSession(makeSessionInfo(), makeState(), events, status);
  }

  it('sessionId from sessionInfo', () => {
    const summary = toSessionSummary(makeSerialized());
    expect(summary.sessionId).toBe('sess-001');
  });

  it('profile from sessionInfo', () => {
    const summary = toSessionSummary(makeSerialized());
    expect(summary.profile).toBe('non-coder');
  });

  it('startedAt from sessionInfo', () => {
    const summary = toSessionSummary(makeSerialized());
    expect(summary.startedAt).toBe(1711000000000);
  });

  it('status propagated', () => {
    expect(toSessionSummary(makeSerialized(0, 'ACTIVE')).status).toBe('ACTIVE');
    expect(toSessionSummary(makeSerialized(0, 'FROZEN')).status).toBe('FROZEN');
  });

  it('eventCount = events.length', () => {
    expect(toSessionSummary(makeSerialized(3)).eventCount).toBe(3);
    expect(toSessionSummary(makeSerialized(0)).eventCount).toBe(0);
  });

  it('rLevel from state', () => {
    const summary = toSessionSummary(makeSerialized());
    expect(summary.rLevel).toBe('R0');
  });

  it('phase from state', () => {
    const summary = toSessionSummary(makeSerialized());
    expect(summary.phase).toBe('INTAKE');
  });
});

// ─── i18n index ───────────────────────────────────────────────────────────────

describe('i18n index', () => {
  beforeEach(() => {
    // Reset to default locale before each test
    setLocale('vi');
  });

  it('default locale is "vi"', () => {
    expect(getLocale()).toBe('vi');
  });

  it('setLocale("en") → getLocale() returns "en"', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
  });

  it('setLocale("vi") → getLocale() returns "vi"', () => {
    setLocale('en');
    setLocale('vi');
    expect(getLocale()).toBe('vi');
  });

  it('t() after setLocale("vi") → returns vi translations object', () => {
    setLocale('vi');
    const translations = t();
    expect(translations).toBe(vi);
  });

  it('t() after setLocale("en") → returns en translations object', () => {
    setLocale('en');
    const translations = t();
    expect(translations).toBe(en);
  });

  it('vi export is a defined object with dashboard key', () => {
    expect(vi).toBeDefined();
    expect(typeof vi).toBe('object');
    expect(vi.dashboard).toBeDefined();
  });

  it('en export is a defined object with dashboard key', () => {
    expect(en).toBeDefined();
    expect(typeof en).toBe('object');
    expect(en.dashboard).toBeDefined();
  });
});
