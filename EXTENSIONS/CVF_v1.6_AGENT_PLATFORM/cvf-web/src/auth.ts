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
        // Fallback for E2E and existing tests
        if (username === process.env.CVF_ADMIN_USER && password === process.env.CVF_ADMIN_PASS) {
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
  secret: process.env.NEXTAUTH_SECRET || "cvf-enterprise-secret-mock-2026",
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(nextAuthConfig)
