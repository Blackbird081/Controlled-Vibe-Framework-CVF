/**
 * Tests for CVF CLI
 */

import { describe, it, expect } from 'vitest';
import { parseArgs, executeCommand, runCli, formatOutput } from './cli.js';

describe('parseArgs', () => {
  it('parses command', () => {
    const { command } = parseArgs(['evaluate']);
    expect(command).toBe('evaluate');
  });

  it('parses long flags', () => {
    const { flags } = parseArgs(['evaluate', '--phase', 'BUILD', '--risk', 'R1']);
    expect(flags.phase).toBe('BUILD');
    expect(flags.risk).toBe('R1');
  });

  it('parses short flags', () => {
    const { flags } = parseArgs(['evaluate', '-p', 'BUILD']);
    expect(flags.p).toBe('BUILD');
  });

  it('handles boolean flags', () => {
    const { flags } = parseArgs(['prompt', '--mcp']);
    expect(flags.mcp).toBe('true');
  });

  it('defaults to help when no command', () => {
    const { command } = parseArgs([]);
    expect(command).toBe('help');
  });

  it('handles multiple flags', () => {
    const { flags } = parseArgs(['eval', '--phase', 'BUILD', '--risk', 'R2', '--role', 'AI_AGENT', '--action', 'deploy']);
    expect(flags.phase).toBe('BUILD');
    expect(flags.risk).toBe('R2');
    expect(flags.role).toBe('AI_AGENT');
    expect(flags.action).toBe('deploy');
  });
});

describe('executeCommand', () => {
  describe('help', () => {
    it('returns help info', () => {
      const result = executeCommand('help', {});
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect((result.output as any).commands).toBeDefined();
    });

    it('returns help for unknown command', () => {
      const result = executeCommand('unknown-command', {});
      expect(result.command).toBe('help');
    });
  });

  describe('check-phase', () => {
    it('allows HUMAN in BUILD', () => {
      const result = executeCommand('check-phase', { phase: 'BUILD', role: 'HUMAN', action: 'code' });
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it('blocks AI_AGENT in DISCOVERY', () => {
      const result = executeCommand('check-phase', { phase: 'DISCOVERY', role: 'AI_AGENT', action: 'code' });
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    it('allows alias "phase"', () => {
      const result = executeCommand('phase', { phase: 'BUILD', role: 'HUMAN', action: 'code' });
      expect(result.success).toBe(true);
    });
  });

  describe('check-risk', () => {
    it('allows R0', () => {
      const result = executeCommand('check-risk', { risk: 'R0', role: 'AI_AGENT', action: 'read' });
      expect(result.success).toBe(true);
    });

    it('blocks R3 for AI_AGENT', () => {
      const result = executeCommand('check-risk', { risk: 'R3', role: 'AI_AGENT', action: 'delete' });
      expect(result.exitCode).toBe(1);
    });

    it('escalates R2 for AI_AGENT (exit 0 — escalation is not block)', () => {
      const result = executeCommand('check-risk', { risk: 'R2', role: 'AI_AGENT', action: 'modify' });
      expect(result.exitCode).toBe(0);
    });

    it('allows alias "risk"', () => {
      const result = executeCommand('risk', { risk: 'R0', action: 'test' });
      expect(result.success).toBe(true);
    });
  });

  describe('check-authority', () => {
    it('allows AI_AGENT for safe actions', () => {
      const result = executeCommand('check-authority', { role: 'AI_AGENT', action: 'write code' });
      expect(result.success).toBe(true);
    });

    it('blocks AI_AGENT from deploy', () => {
      const result = executeCommand('check-authority', { role: 'AI_AGENT', action: 'deploy to prod' });
      expect(result.success).toBe(false);
    });

    it('allows HUMAN for anything', () => {
      const result = executeCommand('check-authority', { role: 'HUMAN', action: 'deploy to prod' });
      expect(result.success).toBe(true);
    });

    it('allows alias "authority"', () => {
      const result = executeCommand('authority', { role: 'HUMAN', action: 'test' });
      expect(result.success).toBe(true);
    });
  });

  describe('evaluate (full pipeline)', () => {
    it('allows safe action', () => {
      const result = executeCommand('evaluate', {
        phase: 'BUILD', risk: 'R0', role: 'HUMAN', action: 'write code',
      });
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect((result.output as any).guardCount).toBe(6);
    });

    it('blocks AI_AGENT in DISCOVERY', () => {
      const result = executeCommand('evaluate', {
        phase: 'DISCOVERY', risk: 'R0', role: 'AI_AGENT', action: 'code', agent: 'bot-1',
      });
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    it('returns agentGuidance on block', () => {
      const result = executeCommand('evaluate', {
        phase: 'DISCOVERY', risk: 'R0', role: 'AI_AGENT', action: 'code', agent: 'bot-1',
      });
      expect((result.output as any).agentGuidance).toBeDefined();
    });

    it('handles comma-separated files', () => {
      const result = executeCommand('evaluate', {
        phase: 'BUILD', role: 'HUMAN', action: 'edit', files: 'a.ts,b.ts',
      });
      expect(result.success).toBe(true);
    });

    it('allows alias "eval"', () => {
      const result = executeCommand('eval', { phase: 'BUILD', role: 'HUMAN', action: 'test' });
      expect(result.success).toBe(true);
    });
  });

  describe('prompt', () => {
    it('generates system prompt', () => {
      const result = executeCommand('prompt', { phase: 'BUILD', role: 'AI_AGENT' });
      expect(result.success).toBe(true);
      expect((result.output as any).systemPrompt).toBeDefined();
      expect((result.output as any).systemPrompt.length).toBeGreaterThan(100);
    });

    it('includes sections list', () => {
      const result = executeCommand('prompt', {});
      expect((result.output as any).sections).toBeDefined();
      expect((result.output as any).sections.length).toBeGreaterThan(5);
    });

    it('includes estimated tokens', () => {
      const result = executeCommand('prompt', {});
      expect((result.output as any).estimatedTokens).toBeGreaterThan(0);
    });

    it('respects project name', () => {
      const result = executeCommand('prompt', { project: 'MyApp' });
      expect((result.output as any).systemPrompt).toContain('MyApp');
    });

    it('handles custom constraints', () => {
      const result = executeCommand('prompt', { constraints: 'No API calls,Max $5' });
      expect((result.output as any).systemPrompt).toContain('No API calls');
      expect((result.output as any).systemPrompt).toContain('Max $5');
    });
  });

  describe('advance', () => {
    it('advances phase', () => {
      const result = executeCommand('advance', { evidence: 'Tests pass' });
      expect(result.success).toBe(true);
      expect((result.output as any).evidence).toBe('Tests pass');
    });
  });

  describe('audit', () => {
    it('returns audit log', () => {
      const result = executeCommand('audit', {});
      expect(result.success).toBe(true);
      expect((result.output as any).totalEntries).toBeDefined();
    });

    it('respects limit', () => {
      const result = executeCommand('audit', { limit: '5' });
      expect(result.success).toBe(true);
    });
  });

  describe('status', () => {
    it('returns status info', () => {
      const result = executeCommand('status', {});
      expect(result.success).toBe(true);
      expect((result.output as any).version).toBe('1.7.0');
      expect((result.output as any).guardCount).toBe(6);
    });
  });
});

describe('runCli', () => {
  it('runs full pipeline from argv', () => {
    const result = runCli(['evaluate', '--phase', 'BUILD', '--role', 'HUMAN', '--action', 'test']);
    expect(result.success).toBe(true);
  });

  it('runs help with no args', () => {
    const result = runCli([]);
    expect(result.command).toBe('help');
  });
});

describe('formatOutput', () => {
  it('formats as JSON', () => {
    const result = executeCommand('status', {});
    const json = formatOutput(result, 'json');
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('formats as text', () => {
    const result = executeCommand('status', {});
    const text = formatOutput(result, 'text');
    expect(text).toContain('[CVF]');
    expect(text).toContain('OK');
  });

  it('shows FAILED for blocked actions', () => {
    const result = executeCommand('check-phase', { phase: 'DISCOVERY', role: 'AI_AGENT', action: 'code' });
    const text = formatOutput(result, 'text');
    expect(text).toContain('FAILED');
  });
});
