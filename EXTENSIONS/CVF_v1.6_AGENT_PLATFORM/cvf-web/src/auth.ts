import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthConfig, Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { TeamRole } from "cvf-guard-contract/enterprise"
import { findMockUserByUsername, normalizeDisplayName } from "@/lib/mock-enterprise-db"
import { findOAuthIdentityBinding, isOAuthProviderId, parseOAuthIdentityBindings, type OAuthProviderId } from '@/lib/oauth-identity-profile'

type AuthenticatedUser = User & {
  role: TeamRole;
  orgId: string;
  teamId: string;
};

type SessionUser = NonNullable<Session["user"]> & {
  role?: TeamRole;
  userId?: string;
  orgId?: string;
  teamId?: string;
  authSource?: 'local_mock' | 'oauth_bound';
  oauthProvider?: OAuthProviderId;
  oauthSubject?: string;
};

type AppJwt = JWT & {
  role?: TeamRole;
  userId?: string;
  orgId?: string;
  teamId?: string;
  authSource?: 'local_mock' | 'oauth_bound';
  oauthProvider?: OAuthProviderId;
  oauthSubject?: string;
};

/**
 * CADP-AI-T5-R5: environments where the existing mock/default Auth.js
 * fallback values (secret, OAuth client credentials, legacy admin
 * credentials-provider fallback) remain available. Any other value of
 * `NODE_ENV` is treated as non-test/non-development and must supply real
 * configuration.
 */
const AUTH_MOCK_DEFAULT_ALLOWED_ENVIRONMENTS = new Set(["test", "development"]);

function isAuthMockDefaultAllowedEnvironment(nodeEnv: string | undefined): boolean {
  return AUTH_MOCK_DEFAULT_ALLOWED_ENVIRONMENTS.has(nodeEnv ?? "");
}

/**
 * Pure Auth.js environment invariant validator. Test and development may
 * rely on the existing mock/default values. Any other environment must
 * select one OAuth provider and supply its non-empty client pair, a session
 * secret, a callback origin, and at least one explicit CVF identity binding.
 */
export function validateAuthEnvironmentInvariants(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (isAuthMockDefaultAllowedEnvironment(env.NODE_ENV)) {
    return;
  }

  if (!isOAuthProviderId(env.CVF_OAUTH_PROVIDER)) {
    throw new Error('Auth.js environment invariant violated outside test/development: CVF_OAUTH_PROVIDER must be github or google.');
  }

  const required = env.CVF_OAUTH_PROVIDER === 'github'
    ? ['NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'GITHUB_ID', 'GITHUB_SECRET']
    : ['NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'GOOGLE_ID', 'GOOGLE_SECRET'];
  const missing = required.filter((key) => !env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Auth.js environment invariant violated outside test/development: missing ${missing.join(", ")}.`,
    );
  }
  const bindings = parseOAuthIdentityBindings(env.CVF_OAUTH_IDENTITY_BINDINGS_JSON);
  if (!bindings.some((binding) => binding.provider === env.CVF_OAUTH_PROVIDER)) {
    throw new Error('Auth.js environment invariant violated outside test/development: selected provider has no CVF identity binding.');
  }
}

// Fail closed before any default-bearing Auth.js configuration is created.
validateAuthEnvironmentInvariants();

export const authSecret = process.env.NEXTAUTH_SECRET || "cvf-enterprise-secret-mock-2026";

const localMockAllowed = isAuthMockDefaultAllowedEnvironment(process.env.NODE_ENV);
const selectedOAuthProvider = process.env.CVF_OAUTH_PROVIDER;
const oauthProviders: NextAuthConfig['providers'] = localMockAllowed || selectedOAuthProvider === 'github'
  ? [GitHubProvider({
      clientId: process.env.GITHUB_ID || 'mock-github-id',
      clientSecret: process.env.GITHUB_SECRET || 'mock-github-secret',
    })]
  : [];
if (localMockAllowed || selectedOAuthProvider === 'google') {
  oauthProviders.push(GoogleProvider({
    clientId: process.env.GOOGLE_ID || 'mock-google-id',
    clientSecret: process.env.GOOGLE_SECRET || 'mock-google-secret',
  }));
}

export const nextAuthConfig = {
  providers: [
    ...oauthProviders,
    ...(localMockAllowed ? [CredentialsProvider({
      name: "Mock Enterprise Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Mock enterprise users and the legacy admin fallback are local-only.
        // A configured Auth.js secret/OAuth client must not make these demo
        // credentials usable in a production session.
        if (!isAuthMockDefaultAllowedEnvironment(process.env.NODE_ENV)) return null;
        if (!credentials?.username || !credentials?.password) return null;

        const username = credentials.username as string;
        const password = credentials.password as string;
        const mockUser = findMockUserByUsername(username);

        // Enterprise Mock Users
        if (mockUser && password === `${username}123`) {
            return {
              id: mockUser.id,
              name: mockUser.name,
              email: mockUser.email,
              role: mockUser.role,
              orgId: mockUser.orgId,
              teamId: mockUser.teamId,
            }
        }
        // Legacy admin fallback for E2E and existing tests. Unavailable
        // outside test/development per CADP-AI-T5-R5 environment invariants.
        if (
          isAuthMockDefaultAllowedEnvironment(process.env.NODE_ENV) &&
          username === process.env.CVF_ADMIN_USER &&
          password === process.env.CVF_ADMIN_PASS
        ) {
             return {
               id: "99",
               name: "Legacy Admin",
               email: "legacy@cvf.local",
               role: "admin",
               orgId: "org_cvf",
               teamId: "team_exec",
             }
        }

        return null;
      }
    })] : [])
  ],
  callbacks: {
    signIn({ account }) {
      if (account?.provider === 'credentials') return localMockAllowed;
      return Boolean(findOAuthIdentityBinding(
        process.env.CVF_OAUTH_IDENTITY_BINDINGS_JSON,
        account?.provider,
        account?.providerAccountId,
      ));
    },
    jwt({ token, user, account }) {
      const appToken = token as AppJwt;
      if (user) {
        token.name = normalizeDisplayName(user.name) ?? token.name;
        if (account?.provider === 'credentials' && localMockAllowed) {
          const authenticatedUser = user as AuthenticatedUser;
          appToken.role = authenticatedUser.role;
          appToken.userId = authenticatedUser.id;
          appToken.orgId = authenticatedUser.orgId;
          appToken.teamId = authenticatedUser.teamId;
          appToken.authSource = 'local_mock';
        } else {
          const binding = findOAuthIdentityBinding(
            process.env.CVF_OAUTH_IDENTITY_BINDINGS_JSON,
            account?.provider,
            account?.providerAccountId,
          );
          if (!binding) return null;
          appToken.role = binding.role;
          appToken.userId = binding.userId;
          appToken.orgId = binding.orgId;
          appToken.teamId = binding.teamId;
          appToken.authSource = 'oauth_bound';
          appToken.oauthProvider = binding.provider;
          appToken.oauthSubject = binding.providerAccountId;
        }
      } else if (appToken.authSource === 'oauth_bound') {
        const binding = findOAuthIdentityBinding(
          process.env.CVF_OAUTH_IDENTITY_BINDINGS_JSON,
          appToken.oauthProvider,
          appToken.oauthSubject,
        );
        if (!binding) return null;
        appToken.role = binding.role;
        appToken.userId = binding.userId;
        appToken.orgId = binding.orgId;
        appToken.teamId = binding.teamId;
      } else if (!localMockAllowed || appToken.authSource !== 'local_mock') {
        return null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as SessionUser;
        const appToken = token as AppJwt;
        sessionUser.name = normalizeDisplayName(token.name) ?? sessionUser.name;
        sessionUser.role = appToken.role;
        sessionUser.userId = appToken.userId;
        sessionUser.orgId = appToken.orgId;
        sessionUser.teamId = appToken.teamId;
        sessionUser.authSource = appToken.authSource;
        sessionUser.oauthProvider = appToken.oauthProvider;
        sessionUser.oauthSubject = appToken.oauthSubject;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: authSecret,
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(nextAuthConfig)
