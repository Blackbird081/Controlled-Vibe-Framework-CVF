import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const authWrapperMock = vi.hoisted(() => vi.fn((handler: (req: unknown) => Response) => handler));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock('@/auth', () => ({
  auth: authWrapperMock,
}));

global.fetch = fetchMock as typeof fetch;

import { NextURL } from 'next/dist/server/web/next-url';
import proxy, { config } from './proxy';
import { unstable_doesMiddlewareMatch as unstable_doesProxyMatch } from 'next/experimental/testing/server';

function makeRequest(pathname: string, role?: string | null) {
  return {
    url: `http://localhost${pathname}`,
    nextUrl: new NextURL(`http://localhost${pathname}`),
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

describe('proxy access control', () => {
  beforeEach(() => {
    vi.stubEnv('CVF_INTERNAL_AUDIT_SECRET', 'test-audit-secret');
    fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 200 }));
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each(['/home', '/history', '/admin/team'])('redirects unauthenticated %s to login', async (path) => {
    const response = await proxy(makeRequest(path, null) as never, {} as never) as Response;
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get('location')!).pathname).toBe('/login');
    expect(new URL(response.headers.get('location')!).searchParams.get('from')).toBe(path);
  });

  it.each(['/', '/?template=web_build_handoff', '/?category=content'])
    ('takes the unauthenticated root %s through login with its Home entry target', async (path) => {
      const response = await proxy(makeRequest(path, null) as never, {} as never) as Response;
      expect(response.status).toBe(307);
      const next = new URL(response.headers.get('location')!);
      expect(next.pathname).toBe('/login');
      expect(next.searchParams.get('from')).toBe(path);
    });

  it.each(['/login', '/landing', '/docs/example', '/help', '/skills/search', '/api/auth/me', '/api/admin/audit', '/api/stop'])('passes public or API route %s through', async (path) => {
    const response = await proxy(makeRequest(path, null) as never, {} as never) as Response;
    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('matches application routes while excluding framework assets', () => {
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url: '/home' })).toBe(true);
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url: '/_next/static/test.js' })).toBe(false);
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url: '/favicon.ico' })).toBe(false);
  });

  it('allows authenticated users into protected pages', async () => {
    const response = await proxy(makeRequest('/home', 'developer') as never, {} as never) as Response;
    expect(response.status).toBe(200);
  });

  it('redirects unauthenticated admin access to login', async () => {
    const response = await proxy(makeRequest('/admin/team', null) as never, {} as never);
    expect(response).toBeInstanceOf(Response);
    const nextResponse = response as Response;
    expect(nextResponse.status).toBe(307);
    expect(nextResponse.headers.get('location')).toContain('/login');
  });

  it.each(['owner', 'admin'])('allows %s to access admin routes', async (role) => {
    const response = await proxy(makeRequest('/admin/team', role) as never, {} as never);
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['developer', 'reviewer', 'viewer'])('redirects %s away from admin routes', async (role) => {
    const response = await proxy(makeRequest('/admin/team', role) as never, {} as never);
    expect(response).toBeInstanceOf(Response);
    const nextResponse = response as Response;
    expect(nextResponse.status).toBe(307);
    expect(nextResponse.headers.get('location')).toBe('http://localhost/');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
