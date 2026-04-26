'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Skill } from '@/types/skill';
import { useLanguage } from '@/lib/i18n';

type ViewMode = 'skill' | 'uat';

export function SkillDetailView({ skill }: { skill: Skill }) {
    const [viewMode, setViewMode] = useState<ViewMode>('skill');
    const { t } = useLanguage();

    const handleCopy = async () => {
        const text = viewMode === 'skill' ? (skill.content || '') : (skill.uatContent || '');
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // ignore clipboard errors
        }
    };

    return (
        <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_22px_55px_-45px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none">
            <div className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_34%),linear-gradient(135deg,_#f8fafc,_#ffffff)] p-6 dark:border-white/[0.07] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_36%),linear-gradient(135deg,_#131827,_#10131d)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{skill.domain}</span>
                            {skill.difficulty && (
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                    {t('skills.difficultyLabel')}: {skill.difficulty}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-700 dark:text-slate-100 sm:text-[1.75rem]">{skill.title}</h1>
                        {skill.summary && (
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-white/55">
                                {skill.summary}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-full border border-slate-200 bg-white p-1 dark:border-white/[0.08] dark:bg-[#10131d]">
                            <button
                                onClick={() => setViewMode('skill')}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${viewMode === 'skill' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-white/55'}`}
                            >
                                {t('skills.skillTab')}
                            </button>
                            <button
                                onClick={() => setViewMode('uat')}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${viewMode === 'uat' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-white/55'}`}
                            >
                                {t('skills.uatTab')}
                            </button>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 dark:border-white/[0.08] dark:bg-[#10131d] dark:text-white/65 dark:hover:bg-white/[0.06] dark:hover:text-white/85"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                            </svg>
                            {t('skills.copyRaw')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6 sm:p-8">
                {viewMode === 'uat' ? (
                    skill.uatContent ? (
                        <div className="prose prose-lg max-w-none prose-headings:tracking-[-0.03em] prose-h2:text-2xl prose-h2:font-semibold prose-p:leading-8 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-pink-600 prose-pre:rounded-2xl prose-pre:bg-[#0d0f1a] prose-pre:text-slate-100 dark:prose-invert dark:prose-code:bg-white/[0.06] dark:prose-code:text-pink-300">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {skill.uatContent}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 dark:text-white/50">{t('skills.noUat')}</div>
                    )
                ) : (
                    <div className="prose prose-lg max-w-none prose-headings:tracking-[-0.03em] prose-h2:text-2xl prose-h2:font-semibold prose-p:leading-8 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-pink-600 prose-pre:rounded-2xl prose-pre:bg-[#0d0f1a] prose-pre:text-slate-100 dark:prose-invert dark:prose-code:bg-white/[0.06] dark:prose-code:text-pink-300">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {skill.content || ''}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
