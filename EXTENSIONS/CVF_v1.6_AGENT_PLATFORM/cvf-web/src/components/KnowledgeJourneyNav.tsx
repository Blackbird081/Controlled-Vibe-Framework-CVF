// Text Encoding Exception: localized Vietnamese user-facing copy follows this file's existing convention.

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { BookOpen, FileInput, ShieldCheck, Download, Send } from 'lucide-react';

interface KnowledgeJourneyNavProps {
    currentStep: number;
}

export function KnowledgeJourneyNav({ currentStep }: KnowledgeJourneyNavProps) {
    const { language } = useLanguage();

    const steps = [
        { id: 1, path: '/help', vi: '1. Tìm hiểu', en: '1. Learn', icon: BookOpen },
        { id: 2, path: '/knowledge/intake', vi: '2. Thu thập', en: '2. Intake', icon: FileInput },
        { id: 3, path: '/governance/knowledge', vi: '3. Kiểm duyệt', en: '3. Govern', icon: ShieldCheck },
        { id: 4, path: '/artifacts', vi: '4. Đóng gói', en: '4. Export', icon: Download },
        { id: 5, path: '/work-transfer', vi: '5. Bàn giao', en: '5. Handoff', icon: Send },
    ];

    return (
        <nav aria-label="Knowledge Journey" className="mb-6 w-full overflow-x-auto">
            <div className="flex min-w-max items-center gap-2 rounded-2xl bg-white p-2 shadow-sm border border-slate-200 dark:bg-gray-800 dark:border-gray-700">
                {steps.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isPast = step.id < currentStep;
                    const label = language === 'vi' ? step.vi : step.en;
                    const Icon = step.icon;

                    return (
                        <React.Fragment key={step.id}>
                            <Link
                                href={step.path}
                                aria-current={isActive ? 'step' : undefined}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                        : isPast
                                            ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-gray-700/50 dark:hover:text-white'
                                            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-gray-700/50 dark:hover:text-slate-300'
                                }`}
                            >
                                <Icon size={16} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                                <span className="whitespace-nowrap">{label}</span>
                            </Link>
                            {index < steps.length - 1 && (
                                <div className="h-4 w-px bg-slate-200 dark:bg-gray-700 mx-1" aria-hidden="true" />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </nav>
    );
}
