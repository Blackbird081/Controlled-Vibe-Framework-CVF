'use client';

import { useState, useCallback, useEffect } from 'react';

const ROLE_PERMISSIONS = {
    admin: {
        canUseAgent: true,
        canUseMultiAgent: true,
        canUseTools: true,
        canUseSettings: true,
        canUseAIUsage: true,
        canUseContext: true,
    },
    editor: {
        canUseAgent: true,
        canUseMultiAgent: true,
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
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
    editor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
} as const;

export type RoleKey = keyof typeof ROLE_PERMISSIONS;


export function useAuth() {
    const [userRole, setUserRole] = useState<string>('admin');
    const [userName, setUserName] = useState<string | undefined>();

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
            })
            .catch(() => {
                // Fallback: read legacy cookie ONLY when API fails
                const roleCookie = document.cookie
                    .split(';')
                    .map(c => c.trim())
                    .find(c => c.startsWith('cvf_role='));
                if (roleCookie) {
                    const role = roleCookie.split('=')[1];
                    if (role) setUserRole(role);
                }
            });
    }, []);

    const handleLogout = useCallback(async () => {
        document.cookie = 'cvf_auth=; Path=/; Max-Age=0';
        document.cookie = 'cvf_role=; Path=/; Max-Age=0';
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
        window.location.href = '/login';
    }, []);

    const roleKey = (userRole in ROLE_PERMISSIONS ? userRole : 'admin') as RoleKey;
    const permissions = ROLE_PERMISSIONS[roleKey];
    const roleBadgeStyle = ROLE_BADGE_STYLES[roleKey];

    return {
        userRole,
        userName,
        roleKey,
        permissions,
        roleBadgeStyle,
        handleLogout,
    };
}

export { ROLE_PERMISSIONS, ROLE_BADGE_STYLES };
