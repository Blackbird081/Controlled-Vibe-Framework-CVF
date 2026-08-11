import { describe, expect, it, vi } from 'vitest';

import type { UnifiedAuditEvent } from '@/lib/control-plane-events';
import {
  appendLpciTerminalAudit,
  projectLpciTerminalAudit,
  type LpciTerminalAuditInput,
} from './release-audit';

function terminalInput(overrides: Partial<LpciTerminalAuditInput> = {}): LpciTerminalAuditInput {
  return {
    invocationId: 'inv-1',
    auditId: 'audit-1',
    traceId: 'trace-1',
    timestamp: '2026-08-10T00:00:00.000Z',
    authMode: 'session',
    roleClass: 'developer',
    actorRef: 'sha256:actor',
    outcome: 'ANSWER_EMITTED',
    httpStatus: 200,
    corpusRef: 'sha256:corpus',
    responseBoundaryClass: 'ANSWER_EMITTED',
    providerId: 'alibaba',
    modelId: 'qwen-plus',
    queryQuota: { decision: 'ALLOW', retryAfterBucket: 'NONE' },
    providerQuota: { decision: 'ALLOW', retryAfterBucket: 'NONE' },
    providerAttemptCount: 1,
    timeoutFlag: false,
    diagnosticCode: 'NONE',
    latencyBucket: 'LT_1S',
    ...overrides,
  };
}

describe('LPCI terminal release audit', () => {
  it('projects only the accepted minimized terminal fields', () => {
    const projection = projectLpciTerminalAudit(terminalInput());

    expect(projection).toEqual(expect.objectContaining({
      id: 'audit-1',
      eventType: 'LPCI_QUERY_TERMINAL',
      actorId: 'sha256:actor',
      targetResource: '/api/lpci/query',
      outcome: 'ANSWER_EMITTED',
    }));
    expect(projection.payload).toEqual(expect.objectContaining({
      schemaVersion: 'cvf.lpci.queryTerminal.v1',
      invocationId: 'inv-1',
      providerAttemptCount: 1,
      timeoutFlag: false,
    }));
  });

  it('keeps an early denial payload-free and omits unavailable identifiers', () => {
    const projection = projectLpciTerminalAudit(terminalInput({
      auditId: undefined,
      traceId: undefined,
      actorRef: undefined,
      corpusRef: undefined,
      providerId: undefined,
      modelId: undefined,
      queryQuota: undefined,
      providerQuota: undefined,
      outcome: 'AUTHORIZATION_DENIED',
      httpStatus: 401,
      providerAttemptCount: 0,
    }));
    const serialized = JSON.stringify(projection);

    expect(projection.actorId).toBe('ACTOR_REF_UNAVAILABLE');
    expect(projection.payload).not.toHaveProperty('traceId');
    expect(projection.payload).not.toHaveProperty('corpusRef');
    expect(serialized).not.toContain('raw query sentinel');
    expect(serialized).not.toContain('requestBody');
  });

  it('does not copy prohibited sentinel fields from an extended caller object', () => {
    const projection = projectLpciTerminalAudit({
      ...terminalInput(),
      rawQuery: 'raw query sentinel',
      apiKey: 'secret sentinel',
      headers: { authorization: 'token sentinel' },
      rawCorpusId: 'corpus sentinel',
    } as LpciTerminalAuditInput);
    const serialized = JSON.stringify(projection);

    expect(serialized).not.toContain('raw query sentinel');
    expect(serialized).not.toContain('secret sentinel');
    expect(serialized).not.toContain('token sentinel');
    expect(serialized).not.toContain('corpus sentinel');
  });

  it('awaits and returns the existing durable append owner result', async () => {
    const record = { id: 'audit-1' } as UnifiedAuditEvent;
    const append = vi.fn().mockResolvedValue(record);

    await expect(appendLpciTerminalAudit(terminalInput(), {
      appendAuditEvent: append,
    })).resolves.toBe(record);
    expect(append).toHaveBeenCalledTimes(1);
    expect(append.mock.calls[0][0].eventType).toBe('LPCI_QUERY_TERMINAL');
  });

  it('propagates durable append failure for fail-closed route handling', async () => {
    const append = vi.fn().mockRejectedValue(new Error('store unavailable'));
    await expect(appendLpciTerminalAudit(terminalInput(), {
      appendAuditEvent: append,
    })).rejects.toThrow('store unavailable');
    expect(append).toHaveBeenCalledTimes(1);
  });
});
