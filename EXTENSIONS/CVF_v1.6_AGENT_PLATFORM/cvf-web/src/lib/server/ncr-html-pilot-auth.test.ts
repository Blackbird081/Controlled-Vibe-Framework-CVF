import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/middleware-auth', () => ({ verifySessionCookie: vi.fn() }));
import { htmlPilotNormalPrincipal, htmlPilotSameOwner } from './ncr-html-pilot-auth';
import type { SessionCookie } from '@/lib/middleware-auth';

const normal = { authMode: 'session', userId: 'developer', orgId: 'org', teamId: 'team', role: 'developer',
  expiresAt: 2000 } as unknown as SessionCookie;
describe('normal pilot owner eligibility', () => {
  it('accepts the signed ordinary developer owner and exact tuple', () => {
    const selected = htmlPilotNormalPrincipal(normal, 1000);
    expect(selected).toEqual({ userId: 'developer', orgId: 'org', teamId: 'team' });
    expect(htmlPilotSameOwner(selected!, { userId: 'developer', orgId: 'org', teamId: 'team' })).toBe(true);
    expect(htmlPilotSameOwner(selected!, { userId: 'foreign', orgId: 'org', teamId: 'team' })).toBe(false);
  });
  it('rejects break-glass, impersonation and expiration', () => {
    expect(htmlPilotNormalPrincipal({ ...normal, authMode: 'break-glass' } as unknown as SessionCookie, 1000)).toBeNull();
    expect(htmlPilotNormalPrincipal({ ...normal, realUserId: 'admin' }, 1000)).toBeNull();
    expect(htmlPilotNormalPrincipal(normal, 2000)).toBeNull();
  });
});
