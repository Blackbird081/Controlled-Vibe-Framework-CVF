'use client';

import clsx from 'clsx';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

/**
 * Single sidebar navigation row.
 *
 * Design source: `App onboarding/cvf-sidebar.jsx` — SideNavItem.
 * Renders either a button (state-driven nav) or a Next.js Link (route-driven nav)
 * depending on whether `href` is provided.
 *
 * Visual contract (W105-T1):
 * - Dark theme primary: bg `transparent` → hover `rgba(255,255,255,0.07)` → active `indigo-500/15`
 * - Active shows a 5px accent dot on the right
 * - Light mode works but is visually softer
 */
export interface SidebarNavItemProps {
    icon: LucideIcon;
    label: string;
    isActive: boolean;
    onClick?: () => void;
    href?: string;
    onNavigate?: () => void;
    badge?: string | number;
    disabled?: boolean;
    testId?: string;
}

const COMMON_ROW_CLASSES = clsx(
    'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] font-normal',
    'transition-colors duration-150 select-none group',
);

const STATE_CLASSES = {
    active:
        'bg-indigo-500/15 text-indigo-300 font-medium dark:bg-indigo-500/15 dark:text-indigo-300 ' +
        'light:bg-indigo-50 light:text-indigo-700',
    idle:
        'text-white/50 hover:bg-white/[0.07] hover:text-white/80 ' +
        'dark:text-white/50 dark:hover:bg-white/[0.07] dark:hover:text-white/80',
    disabled: 'text-white/30 cursor-not-allowed',
};

function RowContent({
    Icon,
    label,
    isActive,
    badge,
}: {
    Icon: LucideIcon;
    label: string;
    isActive: boolean;
    badge?: string | number;
}) {
    return (
        <>
            <Icon size={14} strokeWidth={1.75} className="flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left truncate">{label}</span>
            {badge !== undefined && (
                <span
                    className={clsx(
                        'px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
                        isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white/10 text-white/60',
                    )}
                >
                    {badge}
                </span>
            )}
            {isActive && (
                <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400"
                    aria-hidden="true"
                />
            )}
        </>
    );
}

export default function SidebarNavItem({
    icon: Icon,
    label,
    isActive,
    onClick,
    href,
    onNavigate,
    badge,
    disabled,
    testId,
}: SidebarNavItemProps) {
    const stateClass = disabled
        ? STATE_CLASSES.disabled
        : isActive
            ? STATE_CLASSES.active
            : STATE_CLASSES.idle;

    if (href && !disabled) {
        return (
            <Link
                href={href}
                onClick={onNavigate}
                className={clsx(COMMON_ROW_CLASSES, stateClass)}
                data-testid={testId}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
            >
                <RowContent Icon={Icon} label={label} isActive={isActive} badge={badge} />
            </Link>
        );
    }

    return (
        <button
            type="button"
            onClick={disabled ? undefined : onClick}
            className={clsx(COMMON_ROW_CLASSES, stateClass)}
            data-testid={testId}
            disabled={disabled}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
        >
            <RowContent Icon={Icon} label={label} isActive={isActive} badge={badge} />
        </button>
    );
}
