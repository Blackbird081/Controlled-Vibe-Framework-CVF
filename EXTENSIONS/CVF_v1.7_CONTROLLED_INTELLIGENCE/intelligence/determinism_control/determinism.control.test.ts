/**
 * CVF v1.7 Controlled Intelligence — Determinism Control Dedicated Tests (W6-T46)
 * ==================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage:
 *   resolveTemperature (temperature.policy.ts):
 *     - STRICT → 0.0
 *     - CONTROLLED → 0.2
 *     - CREATIVE → 0.6
 *     - ReasoningMode enum values are correct strings
 *   resolveReasoningMode (reasoning.mode.ts):
 *     - PLAN → STRICT
 *     - RISK → STRICT
 *     - REVIEW → STRICT
 *     - RESEARCH → CONTROLLED
 *     - DESIGN → CONTROLLED
 *     - BUILD → STRICT
 *     - TEST → STRICT
 *     - DEBUG → STRICT
 *     - unknown/default → CONTROLLED
 *   createSnapshot (reproducibility.snapshot.ts):
 *     - returns all required fields
 *     - sessionId/role/temperature/entropyScore preserved
 *     - same inputs → same snapshotId (deterministic)
 *     - different basePrompt → different promptHash
 *     - default modelVersion="unknown"
 *     - snapshotId is 8-char hex string
 *     - timestamp is a number
 */

import { describe, it, expect } from 'vitest';

import { resolveTemperature, ReasoningMode } from './temperature.policy.js';
import { resolveReasoningMode } from './reasoning.mode.js';
import { createSnapshot } from './reproducibility.snapshot.js';
import { AgentRole } from '../role_transition_guard/role.types.js';

// ─── ReasoningMode enum ───────────────────────────────────────────────────────

describe('ReasoningMode enum', () => {
  it('STRICT value is "STRICT"', () => {
    expect(ReasoningMode.STRICT).toBe('STRICT');
  });

  it('CONTROLLED value is "CONTROLLED"', () => {
    expect(ReasoningMode.CONTROLLED).toBe('CONTROLLED');
  });

  it('CREATIVE value is "CREATIVE"', () => {
    expect(ReasoningMode.CREATIVE).toBe('CREATIVE');
  });
});

// ─── resolveTemperature ───────────────────────────────────────────────────────

describe('resolveTemperature', () => {
  it('STRICT → 0.0', () => {
    expect(resolveTemperature(ReasoningMode.STRICT)).toBe(0.0);
  });

  it('CONTROLLED → 0.2', () => {
    expect(resolveTemperature(ReasoningMode.CONTROLLED)).toBe(0.2);
  });

  it('CREATIVE → 0.6', () => {
    expect(resolveTemperature(ReasoningMode.CREATIVE)).toBe(0.6);
  });
});

// ─── resolveReasoningMode ─────────────────────────────────────────────────────

describe('resolveReasoningMode', () => {
  it('PLAN → STRICT', () => {
    expect(resolveReasoningMode(AgentRole.PLAN)).toBe(ReasoningMode.STRICT);
  });

  it('RISK → STRICT', () => {
    expect(resolveReasoningMode(AgentRole.RISK)).toBe(ReasoningMode.STRICT);
  });

  it('REVIEW → STRICT', () => {
    expect(resolveReasoningMode(AgentRole.REVIEW)).toBe(ReasoningMode.STRICT);
  });

  it('BUILD → STRICT', () => {
    expect(resolveReasoningMode(AgentRole.BUILD)).toBe(ReasoningMode.STRICT);
  });

  it('TEST → STRICT', () => {
    expect(resolveReasoningMode(AgentRole.TEST)).toBe(ReasoningMode.STRICT);
  });

  it('DEBUG → STRICT', () => {
    expect(resolveReasoningMode(AgentRole.DEBUG)).toBe(ReasoningMode.STRICT);
  });

  it('RESEARCH → CONTROLLED', () => {
    expect(resolveReasoningMode(AgentRole.RESEARCH)).toBe(ReasoningMode.CONTROLLED);
  });

  it('DESIGN → CONTROLLED', () => {
    expect(resolveReasoningMode(AgentRole.DESIGN)).toBe(ReasoningMode.CONTROLLED);
  });
});

// ─── createSnapshot ───────────────────────────────────────────────────────────

describe('createSnapshot', () => {
  it('returns snapshot with correct sessionId', () => {
    const snap = createSnapshot('sess-1', 'BUILD', 0.0, 0.1);
    expect(snap.sessionId).toBe('sess-1');
  });

  it('returns snapshot with correct role', () => {
    const snap = createSnapshot('sess-1', 'BUILD', 0.0, 0.1);
    expect(snap.role).toBe('BUILD');
  });

  it('returns snapshot with correct temperature', () => {
    const snap = createSnapshot('sess-1', 'PLAN', 0.2, 0.5);
    expect(snap.temperature).toBe(0.2);
  });

  it('returns snapshot with correct entropyScore', () => {
    const snap = createSnapshot('sess-1', 'PLAN', 0.0, 0.75);
    expect(snap.entropyScore).toBe(0.75);
  });

  it('snapshotId is an 8-char hex string', () => {
    const snap = createSnapshot('s1', 'r', 0.0, 0);
    expect(snap.snapshotId).toMatch(/^[0-9a-f]{8}$/);
  });

  it('promptHash is an 8-char hex string', () => {
    const snap = createSnapshot('s1', 'r', 0.0, 0, 'my prompt');
    expect(snap.promptHash).toMatch(/^[0-9a-f]{8}$/);
  });

  it('same inputs → same snapshotId (deterministic)', () => {
    const snap1 = createSnapshot('sess-A', 'BUILD', 0.0, 0.1, 'prompt-x', 'v1');
    const snap2 = createSnapshot('sess-A', 'BUILD', 0.0, 0.1, 'prompt-x', 'v1');
    expect(snap1.snapshotId).toBe(snap2.snapshotId);
  });

  it('different basePrompt → different promptHash', () => {
    const snap1 = createSnapshot('s1', 'r', 0.0, 0, 'prompt-alpha');
    const snap2 = createSnapshot('s1', 'r', 0.0, 0, 'prompt-beta');
    expect(snap1.promptHash).not.toBe(snap2.promptHash);
  });

  it('default modelVersion="unknown"', () => {
    const snap = createSnapshot('s1', 'r', 0.0, 0);
    expect(snap.modelVersion).toBe('unknown');
  });

  it('custom modelVersion preserved', () => {
    const snap = createSnapshot('s1', 'r', 0.0, 0, '', 'claude-4');
    expect(snap.modelVersion).toBe('claude-4');
  });

  it('timestamp is a positive number', () => {
    const snap = createSnapshot('s1', 'r', 0.0, 0);
    expect(typeof snap.timestamp).toBe('number');
    expect(snap.timestamp).toBeGreaterThan(0);
  });
});
