'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

/**
 * Collapsible sidebar group with uppercase label + chevron.
 *
 * Design source: `App onboarding/cvf-sidebar.jsx` — group header pattern.
 * Each group is independently collapsible; state is local to the group.
 */
export interface SidebarNavGroupProps {
    id: string;
    title: string;
    defaultCollapsed?: boolean;
    children: React.ReactNode;
}

export default function SidebarNavGroup({
    id,
    title,
    defaultCollapsed = false,
    children,
}: SidebarNavGroupProps) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);

    return (
        <div className="mb-1" data-sidebar-group={id}>
            <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                className={clsx(
                    'w-full flex items-center gap-1 px-2 py-1',
                    'text-[9px] font-bold uppercase tracking-[0.1em]',
                    'text-white/25 hover:text-white/50 transition-colors',
                    'select-none',
                )}
                aria-expanded={collapsed ? 'false' : 'true'}
                aria-controls={`sidebar-group-${id}`}
                aria-label={`Toggle ${title} group`}
            >
                <span className="flex-1 text-left">{title}</span>
                <ChevronDown
                    size={10}
                    strokeWidth={1.75}
                    className={clsx(
                        'transition-transform duration-200',
                        collapsed ? '-rotate-90' : 'rotate-0',
                    )}
                    aria-hidden="true"
                />
            </button>
            {!collapsed && (
                <div
                    id={`sidebar-group-${id}`}
                    className="flex flex-col gap-px pt-1"
                    role="group"
                    aria-label={title}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
