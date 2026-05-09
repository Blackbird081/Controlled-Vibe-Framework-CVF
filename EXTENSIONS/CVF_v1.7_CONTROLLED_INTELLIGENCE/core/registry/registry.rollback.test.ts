/**
 * CVF v1.7 Controlled Intelligence — Registry + Policy + Rollback Dedicated Tests (W6-T53)
 * ============================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage:
 *   evaluatePolicy (policy.engine.ts):
 *     - riskScore >= 0.9 (HARD) → decision=BLOCK, reason includes "hard threshold"
 *     - riskScore >= 0.7 < 0.9 (ESCALATION) → decision=ESCALATE, reason includes "escalation"
 *     - riskScore < 0.7 → decision=ALLOW, reason=undefined
 *     - result has timestamp
 *   bindPolicy (policy.binding.ts):
 *     - ALLOW → allowed=true, escalate=false
 *     - ESCALATE → allowed=false, escalate=true
 *     - BLOCK → allowed=false, escalate=false
 *   registerSkill / getSkillByName / getRegisteredSkills / getSkillsByPhase / getSkillsByCategory (skill.registry.ts):
 *     - registered skill retrievable by name
 *     - unknown name → undefined
 *     - getRegisteredSkills includes registered skill
 *     - getSkillsByPhase filters by cvfPhase
 *     - getSkillsByCategory filters by category
 *   createRollbackSnapshot / restoreLastSnapshot / getAllSnapshots (rollback.manager.ts):
 *     - snapshot created and retrievable
 *     - restoreLastSnapshot returns most recent for sessionId
 *     - getAllSnapshots returns all for sessionId, not others
 *     - session with no snapshots → undefined / empty
 */

import { beforeAll, describe, it, expect } from 'vitest';

import { evaluatePolicy } from '../governance/policy.engine.js';
import { bindPolicy } from '../governance/policy.binding.js';
import { registerSkill, getSkillByName, getRegisteredSkills, getSkillsByPhase, getSkillsByCategory } from './skill.registry.js';
import {
  createRollbackSnapshot,
  restoreLastSnapshot,
  getAllSnapshots,
} from '../rollback/rollback.manager.js';

// ─── File-level setup ─────────────────────────────────────────────────────────

// Use timestamp-based session IDs for rollback tests (disk persistence isolation)
const _ts = Date.now();
const SESSION_A = `sess-A-${_ts}`;
const SESSION_B = `sess-B-${_ts}`;

// Use timestamp-based skill names for skill.registry (module-level Map, fresh per file)
const SKILL_ALPHA = `skill-alpha-${_ts}`;
const SKILL_BETA = `skill-beta-${_ts}`;

beforeAll(() => {
  // skill.registry: 2 skills
  registerSkill({ name: SKILL_ALPHA, version: '1.0', category: 'research', cvfPhase: 'A' });
  registerSkill({ name: SKILL_BETA, version: '1.0', category: 'build', cvfPhase: 'C' });

  // rollback: 2 snapshots for SESSION_A, none for SESSION_B
  createRollbackSnapshot(SESSION_A, { state: 'initial' });
  createRollbackSnapshot(SESSION_A, { state: 'step-2' });
});

// ─── evaluatePolicy ───────────────────────────────────────────────────────────

describe('evaluatePolicy', () => {
  it('riskScore < 0.7 → decision=ALLOW', () => {
    const result = evaluatePolicy({ sessionId: 's1', role: 'BUILD', riskScore: 0.5 });
    expect(result.decision).toBe('ALLOW');
  });

  it('ALLOW result has timestamp', () => {
    const result = evaluatePolicy({ sessionId: 's1', role: 'BUILD', riskScore: 0.5 });
    expect(typeof result.timestamp).toBe('number');
  });

  it('riskScore >= 0.7 < 0.9 → decision=ESCALATE', () => {
    const result = evaluatePolicy({ sessionId: 's1', role: 'BUILD', riskScore: 0.75 });
    expect(result.decision).toBe('ESCALATE');
    expect(result.reason).toContain('escalation');
  });

  it('riskScore >= 0.9 → decision=BLOCK', () => {
    const result = evaluatePolicy({ sessionId: 's1', role: 'BUILD', riskScore: 0.9 });
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('hard threshold');
  });

  it('riskScore = 0.0 → ALLOW', () => {
    expect(evaluatePolicy({ sessionId: 's1', role: 'PLAN', riskScore: 0.0 }).decision).toBe('ALLOW');
  });

  it('riskScore = 1.0 → BLOCK', () => {
    expect(evaluatePolicy({ sessionId: 's1', role: 'PLAN', riskScore: 1.0 }).decision).toBe('BLOCK');
  });
});

// ─── bindPolicy ───────────────────────────────────────────────────────────────

describe('bindPolicy', () => {
  it('riskScore < 0.7 → allowed=true, escalate=false', () => {
    const result = bindPolicy({ sessionId: 's1', role: 'BUILD', riskScore: 0.5 });
    expect(result.allowed).toBe(true);
    expect(result.escalate).toBe(false);
  });

  it('riskScore >= 0.7 < 0.9 → allowed=false, escalate=true', () => {
    const result = bindPolicy({ sessionId: 's1', role: 'BUILD', riskScore: 0.75 });
    expect(result.allowed).toBe(false);
    expect(result.escalate).toBe(true);
  });

  it('riskScore >= 0.9 → allowed=false, escalate=false', () => {
    const result = bindPolicy({ sessionId: 's1', role: 'BUILD', riskScore: 0.95 });
    expect(result.allowed).toBe(false);
    expect(result.escalate).toBe(false);
  });

  it('result.result contains the GovernanceResult', () => {
    const result = bindPolicy({ sessionId: 's1', role: 'BUILD', riskScore: 0.5 });
    expect(result.result).toBeDefined();
    expect(result.result.decision).toBe('ALLOW');
  });
});

// ─── skill.registry ───────────────────────────────────────────────────────────

describe('skill.registry', () => {
  it('getSkillByName returns registered skill', () => {
    const skill = getSkillByName(SKILL_ALPHA);
    expect(skill).toBeDefined();
    expect(skill!.name).toBe(SKILL_ALPHA);
  });

  it('getSkillByName unknown → undefined', () => {
    expect(getSkillByName('nonexistent-skill-xyz')).toBeUndefined();
  });

  it('getRegisteredSkills includes both registered skills', () => {
    const all = getRegisteredSkills();
    const names = all.map((s) => s.name);
    expect(names).toContain(SKILL_ALPHA);
    expect(names).toContain(SKILL_BETA);
  });

  it('getSkillsByPhase("A") includes SKILL_ALPHA (cvfPhase=A)', () => {
    const phaseA = getSkillsByPhase('A');
    expect(phaseA.some((s) => s.name === SKILL_ALPHA)).toBe(true);
  });

  it('getSkillsByPhase("A") does not include SKILL_BETA (cvfPhase=C)', () => {
    const phaseA = getSkillsByPhase('A');
    expect(phaseA.some((s) => s.name === SKILL_BETA)).toBe(false);
  });

  it('getSkillsByCategory("build") includes SKILL_BETA', () => {
    const buildSkills = getSkillsByCategory('build');
    expect(buildSkills.some((s) => s.name === SKILL_BETA)).toBe(true);
  });

  it('getSkillsByCategory("research") includes SKILL_ALPHA', () => {
    const researchSkills = getSkillsByCategory('research');
    expect(researchSkills.some((s) => s.name === SKILL_ALPHA)).toBe(true);
  });
});

// ─── rollback ────────────────────────────────────────────────────────────────

describe('rollback', () => {
  it('restoreLastSnapshot returns latest snapshot for SESSION_A', () => {
    const snap = restoreLastSnapshot(SESSION_A);
    expect(snap).toBeDefined();
    expect(snap!.sessionId).toBe(SESSION_A);
  });

  it('restoreLastSnapshot returns the most recent state', () => {
    const snap = restoreLastSnapshot(SESSION_A);
    expect((snap!.state as any).state).toBe('step-2');
  });

  it('getAllSnapshots returns all snapshots for SESSION_A', () => {
    const all = getAllSnapshots(SESSION_A);
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(all.every((s) => s.sessionId === SESSION_A)).toBe(true);
  });

  it('getAllSnapshots for SESSION_B (no snapshots) → empty', () => {
    const all = getAllSnapshots(SESSION_B);
    expect(all).toHaveLength(0);
  });

  it('restoreLastSnapshot for unknown session → undefined', () => {
    expect(restoreLastSnapshot(`unknown-sess-${_ts}`)).toBeUndefined();
  });

  it('snapshot has timestamp field', () => {
    const snap = restoreLastSnapshot(SESSION_A);
    expect(typeof snap!.timestamp).toBe('number');
  });
});
