import { describe, expect, it } from 'vitest';
import {
  clearMcpToolAuditForTest,
  getMcpToolAuditSnapshot,
  recordMcpToolCall,
  withMcpToolAudit,
} from './mcp-tool-audit.js';

describe('mcp-tool-audit', () => {
  it('records secret-safe metadata for successful calls', () => {
    clearMcpToolAuditForTest();

    recordMcpToolCall({
      toolName: 'cvf_get_session_state',
      args: { includeRaw: true, apiKey: 'not-recorded' },
      success: true,
      durationMs: 12.2,
    });

    const snapshot = getMcpToolAuditSnapshot();
    expect(snapshot.totalEntries).toBe(1);
    expect(snapshot.entries[0]).toMatchObject({
      sequence: 1,
      toolName: 'cvf_get_session_state',
      argumentKeys: ['apiKey', 'includeRaw'],
      success: true,
      diagnosticClass: 'none',
    });
    expect(JSON.stringify(snapshot)).not.toContain('not-recorded');
  });

  it('wraps tool handlers and records failures', async () => {
    clearMcpToolAuditForTest();

    await expect(
      withMcpToolAudit('cvf_failure', { reason: 'test' }, async () => {
        throw new Error('classified failure');
      }),
    ).rejects.toThrow('classified failure');

    const snapshot = getMcpToolAuditSnapshot();
    expect(snapshot.entries[0]).toMatchObject({
      toolName: 'cvf_failure',
      success: false,
      diagnosticClass: 'tool_error',
      safeMessage: 'classified failure',
    });
  });
});
