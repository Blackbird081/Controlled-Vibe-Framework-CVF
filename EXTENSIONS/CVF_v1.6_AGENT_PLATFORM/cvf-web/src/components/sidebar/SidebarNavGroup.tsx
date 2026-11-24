'use client';

import { startTransition, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export interface SidebarNavGroupProps {
    id: string;
    title: string;
    defaultCollapsed?: boolean;
    storageKey?: string;
    children: React.ReactNode;
}

export default function SidebarNavGroup({
    id,
    title,
    defaultCollapsed = false,
    storageKey,
    children,
}: SidebarNavGroupProps) {
    const [preference, setPreference] = useState<{ key: string | undefined; expanded: boolean } | null>(null);
    const expanded = preference && preference.key === storageKey ? preference.expanded : !defaultCollapsed;

    useEffect(() => {
        if (!storageKey) return;
        try {
            const saved = window.localStorage.getItem(storageKey);
            if (saved === 'open' || saved === 'closed') {
                startTransition(() => setPreference({ key: storageKey, expanded: saved === 'open' }));
            }
        } catch {
            // Browsers can disable storage. The group still toggles normally.
        }
    }, [storageKey]);

    function toggle() {
        const next = !expanded;
        setPreference({ key: storageKey, expanded: next });
        if (storageKey) {
            try {
                window.localStorage.setItem(storageKey, next ? 'open' : 'closed');
            } catch {
                // The new preference remains active for this mount.
            }
        }
    }

    return (
        <div data-sidebar-group={id}>
            <button
                type="button"
                onClick={toggle}
                className={clsx(
                    'flex min-h-11 w-full scroll-my-2 cursor-pointer items-center gap-2 rounded-md px-3 py-2 md:min-h-8',
                    'text-[13px] font-medium leading-tight text-white/70 hover:bg-white/[0.07] hover:text-white',
                    'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-300',
                )}
                aria-expanded={expanded}
                aria-controls={`sidebar-group-${id}`}
            >
                <span className="flex-1 text-left">{title}</span>
                <ChevronDown
                    size={14}
                    strokeWidth={1.75}
                    className={clsx(
                        'transition-transform duration-200',
                        expanded ? 'rotate-0' : '-rotate-90',
                    )}
                    aria-hidden="true"
                />
            </button>
            <div id={`sidebar-group-${id}`} hidden={!expanded}>
                {expanded && <div
                    className="flex flex-col gap-px py-1"
                    role="group"
                    aria-label={title}
                >
                    {children}
                </div>}
            </div>
        </div>
    );
}
