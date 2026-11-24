'use client';

import { useState, useCallback, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import type { TeamRole } from 'cvf-guard-contract/enterprise';
import type { SessionImpersonation } from '@/lib/middleware-auth';

const ROLE_PERMISSIONS = {
    owner: {
        canUseAgent: true,
        canUseMultiAgent: true,
        canUseTools: true,
        canUseSettings: true,
        canUseAIUsage: true,
        canUseContext: true,
    },
    admin: {
        canUseAgent: true,
        canUseMultiAgent: true,
        canUseTools: true,
        canUseSettings: true,
        canUseAIUsage: true,
        canUseContext: true,
    },
    developer: {
        canUseAgent: true,
        canUseMultiAgent: true,
        canUseTools: true,
        canUseSettings: true,
        canUseAIUsage: true,
        canUseContext: true,
    },
    reviewer: {
        canUseAgent: true,
        canUseMultiAgent: false,
        canUseTools: false,
        canUseSettings: true,
        canUseAIUsage: true,
        canUseContext: true,
    },
    viewer: {
        canUseAgent: true,
        canUseMultiAgent: false,
        canUseTools: false,
        canUseSettings: false,
        canUseAIUsage: false,
        canUseContext: false,
    },
} as const;

const NO_PERMISSIONS = {
    canUseAgent: false,
    canUseMultiAgent: false,
    canUseTools: false,
    canUseSettings: false,
    canUseAIUsage: false,
    canUseContext: false,
} as const;

const ROLE_BADGE_STYLES = {
    owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200',
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
    developer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
    reviewer: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200',
    viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
} as const;

export type RoleKey = keyof typeof ROLE_PERMISSIONS;

const SESSION_CHANGED = 'cvf:agent-session-changed';

interface VerifiedUser {
    authenticated: true;
    role: RoleKey;
    user?: string;
    userId?: string;
    orgId?: string;
    impersonation?: SessionImpersonation | null;
}

async function readVerifiedUser(): Promise<VerifiedUser | null> {
    try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!response.ok) return null;
        const user = await response.json();
        return user?.authenticated === true && typeof user.role === 'string' && Object.hasOwn(ROLE_PERMISSIONS, user.role)
            ? user : null;
    } catch {
        return null;
    }
}

function verifiedAccountScope(user: VerifiedUser | null): string | undefined {
    if (!user || user.impersonation || typeof user.userId !== 'string'
        || !user.userId || user.userId.trim() !== user.userId || user.userId === 'unknown-user') return undefined;
    return JSON.stringify([user.orgId ?? null, user.userId]);
}

export async function verifyAgentChatAccount(accountScope: string, usesConfiguredKey: boolean): Promise<boolean> {
    const user = await readVerifiedUser();
    const allowed = user !== null && verifiedAccountScope(user) === accountScope
        && (!usesConfiguredKey || ROLE_PERMISSIONS[user.role].canUseSettings);
    if (!allowed) window.dispatchEvent(new Event(SESSION_CHANGED));
    return allowed;
}

export function useAuth() {
    const [sessionReady, setSessionReady] = useState(false);
    const [userRole, setUserRole] = useState<TeamRole | null>(null);
    const [userName, setUserName] = useState<string | undefined>();
    const [accountScope, setAccountScope] = useState<string>();
    const [impersonation, setImpersonation] = useState<SessionImpersonation | null>(null);

    useEffect(() => {
        let active = true;
        let readVersion = 0;
        const refresh = async () => {
            const version = ++readVersion;
            const user = await readVerifiedUser();
            if (!active || readVersion !== version) return;
            setUserRole(user?.role ?? null);
            setUserName(typeof user?.user === 'string' ? user.user : undefined);
            setImpersonation(user?.impersonation ?? null);
            setAccountScope(verifiedAccountScope(user));
            setSessionReady(true);
        };
        void refresh();
        window.addEventListener('focus', refresh);
        window.addEventListener(SESSION_CHANGED, refresh);
        return () => {
            active = false;
            window.removeEventListener('focus', refresh);
            window.removeEventListener(SESSION_CHANGED, refresh);
        };
    }, []);

    const handleLogout = useCallback(async () => {
        document.cookie = 'cvf_auth=; Path=/; Max-Age=0';
        document.cookie = 'cvf_role=; Path=/; Max-Age=0';
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
            // ignore legacy logout cleanup failures
        }
        await signOut({ callbackUrl: '/login' });
    }, []);

    const endImpersonation = useCallback(async () => {
        await fetch('/api/admin/impersonate/end', {
            method: 'POST',
            credentials: 'include',
        });
        window.location.reload();
    }, []);

    const roleKey = userRole as RoleKey | null;
    const permissions = roleKey ? ROLE_PERMISSIONS[roleKey] : NO_PERMISSIONS;
    const roleBadgeStyle = roleKey ? ROLE_BADGE_STYLES[roleKey] : '';

    return {
        sessionReady,
        userRole,
        userName,
        accountScope,
        impersonation,
        roleKey,
        permissions,
        roleBadgeStyle,
        handleLogout,
        endImpersonation,
    };
}

export { ROLE_PERMISSIONS, ROLE_BADGE_STYLES };
