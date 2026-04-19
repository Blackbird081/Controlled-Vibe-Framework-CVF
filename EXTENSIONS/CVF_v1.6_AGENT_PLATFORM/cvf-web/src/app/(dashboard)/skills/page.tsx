'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Layers3, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { SkillLibrary, SurfaceStatCard, SurfaceTopBar } from '@/components';
import { useLanguage } from '@/lib/i18n';

interface SkillIndexCategory {
    id: string;
    name: string;
    skills: Array<{ id: string; difficulty?: string }>;
}

export default function SkillsPage() {
    const { language } = useLanguage();
    const [stats, setStats] = useState({
        totalSkills: 0,
        totalDomains: 0,
        searchable: 0,
        beginnerFriendly: 0,
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

                const allSkills = categories.flatMap(c => c.skills);
                const beginnerFriendly = allSkills.filter(s =>
                    s.difficulty?.toLowerCase().includes('easy')
                ).length;

                if (!cancelled) {
                    setStats({
                        totalSkills,
                        totalDomains: categories.length,
                        searchable: totalSkills,
                        beginnerFriendly,
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
            label: language === 'vi' ? 'Dễ bắt đầu' : 'Beginner-friendly',
            value: String(stats.beginnerFriendly || 0),
            icon: Sparkles,
            tone: 'violet' as const,
        },
    ]), [language, stats]);

    return (
        <div className="pb-10">
            <SurfaceTopBar
                title={language === 'vi' ? 'Kỹ năng AI' : 'Skills'}
                subtitle={language === 'vi'
                    ? 'Khám phá kỹ năng AI đã được kiểm duyệt — tìm đúng skill cho công việc của bạn.'
                    : 'Explore curated AI skills — find the right one for your task.'}
                actions={(
                    <Link
                        href="/marketplace"
                        className="cvf-control inline-flex items-center rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                    >
                        {language === 'vi' ? 'Mở marketplace' : 'Browse marketplace'}
                    </Link>
                )}
            />

            <div className="space-y-8 px-4 py-6 sm:px-6">
                <section className="cvf-surface cvf-density-section rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_38%),linear-gradient(135deg,_#f8fafc,_#ffffff)] p-6 shadow-[0_20px_55px_-45px_rgba(79,70,229,0.35)] dark:border-white/[0.07] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_36%),linear-gradient(135deg,_#131827,_#10131d)] dark:shadow-none sm:p-7">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-white/35">
                                    {language === 'vi' ? 'Thư viện kỹ năng' : 'Skill Library'}
                                </div>
                                <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                                    {language === 'vi' ? 'Kỹ năng AI cho mọi loại công việc' : 'AI skills for every type of work'}
                                </h2>
                                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-white/55">
                                    {language === 'vi'
                                        ? 'Mỗi skill đã được kiểm duyệt và gắn với template sẵn có. Chọn skill, điền form, nhận kết quả đã quản trị.'
                                        : 'Every skill is curated and linked to ready-made templates. Pick a skill, fill the form, get a governed result.'}
                                </p>
                            </div>
                            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/45">
                                {language === 'vi'
                                        ? 'Mỗi skill có trang chi tiết đầy đủ — xem ví dụ, yêu cầu và cách sử dụng.'
                                        : 'Each skill has a full detail page — see examples, requirements, and usage tips.'}
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
