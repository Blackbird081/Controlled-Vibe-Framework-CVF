/**
 * Tests for VS Code Governance Adapter
 */

import { describe, it, expect } from 'vitest';
import { generateGovernancePrompt, generateGovernancePayload } from './vscode-governance-adapter';

describe('generateGovernancePrompt', () => {
  it('generates prompt for BUILD phase AI_AGENT', () => {
    const prompt = generateGovernancePrompt({
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'AI_AGENT',
    });
    expect(prompt).toContain('CVF GOVERNANCE CONTEXT');
    expect(prompt).toContain('BUILD');
    expect(prompt).toContain('AI_AGENT');
    expect(prompt).toContain('R0');
  });

  it('warns AI_AGENT in DISCOVERY phase', () => {
    const prompt = generateGovernancePrompt({
      phase: 'DISCOVERY',
      riskLevel: 'R0',
      role: 'AI_AGENT',
    });
    expect(prompt).toContain('WARNING');
    expect(prompt).toContain('NOT authorized');
  });

  it('shows elevated risk warning for R2', () => {
    const prompt = generateGovernancePrompt({
      phase: 'BUILD',
      riskLevel: 'R2',
      role: 'AI_AGENT',
    });
    expect(prompt).toContain('Elevated');
    expect(prompt).toContain('human approval');
  });

  it('shows critical risk block for R3', () => {
    const prompt = generateGovernancePrompt({
      phase: 'BUILD',
      riskLevel: 'R3',
      role: 'AI_AGENT',
    });
    expect(prompt).toContain('Critical');
    expect(prompt).toContain('CANNOT proceed autonomously');
  });

  it('lists restricted actions for AI_AGENT', () => {
    const prompt = generateGovernancePrompt({
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'AI_AGENT',
    });
    expect(prompt).toContain('approve');
    expect(prompt).toContain('deploy');
    expect(prompt).toContain('merge');
  });

  it('shows mutation budget warning when near limit', () => {
    const prompt = generateGovernancePrompt({
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'AI_AGENT',
      mutationCount: 45,
    });
    expect(prompt).toContain('90%');
    expect(prompt).toContain('Prioritize');
  });

  it('includes protected paths', () => {
    const prompt = generateGovernancePrompt({
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'AI_AGENT',
    });
    expect(prompt).toContain('governance/');
  });

  it('includes project name when provided', () => {
    const prompt = generateGovernancePrompt({
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'HUMAN',
      projectName: 'MyApp',
    });
    expect(prompt).toContain('MyApp');
  });
});

describe('generateGovernancePayload', () => {
  it('returns structured JSON payload', () => {
    const payload = generateGovernancePayload({
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'AI_AGENT',
    });
    expect(payload.cvf_version).toBe('2.0');
    expect(payload.phase).toBe('BUILD');
    expect(payload.risk_level).toBe('R1');
    expect(payload.role).toBe('AI_AGENT');
    expect(payload.channel).toBe('ide');
    expect(payload.mutation_budget).toBe(20); // R1 budget
    expect(Array.isArray(payload.restricted_actions)).toBe(true);
    expect(Array.isArray(payload.protected_paths)).toBe(true);
  });
});
