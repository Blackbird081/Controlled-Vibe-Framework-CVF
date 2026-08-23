import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthConfig, Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { TeamRole } from "cvf-guard-contract/enterprise"
import { findMockUserByUsername, normalizeDisplayName } from "@/lib/mock-enterprise-db"

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
};

type AppJwt = JWT & {
  role?: TeamRole;
  userId?: string;
  orgId?: string;
  teamId?: string;
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
 * supply non-empty `NEXTAUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`,
 * `GOOGLE_ID`, and `GOOGLE_SECRET`; this function throws before Auth.js
 * configuration may be treated as accepted when one or more are missing.
 */
export function validateAuthEnvironmentInvariants(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (isAuthMockDefaultAllowedEnvironment(env.NODE_ENV)) {
    return;
  }

  const required = ["NEXTAUTH_SECRET", "GITHUB_ID", "GITHUB_SECRET", "GOOGLE_ID", "GOOGLE_SECRET"] as const;
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Auth.js environment invariant violated outside test/development: missing ${missing.join(", ")}.`,
    );
  }
}

// Fail closed before any default-bearing Auth.js configuration is created.
validateAuthEnvironmentInvariants();

export const authSecret = process.env.NEXTAUTH_SECRET || "cvf-enterprise-secret-mock-2026";

export const nextAuthConfig = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "mock-github-id",
      clientSecret: process.env.GITHUB_SECRET ?? "mock-github-secret",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "mock-google-id",
      clientSecret: process.env.GOOGLE_SECRET ?? "mock-google-secret",
    }),
    CredentialsProvider({
      name: "Mock Enterprise Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
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
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const appToken = token as AppJwt;
        const authenticatedUser = user as AuthenticatedUser;
        token.name = normalizeDisplayName(authenticatedUser.name) ?? token.name;
        appToken.role = authenticatedUser.role ?? "developer";
        appToken.userId = authenticatedUser.id;
        appToken.orgId = authenticatedUser.orgId ?? "org_cvf";
        appToken.teamId = authenticatedUser.teamId ?? "team_eng";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as SessionUser;
        const appToken = token as AppJwt;
        sessionUser.name = normalizeDisplayName(token.name) ?? sessionUser.name;
        sessionUser.role = appToken.role ?? "developer";
        sessionUser.userId = appToken.userId;
        sessionUser.orgId = appToken.orgId;
        sessionUser.teamId = appToken.teamId;
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
