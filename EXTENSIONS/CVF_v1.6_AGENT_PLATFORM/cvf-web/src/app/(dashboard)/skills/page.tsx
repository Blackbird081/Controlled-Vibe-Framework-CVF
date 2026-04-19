'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Layers3, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { SkillLibrary, SurfaceStatCard, SurfaceTopBar } from '@/components';
import { useLanguage } from '@/lib/i18n';

interface SkillIndexCategory {
    id: string;
    name: string;
    skills: Array<{ id: string }>;
}

export default function SkillsPage() {
    const { language } = useLanguage();
    const [stats, setStats] = useState({
        totalSkills: 0,
        totalDomains: 0,
        searchable: 0,
        curated: 0,
    });

    useEffect(() => {
        let cancelled = false;

        async function loadStats() {
            try {
                const response = await fetch('/data/skills-index.json', { cache: 'no-store' });
                if (!response.ok) return;
                const payload = await response.json() as SkillIndexCategory[] | { categories?: SkillIndexCategory[] };
                const categories = Array.isArray(payload) ? payload : payload.categories ?? [];
                const totalSkills = categories.reduce((sum, category) => sum + category.skills.length, 0);

                if (!cancelled) {
                    setStats({
                        totalSkills,
                        totalDomains: categories.length,
                        searchable: totalSkills,
                        curated: categories.filter(category => category.skills.length > 0).length,
                    });
                }
            } catch (error) {
                console.warn('Failed to load skill stats', error);
            }
        }

        void loadStats();
        return () => {
            cancelled = true;
        };
    }, []);

    const statCards = useMemo(() => ([
        {
            label: language === 'vi' ? 'Tổng số skill' : 'Total Skills',
            value: String(stats.totalSkills || 0),
            icon: Layers3,
            tone: 'accent' as const,
        },
        {
            label: language === 'vi' ? 'Miền kỹ năng' : 'Domains',
            value: String(stats.totalDomains || 0),
            icon: ShieldCheck,
            tone: 'emerald' as const,
        },
        {
            label: language === 'vi' ? 'Sẵn cho tìm kiếm' : 'Search-ready',
            value: String(stats.searchable || 0),
            icon: Search,
            tone: 'amber' as const,
        },
        {
            label: language === 'vi' ? 'Nhóm đã curate' : 'Curated Groups',
            value: String(stats.curated || 0),
            icon: Sparkles,
            tone: 'violet' as const,
        },
    ]), [language, stats]);

    return (
        <div className="pb-10">
            <SurfaceTopBar
                title={language === 'vi' ? 'Kỹ năng AI' : 'Skills'}
                subtitle={language === 'vi'
                    ? 'Duyệt thư viện skill với cùng app shell, typography và hierarchy như phần còn lại của CVF.'
                    : 'Browse the skill library inside the same shell, typography, and hierarchy as the rest of CVF.'}
                actions={(
                    <Link
                        href="/marketplace"
                        className="cvf-control inline-flex items-center rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                    >
                        {language === 'vi' ? 'Mở marketplace' : 'Browse marketplace'}
                    </Link>
                )}
            />

            <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6">
                <section className="cvf-surface cvf-density-section rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_38%),linear-gradient(135deg,_#f8fafc,_#ffffff)] p-6 shadow-[0_20px_55px_-45px_rgba(79,70,229,0.35)] dark:border-white/[0.07] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_36%),linear-gradient(135deg,_#131827,_#10131d)] dark:shadow-none sm:p-7">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-white/35">
                                    {language === 'vi' ? 'Workspace đã govern' : 'Governed workspace'}
                                </div>
                                <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                                    {language === 'vi' ? 'Skill library với trình bày chuyên nghiệp hơn' : 'A more polished skill library'}
                                </h2>
                                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-white/55">
                                    {language === 'vi'
                                        ? 'Giữ nguyên data load, search, routing chi tiết và CVF-linked behaviors; chỉ nâng cách nhìn, khoảng trắng, card hierarchy và top-level framing.'
                                        : 'The data load, search, detail routing, and CVF-linked behaviors stay intact; only the framing, spacing, and hierarchy become stronger.'}
                                </p>
                            </div>
                            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/45">
                                {language === 'vi'
                                        ? 'Trang chi tiết skill vẫn mở theo route hiện có để không đổi luồng data.'
                                        : 'Skill details still open through the existing routes so the data flow does not change.'}
                            </div>
                        </div>

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
                    </div>
                </section>

                <section className="cvf-surface cvf-density-section rounded-[32px] border border-slate-200/80 bg-white p-4 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none sm:p-6">
                    <SkillLibrary />
                </section>
            </div>
        </div>
    );
}
