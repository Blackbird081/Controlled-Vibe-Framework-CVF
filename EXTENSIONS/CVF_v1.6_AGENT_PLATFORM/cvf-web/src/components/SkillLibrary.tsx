'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getSkillCategories } from '../actions/skills';
import { Skill, SkillCategory, SkillIndexPayload } from '../types/skill';
import { trackEvent } from '@/lib/analytics';
import { getTemplatesForSkill, domainToCategoryMap } from '@/lib/skill-template-map';
import { templates } from '@/lib/template-loader';
import { useLanguage } from '@/lib/i18n';

export function SkillLibrary() {
    const router = useRouter();
    const { t } = useLanguage();
    const [categories, setCategories] = useState<SkillCategory[]>([]);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchSkills() {
            try {
                let data: SkillCategory[] | null = null;
                if (typeof window !== 'undefined' && typeof fetch === 'function') {
                    try {
                        const response = await fetch('/data/skills-index.json', { cache: 'no-store' });
                        if (response.ok) {
                            const payload = await response.json() as SkillCategory[] | Partial<SkillIndexPayload>;
                            if (Array.isArray(payload)) {
                                data = payload;
                            } else if (payload && Array.isArray(payload.categories)) {
                                data = payload.categories;
                            }
                        }
                    } catch (error) {
                        console.warn('Failed to load skills index from public data', error);
                    }
                }
                if (!data) {
                    data = await getSkillCategories();
                }
                setCategories(data);
            } catch (error) {
                console.error('Failed to load skills', error);
            } finally {
                setLoading(false);
            }
        }
        fetchSkills();
    }, []);

    const filteredCategories = categories.map(cat => {
        const filteredSkills = cat.skills.filter(s =>
            s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return {
            ...cat,
            skills: filteredSkills,
            totalCount: cat.skills.length,
            visibleCount: filteredSkills.length
        };
    }).filter(cat => cat.skills.length > 0);

    const linkedTemplateIds = selectedSkill
        ? getTemplatesForSkill(selectedSkill.domain?.toLowerCase().replace(/ /g, '_') || '', selectedSkill.id)
        : [];
    const linkedTemplates = linkedTemplateIds
        .map(tid => templates.find(t => t.id === tid))
        .filter(Boolean);
        
    const domainCategory = selectedSkill
        ? domainToCategoryMap[selectedSkill.domain?.toLowerCase().replace(/ /g, '_') || '']
        : null;

    const openSkillDetail = (domainId: string, skillId: string) => {
        router.push(`/skills/${domainId}/${skillId}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-140px)] gap-6">
            {/* Sidebar - Skill Navigator */}
            <div className="w-full md:w-[35%] flex flex-col bg-white dark:bg-[#111113] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[50vh] md:max-h-none">
                <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111113]">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-4">{t('skills.library')}</h2>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder={t('skills.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#161618] border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all shadow-sm"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 transition-colors group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    {filteredCategories.length === 0 ? (
                        <div className="text-center p-8 text-gray-400 text-sm">
                            <p>{t('skills.noResults')} &quot;{searchTerm}&quot;</p>
                        </div>
                    ) : (
                        filteredCategories.map(category => (
                            <div key={category.id} className="mb-2">
                                <div className="px-3 py-1 flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{category.name}</h3>
                                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-full">
                                        {searchTerm ? `${category.visibleCount}/${category.totalCount}` : category.totalCount}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {category.skills.map(skill => (
                                        <div
                                            key={skill.id}
                                            onClick={() => {
                                                setSelectedSkill(skill);
                                                trackEvent('skill_viewed', { skillId: skill.id, skillTitle: skill.title, domain: skill.domain, difficulty: skill.difficulty });
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setSelectedSkill(skill);
                                                }
                                            }}
                                            className={`group w-full text-left px-4 py-3 rounded-2xl text-sm transition-all flex items-center justify-between ${selectedSkill?.id === skill.id
                                                ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 shadow-sm'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-transparent'
                                                } cursor-pointer`}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedSkill?.id === skill.id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'}`}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                                </div>
                                                <span className="font-medium truncate">{skill.title}</span>
                                            </div>
                                            
                                            {skill.difficulty && (() => {
                                                const diffRaw = skill.difficulty || '';
                                                const diff = diffRaw.toLowerCase().includes('easy') ? 'Easy' : diffRaw.toLowerCase().includes('medium') ? 'Medium' : diffRaw.toLowerCase().includes('advanced') || diffRaw.toLowerCase().includes('hard') ? 'Advanced' : diffRaw.split('—')[0].trim();
                                                const badgeClasses = diff === 'Easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : diff === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
                                                return (
                                                    <span className={`shrink-0 ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeClasses}`}>
                                                        {diff}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content - Skill Viewer / Empty State */}
            <div className="w-full md:w-[65%] flex flex-col min-h-[40vh] md:min-h-0 bg-white dark:bg-[#111113] rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden relative">
                {selectedSkill ? (
                    <div className="flex flex-col h-full bg-white dark:bg-[#111113] absolute inset-0">
                        {/* Skill Header */}
                        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800/60 bg-gradient-to-b from-gray-50/50 to-white dark:from-[#161618] dark:to-[#111113]">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded-md uppercase">
                                            {selectedSkill.domain}
                                        </span>
                                        <button 
                                            onClick={() => openSkillDetail(selectedSkill.domain?.toLowerCase().replace(/ /g, '-') || '', selectedSkill.id)}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                            title={t('skills.open')}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </button>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                                        {selectedSkill.title}
                                    </h1>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedSkill.content || '');
                                            trackEvent('skill_copied', { skillId: selectedSkill.id, skillTitle: selectedSkill.title });
                                            alert(t('skills.copied'));
                                        }}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                        {t('skills.copyRaw')}
                                    </button>
                                </div>
                            </div>

                            {/* Template Integration Area */}
                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                {linkedTemplates.length > 0 ? (
                                    linkedTemplates.map(tmpl => tmpl && (
                                        <a
                                            key={tmpl.id}
                                            href={`/?template=${tmpl.id}`}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-xl hover:opacity-90 transition-opacity shadow-md"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                                            {t('skills.useTemplate').replace('📝 ', '')} {tmpl.name}
                                        </a>
                                    ))
                                ) : domainCategory ? (
                                    <a
                                        href={`/?category=${domainCategory}`}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                    >
                                        {t('skills.browseTemplates')} {domainCategory}
                                    </a>
                                ) : null}
                            </div>
                        </div>

                        {/* Skill Content Body */}
                        <div className="flex-1 overflow-y-auto w-full p-6 sm:p-8 bg-white dark:bg-[#111113]">
                            <div className="prose dark:prose-invert prose-blue max-w-4xl mx-auto prose-headings:font-bold prose-a:text-blue-600">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedSkill.content || ''}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Background Metadata (Low Emphasis for non-coders) */}
                        <div className="bg-gray-50 dark:bg-[#161618] border-t border-gray-100 dark:border-gray-800/60 p-4">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest mb-2 px-2">Technical Specs</p>
                            <div className="flex flex-wrap gap-2 px-2">
                                {selectedSkill.riskLevel && <span className="px-2 py-1 text-[10px] bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 rounded-md">Risk: {selectedSkill.riskLevel}</span>}
                                {selectedSkill.autonomy && <span className="px-2 py-1 text-[10px] bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 rounded-md">Autonomy: {selectedSkill.autonomy}</span>}
                                {selectedSkill.allowedRoles && <span className="px-2 py-1 text-[10px] bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 rounded-md">Roles: {selectedSkill.allowedRoles}</span>}
                                {selectedSkill.id && <span className="px-2 py-1 text-[10px] bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 rounded-md font-mono">ID: {selectedSkill.id}</span>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 lg:p-12 absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white dark:from-[#111113] dark:to-[#161618]">
                        <div className="w-24 h-24 mb-8 relative">
                            <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                            <div className="relative w-full h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-xl">
                                <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            </div>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                            {t('skills.selectSkill')}
                        </h3>
                        <p className="max-w-md text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                            {t('skills.selectSkillDesc')}
                        </p>
                        <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            Powered by CVF
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
