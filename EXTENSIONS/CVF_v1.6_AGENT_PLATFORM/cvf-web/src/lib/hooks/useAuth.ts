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

const ROLE_BADGE_STYLES = {
    owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200',
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
    developer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
    reviewer: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200',
    viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
} as const;

export type RoleKey = keyof typeof ROLE_PERMISSIONS;


export function useAuth() {
    const [userRole, setUserRole] = useState<TeamRole>('admin');
    const [userName, setUserName] = useState<string | undefined>();
    const [impersonation, setImpersonation] = useState<SessionImpersonation | null>(null);

    useEffect(() => {
        // Fetch from session cookie via API (source of truth)
        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.role) {
                    setUserRole(data.role);
                    // Clear legacy cookie to avoid it interfering in future renders
                    document.cookie = 'cvf_role=; Path=/; Max-Age=0';
                }
                if (data?.user) setUserName(data.user);
                setImpersonation(data?.impersonation ?? null);
            })
            .catch(() => {
                // Fallback: read legacy cookie ONLY when API fails
                const roleCookie = document.cookie
                    .split(';')
                    .map(c => c.trim())
                    .find(c => c.startsWith('cvf_role='));
                if (roleCookie) {
                    const role = roleCookie.split('=')[1];
                    if (role && role in ROLE_PERMISSIONS) {
                        setUserRole(role as TeamRole);
                    }
                }
            });
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

    const roleKey = (userRole in ROLE_PERMISSIONS ? userRole : 'admin') as RoleKey;
    const permissions = ROLE_PERMISSIONS[roleKey];
    const roleBadgeStyle = ROLE_BADGE_STYLES[roleKey];

    return {
        userRole,
        userName,
        impersonation,
        roleKey,
        permissions,
        roleBadgeStyle,
        handleLogout,
        endImpersonation,
    };
}

export { ROLE_PERMISSIONS, ROLE_BADGE_STYLES };
