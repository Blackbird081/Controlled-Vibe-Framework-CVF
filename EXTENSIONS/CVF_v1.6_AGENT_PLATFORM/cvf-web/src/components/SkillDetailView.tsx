'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Skill } from '@/types/skill';

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

export function SkillDetailView({ skill }: { skill: Skill }) {
    const [viewMode, setViewMode] = useState<ViewMode>('skill');

    const handleCopy = async () => {
        const text = viewMode === 'skill' ? (skill.content || '') : (skill.uatContent || '');
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // ignore clipboard errors
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-md uppercase">{skill.domain}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs text-gray-500 font-mono">{skill.id}.skill.md</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{skill.title}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                            <button
                                onClick={() => setViewMode('skill')}
                                className={`px-3 py-1 text-xs rounded-full ${viewMode === 'skill' ? 'bg-white dark:bg-gray-900 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                            >
                                Skill
                            </button>
                            <button
                                onClick={() => setViewMode('uat')}
                                className={`px-3 py-1 text-xs rounded-full ${viewMode === 'uat' ? 'bg-white dark:bg-gray-900 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                            >
                                UAT
                            </button>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs"
                        >
                            Copy Raw
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {skill.riskLevel && (
                        <span className="px-2 py-1 text-[11px] font-semibold bg-rose-100 text-rose-800 rounded-full">
                            Risk: {skill.riskLevel}
                        </span>
                    )}
                    {skill.autonomy && (
                        <span className="px-2 py-1 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded-full">
                            Autonomy: {skill.autonomy}
                        </span>
                    )}
                    {skill.allowedRoles && (
                        <span className="px-2 py-1 text-[11px] font-semibold bg-sky-100 text-sky-800 rounded-full">
                            Roles: {skill.allowedRoles}
                        </span>
                    )}
                    {skill.allowedPhases && (
                        <span className="px-2 py-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                            Phases: {skill.allowedPhases}
                        </span>
                    )}
                    {skill.authorityScope && (
                        <span className="px-2 py-1 text-[11px] font-semibold bg-indigo-100 text-indigo-800 rounded-full">
                            Scope: {skill.authorityScope}
                        </span>
                    )}
                    {skill.specGate && (
                        <span className={`px-2 py-1 text-[11px] font-semibold rounded-full ${specGateBadgeClasses(skill.specGate)}`}>
                            Spec Gate: {skill.specGate}
                        </span>
                    )}
                    <span className={`px-2 py-1 text-[11px] font-semibold rounded-full ${uatBadgeClasses(skill.uatStatus)}`}>
                        Output UAT: {skill.uatStatus || 'Not Run'}
                    </span>
                    {typeof skill.uatScore === 'number' && (
                        <span className="px-2 py-1 text-[11px] font-semibold bg-gray-100 text-gray-700 rounded-full">
                            Score: {skill.uatScore}%
                        </span>
                    )}
                    {skill.uatQuality && (
                        <span className="px-2 py-1 text-[11px] font-semibold bg-gray-100 text-gray-700 rounded-full">
                            Output Quality: {skill.uatQuality}
                        </span>
                    )}
                    {typeof skill.specScore === 'number' && (
                        <span className="px-2 py-1 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded-full">
                            Spec: {skill.specScore}%
                        </span>
                    )}
                    {skill.specQuality && (
                        <span className="px-2 py-1 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded-full">
                            Spec Quality: {skill.specQuality}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
                {viewMode === 'uat' ? (
                    skill.uatContent ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {skill.uatContent}
                        </ReactMarkdown>
                    ) : (
                        <div className="text-sm text-gray-500">No UAT record found for this skill.</div>
                    )
                ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {skill.content || ''}
                    </ReactMarkdown>
                )}
            </div>
        </div>
    );
}
