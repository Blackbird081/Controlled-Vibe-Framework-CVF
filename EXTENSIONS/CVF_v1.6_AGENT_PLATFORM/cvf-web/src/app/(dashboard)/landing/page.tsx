'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardList, LayoutGrid, Rocket, Shield, Sparkles } from 'lucide-react';
import { SurfaceTopBar } from '@/components';
import { useLanguage } from '@/lib/i18n';

const STEP_COPY = {
    vi: [
        {
            title: 'Chọn template',
            desc: 'Bắt đầu từ một front door rõ ràng, không cần nhớ prompt hay quy trình AI phức tạp.',
            icon: ClipboardList,
        },
        {
            title: 'Điền form đơn giản',
            desc: 'Mô tả mục tiêu bằng ngôn ngữ tự nhiên và để CVF khóa lại intent phù hợp.',
            icon: LayoutGrid,
        },
        {
            title: 'Nhận kết quả đã govern',
            desc: 'Từ spec đến output cuối cùng, mọi bước đều giữ đúng luồng data và governance hiện có.',
            icon: Rocket,
        },
    ],
    en: [
        {
            title: 'Pick the right template',
            desc: 'Start from one clear front door instead of memorizing prompts or complex AI workflows.',
            icon: ClipboardList,
        },
        {
            title: 'Fill a simple form',
            desc: 'Describe the outcome in plain language and let CVF lock the right intent path.',
            icon: LayoutGrid,
        },
        {
            title: 'Get governed results',
            desc: 'From spec creation to final output, the existing data flow and governance stay intact.',
            icon: Rocket,
        },
    ],
};

const FEATURE_COPY = {
    vi: [
        'Không đổi logic, chỉ nâng trải nghiệm',
        'Template-driven, form-first workflow',
        'Governance và AI safety luôn hiện diện',
        'Song ngữ Việt - Anh trên cùng workspace',
    ],
    en: [
        'No logic rewrite, only a stronger experience',
        'Template-driven, form-first workflow',
        'Governance and AI safety stay visible',
        'Bilingual Vietnamese - English workspace',
    ],
};

export default function LandingPage() {
    const { language } = useLanguage();
    const steps = STEP_COPY[language];
    const features = FEATURE_COPY[language];

    return (
        <div className="pb-10">
            <SurfaceTopBar
                title={language === 'vi' ? 'About CVF' : 'About CVF'}
                subtitle={language === 'vi'
                    ? 'Một landing page nằm trong app shell, không đẩy người dùng ra ngoài luồng làm việc.'
                    : 'An in-app landing page that keeps people inside the working shell.'}
                actions={(
                    <Link
                        href="/home"
                        className="inline-flex items-center rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                    >
                        {language === 'vi' ? 'View Templates' : 'View Templates'}
                    </Link>
                )}
            />

            <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_38%),linear-gradient(135deg,_#f7f5ef,_#ffffff)] p-7 shadow-[0_20px_60px_-45px_rgba(79,70,229,0.4)] dark:border-white/[0.07] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(135deg,_#151926,_#0f1320)] dark:shadow-none sm:p-8">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                                <Sparkles size={14} />
                                {language === 'vi' ? 'Nền tảng AI cho mọi người' : 'AI platform for everyone'}
                            </span>
                            <h1 className="mt-6 max-w-3xl font-serif-display text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] text-slate-950 dark:text-white sm:text-6xl">
                                {language === 'vi' ? (
                                    <>
                                        Biến ý tưởng thành
                                        <br />
                                        <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                                            ứng dụng thực tế
                                        </span>
                                        <br />
                                        không cần viết code
                                    </>
                                ) : (
                                    <>
                                        Turn ideas into
                                        <br />
                                        <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                                            working products
                                        </span>
                                        <br />
                                        without writing code
                                    </>
                                )}
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-white/55">
                                {language === 'vi'
                                    ? 'CVF giúp người dùng đi từ template, form, governance đến kết quả cuối cùng trong một luồng rõ ràng và chuyên nghiệp.'
                                    : 'CVF guides people from templates, forms, and governance to final results in one polished workflow.'}
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href="/home"
                                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_-20px_rgba(79,70,229,0.75)] transition hover:brightness-110"
                                >
                                    {language === 'vi' ? 'Tạo app đầu tiên' : 'Create your first app'}
                                    <ArrowRight size={16} />
                                </Link>
                                <Link
                                    href="/help"
                                    className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/75 dark:hover:bg-white/[0.07]"
                                >
                                    {language === 'vi' ? 'Xem cách hoạt động' : 'See how it works'}
                                </Link>
                            </div>

                            <div className="mt-10 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
                                {[
                                    { value: '94', label: language === 'vi' ? 'Templates' : 'Templates' },
                                    { value: '12', label: language === 'vi' ? 'AI Skills' : 'AI Skills' },
                                    { value: '3', label: language === 'vi' ? 'Models' : 'Models' },
                                    { value: '10K+', label: language === 'vi' ? 'Teams' : 'Teams' },
                                ].map((stat) => (
                                    <div key={stat.label}>
                                        <div className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                                            {stat.value}
                                        </div>
                                        <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400 dark:text-white/35">
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_34px_-28px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#161b28] dark:shadow-none">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/[0.06]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
                                            V
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-950 dark:text-white">VibCode</div>
                                            <div className="text-xs text-slate-400 dark:text-white/35">CVF Front Door</div>
                                        </div>
                                    </div>
                                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                                </div>
                                <div className="space-y-4 pt-5">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-white/45">
                                        {language === 'vi' ? 'Mô tả mục tiêu bằng ngôn ngữ tự nhiên...' : 'Describe the outcome in plain language...'}
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-white/45">
                                        {language === 'vi' ? 'CVF route đúng template + governance packet' : 'CVF routes the right template + governance packet'}
                                    </div>
                                    <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-center text-sm font-semibold text-white">
                                        {language === 'vi' ? 'Launch governed path' : 'Launch governed path'}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_12px_34px_-28px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#161b28] dark:shadow-none">
                                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                                    <Shield size={16} />
                                    {language === 'vi' ? 'App shell integrity' : 'App shell integrity'}
                                </div>
                                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-white/58">
                                    {features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-5 lg:grid-cols-3">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <div
                                key={step.title}
                                className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.28)] dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                                    <Icon size={20} />
                                </div>
                                <div className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-white/35">
                                    {language === 'vi' ? `Bước ${index + 1}` : `Step ${index + 1}`}
                                </div>
                                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                                    {step.title}
                                </h3>
                                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-white/58">
                                    {step.desc}
                                </p>
                            </div>
                        );
                    })}
                </section>
            </div>
        </div>
    );
}
