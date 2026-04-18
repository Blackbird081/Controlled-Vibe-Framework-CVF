import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appendAuditEventMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/lib/control-plane-events', () => ({
  appendAuditEvent: appendAuditEventMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  withSessionAuditPayload: (session: { impersonation?: { realActorId: string; sessionId: string } } | null | undefined, payload?: Record<string, unknown>) => {
    const nextPayload = { ...(payload ?? {}) };
    if (session?.impersonation) {
      nextPayload.impersonatedBy = session.impersonation.realActorId;
      nextPayload.impersonationSessionId = session.impersonation.sessionId;
    }
    return Object.keys(nextPayload).length > 0 ? nextPayload : undefined;
  },
}));

import { requireAdminApiSession } from './admin-session';

describe('admin-session', () => {
  const originalToken = process.env.CVF_BREAK_GLASS_TOKEN;

  beforeEach(() => {
    appendAuditEventMock.mockReset();
    verifySessionCookieMock.mockReset();
    delete process.env.CVF_BREAK_GLASS_TOKEN;
  });

  afterEach(() => {
    if (originalToken) {
      process.env.CVF_BREAK_GLASS_TOKEN = originalToken;
    } else {
      delete process.env.CVF_BREAK_GLASS_TOKEN;
    }
  });

  it('grants break-glass access and emits an audit event', async () => {
    process.env.CVF_BREAK_GLASS_TOKEN = 'emergency-token';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await requireAdminApiSession(new Request('http://localhost/api/admin/finops', {
      headers: {
        'x-cvf-break-glass': 'emergency-token',
      },
    }) as never, '/api/admin/finops');

    expect(result).not.toBeInstanceOf(Response);
    expect(result).toMatchObject({
      userId: 'break-glass',
      role: 'owner',
      authMode: 'break-glass',
    });
    expect(appendAuditEventMock).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'BREAK_GLASS_USED',
      riskLevel: 'R3',
    }));
    expect(consoleErrorSpy).toHaveBeenCalledWith('[CVF BREAK GLASS USED] Rotate CVF_BREAK_GLASS_TOKEN immediately.');

    consoleErrorSpy.mockRestore();
  });

  it('returns unauthorized response for non-admin sessions without break-glass', async () => {
    verifySessionCookieMock.mockResolvedValue({
      userId: 'usr_3',
      user: 'Bob Developer',
      role: 'developer',
      orgId: 'org_cvf',
      teamId: 'team_eng',
      expiresAt: Date.now() + 3_600_000,
      authMode: 'session',
    });

    const result = await requireAdminApiSession(new Request('http://localhost/api/admin/finops') as never, '/api/admin/finops');

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
    expect(appendAuditEventMock).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'ADMIN_ACCESS_DENIED',
    }));
  });
});
