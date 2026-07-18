'use client';

import {
    BookOpenText,
    ClipboardCheck,
    ClipboardList,
    FilePenLine,
    FileSearch,
    LayoutTemplate,
    MessageSquareText,
} from 'lucide-react';
import { OUTCOME_WORKFLOW_REGISTRY, type OutcomeKey } from '@/lib/workflow-composition';

type OutcomeQuickActionsLang = 'vi' | 'en';

export interface OutcomeQuickActionsProps {
    lang: OutcomeQuickActionsLang;
    onSelectTemplate: (templateId: string) => void;
    id?: string;
}

const iconByOutcome: Record<OutcomeKey, typeof ClipboardList> = {
    create_prd: ClipboardList,
    generate_sop: BookOpenText,
    review_contract: FileSearch,
    build_landing_page: LayoutTemplate,
    summarize_meeting: MessageSquareText,
    create_proposal: FilePenLine,
};

const toneStyles = {
    emerald: {
        border: 'border-emerald-200 bg-emerald-50/75 hover:border-emerald-300 dark:border-emerald-500/20 dark:bg-emerald-500/8',
        icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
        label: 'text-emerald-950 dark:text-emerald-50',
    },
    sky: {
        border: 'border-sky-200 bg-sky-50/75 hover:border-sky-300 dark:border-sky-500/20 dark:bg-sky-500/8',
        icon: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
        label: 'text-sky-950 dark:text-sky-50',
    },
    amber: {
        border: 'border-amber-200 bg-amber-50/75 hover:border-amber-300 dark:border-amber-500/20 dark:bg-amber-500/8',
        icon: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
        label: 'text-amber-950 dark:text-amber-50',
    },
    rose: {
        border: 'border-rose-200 bg-rose-50/75 hover:border-rose-300 dark:border-rose-500/20 dark:bg-rose-500/8',
        icon: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
        label: 'text-rose-950 dark:text-rose-50',
    },
    violet: {
        border: 'border-violet-200 bg-violet-50/75 hover:border-violet-300 dark:border-violet-500/20 dark:bg-violet-500/8',
        icon: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
        label: 'text-violet-950 dark:text-violet-50',
    },
    teal: {
        border: 'border-teal-200 bg-teal-50/75 hover:border-teal-300 dark:border-teal-500/20 dark:bg-teal-500/8',
        icon: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
        label: 'text-teal-950 dark:text-teal-50',
    },
} as const;

const labels = {
    vi: {
        eyebrow: 'Bắt đầu bằng kết quả',
        title: 'Chọn việc bạn muốn hoàn tất',
        exportReady: 'Xuất gói',
        receiptReady: 'Có biên nhận',
    },
    en: {
        eyebrow: 'Start from outcome',
        title: 'Choose what you need finished',
        exportReady: 'Pack export',
        receiptReady: 'Receipt',
    },
} as const;

export function OutcomeQuickActions({ lang, onSelectTemplate, id }: OutcomeQuickActionsProps) {
    const copy = labels[lang];

    return (
        <section
            id={id}
            data-testid="outcome-quick-actions"
            aria-label={lang === 'vi' ? 'Hành động theo kết quả' : 'Outcome quick actions'}
            className="cvf-surface cvf-density-section rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_48px_-42px_rgba(15,23,42,0.45)] dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none"
        >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-white/35">
                        {copy.eyebrow}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                        {copy.title}
                    </h3>
                </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
                {OUTCOME_WORKFLOW_REGISTRY.map((action) => {
                    const Icon = iconByOutcome[action.outcomeKey] ?? ClipboardCheck;
                    const styles = toneStyles[action.tone];

                    return (
                        <button
                            key={action.templateId}
                            type="button"
                            onClick={() => onSelectTemplate(action.templateId)}
                            className={`group flex min-h-[132px] items-start gap-4 rounded-[18px] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-500/15 ${styles.border}`}
                            aria-label={action.title[lang]}
                        >
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
                                <Icon size={18} aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                                <span className={`block text-sm font-semibold ${styles.label}`}>{action.title[lang]}</span>
                                <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-white/50">
                                    {action.description[lang]}
                                </span>
                                <span className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-white/38">
                                    <span className="rounded-md border border-current/15 px-2 py-1">{copy.exportReady}</span>
                                    <span className="rounded-md border border-current/15 px-2 py-1">{copy.receiptReady}</span>
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
