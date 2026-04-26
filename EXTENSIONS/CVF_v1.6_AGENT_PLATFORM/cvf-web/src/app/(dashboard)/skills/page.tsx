'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Layers3, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { SkillLibrary, SurfaceStatCard, SurfaceTopBar } from '@/components';
import { isIntentFirstEnabled } from '@/lib/intent-router';
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
            label: language === 'vi' ? 'Tổng kỹ năng' : 'Total Skills',
            value: String(stats.totalSkills || 0),
            icon: Layers3,
            tone: 'accent' as const,
        },
        {
            label: language === 'vi' ? 'Nhóm kỹ năng' : 'Skill Groups',
            value: String(stats.totalDomains || 0),
            icon: ShieldCheck,
            tone: 'emerald' as const,
        },
        {
            label: language === 'vi' ? 'Có thể tìm' : 'Searchable',
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
                    ? 'Chọn đúng kỹ năng cho việc bạn cần làm — CVF sẽ hướng dẫn từng bước và tạo bản mô tả rõ ràng.'
                    : 'Choose the right skill for the job — CVF guides the steps and creates a clear working brief.'}
                actions={(
                    <Link
                        href="/marketplace"
                        className="cvf-control inline-flex items-center rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                    >
                        {language === 'vi' ? 'Mở kho mở rộng' : 'Browse add-ons'}
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
                                    {language === 'vi' ? 'Sẵn sàng để dùng' : 'Ready to use'}
                                </h2>
                                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-white/55">
                                    {language === 'vi'
                                        ? 'Mỗi kỹ năng đều có phần hướng dẫn rõ ràng. Chọn kỹ năng, trả lời vài câu hỏi chính, rồi nhận bản mô tả công việc.'
                                        : 'Each skill includes clear guidance. Pick a skill, answer a few key questions, then get a working brief.'}
                                </p>
                            </div>
                            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/45">
                                {language === 'vi'
                                        ? 'Danh sách này chỉ giữ những kỹ năng dùng được ngay.'
                                        : 'This list keeps only skills that are ready to use.'}
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

                {isIntentFirstEnabled() && (
                    <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/60 p-4 text-sm dark:border-indigo-500/20 dark:bg-indigo-500/[0.07]">
                        <span className="text-indigo-700 dark:text-indigo-300">
                            {language === 'vi'
                                ? '💡 Chưa biết bắt đầu từ đâu? '
                                : '💡 Not sure where to start? '}
                        </span>
                        <Link href="/home" className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-400">
                            {language === 'vi'
                                ? 'Mô tả mục tiêu để CVF tự định tuyến →'
                                : 'Describe your goal and let CVF route you →'}
                        </Link>
                    </div>
                )}

                <section className="cvf-surface cvf-density-section rounded-[32px] border border-slate-200/80 bg-white p-4 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none sm:p-6">
                    <SkillLibrary />
                </section>
            </div>
        </div>
    );
}
