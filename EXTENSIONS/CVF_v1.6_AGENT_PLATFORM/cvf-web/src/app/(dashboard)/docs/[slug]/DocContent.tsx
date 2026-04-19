'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { SurfaceTopBar } from '@/components';
import { useLanguage } from '@/lib/i18n';
import type { Lang } from '@/data/docs-data';

interface DocContentProps {
    slug: string;
    contentEn: string;
    contentVi: string;
    hasContent: boolean;
    meta: {
        title: Record<Lang, string>;
        category: Record<Lang, string>;
        categoryIcon: string;
    } | null;
}

export function DocContent({ slug, contentEn, contentVi, hasContent, meta }: DocContentProps) {
    const { language } = useLanguage();
    const content = (language === 'vi' ? contentVi : contentEn)
        || (language === 'vi' ? contentEn : contentVi);

    return (
        <div className="pb-10">
            <SurfaceTopBar
                title={meta ? meta.title[language] : (language === 'vi' ? 'Tài liệu' : 'Documentation')}
                subtitle={meta
                    ? `${meta.categoryIcon} ${meta.category[language]}`
                    : (language === 'vi' ? 'Không tìm thấy metadata cho tài liệu này.' : 'No metadata found for this document.')}
                actions={(
                    <Link
                        href="/docs"
                        className="inline-flex items-center rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                    >
                        {language === 'vi' ? '← Tất cả tài liệu' : '← All Docs'}
                    </Link>
                )}
            />

            <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
                {!hasContent ? (
                    <div className="rounded-[32px] border border-slate-200/80 bg-white px-6 py-16 text-center shadow-[0_20px_55px_-45px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none">
                        <div className="text-6xl">📄</div>
                        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                            {language === 'vi' ? 'Không tìm thấy tài liệu' : 'Document not found'}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-white/58">
                            {language === 'vi'
                                ? `Slug "${slug}" không tồn tại.`
                                : `Slug "${slug}" does not exist.`}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="rounded-[28px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_34%),linear-gradient(135deg,_#f8fafc,_#ffffff)] p-6 shadow-[0_20px_55px_-45px_rgba(79,70,229,0.3)] dark:border-white/[0.07] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_36%),linear-gradient(135deg,_#131827,_#10131d)] dark:shadow-none">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-white/35">
                                {language === 'vi' ? 'Doc detail' : 'Doc detail'}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-white/45">
                                <Link href="/docs" className="font-semibold text-indigo-600 dark:text-indigo-300">
                                    {language === 'vi' ? 'Docs' : 'Docs'}
                                </Link>
                                <span>/</span>
                                <span>{meta?.category[language] ?? slug}</span>
                            </div>
                        </div>

                        <article className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none sm:p-8">
                            <div className="prose prose-lg max-w-none prose-headings:scroll-mt-20 prose-headings:tracking-[-0.03em] prose-h1:text-4xl prose-h1:font-semibold prose-h1:text-slate-950 prose-h2:mt-12 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-3 prose-h2:text-2xl prose-h2:font-semibold prose-h2:text-slate-900 prose-h3:text-xl prose-h3:font-semibold prose-h3:text-slate-900 prose-p:leading-8 prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-950 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-pink-600 prose-pre:rounded-2xl prose-pre:border prose-pre:border-slate-800 prose-pre:bg-[#0d0f1a] prose-pre:text-slate-100 prose-blockquote:rounded-r-2xl prose-blockquote:border-l-indigo-500 prose-blockquote:bg-indigo-50 prose-blockquote:px-5 prose-blockquote:py-2 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline dark:prose-invert dark:prose-h1:text-white dark:prose-h2:border-white/[0.08] dark:prose-h2:text-white dark:prose-h3:text-white dark:prose-p:text-white/70 dark:prose-li:text-white/70 dark:prose-strong:text-white dark:prose-code:bg-white/[0.06] dark:prose-code:text-pink-300 dark:prose-blockquote:bg-indigo-500/10">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                        a: ({ href, children, ...props }) => {
                                            if (href?.startsWith('#')) {
                                                return <a href={href} {...props}>{children}</a>;
                                            }
                                            if (href?.startsWith('http')) {
                                                return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                                            }
                                            return <span {...props}>{children}</span>;
                                        },
                                        table: ({ children, ...props }) => (
                                            <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                                                <table {...props}>{children}</table>
                                            </div>
                                        ),
                                    }}
                                >
                                    {content}
                                </ReactMarkdown>
                            </div>
                        </article>
                    </>
                )}
            </div>
        </div>
    );
}
