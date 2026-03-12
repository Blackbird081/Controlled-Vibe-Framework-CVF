import { auth } from '@/auth';
import type { NextRequest } from 'next/server';

export type SessionCookie = {
    user: string;
    role: string;
    expiresAt: number;
};

/**
 * Legacy wrapper for verifying session inside server components and API routes.
 * Now delegates internally to NextAuth.js App Router auth() function.
 * This prevents breaking the ~10 API routes that currently import it.
 */
export async function verifySessionCookie(request?: NextRequest | Request): Promise<SessionCookie | null> {
    const session = await auth();
    if (!session?.user) return null;
    
    return {
        user: session.user.name || session.user.email || 'unknown',
        role: (session.user as any).role || 'developer',
        expiresAt: new Date(session.expires).getTime(),
    };
}
