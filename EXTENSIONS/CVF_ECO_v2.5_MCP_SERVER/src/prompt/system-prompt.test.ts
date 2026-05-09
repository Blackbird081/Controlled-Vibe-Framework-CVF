/**
 * Tests for System Prompt Generator
 */

import { describe, it, expect } from 'vitest';
import { generateSystemPrompt, MCP_TOOL_DESCRIPTIONS } from './system-prompt.js';

describe('generateSystemPrompt', () => {
  describe('default generation', () => {
    it('generates a non-empty prompt with defaults', () => {
      const result = generateSystemPrompt();
      expect(result.systemPrompt.length).toBeGreaterThan(100);
    });

    it('includes all expected sections', () => {
      const result = generateSystemPrompt();
      expect(result.sections).toContain('identity');
      expect(result.sections).toContain('phase_governance');
      expect(result.sections).toContain('risk_model');
      expect(result.sections).toContain('authority');
      expect(result.sections).toContain('goal_constraint');
      expect(result.sections).toContain('self_correction');
      expect(result.sections).toContain('mcp_tools');
      expect(result.sections).toContain('failure_mode');
    });

    it('has at least 5 active rules', () => {
      const result = generateSystemPrompt();
      expect(result.activeRules.length).toBeGreaterThanOrEqual(5);
    });

    it('estimates tokens', () => {
      const result = generateSystemPrompt();
      expect(result.estimatedTokens).toBeGreaterThan(100);
    });
  });

  describe('identity section', () => {
    it('includes CVF declaration', () => {
      const result = generateSystemPrompt({ phase: 'BUILD' });
      expect(result.systemPrompt).toContain('Controlled Vibe Framework');
      expect(result.systemPrompt).toContain('execution contract');
    });

    it('includes phase in declaration', () => {
      const result = generateSystemPrompt({ phase: 'DESIGN' });
      expect(result.systemPrompt).toContain('Current Phase: DESIGN');
    });

    it('includes role in declaration', () => {
      const result = generateSystemPrompt({ role: 'AI_AGENT' });
      expect(result.systemPrompt).toContain('Current Role: AI_AGENT');
    });

    it('includes risk level in declaration', () => {
      const result = generateSystemPrompt({ riskLevel: 'R2' });
      expect(result.systemPrompt).toContain('Active Risk Level: R2');
    });

    it('includes project name when provided', () => {
      const result = generateSystemPrompt({ projectName: 'My App' });
      expect(result.systemPrompt).toContain('My App');
    });

    it('includes agent ID when provided', () => {
      const result = generateSystemPrompt({ agentId: 'agent-007' });
      expect(result.systemPrompt).toContain('agent-007');
    });

    it('includes phase progress', () => {
      const result = generateSystemPrompt({ phase: 'BUILD' });
      expect(result.systemPrompt).toContain('3/4');
    });
  });

  describe('phase governance section', () => {
    it('lists all phases', () => {
      const result = generateSystemPrompt();
      expect(result.systemPrompt).toContain('DISCOVERY');
      expect(result.systemPrompt).toContain('DESIGN');
      expect(result.systemPrompt).toContain('BUILD');
      expect(result.systemPrompt).toContain('REVIEW');
    });

    it('marks current phase with arrow', () => {
      const result = generateSystemPrompt({ phase: 'BUILD' });
      expect(result.systemPrompt).toContain('→ BUILD');
    });

    it('includes no-skip rule', () => {
      const result = generateSystemPrompt();
      expect(result.systemPrompt).toContain('MUST NOT skip phases');
    });
  });

  describe('risk model section', () => {
    it('includes all risk descriptions', () => {
      const result = generateSystemPrompt();
      expect(result.systemPrompt).toContain('R0:');
      expect(result.systemPrompt).toContain('R1:');
      expect(result.systemPrompt).toContain('R2:');
      expect(result.systemPrompt).toContain('R3:');
    });

    it('shows max allowed risk', () => {
      const result = generateSystemPrompt({ maxRiskLevel: 'R1' });
      expect(result.systemPrompt).toContain('Maximum allowed: R1');
    });

    it('includes AI agent R3 blocking rule', () => {
      const result = generateSystemPrompt({ role: 'AI_AGENT' });
      expect(result.systemPrompt).toContain('R3 actions are BLOCKED for AI agents');
    });

    it('includes AI agent R2 escalation rule', () => {
      const result = generateSystemPrompt({ role: 'AI_AGENT' });
      expect(result.systemPrompt).toContain('R2 actions require escalation');
    });
  });

  describe('authority section', () => {
    it('lists restricted actions for AI_AGENT', () => {
      const result = generateSystemPrompt({ role: 'AI_AGENT' });
      expect(result.systemPrompt).toContain('approve');
      expect(result.systemPrompt).toContain('merge');
      expect(result.systemPrompt).toContain('deploy');
    });

    it('shows no restrictions for HUMAN', () => {
      const result = generateSystemPrompt({ role: 'HUMAN' });
      expect(result.systemPrompt).toContain('No action restrictions');
    });

    it('shows no restrictions for OPERATOR', () => {
      const result = generateSystemPrompt({ role: 'OPERATOR' });
      expect(result.systemPrompt).toContain('No action restrictions');
    });
  });

  describe('goal/constraint separation', () => {
    it('includes goal/constraint section', () => {
      const result = generateSystemPrompt();
      expect(result.systemPrompt).toContain('GOAL/CONSTRAINT SEPARATION');
    });

    it('includes Governor Pattern', () => {
      const result = generateSystemPrompt();
      expect(result.systemPrompt).toContain('Governor Pattern');
    });

    it('mentions GOAL and CONSTRAINTS', () => {
      const result = generateSystemPrompt();
      expect(result.systemPrompt).toContain('1. GOAL');
      expect(result.systemPrompt).toContain('2. CONSTRAINTS');
    });

    it('includes max risk in constraints', () => {
      const result = generateSystemPrompt({ maxRiskLevel: 'R1' });
      expect(result.systemPrompt).toContain('max R1');
    });
  });

  describe('self-correction loop', () => {
    it('includes self-correction section', () => {
      const result = generateSystemPrompt();
      expect(result.systemPrompt).toContain('SELF-CORRECTION LOOP');
    });

    it('includes confirmation format', () => {
      const result = generateSystemPrompt();
      expect(result.systemPrompt).toContain('Shall I proceed');
    });
  });

  describe('MCP tools section', () => {
    it('includes all tool names when MCP available', () => {
      const result = generateSystemPrompt({ mcpToolsAvailable: true });
      for (const tool of MCP_TOOL_DESCRIPTIONS) {
        expect(result.systemPrompt).toContain(tool.name);
      }
    });

    it('excludes MCP section when disabled', () => {
      const result = generateSystemPrompt({ mcpToolsAvailable: false });
      expect(result.sections).not.toContain('mcp_tools');
      expect(result.systemPrompt).not.toContain('CVF MCP GUARD TOOLS');
    });

    it('includes mandatory usage rules', () => {
      const result = generateSystemPrompt();
      expect(result.systemPrompt).toContain('MANDATORY tool usage');
      expect(result.systemPrompt).toContain('cvf_evaluate_full');
    });
  });

  describe('user constraints', () => {
    it('includes user constraints when provided', () => {
      const result = generateSystemPrompt({
        userConstraints: ['Budget max $10', 'No external API calls'],
      });
      expect(result.sections).toContain('user_constraints');
      expect(result.systemPrompt).toContain('Budget max $10');
      expect(result.systemPrompt).toContain('No external API calls');
    });

    it('excludes section when no constraints', () => {
      const result = generateSystemPrompt();
      expect(result.sections).not.toContain('user_constraints');
    });

    it('numbers constraints', () => {
      const result = generateSystemPrompt({
        userConstraints: ['First', 'Second'],
      });
      expect(result.systemPrompt).toContain('1. First');
      expect(result.systemPrompt).toContain('2. Second');
    });
  });

  describe('failure mode', () => {
    it('includes failure mode section', () => {
      const result = generateSystemPrompt();
      expect(result.systemPrompt).toContain('FAILURE MODE');
    });

    it('includes stop instruction', () => {
      const result = generateSystemPrompt();
      expect(result.systemPrompt).toContain('STOP immediately');
    });

    it('includes priority override', () => {
      const result = generateSystemPrompt();
      expect(result.systemPrompt).toContain('priority over');
    });

    it('ends with END marker', () => {
      const result = generateSystemPrompt();
      expect(result.systemPrompt).toContain('END OF CVF SYSTEM PROMPT');
    });
  });
});
