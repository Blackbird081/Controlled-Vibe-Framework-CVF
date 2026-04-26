'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { BrainCircuit, GitBranch, Search as SearchIcon, Workflow } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import {
    IndustryFilter,
    SkillGraph,
    SkillPlanner,
    SkillSearchBar,
    SurfaceStatCard,
    SurfaceTopBar,
} from '@/components';
import { useLanguage } from '@/lib/i18n';
import type { SkillRecord, SearchResult } from '@/lib/skill-search';
import type { SkillPlan } from '@/lib/skill-planner';

type ActiveTab = 'search' | 'planner';

export default function SkillSearchPage() {
    return (
        <Suspense fallback={<div className="px-4 py-10 text-sm text-slate-500">Loading...</div>}>
            <SkillSearchPageInner />
        </Suspense>
    );
}

function SkillSearchPageInner() {
    const { language } = useLanguage();
    const searchParams = useSearchParams();
    const initialTabParam = searchParams.get('tab');
    const initialQueryParam = searchParams.get('q') ?? '';
    const initialTaskParam = searchParams.get('task') ?? '';

    const [activeTab, setActiveTab] = useState<ActiveTab>(initialTabParam === 'planner' ? 'planner' : 'search');
    const [domainFilter, setDomainFilter] = useState('');
    const [plan, setPlan] = useState<SkillPlan | null>(null);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedSkill, setSelectedSkill] = useState<SkillRecord | null>(null);
    const [initialQuery] = useState(initialQueryParam);
    const [initialTask] = useState(initialTaskParam);

    const handleSkillSelect = useCallback((skill: SkillRecord) => {
        setSelectedSkill(skill);
    }, []);

    const handleResults = useCallback((results: SearchResult[]) => {
        setSearchResults(results);
    }, []);

    const handlePlanGenerated = useCallback((nextPlan: SkillPlan) => {
        setPlan(nextPlan);
    }, []);

    const handleSkillClick = useCallback((skillId: string) => {
        console.log('Skill clicked:', skillId);
    }, []);

    const statCards = useMemo(() => ([
        {
            label: language === 'vi' ? 'Kết quả tìm thấy' : 'Search hits',
            value: String(searchResults.length),
            icon: SearchIcon,
            tone: 'accent' as const,
        },
        {
            label: language === 'vi' ? 'Bước kế hoạch' : 'Plan steps',
            value: String(plan?.phases.length ?? 0),
            icon: GitBranch,
            tone: 'emerald' as const,
        },
        {
            label: language === 'vi' ? 'Kỹ năng đề xuất' : 'Recommended skills',
            value: String(plan?.total_skills ?? 0),
            icon: Workflow,
            tone: 'amber' as const,
        },
        {
            label: language === 'vi' ? 'Chi tiết đang chọn' : 'Selected detail',
            value: selectedSkill ? '1' : '0',
            icon: BrainCircuit,
            tone: 'violet' as const,
        },
    ]), [language, plan, searchResults.length, selectedSkill]);

    return (
        <div className="pb-10">
            <SurfaceTopBar
                title={language === 'vi' ? 'Tìm kỹ năng & lập kế hoạch' : 'Skill Search & Planner'}
                subtitle={language === 'vi'
                    ? 'Tìm kỹ năng theo từ khóa hoặc xây dựng kế hoạch làm việc theo từng bước.'
                    : 'Search skills by keyword or build a step-by-step work plan.'}
                actions={(
                    <Link
                        href="/skills"
                        className="cvf-control inline-flex items-center rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                    >
                        {language === 'vi' ? 'Mở thư viện kỹ năng' : 'Open skill library'}
                    </Link>
                )}
            />

            <div className="space-y-8 px-4 py-6 sm:px-6">
                <section className="cvf-surface cvf-density-section rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_38%),linear-gradient(135deg,_#f8fafc,_#ffffff)] p-6 shadow-[0_20px_55px_-45px_rgba(79,70,229,0.35)] dark:border-white/[0.07] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_36%),linear-gradient(135deg,_#131827,_#10131d)] dark:shadow-none sm:p-7">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {statCards.map((card) => (
                            <SurfaceStatCard
                                key={card.label}
                                label={card.label}
                                value={card.value}
                                icon={card.icon}
                                tone={card.tone}
                            />
                        ))}
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                    <section className="cvf-surface cvf-density-section rounded-[32px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none sm:p-6">
                        <div className="space-y-6">
                            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-white/[0.08] dark:bg-[#10131d]">
                                <button
                                    onClick={() => setActiveTab('search')}
                                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                        activeTab === 'search'
                                            ? 'bg-white text-slate-950 shadow-sm dark:bg-white/[0.08] dark:text-white'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-white/45 dark:hover:text-white'
                                    }`}
                                >
                                    {language === 'vi' ? 'Tìm kiếm' : 'Search'}
                                </button>
                                <button
                                    onClick={() => setActiveTab('planner')}
                                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                        activeTab === 'planner'
                                            ? 'bg-white text-slate-950 shadow-sm dark:bg-white/[0.08] dark:text-white'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-white/45 dark:hover:text-white'
                                    }`}
                                >
                                    {language === 'vi' ? 'Lập kế hoạch' : 'Planner'}
                                </button>
                            </div>

                            {activeTab === 'search' ? (
                                <div className="space-y-5">
                                    <IndustryFilter
                                        mode="domain"
                                        selected={domainFilter}
                                        onChange={setDomainFilter}
                                    />
                                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.08] dark:bg-[#10131d]">
                                        <SkillSearchBar
                                            onSelect={handleSkillSelect}
                                            onResults={handleResults}
                                            initialQuery={initialQuery}
                                            domainFilter={domainFilter || undefined}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <IndustryFilter
                                        mode="industry"
                                        onChange={() => {}}
                                    />
                                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.08] dark:bg-[#10131d]">
                                        <SkillPlanner
                                            initialTask={initialTask}
                                            onPlanGenerated={handlePlanGenerated}
                                            onSkillClick={handleSkillClick}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <div className="cvf-surface cvf-density-section rounded-[32px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none">
                            <SkillGraph
                                plan={activeTab === 'planner' ? plan : null}
                                skills={activeTab === 'search' ? searchResults.map(result => result.skill) : []}
                                onSkillClick={handleSkillClick}
                            />
                        </div>

                        {selectedSkill && (
                            <div className="cvf-surface cvf-density-section rounded-[32px] border border-indigo-200/80 bg-white p-5 shadow-[0_20px_55px_-45px_rgba(79,70,229,0.35)] dark:border-indigo-500/20 dark:bg-[#171b29] dark:shadow-none">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">
                                            {language === 'vi' ? 'Kỹ năng đang chọn' : 'Selected skill'}
                                        </div>
                                        <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                                            {selectedSkill.skill_name}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSkill(null)}
                                        className="text-slate-400 transition hover:text-slate-700 dark:hover:text-white/80"
                                        aria-label="Close detail"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-white/58">
                                    <p><span className="font-semibold text-slate-900 dark:text-white">{language === 'vi' ? 'Nhóm:' : 'Group:'}</span> {selectedSkill.domain}</p>
                                    <p><span className="font-semibold text-slate-900 dark:text-white">{language === 'vi' ? 'Mức lưu ý:' : 'Care level:'}</span> {selectedSkill.risk_level}</p>
                                    <p><span className="font-semibold text-slate-900 dark:text-white">{language === 'vi' ? 'Độ khó:' : 'Difficulty:'}</span> {selectedSkill.difficulty}</p>
                                    <p><span className="font-semibold text-slate-900 dark:text-white">{language === 'vi' ? 'Bước phù hợp:' : 'Best steps:'}</span> {selectedSkill.phases}</p>
                                    {selectedSkill.description && <p className="pt-2">{selectedSkill.description}</p>}
                                </div>
                                <div className="mt-5">
                                    <Link
                                        href={`/skills/${selectedSkill.domain}/${selectedSkill.skill_id}`}
                                        className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
                                    >
                                        {language === 'vi' ? 'Mở chi tiết kỹ năng' : 'Open skill detail'} →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}
