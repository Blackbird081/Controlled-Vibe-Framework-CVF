'use client';

import { BookOpenText, ClipboardList, LineChart } from 'lucide-react';

type OutcomeQuickActionsLang = 'vi' | 'en';

export interface OutcomeQuickActionsProps {
    lang: OutcomeQuickActionsLang;
    onSelectTemplate: (templateId: string) => void;
}

const ACTIONS = [
    {
        templateId: 'app_builder_complete',
        icon: ClipboardList,
        tone: 'emerald',
        title: {
            vi: 'Tạo Product Brief',
            en: 'Create Product Brief',
        },
        description: {
            vi: 'Bắt đầu gói mô tả sản phẩm có governance receipt.',
            en: 'Start a governed product brief pack with receipt evidence.',
        },
    },
    {
        templateId: 'documentation',
        icon: BookOpenText,
        tone: 'sky',
        title: {
            vi: 'Tạo SOP',
            en: 'Generate SOP',
        },
        description: {
            vi: 'Chuyển ghi chú quy trình thành SOP có cấu trúc.',
            en: 'Turn process notes into a structured governed SOP.',
        },
    },
    {
        templateId: 'strategy_analysis',
        icon: LineChart,
        tone: 'amber',
        title: {
            vi: 'Phân tích chiến lược',
            en: 'Analyze Strategy',
        },
        description: {
            vi: 'So sánh lựa chọn và rủi ro bằng pack phân tích chiến lược.',
            en: 'Compare options and risks with a governed strategy pack.',
        },
    },
] as const;

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
} as const;

export function OutcomeQuickActions({ lang, onSelectTemplate }: OutcomeQuickActionsProps) {
    return (
        <section aria-label={lang === 'vi' ? 'Hành động theo kết quả' : 'Outcome quick actions'} className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-white/35">
                        {lang === 'vi' ? 'Bắt đầu bằng kết quả' : 'Start from outcome'}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                        {lang === 'vi' ? 'Chọn nhanh gói cần tạo' : 'Choose the pack you need'}
                    </h3>
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
                {ACTIONS.map((action) => {
                    const Icon = action.icon;
                    const styles = toneStyles[action.tone];

                    return (
                        <button
                            key={action.templateId}
                            type="button"
                            onClick={() => onSelectTemplate(action.templateId)}
                            className={`group flex min-h-[120px] items-start gap-4 rounded-[22px] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-500/15 ${styles.border}`}
                            aria-label={action.title[lang]}
                        >
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
                                <Icon size={18} aria-hidden="true" />
                            </span>
                            <span>
                                <span className={`block text-sm font-semibold ${styles.label}`}>{action.title[lang]}</span>
                                <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-white/50">
                                    {action.description[lang]}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
