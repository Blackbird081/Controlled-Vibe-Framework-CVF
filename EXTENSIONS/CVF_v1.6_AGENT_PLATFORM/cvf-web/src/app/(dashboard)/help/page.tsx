'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, LifeBuoy, Rocket, Users } from 'lucide-react';
import { SurfaceTopBar } from '@/components';
import { HELP_CONTENT } from '@/data/help-content';
import { useLanguage } from '@/lib/i18n';

export default function HelpPage() {
    const { language } = useLanguage();
    const content = HELP_CONTENT[language];
    const [openIndex, setOpenIndex] = useState<number>(0);

    const supportCards = [
        { icon: BookOpen, title: content.features[0]?.title, desc: content.features[0]?.desc, href: content.features[0]?.link },
        { icon: Rocket, title: content.features[2]?.title, desc: content.features[2]?.desc, href: content.features[2]?.link },
        { icon: Users, title: content.features[5]?.title, desc: content.features[5]?.desc, href: content.features[5]?.link },
        { icon: LifeBuoy, title: content.features[6]?.title, desc: content.features[6]?.desc, href: content.features[6]?.link },
    ].filter(card => card.title && card.desc);

    return (
        <div className="pb-10">
            <SurfaceTopBar
                title={language === 'vi' ? 'Trung tâm trợ giúp' : 'Help Center'}
                subtitle={language === 'vi'
                    ? 'Giữ nội dung hướng dẫn hiện có nhưng trình bày lại thành một surface gọn, dễ đọc và dễ quay lại.'
                    : 'Keep the existing guidance content while presenting it in a cleaner, more readable support surface.'}
                actions={(
                    <Link
                        href="/docs"
                        className="cvf-control inline-flex items-center rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                    >
                        {language === 'vi' ? 'Mở docs' : 'Open docs'}
                    </Link>
                )}
            />

            <div className="space-y-8 px-4 py-6 sm:px-6">
                <section className="grid gap-5 md:grid-cols-2">
                    {supportCards.map((card) => {
                        const Icon = card.icon;
                        const body = (
                            <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_-38px_rgba(15,23,42,0.35)] transition hover:border-indigo-300 dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none dark:hover:border-indigo-400/30">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                                            {card.title}
                                        </h2>
                                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-white/58">
                                            {card.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );

                        return card.href ? (
                            <Link key={card.title} href={card.href} className="block">
                                {body}
                            </Link>
                        ) : (
                            <div key={card.title}>{body}</div>
                        );
                    })}
                </section>

                <section className="cvf-surface cvf-density-section rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none">
                    <div className="mb-5">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-white/35">
                            {language === 'vi' ? 'Câu hỏi thường gặp' : 'Frequently asked'}
                        </div>
                        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                            {language === 'vi' ? 'Những câu hỏi quan trọng nhất' : 'The most important questions'}
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {content.steps.map((step, index) => {
                            const isOpen = openIndex === index;
                            return (
                                <div
                                    key={step.number}
                                    className="overflow-hidden rounded-[24px] border border-slate-200 dark:border-white/[0.07]"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenIndex(isOpen ? -1 : index)}
                                    className="cvf-control flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                                    >
                                        <div>
                                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-white/35">
                                                {language === 'vi' ? `Bước ${step.number}` : `Step ${step.number}`}
                                            </div>
                                            <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                                                {step.title}
                                            </div>
                                        </div>
                                        <span className="text-slate-400">{isOpen ? '−' : '+'}</span>
                                    </button>
                                    {isOpen && (
                                    <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600 dark:border-white/[0.07] dark:bg-[#10131d] dark:text-white/58">
                                            <p>{step.content}</p>
                                            {step.example && (
                                                <div className="mt-4 rounded-2xl bg-[#0d0f1a] px-4 py-3 font-mono text-sm">
                                                    <div className="text-emerald-400">✅ {step.example.correct}</div>
                                                    <div className="mt-2 text-rose-400">❌ {step.example.wrong}</div>
                                                </div>
                                            )}
                                            {step.categories && (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {step.categories.map(category => (
                                                        <span key={category} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                                                            {category}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {step.fields && (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {step.fields.map(field => (
                                                        <span key={field} className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/[0.08] dark:text-white/70">
                                                            {field}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {step.steps && (
                                                <ol className="mt-4 space-y-2">
                                                    {step.steps.map((item) => (
                                                        <li key={item}>{item}</li>
                                                    ))}
                                                </ol>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="grid gap-5 lg:grid-cols-2">
                    <div className="cvf-surface cvf-density-section rounded-[28px] border border-emerald-200/80 bg-emerald-50 p-6 dark:border-emerald-500/20 dark:bg-emerald-500/8">
                        <h3 className="text-2xl font-semibold tracking-[-0.03em] text-emerald-950 dark:text-emerald-100">
                            {language === 'vi' ? 'Nên làm' : 'Do'}
                        </h3>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-emerald-900 dark:text-emerald-100/80">
                            {content.doList.map((item) => (
                                <li key={item} className="flex gap-3">
                                    <span>✓</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="cvf-surface cvf-density-section rounded-[28px] border border-rose-200/80 bg-rose-50 p-6 dark:border-rose-500/20 dark:bg-rose-500/8">
                        <h3 className="text-2xl font-semibold tracking-[-0.03em] text-rose-950 dark:text-rose-100">
                            {language === 'vi' ? 'Không nên' : 'Don’t'}
                        </h3>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-rose-900 dark:text-rose-100/80">
                            {content.dontList.map((item) => (
                                <li key={item} className="flex gap-3">
                                    <span>✕</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
}
