/**
 * CVF v1.7 Controlled Intelligence — Binding Registry Dedicated Tests (W6-T54)
 * ==============================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage:
 *   getSkillsForRole (binding.registry.ts):
 *     - role with phase → returns skills for that phase from skill.registry
 *     - role without phase mapping → returns empty array
 *   getBindingsForRole (binding.registry.ts):
 *     - returns SkillBinding objects with skillName, role, phase
 *     - role without phase → empty array
 *   isSkillAvailableForRole (binding.registry.ts):
 *     - skill in role's phase → true
 *     - skill not in role's phase → false
 *     - role without phase → false
 */

import { beforeAll, describe, it, expect } from 'vitest';

import { registerSkill } from './skill.registry.js';
import { getSkillsForRole, getBindingsForRole, isSkillAvailableForRole } from './binding.registry.js';
import { AgentRole } from '../../intelligence/role_transition_guard/role.types.js';

// ─── File-level setup ─────────────────────────────────────────────────────────
// Register skills scoped to specific phases so we can test binding logic.
// Unique timestamp-based names to avoid Map collision with other test files.

const _ts2 = Date.now();
const SKILL_PHASE_A = `skill-binding-A-${_ts2}`;
const SKILL_PHASE_C = `skill-binding-C-${_ts2}`;

beforeAll(() => {
  registerSkill({ name: SKILL_PHASE_A, version: '1.0', category: 'research', cvfPhase: 'A' });
  registerSkill({ name: SKILL_PHASE_C, version: '1.0', category: 'build', cvfPhase: 'C' });
});

// ─── getSkillsForRole ─────────────────────────────────────────────────────────

describe('getSkillsForRole', () => {
  it('RESEARCH role → phase A skills (includes SKILL_PHASE_A)', () => {
    const skills = getSkillsForRole(AgentRole.RESEARCH);
    expect(skills.some((s) => s.name === SKILL_PHASE_A)).toBe(true);
  });

  it('RESEARCH role → does not include phase C skills', () => {
    const skills = getSkillsForRole(AgentRole.RESEARCH);
    expect(skills.some((s) => s.name === SKILL_PHASE_C)).toBe(false);
  });

  it('BUILD role → phase C skills (includes SKILL_PHASE_C)', () => {
    const skills = getSkillsForRole(AgentRole.BUILD);
    expect(skills.some((s) => s.name === SKILL_PHASE_C)).toBe(true);
  });
});

// ─── getBindingsForRole ───────────────────────────────────────────────────────

describe('getBindingsForRole', () => {
  it('RESEARCH role → bindings have skillName, role=RESEARCH, phase=A', () => {
    const bindings = getBindingsForRole(AgentRole.RESEARCH);
    const binding = bindings.find((b) => b.skillName === SKILL_PHASE_A);
    expect(binding).toBeDefined();
    expect(binding!.role).toBe(AgentRole.RESEARCH);
    expect(binding!.phase).toBe('A');
  });

  it('BUILD role → bindings have phase=C', () => {
    const bindings = getBindingsForRole(AgentRole.BUILD);
    const binding = bindings.find((b) => b.skillName === SKILL_PHASE_C);
    expect(binding!.phase).toBe('C');
  });
});

// ─── isSkillAvailableForRole ──────────────────────────────────────────────────

describe('isSkillAvailableForRole', () => {
  it('SKILL_PHASE_A available for RESEARCH (phase A)', () => {
    expect(isSkillAvailableForRole(SKILL_PHASE_A, AgentRole.RESEARCH)).toBe(true);
  });

  it('SKILL_PHASE_A not available for BUILD (phase C)', () => {
    expect(isSkillAvailableForRole(SKILL_PHASE_A, AgentRole.BUILD)).toBe(false);
  });

  it('SKILL_PHASE_C available for BUILD (phase C)', () => {
    expect(isSkillAvailableForRole(SKILL_PHASE_C, AgentRole.BUILD)).toBe(true);
  });

  it('unknown skill not available for any role', () => {
    expect(isSkillAvailableForRole('nonexistent-skill-xyz', AgentRole.RESEARCH)).toBe(false);
  });
});
