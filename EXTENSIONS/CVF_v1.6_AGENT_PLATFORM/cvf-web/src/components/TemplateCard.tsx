'use client';

import { Template, CATEGORY_INFO, Category } from '@/types';
import { useLanguage } from '@/lib/i18n';
import { getTemplateName, getTemplateDescription } from '@/lib/template-i18n';

interface TemplateCardProps {
    template: Template;
    onClick: () => void;
    onPreview?: (e: React.MouseEvent) => void;
    onTry?: () => void;
}

export function TemplateCard({ template, onClick, onPreview, onTry }: TemplateCardProps) {
    const { language } = useLanguage();
    const categoryInfo = CATEGORY_INFO[template.category as Category];
    const categoryDisplayName = language === 'en' ? categoryInfo.nameEn : categoryInfo.name;
    const templateDisplayName = getTemplateName(template.id, template.name, language);
    const templateDisplayDesc = getTemplateDescription(template.id, template.description, language);
    const categoryBadgeClasses = {
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
        green: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
        orange: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
        pink: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
        cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
        red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
        indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    }[categoryInfo.color];

    // Difficulty badge config
    const difficultyConfig = {
        easy: {
            label: language === 'en' ? 'Easy' : 'Dễ',
            className: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
        },
        medium: {
            label: language === 'en' ? 'Medium' : 'Trung bình',
            className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
        },
        advanced: {
            label: language === 'en' ? 'Advanced' : 'Nâng cao',
            className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
        },
    };
    const difficulty = template.difficulty || 'medium';
    const diffBadge = difficultyConfig[difficulty];

    return (
        <div
            onClick={onClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
            role="button"
            tabIndex={0}
            title={language === 'en' ? 'Click to use this template' : 'Click để sử dụng template này'}
            className="group relative cvf-surface cursor-pointer rounded-[28px] border border-slate-200/80 bg-white p-7
                 shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition-all duration-200
                 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_34px_-24px_rgba(79,70,229,0.55)]
                 dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none dark:hover:border-indigo-400/35 dark:hover:shadow-[0_18px_40px_-30px_rgba(99,102,241,0.45)]"
        >
            <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-white/[0.06]">
                    {template.icon}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${diffBadge.className}`}>
                        {diffBadge.label}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]
                          ${categoryBadgeClasses}`}>
                        {categoryDisplayName}
                    </span>
                </div>
            </div>

            <h3 className="mt-6 text-[1.65rem] font-semibold tracking-[-0.03em] text-slate-950 dark:text-white
                     group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                {templateDisplayName.replace(/^[\p{Emoji}\s]+/gu, '')}
            </h3>

            <p className="mt-3 text-base leading-8 text-slate-500 dark:text-white/48 line-clamp-3">
                {templateDisplayDesc}
            </p>

            <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center text-base font-medium text-indigo-600 dark:text-indigo-300">
                    {language === 'en' ? 'Use Template' : 'Sử dụng'}
                    <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>

                <div className="flex items-center gap-1.5">
                    {onTry && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onTry(); }}
                            className="cvf-control rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                            title={language === 'en' ? 'Try with sample data' : 'Thử với dữ liệu mẫu'}
                        >
                            {language === 'en' ? '⚡ Try' : '⚡ Thử ngay'}
                        </button>
                    )}
                    {onPreview && template.sampleOutput && (
                        <button
                            onClick={onPreview}
                            className="cvf-control rounded-2xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-white/[0.06] dark:hover:text-indigo-300"
                            title={language === 'en' ? 'Preview output' : 'Xem trước kết quả'}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
