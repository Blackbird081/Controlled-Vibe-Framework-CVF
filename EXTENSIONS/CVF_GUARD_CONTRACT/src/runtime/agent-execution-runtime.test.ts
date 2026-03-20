/**
 * CVF Agent Execution Runtime — Comprehensive Test Suite
 * =======================================================
 * 40+ tests covering the full execution pipeline, guard integration,
 * skill validation, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  AgentExecutionRuntime,
  DryRunProvider,
  type RuntimeConfig,
  type ExecutionProvider,
} from './agent-execution-runtime';
import {
  SkillRegistry,
  createDefaultSkillRegistry,
  type SkillDefinition,
} from './skill-registry';
import { createGuardEngine } from '../index';

// ─── Helpers ──────────────────────────────────────────────────────────

function defaultConfig(overrides?: Partial<RuntimeConfig>): RuntimeConfig {
  return {
    phase: 'BUILD',
    riskLevel: 'R0',
    role: 'HUMAN',
    agentId: 'test-agent',
    channel: 'cli',
    liveExecution: false,
    metadata: {
      ai_commit: {
        commitId: 'runtime-test-commit',
        agentId: 'test-agent',
        timestamp: Date.now(),
      },
    },
    ...overrides,
  };
}

function createRuntime(configOverrides?: Partial<RuntimeConfig>, provider?: ExecutionProvider) {
  const engine = createGuardEngine();
  return new AgentExecutionRuntime(
    engine,
    provider ?? new DryRunProvider(),
    defaultConfig(configOverrides),
  );
}

// ─── DryRunProvider ───────────────────────────────────────────────────

describe('DryRunProvider', () => {
  it('returns dry-run output', async () => {
    const provider = new DryRunProvider();
    const result = await provider.execute('write code', { lang: 'ts' });
    expect(result).toContain('[DRY-RUN]');
    expect(result).toContain('write code');
  });

  it('handles no parameters', async () => {
    const provider = new DryRunProvider();
    const result = await provider.execute('analyze');
    expect(result).toContain('[DRY-RUN]');
  });
});

// ─── parseIntent ──────────────────────────────────────────────────────

describe('AgentExecutionRuntime.parseIntent', () => {
  const runtime = createRuntime();

  it('parses "create" action', () => {
    const intent = runtime.parseIntent('create a new component for the dashboard');
    expect(intent.action).toContain('create');
    expect(intent.confidence).toBe(0.9);
  });

  it('parses "fix" action', () => {
    const intent = runtime.parseIntent('fix the bug in auth.ts');
    expect(intent.action).toContain('fix');
    expect(intent.targetFiles).toContain('auth.ts');
  });

  it('parses "deploy" action', () => {
    const intent = runtime.parseIntent('deploy the app to production');
    expect(intent.action).toContain('deploy');
  });

  it('extracts file targets', () => {
    const intent = runtime.parseIntent('refactor utils/helpers.ts and models/user.ts');
    expect(intent.targetFiles).toContain('utils/helpers.ts');
    expect(intent.targetFiles).toContain('models/user.ts');
  });

  it('handles unknown action with low confidence', () => {
    const intent = runtime.parseIntent('something random');
    expect(intent.action).toContain('execute');
    expect(intent.confidence).toBe(0.5);
  });

  it('handles empty input', () => {
    const intent = runtime.parseIntent('');
    expect(intent.action).toBeDefined();
  });
});

// ─── preCheck ─────────────────────────────────────────────────────────

describe('AgentExecutionRuntime.preCheck', () => {
  it('allows HUMAN in BUILD phase', () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'HUMAN' });
    const intent = runtime.parseIntent('write some code');
    const result = runtime.preCheck(intent);
    expect(result.finalDecision).toBe('ALLOW');
  });

  it('allows AI_AGENT in BUILD phase with low risk', () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'AI_AGENT', riskLevel: 'R0' });
    const intent = runtime.parseIntent('write some code');
    const result = runtime.preCheck(intent);
    expect(result.finalDecision).toBe('ALLOW');
  });

  it('blocks AI_AGENT in INTAKE phase', () => {
    const runtime = createRuntime({ phase: 'INTAKE', role: 'AI_AGENT' });
    const intent = runtime.parseIntent('write some code');
    const result = runtime.preCheck(intent);
    expect(result.finalDecision).toBe('BLOCK');
  });

  it('blocks AI_AGENT with R3 risk', () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'AI_AGENT', riskLevel: 'R3' });
    const intent = runtime.parseIntent('write some code');
    const result = runtime.preCheck(intent);
    expect(result.finalDecision).toBe('BLOCK');
  });

  it('escalates AI_AGENT with R2 risk', () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'AI_AGENT', riskLevel: 'R2' });
    const intent = runtime.parseIntent('write some code');
    const result = runtime.preCheck(intent);
    // R2 for AI_AGENT should escalate
    expect(['ESCALATE', 'BLOCK']).toContain(result.finalDecision);
  });

  it('respects skill required phase', () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'AI_AGENT' });
    const intent = runtime.parseIntent('generate docs');
    const skill: SkillDefinition = {
      id: 'test_skill',
      name: 'Test Skill',
      domain: 'test',
      description: 'Test',
      requiredPhase: 'REVIEW',
      riskLevel: 'R0',
    };
    // Skill requires REVIEW but we're in BUILD — guard should check REVIEW phase
    const result = runtime.preCheck(intent, skill);
    // AI_AGENT in REVIEW phase should BLOCK (not allowed)
    expect(result.finalDecision).toBe('BLOCK');
  });

  it('elevates risk when skill has higher risk', () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'AI_AGENT', riskLevel: 'R0' });
    const intent = runtime.parseIntent('deploy');
    const skill: SkillDefinition = {
      id: 'deploy_prod',
      name: 'Deploy Production',
      domain: 'deployment',
      description: 'Deploy to prod',
      riskLevel: 'R3',
    };
    const result = runtime.preCheck(intent, skill);
    // R3 + AI_AGENT = BLOCK
    expect(result.finalDecision).toBe('BLOCK');
  });
});

// ─── execute ──────────────────────────────────────────────────────────

describe('AgentExecutionRuntime.execute', () => {
  it('completes when guard allows', async () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'HUMAN' });
    const intent = runtime.parseIntent('write code');
    const guardResult = runtime.preCheck(intent);
    const result = await runtime.execute(intent, guardResult);
    expect(result.status).toBe('COMPLETED');
    expect(result.output).toContain('[DRY-RUN]');
  });

  it('blocks when guard blocks', async () => {
    const runtime = createRuntime({ phase: 'INTAKE', role: 'AI_AGENT' });
    const intent = runtime.parseIntent('write code');
    const guardResult = runtime.preCheck(intent);
    const result = await runtime.execute(intent, guardResult);
    expect(result.status).toBe('BLOCKED');
    expect(result.error).toContain('Guard blocked');
  });

  it('returns NEEDS_APPROVAL for governed escalation', async () => {
    const runtime = createRuntime({
      phase: 'BUILD',
      role: 'AI_AGENT',
      riskLevel: 'R2',
      controlMode: 'governed',
    });
    const intent = runtime.parseIntent('write code');
    const guardResult = runtime.preCheck(intent);
    const result = await runtime.execute(intent, guardResult);
    expect(result.status).toBe('NEEDS_APPROVAL');
    expect(result.metadata?.governance).toBeDefined();
    expect((result.metadata?.governance as any).approvalCheckpoint.status).toBe('PENDING');
  });

  it('fails when provider throws', async () => {
    const failingProvider: ExecutionProvider = {
      name: 'failing',
      execute: async () => { throw new Error('Provider crash'); },
    };
    const runtime = createRuntime({ phase: 'BUILD', role: 'HUMAN' }, failingProvider);
    const intent = runtime.parseIntent('write code');
    const guardResult = runtime.preCheck(intent);
    const result = await runtime.execute(intent, guardResult);
    expect(result.status).toBe('FAILED');
    expect(result.error).toContain('Provider crash');
  });

  it('tracks execution time', async () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'HUMAN' });
    const intent = runtime.parseIntent('write code');
    const guardResult = runtime.preCheck(intent);
    const result = await runtime.execute(intent, guardResult);
    expect(result.durationMs).toBeDefined();
    expect(result.durationMs!).toBeGreaterThanOrEqual(0);
  });

  it('stores guard decision in result', async () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'HUMAN' });
    const intent = runtime.parseIntent('write code');
    const guardResult = runtime.preCheck(intent);
    const result = await runtime.execute(intent, guardResult);
    expect(result.guardDecision).toBeDefined();
    expect(result.guardDecision!.finalDecision).toBe('ALLOW');
  });

  it('records governed execution lineage in metadata', async () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'HUMAN', controlMode: 'governed' });
    const intent = runtime.parseIntent('write code');
    const guardResult = runtime.preCheck(intent);
    const result = await runtime.execute(intent, guardResult);
    const governance = result.metadata?.governance as any;
    expect(governance.controlMode).toBe('governed');
    expect(governance.artifacts.map((artifact: any) => artifact.type)).toEqual(['INTENT', 'EXECUTION']);
    expect(governance.lineageStatus).toBe('READY_FOR_REVIEW');
  });
});

// ─── postCheck ────────────────────────────────────────────────────────

describe('AgentExecutionRuntime.postCheck', () => {
  it('valid for completed execution', async () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'HUMAN' });
    const result = await runtime.run('write code');
    const check = runtime.postCheck(result);
    expect(check.valid).toBe(true);
    expect(check.issues).toHaveLength(0);
  });

  it('invalid for blocked execution', async () => {
    const runtime = createRuntime({ phase: 'INTAKE', role: 'AI_AGENT' });
    const result = await runtime.run('write code');
    const check = runtime.postCheck(result);
    expect(check.valid).toBe(false);
    expect(check.issues.length).toBeGreaterThan(0);
  });

  it('invalid for approval-pending execution', async () => {
    const runtime = createRuntime({
      phase: 'BUILD',
      role: 'AI_AGENT',
      riskLevel: 'R2',
      controlMode: 'governed',
    });
    const result = await runtime.run('write code');
    const check = runtime.postCheck(result);
    expect(result.status).toBe('NEEDS_APPROVAL');
    expect(check.valid).toBe(false);
    expect(check.issues[0]).toContain('waiting for approval');
  });

  it('invalid for failed execution', () => {
    const runtime = createRuntime();
    const check = runtime.postCheck({
      requestId: 'r1',
      status: 'FAILED',
      error: 'something broke',
      startedAt: new Date().toISOString(),
    });
    expect(check.valid).toBe(false);
    expect(check.issues[0]).toContain('Execution failed');
  });
});

// ─── Full Pipeline (run) ──────────────────────────────────────────────

describe('AgentExecutionRuntime.run (full pipeline)', () => {
  it('completes full pipeline for safe HUMAN action', async () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'HUMAN', riskLevel: 'R0' });
    const result = await runtime.run('create a new component');
    expect(result.status).toBe('COMPLETED');
    expect(result.output).toContain('[DRY-RUN]');
  });

  it('blocks full pipeline for AI_AGENT in wrong phase', async () => {
    const runtime = createRuntime({ phase: 'INTAKE', role: 'AI_AGENT', riskLevel: 'R0' });
    const result = await runtime.run('write code');
    expect(result.status).toBe('BLOCKED');
  });

  it('blocks full pipeline for high-risk AI_AGENT action', async () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'AI_AGENT', riskLevel: 'R3' });
    const result = await runtime.run('deploy to production');
    expect(result.status).toBe('BLOCKED');
  });

  it('stores results in execution log', async () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'HUMAN' });
    await runtime.run('task 1');
    await runtime.run('task 2');
    expect(runtime.getExecutionLog().length).toBe(2);
  });

  it('respects skill constraints in pipeline', async () => {
    const runtime = createRuntime({ phase: 'BUILD', role: 'AI_AGENT', riskLevel: 'R0' });
    const skill: SkillDefinition = {
      id: 'dangerous',
      name: 'Dangerous',
      domain: 'test',
      description: 'Dangerous skill',
      riskLevel: 'R3', // Escalates session risk
    };
    const result = await runtime.run('do something dangerous', skill);
    expect(result.status).toBe('BLOCKED');
  });
});

// ─── Config ───────────────────────────────────────────────────────────

describe('AgentExecutionRuntime config', () => {
  it('returns config copy', () => {
    const runtime = createRuntime({ phase: 'BUILD' });
    const config = runtime.getConfig();
    expect(config.phase).toBe('BUILD');
  });

  it('updates config', () => {
    const runtime = createRuntime({ phase: 'BUILD' });
    runtime.updateConfig({ phase: 'REVIEW' });
    expect(runtime.getConfig().phase).toBe('REVIEW');
  });
});

// ─── SkillRegistry ────────────────────────────────────────────────────

describe('SkillRegistry', () => {
  it('registers and retrieves skills', () => {
    const registry = new SkillRegistry();
    registry.register({
      id: 'test', name: 'Test', domain: 'd', description: 'desc', riskLevel: 'R0',
    });
    expect(registry.get('test')).toBeDefined();
    expect(registry.getCount()).toBe(1);
  });

  it('rejects duplicate skills', () => {
    const registry = new SkillRegistry();
    registry.register({
      id: 'test', name: 'Test', domain: 'd', description: 'desc', riskLevel: 'R0',
    });
    expect(() => registry.register({
      id: 'test', name: 'Test2', domain: 'd', description: 'desc', riskLevel: 'R0',
    })).toThrow();
  });

  it('filters by domain', () => {
    const registry = createDefaultSkillRegistry();
    const codeSkills = registry.getByDomain('code_generation');
    expect(codeSkills.length).toBeGreaterThan(0);
    for (const s of codeSkills) {
      expect(s.domain).toBe('code_generation');
    }
  });

  it('filters by phase', () => {
    const registry = createDefaultSkillRegistry();
    const buildSkills = registry.getByPhase('BUILD');
    for (const s of buildSkills) {
      expect(!s.requiredPhase || s.requiredPhase === 'BUILD').toBe(true);
    }
  });

  it('validates skill for compatible context', () => {
    const registry = createDefaultSkillRegistry();
    const result = registry.validateSkillForContext('code_gen_component', 'BUILD', 'R1');
    expect(result.allowed).toBe(true);
  });

  it('rejects skill in wrong phase', () => {
    const registry = createDefaultSkillRegistry();
    const result = registry.validateSkillForContext('code_gen_component', 'INTAKE', 'R0');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('requires phase BUILD');
  });

  it('normalizes legacy DISCOVERY alias when validating skill context', () => {
    const registry = createDefaultSkillRegistry();
    const result = registry.validateSkillForContext('code_gen_component', 'DISCOVERY', 'R0');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('current phase is INTAKE');
  });

  it('rejects skill with higher risk than session', () => {
    const registry = createDefaultSkillRegistry();
    const result = registry.validateSkillForContext('deploy_staging', 'REVIEW', 'R0');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('risk R2');
  });

  it('returns error for unknown skill', () => {
    const registry = createDefaultSkillRegistry();
    const result = registry.validateSkillForContext('nonexistent', 'BUILD', 'R0');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('not found');
  });
});

// ─── createDefaultSkillRegistry ───────────────────────────────────────

describe('createDefaultSkillRegistry', () => {
  it('creates registry with 10 default skills', () => {
    const registry = createDefaultSkillRegistry();
    expect(registry.getCount()).toBe(10);
  });

  it('has skills across multiple domains', () => {
    const registry = createDefaultSkillRegistry();
    const domains = new Set(registry.getAll().map((s) => s.domain));
    expect(domains.size).toBeGreaterThanOrEqual(4);
  });

  it('all skills have required fields', () => {
    const registry = createDefaultSkillRegistry();
    for (const skill of registry.getAll()) {
      expect(skill.id).toBeTruthy();
      expect(skill.name).toBeTruthy();
      expect(skill.domain).toBeTruthy();
      expect(skill.description).toBeTruthy();
      expect(['R0', 'R1', 'R2', 'R3']).toContain(skill.riskLevel);
    }
  });

  it('deploy_production requires REVIEW phase + R3 risk', () => {
    const registry = createDefaultSkillRegistry();
    const skill = registry.get('deploy_production');
    expect(skill).toBeDefined();
    expect(skill!.requiredPhase).toBe('REVIEW');
    expect(skill!.riskLevel).toBe('R3');
  });
});
