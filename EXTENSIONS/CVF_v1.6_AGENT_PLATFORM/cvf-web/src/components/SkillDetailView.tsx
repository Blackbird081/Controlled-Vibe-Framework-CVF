'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Skill } from '@/types/skill';
import { useLanguage } from '@/lib/i18n';

type ViewMode = 'skill' | 'uat';

const uatBadgeClasses = (status?: string) => {
    switch ((status || '').toUpperCase()) {
        case 'PASS':
            return 'bg-emerald-100 text-emerald-800';
        case 'SOFT FAIL':
            return 'bg-amber-100 text-amber-800';
        case 'FAIL':
            return 'bg-rose-100 text-rose-800';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const specGateBadgeClasses = (status?: string) => {
    switch ((status || '').toUpperCase()) {
        case 'PASS':
            return 'bg-emerald-100 text-emerald-800';
        case 'CLARIFY':
            return 'bg-amber-100 text-amber-800';
        case 'FAIL':
            return 'bg-rose-100 text-rose-800';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const corpusClassBadge = (skill: Skill, t: (key: string) => string) => {
    if (skill.corpusClass === 'TRUSTED_FOR_VALUE_PROOF') {
        return {
            className: 'bg-emerald-100 text-emerald-800',
            label: skill.trustedBenchmarkSurface ? t('skills.trustedBenchmark') : t('skills.trustedSupporting'),
        };
    }
    if (skill.corpusClass === 'REVIEW_REQUIRED') {
        return {
            className: 'bg-amber-100 text-amber-800',
            label: t('skills.reviewRequired'),
        };
    }
    if (skill.corpusClass === 'LEGACY_LOW_CONFIDENCE' || skill.corpusClass === 'REJECT_FOR_NON_CODER_FRONTDOOR' || skill.corpusClass === 'UNSCREENED_LEGACY') {
        return {
            className: 'bg-slate-100 text-slate-700',
            label: t('skills.quarantined'),
        };
    }
    return null;
};

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
                            <span className="text-slate-300 dark:text-white/20">•</span>
                            <span className="text-xs text-slate-500 dark:text-white/35 font-mono">{skill.id}.skill.md</span>
                        </div>
                        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">{skill.title}</h1>
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
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#10131d] dark:text-white/70 dark:hover:bg-white/[0.06]"
                        >
                            {t('skills.copyRaw')}
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {skill.riskLevel && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold bg-rose-100 text-rose-800 rounded-full">
                            {t('skills.risk')}: {skill.riskLevel}
                        </span>
                    )}
                    {skill.autonomy && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded-full">
                            {t('skills.autonomy')}: {skill.autonomy}
                        </span>
                    )}
                    {skill.allowedRoles && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold bg-sky-100 text-sky-800 rounded-full">
                            {t('skills.roles')}: {skill.allowedRoles}
                        </span>
                    )}
                    {skill.allowedPhases && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                            {t('skills.phases')}: {skill.allowedPhases}
                        </span>
                    )}
                    {skill.authorityScope && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-100 text-indigo-800 rounded-full">
                            {t('skills.scope')}: {skill.authorityScope}
                        </span>
                    )}
                    {corpusClassBadge(skill, t) && (
                        <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${corpusClassBadge(skill, t)?.className}`}>
                            {corpusClassBadge(skill, t)?.label}
                        </span>
                    )}
                    {skill.specGate && (
                        <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${specGateBadgeClasses(skill.specGate)}`}>
                            {t('skills.specGate')}: {skill.specGate}
                        </span>
                    )}
                    <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${uatBadgeClasses(skill.uatStatus)}`}>
                        {t('skills.outputUatLabel')}: {skill.uatStatus || t('skills.notRun')}
                    </span>
                    {typeof skill.uatScore === 'number' && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 text-gray-700 rounded-full">
                            {t('skills.scoreLabel')}: {skill.uatScore}%
                        </span>
                    )}
                    {skill.uatQuality && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 text-gray-700 rounded-full">
                            {t('skills.outputQuality')}: {skill.uatQuality}
                        </span>
                    )}
                    {typeof skill.specScore === 'number' && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded-full">
                            {t('skills.specLabel')}: {skill.specScore}%
                        </span>
                    )}
                    {skill.specQuality && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded-full">
                            {t('skills.specQualityLabel')}: {skill.specQuality}
                        </span>
                    )}
                </div>
                {skill.corpusNote && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-xs leading-6 text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/60">
                        {skill.corpusNote}
                    </div>
                )}
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
