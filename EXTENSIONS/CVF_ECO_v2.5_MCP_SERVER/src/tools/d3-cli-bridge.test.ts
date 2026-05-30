/**
 * D3 CLI Bridge Tests — cvf.mcpCliBridge.delta.d3.v1
 * Tests: cvf_invoke_cli_stage (command whitelist, role auth, runCli integration)
 */

import { describe, it, expect } from 'vitest';
import { runCli } from '../cli/cli.js';

const D3_CONTRACT = 'cvf.mcpCliBridge.delta.d3.v1';
const D3_ALLOWED_ROLES = new Set(['OPERATOR', 'ORCHESTRATOR', 'AI_AGENT']);
const D3_COMMAND_WHITELIST = new Set(['evaluate', 'status', 'help']);

// Inline implementation mirroring index.ts logic
function invokeCliStage(args: {
  command: string;
  agentRole: string;
  flags?: Record<string, string>;
  receiptRef?: string;
}): {
  contractVersion: string;
  tool: string;
  accepted: boolean;
  command: string;
  auditRecordId: string;
  rejectionReason?: string;
  cliSuccess?: boolean;
  exitCode?: number;
  output?: Record<string, unknown>;
  invokedAt: string;
} {
  const role = (args.agentRole || '').toUpperCase();
  const command = (args.command || '').toLowerCase().trim();

  if (!D3_ALLOWED_ROLES.has(role)) {
    return {
      contractVersion: D3_CONTRACT, tool: 'cvf_invoke_cli_stage',
      accepted: false, command, auditRecordId: `d3-reject-test`,
      rejectionReason: `role_not_authorized: role "${args.agentRole}" is not in allowed roles`,
      invokedAt: new Date().toISOString(),
    };
  }

  if (!D3_COMMAND_WHITELIST.has(command)) {
    return {
      contractVersion: D3_CONTRACT, tool: 'cvf_invoke_cli_stage',
      accepted: false, command, auditRecordId: `d3-reject-test`,
      rejectionReason: `command_not_whitelisted: "${command}" is not in allowed commands`,
      invokedAt: new Date().toISOString(),
    };
  }

  const auditRecordId = `d3-cli-test`;
  const argv: string[] = [command];
  if (args.flags) {
    for (const [key, value] of Object.entries(args.flags)) {
      argv.push(`--${key}`, String(value));
    }
  }

  let cliResult: ReturnType<typeof runCli>;
  try {
    cliResult = runCli(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      contractVersion: D3_CONTRACT, tool: 'cvf_invoke_cli_stage',
      accepted: false, command, auditRecordId,
      rejectionReason: `cli_execution_error: ${message}`,
      invokedAt: new Date().toISOString(),
    };
  }

  return {
    contractVersion: D3_CONTRACT, tool: 'cvf_invoke_cli_stage',
    accepted: true, command, auditRecordId,
    cliSuccess: cliResult.success,
    exitCode: cliResult.exitCode,
    output: cliResult.output as Record<string, unknown>,
    invokedAt: new Date().toISOString(),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('cvf_invoke_cli_stage', () => {
  it('returns correct contract version', () => {
    const r = invokeCliStage({ command: 'status', agentRole: 'OPERATOR' });
    expect(r.contractVersion).toBe(D3_CONTRACT);
    expect(r.tool).toBe('cvf_invoke_cli_stage');
  });

  it('accepts OPERATOR role with status command', () => {
    const r = invokeCliStage({ command: 'status', agentRole: 'OPERATOR' });
    expect(r.accepted).toBe(true);
    expect(r.command).toBe('status');
    expect(r.cliSuccess).toBe(true);
    expect(r.exitCode).toBe(0);
    expect(r.auditRecordId).toBeTruthy();
    expect(r.invokedAt).toBeTruthy();
  });

  it('accepts AI_AGENT role', () => {
    const r = invokeCliStage({ command: 'status', agentRole: 'AI_AGENT' });
    expect(r.accepted).toBe(true);
  });

  it('accepts ORCHESTRATOR role', () => {
    const r = invokeCliStage({ command: 'status', agentRole: 'ORCHESTRATOR' });
    expect(r.accepted).toBe(true);
  });

  it('normalizes command to lowercase', () => {
    const r = invokeCliStage({ command: 'STATUS', agentRole: 'OPERATOR' });
    expect(r.accepted).toBe(true);
    expect(r.command).toBe('status');
  });

  it('normalizes role to uppercase', () => {
    const r = invokeCliStage({ command: 'status', agentRole: 'operator' });
    expect(r.accepted).toBe(true);
  });

  it('accepts help command', () => {
    const r = invokeCliStage({ command: 'help', agentRole: 'OPERATOR' });
    expect(r.accepted).toBe(true);
  });

  it('accepts evaluate command', () => {
    const r = invokeCliStage({
      command: 'evaluate',
      agentRole: 'OPERATOR',
      flags: { phase: 'BUILD', role: 'HUMAN', action: 'test' },
    });
    expect(r.accepted).toBe(true);
  });

  it('rejects unauthorized role', () => {
    const r = invokeCliStage({ command: 'status', agentRole: 'REVIEWER' });
    expect(r.accepted).toBe(false);
    expect(r.rejectionReason).toContain('role_not_authorized');
  });

  it('rejects unknown role', () => {
    const r = invokeCliStage({ command: 'status', agentRole: 'UNKNOWN' });
    expect(r.accepted).toBe(false);
    expect(r.rejectionReason).toContain('role_not_authorized');
  });

  it('rejects non-whitelisted command: rm', () => {
    const r = invokeCliStage({ command: 'rm', agentRole: 'OPERATOR' });
    expect(r.accepted).toBe(false);
    expect(r.rejectionReason).toContain('command_not_whitelisted');
  });

  it('rejects non-whitelisted command: curl', () => {
    const r = invokeCliStage({ command: 'curl', agentRole: 'OPERATOR' });
    expect(r.accepted).toBe(false);
    expect(r.rejectionReason).toContain('command_not_whitelisted');
  });

  it('rejects non-whitelisted command: git', () => {
    const r = invokeCliStage({ command: 'git', agentRole: 'OPERATOR' });
    expect(r.accepted).toBe(false);
  });

  it('rejects empty command', () => {
    const r = invokeCliStage({ command: '', agentRole: 'OPERATOR' });
    expect(r.accepted).toBe(false);
    expect(r.rejectionReason).toContain('command_not_whitelisted');
  });

  it('output is present on success', () => {
    const r = invokeCliStage({ command: 'status', agentRole: 'OPERATOR' });
    expect(r.output).toBeDefined();
    expect(typeof r.output).toBe('object');
  });

  it('does not expose raw secrets in output', () => {
    const r = invokeCliStage({ command: 'status', agentRole: 'OPERATOR' });
    const serialized = JSON.stringify(r);
    expect(serialized).not.toContain('DASHSCOPE_API_KEY');
    expect(serialized).not.toContain('bearer ');
  });
});

describe('D3 runCli integration', () => {
  it('runCli status returns success', () => {
    const result = runCli(['status']);
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.command).toBe('status');
  });

  it('runCli help returns success', () => {
    const result = runCli(['help']);
    expect(result.success).toBe(true);
  });
});
