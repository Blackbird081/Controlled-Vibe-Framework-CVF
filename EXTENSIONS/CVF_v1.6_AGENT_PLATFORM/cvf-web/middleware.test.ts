import { describe, expect, it, vi, beforeEach } from 'vitest';

const authWrapperMock = vi.hoisted(() => vi.fn((handler: (req: unknown) => Response) => handler));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock('@/auth', () => ({
  auth: authWrapperMock,
}));

global.fetch = fetchMock as typeof fetch;

import middleware from './middleware';

function makeRequest(pathname: string, role?: string | null) {
  return {
    url: `http://localhost${pathname}`,
    nextUrl: new URL(`http://localhost${pathname}`),
    auth: role === undefined
      ? undefined
      : role === null
        ? null
        : {
            user: {
              role,
              email: `${role}@cvf.local`,
            },
          },
  };
}

describe('middleware admin RBAC', () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 200 }));
  });

  it('redirects unauthenticated admin access to login', () => {
    const response = middleware(makeRequest('/admin/team', null) as never);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it.each(['owner', 'admin'])('allows %s to access admin routes', (role) => {
    const response = middleware(makeRequest('/admin/team', role) as never);
    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['developer', 'reviewer', 'viewer'])('redirects %s away from admin routes', (role) => {
    const response = middleware(makeRequest('/admin/team', role) as never);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
