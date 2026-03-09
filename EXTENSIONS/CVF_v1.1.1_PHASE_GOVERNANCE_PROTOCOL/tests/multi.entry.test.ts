/**
 * Multi-Entry Guard Enforcement Tests — Track IV Phase B.2
 *
 * Tests CLI, MCP, API adapters and the unified GuardGateway.
 * Validates that all entry points enforce identical governance rules.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CliAdapter } from '../governance/guard_runtime/entry/cli.adapter.js';
import { McpAdapter } from '../governance/guard_runtime/entry/mcp.adapter.js';
import { ApiAdapter } from '../governance/guard_runtime/entry/api.adapter.js';
import { GuardGateway } from '../governance/guard_runtime/entry/guard.gateway.js';
import { GuardRuntimeEngine } from '../governance/guard_runtime/guard.runtime.engine.js';
import { PhaseGateGuard } from '../governance/guard_runtime/guards/phase.gate.guard.js';
import { RiskGateGuard } from '../governance/guard_runtime/guards/risk.gate.guard.js';
import { AuthorityGateGuard } from '../governance/guard_runtime/guards/authority.gate.guard.js';
import { MutationBudgetGuard } from '../governance/guard_runtime/guards/mutation.budget.guard.js';
import { ScopeGuard } from '../governance/guard_runtime/guards/scope.guard.js';
import { AuditTrailGuard } from '../governance/guard_runtime/guards/audit.trail.guard.js';

function createEngine(): GuardRuntimeEngine {
  const engine = new GuardRuntimeEngine();
  engine.registerGuard(new PhaseGateGuard());
  engine.registerGuard(new RiskGateGuard());
  engine.registerGuard(new AuthorityGateGuard());
  engine.registerGuard(new MutationBudgetGuard());
  engine.registerGuard(new ScopeGuard());
  engine.registerGuard(new AuditTrailGuard());
  return engine;
}

// --- CliAdapter ---

describe('CliAdapter', () => {
  const adapter = new CliAdapter();

  it('normalizes basic CLI input', () => {
    const req = adapter.normalize({
      requestId: 'cli-1',
      action: 'write_code',
      phase: 'BUILD',
      risk: 'R1',
      role: 'AI_AGENT',
      agentId: 'claude',
    });
    expect(req.requestId).toBe('cli-1');
    expect(req.action).toBe('write_code');
    expect(req.phase).toBe('BUILD');
    expect(req.riskLevel).toBe('R1');
    expect(req.role).toBe('AI_AGENT');
    expect(req.agentId).toBe('claude');
  });

  it('defaults to BUILD phase when missing', () => {
    const req = adapter.normalize({ action: 'test' });
    expect(req.phase).toBe('BUILD');
  });

  it('defaults to R1 risk when missing', () => {
    const req = adapter.normalize({ action: 'test' });
    expect(req.riskLevel).toBe('R1');
  });

  it('defaults to AI_AGENT role when missing', () => {
    const req = adapter.normalize({ action: 'test' });
    expect(req.role).toBe('AI_AGENT');
  });

  it('parses comma-separated file list', () => {
    const req = adapter.normalize({ action: 'test', files: 'a.ts,b.ts,c.ts' });
    expect(req.targetFiles).toEqual(['a.ts', 'b.ts', 'c.ts']);
  });

  it('parses array file list', () => {
    const req = adapter.normalize({ action: 'test', files: ['a.ts', 'b.ts'] });
    expect(req.targetFiles).toEqual(['a.ts', 'b.ts']);
  });

  it('generates requestId when missing', () => {
    const req = adapter.normalize({ action: 'test' });
    expect(req.requestId).toMatch(/^cli-/);
  });

  it('formats ALLOW response', () => {
    const engine = createEngine();
    const result = engine.evaluate({
      requestId: 'cli-fmt', phase: 'BUILD', riskLevel: 'R0', role: 'HUMAN', action: 'write_code',
    });
    const resp = adapter.formatResponse(result, 'cli-fmt');
    expect(resp.entryPoint).toBe('CLI');
    expect(resp.allowed).toBe(true);
    expect(resp.decision).toBe('ALLOW');
  });

  it('formats BLOCK response with reason', () => {
    const engine = createEngine();
    const result = engine.evaluate({
      requestId: 'cli-blk', phase: 'DISCOVERY', riskLevel: 'R0', role: 'AI_AGENT', agentId: 'a', action: 'explore',
    });
    const resp = adapter.formatResponse(result, 'cli-blk');
    expect(resp.allowed).toBe(false);
    expect(resp.decision).toBe('BLOCK');
    expect(resp.reason.length).toBeGreaterThan(0);
  });
});

// --- McpAdapter ---

describe('McpAdapter', () => {
  const adapter = new McpAdapter();

  it('normalizes MCP tool call', () => {
    const req = adapter.normalize({
      id: 'mcp-1',
      tool_name: 'write_file',
      arguments: { agentId: 'claude', targetFiles: ['src/app.ts'], traceHash: 'h1' },
    });
    expect(req.requestId).toBe('mcp-1');
    expect(req.action).toBe('write_file');
    expect(req.role).toBe('AI_AGENT');
    expect(req.agentId).toBe('claude');
    expect(req.targetFiles).toEqual(['src/app.ts']);
  });

  it('resolves phase from tool name (write → BUILD)', () => {
    const req = adapter.normalize({ tool_name: 'write_code', arguments: {} });
    expect(req.phase).toBe('BUILD');
  });

  it('resolves phase from tool name (review → REVIEW)', () => {
    const req = adapter.normalize({ tool_name: 'review_pr', arguments: {} });
    expect(req.phase).toBe('REVIEW');
  });

  it('resolves phase from tool name (discover → DISCOVERY)', () => {
    const req = adapter.normalize({ tool_name: 'discover_requirements', arguments: {} });
    expect(req.phase).toBe('DISCOVERY');
  });

  it('resolves risk from tool name (delete → R3)', () => {
    const req = adapter.normalize({ tool_name: 'delete_database', arguments: {} });
    expect(req.riskLevel).toBe('R3');
  });

  it('resolves risk from tool name (deploy → R2)', () => {
    const req = adapter.normalize({ tool_name: 'deploy_app', arguments: {} });
    expect(req.riskLevel).toBe('R2');
  });

  it('resolves risk from tool name (write → R1)', () => {
    const req = adapter.normalize({ tool_name: 'write_file', arguments: {} });
    expect(req.riskLevel).toBe('R1');
  });

  it('uses explicit riskLevel from arguments', () => {
    const req = adapter.normalize({ tool_name: 'read_data', arguments: { riskLevel: 'R3' } });
    expect(req.riskLevel).toBe('R3');
  });

  it('extracts single file from args', () => {
    const req = adapter.normalize({ tool_name: 'edit', arguments: { file: 'src/a.ts' } });
    expect(req.targetFiles).toEqual(['src/a.ts']);
  });

  it('generates requestId when missing', () => {
    const req = adapter.normalize({ tool_name: 'test' });
    expect(req.requestId).toMatch(/^mcp-/);
  });

  it('formats response correctly', () => {
    const engine = createEngine();
    const result = engine.evaluate({
      requestId: 'mcp-fmt', phase: 'BUILD', riskLevel: 'R0', role: 'HUMAN', action: 'read',
    });
    const resp = adapter.formatResponse(result, 'mcp-fmt');
    expect(resp.entryPoint).toBe('MCP');
    expect(resp.allowed).toBe(true);
  });
});

// --- ApiAdapter ---

describe('ApiAdapter', () => {
  const adapter = new ApiAdapter();

  it('normalizes valid API request', () => {
    const req = adapter.normalize({
      requestId: 'api-1',
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'AI_AGENT',
      agentId: 'claude',
      action: 'write_code',
      targetFiles: ['src/app.ts'],
    });
    expect(req.requestId).toBe('api-1');
    expect(req.phase).toBe('BUILD');
    expect(req.riskLevel).toBe('R1');
    expect(req.role).toBe('AI_AGENT');
  });

  it('throws on invalid phase', () => {
    expect(() => adapter.normalize({
      phase: 'INVALID', riskLevel: 'R0', role: 'HUMAN', action: 'test',
    })).toThrow('Invalid phase');
  });

  it('throws on invalid riskLevel', () => {
    expect(() => adapter.normalize({
      phase: 'BUILD', riskLevel: 'R9', role: 'HUMAN', action: 'test',
    })).toThrow('Invalid riskLevel');
  });

  it('throws on invalid role', () => {
    expect(() => adapter.normalize({
      phase: 'BUILD', riskLevel: 'R0', role: 'ADMIN', action: 'test',
    })).toThrow('Invalid role');
  });

  it('generates requestId when missing', () => {
    const req = adapter.normalize({
      phase: 'BUILD', riskLevel: 'R0', role: 'HUMAN', action: 'test',
    });
    expect(req.requestId).toMatch(/^api-/);
  });

  it('formats response correctly', () => {
    const engine = createEngine();
    const result = engine.evaluate({
      requestId: 'api-fmt', phase: 'BUILD', riskLevel: 'R0', role: 'HUMAN', action: 'read',
    });
    const resp = adapter.formatResponse(result, 'api-fmt');
    expect(resp.entryPoint).toBe('API');
    expect(resp.allowed).toBe(true);
  });
});

// --- GuardGateway ---

describe('GuardGateway', () => {
  let gateway: GuardGateway;

  beforeEach(() => {
    gateway = new GuardGateway(createEngine());
  });

  it('supports CLI, MCP, API entry points', () => {
    expect(gateway.getSupportedEntryPoints()).toContain('CLI');
    expect(gateway.getSupportedEntryPoints()).toContain('MCP');
    expect(gateway.getSupportedEntryPoints()).toContain('API');
  });

  it('processes CLI request', () => {
    const resp = gateway.process('CLI', {
      requestId: 'gw-cli-1', action: 'write_code', phase: 'BUILD',
      risk: 'R1', role: 'AI_AGENT', agentId: 'claude',
    });
    expect(resp.entryPoint).toBe('CLI');
    expect(resp.allowed).toBe(true);
  });

  it('processes MCP request', () => {
    const resp = gateway.process('MCP', {
      id: 'gw-mcp-1', tool_name: 'write_file',
      arguments: { agentId: 'claude', targetFiles: ['src/app.ts'] },
    });
    expect(resp.entryPoint).toBe('MCP');
    expect(resp.requestId).toBe('gw-mcp-1');
  });

  it('processes API request', () => {
    const resp = gateway.process('API', {
      requestId: 'gw-api-1', phase: 'BUILD', riskLevel: 'R0',
      role: 'HUMAN', action: 'write_code',
    });
    expect(resp.entryPoint).toBe('API');
    expect(resp.allowed).toBe(true);
  });

  it('blocks AI_AGENT in DISCOVERY via CLI', () => {
    const resp = gateway.process('CLI', {
      requestId: 'gw-blk-1', action: 'explore', phase: 'DISCOVERY',
      role: 'AI_AGENT', agentId: 'agent-1',
    });
    expect(resp.allowed).toBe(false);
    expect(resp.decision).toBe('BLOCK');
  });

  it('blocks AI_AGENT in DISCOVERY via MCP', () => {
    const resp = gateway.process('MCP', {
      id: 'gw-blk-2', tool_name: 'discover_requirements',
      arguments: { agentId: 'agent-1' },
    });
    expect(resp.allowed).toBe(false);
    expect(resp.decision).toBe('BLOCK');
  });

  it('blocks AI_AGENT in DISCOVERY via API', () => {
    const resp = gateway.process('API', {
      requestId: 'gw-blk-3', phase: 'DISCOVERY', riskLevel: 'R0',
      role: 'AI_AGENT', agentId: 'agent-1', action: 'explore',
    });
    expect(resp.allowed).toBe(false);
    expect(resp.decision).toBe('BLOCK');
  });

  it('enforces identical governance across all entry points', () => {
    const cliResp = gateway.process('CLI', {
      requestId: 'same-1', action: 'deploy', phase: 'BUILD',
      risk: 'R0', role: 'AI_AGENT', agentId: 'a1',
    });
    const mcpResp = gateway.process('MCP', {
      id: 'same-2', tool_name: 'deploy',
      arguments: { agentId: 'a1', riskLevel: 'R0' },
    });
    const apiResp = gateway.process('API', {
      requestId: 'same-3', phase: 'BUILD', riskLevel: 'R0',
      role: 'AI_AGENT', agentId: 'a1', action: 'deploy',
    });
    // All should block AI_AGENT from deploy
    expect(cliResp.decision).toBe('BLOCK');
    expect(mcpResp.decision).toBe('BLOCK');
    expect(apiResp.decision).toBe('BLOCK');
  });

  it('maintains request log', () => {
    gateway.process('CLI', { requestId: 'log-1', action: 'test', phase: 'BUILD', role: 'HUMAN' });
    gateway.process('API', { requestId: 'log-2', phase: 'BUILD', riskLevel: 'R0', role: 'HUMAN', action: 'test' });
    expect(gateway.getRequestLog()).toHaveLength(2);
  });

  it('clears request log', () => {
    gateway.process('CLI', { requestId: 'clr-1', action: 'test', phase: 'BUILD', role: 'HUMAN' });
    gateway.clearRequestLog();
    expect(gateway.getRequestLog()).toHaveLength(0);
  });

  it('getAdapter returns correct adapter', () => {
    expect(gateway.getAdapter('CLI')?.type).toBe('CLI');
    expect(gateway.getAdapter('MCP')?.type).toBe('MCP');
    expect(gateway.getAdapter('API')?.type).toBe('API');
  });
});
