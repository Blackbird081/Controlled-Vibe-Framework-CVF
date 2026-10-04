import { afterEach, describe, expect, it, vi } from 'vitest';

// The installed next-auth version's `lib/env.js` imports the bare
// specifier `next/server` (missing the `.js` extension Vite's ESM resolver
// requires), so any test that imports `./auth` transitively fails to
// resolve that module. This is a pre-existing dependency/tooling defect,
// not something introduced by this tranche's changes, and is out of the
// CADP-AI-T5-R5 worker's owned-path manifest to repair. Mocking next-auth
// and the two unrelated OAuth provider imports keeps this test hermetic
// while still exercising this file's real, unmocked
// `validateAuthEnvironmentInvariants` and the real Credentials provider
// `authorize` function under test.
vi.mock('next-auth', () => ({
  default: () => ({ handlers: {}, signIn: vi.fn(), signOut: vi.fn(), auth: vi.fn() }),
}));
vi.mock('next-auth/providers/github', () => ({ default: vi.fn(() => ({})) }));
vi.mock('next-auth/providers/google', () => ({ default: vi.fn(() => ({})) }));

import { nextAuthConfig, validateAuthEnvironmentInvariants } from './auth';

function envWith(overrides: Partial<NodeJS.ProcessEnv>): NodeJS.ProcessEnv {
  return { ...overrides } as NodeJS.ProcessEnv;
}

interface CredentialsAuthorizeConfig {
  options: {
    authorize: (credentials: Record<string, unknown>) => Promise<unknown>;
  };
}

/**
 * `@auth/core`'s `Credentials(config)` factory intentionally discards the
 * caller-supplied `authorize` at the top level (hardcoding
 * `authorize: () => null` there) and stashes the real config, including the
 * real `authorize`, under `.options` for the framework's own internal
 * request pipeline. Tests must call `.options.authorize`, not `.authorize`.
 */
function credentialsAuthorize(): CredentialsAuthorizeConfig['options']['authorize'] {
  return (nextAuthConfig.providers[2] as unknown as CredentialsAuthorizeConfig).options.authorize;
}

describe('validateAuthEnvironmentInvariants', () => {
  it('allows missing configuration in test mode', () => {
    expect(() => validateAuthEnvironmentInvariants(envWith({ NODE_ENV: 'test' }))).not.toThrow();
  });

  it('allows missing configuration in development mode', () => {
    expect(() => validateAuthEnvironmentInvariants(envWith({ NODE_ENV: 'development' }))).not.toThrow();
  });

  it('throws in a production-like environment when required values are missing', () => {
    expect(() => validateAuthEnvironmentInvariants(envWith({ NODE_ENV: 'production' }))).toThrow(
      /Auth\.js environment invariant violated/,
    );
  });

  it('throws when NODE_ENV is unset and required values are missing', () => {
    expect(() => validateAuthEnvironmentInvariants(envWith({}))).toThrow(/Auth\.js environment invariant violated/);
  });

  it('does not throw in a production-like environment when every required value is present', () => {
    expect(() =>
      validateAuthEnvironmentInvariants(
        envWith({
          NODE_ENV: 'production',
          CVF_OAUTH_PROVIDER: 'github',
          CVF_OAUTH_IDENTITY_BINDINGS_JSON: JSON.stringify([{
            provider: 'github', providerAccountId: 'subject-1', userId: 'cvf-user-1',
            role: 'reviewer', orgId: 'org_cvf', teamId: 'team_sec',
          }]),
          NEXTAUTH_SECRET: 'real-secret',
          NEXTAUTH_URL: 'https://cvf.example.test',
          GITHUB_ID: 'real-github-id',
          GITHUB_SECRET: 'real-github-secret',
        }),
      ),
    ).not.toThrow();
  });

  it('throws listing every missing key when only some required values are present', () => {
    expect(() =>
      validateAuthEnvironmentInvariants(
        envWith({
          NODE_ENV: 'production',
          CVF_OAUTH_PROVIDER: 'github',
          NEXTAUTH_SECRET: 'real-secret',
        }),
      ),
    ).toThrow(/NEXTAUTH_URL.*GITHUB_ID.*GITHUB_SECRET/);
  });

  it('rejects an invalid provider or a provider without an explicit CVF binding', () => {
    expect(() => validateAuthEnvironmentInvariants(envWith({
      NODE_ENV: 'production', CVF_OAUTH_PROVIDER: 'other',
    }))).toThrow(/CVF_OAUTH_PROVIDER/);
    expect(() => validateAuthEnvironmentInvariants(envWith({
      NODE_ENV: 'production', CVF_OAUTH_PROVIDER: 'google',
      NEXTAUTH_SECRET: 'real-secret', NEXTAUTH_URL: 'https://cvf.example.test',
      GOOGLE_ID: 'real-google-id', GOOGLE_SECRET: 'real-google-secret',
    }))).toThrow(/no CVF identity binding/);
  });

  it('accepts Google alone when its client pair and exact identity binding are configured', () => {
    expect(() => validateAuthEnvironmentInvariants(envWith({
      NODE_ENV: 'production', CVF_OAUTH_PROVIDER: 'google',
      CVF_OAUTH_IDENTITY_BINDINGS_JSON: JSON.stringify([{
        provider: 'google', providerAccountId: 'google-subject-1', userId: 'cvf-user-2',
        role: 'viewer', orgId: 'org_cvf', teamId: 'team_ops',
      }]),
      NEXTAUTH_SECRET: 'synthetic-session-secret', NEXTAUTH_URL: 'https://cvf.example.test',
      GOOGLE_ID: 'synthetic-client-id', GOOGLE_SECRET: 'synthetic-client-secret',
    }))).not.toThrow();
  });

  it('rejects module initialization before Auth.js accepts defaults outside test/development', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CVF_OAUTH_PROVIDER', 'github');
    vi.stubEnv('NEXTAUTH_SECRET', '');
    vi.stubEnv('GITHUB_ID', '');
    vi.stubEnv('GITHUB_SECRET', '');
    vi.stubEnv('GOOGLE_ID', '');
    vi.stubEnv('GOOGLE_SECRET', '');

    try {
      await expect(import('./auth')).rejects.toThrow(/Auth\.js environment invariant violated/);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('registers only the selected production OAuth provider', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CVF_OAUTH_PROVIDER', 'github');
    vi.stubEnv('CVF_OAUTH_IDENTITY_BINDINGS_JSON', JSON.stringify([{
      provider: 'github', providerAccountId: 'subject-1', userId: 'cvf-user-1',
      role: 'reviewer', orgId: 'org_cvf', teamId: 'team_sec',
    }]));
    vi.stubEnv('NEXTAUTH_SECRET', 'synthetic-session-secret');
    vi.stubEnv('NEXTAUTH_URL', 'https://cvf.example.test');
    vi.stubEnv('GITHUB_ID', 'synthetic-client-id');
    vi.stubEnv('GITHUB_SECRET', 'synthetic-client-secret');
    vi.stubEnv('GOOGLE_ID', '');
    vi.stubEnv('GOOGLE_SECRET', '');

    try {
      const productionAuth = await import('./auth');
      expect(productionAuth.nextAuthConfig.providers).toHaveLength(1);
      expect(productionAuth.nextAuthConfig.callbacks.signIn({
        account: { provider: 'github', providerAccountId: 'other-subject' },
      } as never)).toBe(false);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe('legacy admin credentials fallback', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAdminUser = process.env.CVF_ADMIN_USER;
  const originalAdminPass = process.env.CVF_ADMIN_PASS;

  afterEach(() => {
    vi.stubEnv('NODE_ENV', originalNodeEnv ?? 'test');
    if (originalAdminUser === undefined) {
      vi.stubEnv('CVF_ADMIN_USER', '');
    } else {
      vi.stubEnv('CVF_ADMIN_USER', originalAdminUser);
    }
    if (originalAdminPass === undefined) {
      vi.stubEnv('CVF_ADMIN_PASS', '');
    } else {
      vi.stubEnv('CVF_ADMIN_PASS', originalAdminPass);
    }
  });

  it('allows the legacy admin fallback in test mode with matching credentials', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('CVF_ADMIN_USER', 'admin-probe');
    vi.stubEnv('CVF_ADMIN_PASS', 'admin-probe-pass');

    const result = await credentialsAuthorize()({
      username: 'admin-probe',
      password: 'admin-probe-pass',
    });

    expect(result).toMatchObject({ id: '99', role: 'admin' });
  });

  it('allows the legacy admin fallback in development mode with matching credentials', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('CVF_ADMIN_USER', 'admin-probe');
    vi.stubEnv('CVF_ADMIN_PASS', 'admin-probe-pass');

    const result = await credentialsAuthorize()({
      username: 'admin-probe',
      password: 'admin-probe-pass',
    });

    expect(result).toMatchObject({ id: '99', role: 'admin' });
  });

  it('rejects the legacy admin fallback outside test/development even with matching credentials', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CVF_ADMIN_USER', 'admin-probe');
    vi.stubEnv('CVF_ADMIN_PASS', 'admin-probe-pass');

    const result = await credentialsAuthorize()({
      username: 'admin-probe',
      password: 'admin-probe-pass',
    });

    expect(result).toBeNull();
  });

  it('rejects a known mock owner in production even when Auth.js configuration is present', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const result = await credentialsAuthorize()({
      username: 'owner',
      password: 'owner123',
    });

    expect(result).toBeNull();
  });

  it('retains the known mock owner in development for the local Q001 profile', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const result = await credentialsAuthorize()({
      username: 'owner',
      password: 'owner123',
    });

    expect(result).toMatchObject({ id: 'usr_1', role: 'owner' });
  });
});

describe('OAuth identity callbacks', () => {
  const binding = JSON.stringify([{
    provider: 'github', providerAccountId: 'subject-1', userId: 'cvf-user-1',
    role: 'reviewer', orgId: 'org_cvf', teamId: 'team_sec',
  }]);

  afterEach(() => vi.unstubAllEnvs());

  it('denies unknown subjects and binds the selected subject without a default role', async () => {
    vi.stubEnv('CVF_OAUTH_IDENTITY_BINDINGS_JSON', binding);
    const signIn = nextAuthConfig.callbacks.signIn as unknown as (input: {
      account: { provider: string; providerAccountId: string };
    }) => boolean;
    const jwt = nextAuthConfig.callbacks.jwt as unknown as (input: {
      token: Record<string, unknown>;
      user?: { name: string };
      account?: { provider: string; providerAccountId: string };
    }) => Record<string, unknown> | null;

    expect(signIn({ account: { provider: 'github', providerAccountId: 'unknown' } })).toBe(false);
    expect(signIn({ account: { provider: 'github', providerAccountId: 'subject-1' } })).toBe(true);
    const token = jwt({
      token: {}, user: { name: 'Review User' },
      account: { provider: 'github', providerAccountId: 'subject-1' },
    });
    expect(token).toMatchObject({
      authSource: 'oauth_bound', oauthProvider: 'github', oauthSubject: 'subject-1',
      userId: 'cvf-user-1', role: 'reviewer', orgId: 'org_cvf', teamId: 'team_sec',
    });

    vi.stubEnv('CVF_OAUTH_IDENTITY_BINDINGS_JSON', '[]');
    expect(jwt({ token: token ?? {} })).toBeNull();
  });
});
