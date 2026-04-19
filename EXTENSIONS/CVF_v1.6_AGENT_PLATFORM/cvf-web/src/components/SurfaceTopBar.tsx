'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';

interface SurfaceTopBarProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    className?: string;
}

export function SurfaceTopBar({
    title,
    subtitle,
    actions,
    className,
}: SurfaceTopBarProps) {
    return (
        <div className={clsx(
            'border-b border-slate-200/80 bg-white/82 backdrop-blur-sm',
            'dark:border-white/[0.06] dark:bg-[#10131d]/82',
            className,
        )}>
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-white/45">
                            {subtitle}
                        </p>
                    )}
                </div>
                {actions ? (
                    <div className="flex flex-wrap items-center gap-2">
                        {actions}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
