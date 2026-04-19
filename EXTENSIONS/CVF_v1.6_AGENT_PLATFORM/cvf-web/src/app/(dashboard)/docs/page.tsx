'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SurfaceTopBar } from '@/components';
import { DOCS } from '@/data/docs-data';
import { useLanguage } from '@/lib/i18n';

export default function DocsPage() {
    const { language } = useLanguage();
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const externalSkillGroups = [
        {
            icon: '🛡️',
            title: { vi: 'An toàn & Alignment', en: 'Safety & Alignment' },
            skills: 'Constitutional AI, LlamaGuard, NeMo Guardrails, Prompt Guard',
            count: 4,
            use: { vi: 'Tham khảo cho kernel contamination guard', en: 'Reference for kernel contamination guard' },
            url: 'https://github.com/Orchestra-Research/AI-Research-SKILLs/tree/main/07-safety-alignment',
            color: 'from-red-500 to-orange-500',
        },
        {
            icon: '🤖',
            title: { vi: 'Agents', en: 'Agents' },
            skills: 'LangChain, LlamaIndex, CrewAI, AutoGPT',
            count: 4,
            use: { vi: 'Patterns cho Multi-Agent workflow', en: 'Patterns for Multi-Agent workflow' },
            url: 'https://github.com/Orchestra-Research/AI-Research-SKILLs/tree/main/14-agents',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: '🔍',
            title: { vi: 'RAG', en: 'RAG' },
            skills: 'Chroma, FAISS, Pinecone, Qdrant, Sentence Transformers',
            count: 5,
            use: { vi: 'Vector DB implementation guides', en: 'Vector DB implementation guides' },
            url: 'https://github.com/Orchestra-Research/AI-Research-SKILLs/tree/main/15-rag',
            color: 'from-emerald-500 to-teal-500',
        },
        {
            icon: '🎯',
            title: { vi: 'Prompt Engineering', en: 'Prompt Engineering' },
            skills: 'DSPy, Instructor, Guidance, Outlines',
            count: 4,
            use: { vi: 'Structured output patterns', en: 'Structured output patterns' },
            url: 'https://github.com/Orchestra-Research/AI-Research-SKILLs/tree/main/16-prompt-engineering',
            color: 'from-purple-500 to-pink-500',
        },
        {
            icon: '📊',
            title: { vi: 'Đánh giá', en: 'Evaluation' },
            skills: 'lm-eval-harness, BigCode, NeMo Evaluator',
            count: 3,
            use: { vi: 'Benchmark implementation', en: 'Benchmark implementation' },
            url: 'https://github.com/Orchestra-Research/AI-Research-SKILLs/tree/main/11-evaluation',
            color: 'from-amber-500 to-yellow-500',
        },
    ];

    const filteredDocs = activeCategory
        ? DOCS.filter(category => category.id === activeCategory)
        : DOCS;

    return (
        <div className="pb-10">
            <SurfaceTopBar
                title={language === 'vi' ? 'Tài liệu' : 'Documentation'}
                subtitle={language === 'vi'
                    ? 'Giữ nguyên doc metadata và slug routing, nhưng trình bày lại thành một thư viện nội bộ đồng nhất với app shell.'
                    : 'Keep the same doc metadata and slug routing while presenting it as a stronger in-shell library.'}
                actions={(
                    <Link
                        href="/help"
                        className="cvf-control inline-flex items-center rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                    >
                        {language === 'vi' ? 'Mở trợ giúp' : 'Open help'}
                    </Link>
                )}
            />

            <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6">
                <section className="cvf-surface cvf-density-section rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_38%),linear-gradient(135deg,_#f8fafc,_#ffffff)] p-6 shadow-[0_20px_55px_-45px_rgba(79,70,229,0.35)] dark:border-white/[0.07] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_36%),linear-gradient(135deg,_#131827,_#10131d)] dark:shadow-none sm:p-7">
                    <div className="max-w-3xl">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-white/35">
                            {language === 'vi' ? 'Kho tri thức' : 'Knowledge base'}
                        </div>
                        <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                            {language === 'vi' ? 'Một thư viện tài liệu rõ ràng và dễ quét' : 'A documentation library that is easy to scan'}
                        </h2>
                        <p className="mt-3 text-base leading-7 text-slate-600 dark:text-white/55">
                            {language === 'vi'
                                ? 'Mỗi category, doc card và CTA vẫn dùng chính metadata đang có. Chỉ thay đổi hierarchy và polish.'
                                : 'Every category, doc card, and CTA still uses the same metadata. Only the hierarchy and polish change.'}
                        </p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <button
                            onClick={() => setActiveCategory(null)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                activeCategory === null
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-white/[0.04] dark:text-white/60 dark:hover:bg-white/[0.07]'
                            }`}
                        >
                            {language === 'vi' ? 'Tất cả' : 'All'}
                        </button>
                        {DOCS.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                    activeCategory === category.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-white/[0.04] dark:text-white/60 dark:hover:bg-white/[0.07]'
                                }`}
                            >
                                {category.icon} {category.label[language]}
                            </button>
                        ))}
                    </div>
                </section>

                {filteredDocs.map((category) => (
                    <section
                        key={category.id}
                        className="cvf-surface cvf-density-section rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none"
                    >
                        <div className="mb-6 flex items-center gap-3">
                            <span className="text-3xl">{category.icon}</span>
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-white/35">
                                    {language === 'vi' ? 'Nhóm' : 'Category'}
                                </div>
                                <h3 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                                    {category.label[language]}
                                </h3>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {category.items.map((item) => (
                                <Link
                                    key={item.slug}
                                    href={`/docs/${item.slug}`}
                                    className="group rounded-[28px] border border-slate-200/80 bg-slate-50 p-5 transition hover:border-indigo-300 hover:bg-white dark:border-white/[0.07] dark:bg-[#10131d] dark:hover:border-indigo-400/30 dark:hover:bg-white/[0.04]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-3xl">{item.icon}</span>
                                        {item.tag && (
                                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                                                {item.tag[language]}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-slate-950 transition group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
                                        {item.title[language]}
                                    </h4>
                                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-white/58">
                                        {item.desc[language]}
                                    </p>
                                    <div className="mt-5 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                                        {language === 'vi' ? 'Đọc tiếp' : 'Read next'} →
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}

                <section className="cvf-surface cvf-density-section rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none">
                    <div className="mb-6">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-white/35">
                            {language === 'vi' ? 'Tham khảo ngoài' : 'External reference'}
                        </div>
                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                            {language === 'vi' ? 'Thư viện Skills Tham khảo' : 'External Skills Reference Library'}
                        </h3>
                        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-white/58">
                            {language === 'vi'
                                ? '85 skills từ Orchestra Research — chỉ dùng tham khảo patterns & implementation. Không tích hợp trực tiếp vào CVF.'
                                : '85 skills from Orchestra Research — reference only for patterns & implementation. Not directly integrated into CVF.'}
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {externalSkillGroups.map((group) => (
                            <a
                                key={group.title.en}
                                href={group.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group rounded-[28px] border border-slate-200/80 bg-slate-50 p-5 transition hover:border-indigo-300 hover:bg-white dark:border-white/[0.07] dark:bg-[#10131d] dark:hover:border-indigo-400/30 dark:hover:bg-white/[0.04]"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{group.icon}</span>
                                    <div>
                                        <h4 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 transition group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
                                            {group.title[language]}
                                        </h4>
                                        <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400 dark:text-white/35">
                                            {group.count} skills
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-4 text-xs font-medium text-slate-500 dark:text-white/40">
                                    {group.skills}
                                </p>
                                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-white/58">
                                    → {group.use[language]}
                                </p>
                                <div className={`mt-5 h-0.5 w-0 rounded-full bg-gradient-to-r ${group.color} transition-all duration-300 group-hover:w-full`} />
                            </a>
                        ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 dark:text-white/35">
                        <span>
                            {language === 'vi'
                                ? 'License: MIT (Orchestra) — khác với CVF (CC BY-NC-ND 4.0). Chỉ tham khảo.'
                                : 'License: MIT (Orchestra) — differs from CVF (CC BY-NC-ND 4.0). Reference only.'}
                        </span>
                        <a
                            href="https://github.com/Orchestra-Research/AI-Research-SKILLs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-white/[0.06] dark:text-white/65 dark:hover:bg-white/[0.1]"
                        >
                            {language === 'vi' ? 'Xem toàn bộ 85 skills →' : 'View all 85 skills →'}
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}
