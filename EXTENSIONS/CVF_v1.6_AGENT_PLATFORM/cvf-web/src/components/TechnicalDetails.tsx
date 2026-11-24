import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface TechnicalDetailsProps {
    label: ReactNode;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    testId?: string;
}

export function TechnicalDetails({ label, children, className, contentClassName, testId }: TechnicalDetailsProps) {
    return (
        <details data-testid={testId} className={clsx('group rounded-xl border border-slate-200 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200', className)}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-300 [&::-webkit-details-marker]:hidden">
                {label}
                <ChevronDown size={16} className="shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className={clsx('break-words', contentClassName ?? 'space-y-2 px-3 pb-3')}>
                {children}
            </div>
        </details>
    );
}
