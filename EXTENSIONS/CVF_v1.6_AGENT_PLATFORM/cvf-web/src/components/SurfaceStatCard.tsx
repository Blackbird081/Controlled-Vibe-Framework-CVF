'use client';

import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface SurfaceStatCardProps {
    label: string;
    value: string;
    icon: LucideIcon;
    tone?: 'accent' | 'emerald' | 'amber' | 'violet';
}

const TONE_STYLES = {
    accent: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/12 dark:text-indigo-300',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/12 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/12 dark:text-amber-300',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-500/12 dark:text-violet-300',
} as const;

export function SurfaceStatCard({
    label,
    value,
    icon: Icon,
    tone = 'accent',
}: SurfaceStatCardProps) {
    return (
        <div className={clsx(
            'rounded-3xl border border-slate-200/80 bg-white px-6 py-5 shadow-[0_1px_4px_rgba(15,23,42,0.05)]',
            'dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none',
        )}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-white/35">
                        {label}
                    </div>
                    <div className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                        {value}
                    </div>
                </div>
                <div className={clsx(
                    'flex h-12 w-12 items-center justify-center rounded-2xl',
                    TONE_STYLES[tone],
                )}>
                    <Icon size={18} strokeWidth={1.9} />
                </div>
            </div>
        </div>
    );
}
