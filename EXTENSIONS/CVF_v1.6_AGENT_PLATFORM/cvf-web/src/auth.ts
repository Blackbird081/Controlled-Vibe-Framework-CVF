import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"
import type { TeamRole } from "cvf-guard-contract/enterprise"

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

        // Enterprise Mock Users
        if (username === "admin" && password === "admin123") {
            return { id: "1", name: "Admin User", email: "admin@cvf.local", role: "admin" }
        }
        if (username === "dev" && password === "dev123") {
            return { id: "2", name: "Developer", email: "dev@cvf.local", role: "developer" }
        }
        if (username === "owner" && password === "owner123") {
            return { id: "3", name: "System Owner", email: "owner@cvf.local", role: "owner" }
        }
        if (username === "reviewer" && password === "reviewer123") {
            return { id: "4", name: "Security Reviewer", email: "review@cvf.local", role: "reviewer" }
        }
        // Fallback for E2E and existing tests
        if (username === process.env.CVF_ADMIN_USER && password === process.env.CVF_ADMIN_PASS) {
             return { id: "99", name: "Legacy Admin", email: "legacy@cvf.local", role: "admin" }
        }
        
        return null;
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "developer";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as TeamRole;
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
